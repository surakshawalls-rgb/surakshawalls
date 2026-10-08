import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { SupabaseService } from '../../services/supabase.service';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientPaymentService } from '../../services/client-payment.service';
import { PartnerService } from '../../services/partner.service';
import { inject } from '@angular/core';

const DS = [`
  :host{display:block}
  .dlg{display:flex;flex-direction:column;font-family:'Inter','Segoe UI',sans-serif;background:#fff;min-width:360px}
  .dlg-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f1f5f9;background:#f8fafc}
  .dlg-hdr h2{margin:0;font-size:1rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:8px}
  .dlg-hdr h2 mat-icon{color:#10b981}
  .dlg-close{background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center}
  .dlg-body{padding:20px;overflow-y:auto;max-height:72vh}
  .dlg-footer{padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc}
  .fr{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
  .fr label{font-size:.8rem;font-weight:700;color:#374151}
  .req{color:#ef4444}
  .inp{border:1px solid #d1d5db;border-radius:7px;padding:9px 12px;font-size:.88rem;outline:none;width:100%;box-sizing:border-box}
  .inp:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.15)}
  .info-row{display:flex;gap:12px;margin-bottom:16px}
  .ic{flex:1;padding:12px;border-radius:8px;border:1px solid #e2e8f0}
  .ic small{display:block;font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase}
  .ic strong{font-size:1.1rem;font-weight:800;color:#1e293b}
  .ic.red{border-color:#fca5a5;background:#fff1f2}
  .ic.red strong{color:#dc2626}
  .amt-wrap{display:flex;gap:8px}
  .amt-wrap .inp{flex:1}
  .btn-full{white-space:nowrap;background:#10b981;color:#fff;border:none;border-radius:7px;padding:6px 12px;font-size:.75rem;font-weight:700;cursor:pointer}
  .radio-grp{display:flex;gap:16px;padding:6px 0}
  .radio-grp label{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.85rem;font-weight:600}
  .btn-p{background:#10b981;color:#fff;border:none;border-radius:7px;padding:9px 20px;font-size:.88rem;font-weight:700;cursor:pointer}
  .btn-p:disabled{opacity:.5;cursor:not-allowed}
  .btn-c{background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:7px;padding:9px 20px;font-size:.88rem;cursor:pointer}
  .dlg-err{color:#dc2626;font-size:.82rem;margin-top:6px;padding:6px 10px;background:#fee2e2;border-radius:6px}
`];

@Component({
  selector: 'app-collect-sale-dialog', standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  styles: DS,
  template: `
    <div class="dlg">
      <div class="dlg-hdr">
        <h2><mat-icon>payments</mat-icon> Collect Payment — {{ data.client }}</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dlg-body">
        <div class="info-row">
          <div class="ic"><small>Sale Amount</small><strong>₹{{ data.total|number:'1.0-0' }}</strong></div>
          <div class="ic red"><small>Outstanding</small><strong>₹{{ data.outstanding|number:'1.0-0' }}</strong></div>
        </div>
        <div class="fr"><label>Date <span class="req">*</span></label><input type="date" [(ngModel)]="date" class="inp"></div>
        <div class="fr"><label>Amount (₹) <span class="req">*</span></label>
          <div class="amt-wrap">
            <input type="number" [(ngModel)]="amount" min="1" class="inp">
            <button class="btn-full" (click)="amount=data.outstanding">Full ₹{{ data.outstanding|number:'1.0-0' }}</button>
          </div>
        </div>
        <div class="fr"><label>Mode</label>
          <select [(ngModel)]="mode" class="inp">
            <option value="cash">Cash</option><option value="upi">UPI</option>
            <option value="cheque">Cheque</option><option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div class="fr"><label>Collected By</label>
          <select [(ngModel)]="by" class="inp">
            <option value="firm">Firm Cash</option>
            <option *ngFor="let p of data.partners" [value]="p.id">{{ p.partner_name }}</option>
          </select>
        </div>
        <div class="fr" *ngIf="by!=='firm'">
          <label>Deposited to Firm?</label>
          <div class="radio-grp">
            <label><input type="radio" name="d" [value]="true" [(ngModel)]="dep"><span>Yes</span></label>
            <label><input type="radio" name="d" [value]="false" [(ngModel)]="dep"><span>Not Yet</span></label>
          </div>
        </div>
        <div class="dlg-err" *ngIf="err">{{ err }}</div>
      </div>
      <div class="dlg-footer">
        <button class="btn-c" (click)="ref.close()">Cancel</button>
        <button class="btn-p" [disabled]="saving||amount<=0" (click)="save()">{{ saving?'Saving...':'Confirm' }}</button>
      </div>
    </div>
  `
})
export class CollectSaleDialogComponent {
  ref = inject(MatDialogRef<CollectSaleDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { saleId:string; client:string; total:number; outstanding:number; clientId:string; partners:any[] };
  private cps = inject(ClientPaymentService);
  date = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  amount = this.data?.outstanding||0; mode='cash'; by='firm'; dep=true; err=''; saving=false;
  async save() {
    if (!this.date||this.amount<=0) { this.err='Enter date and amount'; return; }
    this.saving=true; this.err='';
    try {
      const r = await this.cps.recordPayment({
        client_id: this.data.clientId, sales_transaction_id: this.data.saleId,
        payment_date: this.date, amount_paid: this.amount, payment_mode: this.mode as any,
        collected_by_partner_id: this.by!=='firm'?this.by:undefined,
        deposited_to_firm: this.dep
      });
      if (!r.success) throw new Error(r.error);
      this.ref.close({collected:true, amount:this.amount});
    } catch(e:any){ this.err=e.message||'Failed'; } finally{ this.saving=false; }
  }
}

@Component({
  selector: 'app-sales-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, MatDialogModule, BreadcrumbComponent, MfgFooterComponent],
  templateUrl: './sales-management.component.html',
  styleUrls: ['./sales-management.component.css']
})
export class SalesManagementComponent implements OnInit {
  entries: any[] = [];
  partners: any[] = [];
  loading = false;
  startDate = '';
  endDate = '';
  searchTerm = '';
  stats = { total: 0, totalAmt: 0, totalPaid: 0, totalDue: 0 };

