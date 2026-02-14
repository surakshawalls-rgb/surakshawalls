import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  async getClients() {
    const res = await this.supabase.from('clients').select('id,client_name');
    console.log('[DashboardService] getClients ->', res);
    return res;
  }

  async getRevenue() {
    const res = await this.supabase.from('client_bill').select('bill_amount,client_id').eq('entry_type', 'BILL');
    console.log('[DashboardService] getRevenue ->', res);
    return res;
  }

  async getPayments() {
    // Get payments from sales_transactions
    const res = await this.supabase.from('sales_transactions').select('paid_amount as amount, client_id');
    console.log('[DashboardService] getPayments ->', res);
    return res;
  }

  async getLabour() {
    // Get wage expenses from firm_cash_ledger
    const res = await this.supabase.from('firm_cash_ledger').select('amount').eq('category', 'wage').eq('type', 'payment');
    console.log('[DashboardService] getLabour ->', res);
    return res;
  }

  async getPartnerExpense() {
    // Get partner contributions from firm_cash_ledger
    const res = await this.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_contribution').eq('type', 'receipt');
    console.log('[DashboardService] getPartnerExpense ->', res);
    return res;
  }

  async getPartnerWithdraw() {
    // Get partner withdrawals from firm_cash_ledger
    const res = await this.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_withdrawal').eq('type', 'payment');
    console.log('[DashboardService] getPartnerWithdraw ->', res);
    return res;
  }

  async getProductionTotal() {
    const res = await this.supabase
      .from('production')
      .select('fencing_pole,plain_plate,jumbo_pillar,round_plate,biscuit_plate');
    console.log('[DashboardService] getProductionTotal ->', res);
    return res;
  }
}
