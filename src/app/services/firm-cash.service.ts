// src/app/services/firm-cash.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FirmCashEntry {
  id: string;
  date: string;
  type: 'receipt' | 'payment' | 'deposit' | 'withdrawal';
  amount: number;
  category: 'sales' | 'investment' | 'purchase' | 'wage' | 'operational' | 'partner_withdrawal' | 'adjustment';
  partner_id: string | null;
  deposited_to_firm: boolean;
  description: string;
  reference_id: string | null;
  balance_after: number | null;
  created_by: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class FirmCashService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get firm cash balance
   */
  async getFirmCashBalance(): Promise<number> {
    const { data, error } = await this.supabase.supabase.rpc('get_firm_cash_balance');

    if (error) {
      console.error('[FirmCashService] getFirmCashBalance error:', error);
      throw error;
    }

    return data || 0;
  }

  /**
   * Record receipt (money in)
   */
  async recordReceipt(
    date: string,
    amount: number,
    category: 'sales' | 'investment',
    description: string,
    partnerId?: string,
    depositedToFirm: boolean = true
  ): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert({
          date,
          type: 'receipt',
          amount,
          category,
          partner_id: partnerId,
          deposited_to_firm: depositedToFirm,
          description
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('[FirmCashService] recordReceipt error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record payment (money out)
   */
  async recordPayment(
    date: string,
    amount: number,
    category: 'purchase' | 'wage' | 'operational' | 'partner_withdrawal',
    description: string,
    partnerId?: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert({
          date,
          type: 'payment',
          amount,
          category,
          partner_id: partnerId,
          deposited_to_firm: false,
          description
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('[FirmCashService] recordPayment error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cashbook (all transactions)
   */
  async getCashbook(startDate?: string, endDate?: string): Promise<FirmCashEntry[]> {
    let query = this.supabase.supabase
      .from('firm_cash_ledger')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[FirmCashService] getCashbook error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get cash summary
   */
  async getCashSummary(startDate: string, endDate: string) {
    const entries = await this.getCashbook(startDate, endDate);

    const receipts = entries.filter(e => e.type === 'receipt' && e.deposited_to_firm);
    const payments = entries.filter(e => e.type === 'payment');

    return {
      total_receipts: receipts.reduce((sum, e) => sum + e.amount, 0),
      total_payments: payments.reduce((sum, e) => sum + e.amount, 0),
      net_cash_flow: receipts.reduce((sum, e) => sum + e.amount, 0) - payments.reduce((sum, e) => sum + e.amount, 0),
      current_balance: await this.getFirmCashBalance()
    };
  }
}
