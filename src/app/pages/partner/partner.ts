import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PartnerService } from '../../services/partner.service';
import { PartnerWithdrawComponent } from '../partner-withdraw-component/partner-withdraw-component';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

type ExpenseCategory =
  | 'Sariya'
  | 'Cement'
  | 'Sand'
  | 'Gitti'
  | 'Diesel'
  | 'Snacks'
  | 'Mobile'
  | 'Maintenance'
  | 'Other';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule, PartnerWithdrawComponent],
  templateUrl: './partner.html',
  styleUrl: './partner.css'
})
export class PartnerComponent implements OnInit {

  constructor(
    private db: PartnerService, 
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  // Active Tab
  activeTab: 'ledger' | 'withdraw' = 'ledger';

  // Language
  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  date = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  // Partner selection
  partnerName = 'Pradeep Vishwakarma';
  partnerId = '';  // Will be set based on partnerName
  partners: any[] = [];  // List of partners from database
  
  title = '';
  amount: number | null = null;

  category: ExpenseCategory = 'Sariya';
  otherDescription = '';

  records: any[] = [];

  page = 0;
  pageSize = 10;

  loading = false;

  // Profit Share %
  sharePradeep = 40;
  sharePraveen = 40;
  sharePappu = 20;

  async ngOnInit() {
    // Load partners first
    await this.loadPartners();
    
    // Check query params for tab
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'withdraw') {
        this.activeTab = 'withdraw';
      }
    });
    await this.loadTable();
  }

  async loadPartners() {
    try {
      const { data, error } = await this.db['supabase'].supabase
        .from('partner_master')
        .select('id, partner_name');
      
      if (!error && data) {
        this.partners = data;
        // Set default partner if exists
        if (this.partners.length > 0) {
          this.partnerId = this.partners[0].id;
          this.partnerName = this.partners[0].partner_name;
        }
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  }

  onPartnerChange() {
    const selected = this.partners.find(p => p.id === this.partnerId);
    if (selected) {
      this.partnerName = selected.partner_name;
    }
  }

  private startLoading() {
    this.loading = true;
    this.cd.detectChanges();
  }

  private stopLoading() {
    this.loading = false;
    this.cd.detectChanges();
  }

  async saveExpense() {
    if (!this.title || !this.amount) return alert("Enter title & amount");
    if (!this.partnerId) return alert("Select a partner");

    if (this.category === 'Other' && !this.otherDescription) {
      return alert("Enter description for Other");
    }

    this.startLoading();

    const res = await this.db.insertExpense(
      this.date,
      this.partnerId,
      this.title,
      this.amount,
      this.category,
      this.category === 'Other' ? this.otherDescription : undefined
    );

    this.stopLoading();

    if (res.error) {
      console.error(res.error);
      return alert("❌ Save Failed");
    }

    alert("✅ Saved");

    this.title = '';
    this.amount = null;
    this.otherDescription = '';

    await this.loadTable();
  }

  async loadTable() {
    this.startLoading();

    const from = this.page * this.pageSize;
    const to = from + this.pageSize - 1;

    const res = await this.db.getExpenses(from, to);
    this.records = res.data || [];

    this.stopLoading();
  }

  nextPage() { this.page++; this.loadTable(); }
  prevPage() { if (this.page > 0) { this.page--; this.loadTable(); } }
  refreshTable() { this.loadTable(); }

  get totalExpense() {
    return this.records.reduce((s, r) => s + Number(r.amount), 0);
  }

  get profitPradeep() { return this.totalExpense * this.sharePradeep / 100; }
  get profitPraveen() { return this.totalExpense * this.sharePraveen / 100; }
  get profitPappu() { return this.totalExpense * this.sharePappu / 100; }
}
