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
    return this.supabase.from('firm_cash_ledger').insert([
      {
        date,
        description,
        type: type === 'INCOME' ? 'receipt' : 'payment',
        category: type === 'ADJUSTMENT' ? 'adjustment' : 'operational',
        amount
      }
    ]);
  }

  // Get all cash ledger entries
  getCashLedger(from?: string, to?: string) {
    let query = this.supabase
      .from('firm_cash_ledger')
      .select('*');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    return query.order('date', { ascending: false });
  }

  // Calculate current cash balance (aggregated from all sources)
  async getCurrentBalance(date?: string) {
    // Get all firm cash ledger entries and calculate balance
    const { data: ledgerData } = await this.supabase
      .from('firm_cash_ledger')
      .select('type, amount, category');

    const entries = ledgerData || [];
    let clientIncome = 0;
    let labourCost = 0;
    let partnerExpenseCost = 0;
    let partnerWithdrawalAmount = 0;
    let manualBalance = 0;

    entries.forEach((entry: any) => {
      const amount = entry.amount || 0;
      
      if (entry.type === 'receipt') {
        // Income categories
        if (entry.category === 'sales') {
          clientIncome += amount;
        } else if (entry.category === 'partner_contribution') {
          partnerExpenseCost += amount; // Partner money in
        } else {
          manualBalance += amount;
        }
      } else if (entry.type === 'payment') {
        // Expense categories
        if (entry.category === 'wage') {
          labourCost += amount;
        } else if (entry.category === 'partner_withdrawal') {
          partnerWithdrawalAmount += amount;
        } else {
          manualBalance -= amount;
        }
      }
    });

    // Get client payments from sales_transactions
    const { data: salesData } = await this.supabase
      .from('sales_transactions')
      .select('paid_amount, deposited_to_firm');

    if (salesData) {
      salesData.forEach((sale: any) => {
        if (sale.deposited_to_firm) {
          clientIncome += sale.paid_amount || 0;
        }
      });
    }

    const balance = clientIncome + partnerExpenseCost - labourCost - partnerWithdrawalAmount + manualBalance;

    return {
      balance,
      income: clientIncome + partnerExpenseCost,
      expenses: labourCost + partnerWithdrawalAmount,
      labourCost,
      partnerExpenseCost,
      partnerWithdrawalAmount,
      manualAdjustment: manualBalance
    };
  }

  // Get cash summary for specific date range
  async getCashSummary(from: string, to: string) {
    // Get firm cash ledger entries for date range
    const { data: ledgerData } = await this.supabase
      .from('firm_cash_ledger')
      .select('type, amount, category')
      .gte('date', from)
      .lte('date', to);

    const entries = ledgerData || [];
    let clientIncome = 0;
    let labourCost = 0;
    let partnerExpenseCost = 0;
    let partnerWithdrawalAmount = 0;
    let manualBalance = 0;

    entries.forEach((entry: any) => {
      const amount = entry.amount || 0;
      
      if (entry.type === 'receipt') {
        if (entry.category === 'sales') {
          clientIncome += amount;
        } else if (entry.category === 'partner_contribution') {
          partnerExpenseCost += amount;
        } else {
          manualBalance += amount;
        }
      } else if (entry.type === 'payment') {
        if (entry.category === 'wage') {
          labourCost += amount;
        } else if (entry.category === 'partner_withdrawal') {
          partnerWithdrawalAmount += amount;
        } else {
          manualBalance -= amount;
        }
      }
    });

    // Get client payments from sales_transactions
    const { data: salesData } = await this.supabase
      .from('sales_transactions')
      .select('paid_amount, deposited_to_firm')
      .gte('date', from)
      .lte('date', to);

    if (salesData) {
      salesData.forEach((sale: any) => {
        if (sale.deposited_to_firm) {
          clientIncome += sale.paid_amount || 0;
        }
      });
    }

    const totalExpenses = labourCost + partnerWithdrawalAmount;
    const totalIncome = clientIncome + partnerExpenseCost + manualBalance;

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
