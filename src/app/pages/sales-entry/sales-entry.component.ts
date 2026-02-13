// src/app/pages/sales-entry/sales-entry.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { ClientService, Client } from '../../services/client.service';
import { InventoryService } from '../../services/inventory.service';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-sales-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-entry.component.html',
  styleUrls: ['./sales-entry.component.css']
})
export class SalesEntryComponent implements OnInit {
  // Form data
  date: string = new Date().toISOString().split('T')[0];
  clientId: string = '';
  productName: string = '';
  quantity: number = 0;
  rate: number = 0;
  paymentType: 'full' | 'partial' | 'credit' = 'full';
  paymentAmount: number = 0;
  deliveryStatus: 'pending' | 'delivered' = 'pending';
  depositedToFirm: boolean = true;
  collectedByPartnerId: string | null = null;
  notes: string = '';

  // Data
  clients: Client[] = [];
  products: any[] = [];
  partners: any[] = [];
  currentStock: number = 0;
  totalAmount: number = 0;

  // UI State
  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  filteredClients: Client[] = [];
  clientSearchTerm: string = '';
  showClientDropdown: boolean = false;

  constructor(
    private salesService: SalesService,
    private clientService: ClientService,
    private inventoryService: InventoryService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;

      const [clients, inventory, productList] = await Promise.all([
        this.clientService.getActiveClients(),
        this.inventoryService.getInventory(),
        this.recipeService.getProductList()
      ]);

      this.clients = clients;
      this.filteredClients = clients;
      
      // Build product list from product_recipes with inventory data merged
      const inventoryMap = new Map(inventory.map(inv => [inv.product_name, inv]));
      
      this.products = productList.map(prod => {
        const inv = inventoryMap.get(prod.product_name);
        return {
          product_name: prod.product_name,
          stock: inv?.current_stock || 0,
          selling_price: inv?.selling_price || 0
        };
      });

      // Load partners (for collection tracking)
      // TODO: Create PartnerService and load from partners_master
      this.partners = [
        { id: '1', partner_name: 'Pradeep' },
        { id: '2', partner_name: 'Praveen' },
        { id: '3', partner_name: 'Pappu' }
      ];

      this.cdr.detectChanges();

    } catch (error: any) {
      console.error('[SalesEntry] loadData error:', error);
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  filterClients() {
    const term = this.clientSearchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(c => 
      c.client_name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
    this.showClientDropdown = true;
  }

  selectClient(client: Client) {
    this.clientId = client.id;
    this.clientSearchTerm = client.client_name;
    this.showClientDropdown = false;
  }

  async onProductChange() {
    if (!this.productName) return;

    const product = this.products.find(p => p.product_name === this.productName);
    if (product) {
      this.currentStock = product.stock;
      this.rate = product.selling_price;
      this.calculateTotal();
    }
  }

  onQuantityChange() {
    this.calculateTotal();
    if (this.paymentType === 'full') {
      this.paymentAmount = this.totalAmount;
    }
  }

  onRateChange() {
    this.calculateTotal();
    if (this.paymentType === 'full') {
      this.paymentAmount = this.totalAmount;
    }
  }

  onPaymentTypeChange() {
    if (this.paymentType === 'full') {
      this.paymentAmount = this.totalAmount;
    } else if (this.paymentType === 'credit') {
      this.paymentAmount = 0;
    }
  }

  calculateTotal() {
    this.totalAmount = this.quantity * this.rate;
  }

  isFormValid(): boolean {
    if (!this.clientId || !this.productName || this.quantity <= 0 || this.rate <= 0) {
      return false;
    }

    if (this.quantity > this.currentStock) {
      return false;
    }

    if (this.paymentType === 'partial' && (this.paymentAmount <= 0 || this.paymentAmount > this.totalAmount)) {
      return false;
    }

    return true;
  }

  async saveSale() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const result = await this.salesService.createSale({
        date: this.date,
        client_id: this.clientId,
        product_name: this.productName,
        product_variant: null,
        quantity: this.quantity,
        rate_per_unit: this.rate,
        payment_type: this.paymentType,
        paid_amount: this.paymentAmount,
        deposited_to_firm: this.depositedToFirm,
        collected_by_partner_id: this.collectedByPartnerId || undefined,
        notes: this.notes
      });

      if (result.success) {
        this.successMessage = `Sale saved successfully! Invoice #${result.sale?.invoice_number || 'N/A'}`;        
        
        // Reset form
        this.resetForm();
        
        // Reload data
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to save sale';
      }

    } catch (error: any) {
      console.error('[SalesEntry] saveSale error:', error);
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.date = new Date().toISOString().split('T')[0];
    this.clientId = '';
    this.clientSearchTerm = '';
    this.productName = '';
    this.quantity = 0;
    this.rate = 0;
    this.paymentType = 'full';
    this.paymentAmount = 0;
    this.deliveryStatus = 'pending';
    this.depositedToFirm = true;
    this.collectedByPartnerId = null;
    this.notes = '';
    this.currentStock = 0;
    this.totalAmount = 0;
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
