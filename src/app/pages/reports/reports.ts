import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface DailySummary {
  date: string;
  labour_cost: number;
  material_cost: number;
  daily_expense: number;
  total_expense: number;
  sales_revenue: number;
  cash_received: number;
  pending_due: number;
  profit_loss: number;
  labour_paid_by: string;
  material_paid_by: string;
  expense_paid_by: string;
  orders_count: number;
}

interface WeeklySummary {
  week_start: string;
  week_end: string;
  week_number: string;
  total_labour: number;
  total_material: number;
  total_daily_expense: number;
  total_cost: number;
  total_sales: number;
  working_days: number;
  orders: number;
}

interface MonthlySummary {
  month_start: string;
  month_number: string;
  total_labour: number;
  total_material: number;
  total_daily_expense: number;
  total_cost: number;
  total_sales: number;
  total_collected: number;
  total_pending: number;
  working_days: number;
  orders: number;
  weeks: number;
}

interface PartnerSettlement {
  partner_id: string;
  name: string;
  profit_share: number;
  labour_paid: number;
  material_paid: number;
  expense_paid: number;
  total_paid: number;
  profit_earned: number;
  profit_shared: number;
  profit_due: number;
  cash_gave: number;
  cash_took: number;
  cash_due: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {
  
  reportType: 'daily' | 'weekly' | 'monthly' = 'daily';
  
  // Daily filters
  startDate: string = '';
  endDate: string = '';
  
  // Monthly filters
  selectedMonth: string = '';
  
  // Data
  dailySummary: DailySummary[] = [];
  weeklySummary: WeeklySummary[] = [];
  monthlySummary: MonthlySummary[] = [];
  partnerSettlement: PartnerSettlement[] = [];
  
  // UI state
  loading = false;
  language: 'en' | 'hi' = 'en';
  
  constructor(
    private db: SupabaseService,
    private cd: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.startDate = today;
    this.endDate = today;
    this.selectedMonth = today.substring(0, 7);
    this.loadReport();
  }
  
  async loadReport() {
    this.loading = true;
    try {
      if (this.reportType === 'daily') {
        await this.loadDailyReport();
      } else if (this.reportType === 'weekly') {
        await this.loadWeeklyReport();
      } else if (this.reportType === 'monthly') {
        await this.loadMonthlyReport();
      }
      await this.loadPartnerSettlement();
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Error loading report');
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  async loadDailyReport() {
    const { data, error } = await this.db.queryView('v_comprehensive_report')
      .gte('date', this.startDate)
      .lte('date', this.endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    this.dailySummary = data || [];
  }
  
  async loadWeeklyReport() {
    const { data, error } = await this.db.queryView('v_weekly_summary')
      .order('week_start', { ascending: false });
    
    if (error) throw error;
    this.weeklySummary = data || [];
  }
  
  async loadMonthlyReport() {
    const { data, error } = await this.db.queryView('v_monthly_summary')
      .order('month_start', { ascending: false });
    
    if (error) throw error;
    this.monthlySummary = data || [];
  }
  
  async loadPartnerSettlement() {
    const { data, error } = await this.db.queryView('v_partner_settlement_report');
    
    if (error) throw error;
    this.partnerSettlement = data || [];
  }
  
  onReportTypeChange() {
    this.loadReport();
  }
  
  onDateChange() {
    if (this.reportType === 'daily') {
      this.loadReport();
    }
  }
  
  onMonthChange() {
    if (this.reportType === 'monthly') {
      this.loadReport();
    }
  }
  
  toggleLanguage() {
    this.language = this.language === 'en' ? 'hi' : 'en';
  }
  
  // Export to CSV
  exportToCSV() {
    let csv = '';
    let filename = '';
    
    if (this.reportType === 'daily') {
      filename = `daily_report_${this.startDate}_to_${this.endDate}.csv`;
      csv = this.generateDailyCSV();
    } else if (this.reportType === 'weekly') {
      filename = `weekly_report_${new Date().toISOString().split('T')[0]}.csv`;
      csv = this.generateWeeklyCSV();
    } else if (this.reportType === 'monthly') {
      filename = `monthly_report_${this.selectedMonth}.csv`;
      csv = this.generateMonthlyCSV();
    }
    
    this.downloadCSV(csv, filename);
  }
  
  private generateDailyCSV(): string {
    let csv = 'Date,Labour Cost,Material Cost,Daily Expense,Total Expense,Sales Revenue,Cash Received,Pending Due,Profit/Loss,Orders,Labour Paid By,Material Paid By,Expense Paid By\n';
    
    this.dailySummary.forEach(row => {
      csv += `${row.date},${row.labour_cost},${row.material_cost},${row.daily_expense},${row.total_expense},${row.sales_revenue},${row.cash_received},${row.pending_due},${row.profit_loss},${row.orders_count},"${row.labour_paid_by}","${row.material_paid_by}","${row.expense_paid_by}"\n`;
    });
    
    const totals = this.getDailyTotals();
    csv += `TOTAL,${totals.labour},${totals.material},${totals.expense},${totals.totalExpense},${totals.sales},${totals.collected},${totals.pending},${totals.profit},${totals.orders}\n`;
    
    csv += '\n\nPARTNER SETTLEMENT\n';
    csv += 'Partner,Profit Share %,Labour Paid,Material Paid,Expense Paid,Total Paid,Profit Earned,Profit Shared,Profit Due,Cash Gave,Cash Took,Cash Due\n';
    
    this.partnerSettlement.forEach(row => {
      csv += `"${row.name}",${row.profit_share},${row.labour_paid},${row.material_paid},${row.expense_paid},${row.total_paid},${row.profit_earned},${row.profit_shared},${row.profit_due},${row.cash_gave},${row.cash_took},${row.cash_due}\n`;
    });
    
    return csv;
  }
  
  private generateWeeklyCSV(): string {
    let csv = 'Week,Week Start,Week End,Labour,Material,Daily Expense,Total Cost,Sales,Working Days,Orders\n';
    
    this.weeklySummary.forEach(row => {
      csv += `${row.week_number},${row.week_start},${row.week_end},${row.total_labour},${row.total_material},${row.total_daily_expense},${row.total_cost},${row.total_sales},${row.working_days},${row.orders}\n`;
    });
    
    const totals = this.getWeeklyTotals();
    csv += `TOTAL,,,${totals.labour},${totals.material},${totals.expense},${totals.totalExpense},${totals.sales},${totals.days},${totals.orders}\n`;
    
    csv += '\n\nPARTNER SETTLEMENT\n';
    csv += 'Partner,Profit Share %,Labour Paid,Material Paid,Expense Paid,Total Paid,Profit Earned,Profit Shared,Profit Due,Cash Gave,Cash Took,Cash Due\n';
    
    this.partnerSettlement.forEach(row => {
      csv += `"${row.name}",${row.profit_share},${row.labour_paid},${row.material_paid},${row.expense_paid},${row.total_paid},${row.profit_earned},${row.profit_shared},${row.profit_due},${row.cash_gave},${row.cash_took},${row.cash_due}\n`;
    });
    
    return csv;
  }
  
  private generateMonthlyCSV(): string {
    let csv = 'Month,Labour,Material,Daily Expense,Total Cost,Sales,Collected,Pending,Working Days,Orders,Weeks\n';
    
    this.monthlySummary.forEach(row => {
      csv += `${row.month_number},${row.total_labour},${row.total_material},${row.total_daily_expense},${row.total_cost},${row.total_sales},${row.total_collected},${row.total_pending},${row.working_days},${row.orders},${row.weeks.toFixed(2)}\n`;
    });
    
    const totals = this.getMonthlyTotals();
    csv += `TOTAL,,${totals.labour},${totals.material},${totals.expense},${totals.totalExpense},${totals.sales},${totals.collected},${totals.pending},${totals.days},${totals.orders}\n`;
    
    csv += '\n\nPARTNER SETTLEMENT\n';
    csv += 'Partner,Profit Share %,Labour Paid,Material Paid,Expense Paid,Total Paid,Profit Earned,Profit Shared,Profit Due,Cash Gave,Cash Took,Cash Due\n';
    
    this.partnerSettlement.forEach(row => {
      csv += `"${row.name}",${row.profit_share},${row.labour_paid},${row.material_paid},${row.expense_paid},${row.total_paid},${row.profit_earned},${row.profit_shared},${row.profit_due},${row.cash_gave},${row.cash_took},${row.cash_due}\n`;
    });
    
    return csv;
  }
  
  private downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Calculate totals
  getDailyTotals() {
    return {
      labour: this.dailySummary.reduce((sum, r) => sum + (r.labour_cost || 0), 0),
      material: this.dailySummary.reduce((sum, r) => sum + (r.material_cost || 0), 0),
      expense: this.dailySummary.reduce((sum, r) => sum + (r.daily_expense || 0), 0),
      totalExpense: this.dailySummary.reduce((sum, r) => sum + (r.total_expense || 0), 0),
      sales: this.dailySummary.reduce((sum, r) => sum + (r.sales_revenue || 0), 0),
      collected: this.dailySummary.reduce((sum, r) => sum + (r.cash_received || 0), 0),
      pending: this.dailySummary.reduce((sum, r) => sum + (r.pending_due || 0), 0),
      profit: this.dailySummary.reduce((sum, r) => sum + (r.profit_loss || 0), 0),
      orders: this.dailySummary.reduce((sum, r) => sum + (r.orders_count || 0), 0)
    };
  }
  
  getWeeklyTotals() {
    return {
      labour: this.weeklySummary.reduce((sum, r) => sum + (r.total_labour || 0), 0),
      material: this.weeklySummary.reduce((sum, r) => sum + (r.total_material || 0), 0),
      expense: this.weeklySummary.reduce((sum, r) => sum + (r.total_daily_expense || 0), 0),
      totalExpense: this.weeklySummary.reduce((sum, r) => sum + (r.total_cost || 0), 0),
      sales: this.weeklySummary.reduce((sum, r) => sum + (r.total_sales || 0), 0),
      days: this.weeklySummary.reduce((sum, r) => sum + (r.working_days || 0), 0),
      orders: this.weeklySummary.reduce((sum, r) => sum + (r.orders || 0), 0)
    };
  }
  
  getMonthlyTotals() {
    return {
      labour: this.monthlySummary.reduce((sum, r) => sum + (r.total_labour || 0), 0),
      material: this.monthlySummary.reduce((sum, r) => sum + (r.total_material || 0), 0),
      expense: this.monthlySummary.reduce((sum, r) => sum + (r.total_daily_expense || 0), 0),
      totalExpense: this.monthlySummary.reduce((sum, r) => sum + (r.total_cost || 0), 0),
      sales: this.monthlySummary.reduce((sum, r) => sum + (r.total_sales || 0), 0),
      collected: this.monthlySummary.reduce((sum, r) => sum + (r.total_collected || 0), 0),
      pending: this.monthlySummary.reduce((sum, r) => sum + (r.total_pending || 0), 0),
      days: this.monthlySummary.reduce((sum, r) => sum + (r.working_days || 0), 0),
      orders: this.monthlySummary.reduce((sum, r) => sum + (r.orders || 0), 0)
    };
  }
}
