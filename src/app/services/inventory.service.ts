// src/app/services/inventory.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FinishedGood {
  id: string;
  product_name: string;
  product_variant: string | null;
  current_stock: number;
  unit_cost: number;
  unit_price: number;
  selling_price: number;
  low_stock_alert: number;
  reorder_level: number; // Alias for low_stock_alert
  total_produced: number;
  total_sold: number;
  total_wasted: number;
  last_production_date: string | null;
  last_sale_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialStock {
  id: string;
  material_name: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  low_stock_alert: number;
  last_purchase_date: string | null;
  last_purchase_rate: number | null;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all finished goods inventory
   */
  async getInventory(): Promise<FinishedGood[]> {
    const { data, error } = await this.supabase.supabase
      .from('finished_goods_inventory')
      .select('*')
      .order('product_name', { ascending: true })
      .order('product_variant', { ascending: true });

    if (error) {
      console.error('[InventoryService] getInventory error:', error);
      throw error;
    }

    // Map database fields to interface
    return (data || []).map(item => ({
      ...item,
      selling_price: item.unit_price, // Map unit_price to selling_price
      reorder_level: item.low_stock_alert // Map low_stock_alert to reorder_level
    }));
  }

  /**
   * Get specific product stock
   */
  async getProductStock(productName: string, variant: string | null = null): Promise<FinishedGood | null> {
    let query = this.supabase.supabase
      .from('finished_goods_inventory')
      .select('*')
      .eq('product_name', productName);

    if (variant) {
      query = query.eq('product_variant', variant);
    } else {
      query = query.is('product_variant', null);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('[InventoryService] getProductStock error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get low stock alerts (current_stock < low_stock_alert)
   */
  async getLowStockAlerts(): Promise<FinishedGood[]> {
    const inventory = await this.getInventory();
    return inventory.filter(item => item.current_stock < item.low_stock_alert);
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary() {
    const inventory = await this.getInventory();

    const summary = {
      total_products: inventory.length,
      total_stock: inventory.reduce((sum, item) => sum + item.current_stock, 0),
      total_produced: inventory.reduce((sum, item) => sum + item.total_produced, 0),
      total_sold: inventory.reduce((sum, item) => sum + item.total_sold, 0),
      total_wasted: inventory.reduce((sum, item) => sum + item.total_wasted, 0),
      low_stock_items: inventory.filter(item => item.current_stock < item.low_stock_alert).length,
      out_of_stock_items: inventory.filter(item => item.current_stock === 0).length,
      inventory_value: inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
    };

    return summary;
  }

  /**
   * Get inventory by product (group variants)
   */
  async getInventoryByProduct() {
    const inventory = await this.getInventory();
    
    const grouped = inventory.reduce((acc: any, item) => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = {
          product_name: item.product_name,
          variants: [],
          total_stock: 0,
          total_produced: 0,
          total_sold: 0
        };
      }

      acc[item.product_name].variants.push(item);
      acc[item.product_name].total_stock += item.current_stock;
      acc[item.product_name].total_produced += item.total_produced;
      acc[item.product_name].total_sold += item.total_sold;

      return acc;
    }, {});

    return Object.values(grouped);
  }

  /**
   * Update inventory unit price
   */
  async updateUnitPrice(productName: string, variant: string | null, newPrice: number): Promise<{success: boolean, error?: string}> {
    try {
      let query = this.supabase.supabase
        .from('finished_goods_inventory')
        .update({ unit_price: newPrice })
        .eq('product_name', productName);

      if (variant) {
        query = query.eq('product_variant', variant);
      } else {
        query = query.is('product_variant', null);
      }

      const { error } = await query;

      if (error) throw error;

      console.log('[InventoryService] Unit price updated successfully');
      return { success: true };

    } catch (error: any) {
      console.error('[InventoryService] updateUnitPrice error:', error);
      return { success: false, error: error.message || 'Failed to update price' };
    }
  }

  /**
   * Update low stock alert threshold
   */
  async updateLowStockAlert(productName: string, variant: string | null, threshold: number): Promise<{success: boolean, error?: string}> {
    try {
      let query = this.supabase.supabase
        .from('finished_goods_inventory')
        .update({ low_stock_alert: threshold })
        .eq('product_name', productName);

      if (variant) {
        query = query.eq('product_variant', variant);
      } else {
        query = query.is('product_variant', null);
      }

      const { error } = await query;

      if (error) throw error;

      console.log('[InventoryService] Low stock alert updated successfully');
      return { success: true };

    } catch (error: any) {
      console.error('[InventoryService] updateLowStockAlert error:', error);
      return { success: false, error: error.message || 'Failed to update alert' };
    }
  }

  /**
   * Get raw materials stock
   */
  async getMaterialsStock(): Promise<MaterialStock[]> {
    const { data, error } = await this.supabase.supabase
      .from('raw_materials_master')
      .select('*')
      .eq('active', true)
      .order('material_name', { ascending: true });

    if (error) {
      console.error('[InventoryService] getMaterialsStock error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get low stock alerts for raw materials
   */
  async getMaterialsLowStockAlerts(): Promise<MaterialStock[]> {
    const materials = await this.getMaterialsStock();
    return materials.filter(item => item.current_stock < item.low_stock_alert);
  }

  /**
   * Get materials stock summary
   */
  async getMaterialsStockSummary() {
    const materials = await this.getMaterialsStock();

    const summary = {
      total_materials: materials.length,
      low_stock_materials: materials.filter(m => m.current_stock < m.low_stock_alert).length,
      out_of_stock_materials: materials.filter(m => m.current_stock === 0).length,
      inventory_value: materials.reduce((sum, m) => sum + (m.current_stock * m.unit_cost), 0)
    };

    return summary;
  }

  /**
   * Get specific material stock
   */
  async getMaterialStock(materialName: string): Promise<MaterialStock | null> {
    const { data, error } = await this.supabase.supabase
      .from('raw_materials_master')
      .select('*')
      .eq('material_name', materialName)
      .single();

    if (error) {
      console.error('[InventoryService] getMaterialStock error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get display name for product (includes variant)
   */
  getProductDisplayName(product: FinishedGood): string {
    if (product.product_variant) {
      return `${product.product_name} (${product.product_variant})`;
    }
    return product.product_name;
  }

  /**
   * Check if product needs restock
   */
  needsRestock(product: FinishedGood): boolean {
    return product.current_stock < product.low_stock_alert;
  }

  /**
   * Check if material needs restock
   */
  materialNeedsRestock(material: MaterialStock): boolean {
    return material.current_stock < material.low_stock_alert;
  }

  /**
   * Get inventory valuation
   */
  async getInventoryValuation() {
    const inventory = await this.getInventory();
    const materials = await this.getMaterialsStock();

    return {
      finished_goods_value: inventory.reduce((sum, item) => 
        sum + (item.current_stock * item.unit_cost), 0
      ),
      raw_materials_value: materials.reduce((sum, item) => 
        sum + (item.current_stock * item.unit_cost), 0
      ),
      total_inventory_value: 
        inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0) +
        materials.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
    };
  }
}
