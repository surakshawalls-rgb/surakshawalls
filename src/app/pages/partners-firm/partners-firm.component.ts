import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { SupabaseService } from '../../services/supabase.service';
import { LaborPaymentService } from '../../services/labor-payment.service';
import { ClientPaymentService } from '../../services/client-payment.service';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-partners-firm',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, BreadcrumbComponent, MfgFooterComponent],
  templateUrl: './partners-firm.component.html',
  styleUrls: ['./partners-firm.component.css']
})
export class PartnersFirmComponent implements OnInit {
  loading = false;
  partners: any[] = [];
  ledger: any[] = [];
  materialStock: any[] = [];
  finishedStock: any[] = [];
  startDate = '';
  endDate = '';
  activeView: 'summary' | 'ledger' | 'stock' = 'summary';

  summary = { revenue: 0, expenses: 0, net: 0, workerDue: 0, clientDue: 0, materialValue: 0, finishedValue: 0 };

  constructor(
    private db: SupabaseService,
    private laborPaymentService: LaborPaymentService,
    private clientPaymentService: ClientPaymentService,
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const d = new Date();
    this.endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const s = new Date(d.getFullYear(), 0, 1);
    this.startDate = `${s.getFullYear()}-01-01`;
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    try {
      const [pm, workers, clients, materials, finished] = await Promise.all([
        this.db.supabase.from('partner_master').select('*').order('partner_name'),
        this.laborPaymentService.getWorkersWithOutstanding(false, 'all'),
        this.clientPaymentService.getClientsWithOutstanding(),
        this.inventoryService.getMaterialsStock(),
        this.inventoryService.getInventory()
      ]);
      this.partners = pm.data || [];
      this.materialStock = materials;
      this.finishedStock = finished;
      this.summary.workerDue = workers.reduce((s, w) => s + (w.outstanding || 0), 0);
      this.summary.clientDue = clients.reduce((s, c) => s + (c.outstanding || 0), 0);
      this.summary.materialValue = materials.reduce((s, m) => s + ((m.current_stock || 0) * (m.unit_cost || 0)), 0);
      this.summary.finishedValue = finished.reduce((s, f) => s + ((f.current_stock || 0) * (f.unit_cost || 0)), 0);
      await this.loadLedger();
    } catch (e: any) { console.error(e); }
    finally { this.loading = false; this.cd.detectChanges(); }
  }

  async loadLedger() {
    let q = this.db.supabase.from('firm_cash_ledger')
      .select('id, date, type, category, description, amount, partner_id, deposited_to_firm')
      .order('date', { ascending: false }).order('created_at', { ascending: false });
    if (this.startDate) q = q.gte('date', this.startDate);
    if (this.endDate) q = q.lte('date', this.endDate);
    const { data } = await q.limit(1000);
    this.ledger = (data || []).map((e: any) => ({
      ...e,
      partner_name: e.partner_id ? (this.partners.find((p: any) => p.id === e.partner_id)?.partner_name || 'Partner') : 'Firm'
    }));
    this.summary.revenue = this.ledger.filter(e => e.type === 'receipt').reduce((s, e) => s + (e.amount || 0), 0);
    this.summary.expenses = this.ledger.filter(e => e.type === 'payment').reduce((s, e) => s + (e.amount || 0), 0);
    this.summary.net = this.summary.revenue - this.summary.expenses;
    this.cd.detectChanges();
  }

  get ledgerIn() { return this.ledger.filter(e => e.type === 'receipt'); }
  get ledgerOut() { return this.ledger.filter(e => e.type === 'payment'); }

  partnerName(id?: string) {
    if (!id) return 'Firm';
    return this.partners.find(p => p.id === id)?.partner_name || 'Partner';
  }

  printLedger() {
    const w = window.open('', '_blank', 'width=900,height=700'); if (!w) return;
    const rows = this.ledger.map(e => `<tr><td>${e.date}</td><td>${e.type === 'receipt' ? '↓ IN' : '↑ OUT'}</td><td>${e.category||'-'}</td><td>${e.partner_name}</td><td>${e.description||'-'}</td><td>₹${e.amount}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Firm Ledger</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#374151;color:#fff}.in{color:green}.out{color:red}</style>
    </head><body><h2>Suraksha Walls — Firm Cash Ledger</h2><p>Period: ${this.startDate} to ${this.endDate}</p>
    <p>Total IN: ₹${this.summary.revenue.toLocaleString('en-IN')} | Total OUT: ₹${this.summary.expenses.toLocaleString('en-IN')} | Net: ₹${this.summary.net.toLocaleString('en-IN')}</p>
    <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Partner/Firm</th><th>Description</th><th>Amount</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  }
}
