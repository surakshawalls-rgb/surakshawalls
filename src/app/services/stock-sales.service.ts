import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class StockSalesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Record a stock sale
  addStockSale(
    date: string,
    clientId: string,
    itemType: 'FENCING_POLE' | 'PLAIN_PLATE' | 'JUMBO_PILLAR' | 'ROUND_PLATE' | 'BISCUIT_PLATE',
    quantity: number,
    amount: number,
    description?: string
  ) {
    return this.supabase.from('stock_sales').insert([
      {
        date,
        client_id: clientId,
        item_type: itemType,
        quantity,
        amount,
        description: description || null
      }
    ]);
  }

  // Get all stock sales
  getStockSales(from?: string, to?: string) {
    let query = this.supabase.from('stock_sales').select('*');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    return query.order('date', { ascending: false });
  }

  // Get stock sales for a specific client
  getClientSales(clientId: string, from?: string, to?: string) {
    let query = this.supabase.from('stock_sales').select('*').eq('client_id', clientId);

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    return query.order('date', { ascending: false });
  }

  // Get stock sales summary by item type
  async getStockSalesByType(from?: string, to?: string) {
    let query = this.supabase.from('stock_sales').select('item_type, quantity, amount');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    const sales = response.data || [];

    const summary = new Map<string, { quantity: number; amount: number }>();

    sales.forEach((sale: any) => {
      const itemType = sale.item_type;
      if (!summary.has(itemType)) {
        summary.set(itemType, { quantity: 0, amount: 0 });
      }
      const current = summary.get(itemType)!;
      current.quantity += sale.quantity || 0;
      current.amount += sale.amount || 0;
    });

    return Array.from(summary.entries()).map(([itemType, data]) => ({
      itemType,
      quantity: data.quantity,
      amount: data.amount
    }));
  }

  // Calculate total revenue from stock sales
  async getTotalStockSalesRevenue(from?: string, to?: string) {
    let query = this.supabase.from('stock_sales').select('amount');

    if (from && to) {
      query = query.gte('date', from).lte('date', to);
    }

    const response = await query;
    const sales = response.data || [];
    return sales.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
  }

  // Get production vs sales status
  async getProductionVsSales(from?: string, to?: string) {
    // Get production data
    let productionQuery = this.supabase
      .from('production')
      .select('fencing_pole, plain_plate, jumbo_pillar, round_plate, biscuit_plate');

    if (from && to) {
      productionQuery = productionQuery.gte('date', from).lte('date', to);
    }

    const productionResponse = await productionQuery;
    const productions = productionResponse.data || [];

    const totalProduction = {
      fencingPole: 0,
      plainPlate: 0,
      jumboPillar: 0,
      roundPlate: 0,
      biscuitPlate: 0
    };

    productions.forEach((prod: any) => {
      totalProduction.fencingPole += prod.fencing_pole || 0;
      totalProduction.plainPlate += prod.plain_plate || 0;
      totalProduction.jumboPillar += prod.jumbo_pillar || 0;
      totalProduction.roundPlate += prod.round_plate || 0;
      totalProduction.biscuitPlate += prod.biscuit_plate || 0;
    });

    // Get sales data
    const salesByType = await this.getStockSalesByType(from, to);

    const salesMap = new Map<string, number>();
    salesByType.forEach((sale: any) => {
      const key = sale.itemType.toLowerCase();
      salesMap.set(key, sale.quantity);
    });

    return {
      production: totalProduction,
      sales: {
        fencing_pole: salesMap.get('fencing_pole') || 0,
        plain_plate: salesMap.get('plain_plate') || 0,
        jumbo_pillar: salesMap.get('jumbo_pillar') || 0,
        round_plate: salesMap.get('round_plate') || 0,
        biscuit_plate: salesMap.get('biscuit_plate') || 0
      },
      remaining: {
        fencing_pole: Math.max(0, totalProduction.fencingPole - (salesMap.get('fencing_pole') || 0)),
        plain_plate: Math.max(0, totalProduction.plainPlate - (salesMap.get('plain_plate') || 0)),
        jumbo_pillar: Math.max(0, totalProduction.jumboPillar - (salesMap.get('jumbo_pillar') || 0)),
        round_plate: Math.max(0, totalProduction.roundPlate - (salesMap.get('round_plate') || 0)),
        biscuit_plate: Math.max(0, totalProduction.biscuitPlate - (salesMap.get('biscuit_plate') || 0))
      }
    };
  }
}
