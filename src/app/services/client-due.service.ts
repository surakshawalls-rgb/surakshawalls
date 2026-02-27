import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ClientDueService {

  constructor(private supabaseService: SupabaseService) {}

  // Add Client Bill/Invoice
  addBill(date: string, clientId: string, amount: number, description?: string) {
    return this.supabaseService.supabase.from('client_bill').insert([
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
    return this.supabaseService.supabase
      .from('client_bill')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
  }

  // Get all bills within date range
  getBillsByDateRange(from: string, to: string) {
    return this.supabaseService.supabase
      .from('client_bill')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .eq('entry_type', 'BILL')
      .order('date', { ascending: false });
  }

  // Calculate due for a specific client
  async getClientDue(clientId: string) {
    // Query from sales_transactions for actual data
    const salesResponse = await this.supabaseService.supabase
      .from('sales_transactions')
      .select('total_amount, paid_amount')
      .eq('client_id', clientId);

    const sales = salesResponse.data || [];
    const totalBilled = sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0);
    const totalPaid = sales.reduce((sum: number, sale: any) => sum + (sale.paid_amount || 0), 0);

    return {
      clientId,
      totalBilled,
      totalPaid,
      due: totalBilled - totalPaid
    };
  }

  // Get due summary for all clients
  async getAllClientsDue() {
    const clientsResponse = await this.supabaseService.supabase.from('client_ledger').select('id, client_name');
    
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
    let query = this.supabaseService.supabase
      .from('sales_transactions')
      .select('total_amount');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    
    if (response.error) {
      console.error('getTotalRevenue error:', response.error);
      return 0;
    }
    
    const sales = response.data || [];
    const total = sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0);
    console.log('getTotalRevenue:', total, 'sales count:', sales.length, 'from:', from, 'to:', to);
    return total;
  }

  // Get total received (collected payments)
  async getTotalReceived(from?: string, to?: string) {
    let query = this.supabaseService.supabase
      .from('sales_transactions')
      .select('paid_amount');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    
    if (response.error) {
      console.error('getTotalReceived error:', response.error);
      return 0;
    }
    
    const sales = response.data || [];
    const total = sales.reduce((sum: number, sale: any) => sum + (sale.paid_amount || 0), 0);
    console.log('getTotalReceived:', total, 'sales count:', sales.length, 'from:', from, 'to:', to);
    return total;
  }

  // Get total outstanding due
  async getTotalDue(from?: string, to?: string) {
    const totalRevenue = await this.getTotalRevenue(from, to);
    const totalReceived = await this.getTotalReceived(from, to);
    return totalRevenue - totalReceived;
  }
}
