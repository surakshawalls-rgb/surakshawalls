import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-production-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, BreadcrumbComponent, MfgFooterComponent],
  templateUrl: './production-management.component.html',
  styleUrls: ['./production-management.component.css']
})
export class ProductionManagementComponent implements OnInit {
  entries: any[] = [];
  loading = false;
  startDate = '';
  endDate = '';
  searchTerm = '';
  stats = { total: 0, totalQty: 0, products: 0 };

  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    const d = new Date();
    this.endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    this.startDate = `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`;
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      let q = this.db.supabase.from('production_entries')
        .select('id, date, product_name, product_variant, success_quantity, rejected_quantity, labor_cost, notes, created_at')
        .order('date', { ascending: false }).order('created_at', { ascending: false });
      if (this.startDate) q = q.gte('date', this.startDate);
      if (this.endDate) q = q.lte('date', this.endDate);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      this.entries = data || [];
      this.stats.total = this.entries.length;
      this.stats.totalQty = this.entries.reduce((s, e) => s + (e.success_quantity || 0), 0);
      this.stats.products = new Set(this.entries.map(e => e.product_name)).size;
    } catch(e: any) { console.error(e); }
    finally { this.loading = false; this.cd.detectChanges(); }
  }

  get filtered() {
    if (!this.searchTerm.trim()) return this.entries;
    const s = this.searchTerm.toLowerCase();
    return this.entries.filter(e => e.product_name?.toLowerCase().includes(s) || (e.product_variant||'').toLowerCase().includes(s));
  }

  printTable() {
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return;
    const rows = this.filtered.map(e => `<tr><td>${e.date}</td><td>${e.product_name}</td><td>${e.product_variant||'-'}</td><td>${e.success_quantity}</td><td>${e.rejected_quantity||0}</td><td>₹${e.labor_cost||0}</td><td>${e.notes||'-'}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Production Report</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#374151;color:#fff}</style>
    </head><body><h2>Suraksha Walls — Production Report</h2><p>Period: ${this.startDate} to ${this.endDate}</p>
    <table><thead><tr><th>Date</th><th>Product</th><th>Variant</th><th>Qty ✓</th><th>Rejected</th><th>Labor Cost</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }
}
