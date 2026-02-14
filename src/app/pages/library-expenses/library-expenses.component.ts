// src/app/pages/library-expenses/library-expenses.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, LibraryExpense } from '../../services/library.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-library-expenses',
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
  templateUrl: './library-expenses.component.html',
  styleUrls: ['./library-expenses.component.css']
})
export class LibraryExpensesComponent implements OnInit {
  expenses: LibraryExpense[] = [];
  filteredExpenses: LibraryExpense[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  showAddModal = false;
  filterCategory = 'all';
  filterMonth = '';

  newExpense: Partial<LibraryExpense> = {
    date: new Date().toISOString().split('T')[0],
    category: 'electricity',
    amount: 0,
    payment_mode: 'cash'
  };

  categories = [
    { value: 'electricity', label: '⚡ Electricity' },
    { value: 'wifi', label: '📶 WiFi/Internet' },
    { value: 'water', label: '💧 Water' },
    { value: 'cleaning', label: '🧹 Cleaning' },
    { value: 'maintenance', label: '🔧 Maintenance' },
    { value: 'stationery', label: '📝 Stationery' },
    { value: 'other', label: '📦 Other' }
  ];

  monthlyTotal = 0;
  cashBalance = 0;

  constructor(
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadExpenses();
    await this.loadCashBalance();
  }

  async loadExpenses() {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.expenses = await this.libraryService.getExpenses();
      this.applyFilters();
      this.calculateMonthlyTotal();
      this.loading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      this.errorMessage = 'Failed to load expenses: ' + error.message;
      this.loading = false;
    }
  }

  async loadCashBalance() {
    try {
      this.cashBalance = await this.libraryService.getLibraryCashBalance();
    } catch (error: any) {
      console.error('Error loading cash balance:', error);
    }
  }

  applyFilters() {
    this.filteredExpenses = this.expenses.filter(expense => {
      const matchesCategory = this.filterCategory === 'all' || expense.category === this.filterCategory;
      
      let matchesMonth = true;
      if (this.filterMonth) {
        const expenseDate = new Date(expense.date!);
        const filterDate = new Date(this.filterMonth);
        matchesMonth = expenseDate.getMonth() === filterDate.getMonth() && 
                      expenseDate.getFullYear() === filterDate.getFullYear();
      }
      
      return matchesCategory && matchesMonth;
    });
    
    this.calculateMonthlyTotal();
  }

  calculateMonthlyTotal() {
    this.monthlyTotal = this.filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }

  onFilterChange() {
    this.applyFilters();
  }

  openAddModal() {
    this.newExpense = {
      date: new Date().toISOString().split('T')[0],
      category: 'electricity',
      amount: 0,
      payment_mode: 'cash'
    };
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
  }

  async submitExpense() {
    try {
      if (!this.newExpense.category || !this.newExpense.amount || this.newExpense.amount <= 0) {
        this.errorMessage = 'Please fill all required fields';
        return;
      }

      await this.libraryService.addExpense(this.newExpense as Omit<LibraryExpense, 'id' | 'created_at'>);
      
      this.successMessage = 'Expense added successfully!';
      this.closeModal();
      await this.loadExpenses();
      await this.loadCashBalance();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      this.errorMessage = 'Failed to add expense: ' + error.message;
    }
  }

  async deleteExpense(expense: LibraryExpense) {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await this.libraryService.deleteExpense(expense.id!);
      this.successMessage = 'Expense deleted successfully!';
      await this.loadExpenses();
      await this.loadCashBalance();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      this.errorMessage = 'Failed to delete expense: ' + error.message;
    }
  }

  getCategoryIcon(category: string): string {
    const categoryObj = this.categories.find(c => c.value === category);
    return categoryObj?.label || category;
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }

  exportToCSV() {
    if (this.filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    let csv = 'Date,Category,Amount,Vendor,Description,Payment Mode\n';
    this.filteredExpenses.forEach(expense => {
      csv += `${expense.date},${expense.category},${expense.amount},${expense.vendor_name || ''},${expense.description || ''},${expense.payment_mode}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
}
