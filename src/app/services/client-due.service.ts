import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class ClientDueService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Add Client Bill/Invoice
  addBill(date: string, clientId: string, amount: number, description?: string) {
    return this.supabase.from('client_bill').insert([
      {
        date,
        client_id: clientId,
        bill_amount: amount,
        entry_type: 'BILL',
        description: description || null
      }
    ]);
  }

  // Get all bills for a client
  getClientBills(clientId: string) {
    return this.supabase
      .from('client_bill')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
  }

  // Get all bills within date range
  getBillsByDateRange(from: string, to: string) {
    return this.supabase
      .from('client_bill')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .eq('entry_type', 'BILL')
      .order('date', { ascending: false });
  }

  // Calculate due for a specific client
  async getClientDue(clientId: string) {
    const billsResponse = await this.supabase
      .from('client_bill')
      .select('bill_amount')
      .eq('client_id', clientId)
      .eq('entry_type', 'BILL');

    const bills = billsResponse.data || [];
    const totalBilled = bills.reduce((sum: number, bill: any) => sum + (bill.bill_amount || 0), 0);

    let paymentsResponse;
    try {
      paymentsResponse = await this.supabase
        .from('client_payment')
        .select('amount_paid')
        .filter('client_id', 'eq', clientId);
    } catch (err) {
      console.error('[ClientDueService] getClientDue - payment query failed:', err, 'clientId:', clientId);
      paymentsResponse = { data: [], error: err } as any;
    }

    if (paymentsResponse && paymentsResponse.error) {
      console.warn('[ClientDueService] getClientDue - paymentsResponse.error ->', paymentsResponse.error, 'clientId:', clientId);
    }

    const payments = paymentsResponse.data || [];
    const totalPaid = payments.reduce((sum: number, payment: any) => sum + (payment.amount_paid || 0), 0);

    return {
      clientId,
      totalBilled,
      totalPaid,
      due: totalBilled - totalPaid
    };
  }

  // Get due summary for all clients
  async getAllClientsDue() {
    const clientsResponse = await this.supabase.from('client_ledger').select('id, client_name');
    
    if (clientsResponse.error) {
      console.error('getAllClientsDue error:', clientsResponse.error);
      return [];
    }
    
    const clients = clientsResponse.data || [];
    console.log('getAllClientsDue: found', clients.length, 'clients');

    const dueSummary = await Promise.all(
      clients.map(async (client: any) => {
        const due = await this.getClientDue(client.id);
        console.log('Client:', client.client_name, 'Due:', due);
        return {
          ...due,
          clientName: client.client_name
        };
      })
    );

    return dueSummary;
  }

  // Get total revenue (billed amount)
  async getTotalRevenue(from?: string, to?: string) {
    let query = this.supabase
      .from('client_bill')
      .select('bill_amount')
      .eq('entry_type', 'BILL');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    
    if (response.error) {
      console.error('getTotalRevenue error:', response.error);
      return 0;
    }
    
    const bills = response.data || [];
    const total = bills.reduce((sum: number, bill: any) => sum + (bill.bill_amount || 0), 0);
    console.log('getTotalRevenue:', total, 'bills count:', bills.length, 'from:', from, 'to:', to);
    return total;
  }

  // Get total received (collected payments)
  async getTotalReceived(from?: string, to?: string) {
    let query = this.supabase
      .from('client_payment')
      .select('amount_paid');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    
    if (response.error) {
      console.error('getTotalReceived error:', response.error);
      return 0;
    }
    
    const payments = response.data || [];
    const total = payments.reduce((sum: number, payment: any) => sum + (payment.amount_paid || 0), 0);
    console.log('getTotalReceived:', total, 'payments count:', payments.length, 'from:', from, 'to:', to);
    return total;
  }

  // Get total outstanding due
  async getTotalDue(from?: string, to?: string) {
    const totalRevenue = await this.getTotalRevenue(from, to);
    const totalReceived = await this.getTotalReceived(from, to);
    return totalRevenue - totalReceived;
  }
}
