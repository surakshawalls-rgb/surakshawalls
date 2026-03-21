import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { ProductionService } from '../../services/production.service';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';

interface PendingEntry {
  id: string;
  submitted_by: string;
  submitter_name?: string;
  entry_date: string;
  production_data: any[];
  labor_data: any[];
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, MfgFooterComponent],
  templateUrl: './pending-approvals.html',
  styleUrls: ['./pending-approvals.css']
})
export class PendingApprovalsComponent implements OnInit, OnDestroy {
  entries: PendingEntry[] = [];
  filteredEntries: PendingEntry[] = [];
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  
  // Modal states
  showDetailModal = false;
  showRejectModal = false;
  selectedEntry: PendingEntry | null = null;
  rejectionReason = '';
  
  private routerSubscription?: Subscription;
  private realtimeSubscription?: any;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private productionService: ProductionService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('PendingApprovalsComponent initialized');
    this.loadEntries();
    this.setupRealtimeSubscription();
    
    // Reload data when navigating to this route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/pending-approvals') {
        console.log('Navigated to pending-approvals, reloading data...');
        this.loadEntries();
      }
    });
  }
  
  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.realtimeSubscription) {
      this.supabase.supabase.removeChannel(this.realtimeSubscription);
    }
  }
  
  setupRealtimeSubscription() {
    console.log('Setting up realtime subscription for pending entries');
    this.realtimeSubscription = this.supabase.supabase
      .channel('pending-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_daily_entries'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          this.loadEntries();
        }
      )
      .subscribe();
  }
  
  refreshData() {
    console.log('Manual refresh triggered');
    this.loadEntries();
  }

  async loadEntries() {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      console.log('Starting to load entries...');
      
      // Clear existing entries to force UI update
      this.entries = [];
      this.filteredEntries = [];
      this.cd.detectChanges();
      
      // Fetch pending entries without any caching - ensure fresh data
      const { data: entries, error } = await this.supabase.supabase
        .from('pending_daily_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Raw entries from database:', entries);
      
      // Map entries with submitter name already in the data
      this.entries = (entries || []).map((entry: any) => ({
        ...entry,
        submitter_name: entry.submitted_by_name || 'Unknown'
      }));
      
      console.log('Loaded entries:', this.entries.length, 'total entries');
      console.log('Status breakdown:', {
        pending: this.getStatusCount('pending'),
        approved: this.getStatusCount('approved'),
        rejected: this.getStatusCount('rejected')
      });
      
      this.applyFilter();
      
    } catch (error: any) {
      console.error('Error loading entries:', error);
      this.errorMessage = `Failed to load entries: ${error.message}`;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  applyFilter() {
    if (this.filterStatus === 'all') {
      this.filteredEntries = this.entries;
    } else {
      this.filteredEntries = this.entries.filter(e => e.status === this.filterStatus);
    }
    this.cd.detectChanges();
  }

  setFilter(status: 'all' | 'pending' | 'approved' | 'rejected') {
    this.filterStatus = status;
    this.applyFilter();
    this.cd.detectChanges();
  }

  getStatusCount(status: 'pending' | 'approved' | 'rejected'): number {
    return this.entries.filter(e => e.status === status).length;
  }

  viewDetails(entry: PendingEntry) {
    this.selectedEntry = entry;
    this.showDetailModal = true;
    this.cd.detectChanges();
  }

  closeModal() {
    this.showDetailModal = false;
    this.showRejectModal = false;
    this.selectedEntry = null;
    this.rejectionReason = '';
    this.cd.detectChanges();
  }

  openRejectModal(entry: PendingEntry) {
    this.selectedEntry = entry;
    this.rejectionReason = '';
    this.showRejectModal = true;
    this.cd.detectChanges();
  }

  async approveEntry(entry: PendingEntry) {
    if (!confirm(`Approve entry for ${this.formatDate(entry.entry_date)}?`)) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const hasProduction = entry.production_data && entry.production_data.length > 0;
      const hasWorkers = entry.labor_data && entry.labor_data.length > 0;

      // CASE 1: Production WITH workers
      if (hasProduction && hasWorkers) {
        // Only attach workers to the FIRST production item to avoid duplication
        for (let i = 0; i < entry.production_data.length; i++) {
          const prodItem = entry.production_data[i];
          
          const productionData = {
            date: entry.entry_date,
            product_name: prodItem.product_name,
            product_variant: prodItem.product_variant || null,
            success_quantity: prodItem.quantity || 0,
            rejected_quantity: prodItem.rejected_quantity || 0,
            workers: i === 0 ? (entry.labor_data || []).map((worker: any) => ({
              worker_id: worker.worker_id,
              worker_name: worker.worker_name,
              attendance_type: worker.attendance_type,
              wage_earned: worker.wage_earned,
              paid_today: worker.paid_today || 0,
              paid_by_partner_id: worker.paid_by_partner_id || null
            })) : [], // Empty workers for subsequent production items
            is_job_work: prodItem.is_job_work || false,
            notes: entry.notes || undefined,
            created_by: currentUser.id
          };

          const result = await this.productionService.saveProduction(productionData);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to save production');
          }
        }
      }
      // CASE 2: Production WITHOUT workers
      else if (hasProduction && !hasWorkers) {
        for (const prodItem of entry.production_data) {
          const productionData = {
            date: entry.entry_date,
            product_name: prodItem.product_name,
            product_variant: prodItem.product_variant || null,
            success_quantity: prodItem.quantity || 0,
            rejected_quantity: prodItem.rejected_quantity || 0,
            workers: [],
            is_job_work: prodItem.is_job_work || false,
            notes: entry.notes || undefined,
            created_by: currentUser.id
          };

          const result = await this.productionService.saveProduction(productionData);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to save production');
          }
        }
      }
      // CASE 3: ONLY workers (no production) - directly insert wage entries
      else if (!hasProduction && hasWorkers) {
        for (const worker of entry.labor_data) {
          // Insert wage entry directly
          const { error: wageError } = await this.supabase.supabase
            .from('wage_entries')
            .insert({
              date: entry.entry_date,
              worker_id: worker.worker_id,
              production_entry_id: null,
              attendance_type: worker.attendance_type,
              wage_earned: worker.wage_earned,
              paid_today: worker.paid_today || 0,
              payment_mode: (worker.paid_today || 0) > 0 ? 'cash' : 'unpaid',
              paid_by_partner_id: worker.paid_by_partner_id || null,
              notes: entry.notes
            });

          if (wageError) throw wageError;

          // Update worker balance using RPC
          const balance = worker.wage_earned - (worker.paid_today || 0);
          const { error: balanceError } = await this.supabase.supabase.rpc('update_worker_balance', {
            p_worker_id: worker.worker_id,
            p_balance_change: balance,
            p_earned: worker.wage_earned,
            p_paid: worker.paid_today || 0
          });

          if (balanceError) throw balanceError;

          // If paid, record in firm cash ledger
          if ((worker.paid_today || 0) > 0) {
            await this.supabase.supabase
              .from('firm_cash_ledger')
              .insert({
                date: entry.entry_date,
                type: 'payment',
                amount: worker.paid_today,
                category: 'wage',
                partner_id: worker.paid_by_partner_id || null,
                description: `Wage payment to ${worker.worker_name}`,
                deposited_to_firm: false
              });
          }
        }
      }

      // Update pending entry status
      console.log('Updating entry status to approved:', entry.id);
      const { error: updateError } = await this.supabase.supabase
        .from('pending_daily_entries')
        .update({
          status: 'approved',
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (updateError) throw updateError;
      console.log('Entry status updated successfully');

      // Close modal first
      this.closeModal();
      
      // Set success message
      this.successMessage = `✅ Entry approved and saved for ${this.formatDate(entry.entry_date)}`;
      
      // Reload entries immediately
      console.log('Reloading entries after approval...');
      await this.loadEntries();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);

    } catch (error: any) {
      console.error('Error approving entry:', error);
      this.errorMessage = `❌ ${error.message}`;
    } finally {
      this.saving = false;
      this.cd.detectChanges();
    }
  }

  async rejectEntry() {
    if (!this.selectedEntry) return;

    if (!this.rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Update entry status directly
      console.log('Updating entry status to rejected:', this.selectedEntry.id);
      const { error } = await this.supabase.supabase
        .from('pending_daily_entries')
        .update({
          status: 'rejected',
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: this.rejectionReason
        })
        .eq('id', this.selectedEntry.id);

      if (error) throw error;
      console.log('Entry status updated successfully');

      // Close modal first
      this.closeModal();
      
      // Set success message
      this.successMessage = `✅ Entry rejected`;
      
      // Reload entries immediately
      console.log('Reloading entries after rejection...');
      await this.loadEntries();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);

    } catch (error: any) {
      console.error('Error rejecting entry:', error);
      this.errorMessage = `❌ ${error.message}`;
    } finally {
      this.saving = false;
      this.cd.detectChanges();
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalProductionQty(entry: PendingEntry): number {
    return entry.production_data.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getTotalLaborCost(entry: PendingEntry): number {
    return entry.labor_data.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  }
}
