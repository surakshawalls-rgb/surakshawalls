// src/app/pages/reports-dashboard/reports-dashboard.component.ts  
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService, Worker } from '../../services/worker.service';
import { ClientService, Client } from '../../services/client.service';
import { ClientPaymentService, ClientOutstanding } from '../../services/client-payment.service';
import { LaborPaymentService, WorkerOutstanding, WageEntryWithPayments, WagePayment } from '../../services/labor-payment.service';
import { InventoryService } from '../../services/inventory.service';
import { SupabaseService } from '../../services/supabase.service';

interface PaymentDialog {
  show: boolean;
  type: 'worker' | 'client' | null;
  mode: 'full' | 'partial';
  workerId?: string;
  workerName?: string;
  outstandingAmount?: number;
  clientId?: string;
  clientName?: string;
  paymentAmount: number;
  paymentSource: 'company' | 'client_revenue';
  paymentDate: string;
  notes: string;
}

interface PassbookDialog {
  show: boolean;
  workerId?: string;
  workerName?: string;
  entries: WageEntryWithPayments[];
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  
  // Active tab
  activeTab: 'workers' | 'clients' | 'partners' | 'company' = 'workers';
  
  // Workers data
  workersWithOutstanding: WorkerOutstanding[] = [];
  allWorkers: Worker[] = [];
  
  // Clients data
  clientsWithOutstanding: ClientOutstanding[] = [];
  allClients: Client[] = [];
  
  // Company overview data
  companyStats = {
    totalWorkerOutstanding: 0,
    totalClientOutstanding: 0,
    totalMaterialStock: 0,
    totalFinishedStock: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  };
  
  materialStock: any[] = [];
  finishedStock: any[] = [];
  partnerInfo: any[] = [];
  
  // Dialogs
  paymentDialog: PaymentDialog = {
    show: false,
    type: null,
    mode: 'full',
    paymentAmount: 0,
    paymentSource: 'company',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  };
  
  passbookDialog: PassbookDialog = {
    show: false,
    entries: []
  };
  
  // UI State
  loading: boolean = false;
  saving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(
    private workerService: WorkerService,
    private clientService: ClientService,
    private clientPaymentService: ClientPaymentService,
    private laborPaymentService: LaborPaymentService,
    private inventoryService: InventoryService,
    private supabase: SupabaseService,
    private cd: ChangeDetectorRef
  ) {}
  
  async ngOnInit() {
   await this.loadWorkersData();
  }
  
  // ========== TAB NAVIGATION ==========
  
  async switchTab(tab: 'workers' | 'clients' | 'partners' | 'company') {
    this.activeTab = tab;
    this.errorMessage = '';
    
    if (tab === 'workers' && this.workersWithOutstanding.length === 0) {
      await this.loadWorkersData();
    } else if (tab === 'clients' && this.clientsWithOutstanding.length === 0) {
      await this.loadClientsData();
    } else if (tab === 'partners' && this.partnerInfo.length === 0) {
      await this.loadPartnersData();
    } else if (tab === 'company') {
      await this.loadCompanyOverview();
    }
  }
  
  // ========== DATA LOADING ==========
  
