import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface WagePayment {
  id?: string;
  wage_entry_id: string;
  worker_id: string;
  payment_date: string;
  amount_paid: number;
  paid_by_partner_id?: string;
  payment_mode: string;
  notes?: string;
  created_at?: string;
}

export interface WageEntryWithPayments {
  wage_entry_id: string;
  work_date: string;
  worker_id: string;
  worker_name: string;
  attendance_type: string;
  wage_earned: number;
  paid_initially: number;
  total_paid_later: number;
  current_outstanding: number;
  payment_history: WagePayment[];
}

export interface WorkerOutstanding {
  worker_id: string;
  worker_name: string;
  phone: string;
  total_earned: number;
  total_paid: number;
  outstanding: number;
  wage_entries: WageEntryWithPayments[];
}

@Injectable({
  providedIn: 'root'
})
export class LaborPaymentService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all workers with outstanding wages (using wage_payments table)
   */
  async getWorkersWithOutstanding(): Promise<WorkerOutstanding[]> {
    try {
      // Get workers from workers_master with cumulative balance
      const { data: workers, error: workersError } = await this.supabase.supabase
        .from('workers_master')
        .select('id, name, phone, cumulative_balance')
        .eq('active', true)
        .gt('cumulative_balance', 0)
        .order('cumulative_balance', { ascending: false });

      if (workersError) throw workersError;

      if (!workers || workers.length === 0) {
        return [];
      }

      // Get wage entries for these workers
      const workerIds = workers.map((w: any) => w.id);
      const { data: wageEntries, error: wageError } = await this.supabase.supabase
        .from('wage_entries')
        .select('id, date, worker_id, attendance_type, wage_earned, paid_today')
        .in('worker_id', workerIds)
        .order('date', { ascending: false});

      if (wageError) throw wageError;

      // Get all wage payments for these workers
      const { data: wagePayments, error: paymentsError } = await this.supabase.supabase
        .from('wage_payments')
        .select('*')
        .in('worker_id', workerIds);

      if (paymentsError) throw paymentsError;

      // Build worker outstanding list
      return workers.map((worker: any) => {
        const workerWageEntries = wageEntries?.filter((e: any) => e.worker_id === worker.id) || [];
        
        return {
          worker_id: worker.id,
          worker_name: worker.name,
          phone: worker.phone || '',
          total_earned: workerWageEntries.reduce((sum: number, e: any) => sum + (e.wage_earned || 0), 0),
          total_paid: workerWageEntries.reduce((sum: number, e: any) => sum + (e.paid_today || 0), 0),
          outstanding: worker.cumulative_balance,
          wage_entries: workerWageEntries.map((entry: any) => {
            const entryPayments = wagePayments?.filter((p: any) => p.wage_entry_id === entry.id) || [];
            const totalPaidLater = entryPayments.reduce((sum: number, p: any) => sum + p.amount_paid, 0);
            
            return {
              wage_entry_id: entry.id,
              work_date: entry.date,
              worker_id: worker.id,
              worker_name: worker.name,
              attendance_type: entry.attendance_type || 'Full Day',
              wage_earned: entry.wage_earned || 0,
              paid_initially: entry.paid_today || 0,
              total_paid_later: totalPaidLater,
              current_outstanding: (entry.wage_earned || 0) - (entry.paid_today || 0) - totalPaidLater,
              payment_history: entryPayments
            };
          })
        };
      });
    } catch (error) {
      console.error('Error getting workers with outstanding:', error);
      throw error;
    }
  }

  /**
   * Record a payment for a wage entry (using wage_payments table)
   */
  async recordPayment(payment: WagePayment): Promise<{ success: boolean; error?: string }> {
    try {
      // Get worker's current balance
      const { data: worker, error: workerError } = await this.supabase.supabase
        .from('workers_master')
        .select('cumulative_balance')
        .eq('id', payment.worker_id)
        .single();

      if (workerError) throw workerError;

      if (payment.amount_paid > worker.cumulative_balance) {
        return {
          success: false,
          error: `Payment amount ₹${payment.amount_paid} exceeds outstanding ₹${worker.cumulative_balance}`
        };
      }

      // Insert into wage_payments table
      const { error: insertError } = await this.supabase.supabase
        .from('wage_payments')
        .insert([{
          wage_entry_id: payment.wage_entry_id,
          worker_id: payment.worker_id,
          payment_date: payment.payment_date,
          amount_paid: payment.amount_paid,
          paid_by_partner_id: payment.paid_by_partner_id,
          payment_mode: payment.payment_mode,
          notes: payment.notes
        }]);

      if (insertError) throw insertError;

      // Record in firm_cash_ledger if paid from firm cash
      if (!payment.paid_by_partner_id) {
        await this.supabase.supabase
          .from('firm_cash_ledger')
          .insert([{
            date: payment.payment_date,
            type: 'payment',
            amount: payment.amount_paid,
            category: 'wage_payment',
            description: `Wage payment${payment.notes ? ' - ' + payment.notes : ''}`
          }]);
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get payment history for a specific wage entry
   */
  async getPaymentHistory(wageEntryId: string): Promise<WagePayment[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('wage_payments')
        .select('*')
        .eq('wage_entry_id', wageEntryId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Get all payments for a worker
   */
  async getWorkerPaymentHistory(workerId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('wage_payments')
        .select('*')
        .eq('worker_id', workerId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting worker payment history:', error);
      return [];
    }
  }

  /**
   * Clear all outstanding for a worker
   */
  async clearOutstanding(
    workerId: string,
    paidByPartnerId: string | null,
    paymentDate: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get worker's current balance
      const { data: worker } = await this.supabase.supabase
        .from('workers_master')
        .select('cumulative_balance')
        .eq('id', workerId)
        .single();

      if (!worker || worker.cumulative_balance <= 0) {
        return { success: false, error: 'No outstanding amount' };
      }

      // Record full payment
      return await this.recordPayment({
        wage_entry_id: '', // Not needed in simplified version
        worker_id: workerId,
        payment_date: paymentDate,
        amount_paid: worker.cumulative_balance,
        paid_by_partner_id: paidByPartnerId || undefined,
        payment_mode: 'cash',
        notes: notes || 'All outstanding cleared'
      });
    } catch (error) {
      console.error('Error clearing outstanding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Helper: Get partner name
   */
  private async getPartnerName(partnerId: string): Promise<string> {
    try {
      const { data } = await this.supabase.supabase
        .from('partner_master')
        .select('name')
        .eq('id', partnerId)
        .single();

      return data?.name || 'Unknown Partner';
    } catch (error) {
      return 'Unknown Partner';
    }
  }
}

