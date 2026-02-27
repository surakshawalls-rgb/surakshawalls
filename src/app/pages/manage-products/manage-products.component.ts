import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventoryService, FinishedGood } from '../../services/inventory.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatCardModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.css']
})
export class ManageProductsComponent implements OnInit {

  products: FinishedGood[] = [];
  filteredProducts: FinishedGood[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  editingProduct: FinishedGood | null = null;
  editForm = {
    product_name: '',
    product_variant: '',
    unit_price: 0,
    low_stock_alert: 0
  };

  // Delete modal
  showDeleteModal: boolean = false;
  deletingProduct: FinishedGood | null = null;

  // Table columns
  displayedColumns: string[] = ['product_name', 'product_variant', 'current_stock', 'unit_cost', 'unit_price', 'low_stock_alert', 'total_sold', 'actions'];

  constructor(
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      this.loading = true;
      this.products = await this.inventoryService.getInventory();
      this.filteredProducts = [...this.products];
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to load products: ' + error.message, 'error');
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(product =>
      product.product_name.toLowerCase().includes(term) ||
      (product.product_variant && product.product_variant.toLowerCase().includes(term))
    );
  }

  openEditModal(product: FinishedGood) {
    this.editingProduct = product;
    this.editForm = {
      product_name: product.product_name,
      product_variant: product.product_variant || '',
      unit_price: product.unit_price,
      low_stock_alert: product.low_stock_alert
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingProduct = null;
  }

  async saveEdit() {
    if (!this.editingProduct || !this.editForm.product_name.trim()) {
      this.notificationService.notify('Error', 'Product name is required', 'error');
      return;
    }

    try {
      const result = await this.inventoryService.updateProduct(this.editingProduct.id, this.editForm);
      if (result.success) {
        this.notificationService.notify('Success', 'Product updated successfully', 'success');
        this.closeEditModal();
        await this.loadProducts();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to update product', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to update product: ' + error.message, 'error');
    }
  }

  openDeleteModal(product: FinishedGood) {
    this.deletingProduct = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingProduct = null;
  }

  async confirmDelete() {
    if (!this.deletingProduct) return;

    try {
      const result = await this.inventoryService.deleteProduct(this.deletingProduct.id);
      if (result.success) {
        this.notificationService.notify('Success', 'Product deleted successfully', 'success');
        this.closeDeleteModal();
        await this.loadProducts();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to delete product', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to delete product: ' + error.message, 'error');
    }
  }

  getStockClass(product: FinishedGood): string {
    if (product.current_stock === 0) return 'stock-empty';
    if (product.current_stock < product.low_stock_alert) return 'stock-low';
    return 'stock-good';
  }

  getProductDisplay(product: FinishedGood): string {
    return product.product_variant 
      ? `${product.product_name} (${product.product_variant})`
      : product.product_name;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
