// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // ========== LABOUR ==========
  insertLabour(date: string, workers: any[]) {
    const payload = workers.map(w => ({
      date,
      name: w.name,
      type: w.type,
      amount: w.amount
    }));

    return this.supabase.from('labour').insert(payload);
  }

  getLabour(from: number, to: number) {
    return this.supabase
      .from('labour')
      .select('date,name,type,amount')
      .order('created_at', { ascending: false })
      .range(from, to);
  }

  getMonthlyTotal(month: string) {
    return this.supabase
      .from('labour')
      .select('amount')
      .like('date', month + '%');
  }

  // ========== ORDERS (NEW) ==========
  insertOrder(order: any) {
    const payload = {
      date: order.date,
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_location: order.client_location,
      is_registered: order.is_registered,
      
      fencingPole: order.fencingPole,
      plainPlate: order.plainPlate,
      jumboPillar: order.jumboPillar,
      roundPlate: order.roundPlate,
      biscuitPlate: order.biscuitPlate,
      production_unit_price: order.production_unit_price,
      production_total: order.production_total,
      
      labour_json: order.labour_json,
      labour_total: order.labour_total,
      
      transport_charge: order.transport_charge,
      installation_charge: order.installation_charge,
      other_charge: order.other_charge,
      notes: order.notes,
      
      total_bill: order.total_bill,
      paid_amount: order.paid_amount,
      due_amount: order.due_amount,
      payment_mode: order.payment_mode
    };

    return this.supabase.from('orders').insert([payload]);
  }

  getOrders(from: number, to: number) {
    return this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
  }

  getOrdersByClient(clientName: string) {
    return this.supabase
      .from('orders')
      .select('*')
      .eq('client_name', clientName)
      .order('created_at', { ascending: false });
  }

  getOrdersByDate(date: string) {
    return this.supabase
      .from('orders')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });
  }

  updateOrder(id: string, updates: any) {
    return this.supabase
      .from('orders')
      .update(updates)
      .eq('id', id);
  }

  deleteOrder(id: string) {
    return this.supabase
      .from('orders')
      .delete()
      .eq('id', id);
  }

  // ========== REPORTS (QUERY VIEWS) ==========
  queryView(viewName: string) {
    return this.supabase.from(viewName).select('*');
  }

  queryViewWithFilters(viewName: string, filters: any = {}) {
    let query = this.supabase.from(viewName).select('*');
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        query = query.eq(key, filters[key]);
      }
    });
    
    return query;
  }
}
