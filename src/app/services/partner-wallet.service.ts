import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class PartnerWalletService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Calculate wallet balance for a single partner
  async getPartnerWallet(partnerName: string) {
    // Get total expenses (money put in by partner)
    const expensesResponse = await this.supabase
      .from('partner_expense')
      .select('amount')
      .eq('partner', partnerName);

    const expenses = expensesResponse.data || [];
    const totalExpense = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Get total withdrawals (money taken out by partner)
    const withdrawalsResponse = await this.supabase
      .from('partner_withdrawal')
      .select('amount')
      .eq('partner', partnerName);

    const withdrawals = withdrawalsResponse.data || [];
    const totalWithdrawal = withdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    const balance = totalExpense - totalWithdrawal;

    return {
      partnerName,
      totalExpense,
      totalWithdrawal,
      balance,
      status: balance > 0 ? 'OWED' : balance < 0 ? 'OWING' : 'SETTLED'
    };
  }

  // Get all partners' wallet balances
  async getAllPartnersWallet() {
    // Get all unique partner names from partner_expense and partner_withdrawal
    const expensesResponse = await this.supabase
      .from('partner_expense')
      .select('partner')
      .then(res => res.data || []);

    const withdrawalsResponse = await this.supabase
      .from('partner_withdrawal')
      .select('partner')
      .then(res => res.data || []);

    const partnerSet = new Set<string>();
    expensesResponse.forEach((e: any) => partnerSet.add(e.partner));
    withdrawalsResponse.forEach((w: any) => partnerSet.add(w.partner));

    const partnerWallets = await Promise.all(
      Array.from(partnerSet).map(partnerName => this.getPartnerWallet(partnerName))
    );

    return partnerWallets.sort((a, b) => b.balance - a.balance);
  }

  // Get partner wallet history
  async getPartnerWalletHistory(partnerName: string) {
    // Get expenses
    const expensesResponse = await this.supabase
      .from('partner_expense')
      .select('date, title, amount, category')
      .eq('partner', partnerName)
      .order('date', { ascending: false });

    // Get withdrawals
    const withdrawalsResponse = await this.supabase
      .from('partner_withdrawal')
      .select('date, amount, remarks')
      .eq('partner', partnerName)
      .order('date', { ascending: false });

    const expenses = (expensesResponse.data || []).map((e: any) => ({
      ...e,
      type: 'EXPENSE',
      sign: 1
    }));

    const withdrawals = (withdrawalsResponse.data || []).map((w: any) => ({
      date: w.date,
      amount: w.amount,
      description: w.remarks,
      type: 'WITHDRAWAL',
      sign: -1
    }));

    // Merge and sort
    const history = [...expenses, ...withdrawals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      partnerName,
      history,
      currentWallet: await this.getPartnerWallet(partnerName)
    };
  }

  // Get partner summary for reporting
  async getPartnerSummary(from?: string, to?: string) {
    let expensesQuery = this.supabase.from('partner_expense').select('partner, amount');
    let withdrawalsQuery = this.supabase.from('partner_withdrawal').select('partner, amount');

    if (from && to) {
      expensesQuery = expensesQuery.gte('date', from).lte('date', to);
      withdrawalsQuery = withdrawalsQuery.gte('date', from).lte('date', to);
    }

    const expenses = (await expensesQuery).data || [];
    const withdrawals = (await withdrawalsQuery).data || [];

    const partnerMap = new Map<string, { expense: number; withdrawal: number }>();

    expenses.forEach((e: any) => {
      if (!partnerMap.has(e.partner)) {
        partnerMap.set(e.partner, { expense: 0, withdrawal: 0 });
      }
      partnerMap.get(e.partner)!.expense += e.amount || 0;
    });

    withdrawals.forEach((w: any) => {
      if (!partnerMap.has(w.partner)) {
        partnerMap.set(w.partner, { expense: 0, withdrawal: 0 });
      }
      partnerMap.get(w.partner)!.withdrawal += w.amount || 0;
    });

    const summary = Array.from(partnerMap.entries()).map(([partner, data]) => ({
      partner,
      totalExpense: data.expense,
      totalWithdrawal: data.withdrawal,
      balance: data.expense - data.withdrawal
    }));

    return summary.sort((a, b) => b.balance - a.balance);
  }
}
