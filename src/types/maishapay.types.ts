export interface MaishapayConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: 'mobile_money' | 'card' | 'crypto';
  provider?: 'airtel' | 'mpesa' | 'orange';
  reference: string;
  description?: string;
  redirectUrl?: string;
  webhookUrl?: string;
}

export interface TransferRequest {
  recipientPhone: string;
  amount: number;
  currency: string;
  reason: string;
  reference: string;
}

export interface AirtimeRequest {
  phone: string;
  amount: number;
  operator: string;
  country: string;
}

export interface TransactionStatus {
  transactionId: string;
  status: 'pending' | 'success' | 'failed' | 'processing';
  amount: number;
  currency: string;
  customerPhone: string;
  maishapayReference?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
  paymentUrl?: string;
}
