import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TransactionStatus } from '../types/maishapay.types';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async logTransaction(transaction: Partial<TransactionStatus>): Promise<any> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([{
        transaction_id: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        customer_phone: transaction.customerPhone,
        maishapay_reference: transaction.maishapayReference,
        error_message: transaction.errorMessage,
        created_at: new Date(),
        updated_at: new Date(),
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async updateTransactionStatus(transactionId: string, status: string, maishapayReference?: string): Promise<void> {
    const { error } = await this.supabase
      .from('transactions')
      .update({
        status: status,
        maishapay_reference: maishapayReference,
        updated_at: new Date(),
      })
      .eq('transaction_id', transactionId);

    if (error) throw error;
  }

  async getTransaction(transactionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTransactions(customerId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
