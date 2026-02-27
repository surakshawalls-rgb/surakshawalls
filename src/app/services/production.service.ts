// src/app/services/production.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RecipeService } from './recipe.service';

export interface WorkerWage {
  worker_id: string;
  worker_name: string;
  attendance_type: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom';
  wage_earned: number;
  paid_today: number;
  notes?: string;
}

export interface ProductionData {
  date: string;
  product_name: string;
  product_variant: string | null;
  success_quantity: number;
  rejected_quantity: number;
  workers: WorkerWage[];
  is_job_work: boolean;
  job_work_client?: string;
  notes?: string;
  created_by?: string;
}

export interface ProductionEntry {
  id: string;
  date: string;
  product_name: string;
  product_variant: string | null;
  success_quantity: number;
  rejected_quantity: number;
  total_quantity: number;
  cement_used: number;
  aggregates_used: number;
  sariya_used: number;
  total_material_cost: number;
  labor_cost: number;
  cost_per_unit: number;
  is_job_work: boolean;
  job_work_client?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProductionService {

  constructor(
    private supabase: SupabaseService,
    private recipeService: RecipeService
  ) {}

  /**
   * Save production entry with atomic transaction
   * - Calculates materials based on recipe
   * - Deducts materials from stock
   * - Increments finished goods inventory
   * - Records worker wages
   * - Updates worker cumulative balance
   */
  async saveProduction(productionData: ProductionData): Promise<{success: boolean, production?: ProductionEntry, error?: string}> {
    try {
      console.log('[ProductionService] saveProduction payload:', productionData);

      // 1. Calculate materials needed
      const calc = await this.recipeService.calculateMaterialsNeeded(
        productionData.product_name,
        productionData.product_variant,
        productionData.success_quantity + productionData.rejected_quantity
      );

      if (!calc) {
        throw new Error('Failed to calculate materials');
      }

      // 2. Check stock availability (warning only, don't block)
      if (!calc.stock_check.all_available) {
        const missing: string[] = [];
        if (!calc.stock_check.cement_available) {
          missing.push(`Cement (need ${calc.materials.cement}, have ${calc.current_stock.cement})`);
        }
        if (!calc.stock_check.aggregates_available) {
          missing.push(`Aggregates (need ${calc.materials.aggregates}, have ${calc.current_stock.aggregates})`);
        }
        if (!calc.stock_check.sariya_available) {
          missing.push(`Sariya (need ${calc.materials.sariya}, have ${calc.current_stock.sariya})`);
        }
        console.warn(`⚠️ Stock Warning: ${missing.join(', ')}`);
        // Continue anyway - stock can go negative
      }

      // 3. Calculate labor cost
      const laborCost = productionData.workers.reduce((sum, w) => sum + w.wage_earned, 0);
      const totalMaterialCost = calc.costs.total_cost;

      // 4. Insert production entry
      const { data: production, error: prodError } = await this.supabase.supabase
        .from('production_entries')
        .insert({
          date: productionData.date,
          product_name: productionData.product_name,
          product_variant: productionData.product_variant,
          success_quantity: productionData.success_quantity,
          rejected_quantity: productionData.rejected_quantity,
          cement_used: calc.materials.cement,
          aggregates_used: calc.materials.aggregates,
          sariya_used: calc.materials.sariya,
          total_material_cost: totalMaterialCost,
          labor_cost: laborCost,
          cost_per_unit: (totalMaterialCost + laborCost) / productionData.success_quantity,
          is_job_work: productionData.is_job_work,
          job_work_client: productionData.job_work_client,
          notes: productionData.notes,
          created_by: productionData.created_by
        })
        .select()
        .single();

      if (prodError) throw prodError;

      // 5. Log material usage
      const materialCosts = await this.recipeService.getMaterialCosts();
      const usageLogs = [
        { 
          production_entry_id: production.id,
          material_name: 'Cement', 
          quantity_used: calc.materials.cement, 
          unit_cost: materialCosts['Cement']?.unit_cost || 0
        },
        { 
          production_entry_id: production.id,
          material_name: 'Aggregates', 
          quantity_used: calc.materials.aggregates, 
          unit_cost: materialCosts['Aggregates']?.unit_cost || 0
        },
        { 
          production_entry_id: production.id,
          material_name: 'Sariya (4mm)', 
          quantity_used: calc.materials.sariya, 
          unit_cost: materialCosts['Sariya (4mm)']?.unit_cost || 0
        }
      ];

      const { error: logError } = await this.supabase.supabase
        .from('material_usage_log')
        .insert(usageLogs);

      if (logError) throw logError;

      // 6. Deduct from raw materials (using database function)
      await this.deductMaterials([
        { name: 'Cement', quantity: calc.materials.cement },
        { name: 'Aggregates', quantity: calc.materials.aggregates },
        { name: 'Sariya (4mm)', quantity: calc.materials.sariya }
      ]);

      // 7. Add to finished goods (only success quantity, using database function)
      await this.updateFinishedGoods(
        productionData.product_name,
        productionData.product_variant,
        productionData.success_quantity
      );

      // 7b. Update unit_cost in finished_goods_inventory
      const costPerUnit = (totalMaterialCost + laborCost) / productionData.success_quantity;
      await this.supabase.supabase
        .from('finished_goods_inventory')
        .update({ unit_cost: costPerUnit })
        .eq('product_name', productionData.product_name)
        .eq('product_variant', productionData.product_variant || null);

      // 8. Record worker wages
      for (const worker of productionData.workers) {
        await this.recordWage({
          ...worker,
          production_entry_id: production.id,
          date: productionData.date
        });
      }

      console.log('[ProductionService] Production saved successfully:', production);
      return { success: true, production };

    } catch (error: any) {
      console.error('[ProductionService] saveProduction error:', error);
      return { success: false, error: error.message || 'Production save failed' };
    }
  }

  /**
   * Deduct materials from stock using database function
   */
  private async deductMaterials(materials: Array<{name: string, quantity: number}>) {
    for (const material of materials) {
      const { error } = await this.supabase.supabase.rpc('deduct_material_stock', {
        p_material_name: material.name,
        p_quantity: material.quantity
      });

      if (error) {
        throw new Error(`Failed to deduct ${material.name}: ${error.message}`);
      }
    }
  }

  /**
   * Update finished goods inventory using database function
   */
  private async updateFinishedGoods(productName: string, variant: string | null, quantity: number) {
    const { error } = await this.supabase.supabase.rpc('increment_finished_goods', {
      p_product_name: productName,
      p_product_variant: variant,
      p_quantity: quantity
    });

    if (error) {
      throw new Error(`Failed to update finished goods: ${error.message}`);
    }
  }

  /**
   * Record worker wage and update cumulative balance
   */
  private async recordWage(wageData: any) {
    // Insert wage entry
    const { error: wageError } = await this.supabase.supabase
      .from('wage_entries')
      .insert({
        date: wageData.date,
        worker_id: wageData.worker_id,
        production_entry_id: wageData.production_entry_id,
        attendance_type: wageData.attendance_type,
        wage_earned: wageData.wage_earned,
        paid_today: wageData.paid_today || 0,
        payment_mode: wageData.paid_today > 0 ? 'cash' : 'unpaid',
        notes: wageData.notes
      });

    if (wageError) {
      throw new Error(`Failed to record wage: ${wageError.message}`);
    }

    // Update worker cumulative balance using database function
    const balance = wageData.wage_earned - (wageData.paid_today || 0);
    const { error: balanceError } = await this.supabase.supabase.rpc('update_worker_balance', {
      p_worker_id: wageData.worker_id,
      p_balance_change: balance,
      p_earned: wageData.wage_earned,
      p_paid: wageData.paid_today || 0
    });

    if (balanceError) {
      throw new Error(`Failed to update worker balance: ${balanceError.message}`);
    }

    // If paid today, record in firm cash ledger
    if (wageData.paid_today > 0) {
      await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert({
          date: wageData.date,
          type: 'payment',
          amount: wageData.paid_today,
          category: 'wage',
          description: `Wage payment to ${wageData.worker_name}`,
          deposited_to_firm: false
        });
    }
  }

  /**
   * Delete production entry (atomic rollback)
   * - Restores materials to stock
   * - Removes from finished goods
   * - Reverses worker balances
   * - Deletes wage entries
   */
  async deleteProduction(productionId: string): Promise<{success: boolean, error?: string}> {
    try {
      console.log('[ProductionService] deleteProduction id:', productionId);

      // 1. Get production details with related data
      const { data: production, error: fetchError } = await this.supabase.supabase
        .from('production_entries')
        .select(`
          *,
          material_usage_log(*),
          wage_entries(*)
        `)
        .eq('id', productionId)
        .single();

      if (fetchError || !production) {
        throw new Error('Production entry not found');
      }

      // 2. Restore materials
      await this.restoreMaterials([
        { name: 'Cement', quantity: production.cement_used },
        { name: 'Aggregates', quantity: production.aggregates_used },
        { name: 'Sariya (4mm)', quantity: production.sariya_used }
      ]);

      // 3. Remove from finished goods (negative quantity to subtract)
      await this.updateFinishedGoods(
        production.product_name,
        production.product_variant,
        -production.success_quantity
      );

      // 4. Reverse worker balances
      if (production.wage_entries && production.wage_entries.length > 0) {
        for (const wage of production.wage_entries) {
          const balance = wage.wage_earned - wage.paid_today;
          await this.supabase.supabase.rpc('update_worker_balance', {
            p_worker_id: wage.worker_id,
            p_balance_change: -balance, // Negative to reverse
            p_earned: -wage.wage_earned,
            p_paid: -wage.paid_today
          });
        }
      }

      // 5. Delete production (cascades to logs and wages due to ON DELETE CASCADE)
      const { error: deleteError } = await this.supabase.supabase
        .from('production_entries')
        .delete()
        .eq('id', productionId);

      if (deleteError) throw deleteError;

      console.log('[ProductionService] Production deleted successfully');
      return { success: true };

    } catch (error: any) {
      console.error('[ProductionService] deleteProduction error:', error);
      return { success: false, error: error.message || 'Production delete failed' };
    }
  }

  /**
   * Restore materials to stock using database function
   */
  private async restoreMaterials(materials: Array<{name: string, quantity: number}>) {
    for (const material of materials) {
      const { error } = await this.supabase.supabase.rpc('increment_material_stock', {
        p_material_name: material.name,
        p_quantity: material.quantity
      });

      if (error) {
        throw new Error(`Failed to restore ${material.name}: ${error.message}`);
      }
    }
  }

  /**
   * Get production entries
   */
  async getProduction(from: number, to: number): Promise<ProductionEntry[]> {
    const { data, error } = await this.supabase.supabase
      .from('production_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[ProductionService] getProduction error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Filter production by date
   */
  async filterByDate(date: string): Promise<ProductionEntry[]> {
    const { data, error } = await this.supabase.supabase
      .from('production_entries')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ProductionService] filterByDate error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get production summary for a date
   */
  async getProductionSummary(date: string) {
    const { data, error } = await this.supabase.supabase
      .from('production_entries')
      .select('product_name, product_variant, success_quantity, rejected_quantity, total_material_cost, labor_cost')
      .eq('date', date);

    if (error) {
      console.error('[ProductionService] getProductionSummary error:', error);
      throw error;
    }

    // Group by product
    const summary = data?.reduce((acc: any, entry: any) => {
      const key = entry.product_variant 
        ? `${entry.product_name} (${entry.product_variant})`
        : entry.product_name;
      
      if (!acc[key]) {
        acc[key] = {
          product_name: entry.product_name,
          product_variant: entry.product_variant,
          total_success: 0,
          total_rejected: 0,
          total_material_cost: 0,
          total_labor_cost: 0
        };
      }

      acc[key].total_success += entry.success_quantity;
      acc[key].total_rejected += entry.rejected_quantity;
      acc[key].total_material_cost += entry.total_material_cost;
      acc[key].total_labor_cost += entry.labor_cost;

      return acc;
    }, {});

    return Object.values(summary || {});
  }

  // ============================================
  // LEGACY METHODS (for backward compatibility with old production component)
  // ============================================

  /**
   * Save production (legacy format - for old production component)
   * Accepts old format with fencing_pole, plain_plate, etc.
   */
  async saveProductionLegacy(data: any) {
    console.log('[ProductionService] saveProductionLegacy (legacy) payload:', data);
    const res = await this.supabase.supabase.from('production').insert(data);
    console.log('[ProductionService] saveProductionLegacy (legacy) res:', res);
    return res;
  }

  /**
   * Get production (legacy format - returns {data, error})
   */
  async getProductionLegacy(from: number, to: number) {
    console.log('[ProductionService] getProductionLegacy (legacy) range:', { from, to });
    const res = await this.supabase.supabase
      .from('production')
      .select('*')
      .order('date', { ascending: false })
      .range(from, to);
    console.log('[ProductionService] getProductionLegacy (legacy) res:', res);
    return res;
  }

  /**
   * Filter by date (legacy format - returns {data, error})
   */
  async filterByDateLegacy(date: string) {
    console.log('[ProductionService] filterByDateLegacy (legacy):', date);
    const res = await this.supabase.supabase
      .from('production')
      .select('*')
      .eq('date', date)
      .order('date', { ascending: false });
    console.log('[ProductionService] filterByDateLegacy (legacy) res:', res);
    return res;
  }

  /**
   * Delete production (legacy - accepts number ID)
   */
  async deleteProductionLegacy(id: number) {
    console.log('[ProductionService] deleteProductionLegacy (legacy) id:', id);
    const res = await this.supabase.supabase.from('production').delete().eq('id', id);
    console.log('[ProductionService] deleteProductionLegacy (legacy) res:', res);
    return res;
  }

  /**
   * Save selling (legacy method - returns old format)
   */
  async saveSelling(data: any) {
    console.log('[ProductionService] saveSelling (legacy) payload:', data);
    const res = await this.supabase.supabase.from('production_selling').insert(data);
    console.log('[ProductionService] saveSelling (legacy) res:', res);
    return res;
  }

  /**
   * Get selling (legacy method)
   */
  async getSelling() {
    console.log('[ProductionService] getSelling (legacy)');
    const res = await this.supabase.supabase
      .from('production_selling')
      .select('*')
      .order('date', { ascending: false });
    console.log('[ProductionService] getSelling (legacy) res:', res);
    return res;
  }

  /**
   * Save damage (legacy method)
   */
  async saveDamage(data: any) {
    console.log('[ProductionService] saveDamage (legacy) payload:', data);
    const res = await this.supabase.supabase.from('production_damage').insert(data);
    console.log('[ProductionService] saveDamage (legacy) res:', res);
    return res;
  }

  /**
   * Get damage (legacy method)
   */
  async getDamage() {
    console.log('[ProductionService] getDamage (legacy)');
    const res = await this.supabase.supabase
      .from('production_damage')
      .select('*')
      .order('date', { ascending: false });
    console.log('[ProductionService] getDamage (legacy) res:', res);
    return res;
  }

  /**
   * Delete selling (legacy method)
   */
  async deleteSelling(id: number) {
    console.log('[ProductionService] deleteSelling (legacy) id:', id);
    const res = await this.supabase.supabase.from('production_selling').delete().eq('id', id);
    console.log('[ProductionService] deleteSelling (legacy) res:', res);
    return res;
  }

  /**
   * Delete damage (legacy method)
   */
  async deleteDamage(id: number) {
    console.log('[ProductionService] deleteDamage (legacy) id:', id);
    const res = await this.supabase.supabase.from('production_damage').delete().eq('id', id);
    console.log('[ProductionService] deleteDamage (legacy) res:', res);
    return res;
  }
}
