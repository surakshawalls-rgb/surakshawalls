// src/app/services/wastage.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface YardLoss {
  id: string;
  date: string;
  product_name: string;
  quantity: number;
  stage: 'stacking' | 'loading' | 'transport';
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface WastageData {
  date: string;
  product_name: string;
  quantity: number;
  stage: 'stacking' | 'loading' | 'transport';
  reason?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class WastageService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Record yard loss
   */
  async recordYardLoss(wastageData: WastageData): Promise<{success: boolean, yardLoss?: YardLoss, error?: string}> {
    try {
      // 1. Insert yard loss record
      const { data: yardLoss, error: insertError } = await this.supabase.supabase
        .from('yard_loss')
        .insert(wastageData)
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Deduct from finished goods inventory
      await this.supabase.supabase.rpc('increment_finished_goods', {
        p_product_name: wastageData.product_name,
        p_quantity: -wastageData.quantity
      });

      return { success: true, yardLoss };

    } catch (error: any) {
      console.error('[WastageService] recordYardLoss error:', error);
      return { success: false, error: error.message || 'Failed to record yard loss' };
    }
  }

  /**
   * Get yard loss history
   */
  async getYardLossHistory(startDate?: string, endDate?: string): Promise<YardLoss[]> {
    let query = this.supabase.supabase
      .from('yard_loss')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[WastageService] getYardLossHistory error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get yard loss by stage
   */
  async getYardLossByStage(stage: 'stacking' | 'loading' | 'transport', startDate?: string, endDate?: string): Promise<YardLoss[]> {
    let query = this.supabase.supabase
      .from('yard_loss')
      .select('*')
      .eq('stage', stage)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[WastageService] getYardLossByStage error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get wastage summary
   */
  async getWastageSummary(startDate: string, endDate: string) {
    const losses = await this.getYardLossHistory(startDate, endDate);

    return {
      total_quantity: losses.reduce((sum, l) => sum + l.quantity, 0),
      total_records: losses.length,
      by_stage: {
        stacking: losses.filter(l => l.stage === 'stacking').reduce((sum, l) => sum + l.quantity, 0),
        loading: losses.filter(l => l.stage === 'loading').reduce((sum, l) => sum + l.quantity, 0),
        transport: losses.filter(l => l.stage === 'transport').reduce((sum, l) => sum + l.quantity, 0)
      },
      by_product: losses.reduce((acc: any, l) => {
        if (!acc[l.product_name]) {
          acc[l.product_name] = 0;
        }
        acc[l.product_name] += l.quantity;
        return acc;
      }, {})
    };
  }

  /**
   * Delete yard loss record
   */
  async deleteYardLoss(id: string): Promise<{success: boolean, error?: string}> {
    try {
      // Get record before deletion to restore stock
      const { data: record } = await this.supabase.supabase
        .from('yard_loss')
        .select('*')
        .eq('id', id)
        .single();

      if (!record) throw new Error('Yard loss record not found');

      // Restore stock
      await this.supabase.supabase.rpc('increment_finished_goods', {
        p_product_name: record.product_name,
        p_quantity: record.quantity
      });

      // Delete record
      const { error: deleteError } = await this.supabase.supabase
        .from('yard_loss')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { success: true };

    } catch (error: any) {
      console.error('[WastageService] deleteYardLoss error:', error);
      return { success: false, error: error.message || 'Failed to delete yard loss' };
    }
  }
}
