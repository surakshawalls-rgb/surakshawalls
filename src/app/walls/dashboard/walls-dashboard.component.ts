// walls-dashboard.component.ts - Main Dashboard with Real-time Summary
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';
import { interval, Subscription } from 'rxjs';

interface DashboardSummary {
  productionCount: number;
  salesRevenue: number;
  wagesPaid: number;
  cashBalance: number;
}

interface Alert {
  type: 'error' | 'warning' | 'info';
  icon: string;
  message: string;
  action?: string;
  route?: string;
}

interface QuickStat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-walls-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p class="date">{{ currentDate | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <button mat-icon-button (click)="refreshData()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        
        <!-- Today's Summary Cards -->
        <section class="summary-section">
          <h2>📅 Today's Summary</h2>
          <div class="summary-cards">
            <mat-card class="summary-card production">
              <mat-card-content>
                <mat-icon>factory</mat-icon>
                <div class="card-info">
                  <span class="card-value">{{ summary.productionCount }}</span>
                  <span class="card-label">units</span>
                </div>
                <span class="card-title">Production</span>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card sales">
              <mat-card-content>
                <mat-icon>point_of_sale</mat-icon>
                <div class="card-info">
                  <span class="card-value">₹{{ formatNumber(summary.salesRevenue) }}</span>
                  <span class="card-label">revenue</span>
                </div>
                <span class="card-title">Sales</span>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card wages">
              <mat-card-content>
                <mat-icon>engineering</mat-icon>
                <div class="card-info">
                  <span class="card-value">₹{{ formatNumber(summary.wagesPaid) }}</span>
                  <span class="card-label">paid</span>
                </div>
                <span class="card-title">Wages</span>
              </mat-card-content>
            </mat-card>

            <mat-card class="summary-card cash">
              <mat-card-content>
                <mat-icon>account_balance_wallet</mat-icon>
                <div class="card-info">
                  <span class="card-value" [class.positive]="summary.cashBalance > 0">
                    {{ summary.cashBalance >= 0 ? '+' : '' }}₹{{ formatNumber(summary.cashBalance) }}
                  </span>
                  <span class="card-label">balance</span>
                </div>
                <span class="card-title">Cash</span>
              </mat-card-content>
            </mat-card>
          </div>
        </section>

        <!-- Alerts & Actions -->
        <section class="alerts-section" *ngIf="alerts.length > 0">
          <h2>🚨 Alerts & Actions</h2>
          <div class="alerts-list">
            <mat-card 
              *ngFor="let alert of alerts" 
              class="alert-card"
              [class.error]="alert.type === 'error'"
              [class.warning]="alert.type === 'warning'"
              [class.info]="alert.type === 'info'"
              (click)="handleAlertClick(alert)"
            >
              <mat-card-content>
                <mat-icon>{{ alert.icon }}</mat-icon>
                <span class="alert-message">{{ alert.message }}</span>
                <mat-icon class="arrow">arrow_forward</mat-icon>
              </mat-card-content>
            </mat-card>
          </div>
        </section>

        <!-- Quick Stats -->
        <section class="stats-section">
          <h2>📈 Quick Stats</h2>
          <div class="stats-grid">
            <mat-card *ngFor="let stat of stats" class="stat-card">
              <mat-card-content>
                <div class="stat-icon" [style.background-color]="stat.color + '20'">
                  <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
                </div>
                <div class="stat-details">
                  <span class="stat-label">{{ stat.label }}</span>
                  <span class="stat-value">{{ stat.value }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="actions-section">
          <h2>⚡ Quick Actions</h2>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="navigate('/walls/production/new')">
              <mat-icon>add</mat-icon>
              New Production
            </button>
            <button mat-raised-button color="accent" (click)="navigate('/walls/sales/new')">
              <mat-icon>add</mat-icon>
              New Sale
            </button>
            <button mat-raised-button (click)="navigate('/walls/labour/wages')">
              <mat-icon>payments</mat-icon>
              Pay Wage
            </button>
            <button mat-raised-button (click)="navigate('/walls/reports')">
              <mat-icon>analytics</mat-icon>
              View Reports
            </button>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      margin: 0;
      color: #1F2937;
      font-size: 2rem;
    }

