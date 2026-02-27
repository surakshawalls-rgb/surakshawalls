// raw-materials.component.ts - Raw Materials Inventory View
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

interface RawMaterial {
  id: number;
  material_name: string;
  current_stock: number;
  unit: string;
  low_stock_alert: number;
  unit_cost: number;
  stockValue: number;
  status: 'critical' | 'low' | 'normal';
}

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="materials-container">
      <div class="materials-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>🧱 Raw Materials Inventory</h1>
          <p>Current stock levels and alerts</p>
        </div>
        <button mat-raised-button color="primary" (click)="navigate('/walls/stock/purchase')">
          <mat-icon>add</mat-icon>
          Purchase Order
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card critical">
          <mat-card-content>
            <mat-icon>warning</mat-icon>
            <div class="card-info">
              <span class="count">{{ criticalCount }}</span>
              <span class="label">Critical Stock</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card low">
          <mat-card-content>
            <mat-icon>info</mat-icon>
            <div class="card-info">
              <span class="count">{{ lowStockCount }}</span>
              <span class="label">Low Stock</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card total">
          <mat-card-content>
            <mat-icon>inventory</mat-icon>
            <div class="card-info">
              <span class="count">{{ materials.length }}</span>
              <span class="label">Total Materials</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>

      <!-- Materials Table -->
      <mat-card *ngIf="!loading" class="table-card">
        <table mat-table [dataSource]="materials" class="materials-table">
          
          <!-- Material Name -->
          <ng-container matColumnDef="material_name">
            <th mat-header-cell *matHeaderCellDef>Material</th>
            <td mat-cell *matCellDef="let material">
              <div class="material-cell">
                <strong>{{ material.material_name }}</strong>
              </div>
            </td>
          </ng-container>

          <!-- Current Stock -->
          <ng-container matColumnDef="current_stock">
            <th mat-header-cell *matHeaderCellDef>Current Stock</th>
            <td mat-cell *matCellDef="let material">
              <span class="stock-value">{{ material.current_stock }} {{ material.unit }}</span>
            </td>
          </ng-container>

          <!-- Alert Level -->
          <ng-container matColumnDef="low_stock_alert">
            <th mat-header-cell *matHeaderCellDef>Alert Level</th>
            <td mat-cell *matCellDef="let material">
              {{ material.low_stock_alert }} {{ material.unit }}
            </td>
          </ng-container>

          <!-- Unit Cost -->
          <ng-container matColumnDef="unit_cost">
            <th mat-header-cell *matHeaderCellDef>Unit Cost</th>
            <td mat-cell *matCellDef="let material">
              ₹{{ material.unit_cost }}
            </td>
          </ng-container>

          <!-- Stock Value -->
          <ng-container matColumnDef="stockValue">
            <th mat-header-cell *matHeaderCellDef>Stock Value</th>
            <td mat-cell *matCellDef="let material">
              <strong>₹{{ material.stockValue.toLocaleString() }}</strong>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let material">
              <mat-chip [class]="'status-chip ' + material.status">
                {{ material.status === 'critical' ? '🔴 Critical' : 
                   material.status === 'low' ? '🟡 Low Stock' : '🟢 Normal' }}
              </mat-chip>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
              [class.critical-row]="row.status === 'critical'"
              [class.low-row]="row.status === 'low'">
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .materials-container {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .materials-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .materials-header h1 {
      margin: 0;
      color: #1F2937;
      flex: 1;
    }

    .materials-header p {
      margin: 0.25rem 0 0 0;
      color: #6B7280;
      font-size: 0.875rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card mat-card-content {
      padding: 1.5rem !important;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .summary-card mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .summary-card.critical {
      border-left: 4px solid #DC2626;
    }

    .summary-card.critical mat-icon {
      color: #DC2626;
    }

    .summary-card.low {
      border-left: 4px solid #F59E0B;
    }

    .summary-card.low mat-icon {
      color: #F59E0B;
    }

    .summary-card.total {
      border-left: 4px solid #2563EB;
    }

    .summary-card.total mat-icon {
      color: #2563EB;
    }

    .card-info {
      display: flex;
      flex-direction: column;
    }

    .card-info .count {
      font-size: 2rem;
      font-weight: bold;
      color: #1F2937;
    }

    .card-info .label {
      font-size: 0.875rem;
      color: #6B7280;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .table-card {
      overflow-x: auto;
    }

    .materials-table {
      width: 100%;
    }

    .materials-table th {
      font-weight: 600;
      color: #374151;
      background: #F9FAFB;
    }

    .materials-table td {
      padding: 1rem;
    }

    .material-cell strong {
      color: #1F2937;
    }

    .stock-value {
      font-weight: 500;
    }

    .status-chip {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }

    .status-chip.critical {
      background: #FEE2E2 !important;
      color: #991B1B !important;
    }

    .status-chip.low {
      background: #FEF3C7 !important;
      color: #92400E !important;
    }

    .status-chip.normal {
      background: #D1FAE5 !important;
      color: #065F46 !important;
    }

    tr.critical-row {
      background: #FEF2F2;
    }

    tr.low-row {
      background: #FFFBEB;
    }

    @media (max-width: 768px) {
      .materials-container {
        padding: 1rem;
      }

      .materials-header {
        flex-wrap: wrap;
      }
    }
  `]
})
export class RawMaterialsComponent implements OnInit {
  loading = true;
  materials: RawMaterial[] = [];
  displayedColumns = ['material_name', 'current_stock', 'low_stock_alert', 'unit_cost', 'stockValue', 'status'];
  
  criticalCount = 0;
  lowStockCount = 0;

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  async loadMaterials(): Promise<void> {
    try {
      this.loading = true;

      const { data, error } = await this.supabase.supabase
        .from('raw_materials_master')
        .select('*')
        .eq('active', true)
        .order('material_name');

      if (error) throw error;

      if (data) {
        this.materials = data.map((m: any) => {
          const stockValue = m.current_stock * m.unit_cost;
          let status: 'critical' | 'low' | 'normal' = 'normal';
          
          if (m.current_stock === 0) {
            status = 'critical';
          } else if (m.current_stock <= m.low_stock_alert) {
            status = 'low';
          }

          return {
            ...m,
            stockValue,
            status
          };
        });

        this.criticalCount = this.materials.filter(m => m.status === 'critical').length;
        this.lowStockCount = this.materials.filter(m => m.status === 'low').length;
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      this.loading = false;
    }
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  goBack(): void {
    this.router.navigate(['/walls/stock']);
  }
}
