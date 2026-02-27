// src/app/pages/material-purchase/material-purchase.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialPurchaseService } from '../../services/material-purchase.service';
import { InventoryService } from '../../services/inventory.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-material-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './material-purchase.component.html',
  styleUrls: ['./material-purchase.component.css']
})
export class MaterialPurchaseComponent implements OnInit {
  // Form data
  date: string = new Date().toISOString().split('T')[0];
  materialName: string = '';
  quantity: number = 0;
  unitCost: number = 0;
  vendorName: string = '';
  partnerId: string = '';
  paidFrom: 'office_cash' | 'partner_pocket' = 'office_cash';
  invoiceNumber: string = '';
  notes: string = '';

  // Data
  materials: any[] = [];
  partners: any[] = [];
  purchaseHistory: any[] = [];
  totalAmount: number = 0;

  // UI State
  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private purchaseService: MaterialPurchaseService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;

      const [materials, history, partners] = await Promise.all([
        this.inventoryService.getMaterialsStock(),
        this.purchaseService.getPurchaseHistory(),
        this.loadPartners()
      ]);

      this.materials = materials;
      this.purchaseHistory = history.slice(0, 10); // Last 10 purchases
      this.partners = partners;

    } catch (error: any) {
      console.error('[MaterialPurchase] loadData error:', error);
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadPartners(): Promise<any[]> {
    try {
      const { data, error } = await this.inventoryService['supabase'].supabase
        .from('partner_master')
        .select('id, partner_name')
        .order('partner_name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading partners:', error);
      return [];
    }
  }

  onMaterialChange() {
    const material = this.materials.find(m => m.material_name === this.materialName);
    if (material) {
      this.unitCost = material.unit_cost;
      this.calculateTotal();
    }
  }

  onQuantityChange() {
    this.calculateTotal();
  }

  onUnitCostChange() {
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.quantity * this.unitCost;
  }

  isFormValid(): boolean {
    return !!(this.materialName && this.quantity > 0 && this.unitCost > 0 && this.paidFrom);
  }

  async savePurchase() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const result = await this.purchaseService.recordPurchase({
        date: this.date,
        material_name: this.materialName,
        quantity: this.quantity,
        unit_cost: this.unitCost,
        vendor_name: this.vendorName || undefined,
        partner_id: this.partnerId || undefined,
        paid_from: this.paidFrom,
        invoice_number: this.invoiceNumber || undefined,
        notes: this.notes || undefined
      });

      if (result.success) {
        this.successMessage = 'Purchase recorded successfully!';
        this.resetForm();
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to record purchase';
      }

    } catch (error: any) {
      console.error('[MaterialPurchase] savePurchase error:', error);
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.date = new Date().toISOString().split('T')[0];
    this.materialName = '';
    this.quantity = 0;
    this.unitCost = 0;
    this.vendorName = '';
    this.partnerId = '';
    this.paidFrom = 'office_cash';
    this.invoiceNumber = '';
    this.notes = '';
    this.totalAmount = 0;
  }
}
