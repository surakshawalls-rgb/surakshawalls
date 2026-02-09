// src/app/pages/stock-audit/stock-audit.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockAuditService } from '../../services/stock-audit.service';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-stock-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-audit.component.html',
  styleUrls: ['./stock-audit.component.css']
})
export class StockAuditComponent implements OnInit {
  auditDate: string = new Date().toISOString().split('T')[0];
  materialName: string = '';
  physicalCount: number = 0;
  notes: string = '';

  materials: any[] = [];
  digitalStock: number = 0;
  variance: number = 0;
  pendingAudits: any[] = [];
  auditHistory: any[] = [];

  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private auditService: StockAuditService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [materials, pending, history] = await Promise.all([
        this.inventoryService.getMaterialsStock(),
        this.auditService.getPendingAudits(),
        this.auditService.getAuditHistory()
      ]);
      this.materials = materials;
      this.pendingAudits = pending;
      this.auditHistory = history.slice(0, 10);
    } catch (error: any) {
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onMaterialChange() {
    const material = this.materials.find(m => m.material_name === this.materialName);
    if (material) {
      this.digitalStock = material.current_stock;
      this.calculateVariance();
    }
  }

  onPhysicalCountChange() {
    this.calculateVariance();
  }

  calculateVariance() {
    this.variance = this.physicalCount - this.digitalStock;
  }

  async createAudit() {
    if (!this.materialName || this.physicalCount < 0) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    try {
      this.saving = true;
      const result = await this.auditService.createAudit({
        date: this.auditDate,
        material_name: this.materialName,
        physical_count: this.physicalCount,
        reason: this.notes || 'Stock audit',
        approved_by: 'System'
      });

      if (result.success) {
        this.successMessage = 'Audit created successfully! Awaiting approval.';
        this.resetForm();
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to create audit';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  async approveAudit(audit: any) {
    try {
      const result = await this.auditService.approveAudit(audit.id, 'Admin');
      if (result.success) {
        this.successMessage = 'Audit approved and stock adjusted!';
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to approve audit';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    }
  }

  async rejectAudit(audit: any) {
    try {
      const result = await this.auditService.rejectAudit(audit.id, 'Admin');
      if (result.success) {
        this.successMessage = 'Audit rejected!';
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to reject audit';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    }
  }

  resetForm() {
    this.auditDate = new Date().toISOString().split('T')[0];
    this.materialName = '';
    this.physicalCount = 0;
    this.notes = '';
    this.digitalStock = 0;
    this.variance = 0;
  }

  getVarianceClass(variance: number): string {
    if (variance === 0) return 'zero';
    if (variance > 0) return 'positive';
    return 'negative';
  }
}
