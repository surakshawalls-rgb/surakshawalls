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

  // Payment Entry - Update client's total_paid in client_ledger
  async addPayment(date: string, clientId: string, amount: number, mode: string, receivedBy: string, remarks: string) {
    // Get current client totals
    const { data: clientData } = await this.supabase
      .from('client_ledger')
      .select('total_paid')
      .eq('id', clientId)
      .single();

    if (clientData) {
      // Update total_paid and last_payment_date
      return this.supabase.from('client_ledger').update({
        total_paid: clientData.total_paid + amount,
        last_payment_date: date
      }).eq('id', clientId);
    }
    
    return { error: { message: 'Client not found' } };
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

  // Get payments for a client from sales_transactions
  getClientPayments(clientId: string) {
    return this.supabase
      .from('sales_transactions')
      .select('date, paid_amount, invoice_number, payment_type')
      .eq('client_id', clientId)
      .gt('paid_amount', 0)
      .order('date', { ascending: false });
  }

  // Load Due Summary from client_ledger master table
  async getDueSummary() {
    const clients = await this.supabase.from('client_ledger').select('id, total_billed, total_paid');
    
    // Convert to legacy format for backward compatibility
    const legacyRevenue = (clients.data || []).map((c: any) => ({
      client_id: c.id,
      total_bill: c.total_billed
    }));
    
    const legacyPayments = (clients.data || []).map((c: any) => ({
      client_id: c.id,
      amount_paid: c.total_paid
    }));
    
    return { revenue: legacyRevenue, payments: legacyPayments };
  }

  // New Due Calculation from client_ledger master table
  async getClientDue(clientId: string) {
    const { data: clientData } = await this.supabase
      .from('client_ledger')
      .select('total_billed, total_paid, outstanding')
      .eq('id', clientId)
      .single();

    if (!clientData) {
      return { totalBilled: 0, totalPaid: 0, outstanding: 0 };
    }

    const totalBilled = clientData.total_billed || 0;
    const totalPaid = clientData.total_paid || 0;

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
