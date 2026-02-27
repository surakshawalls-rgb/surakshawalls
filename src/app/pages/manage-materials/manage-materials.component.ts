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
import { InventoryService, MaterialStock } from '../../services/inventory.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-manage-materials',
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
  templateUrl: './manage-materials.component.html',
  styleUrls: ['./manage-materials.component.css']
})
export class ManageMaterialsComponent implements OnInit {

  materials: MaterialStock[] = [];
  filteredMaterials: MaterialStock[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  editingMaterial: MaterialStock | null = null;
  editForm = {
    material_name: '',
    unit: '',
    unit_cost: 0,
    low_stock_alert: 0,
    active: true
  };

  // Delete modal
  showDeleteModal: boolean = false;
  deletingMaterial: MaterialStock | null = null;

  // Table columns
  displayedColumns: string[] = ['material_name', 'unit', 'current_stock', 'unit_cost', 'low_stock_alert', 'last_purchase_date', 'active', 'actions'];

  constructor(
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  async loadMaterials() {
    try {
      this.loading = true;
      this.materials = await this.inventoryService.getAllRawMaterials();
      this.filteredMaterials = [...this.materials];
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to load materials: ' + error.message, 'error');
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredMaterials = [...this.materials];
      return;
    }

    this.filteredMaterials = this.materials.filter(material =>
      material.material_name.toLowerCase().includes(term) ||
      material.unit.toLowerCase().includes(term)
    );
  }

  openEditModal(material: MaterialStock) {
    this.editingMaterial = material;
    this.editForm = {
      material_name: material.material_name,
      unit: material.unit,
      unit_cost: material.unit_cost,
      low_stock_alert: material.low_stock_alert,
      active: material.active
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingMaterial = null;
  }

  async saveEdit() {
    if (!this.editingMaterial || !this.editForm.material_name.trim()) {
      this.notificationService.notify('Error', 'Material name is required', 'error');
      return;
    }

    try {
      const result = await this.inventoryService.updateRawMaterial(this.editingMaterial.id, this.editForm);
      if (result.success) {
        this.notificationService.notify('Success', 'Material updated successfully', 'success');
        this.closeEditModal();
        await this.loadMaterials();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to update material', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to update material: ' + error.message, 'error');
    }
  }

  openDeleteModal(material: MaterialStock) {
    this.deletingMaterial = material;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingMaterial = null;
  }

  async confirmDelete() {
    if (!this.deletingMaterial) return;

    try {
      const result = await this.inventoryService.deleteRawMaterial(this.deletingMaterial.id);
      if (result.success) {
        this.notificationService.notify('Success', 'Material deleted successfully', 'success');
        this.closeDeleteModal();
        await this.loadMaterials();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to delete material', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to delete material: ' + error.message, 'error');
    }
  }

  getStatusClass(active: boolean): string {
    return active ? 'status-active' : 'status-inactive';
  }

  getStockClass(material: MaterialStock): string {
    if (material.current_stock === 0) return 'stock-empty';
    if (material.current_stock < material.low_stock_alert) return 'stock-low';
    return 'stock-good';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
