import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { LaborPaymentService, WorkerOutstanding, WagePayment, WageEntryWithPayments } from '../../services/labor-payment.service';

interface Labour {
  labour_id: string;
  name: string;
  phone: string;
  total_earned: number;
  total_paid: number;
  due_amount: number;
  status: string;
}

interface Partner {
  partner_id: string;
  name: string;
  profit_share: number;
}

interface PaymentRecord {
  labour_name: string;
  amount: number;
  paid_by_partner: string;
  date: string;
}

@Component({
  selector: 'app-labour-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './labour-ledger.html',
  styleUrls: ['./labour-ledger.css']
})
export class LabourLedgerComponent implements OnInit {

  labourList: Labour[] = [];
  workersWithOutstanding: WorkerOutstanding[] = [];
  selectedWorkerForHistory: WorkerOutstanding | null = null;
  showPaymentHistoryModal = false;
  partners: Partner[] = [];
  
  // New Labour form
  showAddForm = false;
  newLabourName: string = '';
  newLabourPhone: string = '';
  
  // Payment form
  showPaymentForm = false;
  selectedLabourId: string = '';
  selectedLabourName: string = '';
  selectedWageEntryId: string = '';
  paymentAmount: number = 0;
  paymentDate: string = '';
  paidByPartnerId: string = '';
  
  // Filter
  statusFilter: string = 'all';
  
  // UI state
  loading = false;
  successMessage = '';
  errorMessage = '';
  
