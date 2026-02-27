import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PartnerWalletService {

  constructor(private supabaseService: SupabaseService) {}

  // Calculate wallet balance for a single partner
  async getPartnerWallet(partnerName: string) {
    // Get partner_id from partner_master
    const { data: partnerData } = await this.supabaseService.supabase
      .from('partner_master')
      .select('id')
      .eq('partner_name', partnerName)
      .single();

    if (!partnerData) {
      return {
        partnerName,
        totalCollected: 0,
        totalDeposited: 0,
        totalExpense: 0,
        totalWithdrawal: 0,
        balance: 0,
        status: 'SETTLED'
      };
    }

    const partnerId = partnerData.id;
    console.log('[PartnerWalletService] Partner:', partnerName, 'ID:', partnerId);

    // Get money collected by partner from clients (from sales_transactions)
    const collectionsResponse = await this.supabaseService.supabase
      .from('sales_transactions')
      .select('paid_amount, deposited_to_firm')
      .eq('collected_by_partner_id', partnerId);

    console.log('[PartnerWalletService] Collections response:', collectionsResponse);

    const collections = collectionsResponse.data || [];
    const totalCollected = collections.reduce((sum: number, c: any) => sum + (c.paid_amount || 0), 0);
    const totalDeposited = collections
      .filter((c: any) => c.deposited_to_firm === true)
      .reduce((sum: number, c: any) => sum + (c.paid_amount || 0), 0);
    
    console.log('[PartnerWalletService]', partnerName, '- Total Collected:', totalCollected, 'Deposited:', totalDeposited);
    
    // Money still in partner's pocket (collected but not deposited)
    const collectionBalance = totalCollected - totalDeposited;

    // Get total contributions (money put in by partner from their own funds)
    const expensesResponse = await this.supabaseService.supabase
      .from('firm_cash_ledger')
      .select('amount')
      .eq('partner_id', partnerId)
      .eq('category', 'partner_contribution')
      .eq('type', 'receipt');

    const expenses = expensesResponse.data || [];
    const totalExpense = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Get total withdrawals (money taken out by partner)
    const withdrawalsResponse = await this.supabaseService.supabase
      .from('firm_cash_ledger')
      .select('amount')
      .eq('partner_id', partnerId)
      .eq('category', 'partner_withdrawal')
      .eq('type', 'payment');

    const withdrawals = withdrawalsResponse.data || [];
    const totalWithdrawal = withdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    // Partner Wallet = Money collected but not deposited
    // (Contributions and withdrawals are separate - they're firm transactions)
    const balance = collectionBalance;

    return {
      partnerName,
      totalCollected,
      totalDeposited,
      totalExpense,
      totalWithdrawal,
      balance,
      status: balance > 0 ? 'HOLDING' : 'SETTLED'
    };
  }

  // Get all partners' wallet balances
  async getAllPartnersWallet() {
    // Get all partners from partner_master
    const partnersResponse = await this.supabaseService.supabase
      .from('partner_master')
      .select('id, partner_name')
      .then(res => res.data || []);

    console.log('[PartnerWalletService] All partners from DB:', partnersResponse);

    const partnerWallets = await Promise.all(
      partnersResponse.map((p: any) => this.getPartnerWallet(p.partner_name))
    );

    console.log('[PartnerWalletService] Calculated wallets:', partnerWallets);

    return partnerWallets.sort((a, b) => b.balance - a.balance);
  }

  // Get partner wallet history
  async getPartnerWalletHistory(partnerName: string) {
    // Get partner_id
    const { data: partnerData } = await this.supabaseService.supabase
      .from('partner_master')
      .select('id')
      .eq('partner_name', partnerName)
      .single();

    if (!partnerData) {
      return {
        partnerName,
        history: [],
        currentWallet: await this.getPartnerWallet(partnerName)
      };
    }

    const partnerId = partnerData.id;

    // Get contributions
    const expensesResponse = await this.supabaseService.supabase
      .from('firm_cash_ledger')
      .select('date, description, amount')
      .eq('partner_id', partnerId)
      .eq('category', 'partner_contribution')
      .eq('type', 'receipt')
      .order('date', { ascending: false });

    // Get withdrawals
    const withdrawalsResponse = await this.supabaseService.supabase
      .from('firm_cash_ledger')
      .select('date, description, amount')
      .eq('partner_id', partnerId)
      .eq('category', 'partner_withdrawal')
      .eq('type', 'payment')
      .order('date', { ascending: false });

    const expenses = (expensesResponse.data || []).map((e: any) => ({
      date: e.date,
      title: e.description,
      amount: e.amount,
      type: 'EXPENSE',
      sign: 1
    }));

    const withdrawals = (withdrawalsResponse.data || []).map((w: any) => ({
      date: w.date,
      amount: w.amount,
      description: w.description,
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
    // Get all partners
    const { data: partners } = await this.supabaseService.supabase
      .from('partner_master')
      .select('id, partner_name');

    const partnerMap = new Map<string, { id: string; name: string }>();
    (partners || []).forEach(p => partnerMap.set(p.id, { id: p.id, name: p.partner_name }));

    let expensesQuery = this.supabaseService.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_contribution').eq('type', 'receipt');
    let withdrawalsQuery = this.supabaseService.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_withdrawal').eq('type', 'payment');

    if (from && to) {
      expensesQuery = expensesQuery.gte('date', from).lte('date', to);
      withdrawalsQuery = withdrawalsQuery.gte('date', from).lte('date', to);
    }

    const expenses = (await expensesQuery).data || [];
    const withdrawals = (await withdrawalsQuery).data || [];

    const summaryMap = new Map<string, { expense: number; withdrawal: number }>();

    expenses.forEach((e: any) => {
      const partnerId = e.partner_id;
      if (!summaryMap.has(partnerId)) {
        summaryMap.set(partnerId, { expense: 0, withdrawal: 0 });
      }
      summaryMap.get(partnerId)!.expense += e.amount || 0;
    });

    withdrawals.forEach((w: any) => {
      const partnerId = w.partner_id;
      if (!summaryMap.has(partnerId)) {
        summaryMap.set(partnerId, { expense: 0, withdrawal: 0 });
      }
      summaryMap.get(partnerId)!.withdrawal += w.amount || 0;
    });

    const summary = Array.from(summaryMap.entries()).map(([partnerId, data]) => ({
      partner: partnerMap.get(partnerId)?.name || 'Unknown',
      totalExpense: data.expense,
      totalWithdrawal: data.withdrawal,
      balance: data.expense - data.withdrawal
    }));

    return summary.sort((a, b) => b.balance - a.balance);
  }
}
