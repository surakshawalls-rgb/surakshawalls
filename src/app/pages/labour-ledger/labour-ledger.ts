import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

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
  partners: Partner[] = [];
  
  // New Labour form
  showAddForm = false;
  newLabourName: string = '';
  newLabourPhone: string = '';
  
  // Payment form
  showPaymentForm = false;
  selectedLabourId: string = '';
  selectedLabourName: string = '';
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
    private cd: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loading = true;
    this.paymentDate = new Date().toISOString().split('T')[0];
    Promise.all([this.loadLabours(), this.loadPartners()]).finally(() => {
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
      await Promise.all([this.loadLabours(), this.loadPartners()]);
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
  
  openPaymentForm(labour: Labour) {
    this.selectedLabourId = labour.labour_id;
    this.selectedLabourName = labour.name;
    this.paymentAmount = labour.due_amount;
    this.showPaymentForm = true;
  }
  
  async recordPayment() {
    if (!this.selectedLabourId) {
      this.errorMessage = '⚠️ Please select a labour record';
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
    
    const labour = this.labourList.find(l => l.labour_id === this.selectedLabourId);
    if (!labour) {
      this.errorMessage = '⚠️ Labour record not found';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (this.paymentAmount > labour.due_amount) {
      this.errorMessage = `⚠️ Payment amount exceeds due amount (₹${labour.due_amount.toFixed(2)})`;
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cd.detectChanges();
    try {
      // Record payment in labour_transactions
      const { error: txnError } = await this.db.supabase
        .from('labour_transactions')
        .insert([{
          labour_id: this.selectedLabourId,
          date: this.paymentDate,
          type: 'payment',
          amount: this.paymentAmount,
          paid_by_partner_id: this.paidByPartnerId
        }]);
      
      if (txnError) throw txnError;
      
      // Update labour_ledger total_paid
      if (labour) {
        const newTotalPaid = labour.total_paid + this.paymentAmount;
        const newDue = labour.total_earned - newTotalPaid;
        
        const { error: updateError } = await this.db.supabase
          .from('labour_ledger')
          .update({
            total_paid: newTotalPaid,
            due_amount: Math.max(0, newDue),
            last_paid_date: this.paymentDate,
            paid_by_partner_id: this.paidByPartnerId
          })
          .eq('labour_id', this.selectedLabourId);
        
        if (updateError) throw updateError;
      }
      
      this.successMessage = `✅ Payment of ₹${this.paymentAmount.toFixed(2)} recorded for ${labour.name}`;
      this.showPaymentForm = false;
      this.paymentAmount = 0;
      this.cd.detectChanges();
      await this.loadLabours();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error recording payment:', error);
      this.errorMessage = '❌ Failed to record payment. Please try again.';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
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
