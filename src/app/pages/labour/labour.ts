import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

interface Worker {
  name: string;
  type: 'HALF' | 'FULL' | 'OUTDOOR' | 'CUSTOM';
  amount: number;
}

@Component({
  selector: 'app-labour',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './labour.html',
  styleUrl: './labour.css'
})
export class LabourComponent implements OnInit {

  constructor(private db: SupabaseService, private cdr: ChangeDetectorRef) {}

  // Language
  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  date = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  newWorker = '';
  workerType: 'HALF' | 'FULL' | 'OUTDOOR' | 'CUSTOM' = 'FULL';
  customWorkerAmount: number | null = null;
  workers: Worker[] = [];

  // Table Data
  labourRecords: any[] = [];
  filteredRecords: any[] = [];

  page = 0;
  pageSize = 10;

  searchName = '';
  filterDate = '';
  monthlyTotal = 0;

  loading = false;

  async ngOnInit() {
  await this.loadTable();
  }


  // ➕ Add Worker (Draft Only)
  addWorker() {
    if (!this.newWorker) return;

    let amount = 0;
    if (this.workerType === 'HALF') amount = 200;
    if (this.workerType === 'FULL') amount = 400;
    if (this.workerType === 'OUTDOOR') amount = 450;
    if (this.workerType === 'CUSTOM' && this.customWorkerAmount) amount = this.customWorkerAmount;

    this.workers.push({ name: this.newWorker, type: this.workerType, amount });

    this.newWorker = '';
    this.customWorkerAmount = null;
  }

  removeWorker(i: number) {
    this.workers.splice(i, 1);
  }

  get totalLabourExpense() {
    return this.workers.reduce((s, w) => s + w.amount, 0);
  }

  async reloadData() {
  await this.loadTable();
  this.applyFilter();
  }

  // 💾 Save to Supabase
  async saveToDatabase() {
    if (!this.workers.length) return;

    this.loading = true;
    const res = await this.db.insertLabour(this.date, this.workers);
    this.loading = false;

    if (res.error) {
      alert("Save failed");
      return;
    }

    this.workers = [];
    this.page = 0;

    await this.loadTable();   // AUTO REFRESH
  }


  // 📊 Load Table
  async loadTable() {
  this.loading = true;

  const from = this.page * this.pageSize;
  const to = from + this.pageSize - 1;

  const res = await this.db.getLabour(from, to);

  if (res.error) {
    console.error(res.error);
    alert("Load failed");
    return;
  }

  this.labourRecords = res.data || [];
  this.filteredRecords = [...this.labourRecords];

  await this.loadMonthlyTotal();

  this.loading = false;

  // 🔥 FORCE UI UPDATE
  this.cdr.detectChanges();
}


  // 🔍 Filters
  applyFilter() {
    this.filteredRecords = this.labourRecords.filter(r => {
      const nameMatch = this.searchName ? r.name.toLowerCase().includes(this.searchName.toLowerCase()) : true;
      const dateMatch = this.filterDate ? r.date === this.filterDate : true;
      return nameMatch && dateMatch;
    });
  }

  // 📅 Monthly Total
  async loadMonthlyTotal() {
    const month = new Date().toISOString().slice(0, 7);
    const res = await this.db.getMonthlyTotal(month);
    this.monthlyTotal = (res.data || []).reduce((s: number, r: any) => s + r.amount, 0);
  }

  // 📥 Export CSV
  exportCSV() {
    const rows = [['Date', 'Name', 'Type', 'Amount']];
    this.filteredRecords.forEach(r => rows.push([r.date, r.name, r.type, r.amount]));

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'labour-report.csv';
    a.click();
  }

  // 📲 WhatsApp
  generateMessage() {
    let msg = `👷 Labour Report - Suraksha Walls\nDate: ${this.date}\n\n`;
    this.workers.forEach((w, i) => msg += `${i+1}. ${w.name} ₹${w.amount}\n`);
    msg += `\nTotal ₹${this.totalLabourExpense}`;
    return msg;
  }

  sendWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.generateMessage())}`, '_blank');
  }

  // Pagination AUTO REFRESH
  async nextPage() {
  if (this.loading) return;
  this.page++;
  await this.loadTable();
  }

  async prevPage() {
    if (this.loading || this.page === 0) return;
    this.page--;
    await this.loadTable();
  }



  refreshTable() {
    this.loadTable();
  }
}
