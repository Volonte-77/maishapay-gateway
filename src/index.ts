import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { MaishapayService } from './services/maishapay.service';
import { DatabaseService } from './services/database.service';
import { PaymentRequest, TransferRequest, AirtimeRequest } from './types/maishapay.types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const maishapayConfig = {
  apiKey: process.env.MAISHAPAY_API_KEY!,
  baseUrl: process.env.MAISHAPAY_BASE_URL || 'https://marchand.maishapay.online/api',
  webhookSecret: process.env.WEBHOOK_SECRET!,
};

const maishapayService = new MaishapayService(maishapayConfig);
const dbService = new DatabaseService(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_GATEWAY_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const generateTransactionId = (): string => {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

app.post('/api/payment', authenticate, async (req: Request, res: Response) => {
  try {
    const paymentData: PaymentRequest = req.body;
    const transactionId = generateTransactionId();

    await dbService.logTransaction({
      transactionId: transactionId,
      status: 'pending',
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerPhone: paymentData.customerPhone,
    });

    const maishapayResponse = await maishapayService.createPayment({
      ...paymentData,
      reference: transactionId,
    });

    await dbService.updateTransactionStatus(
      transactionId,
      'processing',
      maishapayResponse.reference
    );

    res.json({
      success: true,
      transactionId: transactionId,
      paymentUrl: maishapayResponse.payment_url,
      status: 'processing',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/transaction/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const localTransaction = await dbService.getTransaction(id);

    if (!localTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (localTransaction.maishapay_reference) {
      const maishapayStatus = await maishapayService.getTransactionStatus(
        localTransaction.maishapay_reference
      );

      await dbService.updateTransactionStatus(id, maishapayStatus.status);
      localTransaction.status = maishapayStatus.status;
    }

    res.json({
      success: true,
      transaction: localTransaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/transfer', authenticate, async (req: Request, res: Response) => {
  try {
    const transferData: TransferRequest = req.body;
    const transactionId = generateTransactionId();

    await dbService.logTransaction({
      transactionId: transactionId,
      status: 'pending',
      amount: transferData.amount,
      currency: transferData.currency,
      customerPhone: transferData.recipientPhone,
    });

    const response = await maishapayService.transferFunds({
      ...transferData,
      reference: transactionId,
    });

    await dbService.updateTransactionStatus(transactionId, 'success', response.reference);

    res.json({
      success: true,
      transactionId: transactionId,
      data: response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/airtime', authenticate, async (req: Request, res: Response) => {
  try {
    const airtimeData: AirtimeRequest = req.body;
    const transactionId = generateTransactionId();

    const response = await maishapayService.buyAirtime(airtimeData);

    await dbService.logTransaction({
      transactionId: transactionId,
      status: 'success',
      amount: airtimeData.amount,
      currency: 'USD',
      customerPhone: airtimeData.phone,
    });

    res.json({
      success: true,
      transactionId: transactionId,
      data: response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/balance', authenticate, async (req: Request, res: Response) => {
  try {
    const balance = await maishapayService.getBalance();
    res.json({
      success: true,
      balance: balance,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/webhook/maishapay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const payload = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', maishapayConfig.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { transaction_reference, status } = payload;

    if (transaction_reference) {
      await dbService.updateTransactionStatus(transaction_reference, status);
      console.log(`Transaction ${transaction_reference} updated to ${status}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/:customerId', authenticate, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const transactions = await dbService.getUserTransactions(customerId);

    const stats = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
      successfulTransactions: transactions.filter((t: any) => t.status === 'success').length,
      failedTransactions: transactions.filter((t: any) => t.status === 'failed').length,
      pendingTransactions: transactions.filter((t: any) => t.status === 'pending').length,
      transactionsByCurrency: transactions.reduce((acc: any, t: any) => {
        acc[t.currency] = (acc[t.currency] || 0) + t.amount;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      stats,
      recentTransactions: transactions.slice(0, 10),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