  constructor(private db: SupabaseService, private dialog: MatDialog, private partnerService: PartnerService, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    const d = new Date();
    this.endDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    this.startDate = `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`;
    const pd = await this.partnerService.getAllPartners();
    this.partners = (pd||[]).map((p:any)=>({ id:p.id||p.partner_id, partner_name:p.partner_name||p.name }));
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      let q = this.db.supabase.from('sales_transactions')
        .select(`id, date, product_name, product_variant, quantity, total_amount, paid_amount, payment_type, client_id, client_ledger(client_name, phone)`)
        .order('date', { ascending: false }).order('created_at', { ascending: false });
      if (this.startDate) q = q.gte('date', this.startDate);
      if (this.endDate) q = q.lte('date', this.endDate);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      // Also fetch client payments to calc outstanding
      const { data: payments } = await this.db.supabase.from('client_payments').select('sales_transaction_id, amount_paid');
      const payMap = new Map<string, number>();
      (payments||[]).forEach((p:any) => payMap.set(p.sales_transaction_id, (payMap.get(p.sales_transaction_id)||0) + p.amount_paid));
      this.entries = (data||[]).map((e:any) => ({
        ...e,
        client_name: e.client_ledger?.client_name||'Unknown',
        outstanding: Math.max(0, e.total_amount - e.paid_amount - (payMap.get(e.id)||0))
      }));
      this.stats.total = this.entries.length;
      this.stats.totalAmt = this.entries.reduce((s,e)=>s+(e.total_amount||0),0);
      this.stats.totalPaid = this.entries.reduce((s,e)=>s+(e.paid_amount||0),0);
      this.stats.totalDue = this.entries.reduce((s,e)=>s+(e.outstanding||0),0);
    } catch(e:any) { console.error(e); }
    finally { this.loading=false; this.cd.detectChanges(); }
  }

  get filtered() {
    if (!this.searchTerm.trim()) return this.entries;
    const s = this.searchTerm.toLowerCase();
    return this.entries.filter(e => e.client_name?.toLowerCase().includes(s) || e.product_name?.toLowerCase().includes(s));
  }

  openCollect(e: any) {
    if (!e.outstanding || e.outstanding <= 0) return;
    this.dialog.open(CollectSaleDialogComponent, {
      width: '480px', disableClose: true,
      data: { saleId: e.id, client: e.client_name, total: e.total_amount, outstanding: e.outstanding, clientId: e.client_id, partners: this.partners }
    }).afterClosed().subscribe(r => { if (r?.collected) { this.load(); } });
  }

  printTable() {
    const w = window.open('','_blank','width=900,height=700'); if(!w) return;
    const rows = this.filtered.map(e=>`<tr><td>${e.date}</td><td>${e.client_name}</td><td>${e.product_name}</td><td>${e.quantity}</td><td>₹${e.total_amount}</td><td>₹${e.paid_amount}</td><td>₹${e.outstanding}</td><td>${e.payment_type}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Sales Report</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#374151;color:#fff}</style>
    </head><body><h2>Suraksha Walls — Sales Report</h2><p>Period: ${this.startDate} to ${this.endDate}</p>
    <table><thead><tr><th>Date</th><th>Client</th><th>Product</th><th>Qty</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Type</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  }
}
