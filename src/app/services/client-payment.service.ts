import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ClientPaymentRecord {
  id?: string;
  client_id: string;
  sales_transaction_id?: string;
  payment_date: string;
  amount_paid: number;
  payment_mode: 'cash' | 'upi' | 'cheque' | 'bank_transfer';
  cheque_number?: string;
  upi_transaction_id?: string;
  collected_by_partner_id?: string;
  deposited_to_firm: boolean;
  notes?: string;
  created_at?: string;
}

export interface SalesTransactionWithPayments {
  sales_id: string;
  sale_date: string;
  client_id: string;
  client_name: string;
  total_amount: number;
  paid_initially: number;
  total_paid_later: number;
  current_outstanding: number;
  payment_history: ClientPaymentRecord[];
}

export interface ClientOutstanding {
  client_id: string;
  client_name: string;
  phone: string;
  total_sales: number;
  total_paid: number;
  outstanding: number;
  sales_transactions: SalesTransactionWithPayments[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientPaymentService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all clients with outstanding payments
   */
  async getClientsWithOutstanding(): Promise<ClientOutstanding[]> {
    try {
      // Get all sales transactions
      const { data: sales, error: salesError } = await this.supabase.supabase
        .from('sales_transactions')
        .select(`
          id,
          date,
          client_id,
          total_amount,
          paid_amount,
          client_ledger!inner(id, client_name, phone)
        `)
        .order('date', { ascending: false });

      if (salesError) throw salesError;

      // Get all subsequent payments
      const { data: payments, error: paymentsError } = await this.supabase.supabase
        .from('client_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Group by client
      const clientMap = new Map<string, ClientOutstanding>();

      sales?.forEach((sale: any) => {
        const clientId = sale.client_id;
        const client = sale.client_ledger;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: client.client_name,
            phone: client.phone,
            total_sales: 0,
            total_paid: 0,
            outstanding: 0,
            sales_transactions: []
          });
        }

        // Calculate payments for this sale
        const salePayments = payments?.filter((p: any) => p.sales_transaction_id === sale.id) || [];
        const totalPaidLater = salePayments.reduce((sum: number, p: any) => sum + p.amount_paid, 0);
        const currentOutstanding = sale.total_amount - sale.paid_amount - totalPaidLater;

        const clientData = clientMap.get(clientId)!;
        clientData.total_sales += sale.total_amount;
        clientData.total_paid += sale.paid_amount + totalPaidLater;
        clientData.outstanding += currentOutstanding;

        if (currentOutstanding > 0) {
          clientData.sales_transactions.push({
            sales_id: sale.id,
            sale_date: sale.date,
            client_id: clientId,
            client_name: client.client_name,
            total_amount: sale.total_amount,
            paid_initially: sale.paid_amount,
            total_paid_later: totalPaidLater,
            current_outstanding: currentOutstanding,
            payment_history: salePayments
          });
        }
      });

      // Filter only clients with outstanding
      return Array.from(clientMap.values()).filter(c => c.outstanding > 0);
    } catch (error) {
      console.error('Error getting clients with outstanding:', error);
      throw error;
    }
  }

  /**
   * Record a payment from client
   */
  async recordPayment(payment: ClientPaymentRecord): Promise<{ success: boolean; error?: string }> {
    try {
      // If linked to a sales transaction, validate outstanding
      if (payment.sales_transaction_id) {
        const { data: sale, error: saleError } = await this.supabase.supabase
          .from('sales_transactions')
          .select('id, total_amount, paid_amount, client_id')
          .eq('id', payment.sales_transaction_id)
          .single();

        if (saleError) throw saleError;

        // Calculate current outstanding
        const { data: existingPayments } = await this.supabase.supabase
          .from('client_payments')
          .select('amount_paid')
          .eq('sales_transaction_id', payment.sales_transaction_id);

        const totalPaidLater = existingPayments?.reduce((sum: number, p: any) => sum + p.amount_paid, 0) || 0;
        const currentOutstanding = sale.total_amount - sale.paid_amount - totalPaidLater;

        if (payment.amount_paid > currentOutstanding) {
          return {
            success: false,
            error: `Payment amount ₹${payment.amount_paid} exceeds outstanding ₹${currentOutstanding}`
          };
        }
      }

      // Insert payment record
      const { error: insertError } = await this.supabase.supabase
        .from('client_payments')
        .insert([{
          client_id: payment.client_id,
          sales_transaction_id: payment.sales_transaction_id || null,
          payment_date: payment.payment_date,
          amount_paid: payment.amount_paid,
          payment_mode: payment.payment_mode,
          cheque_number: payment.cheque_number,
          upi_transaction_id: payment.upi_transaction_id,
          collected_by_partner_id: payment.collected_by_partner_id || null,
          deposited_to_firm: payment.deposited_to_firm,
          notes: payment.notes
        }]);

      if (insertError) throw insertError;

      // Update client outstanding
      const { data: client } = await this.supabase.supabase
        .from('client_ledger')
        .select('outstanding')
        .eq('id', payment.client_id)
        .single();

      if (client) {
        await this.supabase.supabase
          .from('client_ledger')
          .update({ outstanding: Math.max(0, client.outstanding - payment.amount_paid) })
          .eq('id', payment.client_id);
      }

      // Record in firm_cash_ledger (income)
      const collectedByName = payment.collected_by_partner_id ? 
        await this.getPartnerName(payment.collected_by_partner_id) : 'Firm';

      await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert([{
          transaction_date: payment.payment_date,
          transaction_type: 'income',
          category: 'sales_payment',
          amount: payment.amount_paid,
          partner_id: payment.deposited_to_firm ? null : payment.collected_by_partner_id,
          description: `Payment received from client (Collected by ${collectedByName}, Mode: ${payment.payment_mode})${payment.notes ? ' - ' + payment.notes : ''}`
        }]);

      return { success: true };
    } catch (error) {
      console.error('Error recording client payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get payment history for a specific sale
   */
  async getPaymentHistory(salesTransactionId: string): Promise<ClientPaymentRecord[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('client_payments')
        .select(`
          *,
          partner_master(name)
        `)
        .eq('sales_transaction_id', salesTransactionId)
        .order('payment_date', { ascending: false});

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Get all payments from a client
   */
  async getClientPaymentHistory(clientId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('client_payments')
        .select(`
          *,
          sales_transactions(date, total_amount, paid_amount),
          partner_master(name)
        `)
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting client payment history:', error);
      return [];
    }
  }

  /**
   * Clear all outstanding for a sale
   */
  async clearOutstanding(
    salesTransactionId: string,
    clientId: string,
    collectedByPartnerId: string | null,
    paymentDate: string,
    paymentMode: 'cash' | 'upi' | 'cheque' | 'bank_transfer',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current outstanding
      const { data: sale } = await this.supabase.supabase
        .from('sales_transactions')
        .select('total_amount, paid_amount')
        .eq('id', salesTransactionId)
        .single();

      if (!sale) {
        return { success: false, error: 'Sale not found' };
      }

      const { data: existingPayments } = await this.supabase.supabase
        .from('client_payments')
        .select('amount_paid')
        .eq('sales_transaction_id', salesTransactionId);

      const totalPaidLater = existingPayments?.reduce((sum: number, p: any) => sum + p.amount_paid, 0) || 0;
      const outstanding = sale.total_amount - sale.paid_amount - totalPaidLater;

      if (outstanding <= 0) {
        return { success: false, error: 'No outstanding amount' };
      }

      // Record full payment
      return await this.recordPayment({
        client_id: clientId,
        sales_transaction_id: salesTransactionId,
        payment_date: paymentDate,
        amount_paid: outstanding,
        payment_mode: paymentMode,
        collected_by_partner_id: collectedByPartnerId || undefined,
        deposited_to_firm: true,
        notes: notes || 'Full outstanding cleared'
      });
    } catch (error) {
      console.error('Error clearing outstanding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get client summary
   */
  async getClientSummary(clientId: string): Promise<{
    total_sales: number;
    total_paid: number;
    outstanding: number;
  }> {
    try {
      const { data: sales } = await this.supabase.supabase
        .from('sales_transactions')
        .select('total_amount, paid_amount')
        .eq('client_id', clientId);

      const { data: payments } = await this.supabase.supabase
        .from('client_payments')
        .select('amount_paid')
        .eq('client_id', clientId);

      const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const paidAtSale = sales?.reduce((sum, s) => sum + s.paid_amount, 0) || 0;
      const paidLater = payments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;

      return {
        total_sales: totalSales,
        total_paid: paidAtSale + paidLater,
        outstanding: totalSales - paidAtSale - paidLater
      };
    } catch (error) {
      console.error('Error getting client summary:', error);
      return { total_sales: 0, total_paid: 0, outstanding: 0 };
    }
  }

  /**
   * Helper: Get partner name
   */
  private async getPartnerName(partnerId: string): Promise<string> {
    try {
      const { data } = await this.supabase.supabase
        .from('partner_master')
        .select('name')
        .eq('partner_id', partnerId)
        .single();

      return data?.name || 'Unknown Partner';
    } catch (error) {
      return 'Unknown Partner';
    }
  }
}