  constructor(
    private db: SupabaseService,
    private laborPaymentService: LaborPaymentService,
    private cd: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loading = true;
    this.paymentDate = new Date().toISOString().split('T')[0];
    Promise.all([this.loadLabours(), this.loadWorkersWithOutstanding(), this.loadPartners()]).finally(() => {
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  async refreshData() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
    try {
      await Promise.all([this.loadLabours(), this.loadWorkersWithOutstanding(), this.loadPartners()]);
      this.successMessage = '✅ Data refreshed successfully!';
      this.cd.detectChanges();
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.errorMessage = '❌ Failed to refresh data';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async loadLabours() {
    try {
      const { data, error } = await this.db.queryView('labour_ledger');
      if (error) throw error;
      this.labourList = data || [];
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading labour ledger:', error);
      this.errorMessage = 'Failed to load labour ledger';
      this.cd.detectChanges();
    }
  }

  async loadWorkersWithOutstanding() {
    try {
      this.workersWithOutstanding = await this.laborPaymentService.getWorkersWithOutstanding();
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading workers with outstanding:', error);
      this.cd.detectChanges();
    }
  }

  async loadPartners() {
    try {
      const { data, error } = await this.db.queryView('partner_master');
      if (error) throw error;
      this.partners = data || [];
      if (this.partners.length > 0) {
        this.paidByPartnerId = this.partners[0].partner_id;
      }
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading partners:', error);
      this.cd.detectChanges();
    }
  }
  
  getFilteredLabours(): Labour[] {
    if (this.statusFilter === 'all') {
      return this.labourList;
    }
    return this.labourList.filter(l => l.status === this.statusFilter);
  }
  
  async addNewLabour() {
    if (!this.newLabourName) {
      this.errorMessage = '⚠️ Labour name is required';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (this.newLabourName.length < 2) {
      this.errorMessage = '⚠️ Labour name must be at least 2 characters';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cd.detectChanges();
    try {
      const { error } = await this.db.supabase
        .from('labour_ledger')
        .insert([{
          name: this.newLabourName,
          phone: this.newLabourPhone,
          status: 'active'
        }]);
      
      if (error) throw error;
      
      this.successMessage = `✅ Labour record created for ${this.newLabourName}`;
      this.newLabourName = '';
      this.newLabourPhone = '';
      this.showAddForm = false;
      this.cd.detectChanges();
      await this.loadLabours();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error adding labour:', error);
      this.errorMessage = '❌ Failed to add labour. Please try again.';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  openPaymentForm(wageEntry: WageEntryWithPayments | Labour, workerOutstanding?: WorkerOutstanding) {
    // Handle old Labour interface for backward compatibility
    if ('labour_id' in wageEntry) {
      this.selectedLabourId = wageEntry.labour_id;
      this.selectedLabourName = wageEntry.name;
      this.paymentAmount = wageEntry.due_amount;
      this.selectedWageEntryId = ''; // No wage entry ID in old structure
      this.showPaymentForm = true;
      return;
    }
    
    // Handle new WageEntryWithPayments interface
    if (workerOutstanding) {
      this.selectedWageEntryId = wageEntry.wage_entry_id;
      this.selectedLabourId = workerOutstanding.worker_id;
      this.selectedLabourName = workerOutstanding.worker_name;
      this.paymentAmount = wageEntry.current_outstanding;
      this.showPaymentForm = true;
    }
  }
  
  async recordPayment() {
    if (!this.selectedWageEntryId) {
      this.errorMessage = '⚠️ Please select a wage entry';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.errorMessage = '⚠️ Enter a valid payment amount';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.paidByPartnerId) {
      this.errorMessage = '⚠️ Select which partner is paying';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cd.detectChanges();
    
    try {
      const payment: WagePayment = {
        wage_entry_id: this.selectedWageEntryId,
        worker_id: this.selectedLabourId,
        payment_date: this.paymentDate,
        amount_paid: this.paymentAmount,
        paid_by_partner_id: this.paidByPartnerId,
        payment_mode: 'cash',
        notes: ''
      };

      const result = await this.laborPaymentService.recordPayment(payment);
      
      if (result.success) {
        this.successMessage = `✅ Payment of ₹${this.paymentAmount.toFixed(2)} recorded for ${this.selectedLabourName}`;
        this.showPaymentForm = false;
        this.paymentAmount = 0;
        this.selectedWageEntryId = '';
        this.selectedLabourId = '';
        this.cd.detectChanges();
        await this.loadWorkersWithOutstanding();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cd.detectChanges();
        }, 3000);
      } else {
        this.errorMessage = `❌ ${result.error || 'Failed to record payment'}`;
        this.cd.detectChanges();
        setTimeout(() => {
          this.errorMessage = '';
          this.cd.detectChanges();
        }, 3000);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      this.errorMessage = '❌ Failed to record payment. Please try again.';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async clearAllOutstanding(wageEntry: WageEntryWithPayments, workerOutstanding: WorkerOutstanding) {
    if (!confirm(`Clear all outstanding ₹${wageEntry.current_outstanding.toFixed(2)} for ${workerOutstanding.worker_name}?`)) {
      return;
    }

    this.loading = true;
    this.cd.detectChanges();

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const result = await this.laborPaymentService.clearOutstanding(
        wageEntry.wage_entry_id,
        this.paidByPartnerId || this.partners[0]?.partner_id,
        currentDate
      );

      if (result.success) {
        this.successMessage = `✅ Cleared outstanding ₹${wageEntry.current_outstanding.toFixed(2)} for ${workerOutstanding.worker_name}`;
        this.cd.detectChanges();
        await this.loadWorkersWithOutstanding();
        
        setTimeout(() => {
          this.successMessage = '';
          this.cd.detectChanges();
        }, 3000);
      } else {
        this.errorMessage = `❌ ${result.error || 'Failed to clear outstanding'}`;
        this.cd.detectChanges();
      }
    } catch (error) {
      console.error('Error clearing outstanding:', error);
      this.errorMessage = '❌ Failed to clear outstanding';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  viewPaymentHistory(worker: WorkerOutstanding) {
    this.selectedWorkerForHistory = worker;
    this.showPaymentHistoryModal = true;
  }

  closePaymentHistoryModal() {
    this.showPaymentHistoryModal = false;
    this.selectedWorkerForHistory = null;
  }
  
  getTotalEarned(): number {
    return this.getFilteredLabours().reduce((sum, l) => sum + l.total_earned, 0);
  }
  
  getTotalPaid(): number {
    return this.getFilteredLabours().reduce((sum, l) => sum + l.total_paid, 0);
  }
  
  getTotalDue(): number {
    return this.getFilteredLabours().reduce((sum, l) => sum + l.due_amount, 0);
  }
}