    .date {
      color: #6B7280;
      margin: 0.25rem 0 0 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    /* Summary Cards */
    .summary-section h2 {
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white !important;
      border-radius: 12px !important;
      overflow: hidden;
    }

    .summary-card mat-card-content {
      padding: 1.5rem !important;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .summary-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.8;
    }

    .summary-card .card-info {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .summary-card .card-value {
      font-size: 2rem;
      font-weight: bold;
    }

    .summary-card .card-label {
      font-size: 0.875rem;
      color: #6B7280;
    }

    .summary-card .card-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6B7280;
      margin-top: 0.5rem;
    }

    .summary-card.production {
      border-left: 4px solid #7C3AED;
    }

    .summary-card.production mat-icon,
    .summary-card.production .card-value {
      color: #7C3AED;
    }

    .summary-card.sales {
      border-left: 4px solid #059669;
    }

    .summary-card.sales mat-icon,
    .summary-card.sales .card-value {
      color: #059669;
    }

    .summary-card.wages {
      border-left: 4px solid #EA580C;
    }

    .summary-card.wages mat-icon,
    .summary-card.wages .card-value {
      color: #EA580C;
    }

    .summary-card.cash {
      border-left: 4px solid #2563EB;
    }

    .summary-card.cash mat-icon,
    .summary-card.cash .card-value {
      color: #2563EB;
    }

    .summary-card.cash .card-value.positive {
      color: #059669;
    }

    /* Alerts */
    .alerts-section h2 {
      color: #374151;
      margin: 2rem 0 1rem 0;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .alert-card {
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .alert-card:hover {
      transform: translateX(4px);
    }

    .alert-card mat-card-content {
      padding: 1rem !important;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .alert-card mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .alert-card .alert-message {
      flex: 1;
    }

    .alert-card .arrow {
      opacity: 0.5;
    }

    .alert-card.error {
      border-left: 4px solid #EF4444;
      background: #FEF2F2 !important;
    }

    .alert-card.error mat-icon {
      color: #EF4444;
    }

    .alert-card.warning {
      border-left: 4px solid #F59E0B;
      background: #FFFBEB !important;
    }

    .alert-card.warning mat-icon {
      color: #F59E0B;
    }

    .alert-card.info {
      border-left: 4px solid #3B82F6;
      background: #EFF6FF !important;
    }

    .alert-card.info mat-icon {
      color: #3B82F6;
    }

    /* Quick Stats */
    .stats-section h2 {
      color: #374151;
      margin: 2rem 0 1rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card mat-card-content {
      padding: 1rem !important;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6B7280;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1F2937;
    }

    /* Quick Actions */
    .actions-section h2 {
      color: #374151;
      margin: 2rem 0 1rem 0;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-buttons button {
      padding: 1rem;
      height: auto;
    }

    .action-buttons button mat-icon {
      margin-right: 0.5rem;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-header h1 {
        font-size: 1.5rem;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WallsDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  currentDate = new Date();
  
  summary: DashboardSummary = {
    productionCount: 0,
    salesRevenue: 0,
    wagesPaid: 0,
    cashBalance: 0
  };

  alerts: Alert[] = [];
  stats: QuickStat[] = [];

  private refreshSubscription?: Subscription;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Auto-refresh every minute
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.loading = true;
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's summary using exact table/column names from schema
      await Promise.all([
        this.loadProductionCount(today),
        this.loadSalesRevenue(today),
        this.loadWagesPaid(today),
        this.loadCashBalance(today),
        this.loadAlerts(),
        this.loadStats()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadProductionCount(date: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('production_entries')
      .select('success_quantity')
      .eq('date', date);

    if (!error && data) {
      this.summary.productionCount = data.reduce((sum: number, entry: any) => 
        sum + (entry.success_quantity || 0), 0
      );
    }
  }

  private async loadSalesRevenue(date: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('sales_transactions')
      .select('total_amount')
      .eq('date', date);

    if (!error && data) {
      this.summary.salesRevenue = data.reduce((sum: number, sale: any) => 
        sum + (sale.total_amount || 0), 0
      );
    }
  }

  private async loadWagesPaid(date: string): Promise<void> {
    const { data, error } = await this.supabase.supabase
      .from('wage_entries')
      .select('paid_today')
      .eq('date', date);

    if (!error && data) {
      this.summary.wagesPaid = data.reduce((sum: number, wage: any) => 
        sum + (wage.paid_today || 0), 0
      );
    }
  }

  private async loadCashBalance(date: string): Promise<void> {
    // Calculate today's cash flow from firm_cash_ledger
    const { data, error } = await this.supabase.supabase
      .from('firm_cash_ledger')
      .select('type, amount')
      .eq('date', date);

    if (!error && data) {
      let receipts = 0;
      let payments = 0;
      
      data.forEach((entry: any) => {
        if (entry.type === 'receipt') {
          receipts += entry.amount || 0;
        } else if (entry.type === 'payment') {
          payments += entry.amount || 0;
        }
      });
      
      this.summary.cashBalance = receipts - payments;
    }
  }

  private async loadAlerts(): Promise<void> {
    this.alerts = [];

    // Check low stock - raw materials
    const { data: lowStockMaterials } = await this.supabase.supabase
      .from('raw_materials_master')
      .select('material_name, current_stock, low_stock_alert')
      .lte('current_stock', 'low_stock_alert')
      .eq('active', true)
      .limit(3);

    if (lowStockMaterials && lowStockMaterials.length > 0) {
      lowStockMaterials.forEach((material: any) => {
        this.alerts.push({
          type: 'error',
          icon: 'warning',
          message: `Low Stock: ${material.material_name} (${material.current_stock} remaining)`,
          route: '/walls/stock'
        });
      });
    }

    // Check client dues
    const { data: clientsDue } = await this.supabase.supabase
      .from('client_ledger')
      .select('client_name, outstanding')
      .gt('outstanding', 0)
      .eq('active', true)
      .order('outstanding', { ascending: false })
      .limit(3);

    if (clientsDue && clientsDue.length > 0) {
      clientsDue.forEach((client: any) => {
        this.alerts.push({
          type: 'warning',
          icon: 'account_balance',
          message: `Client Due: ${client.client_name} (₹${this.formatNumber(client.outstanding)})`,
          route: '/walls/sales/clients'
        });
      });
    }

    // Check worker balances
    const { data: workersBalance } = await this.supabase.supabase
      .from('workers_master')
      .select('name, cumulative_balance')
      .gt('cumulative_balance', 0)
      .eq('active', true)
      .limit(5);

    if (workersBalance && workersBalance.length > 0) {
      this.alerts.push({
        type: 'info',
        icon: 'engineering',
        message: `Worker Balance: ${workersBalance.length} workers have pending dues`,
        route: '/walls/labour/workers'
      });
    }
  }

  private async loadStats(): Promise<void> {
    // Stock Value
    const { data: finishedGoods } = await this.supabase.supabase
      .from('finished_goods_inventory')
      .select('current_stock, unit_cost');

    let stockValue = 0;
    if (finishedGoods) {
      stockValue = finishedGoods.reduce((sum: number, item: any) => 
        sum + ((item.current_stock || 0) * (item.unit_cost || 0)), 0
      );
    }

    // Client Dues
    const { data: clientsData } = await this.supabase.supabase
      .from('client_ledger')
      .select('outstanding')
      .gt('outstanding', 0);

    const clientDues = clientsData ? clientsData.reduce((sum: number, client: any) => 
      sum + (client.outstanding || 0), 0
    ) : 0;

    // Worker Balances
    const { data: workersData } = await this.supabase.supabase
      .from('workers_master')
      .select('cumulative_balance')
      .gt('cumulative_balance', 0);

    const workerBalances = workersData ? workersData.reduce((sum: number, worker: any) => 
      sum + (worker.cumulative_balance || 0), 0
    ) : 0;

    this.stats = [
      {
        label: 'Stock Value',
        value: `₹${this.formatNumber(stockValue)}`,
        icon: 'inventory_2',
        color: '#7C3AED'
      },
      {
        label: 'Client Dues',
        value: `₹${this.formatNumber(clientDues)}`,
        icon: 'account_circle',
        color: '#F59E0B'
      },
      {
        label: 'Worker Balance',
        value: `₹${this.formatNumber(workerBalances)}`,
        icon: 'engineering',
        color: '#EA580C'
      }
    ];
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  handleAlertClick(alert: Alert): void {
    if (alert.route) {
      this.router.navigate([alert.route]);
    }
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  formatNumber(value: number): string {
    if (value >= 100000) {
      return (value / 100000).toFixed(1) + 'L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  }
}
