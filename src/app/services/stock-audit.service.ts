// src/app/services/stock-audit.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface StockAudit {
  id: string;
  date: string;
  material_name: string;
  digital_stock: number;
  physical_count: number;
  variance: number;
  variance_percentage: number;
  reason: string;
  approved_by: string;
  partners_notified: boolean;
  financial_impact: number | null;
  created_at: string;
}

export interface AuditData {
  date: string;
  material_name: string;
  physical_count: number;
  reason: string;
  approved_by: string;
}

@Injectable({ providedIn: 'root' })
export class StockAuditService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Create stock audit
   */
  async createAudit(auditData: AuditData): Promise<{success: boolean, audit?: StockAudit, error?: string}> {
    try {
      // Get current digital stock
      const { data: material } = await this.supabase.supabase
        .from('raw_materials_master')
        .select('current_stock, unit_cost')
        .eq('material_name', auditData.material_name)
        .single();

      if (!material) throw new Error('Material not found');

      const digitalStock = material.current_stock;
      const variance = auditData.physical_count - digitalStock;
      const varianceValue = Math.abs(variance) * material.unit_cost;

      // Insert audit record
      const { data: audit, error: insertError } = await this.supabase.supabase
        .from('stock_audit_log')
        .insert({
          date: auditData.date,
          material_name: auditData.material_name,
          digital_stock: digitalStock,
          physical_count: auditData.physical_count,
          reason: auditData.reason,
          approved_by: auditData.approved_by,
          financial_impact: varianceValue,
          partners_notified: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, audit };

    } catch (error: any) {
      console.error('[StockAuditService] createAudit error:', error);
      return { success: false, error: error.message || 'Failed to create audit' };
    }
  }

  /**
   * Approve audit and adjust stock
   */
  async approveAudit(auditId: string, approvedBy: string): Promise<{success: boolean, error?: string}> {
    try {
      // Get audit record
      const { data: audit } = await this.supabase.supabase
        .from('stock_audit_log')
        .select('*')
        .eq('id', auditId)
        .single();

      if (!audit) throw new Error('Audit record not found');

      // Update material stock to physical count
      await this.supabase.supabase
        .from('raw_materials_master')
        .update({ current_stock: audit.physical_count })
        .eq('material_name', audit.material_name);

      // Update audit approved_by field
      const { error: updateError } = await this.supabase.supabase
        .from('stock_audit_log')
        .update({
          approved_by: approvedBy,
          partners_notified: true
        })
        .eq('id', auditId);

      if (updateError) throw updateError;

      return { success: true };

    } catch (error: any) {
      console.error('[StockAuditService] approveAudit error:', error);
      return { success: false, error: error.message || 'Failed to approve audit' };
    }
  }

  /**
   * Reject audit (deletes the audit record)
   */
  async rejectAudit(auditId: string, approvedBy: string): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('stock_audit_log')
        .delete()
        .eq('id', auditId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[StockAuditService] rejectAudit error:', error);
      return { success: false, error: error.message || 'Failed to reject audit' };
    }
  }

  /**
   * Get audit history
   */
  async getAuditHistory(startDate?: string, endDate?: string): Promise<StockAudit[]> {
    let query = this.supabase.supabase
      .from('stock_audit_log')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('[StockAuditService] getAuditHistory error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get audit history (all audits are automatically approved in this system)
   */
  async getPendingAudits(): Promise<StockAudit[]> {
    // In the new system, audits are created and immediately applied
    // This returns empty array for backward compatibility
    return [];
  }

  /**
   * Get audit summary
   */
  async getAuditSummary(startDate: string, endDate: string) {
    const audits = await this.getAuditHistory(startDate, endDate);

    return {
      total_audits: audits.length,
      total_variance_value: audits
        .reduce((sum, a) => sum + Math.abs(a.financial_impact || 0), 0),
      by_material: audits.reduce((acc: any, a) => {
        if (!acc[a.material_name]) {
          acc[a.material_name] = {
            audits: 0,
            total_variance: 0,
            total_impact: 0
          };
        }
        acc[a.material_name].audits++;
        acc[a.material_name].total_variance += a.variance;
        acc[a.material_name].total_impact += a.financial_impact || 0;
        return acc;
      }, {})
    };
  }
}
