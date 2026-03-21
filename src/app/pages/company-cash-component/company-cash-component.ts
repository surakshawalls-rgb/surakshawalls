import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyCashService } from '../../services/company-cash.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';

@Component({
  selector: 'app-company-cash-component',
  standalone: true,
  imports: [CommonModule, FormsModule, MfgFooterComponent],
  templateUrl: './company-cash-component.html',
  styleUrls: ['./company-cash-component.css'],
})
export class CompanyCashComponent implements OnInit {

  loading = false;
  Math = Math; // Expose Math to template

  // Current Balance
  currentBalance: any = {
    balance: 0,
    income: 0,
    expenses: 0,
    labourCost: 0,
    partnerExpenseCost: 0,
    partnerWithdrawalAmount: 0,
    manualAdjustment: 0
  };

  // Manual Entry Form
  entryDate = new Date().toISOString().split('T')[0];
  entryDescription = '';
  entryAmount: number | null = null;
  entryType: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT' = 'INCOME';
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  // Cash Ledger
  cashLedger: any[] = [];
  filteredLedger: any[] = [];
  paginatedLedger: any[] = [];
  fromDate = '';
  toDate = new Date().toISOString().split('T')[0];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Filters
  searchTerm = '';
  filterType: 'all' | 'receipt' | 'payment' = 'all';

  constructor(
    private companyCashService: CompanyCashService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCashBalance();
  }

  async loadCashBalance() {
    this.loading = true;
    this.cd.detectChanges();

    try {
      this.currentBalance = await this.companyCashService.getCurrentBalance();
      await this.loadCashLedger();
    } catch (error) {
      console.error('Error loading cash balance:', error);
    }

    this.loading = false;
    this.cd.detectChanges();
  }

  async loadCashLedger() {
    try {
      const response = await this.companyCashService.getCashLedger(this.fromDate, this.toDate);
      this.cashLedger = (response.data || []).map((entry: any) => ({
        ...entry,
        display_type: this.getDisplayType(entry.type, entry.category),
        display_category: this.formatCategory(entry.category)
      }));
      console.log('Loaded ledger entries:', this.cashLedger);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading cash ledger:', error);
    }
  }

  getDisplayType(type: string, category: string): string {
    if (type === 'receipt') return 'INCOME';
    if (type === 'payment') return 'EXPENSE';
    return 'OTHER';
  }

  formatCategory(category: string): string {
    const categoryMap: any = {
      'sales': 'Sales Income',
      'wage': 'Worker Wages',
      'partner_contribution': 'Partner Contribution',
      'partner_withdrawal': 'Partner Withdrawal',
      'purchase': 'Material Purchase',
      'operational': 'Operational Expense',
      'adjustment': 'Manual Adjustment'
    };
    return categoryMap[category] || category;
  }

  async addCashEntry() {
    if (!this.entryDescription || !this.entryAmount || this.entryAmount <= 0) {
      alert('Please fill in all fields');
      return;
    }

    this.loading = true;
    this.cd.detectChanges();

    try {
      await this.companyCashService.addCashEntry(
        this.entryDate,
        this.entryDescription,
        this.entryAmount,
        this.entryType
      );

      // Reset form
      this.entryDescription = '';
      this.entryAmount = null;
      this.entryType = 'INCOME';
      this.entryDate = new Date().toISOString().split('T')[0];

      // Reload data
      await this.loadCashBalance();
      alert('Cash entry added successfully!');
    } catch (error) {
      console.error('Error adding cash entry:', error);
      alert('Error adding cash entry');
    }

    this.loading = false;
    this.cd.detectChanges();
  }

  async filterByDateRange() {
    await this.loadCashLedger();
  }

  applyFilters() {
    let filtered = [...this.cashLedger];
    
    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === this.filterType);
    }
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.description?.toLowerCase().includes(search) ||
        entry.display_category?.toLowerCase().includes(search)
      );
    }
    
    this.filteredLedger = filtered;
    this.totalPages = Math.ceil(this.filteredLedger.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedData();
  }
  
  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedLedger = this.filteredLedger.slice(start, end);
    this.cd.detectChanges();
  }
  
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedData();
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }
  
  changeItemsPerPage(items: number) {
    this.itemsPerPage = items;
    this.totalPages = Math.ceil(this.filteredLedger.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedData();
  }
  
  onSearchChange() {
    this.applyFilters();
  }
  
  onFilterTypeChange() {
    this.applyFilters();
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getStatusColor(type: string): string {
    if (type === 'INCOME') return 'green';
    if (type === 'EXPENSE') return 'red';
    return 'blue';
  }
}
