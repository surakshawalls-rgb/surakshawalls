// src/app/services/worker.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  cumulative_balance: number;
  total_days_worked: number;
  total_earned: number;
  total_paid: number;
  active: boolean;
  joined_date: string;
  notes?: string;
  created_at: string;
}

export interface WageEntry {
  id: string;
  date: string;
  worker_id: string;
  production_entry_id?: string;
  attendance_type: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom';
  wage_earned: number;
  paid_today: number;
  balance: number;
  payment_mode: 'cash' | 'unpaid';
  notes?: string;
  created_at: string;
}

export interface WorkerStatement {
  entry_date: string;
  attendance_type: string;
  wage_earned: number;
  paid_today: number;
  balance: number;
  running_balance: number;
}

export const WAGE_RATES = {
  'Full Day': 400,
  'Half Day': 200,
  'Outdoor': 450,
  'Custom': 0
};

@Injectable({ providedIn: 'root' })
export class WorkerService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all active workers
   */
  async getWorkers(): Promise<Worker[]> {
    const { data, error } = await this.supabase.supabase
      .from('workers_master')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[WorkerService] getWorkers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all workers (including inactive)
   */
  async getAllWorkers(): Promise<Worker[]> {
    const { data, error } = await this.supabase.supabase
      .from('workers_master')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[WorkerService] getAllWorkers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get worker by ID
   */
  async getWorker(workerId: string): Promise<Worker | null> {
    const { data, error } = await this.supabase.supabase
      .from('workers_master')
      .select('*')
      .eq('id', workerId)
      .single();

    if (error) {
      console.error('[WorkerService] getWorker error:', error);
      return null;
    }

    return data;
  }

  /**
   * Add new worker
   */
  async addWorker(name: string, phone?: string, notes?: string): Promise<{success: boolean, worker?: Worker, error?: string}> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('workers_master')
        .insert({
          name,
          phone,
          notes,
          cumulative_balance: 0,
          total_days_worked: 0,
          total_earned: 0,
          total_paid: 0,
          active: true,
          joined_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[WorkerService] Worker added successfully:', data);
      return { success: true, worker: data };

    } catch (error: any) {
      console.error('[WorkerService] addWorker error:', error);
      return { success: false, error: error.message || 'Failed to add worker' };
    }
  }

  /**
   * Update worker details
   */
  async updateWorker(workerId: string, updates: Partial<Worker>): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('workers_master')
        .update(updates)
        .eq('id', workerId);

      if (error) throw error;

      console.log('[WorkerService] Worker updated successfully');
      return { success: true };

    } catch (error: any) {
      console.error('[WorkerService] updateWorker error:', error);
      return { success: false, error: error.message || 'Failed to update worker' };
    }
  }

  /**
   * Deactivate worker (soft delete)
   */
  async deactivateWorker(workerId: string): Promise<{success: boolean, error?: string}> {
    return this.updateWorker(workerId, { active: false });
  }

  /**
   * Activate worker
   */
  async activateWorker(workerId: string): Promise<{success: boolean, error?: string}> {
    return this.updateWorker(workerId, { active: true });
  }

  /**
   * Get worker balance
   */
  async getWorkerBalance(workerId: string): Promise<number> {
    const worker = await this.getWorker(workerId);
    return worker?.cumulative_balance || 0;
  }

  /**
   * Get worker statement using database function
   */
  async getWorkerStatement(
    workerId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<WorkerStatement[]> {
    const { data, error } = await this.supabase.supabase.rpc('get_worker_statement', {
      p_worker_id: workerId,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (error) {
      console.error('[WorkerService] getWorkerStatement error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get wage entries for a worker
   */
  async getWageEntries(workerId: string, startDate?: string, endDate?: string): Promise<WageEntry[]> {
    let query = this.supabase.supabase
      .from('wage_entries')
      .select('*')
      .eq('worker_id', workerId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[WorkerService] getWageEntries error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get workers with outstanding balance (owed money)
   */
  async getWorkersWithOutstanding(): Promise<Worker[]> {
    const { data, error } = await this.supabase.supabase
      .from('workers_master')
      .select('*')
      .eq('active', true)
      .gt('cumulative_balance', 0)
      .order('cumulative_balance', { ascending: false });

    if (error) {
      console.error('[WorkerService] getWorkersWithOutstanding error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get total labor liability (all outstanding balances)
   */
  async getTotalLaborLiability(): Promise<number> {
    const workers = await this.getWorkersWithOutstanding();
    return workers.reduce((sum, worker) => sum + worker.cumulative_balance, 0);
  }

  /**
   * Pay worker (reduce cumulative balance)
   */
  async payWorker(
    workerId: string, 
    amount: number, 
    date: string,
    notes?: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      // Record wage entry with negative earned (payment only)
      const { error: wageError } = await this.supabase.supabase
        .from('wage_entries')
        .insert({
          date,
          worker_id: workerId,
          attendance_type: 'Custom',
          wage_earned: 0,
          paid_today: amount,
          payment_mode: 'cash',
          notes: notes || 'Direct payment'
        });

      if (wageError) throw wageError;

      // Update worker balance using database function
      const { error: balanceError } = await this.supabase.supabase.rpc('update_worker_balance', {
        p_worker_id: workerId,
        p_balance_change: -amount, // Negative because we're reducing debt
        p_earned: 0,
        p_paid: amount
      });

      if (balanceError) throw balanceError;

      // Record in firm cash ledger
      const worker = await this.getWorker(workerId);
      await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert({
          date,
          type: 'payment',
          amount,
          category: 'wage',
          description: `Payment to ${worker?.name || 'worker'}`,
          deposited_to_firm: false
        });

      console.log('[WorkerService] Payment recorded successfully');
      return { success: true };

    } catch (error: any) {
      console.error('[WorkerService] payWorker error:', error);
      return { success: false, error: error.message || 'Payment failed' };
    }
  }

  /**
   * Get wage rate based on attendance type
   */
  getWageRate(attendanceType: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom'): number {
    return WAGE_RATES[attendanceType];
  }

  /**
   * Get workers summary (for dashboard)
   */
  async getWorkersSummary() {
    const workers = await this.getAllWorkers();
    const activeWorkers = workers.filter(w => w.active);
    const totalLiability = activeWorkers.reduce((sum, w) => sum + w.cumulative_balance, 0);
    const workersOwed = activeWorkers.filter(w => w.cumulative_balance > 0).length;

    return {
      total_workers: workers.length,
      active_workers: activeWorkers.length,
      total_labor_liability: totalLiability,
      workers_owed_money: workersOwed,
      total_days_worked: activeWorkers.reduce((sum, w) => sum + w.total_days_worked, 0),
      total_earned: activeWorkers.reduce((sum, w) => sum + w.total_earned, 0),
      total_paid: activeWorkers.reduce((sum, w) => sum + w.total_paid, 0)
    };
  }
}
