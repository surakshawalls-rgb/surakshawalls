// src/app/services/sales.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SaleTransaction {
  id: string;
  date: string;
  client_id: string;
  product_name: string;
  product_variant: string | null;
  quantity: number;
  rate_per_unit: number;
  total_amount: number;
  payment_type: 'full' | 'partial' | 'credit';
  paid_amount: number;
  due_amount: number;
  collected_by_partner_id: string | null;
  deposited_to_firm: boolean;
  invoice_number: string | null;
  delivery_status: 'pending' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface SaleData {
  date: string;
  client_id: string;
  product_name: string;
  product_variant: string | null;
  quantity: number;
  rate_per_unit: number;
  payment_type: 'full' | 'partial' | 'credit';
  paid_amount: number;
  collected_by_partner_id?: string;
  deposited_to_firm: boolean;
  invoice_number?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class SalesService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Create sale transaction
   */
  async createSale(saleData: SaleData): Promise<{success: boolean, sale?: SaleTransaction, error?: string}> {
    try {
      // 1. Insert sale transaction
      const { data: sale, error: saleError } = await this.supabase.supabase
        .from('sales_transactions')
        .insert({
          date: saleData.date,
          client_id: saleData.client_id,
          product_name: saleData.product_name,
          product_variant: saleData.product_variant,
          quantity: saleData.quantity,
          rate_per_unit: saleData.rate_per_unit,
          payment_type: saleData.payment_type,
          paid_amount: saleData.paid_amount,
          collected_by_partner_id: saleData.collected_by_partner_id,
          deposited_to_firm: saleData.deposited_to_firm,
          invoice_number: saleData.invoice_number,
          delivery_status: 'pending',
          notes: saleData.notes
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Update client ledger
      const totalAmount = saleData.quantity * saleData.rate_per_unit;
      
      // Fetch current client data
      const { data: clientData } = await this.supabase.supabase
        .from('client_ledger')
        .select('total_billed, total_paid')
        .eq('id', saleData.client_id)
        .single();
      
      if (clientData) {
        await this.supabase.supabase
          .from('client_ledger')
          .update({
            total_billed: clientData.total_billed + totalAmount,
            total_paid: clientData.total_paid + saleData.paid_amount,
            last_purchase_date: saleData.date
          })
          .eq('id', saleData.client_id);
      }

      // 3. Deduct from finished goods inventory
      await this.supabase.supabase.rpc('increment_finished_goods', {
        p_product_name: saleData.product_name,
        p_product_variant: saleData.product_variant,
        p_quantity: -saleData.quantity // Negative to deduct
      });

      // 4. Record in firm cash ledger (if deposited)
      if (saleData.deposited_to_firm && saleData.paid_amount > 0) {
        await this.supabase.supabase
          .from('firm_cash_ledger')
          .insert({
            date: saleData.date,
            type: 'receipt',
            amount: saleData.paid_amount,
            category: 'sales',
            partner_id: saleData.collected_by_partner_id,
            deposited_to_firm: true,
            description: `Sale to client - Invoice ${saleData.invoice_number || 'N/A'}`,
            reference_id: sale.id
          });
      }

      return { success: true, sale };

    } catch (error: any) {
      console.error('[SalesService] createSale error:', error);
      return { success: false, error: error.message || 'Sale creation failed' };
    }
  }

  /**
   * Get sales transactions
   */
  async getSales(startDate?: string, endDate?: string): Promise<SaleTransaction[]> {
    let query = this.supabase.supabase
      .from('sales_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[SalesService] getSales error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(saleId: string, status: 'pending' | 'delivered' | 'cancelled'): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('sales_transactions')
        .update({ delivery_status: status })
        .eq('id', saleId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('[SalesService] updateDeliveryStatus error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record payment for sale
   */
  async recordPayment(saleId: string, amount: number, date: string, depositedToFirm: boolean): Promise<{success: boolean, error?: string}> {
    try {
      // 1. Get sale details
      const { data: sale } = await this.supabase.supabase
        .from('sales_transactions')
        .select('*, client_ledger(client_name)')
        .eq('id', saleId)
        .single();

      if (!sale) throw new Error('Sale not found');

      // 2. Update client ledger
      const { data: clientData } = await this.supabase.supabase
        .from('client_ledger')
        .select('total_paid, outstanding')
        .eq('id', sale.client_id)
        .single();
      
      if (clientData) {
        await this.supabase.supabase
          .from('client_ledger')
          .update({
            total_paid: clientData.total_paid + amount,
            last_payment_date: date
          })
          .eq('id', sale.client_id);
      }

      // 3. Record in firm cash (if deposited)
      if (depositedToFirm) {
        await this.supabase.supabase
          .from('firm_cash_ledger')
          .insert({
            date,
            type: 'receipt',
            amount,
            category: 'sales',
            deposited_to_firm: true,
            description: `Payment from ${sale.client_ledger?.client_name} - Invoice ${sale.invoice_number}`,
            reference_id: saleId
          });
      }

      return { success: true };
    } catch (error: any) {
      console.error('[SalesService] recordPayment error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sales summary
   */
  async getSalesSummary(startDate: string, endDate: string) {
    const sales = await this.getSales(startDate, endDate);

    return {
      total_sales: sales.length,
      total_quantity: sales.reduce((sum, s) => sum + s.quantity, 0),
      total_amount: sales.reduce((sum, s) => sum + s.total_amount, 0),
      total_paid: sales.reduce((sum, s) => sum + s.paid_amount, 0),
      total_due: sales.reduce((sum, s) => sum + s.due_amount, 0),
      cash_sales: sales.filter(s => s.payment_type === 'full').length,
      credit_sales: sales.filter(s => s.payment_type === 'credit').length
    };
  }
}
