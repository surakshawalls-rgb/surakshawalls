import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-expenses-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, BreadcrumbComponent, MfgFooterComponent],
  templateUrl: './expenses-management.component.html',
  styleUrls: ['./expenses-management.component.css']
})
export class ExpensesManagementComponent implements OnInit {
  entries: any[] = [];
  partners: any[] = [];
  loading = false;
  startDate = '';
  endDate = '';
  searchTerm = '';
  partnerFilter = '';
  stats = { total: 0, totalAmt: 0 };

  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    const d = new Date();
    this.endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    this.startDate = `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`;
    const { data: pm } = await this.db.supabase.from('partner_master').select('id, partner_name').order('partner_name');
    this.partners = pm || [];
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      let q = this.db.supabase.from('firm_cash_ledger')
        .select('id, date, type, category, description, amount, partner_id, created_at')
        .eq('type', 'payment')
        .order('date', { ascending: false }).order('created_at', { ascending: false });
      if (this.startDate) q = q.gte('date', this.startDate);
      if (this.endDate) q = q.lte('date', this.endDate);
      if (this.partnerFilter === 'firm') q = q.is('partner_id', null);
      else if (this.partnerFilter) q = q.eq('partner_id', this.partnerFilter);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      this.entries = (data || []).map((e: any) => ({
        ...e,
        desc_clean: String(e.description || '').replace(/^DailyEntry Expense:\s*/i, ''),
        partner_name: e.partner_id ? (this.partners.find((p: any) => p.id === e.partner_id)?.partner_name || 'Partner') : 'Firm'
      }));
      this.stats.total = this.entries.length;
      this.stats.totalAmt = this.entries.reduce((s, e) => s + (e.amount || 0), 0);
    } catch (e: any) { console.error(e); }
    finally { this.loading = false; this.cd.detectChanges(); }
  }

  get filtered() {
    if (!this.searchTerm.trim()) return this.entries;
    const s = this.searchTerm.toLowerCase();
    return this.entries.filter(e => e.desc_clean?.toLowerCase().includes(s) || e.category?.toLowerCase().includes(s));
  }

  printTable() {
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return;
    const rows = this.filtered.map(e => `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.desc_clean}</td><td>${e.partner_name}</td><td>₹${e.amount}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Expenses</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#374151;color:#fff}</style>
    </head><body><h2>Suraksha Walls — Expenses Report</h2><p>Period: ${this.startDate} to ${this.endDate}</p>
    <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid By</th><th>Amount</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }
}
