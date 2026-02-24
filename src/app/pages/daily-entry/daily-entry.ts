import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ProductionService, WorkerWage, ProductionData } from '../../services/production.service';
import { RecipeService, MaterialCalculation } from '../../services/recipe.service';
import { WorkerService, Worker, WAGE_RATES } from '../../services/worker.service';
import { SalesService, SaleData } from '../../services/sales.service';
import { ClientService, Client } from '../../services/client.service';
import { InventoryService } from '../../services/inventory.service';

// ========== INTERFACES ==========

interface ProductionItem {
  product_name: string;
  product_variant: string | null;
  quantity: number;
  material_calc?: MaterialCalculation;
}

interface WorkerEntry {
  worker: Worker;
  attendance_type: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom';
  wage_earned: number;
  paid_today: number;
  is_paid: boolean;
  paid_by_partner_id?: string;
}

interface SalesItem {
  product_name: string;
  quantity: number;
  rate: number;
  total: number;
}

interface DeliveryExpense {
  category: 'Transport' | 'Snacks' | 'Other';
  amount: number;
  paid_by_partner_id: string;
}

interface OtherExpense {
  category: 'Snacks' | 'Diesel' | 'Maintenance' | 'Medical' | 'Transport' | 'Other';
  description: string;
  amount: number;
  paid_by_partner_id: string;
}

interface YardLossItem {
  product_name: string;
  quantity: number;
  reason: string;
}

interface Partner {
  partner_id: string;
  name: string;
  profit_share: number;
}

@Component({
  selector: 'app-daily-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-entry.html',
  styleUrls: ['./daily-entry.css']
})
export class UnifiedDailyEntryComponent implements OnInit {

  // ========== GENERAL ==========
  entryDate: string = '';
  notes: string = '';
  
  // ========== SECTION 1: PRODUCTION ==========
  hasProduction: boolean = false;
  productionItems: ProductionItem[] = [];
  selectedProduct: string = '';
  selectedProductVariant: string | null = null;
  productQuantity: number = 0;
  products: Array<{product_name: string, variants: string[]}> = [];
  selectedProductVariants: string[] = [];
  isCalculatingMaterials: boolean = false;
  
  // ========== SECTION 2: LABOR ==========
  workerEntries: WorkerEntry[] = [];
  availableWorkers: Worker[] = [];
  selectedWorkerId: string = '';
  selectedAttendanceType: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom' = 'Full Day';
  customWageAmount: number = 0;
  isPaid: boolean = false;
  paidByPartnerId: string = '';
  showQuickAddWorker: boolean = false;
  newWorkerName: string = '';
  newWorkerPhone: string = '';
  
  // ========== SECTION 3: SALES ==========
  hasSalesToday: boolean = false;
  selectedClientId: string = '';
  clients: Client[] = [];
  filteredClients: Client[] = [];
  clientSearchTerm: string = '';
  showClientDropdown: boolean = false;
  showQuickAddClient: boolean = false;
  newClientName: string = '';
  newClientPhone: string = '';
  newClientAddress: string = '';
  
  salesItems: SalesItem[] = [];
  selectedSalesProduct: string = '';
  salesQuantity: number = 0;
  salesRate: number = 0;
  productStockMap: Map<string, number> = new Map();
  productPriceMap: Map<string, number> = new Map();
  
  totalRevenue: number = 0;
  amountReceived: number = 0;
  pendingAmount: number = 0;
  
  deliveryExpenses: DeliveryExpense[] = [];
  transportExpense: number = 0;
  transportPaidBy: string = '';
  snacksExpense: number = 0;
  snacksPaidBy: string = '';
  otherDeliveryExpense: number = 0;
  otherDeliveryPaidBy: string = '';
  
  // ========== SECTION 4: OTHER EXPENSES ==========
  otherExpenses: OtherExpense[] = [];
  selectedExpenseCategory: 'Snacks' | 'Diesel' | 'Maintenance' | 'Medical' | 'Transport' | 'Other' = 'Snacks';
  expenseDescription: string = '';
  expenseAmount: number = 0;
  expensePaidBy: string = '';
  