  async loadWorkersData() {
    try {
      this.loading = true;
      this.workersWithOutstanding = await this.laborPaymentService.getWorkersWithOutstanding();
      this.allWorkers = await this.workerService.getAllWorkers();
    } catch (error: any) {
      this.errorMessage = 'Failed to load workers data: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  async loadClientsData() {
    try {
      this.loading = true;
      this.clientsWithOutstanding = await this.clientPaymentService.getClientsWithOutstanding();
      this.allClients = await this.clientService.getAllClients();
    } catch (error: any) {
      this.errorMessage = 'Failed to load clients data: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  async loadPartnersData() {
    try {
      this.loading = true;
      const { data, error } = await this.supabase.supabase
        .from('partners')
        .select('*')
        .order('name');
      
      if (error) throw error;
      this.partnerInfo = data || [];
    } catch (error: any) {
      this.errorMessage = 'Failed to load partners data: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  async loadCompanyOverview() {
    try {
      this.loading = true;
      
      // Load all data in parallel
      const [workers, clients, materials, finished] = await Promise.all([
        this.laborPaymentService.getWorkersWithOutstanding(),
        this.clientPaymentService.getClientsWithOutstanding(),
        this.inventoryService.getMaterialsStock(),
        this.inventoryService.getInventory()
      ]);
      
      // Calculate totals
      this.companyStats.totalWorkerOutstanding = workers.reduce((sum: number, w: any) => sum + w.outstanding, 0);
      this.companyStats.totalClientOutstanding = clients.reduce((sum: number, c: any) => sum + c.outstanding, 0);
      
      // Material stock value
      this.materialStock = materials;
      this.companyStats.totalMaterialStock = materials.reduce((sum: number, m: any) => 
        sum + (m.quantity_in_stock * (m.average_purchase_rate || 0)), 0
      );
      
      // Finished stock value
      this.finishedStock = finished;
      this.companyStats.totalFinishedStock = finished.reduce((sum: number, f: any) => 
        sum + (f.total_quantity * (f.estimated_cost_per_unit || 100)), 0
      );
      
      // Get revenue and expenses from firm_cash_ledger
      const { data: cashLedger } = await this.supabase.supabase
        .from('firm_cash_ledger')
        .select('transaction_type, amount');
      
      if (cashLedger) {
        this.companyStats.totalRevenue = cashLedger
          .filter(t => t.transaction_type === 'CREDIT')
          .reduce((sum, t) => sum + t.amount, 0);
        
        this.companyStats.totalExpenses = cashLedger
          .filter(t => t.transaction_type === 'DEBIT')
          .reduce((sum, t) => sum + t.amount, 0);
      }
      
      this.companyStats.netProfit = this.companyStats.totalRevenue - this.companyStats.totalExpenses;
      
    } catch (error: any) {
      this.errorMessage = 'Failed to load company overview: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  // ========== PAYMENT DIALOGS ==========
  
  openPayWorkerDialog(worker: WorkerOutstanding, mode: 'full' | 'partial') {
    this.paymentDialog = {
      show: true,
      type: 'worker',
      mode: mode,
      workerId: worker.worker_id,
      workerName: worker.worker_name,
      outstandingAmount: worker.outstanding,
      paymentAmount: mode === 'full' ? worker.outstanding : 0,
      paymentSource: 'company',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
  }
  
  openCollectFromClientDialog(client: ClientOutstanding, mode: 'full' | 'partial') {
    this.paymentDialog = {
      show: true,
      type: 'client',
      mode: mode,
      clientId: client.client_id,
      clientName: client.client_name,
      outstandingAmount: client.outstanding,
      paymentAmount: mode === 'full' ? client.outstanding : 0,
      paymentSource: 'company',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
  }
  
  closePaymentDialog() {
    this.paymentDialog.show = false;
    this.paymentDialog.type = null;
  }
  
  async submitPayment() {
    if (!this.paymentDialog.type) return;
    
    try {
      this.saving = true;
      
      if (this.paymentDialog.type === 'worker') {
        // Pay worker
        await this.payWorker();
      } else if (this.paymentDialog.type === 'client') {
        // Collect from client
        await this.collectFromClient();
      }
      
      this.successMessage = '✅ Payment processed successfully!';
      this.closePaymentDialog();
      
      // Reload data
      if (this.activeTab === 'workers') {
        await this.loadWorkersData();
      } else if (this.activeTab === 'clients') {
        await this.loadClientsData();
      }
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      this.errorMessage = 'Failed to process payment: ' + error.message;
      setTimeout(() => {
        this.errorMessage = '';
        this.cd.detectChanges();
      }, 5000);
    } finally {
      this.saving = false;
      this.cd.detectChanges();
    }
  }
  
  private async payWorker() {
    if (!this.paymentDialog.workerId) return;
    
    // Get worker's wage entries with outstanding
    const workerWithOutstanding = this.workersWithOutstanding.find(
      w => w.worker_id === this.paymentDialog.workerId
    );
    
    if (!workerWithOutstanding || workerWithOutstanding.wage_entries.length === 0) {
      throw new Error('No outstanding wages found for worker');
    }
    
    let remainingAmount = this.paymentDialog.paymentAmount;
    
    // Pay wages in FIFO order (oldest first)
    for (const wageEntry of workerWithOutstanding.wage_entries) {
      if (remainingAmount <= 0) break;
      
      const amountToPay = Math.min(remainingAmount, wageEntry.current_outstanding);
      
      if (amountToPay > 0) {
        const result = await this.laborPaymentService.recordPayment({
          wage_entry_id: wageEntry.wage_entry_id,
          worker_id: wageEntry.worker_id,
          payment_date: this.paymentDialog.paymentDate,
          amount_paid: amountToPay,
          paid_by_partner_id: undefined, // company payment
          payment_mode: 'cash', // Default payment mode
          notes: this.paymentDialog.notes || `Payment via Reports Dashboard`
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to record payment');
        }
        
        remainingAmount -= amountToPay;
      }
    }
  }
  
  private async collectFromClient() {
    if (!this.paymentDialog.clientId) return;
    
    // Record client payment
    const result = await this.clientPaymentService.recordPayment({
      client_id: this.paymentDialog.clientId,
      payment_date: this.paymentDialog.paymentDate,
      amount_paid: this.paymentDialog.paymentAmount,
      payment_mode: 'cash',
      deposited_to_firm: true,
      notes: this.paymentDialog.notes || 'Collection via Reports Dashboard'
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to record payment');
    }
  }
  
  // ========== PASSBOOK DIALOG ==========
  
  async openPassbookDialog(worker: WorkerOutstanding) {
    try {
      this.loading = true;
      
      const entries = await this.laborPaymentService.getWorkerPaymentHistory(worker.worker_id);
      
      this.passbookDialog = {
        show: true,
        workerId: worker.worker_id,
        workerName: worker.worker_name,
        entries: entries
      };
      
    } catch (error: any) {
      this.errorMessage = 'Failed to load passbook: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  closePassbookDialog() {
    this.passbookDialog.show = false;
    this.passbookDialog.entries = [];
  }
  
  // ========== COMPUTED PROPERTIES ==========
  
  get totalWorkersOutstanding(): number {
    return this.workersWithOutstanding.reduce((sum, w) => sum + w.outstanding, 0);
  }
  
  get totalClientsOutstanding(): number {
    return this.clientsWithOutstanding.reduce((sum, c) => sum + c.outstanding, 0);
  }
  
  get passbookTotalWageEarned(): number {
    return this.passbookDialog.entries.reduce((sum, e) => sum + e.wage_earned, 0);
  }
  
  get passbookTotalPaidInitially(): number {
    return this.passbookDialog.entries.reduce((sum, e) => sum + e.paid_initially, 0);
  }
  
  get passbookTotalPaidLater(): number {
    return this.passbookDialog.entries.reduce((sum, e) => sum + e.total_paid_later, 0);
  }
  
  get passbookTotalOutstanding(): number {
    return this.passbookDialog.entries.reduce((sum, e) => sum + e.current_outstanding, 0);
  }
  
  // ========== UTILITY METHODS ==========
  
  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  getTotalPayments(payments: WagePayment[]): number {
    return payments.reduce((sum, p) => sum + p.amount_paid, 0);
  }
}
