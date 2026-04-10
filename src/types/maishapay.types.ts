// une premiere interface pour recuperer en toute securite les api-keys de maichapay
export interface MaishapayConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

// une interface reutilisable pour organiser la methode payement approprie pour une requette donnee
export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: 'mobile_money' | 'card' | 'crypto';
  provider?: 'airtel' | 'mpesa' | 'orange';// un peu comme un fournisseur reseau mobile il est optionnel
  reference: string;
  description?: string;
  redirectUrl?: string;
  webhookUrl?: string;
}

// interface de transfert pour un quelconque montant a transferer
export interface TransferRequest {
  recipientPhone: string;
  amount: number;
  currency: string;
  reason: string;
  reference: string;
}

//pour les unites airtime en francais meme si bon dans notre cas on ne va apas l'utiliser
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