  // ========== SECTION 5: YARD LOSS ==========
  hasYardLoss: boolean = false;
  yardLossItems: YardLossItem[] = [];
  selectedYardLossProduct: string = '';
  yardLossQuantity: number = 0;
  yardLossReason: string = '';
  
  // ========== PARTNERS ==========
  partners: Partner[] = [];
  
  // ========== UI STATE ==========
  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  constructor(
    private db: SupabaseService,
    private productionService: ProductionService,
    private recipeService: RecipeService,
    private workerService: WorkerService,
    private salesService: SalesService,
    private clientService: ClientService,
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef
  ) {}
  
  async ngOnInit() {
    this.entryDate = new Date().toISOString().split('T')[0];
    this.loading = true;
    try {
      await Promise.all([
        this.loadProducts(),
        this.loadWorkers(),
        this.loadClients(),
        this.loadPartners(),
        this.loadInventory()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load initial data';
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  // ========== DATA LOADING ==========
  
  async loadProducts() {
    try {
      this.products = await this.recipeService.getProductList();
      if (this.products.length > 0) {
        this.selectedProduct = this.products[0].product_name;
        this.selectedProductVariants = this.products[0].variants;
        if (this.selectedProductVariants.length > 0) {
          this.selectedProductVariant = this.selectedProductVariants[0];
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }
  
  async loadWorkers() {
    try {
      this.availableWorkers = await this.workerService.getAllWorkers();
      if (this.availableWorkers.length > 0) {
        this.selectedWorkerId = this.availableWorkers[0].id;
      }
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  }
  
  async loadClients() {
    try {
      this.clients = await this.clientService.getActiveClients();
      this.filteredClients = this.clients;
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }
  
  async loadPartners() {
    try {
      const { data, error } = await this.db.queryView('partner_master');
      if (error) throw error;
      this.partners = data || [];
      if (this.partners.length > 0) {
        this.paidByPartnerId = this.partners[0].partner_id;
        this.transportPaidBy = this.partners[0].partner_id;
        this.snacksPaidBy = this.partners[0].partner_id;
        this.otherDeliveryPaidBy = this.partners[0].partner_id;
        this.expensePaidBy = this.partners[0].partner_id;
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  }
  
  async loadInventory() {
    try {
      const inventory = await this.inventoryService.getInventory();
      inventory.forEach(item => {
        this.productStockMap.set(item.product_name, item.current_stock);
        this.productPriceMap.set(item.product_name, item.selling_price);
      });
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }
  
  // ========== SECTION 1: PRODUCTION ==========
  
  onProductChange() {
    const product = this.products.find(p => p.product_name === this.selectedProduct);
    if (product) {
      this.selectedProductVariants = product.variants;
      if (this.selectedProductVariants.length > 0) {
        this.selectedProductVariant = this.selectedProductVariants[0];
      } else {
        this.selectedProductVariant = null;
      }
    }
  }
  
  async addProductionItem() {
    if (!this.selectedProduct || this.productQuantity <= 0) {
      this.showError('Select product and enter valid quantity');
      return;
    }
    
    this.isCalculatingMaterials = true;
    try {
      // Calculate materials needed
      const materialCalc = await this.recipeService.calculateMaterialsNeeded(
        this.selectedProduct,
        this.selectedProductVariant,
        this.productQuantity
      );
      
      // Check if materials are available
      if (!materialCalc) {
        this.showError('Failed to calculate material requirements');
        return;
      }
      
      this.productionItems.push({
        product_name: this.selectedProduct,
        product_variant: this.selectedProductVariant,
        quantity: this.productQuantity,
        material_calc: materialCalc
      });
      
      this.showSuccess(`${this.selectedProduct} added to production`);
      this.productQuantity = 0;
    } catch (error) {
      console.error('Error adding production item:', error);
      this.showError('Failed to add production item');
    } finally {
      this.isCalculatingMaterials = false;
      this.cd.detectChanges();
    }
  }
  
  removeProductionItem(index: number) {
    this.productionItems.splice(index, 1);
  }
  
  getTotalProductionCost(): number {
    return this.productionItems.reduce((sum, item) => 
      sum + (item.material_calc?.costs.total_cost || 0), 0
    );
  }
  
  // ========== SECTION 2: LABOR ==========
  
  onAttendanceTypeChange() {
    if (this.selectedAttendanceType === 'Custom') {
      this.customWageAmount = 0;
    } else {
      this.customWageAmount = WAGE_RATES[this.selectedAttendanceType];
    }
  }
  
  async addWorkerEntry() {
    if (!this.selectedWorkerId) {
      this.showError('Select a worker');
      return;
    }
    
    const worker = this.availableWorkers.find(w => w.id === this.selectedWorkerId);
    if (!worker) {
      this.showError('Worker not found');
      return;
    }
    
    // Check if worker already added
    if (this.workerEntries.some(we => we.worker.id === worker.id)) {
      this.showError(`${worker.name} already added`);
      return;
    }
    
    const wageEarned = this.selectedAttendanceType === 'Custom' 
      ? this.customWageAmount 
      : WAGE_RATES[this.selectedAttendanceType];
    
    if (wageEarned <= 0) {
      this.showError('Enter valid wage amount');
      return;
    }
    
    if (this.isPaid && !this.paidByPartnerId) {
      this.showError('Select who paid the wage');
      return;
    }
    
    this.workerEntries.push({
      worker,
      attendance_type: this.selectedAttendanceType,
      wage_earned: wageEarned,
      paid_today: this.isPaid ? wageEarned : 0,
      is_paid: this.isPaid,
      paid_by_partner_id: this.isPaid ? this.paidByPartnerId : undefined
    });
    
    this.showSuccess(`${worker.name} added`);
    this.isPaid = false;
    this.selectedAttendanceType = 'Full Day';
    this.customWageAmount = 0;
    this.cd.detectChanges();
  }
  
  removeWorkerEntry(index: number) {
    this.workerEntries.splice(index, 1);
  }
  
  getTotalLaborCost(): number {
    return this.workerEntries.reduce((sum, we) => sum + we.wage_earned, 0);
  }
  
  getTotalPaidToday(): number {
    return this.workerEntries.reduce((sum, we) => sum + we.paid_today, 0);
  }
  
  async quickAddWorker() {
    if (!this.newWorkerName.trim()) {
      this.showError('Enter worker name');
      return;
    }
    
    try {
      this.loading = true;
      const result = await this.workerService.addWorker(
        this.newWorkerName.trim(),
        this.newWorkerPhone.trim() || undefined
      );
      
      if (result.success && result.worker) {
        await this.loadWorkers();
        this.selectedWorkerId = result.worker.id;
        this.showSuccess(`Worker ${this.newWorkerName} added successfully`);
        this.newWorkerName = '';
        this.newWorkerPhone = '';
        this.showQuickAddWorker = false;
      } else {
        this.showError(result.error || 'Failed to add worker');
      }
    } catch (error) {
      console.error('Error adding worker:', error);
      this.showError('Failed to add worker');
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  // ========== SECTION 3: SALES ==========
  
  filterClients() {
    if (!this.clientSearchTerm) {
      this.filteredClients = this.clients;
    } else {
      const term = this.clientSearchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(c =>
        c.client_name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }
  }
  
  selectClient(client: Client) {
    this.selectedClientId = client.id;
    this.clientSearchTerm = client.client_name;
    this.showClientDropdown = false;
  }
  
  async quickAddClient() {
    if (!this.newClientName.trim()) {
      this.showError('Enter client name');
      return;
    }
    
    try {
      this.loading = true;
      const result = await this.clientService.addClient({
        client_name: this.newClientName.trim(),
        phone: this.newClientPhone.trim() || undefined,
        address: this.newClientAddress.trim() || undefined,
        credit_limit: 50000
      });
      
      if (result.success && result.client) {
        await this.loadClients();
        this.selectedClientId = result.client.id;
        this.clientSearchTerm = result.client.client_name;
        this.showSuccess(`Client ${this.newClientName} added successfully`);
        this.newClientName = '';
        this.newClientPhone = '';
        this.newClientAddress = '';
        this.showQuickAddClient = false;
      } else {
        this.showError(result.error || 'Failed to add client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      this.showError('Failed to add client');
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  onSalesProductChange() {
    if (this.selectedSalesProduct) {
      this.salesRate = this.productPriceMap.get(this.selectedSalesProduct) || 0;
    }
  }
  
  addSalesItem() {
    if (!this.selectedSalesProduct || this.salesQuantity <= 0 || this.salesRate <= 0) {
      this.showError('Fill all sales item details');
      return;
    }
    
    // Check stock
    const availableStock = this.productStockMap.get(this.selectedSalesProduct) || 0;
    const alreadySold = this.salesItems
      .filter(si => si.product_name === this.selectedSalesProduct)
      .reduce((sum, si) => sum + si.quantity, 0);
    
    const totalRequired = alreadySold + this.salesQuantity;
    
    if (totalRequired > availableStock) {
      this.showError(`Insufficient stock. Available: ${availableStock}, Required: ${totalRequired}`);
      return;
    }
    
    const total = this.salesQuantity * this.salesRate;
    
    this.salesItems.push({
      product_name: this.selectedSalesProduct,
      quantity: this.salesQuantity,
      rate: this.salesRate,
      total
    });
    
    this.calculateRevenue();
    this.showSuccess('Sales item added');
    this.salesQuantity = 0;
    this.cd.detectChanges();
  }
  
  removeSalesItem(index: number) {
    this.salesItems.splice(index, 1);
    this.calculateRevenue();
  }
  
  calculateRevenue() {
    this.totalRevenue = this.salesItems.reduce((sum, si) => sum + si.total, 0);
    this.pendingAmount = this.totalRevenue - this.amountReceived;
  }
  
  addDeliveryExpense() {
    if (this.transportExpense > 0 && this.transportPaidBy) {
      const existing = this.deliveryExpenses.findIndex(de => de.category === 'Transport');
      if (existing >= 0) {
        this.deliveryExpenses[existing].amount = this.transportExpense;
        this.deliveryExpenses[existing].paid_by_partner_id = this.transportPaidBy;
      } else {
        this.deliveryExpenses.push({
          category: 'Transport',
          amount: this.transportExpense,
          paid_by_partner_id: this.transportPaidBy
        });
      }
    }
    
    if (this.snacksExpense > 0 && this.snacksPaidBy) {
      const existing = this.deliveryExpenses.findIndex(de => de.category === 'Snacks');
      if (existing >= 0) {
        this.deliveryExpenses[existing].amount = this.snacksExpense;
        this.deliveryExpenses[existing].paid_by_partner_id = this.snacksPaidBy;
      } else {
        this.deliveryExpenses.push({
          category: 'Snacks',
          amount: this.snacksExpense,
          paid_by_partner_id: this.snacksPaidBy
        });
      }
    }
    
    if (this.otherDeliveryExpense > 0 && this.otherDeliveryPaidBy) {
      const existing = this.deliveryExpenses.findIndex(de => de.category === 'Other');
      if (existing >= 0) {
        this.deliveryExpenses[existing].amount = this.otherDeliveryExpense;
        this.deliveryExpenses[existing].paid_by_partner_id = this.otherDeliveryPaidBy;
      } else {
        this.deliveryExpenses.push({
          category: 'Other',
          amount: this.otherDeliveryExpense,
          paid_by_partner_id: this.otherDeliveryPaidBy
        });
      }
    }
  }
  
  getTotalDeliveryExpenses(): number {
    return this.deliveryExpenses.reduce((sum, de) => sum + de.amount, 0);
  }
  
  // ========== SECTION 4: OTHER EXPENSES ==========
  
  addOtherExpense() {
    if (!this.selectedExpenseCategory || this.expenseAmount <= 0 || !this.expensePaidBy) {
      this.showError('Fill all expense details');
      return;
    }
    
    this.otherExpenses.push({
      category: this.selectedExpenseCategory,
      description: this.expenseDescription.trim(),
      amount: this.expenseAmount,
      paid_by_partner_id: this.expensePaidBy
    });
    
    this.showSuccess('Expense added');
    this.expenseDescription = '';
    this.expenseAmount = 0;
    this.cd.detectChanges();
  }
  
  removeOtherExpense(index: number) {
    this.otherExpenses.splice(index, 1);
  }
  
  getTotalOtherExpenses(): number {
    return this.otherExpenses.reduce((sum, oe) => sum + oe.amount, 0);
  }
  
  // ========== SECTION 5: YARD LOSS ==========
  
  addYardLossItem() {
    if (!this.selectedYardLossProduct || this.yardLossQuantity <= 0 || !this.yardLossReason.trim()) {
      this.showError('Fill all yard loss details');
      return;
    }
    
    this.yardLossItems.push({
      product_name: this.selectedYardLossProduct,
      quantity: this.yardLossQuantity,
      reason: this.yardLossReason.trim()
    });
    
    this.showSuccess('Yard loss item added');
    this.yardLossQuantity = 0;
    this.yardLossReason = '';
    this.cd.detectChanges();
  }
  
  removeYardLossItem(index: number) {
    this.yardLossItems.splice(index, 1);
  }
  
  // ========== SUMMARY & SUBMIT ==========
  
  getGrandTotal(): number {
    const materialCost = this.getTotalProductionCost();
    const laborCost = this.getTotalLaborCost();
    const deliveryExpenses = this.getTotalDeliveryExpenses();
    const otherExpenses = this.getTotalOtherExpenses();
    
    return materialCost + laborCost + deliveryExpenses + otherExpenses;
  }
  
  getNetProfit(): number {
    return this.totalRevenue - this.getGrandTotal();
  }
  
  async submitDailyEntry() {
    // Validation
    if (!this.entryDate) {
      this.showError('Select entry date');
      return;
    }
    
    if (this.productionItems.length === 0 && !this.hasSalesToday && this.otherExpenses.length === 0) {
      this.showError('Add at least one entry (production, sales, or expenses)');
      return;
    }
    
    if (this.hasSalesToday) {
      if (!this.selectedClientId) {
        this.showError('Select a client for sales');
        return;
      }
      if (this.salesItems.length === 0) {
        this.showError('Add at least one sales item');
        return;
      }
      
      this.addDeliveryExpense(); // Ensure delivery expenses are added
    }
    
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      // 1. Save Production Entries (if any)
      if (this.hasProduction && this.productionItems.length > 0) {
      for (const prodItem of this.productionItems) {
        const productionData: ProductionData = {
          date: this.entryDate,
          product_name: prodItem.product_name,
          product_variant: prodItem.product_variant,
          success_quantity: prodItem.quantity,
          rejected_quantity: 0,
          workers: this.workerEntries.map(we => ({
            worker_id: we.worker.id,
            worker_name: we.worker.name,
            attendance_type: we.attendance_type,
            wage_earned: we.wage_earned,
            paid_today: we.paid_today,
            paid_by_partner_id: we.paid_by_partner_id
          })),
          is_job_work: false,
          notes: this.notes
        };
        
        const result = await this.productionService.saveProduction(productionData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save production');
        }
      }
      }
      
      // 2. Save sales transaction
      if (this.hasSalesToday && this.salesItems.length > 0) {
        for (const salesItem of this.salesItems) {
          const salesData: SaleData = {
            date: this.entryDate,
            client_id: this.selectedClientId,
            product_name: salesItem.product_name,
            product_variant: null,
            quantity: salesItem.quantity,
            rate_per_unit: salesItem.rate,
            payment_type: this.amountReceived >= this.totalRevenue ? 'full' : this.amountReceived > 0 ? 'partial' : 'credit',
            paid_amount: this.amountReceived,
            collected_by_partner_id: this.partners[0]?.partner_id || undefined,
            deposited_to_firm: true
          };
          
          const result = await this.salesService.createSale(salesData);
          if (!result.success) {
            throw new Error(result.error || 'Failed to save sales');
          }
        }
        
        // Record delivery expenses in firm_cash_ledger
        for (const deliveryExpense of this.deliveryExpenses) {
          await this.db.supabase
            .from('firm_cash_ledger')
            .insert([{
              transaction_date: this.entryDate,
              transaction_type: 'expense',
              category: `delivery_${deliveryExpense.category.toLowerCase()}`,
              amount: deliveryExpense.amount,
              partner_id: deliveryExpense.paid_by_partner_id,
              description: `Delivery expense - ${deliveryExpense.category}`
            }]);
        }
      }
      
      // 3. Save other expenses
      for (const expense of this.otherExpenses) {
        await this.db.supabase
          .from('firm_cash_ledger')
          .insert([{
            transaction_date: this.entryDate,
            transaction_type: 'expense',
            category: expense.category.toLowerCase(),
            amount: expense.amount,
            partner_id: expense.paid_by_partner_id,
            description: expense.description || expense.category
          }]);
      }
      
      // 4. Save yard loss
      if (this.hasYardLoss && this.yardLossItems.length > 0) {
        for (const lossItem of this.yardLossItems) {
          await this.db.supabase
            .from('yard_loss')
            .insert([{
              date: this.entryDate,
              product_name: lossItem.product_name,
              quantity: lossItem.quantity,
              reason: lossItem.reason
            }]);
            
          // Deduct from finished goods inventory
          await this.db.supabase.rpc('update_finished_goods_stock', {
            p_product_name: lossItem.product_name,
            p_variant: null,
            p_quantity_change: -lossItem.quantity
          });
        }
      }
      
      this.successMessage = `✅ Daily entry for ${this.entryDate} saved successfully!`;
      
      // Reset form after 2 seconds
      setTimeout(() => {
        this.resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting daily entry:', error);
      this.errorMessage = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      this.saving = false;
      this.cd.detectChanges();
    }
  }
  
  resetForm() {
    this.entryDate = new Date().toISOString().split('T')[0];
    this.notes = '';
    this.hasProduction = false;
    this.productionItems = [];
    this.productQuantity = 0;
    this.workerEntries = [];
    this.isPaid = false;
    this.hasSalesToday = false;
    this.selectedClientId = '';
    this.clientSearchTerm = '';
    this.salesItems = [];
    this.totalRevenue = 0;
    this.amountReceived = 0;
    this.pendingAmount = 0;
    this.transportExpense = 0;
    this.snacksExpense = 0;
    this.otherDeliveryExpense = 0;
    this.deliveryExpenses = [];
    this.otherExpenses = [];
    this.hasYardLoss = false;
    this.yardLossItems = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
  }
  
  // ========== UI HELPERS ==========
  
  showSuccess(message: string) {
    this.successMessage = `✅ ${message}`;
    this.cd.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cd.detectChanges();
    }, 2000);
  }
  
  showError(message: string) {
    this.errorMessage = `❌ ${message}`;
    this.cd.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cd.detectChanges();
    }, 3000);
  }
  
  getPartnerName(partnerId: string): string {
    const partner = this.partners.find(p => p.partner_id === partnerId);
    return partner ? partner.name : 'Unknown';
  }
  
  formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }
}

