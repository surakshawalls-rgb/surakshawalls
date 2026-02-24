// src/app/pages/library-dashboard/library-dashboard.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';

interface DashboardStats {
  totalSeats: number;
  occupiedSeats: number;
  occupancyRate: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  fullTimeCount: number;
  firstHalfCount: number;
  secondHalfCount: number;
}

@Component({
  selector: 'app-library-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatBadgeModule
  ],
  templateUrl: './library-dashboard.component.html',
  styleUrls: ['./library-dashboard.component.css']
})
export class LibraryDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalSeats: 0, // Will be fetched dynamically from database
    occupiedSeats: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    cashBalance: 0,
    fullTimeCount: 0,
    firstHalfCount: 0,
    secondHalfCount: 0
  };

  last3MonthsRevenue: Array<{month: string, year: number, revenue: number}> = [];
  yearlyRevenue: number = 0;

  expiringSeats: any[] = [];
  recentPayments: any[] = [];
  recentExpenses: any[] = [];
  loading = true;
  errorMessage = '';

  // Attendance
  todayAttendance: any[] = [];
  showAttendanceSection = false;

  // Reports
  showReportsSection = false;
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  monthlyRevenue: any[] = [];
  studentPaymentReport: any[] = [];
  expenseCategoryReport: any[] = [];
  profitLoss: any = null;

  constructor(
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      this.errorMessage = '';

      // Load stats
      const dashboardStats = await this.libraryService.getDashboardStats();
      this.stats = { ...this.stats, ...dashboardStats };

      // Load revenue data
      this.last3MonthsRevenue = await this.libraryService.getLast3MonthsRevenue();
      this.yearlyRevenue = await this.libraryService.getYearlyRevenue();

      // Load expiring seats
      this.expiringSeats = await this.libraryService.getExpiringSeats(3);

      // Load recent payments (last 10)
      const allPayments = await this.libraryService.getPaymentHistory();
      this.recentPayments = allPayments.slice(0, 10);

      // Load recent expenses (last 10)
      this.recentExpenses = await this.libraryService.getExpenses();
      this.recentExpenses = this.recentExpenses.slice(0, 10);

      this.loading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      this.errorMessage = 'Failed to load dashboard data: ' + error.message;
      this.loading = false;
    }
  }

  sendReminderToAll() {
    if (this.expiringSeats.length === 0) {
      alert('No seats expiring soon!');
      return;
    }

    let message = '📚 Suraksha Library - Fee Reminders Sent:\n\n';
    this.expiringSeats.forEach(seat => {
      const whatsappMsg = `Hello ${seat.student_name}! Your library seat ${seat.seat_no} (${seat.shift_type}) expires on ${seat.expiry_date}. Please renew to continue. Thank you! - Suraksha Library`;
      const url = `https://wa.me/${seat.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
      window.open(url, '_blank');
      message += `✓ ${seat.student_name} (Seat ${seat.seat_no})\n`;
    });

    alert(message);
  }

  getDaysRemainingClass(daysRemaining: number): string {
    if (daysRemaining < 0) return 'danger';
    if (daysRemaining <= 1) return 'warning';
    return 'success';
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }

  getOccupancyPercentage(): number {
    if (this.stats.totalSeats === 0) return 0;
    return Math.round((this.stats.occupiedSeats / this.stats.totalSeats) * 100);
  }

  getCashBalanceClass(): string {
    if (this.stats.cashBalance < 0) return 'danger';
    if (this.stats.cashBalance < 5000) return 'warning';
    return 'success';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getTotalLast3Months(): number {
    return this.last3MonthsRevenue.reduce((sum, month) => sum + month.revenue, 0);
  }

  getCurrentMonthNumber(): number {
    return new Date().getMonth() + 1; // Returns 1-12
  }

  // ========================================
  // ATTENDANCE SECTION
  // ========================================

  async toggleAttendanceSection() {
    this.showAttendanceSection = !this.showAttendanceSection;
    this.cdr.detectChanges();
    if (this.showAttendanceSection && this.todayAttendance.length === 0) {
      await this.loadTodayAttendance();
    }
  }

  async loadTodayAttendance() {
    try {
      this.todayAttendance = await this.libraryService.getAllTodayAttendance();
      this.cdr.detectChanges();
    } catch (error: any) {
      this.errorMessage = 'Failed to load attendance: ' + error.message;
    }
  }

  getAttendanceStats() {
    const total = this.todayAttendance.length;
    const present = this.todayAttendance.filter(a => a.status === 'present').length;
    const late = this.todayAttendance.filter(a => a.status === 'late').length;
    const checkedOut = this.todayAttendance.filter(a => a.check_out_time).length;
    return { total, present, late, checkedOut };
  }

  // ========================================
  // REPORTS SECTION
  // ========================================

  async toggleReportsSection() {
    this.showReportsSection = !this.showReportsSection;
    this.cdr.detectChanges();
    if (this.showReportsSection) {
      await this.loadDetailedReports();
    }
  }

  async loadDetailedReports() {
    try {
      this.loading = true;
      
      // Load all reports in parallel
      const [revenue, studentPayments, expenseCategory, pl] = await Promise.all([
        this.libraryService.getMonthlyRevenueBreakdown(this.selectedYear, this.selectedMonth),
        this.libraryService.getStudentWisePaymentReport(),
        this.libraryService.getExpenseCategoryReport(this.selectedYear, this.selectedMonth),
        this.libraryService.getProfitLossStatement(this.selectedYear, this.selectedMonth)
      ]);

      this.monthlyRevenue = revenue;
      this.studentPaymentReport = studentPayments;
      this.expenseCategoryReport = expenseCategory;
      this.profitLoss = pl;

      this.loading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      this.errorMessage = 'Failed to load reports: ' + error.message;
      this.loading = false;
    }
  }

  async onMonthYearChange() {
    await this.loadDetailedReports();
  }

  getTotalRevenue(): number {
    return this.monthlyRevenue.reduce((sum, item) => sum + item.total, 0);
  }

  getTotalExpenses(): number {
    return this.expenseCategoryReport.reduce((sum, item) => sum + item.total, 0);
  }

  exportReportToCSV(reportType: string) {
    let data: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'revenue':
        data = this.monthlyRevenue;
        filename = `revenue-${this.selectedYear}-${this.selectedMonth}.csv`;
        break;
      case 'student-payments':
        data = this.studentPaymentReport;
        filename = `student-payments.csv`;
        break;
      case 'expenses':
        data = this.expenseCategoryReport;
        filename = `expenses-${this.selectedYear}-${this.selectedMonth}.csv`;
        break;
    }

    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}
