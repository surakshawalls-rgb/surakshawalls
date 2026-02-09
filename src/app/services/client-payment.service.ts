import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class ClientPaymentService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Clients
  getClients() {
    return this.supabase.from('clients').select('*').order('client_name');
  }

  // Revenue Entry (writes to client_bill table)
  addRevenue(date: string, clientId: string, site: string, bill: number) {
    return this.supabase.from('client_bill').insert([
      {
        date,
        client_id: clientId,
        bill_amount: bill,
        entry_type: 'BILL',
        description: `Invoice for ${site}`
      }
    ]);
  }

  // Payment Entry
  addPayment(date: string, clientId: string, amount: number, mode: string, receivedBy: string, remarks: string) {
    return this.supabase.from('client_payment').insert([
      { date, client_id: clientId, amount_paid: amount, payment_mode: mode, received_by: receivedBy, remarks }
    ]);
  }

  // Add Bill (New - uses client_bill table for proper tracking)
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

  // Get bills for a client
  getClientBills(clientId: string) {
    return this.supabase
      .from('client_bill')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
  }

  // Get payments for a client
  getClientPayments(clientId: string) {
    return this.supabase
      .from('client_payment')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
  }

  // Load Due Summary (Updated to use client_bill table)
  async getDueSummary() {
    const revenue = await this.supabase.from('client_bill').select('client_id, bill_amount').eq('entry_type', 'BILL');
    const payments = await this.supabase.from('client_payment').select('client_id,amount_paid');
    
    // Convert to legacy format for backward compatibility
    const legacyRevenue = (revenue.data || []).map(r => ({
      client_id: r.client_id,
      total_bill: r.bill_amount
    }));
    
    return { revenue: legacyRevenue, payments: payments.data || [] };
  }

  // New Due Calculation using client_bill table
  async getClientDue(clientId: string) {
    const bills = await this.supabase
      .from('client_bill')
      .select('bill_amount')
      .eq('client_id', clientId)
      .eq('entry_type', 'BILL');

    const payments = await this.supabase
      .from('client_payment')
      .select('amount_paid')
      .eq('client_id', clientId);

    const totalBilled = (bills.data || []).reduce((sum: number, b: any) => sum + (b.bill_amount || 0), 0);
    const totalPaid = (payments.data || []).reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);

    return {
      clientId,
      totalBilled,
      totalPaid,
      due: totalBilled - totalPaid
    };
  }

  // Get all clients with due
  async getAllClientsDue() {
    const clients = await this.supabase.from('clients').select('id, client_name');
    const clientList = clients.data || [];

    const dueSummary = await Promise.all(
      clientList.map(async (client: any) => {
        const due = await this.getClientDue(client.id);
        return {
          ...due,
          clientName: client.client_name
        };
      })
    );

    return dueSummary;
  }
}
