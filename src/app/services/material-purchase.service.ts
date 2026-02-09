// src/app/services/material-purchase.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface MaterialPurchase {
  id: string;
  date: string;
  material_name: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  vendor_name: string | null;
  partner_id: string | null;
  paid_from: 'office_cash' | 'partner_pocket';
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface PurchaseData {
  date: string;
  material_name: string;
  quantity: number;
  unit_cost: number;
  vendor_name?: string;
  partner_id?: string;
  paid_from: 'office_cash' | 'partner_pocket';
  invoice_number?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class MaterialPurchaseService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Record material purchase
   */
  async recordPurchase(purchaseData: PurchaseData): Promise<{success: boolean, purchase?: MaterialPurchase, error?: string}> {
    try {
      // 1. Insert purchase record (total_amount is a generated column)
      const { data: purchase, error: purchaseError } = await this.supabase.supabase
        .from('raw_materials_purchase')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 2. Increment material stock
      await this.supabase.supabase.rpc('increment_material_stock', {
        p_material_name: purchaseData.material_name,
        p_quantity: purchaseData.quantity
      });

      // 3. Update material unit cost and last purchase
      await this.supabase.supabase
        .from('raw_materials_master')
        .update({
          unit_cost: purchaseData.unit_cost,
          last_purchase_date: purchaseData.date,
          last_purchase_rate: purchaseData.unit_cost
        })
        .eq('material_name', purchaseData.material_name);

      // 4. Record in firm cash if paid from office
      if (purchaseData.paid_from === 'office_cash') {
        await this.supabase.supabase
          .from('firm_cash_ledger')
          .insert({
            date: purchaseData.date,
            type: 'payment',
            amount: purchaseData.quantity * purchaseData.unit_cost,
            category: 'purchase',
            partner_id: purchaseData.partner_id,
            deposited_to_firm: false,
            description: `Purchase ${purchaseData.material_name} - ${purchaseData.quantity} units from ${purchaseData.vendor_name || 'vendor'}`,
            reference_id: purchase.id
          });
      }

      return { success: true, purchase };

    } catch (error: any) {
      console.error('[MaterialPurchaseService] recordPurchase error:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory(startDate?: string, endDate?: string): Promise<MaterialPurchase[]> {
    let query = this.supabase.supabase
      .from('raw_materials_purchase')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[MaterialPurchaseService] getPurchaseHistory error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get purchases by partner
   */
  async getPurchasesByPartner(partnerId: string, startDate?: string, endDate?: string): Promise<MaterialPurchase[]> {
    let query = this.supabase.supabase
      .from('raw_materials_purchase')
      .select('*')
      .eq('partner_id', partnerId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[MaterialPurchaseService] getPurchasesByPartner error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get purchase summary
   */
  async getPurchaseSummary(startDate: string, endDate: string) {
    const purchases = await this.getPurchaseHistory(startDate, endDate);

    return {
      total_purchases: purchases.length,
      total_amount: purchases.reduce((sum, p) => sum + p.total_amount, 0),
      office_cash_spent: purchases.filter(p => p.paid_from === 'office_cash').reduce((sum, p) => sum + p.total_amount, 0),
      partner_pocket_spent: purchases.filter(p => p.paid_from === 'partner_pocket').reduce((sum, p) => sum + p.total_amount, 0),
      by_material: purchases.reduce((acc: any, p) => {
        if (!acc[p.material_name]) {
          acc[p.material_name] = { quantity: 0, amount: 0 };
        }
        acc[p.material_name].quantity += p.quantity;
        acc[p.material_name].amount += p.total_amount;
        return acc;
      }, {})
    };
  }
}
