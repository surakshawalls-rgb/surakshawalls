import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyCashService } from '../../services/company-cash.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-company-cash-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-cash-component.html',
  styleUrl: './company-cash-component.css',
})
export class CompanyCashComponent implements OnInit {

  loading = false;

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
  fromDate = '';
  toDate = new Date().toISOString().split('T')[0];

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
      this.cashLedger = response.data || [];
    } catch (error) {
      console.error('Error loading cash ledger:', error);
    }
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

  getStatusColor(type: string): string {
    if (type === 'INCOME') return 'green';
    if (type === 'EXPENSE') return 'red';
    return 'blue';
  }
}
