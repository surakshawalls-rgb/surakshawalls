import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class CompanyCashService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Add manual cash entry (adjustment/deposit/withdrawal)
  addCashEntry(date: string, description: string, amount: number, type: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT') {
    return this.supabase.from('company_cash_ledger').insert([
      {
        date,
        description,
        amount,
        entry_type: type,
        source: 'MANUAL'
      }
    ]);
  }

  // Get all cash ledger entries
  getCashLedger(from?: string, to?: string) {
    let query = this.supabase
      .from('company_cash_ledger')
      .select('*');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    return query.order('date', { ascending: false });
  }

  // Calculate current cash balance (aggregated from all sources)
  async getCurrentBalance(date?: string) {
    // Client Payments (INCOME)
    const clientPayments = await this.supabase
      .from('client_payment')
      .select('amount_paid')
      .then(res => res.data || []);
    const clientIncome = clientPayments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);

    // Labour Expenses (EXPENSE)
    const labourExpenses = await this.supabase
      .from('labour')
      .select('amount')
      .then(res => res.data || []);
    const labourCost = labourExpenses.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

    // Partner Expenses (EXPENSE)
    const partnerExpenses = await this.supabase
      .from('partner_expense')
      .select('amount')
      .then(res => res.data || []);
    const partnerExpenseCost = partnerExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Partner Withdrawals (EXPENSE)
    const partnerWithdrawals = await this.supabase
      .from('partner_withdrawal')
      .select('amount')
      .then(res => res.data || []);
    const partnerWithdrawalAmount = partnerWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    // Manual Entries
    const manualEntries = await this.supabase
      .from('company_cash_ledger')
      .select('amount, entry_type')
      .then(res => res.data || []);

    let manualBalance = 0;
    manualEntries.forEach((entry: any) => {
      if (entry.entry_type === 'INCOME' || entry.entry_type === 'ADJUSTMENT') {
        manualBalance += entry.amount;
      } else if (entry.entry_type === 'EXPENSE') {
        manualBalance -= entry.amount;
      }
    });

    const balance = clientIncome - labourCost - partnerExpenseCost - partnerWithdrawalAmount + manualBalance;

    return {
      balance,
      income: clientIncome,
      expenses: labourCost + partnerExpenseCost + partnerWithdrawalAmount,
      labourCost,
      partnerExpenseCost,
      partnerWithdrawalAmount,
      manualAdjustment: manualBalance
    };
  }

  // Get cash summary for specific date range
  async getCashSummary(from: string, to: string) {
    // Client Payments (INCOME)
    const clientPayments = await this.supabase
      .from('client_payment')
      .select('amount_paid')
      .gte('date', from)
      .lte('date', to)
      .then(res => res.data || []);
    const clientIncome = clientPayments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);

    // Labour Expenses (EXPENSE)
    const labourExpenses = await this.supabase
      .from('labour')
      .select('amount')
      .gte('date', from)
      .lte('date', to)
      .then(res => res.data || []);
    const labourCost = labourExpenses.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

    // Partner Expenses (EXPENSE)
    const partnerExpenses = await this.supabase
      .from('partner_expense')
      .select('amount')
      .gte('date', from)
      .lte('date', to)
      .then(res => res.data || []);
    const partnerExpenseCost = partnerExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Partner Withdrawals (EXPENSE)
    const partnerWithdrawals = await this.supabase
      .from('partner_withdrawal')
      .select('amount')
      .gte('date', from)
      .lte('date', to)
      .then(res => res.data || []);
    const partnerWithdrawalAmount = partnerWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    // Manual Entries
    const manualEntries = await this.supabase
      .from('company_cash_ledger')
      .select('amount, entry_type')
      .gte('date', from)
      .lte('date', to)
      .then(res => res.data || []);

    let manualBalance = 0;
    manualEntries.forEach((entry: any) => {
      if (entry.entry_type === 'INCOME' || entry.entry_type === 'ADJUSTMENT') {
        manualBalance += entry.amount;
      } else if (entry.entry_type === 'EXPENSE') {
        manualBalance -= entry.amount;
      }
    });

    const totalExpenses = labourCost + partnerExpenseCost + partnerWithdrawalAmount;
    const totalIncome = clientIncome + manualBalance;

    return {
      period: { from, to },
      income: clientIncome,
      expenses: totalExpenses,
      manualAdjustment: manualBalance,
      netCashFlow: totalIncome - totalExpenses,
      breakdown: {
        labourCost,
        partnerExpenseCost,
        partnerWithdrawalAmount
      }
    };
  }
}
