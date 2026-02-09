import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerWithdrawService } from '../../services/partner-withdraw.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-partner-withdraw',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-withdraw-component.html',
  styleUrl: './partner-withdraw-component.css'
})
export class PartnerWithdrawComponent implements OnInit {

  constructor(private db: PartnerWithdrawService, private cd: ChangeDetectorRef) {}

  // Language
  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  date = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  partnerId = '';
  partnerName = 'Pradeep Vishwakarma';
  partners: any[] = [];
  
  amount: number | null = null;
  remarks = '';

  records: any[] = [];
  page = 0;
  pageSize = 10;
  loading = false;

  async ngOnInit() {
    await this.loadPartners();
    await this.loadTable();
  }

  async loadPartners() {
    try {
      const { data, error } = await this.db['supabase'].supabase
        .from('partner_master')
        .select('id, partner_name');
      
      if (!error && data) {
        this.partners = data;
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
    const selected = this.partners.find((p: any) => p.id === this.partnerId);
    if (selected) {
      this.partnerName = selected.partner_name;
    }
  }

  startLoading() { this.loading = true; this.cd.detectChanges(); }
  stopLoading() { this.loading = false; this.cd.detectChanges(); }

  async saveWithdraw() {
    if (!this.amount) return alert("Enter amount");
    if (!this.partnerId) return alert("Select a partner");

    this.startLoading();
    const res = await this.db.insertWithdraw(this.date, this.partnerId, this.amount, this.remarks);
    this.stopLoading();

    if (res.error) {
      console.error(res.error);
      return alert("❌ Save Failed");
    }

    alert("✅ Saved");
    this.amount = null;
    this.remarks = '';

    await this.loadTable();
  }

  async loadTable() {
    this.startLoading();

    const from = this.page * this.pageSize;
    const to = from + this.pageSize - 1;

    const res = await this.db.getWithdrawals(from, to);
    this.records = res.data || [];

    this.stopLoading();
  }

  nextPage() { this.page++; this.loadTable(); }
  prevPage() { if (this.page > 0) { this.page--; this.loadTable(); } }
  refreshTable() { this.loadTable(); }
}
