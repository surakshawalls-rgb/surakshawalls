// src/app/pages/reports-dashboard/reports-dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsNewService } from '../../services/reports-new.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  // Date filters
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  dateRange = {
    start: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  // Report data
  dailySummary: any = null;
  monthlyPL: any = null;
  partnerSettlement: any[] = [];
  workerReport: any[] = [];
  materialStock: any[] = [];
  clientOutstanding: any[] = [];
  inventoryValuation: any[] = [];

  // Active view
  activeView: 'daily' | 'monthly' | 'partner' | 'worker' | 'material' | 'client' | 'inventory' = 'daily';

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private reportsService: ReportsNewService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadDailySummary();
  }

  async loadDailySummary() {
    try {
      this.loading = true;
      this.activeView = 'daily';
      this.dailySummary = await this.reportsService.getDailySummary(this.selectedDate);
    } catch (error: any) {
      this.errorMessage = 'Failed to load daily summary: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadMonthlyPL() {
    try {
      this.loading = true;
      this.activeView = 'monthly';
      this.monthlyPL = await this.reportsService.getMonthlyPL(this.selectedMonth);
    } catch (error: any) {
      this.errorMessage = 'Failed to load monthly P&L: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadPartnerSettlement() {
    try {
      this.loading = true;
      this.activeView = 'partner';
      this.partnerSettlement = await this.reportsService.getPartnerSettlement(
        this.dateRange.start,
        this.dateRange.end
      );
    } catch (error: any) {
      this.errorMessage = 'Failed to load partner settlement: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadWorkerReport() {
    try {
      this.loading = true;
      this.activeView = 'worker';
      this.workerReport = await this.reportsService.getWorkerLedgerReport(
        this.dateRange.start,
        this.dateRange.end
      );
    } catch (error: any) {
      this.errorMessage = 'Failed to load worker report: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadMaterialStock() {
    try {
      this.loading = true;
      this.activeView = 'material';
      this.materialStock = await this.reportsService.getMaterialStockReport();
    } catch (error: any) {
      this.errorMessage = 'Failed to load material stock: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadClientOutstanding() {
    try {
      this.loading = true;
      this.activeView = 'client';
      this.clientOutstanding = await this.reportsService.getClientOutstandingReport();
    } catch (error: any) {
      this.errorMessage = 'Failed to load client outstanding: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadInventoryValuation() {
    try {
      this.loading = true;
      this.activeView = 'inventory';
      this.inventoryValuation = await this.reportsService.getInventoryValuationReport();
    } catch (error: any) {
      this.errorMessage = 'Failed to load inventory valuation: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
