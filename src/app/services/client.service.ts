// src/app/services/client.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Client {
  id: string;
  client_name: string;
  phone: string | null;
  address: string | null;
  credit_limit: number;
  credit_days: number;
  total_billed: number;
  total_paid: number;
  outstanding: number;
  last_purchase_date: string | null;
  last_payment_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  client_name: string;
  phone?: string;
  address?: string;
  credit_limit?: number;
  credit_days?: number;
  active?: boolean;
}

export interface ClientStatement {
  date: string;
  type: 'sale' | 'payment';
  bill_number?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all clients
   */
  async getAllClients(): Promise<Client[]> {
    const { data, error } = await this.supabase.supabase
      .from('client_ledger')
      .select('*')
      .order('client_name');

    if (error) {
      console.error('[ClientService] getAllClients error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get active clients
   */
  async getActiveClients(): Promise<Client[]> {
    const { data, error } = await this.supabase.supabase
      .from('client_ledger')
      .select('*')
      .eq('active', true)
      .order('client_name');

    if (error) {
      console.error('[ClientService] getActiveClients error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get client by ID
   */
  async getClientById(clientId: string): Promise<Client | null> {
    const { data, error } = await this.supabase.supabase
      .from('client_ledger')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('[ClientService] getClientById error:', error);
      return null;
    }

    return data;
  }

  /**
   * Add new client
   */
  async addClient(clientData: ClientFormData): Promise<{success: boolean, client?: Client, error?: string}> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('client_ledger')
        .insert({
          ...clientData,
          credit_limit: clientData.credit_limit || 50000,
          credit_days: clientData.credit_days || 30,
          active: clientData.active !== undefined ? clientData.active : true
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, client: data };

    } catch (error: any) {
      console.error('[ClientService] addClient error:', error);
      return { success: false, error: error.message || 'Failed to add client' };
    }
  }

  /**
   * Update client
   */
  async updateClient(clientId: string, updates: Partial<ClientFormData>): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('client_ledger')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[ClientService] updateClient error:', error);
      return { success: false, error: error.message || 'Failed to update client' };
    }
  }

  /**
   * Delete client (Admin only)
   */
  async deleteClient(clientId: string): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('client_ledger')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[ClientService] deleteClient error:', error);
      return { success: false, error: error.message || 'Failed to delete client' };
    }
  }

  /**
   * Get client statement
   */
  async getClientStatement(clientId: string, startDate?: string, endDate?: string): Promise<ClientStatement[]> {
    const client = await this.getClientById(clientId);
    if (!client) return [];

    // Get sales
    let salesQuery = this.supabase.supabase
      .from('sales_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: true });

    if (startDate) salesQuery = salesQuery.gte('date', startDate);
    if (endDate) salesQuery = salesQuery.lte('date', endDate);

    const { data: sales } = await salesQuery;

    // Create statement entries
    const statement: ClientStatement[] = [];
    let runningBalance = 0;

    if (sales) {
      for (const sale of sales) {
        // Sale entry (debit)
        runningBalance += sale.total_amount;
        statement.push({
          date: sale.date,
          type: 'sale',
          bill_number: sale.bill_number,
          description: `Sale - ${sale.product_name} (${sale.quantity} units)`,
          debit: sale.total_amount,
          credit: 0,
          balance: runningBalance
        });

        // Payment entry if any (credit)
        if (sale.payment_amount > 0) {
          runningBalance -= sale.payment_amount;
          statement.push({
            date: sale.date,
            type: 'payment',
            description: `Payment received (${sale.payment_type})`,
            debit: 0,
            credit: sale.payment_amount,
            balance: runningBalance
          });
        }
      }
    }

    return statement;
  }

  /**
   * Get clients with overdue payments
   */
  async getOverdueClients(): Promise<Client[]> {
    const { data, error } = await this.supabase.supabase
      .from('client_ledger')
      .select('*')
      .eq('active', true)
      .gt('outstanding', 0)
      .order('outstanding', { ascending: false });

    if (error) {
      console.error('[ClientService] getOverdueClients error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get clients exceeding credit limit
   */
  async getClientsExceedingCreditLimit(): Promise<Client[]> {
    const clients = await this.getAllClients();
    return clients.filter(c => c.outstanding > c.credit_limit);
  }

  /**
   * Get top debtors
   */
  async getTopDebtors(limit: number = 10): Promise<Client[]> {
    const { data, error } = await this.supabase.supabase
      .from('client_ledger')
      .select('*')
      .gt('outstanding', 0)
      .order('outstanding', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ClientService] getTopDebtors error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get clients summary
   */
  async getClientsSummary() {
    const clients = await this.getAllClients();

    return {
      total_clients: clients.length,
      active_clients: clients.filter(c => c.active).length,
      total_outstanding: clients.reduce((sum, c) => sum + c.outstanding, 0),
      total_billed: clients.reduce((sum, c) => sum + c.total_billed, 0),
      total_paid: clients.reduce((sum, c) => sum + c.total_paid, 0),
      clients_with_outstanding: clients.filter(c => c.outstanding > 0).length,
      clients_exceeding_limit: clients.filter(c => c.outstanding > c.credit_limit).length
    };
  }
}
