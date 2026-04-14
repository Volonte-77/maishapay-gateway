import axios, { AxiosInstance } from 'axios';
// importation de mes interfaces deja definies dans le fichier de types pour les utiliser dans mon service maishapay
import { MaishapayConfig, PaymentRequest, TransferRequest, AirtimeRequest } from '../types/maishapay.types';

export class MaishapayService {
  private client: AxiosInstance;
  private config: MaishapayConfig;

  constructor(config: MaishapayConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    this.client.interceptors.request.use((request) => {
      console.log(`[Maishapay] ${request.method?.toUpperCase()} ${request.url}`);
      return request;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Maishapay Error]', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async createPayment(payment: PaymentRequest): Promise<any> {
    try {
      const payload = {
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.paymentMethod,
        customer: {
          phone: payment.customerPhone,
          email: payment.customerEmail,
          id: payment.customerId,
        },
        reference: payment.reference,
        description: payment.description,
        redirect_url: payment.redirectUrl,
        webhook_url: payment.webhookUrl,
        ...(payment.provider && { provider: payment.provider }),
      };

      const response = await this.client.post('/collection', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  async transferFunds(transfer: TransferRequest): Promise<any> {
    try {
      const response = await this.client.post('/b2c-transfer', {
        recipient_phone: transfer.recipientPhone,
        amount: transfer.amount,
        currency: transfer.currency,
        reason: transfer.reason,
        reference: transfer.reference,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  async getBalance(): Promise<any> {
    try {
      const response = await this.client.get('/balance');
      return response.data;
    } catch (error: any) {
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  async buyAirtime(airtime: AirtimeRequest): Promise<any> {
    try {
      const response = await this.client.post('/airtimes', {
        phone: airtime.phone,
        amount: airtime.amount,
        operator: airtime.operator,
        country: airtime.country,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Airtime purchase failed: ${error.message}`);
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const response = await this.client.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Transaction lookup failed: ${error.message}`);
    }
  }

  async payTV(subscriptionId: string, amount: number, provider: string, customerCode: string): Promise<any> {
    try {
      const response = await this.client.post('/paytv', {
        subscription_id: subscriptionId,
        amount: amount,
        provider: provider,
        customer_code: customerCode,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`TV payment failed: ${error.message}`);
    }
  }
}
