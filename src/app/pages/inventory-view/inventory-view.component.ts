// src/app/pages/inventory-view/inventory-view.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-view.component.html',
  styleUrls: ['./inventory-view.component.css']
})
export class InventoryViewComponent implements OnInit {
  finishedGoods: any[] = [];
  rawMaterials: any[] = [];
  lowStockAlerts: any[] = [];
  inventoryValuation: any = null;

  loading: boolean = false;

  constructor(
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [finished, materials, alerts, valuation] = await Promise.all([
        this.inventoryService.getInventory(),
        this.inventoryService.getMaterialsStock(),
        this.inventoryService.getLowStockAlerts(),
        this.inventoryService.getInventoryValuation()
      ]);

      this.finishedGoods = finished;
      this.rawMaterials = materials;
      this.lowStockAlerts = alerts;
      this.inventoryValuation = valuation;
    } catch (error: any) {
      console.error('[Inventory] loadData error:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getStockClass(current: number, reorder: number): string {
    if (current === 0) return 'out-of-stock';
    if (current <= reorder) return 'low-stock';
    return 'in-stock';
  }
}
