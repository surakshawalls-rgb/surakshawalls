// src/app/pages/reports-dashboard/reports-dashboard.component.ts  
import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService, Worker } from '../../services/worker.service';
import { ClientService, Client } from '../../services/client.service';
import { ClientPaymentService, ClientOutstanding } from '../../services/client-payment.service';
import { LaborPaymentService, WorkerOutstanding, WageEntryWithPayments, WagePayment } from '../../services/labor-payment.service';
import { InventoryService } from '../../services/inventory.service';
import { SupabaseService } from '../../services/supabase.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { PartnerService } from '../../services/partner.service';
import { MatIconModule } from '@angular/material/icon';

interface OtherExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  paid_by_partner_id?: string;
}

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
  paymentSource: 'company' | 'client_revenue' | 'partner';
  workerPaidByPartnerId?: string;
  paymentDate: string;
  notes: string;
  collectedBy?: string; // 'firm' or partner name
  depositedToFirm?: boolean;
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
  imports: [CommonModule, FormsModule, BreadcrumbComponent, MfgFooterComponent, MatIconModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {

  @Input() embedded = false;
  @Input() labourOnly = false;
  
  // Active tab
  activeTab: 'workers' | 'clients' | 'partners' | 'company' = 'workers';
  workerSubTab: 'workers' | 'expenses' = 'workers';
  
  // Workers data
  workerFilter: 'outstanding' | 'active' | 'inactive' = 'outstanding';
  workersWithOutstanding: WorkerOutstanding[] = [];
  allWorkers: Worker[] = [];

  // Expenses data
  otherExpenses: OtherExpense[] = [];
  expenseSearch = '';
  expenseStartDate = '';
  expenseEndDate = '';
  expensePartnerFilter = ''; // Empty means 'All'
  
  // Clients data
  clientsWithOutstanding: ClientOutstanding[] = [];
  allClients: Client[] = [];
  partners: any[] = [];
  
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
    workerPaidByPartnerId: undefined,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    collectedBy: 'firm',
    depositedToFirm: true
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
   await this.loadPartnersList();
   await this.loadWorkersData();
   
   // We'll leave dates empty by default to trigger the "First 50" load logic
   this.expenseStartDate = '';
   this.expenseEndDate = '';

   if (this.labourOnly) {
     this.activeTab = 'workers';
   }
  }

  clearExpenseFilters() {
    this.expenseStartDate = '';
    this.expenseEndDate = '';
    this.expensePartnerFilter = '';
    this.expenseSearch = '';
    this.loadExpensesData();
  }
  
  // ========== TAB NAVIGATION ==========
  
  async switchTab(tab: 'workers' | 'clients' | 'partners' | 'company') {
    this.activeTab = tab;
    this.errorMessage = '';
    
    if (tab === 'workers') {
      if (this.workerSubTab === 'workers') {
        await this.loadWorkersData();
      } else {
        await this.loadExpensesData();
      }
    } else if (tab === 'clients') {
      await this.loadClientsData();
    } else if (tab === 'partners') {
      await this.loadPartnersData();
    } else if (tab === 'company') {
      await this.loadCompanyOverview();
    }
  }
  
  async switchWorkerSubTab(sub: 'workers' | 'expenses') {
    this.workerSubTab = sub;
    if (sub === 'workers') {
      await this.loadWorkersData();
    } else {
      await this.loadExpensesData();
    }
  }

  // ========== DATA LOADING ==========

  async loadExpensesData() {
    try {
      this.loading = true;
      // We query for all payments (operational, wage, purchase, etc.) to show a consolidated passbook
      let query = this.supabase.supabase
        .from('firm_cash_ledger')
        .select('*')
        .eq('type', 'payment')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (this.expenseStartDate) {
        query = query.gte('date', this.expenseStartDate);
      }
      if (this.expenseEndDate) {
        query = query.lte('date', this.expenseEndDate);
      }

      // Add partner filter to query
      if (this.expensePartnerFilter) {
        if (this.expensePartnerFilter === 'firm') {
          query = query.is('partner_id', null);
        } else {
          query = query.eq('partner_id', this.expensePartnerFilter);
        }
      }

      // If no dates/filters are set, take last 50, else limit to 300
      if (!this.expenseStartDate && !this.expenseEndDate && !this.expensePartnerFilter) {
        query = query.limit(50);
      } else {
        query = query.limit(300);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      this.otherExpenses = (data || []).map((row: any) => {
        const fullDesc = String(row.description || '');
        let cleanDesc = fullDesc.replace(/^DailyEntry Expense:\s*/i, '');
        
        // Map category for display
        let displayCategory: string = row.category || 'Other';
        
        // Specific mapping for the Passbook feel
        if (displayCategory === 'operational') {
          const cats = ['Snacks', 'Diesel', 'Maintenance', 'Medical', 'Transport'];
          for (const c of cats) {
            if (cleanDesc.toLowerCase().includes(c.toLowerCase())) {
              displayCategory = c;
              break;
            }
          }
        } else if (displayCategory === 'wage') {
          displayCategory = 'WAGES';
        } else if (displayCategory === 'purchase') {
          displayCategory = 'PURCHASE';
        }

        return {
          ...row,
          category: displayCategory.toUpperCase(),
          paid_by_partner_id: row.partner_id,
          description: cleanDesc
        };
      });
    } catch (error: any) {
      this.errorMessage = 'Failed to load expenses: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  getFilteredExpenses() {
    let filtered = this.otherExpenses;
    
    // Partner Filter
    if (this.expensePartnerFilter) {
      if (this.expensePartnerFilter === 'firm') {
        filtered = filtered.filter(e => !e.paid_by_partner_id);
      } else {
        filtered = filtered.filter(e => e.paid_by_partner_id === this.expensePartnerFilter);
      }
    }

    // Search Filter
    if (this.expenseSearch) {
      const s = this.expenseSearch.toLowerCase();
      filtered = filtered.filter(e => 
        e.description?.toLowerCase().includes(s) || 
        e.category?.toLowerCase().includes(s)
      );
    }
    
    return filtered;
  }

  getPartnerName(id?: string) {
    if (!id) return 'Company / Firm';
    const p = this.partners.find(x => x.id === id);
    return p ? p.partner_name : 'Partner';
  }

  getTotalExpensesAmount() {
    return this.getFilteredExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getPartnerExpenseSummary() {
    const summary: {name: string, total: number}[] = [];
    
    // Firm total
    const firmTotal = this.otherExpenses
      .filter(e => !e.paid_by_partner_id)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    if (firmTotal > 0) summary.push({ name: 'Firm / Company', total: firmTotal });

    // Each partner total
    this.partners.forEach(p => {
      const total = this.otherExpenses
        .filter(e => e.paid_by_partner_id === p.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      if (total > 0) summary.push({ name: p.partner_name, total: total });
    });

    return summary;
  }
  
  async loadWorkersData() {
    try {
      this.loading = true;
      const onlyOutstanding = this.workerFilter === 'outstanding';
      const statusFilter: 'active' | 'inactive' | 'all' = 
        this.workerFilter === 'inactive' ? 'inactive' : 'active';
      
      this.workersWithOutstanding = await this.laborPaymentService.getWorkersWithOutstanding(onlyOutstanding, statusFilter);
      this.allWorkers = await this.workerService.getAllWorkers();
    } catch (error: any) {
      this.errorMessage = 'Failed to load workers data: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async setWorkerFilter(filter: 'outstanding' | 'active' | 'inactive') {
    this.workerFilter = filter;
    await this.loadWorkersData();
  }
  
  async loadClientsData() {
    try {
      this.loading = true;
      this.clientsWithOutstanding = await this.clientPaymentService.getClientsWithOutstanding();
      this.allClients = await this.clientService.getAllClients();
      if (this.partners.length === 0) {
        await this.loadPartnersList();
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to load clients data: ' + error.message;
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async loadPartnersList() {
    try {
      const { data, error } = await this.supabase.supabase
        .from('partner_master')
        .select('id, partner_name')
        .neq('partner_name', 'Pappu Maurya') // Remove Pappu Maurya as requested
        .order('partner_name');
      
      if (error) throw error;
      this.partners = data || [];
    } catch (error: any) {
      console.error('Failed to load partners:', error);
    }
  }
  
  async loadPartnersData() {
    try {
      this.loading = true;
      const { data, error } = await this.supabase.supabase
        .from('partner_master')
        .select('*')
        .neq('partner_name', 'Pappu Maurya')
        .order('partner_name');
      
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
      
      // Material stock value (raw_materials_master has: current_stock, unit_cost)
      this.materialStock = materials;
      this.companyStats.totalMaterialStock = materials.reduce((sum: number, m: any) => 
        sum + ((m.current_stock || 0) * (m.unit_cost || 0)), 0
      );
      
      // Finished stock value (finished_goods_inventory has: current_stock, unit_cost)
      this.finishedStock = finished;
      this.companyStats.totalFinishedStock = finished.reduce((sum: number, f: any) => 
        sum + ((f.current_stock || 0) * (f.unit_cost || 0)), 0
      );
      
      // Get revenue and expenses from firm_cash_ledger (type: 'receipt' or 'payment')
      const { data: cashLedger } = await this.supabase.supabase
        .from('firm_cash_ledger')
        .select('type, amount');
      
      if (cashLedger) {
        // Revenue = receipts (sales, partner contributions)
        this.companyStats.totalRevenue = cashLedger
          .filter((t: any) => t.type === 'receipt')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        // Expenses = payments (wages, withdrawals, purchases)
        this.companyStats.totalExpenses = cashLedger
          .filter((t: any) => t.type === 'payment')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      }
      
      this.companyStats.netProfit = this.companyStats.totalRevenue - this.companyStats.totalExpenses;
      
    } catch (error: any) {
      this.errorMessage = 'Failed to load company overview: ' + error.message;
      console.error('[ReportsDashboard] loadCompanyOverview error:', error);
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
      workerPaidByPartnerId: this.partners[0]?.id,
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
      notes: '',
      collectedBy: 'firm',
      depositedToFirm: true
    };
  }
  
  closePaymentDialog() {
    this.paymentDialog.show = false;
    this.paymentDialog.type = null;
  }

  onWorkerPaymentSourceChange() {
    if (this.paymentDialog.paymentSource === 'partner') {
      this.paymentDialog.workerPaidByPartnerId = this.paymentDialog.workerPaidByPartnerId || this.partners[0]?.id;
      return;
    }
    this.paymentDialog.workerPaidByPartnerId = undefined;
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
      
      this.successMessage = 'Payment processed successfully.';
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

    const paidByPartnerId = this.paymentDialog.paymentSource === 'partner'
      ? this.paymentDialog.workerPaidByPartnerId
      : undefined;

    if (this.paymentDialog.paymentSource === 'partner' && !paidByPartnerId) {
      throw new Error('Please select partner for this payment');
    }
    
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
          paid_by_partner_id: paidByPartnerId,
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

    // Get partner ID if collected by partner
    let collectedByPartnerId: string | undefined;
    if (this.paymentDialog.collectedBy && this.paymentDialog.collectedBy !== 'firm') {
      const partner = this.partners.find(p => p.partner_name === this.paymentDialog.collectedBy);
      collectedByPartnerId = partner?.id;
    }

    // Record client payment
    const result = await this.clientPaymentService.recordPayment({
      client_id: this.paymentDialog.clientId,
      payment_date: this.paymentDialog.paymentDate,
      amount_paid: this.paymentDialog.paymentAmount,
      payment_mode: 'cash',
      collected_by_partner_id: collectedByPartnerId,
      deposited_to_firm: this.paymentDialog.depositedToFirm ?? true,
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
        entries: entries.length > 0 ? entries : (worker.wage_entries || [])
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
    return `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  getTotalPayments(payments: WagePayment[]): number {
    return payments.reduce((sum, p) => sum + p.amount_paid, 0);
  }
}
