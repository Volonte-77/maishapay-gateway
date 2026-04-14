import axios, { AxiosInstance } from 'axios';
// importation de mes interfaces deja definies dans le fichier de types pour les utiliser dans mon service maishapay
import { MaishapayConfig, PaymentRequest, TransferRequest, AirtimeRequest } from '../types/maishapay.types';

export class MaishapayService {
  private client: AxiosInstance;
  private config: MaishapayConfig;
  // petit constructeur de la class MaishapayService qui prend en parametre une configuration de type MaishapayConfig pour initialiser le client axios avec les bonnes informations de baseUrl et apiKey pour les requettes a l'API de maishapay
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
 // methode asynchrone pour creer les differents types de payement en fonction de la requette qui est de type PaymentRequest et qui retourne une promesse de n'importe quelle reponse de l'API de maishapay ou une erreur si la creation du payement echoue
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
// methode pour le transfert de fonds qui prend en parametre une requette de type TransferRequest et qui retourne une promesse de n'importe quelle reponse de l'API de maishapay ou une erreur si le transfert echoue
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
// methode pour recuperer le solde du compte maishapay qui retourne une promesse de n'importe quelle reponse de l'API de maishapay ou une erreur si la recuperation du solde echoue
  async getBalance(): Promise<any> {
    try {
      const response = await this.client.get('/balance');
      return response.data;
    } catch (error: any) {
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }
  // une methode pour acheter de l'airtime qui prend en parametre une requette de type AirtimeRequest et qui retourne une promesse de n'importe quelle reponse de l'API de maishapay ou une erreur si l'achat d'airtime echoue
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
