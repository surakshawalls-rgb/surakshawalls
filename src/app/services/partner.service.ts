import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PartnerService {

  constructor(private supabase: SupabaseService) {}

  async getAllPartners() {
    const { data, error } = await this.supabase.supabase
      .from('partner_master')
      .select('*')
      .order('partner_name');

    if (error) {
      console.error('[PartnerService] getAllPartners error:', error);
      return [];
    }

    return data || [];
  }

  async insertExpense(date: string, partner_id: string, title: string, amount: number, category: string, description?: string) {
    // Record partner contribution in firm_cash_ledger
    await this.supabase.supabase.from('firm_cash_ledger').insert([{
      date,
      type: 'receipt',
      category: 'partner_contribution',
      partner_id,
      amount,
      description: `${title} - ${category}${description ? ': ' + description : ''}`
    }]);
    // Also record in partner_expense for dashboard/reporting
    await this.supabase.supabase.from('partner_expense').insert([{
      date,
      partner: partner_id,
      amount,
      category,
      description: `${title}${description ? ': ' + description : ''}`
    }]);
  }

  // Get all partner expenses (passbook-style)
  async getPartnerPassbook(partner_id: string) {
    const { data, error } = await this.supabase.supabase
      .from('partner_expense')
      .select('date, amount, category, description')
      .eq('partner', partner_id)
      .order('date', { ascending: false });
    if (error) {
      console.error('[PartnerService] getPartnerPassbook error:', error);
      return [];
    }
    return data || [];
  }

  getExpenses(from: number, to: number) {
    return this.supabase.supabase
      .from('firm_cash_ledger')
      .select('date, partner_id, amount, description')
      .eq('type', 'receipt')
      .eq('category', 'partner_contribution')
      .order('created_at', { ascending: false })
      .range(from, to);
  }
}
