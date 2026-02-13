import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService, WorkerWage, ProductionData } from '../../services/production.service';
import { RecipeService, MaterialCalculation } from '../../services/recipe.service';
import { WorkerService, Worker, WAGE_RATES } from '../../services/worker.service';

@Component({
  selector: 'app-production-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production-entry.html',
  styleUrl: './production-entry.css'
})
export class ProductionEntryComponent implements OnInit {

  constructor(
    private productionService: ProductionService,
    private recipeService: RecipeService,
    private workerService: WorkerService,
    private cdr: ChangeDetectorRef
  ) {}

  // Form data
  date = new Date().toISOString().split('T')[0];
  productName: string = '';
  productVariant: string | null = null;
  successQuantity: number = 0;
  rejectedQuantity: number = 0;
  isJobWork: boolean = false;
  jobWorkClient: string = '';
  notes: string = '';

  // Product lists
  products: Array<{product_name: string, variants: string[]}> = [];
  selectedProductVariants: string[] = [];

  // Material calculation
  materialCalc: MaterialCalculation | null = null;
  isCalculating: boolean = false;

  // Workers
  availableWorkers: Worker[] = [];
  selectedWorkers: Array<{
    worker: Worker;
    attendanceType: 'Full Day' | 'Half Day' | 'Outdoor' | 'Custom';
    wageEarned: number;
    paidToday: number;
  }> = [];

  // Loading states
  loading: boolean = false;
  saving: boolean = false;

  async ngOnInit() {
    await this.loadProducts();
    await this.loadWorkers();
  }

  /**
   * Load product list
   */
  async loadProducts() {
    try {
      this.products = await this.recipeService.getProductList();
      
      if (this.products.length > 0) {
        this.productName = this.products[0].product_name;
        this.onProductChange();
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[ProductionEntry] Failed to load products:', error);
      alert('Failed to load products');
    }
  }

  /**
   * Load workers
   */
  async loadWorkers() {
    try {
      this.availableWorkers = await this.workerService.getWorkers();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load workers:', error);
      alert('Failed to load workers');
    }
  }

  /**
   * Handle product change
   */
  onProductChange() {
    const product = this.products.find(p => p.product_name === this.productName);
    this.selectedProductVariants = product?.variants || [];
    
    // Reset variant if not applicable
    if (this.selectedProductVariants.length === 0) {
      this.productVariant = null;
    } else if (!this.selectedProductVariants.includes(this.productVariant || '')) {
      this.productVariant = this.selectedProductVariants[0];
    }

    this.calculateMaterials();
  }

  /**
   * Handle variant change
   */
  onVariantChange() {
    this.calculateMaterials();
  }

  /**
   * Handle quantity change
   */
  onQuantityChange() {
    this.calculateMaterials();
  }

  /**
   * Calculate materials needed
   */
  async calculateMaterials() {
    const totalQuantity = this.successQuantity + this.rejectedQuantity;
    
    if (!this.productName || totalQuantity <= 0) {
      this.materialCalc = null;
      return;
    }

    this.isCalculating = true;

    try {
      this.materialCalc = await this.recipeService.calculateMaterialsNeeded(
        this.productName,
        this.productVariant,
        totalQuantity
      );
    } catch (error) {
      console.error('Failed to calculate materials:', error);
      this.materialCalc = null;
    } finally {
      this.isCalculating = false;
    }
  }

  /**
   * Add worker
   */
  addWorker(worker: Worker) {
    // Check if already added
    if (this.selectedWorkers.some(w => w.worker.id === worker.id)) {
      return;
    }

    this.selectedWorkers.push({
      worker,
      attendanceType: 'Full Day',
      wageEarned: WAGE_RATES['Full Day'],
      paidToday: 0
    });
  }

  /**
   * Remove worker
   */
  removeWorker(index: number) {
    this.selectedWorkers.splice(index, 1);
  }

  /**
   * Handle attendance type change
   */
  onAttendanceChange(workerEntry: any) {
    workerEntry.wageEarned = WAGE_RATES[workerEntry.attendanceType as keyof typeof WAGE_RATES];
  }

  /**
   * Get total labor cost
   */
  getTotalLaborCost(): number {
    return this.selectedWorkers.reduce((sum, w) => sum + w.wageEarned, 0);
  }

  /**
   * Get total paid today
   */
  getTotalPaidToday(): number {
    return this.selectedWorkers.reduce((sum, w) => sum + w.paidToday, 0);
  }

  /**
   * Get labor liability (unpaid portion)
   */
  getLaborLiability(): number {
    return this.getTotalLaborCost() - this.getTotalPaidToday();
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    const materialCost = this.materialCalc?.costs.total_cost || 0;
    const laborCost = this.getTotalLaborCost();
    return materialCost + laborCost;
  }

  /**
   * Get cost per unit
   */
  getCostPerUnit(): number {
    if (this.successQuantity === 0) return 0;
    return this.getTotalCost() / this.successQuantity;
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return (
      this.productName !== '' &&
      this.successQuantity > 0 &&
      this.materialCalc !== null &&
      this.materialCalc.stock_check.all_available &&
      this.selectedWorkers.length > 0
    );
  }

  /**
   * Save production
   */
  async saveProduction() {
    if (!this.isFormValid()) {
      alert('Please fill all required fields and ensure sufficient stock');
      return;
    }

    if (!confirm(`Save production of ${this.successQuantity} ${this.productName}?`)) {
      return;
    }

    this.saving = true;

    try {
      // Prepare worker wages
      const workers: WorkerWage[] = this.selectedWorkers.map(w => ({
        worker_id: w.worker.id,
        worker_name: w.worker.name,
        attendance_type: w.attendanceType,
        wage_earned: w.wageEarned,
        paid_today: w.paidToday,
        notes: ''
      }));

      // Prepare production data
      const productionData: ProductionData = {
        date: this.date,
        product_name: this.productName,
        product_variant: this.productVariant,
        success_quantity: this.successQuantity,
        rejected_quantity: this.rejectedQuantity,
        workers,
        is_job_work: this.isJobWork,
        job_work_client: this.isJobWork ? this.jobWorkClient : undefined,
        notes: this.notes
      };

      // Save production
      const result = await this.productionService.saveProduction(productionData);

      if (result.success) {
        alert('Production saved successfully!');
        this.resetForm();
        await this.loadWorkers(); // Refresh to show updated balances
      } else {
        alert(`Failed to save production: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Save production error:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      this.saving = false;
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    this.date = new Date().toISOString().split('T')[0];
    this.successQuantity = 0;
    this.rejectedQuantity = 0;
    this.isJobWork = false;
    this.jobWorkClient = '';
    this.notes = '';
    this.selectedWorkers = [];
    this.materialCalc = null;
  }

  /**
   * Get worker display name with balance
   */
  getWorkerDisplayName(worker: Worker): string {
    const balance = worker.cumulative_balance;
    if (balance > 0) {
      return `${worker.name} (Owed: ₹${balance.toFixed(0)})`;
    } else if (balance < 0) {
      return `${worker.name} (Advance: ₹${Math.abs(balance).toFixed(0)})`;
    }
    return worker.name;
  }

  /**
   * Format number with 2 decimals
   */
  formatNumber(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return `₹${value.toFixed(2)}`;
  }

  /**
   * Format product name for display (ROUND_PLATE → Round Plate)
   */
  formatProductName(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
