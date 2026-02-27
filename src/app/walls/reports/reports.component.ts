import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { ReportsService } from '../../services/reports.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-walls-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    BreadcrumbComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  // Date filters
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];

  // Reports data
  productionReport: any = null;
  salesReport: any = null;
  labourReport: any = null;
  inventoryReport: any = null;
  financialReport: any = null;

  loading = false;

  constructor(private reportsService: ReportsService) {}

  async ngOnInit() {
    await this.loadAllReports();
  }

  async loadAllReports() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadProductionReport(),
        this.loadSalesReport(),
        this.loadLabourReport(),
        this.loadInventoryReport(),
        this.loadFinancialReport()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadProductionReport() {
    try {
      const data = await this.reportsService.getProductionReport(this.startDate, this.endDate);
      this.productionReport = data;
    } catch (error) {
      console.error('Error loading production report:', error);
    }
  }

  async loadSalesReport() {
    try {
      const data = await this.reportsService.getSalesReport(this.startDate, this.endDate);
      this.salesReport = data;
    } catch (error) {
      console.error('Error loading sales report:', error);
    }
  }

  async loadLabourReport() {
    try {
      const data = await this.reportsService.getLabourReport(this.startDate, this.endDate);
      this.labourReport = data;
    } catch (error) {
      console.error('Error loading labour report:', error);
    }
  }

  async loadInventoryReport() {
    try {
      const data = await this.reportsService.getInventoryReport();
      this.inventoryReport = data;
    } catch (error) {
      console.error('Error loading inventory report:', error);
    }
  }

  async loadFinancialReport() {
    try {
      const data = await this.reportsService.getFinancialReport(this.startDate, this.endDate);
      this.financialReport = data;
    } catch (error) {
      console.error('Error loading financial report:', error);
    }
  }

  exportToExcel() {
    alert('Excel export feature coming soon!');
    // TODO: Implement Excel export using libraries like XLSX
  }

  print() {
    window.print();
  }
}
