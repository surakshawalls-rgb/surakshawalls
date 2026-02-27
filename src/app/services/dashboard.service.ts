import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private supabaseService: SupabaseService) {}

  async getClients() {
    return this.supabaseService.supabase.from('client_ledger').select('id,client_name');
  }

  async getRevenue() {
    return this.supabaseService.supabase.from('client_bill').select('bill_amount,client_id').eq('entry_type', 'BILL');
  }

  async getPayments() {
    return this.supabaseService.supabase.from('sales_transactions').select('paid_amount as amount, client_id');
  }

  async getLabour() {
    return this.supabaseService.supabase.from('firm_cash_ledger').select('amount').eq('category', 'wage').eq('type', 'payment');
  }

  async getPartnerExpense() {
    return this.supabaseService.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_contribution').eq('type', 'receipt');
  }

  async getPartnerWithdraw() {
    return this.supabaseService.supabase.from('firm_cash_ledger').select('partner_id, amount').eq('category', 'partner_withdrawal').eq('type', 'payment');
  }

  async getProductionTotal() {
    return this.supabaseService.supabase
      .from('production')
      .select('fencing_pole,plain_plate,jumbo_pillar,round_plate,biscuit_plate');
  }
}
