import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PartnerWithdrawService {

  constructor(private supabase: SupabaseService) {}

  insertWithdraw(date: string, partner_id: string, amount: number, remarks: string) {
    return this.supabase.supabase.from('firm_cash_ledger')
      .insert([{ 
        date, 
        type: 'payment',
        category: 'partner_withdrawal',
        partner_id,
        amount, 
        description: remarks 
      }]);
  }

  getWithdrawals(from: number, to: number) {
    return this.supabase.supabase
      .from('firm_cash_ledger')
      .select('date, partner_id, amount, description')
      .eq('type', 'payment')
      .eq('category', 'partner_withdrawal')
      .order('created_at', { ascending: false })
      .range(from, to);
  }
}
