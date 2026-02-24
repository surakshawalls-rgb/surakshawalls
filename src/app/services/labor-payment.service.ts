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
   * Get all workers with outstanding wages
   */
  async getWorkersWithOutstanding(): Promise<WorkerOutstanding[]> {
    try {
      // Get all wage entries with outstanding
      const { data: wageEntries, error: wageError } = await this.supabase.supabase
        .from('wage_entries')
        .select(`
          id,
          date,
          worker_id,
          attendance_type,
          wage_earned,
          paid_today,
          workers_master!inner(id, name, phone)
        `)
        .order('date', { ascending: false });

      if (wageError) throw wageError;

      // Get all subsequent payments
      const { data: payments, error: paymentsError } = await this.supabase.supabase
        .from('wage_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Group by worker
      const workerMap = new Map<string, WorkerOutstanding>();

      wageEntries?.forEach((entry: any) => {
        const workerId = entry.worker_id;
        const worker = entry.workers_master;

        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            worker_id: workerId,
            worker_name: worker.name,
            phone: worker.phone,
            total_earned: 0,
            total_paid: 0,
            outstanding: 0,
            wage_entries: []
          });
        }

        // Calculate payments for this wage entry
        const entryPayments = payments?.filter((p: any) => p.wage_entry_id === entry.id) || [];
        const totalPaidLater = entryPayments.reduce((sum: number, p: any) => sum + p.amount_paid, 0);
        const currentOutstanding = entry.wage_earned - entry.paid_today - totalPaidLater;

        const workerData = workerMap.get(workerId)!;
        workerData.total_earned += entry.wage_earned;
        workerData.total_paid += entry.paid_today + totalPaidLater;
        workerData.outstanding += currentOutstanding;

        if (currentOutstanding > 0) {
          workerData.wage_entries.push({
            wage_entry_id: entry.id,
            work_date: entry.date,
            worker_id: workerId,
            worker_name: worker.name,
            attendance_type: entry.attendance_type,
            wage_earned: entry.wage_earned,
            paid_initially: entry.paid_today,
            total_paid_later: totalPaidLater,
            current_outstanding: currentOutstanding,
            payment_history: entryPayments
          });
        }
      });

      // Filter only workers with outstanding
      return Array.from(workerMap.values()).filter(w => w.outstanding > 0);
    } catch (error) {
      console.error('Error getting workers with outstanding:', error);
      throw error;
    }
  }

  /**
   * Record a payment for a wage entry
   */
  async recordPayment(payment: WagePayment): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the wage entry to validate
      const { data: wageEntry, error: wageError } = await this.supabase.supabase
        .from('wage_entries')
        .select('id, wage_earned, paid_today, worker_id')
        .eq('id', payment.wage_entry_id)
        .single();

      if (wageError) throw wageError;

      // Calculate current outstanding
      const { data: existingPayments } = await this.supabase.supabase
        .from('wage_payments')
        .select('amount_paid')
        .eq('wage_entry_id', payment.wage_entry_id);

      const totalPaidLater = existingPayments?.reduce((sum: number, p: any) => sum + p.amount_paid, 0) || 0;
      const currentOutstanding = wageEntry.wage_earned - wageEntry.paid_today - totalPaidLater;

      if (payment.amount_paid > currentOutstanding) {
        return {
          success: false,
          error: `Payment amount ₹${payment.amount_paid} exceeds outstanding ₹${currentOutstanding}`
        };
      }

      // Insert payment record
      const { error: insertError } = await this.supabase.supabase
        .from('wage_payments')
        .insert([{
          wage_entry_id: payment.wage_entry_id,
          worker_id: wageEntry.worker_id,
          payment_date: payment.payment_date,
          amount_paid: payment.amount_paid,
          paid_by_partner_id: payment.paid_by_partner_id || null,
          payment_mode: payment.payment_mode,
          notes: payment.notes
        }]);

      if (insertError) throw insertError;

      // Update worker cumulative balance
      const { error: updateError } = await this.supabase.supabase.rpc(
        'update_worker_balance',
        {
          p_worker_id: wageEntry.worker_id,
          p_amount: -payment.amount_paid  // Negative because we're reducing debt
        }
      );

      // If RPC doesn't exist, update manually
      if (updateError) {
        const { data: worker } = await this.supabase.supabase
          .from('workers_master')
          .select('cumulative_balance')
          .eq('id', wageEntry.worker_id)
          .single();

        if (worker) {
          await this.supabase.supabase
            .from('workers_master')
            .update({ cumulative_balance: worker.cumulative_balance - payment.amount_paid })
            .eq('id', wageEntry.worker_id);
        }
      }

      // Record in firm_cash_ledger
      const paidByName = payment.paid_by_partner_id ? 
        await this.getPartnerName(payment.paid_by_partner_id) : 'Firm Cash';

      await this.supabase.supabase
        .from('firm_cash_ledger')
        .insert([{
          transaction_date: payment.payment_date,
          transaction_type: 'expense',
          category: 'labor_wage_payment',
          amount: payment.amount_paid,
          partner_id: payment.paid_by_partner_id || null,
          description: `Wage payment to worker (${paidByName})${payment.notes ? ' - ' + payment.notes : ''}`
        }]);

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
        .select(`
          *,
          partner_master(name)
        `)
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
        .select(`
          *,
          wage_entries(date, attendance_type, wage_earned, paid_today),
          partner_master(name)
        `)
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
   * Clear all outstanding for a wage entry
   */
  async clearOutstanding(
    wageEntryId: string,
    paidByPartnerId: string | null,
    paymentDate: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current outstanding
      const { data: wageEntry } = await this.supabase.supabase
        .from('wage_entries')
        .select('wage_earned, paid_today, worker_id')
        .eq('id', wageEntryId)
        .single();

      if (!wageEntry) {
        return { success: false, error: 'Wage entry not found' };
      }

      const { data: existingPayments } = await this.supabase.supabase
        .from('wage_payments')
        .select('amount_paid')
        .eq('wage_entry_id', wageEntryId);

      const totalPaidLater = existingPayments?.reduce((sum: number, p: any) => sum + p.amount_paid, 0) || 0;
      const outstanding = wageEntry.wage_earned - wageEntry.paid_today - totalPaidLater;

      if (outstanding <= 0) {
        return { success: false, error: 'No outstanding amount' };
      }

      // Record full payment
      return await this.recordPayment({
        wage_entry_id: wageEntryId,
        worker_id: wageEntry.worker_id,
        payment_date: paymentDate,
        amount_paid: outstanding,
        paid_by_partner_id: paidByPartnerId || undefined,
        payment_mode: 'cash',
        notes: notes || 'Full outstanding cleared'
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
        .eq('partner_id', partnerId)
        .single();

      return data?.name || 'Unknown Partner';
    } catch (error) {
      return 'Unknown Partner';
    }
  }
}

