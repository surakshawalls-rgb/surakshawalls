import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { ClientService, Client } from '../../services/client.service';
import { ClientPaymentService, ClientOutstanding } from '../../services/client-payment.service';
import { PartnerService } from '../../services/partner.service';

// ─── Shared dialog styles ────────────────────────────────────
const DS = [`
  :host{display:block}
  .dlg{display:flex;flex-direction:column;font-family:'Inter','Segoe UI',sans-serif;background:#fff;min-width:320px}
  .dlg-lg{min-width:640px;max-width:860px}
  .dlg-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f1f5f9;background:#f8fafc}
  .dlg-hdr h2{margin:0;font-size:1rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:8px}
  .dlg-hdr h2 mat-icon{color:#3b82f6}
  .danger-hdr{background:#fff1f2!important}
  .danger-hdr h2 mat-icon{color:#dc2626!important}
  .dlg-close{background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;border-radius:4px;display:flex;align-items:center}
  .dlg-close:hover{background:#f1f5f9;color:#374151}
  .dlg-body{padding:20px;overflow-y:auto;max-height:72vh}
  .dlg-footer{padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc}
  .fr{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
  .fr label{font-size:.8rem;font-weight:700;color:#374151}
  .req{color:#ef4444}
  .inp{border:1px solid #d1d5db;border-radius:7px;padding:9px 12px;font-size:.88rem;outline:none;width:100%;box-sizing:border-box}
  .inp:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
  .inp:disabled{background:#f9fafb;color:#9ca3af}
  .inp-sm{border:1px solid #d1d5db;border-radius:5px;padding:5px 8px;font-size:.8rem;outline:none;width:100%;box-sizing:border-box}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .span2{grid-column:span 2}
  .btn-p{background:#2563eb;color:#fff;border:none;border-radius:7px;padding:9px 20px;font-size:.88rem;font-weight:700;cursor:pointer}
  .btn-p:hover:not(:disabled){background:#1d4ed8}
  .btn-p:disabled{opacity:.5;cursor:not-allowed}
  .btn-c{background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:7px;padding:9px 20px;font-size:.88rem;cursor:pointer}
  .btn-c:hover{background:#f9fafb}
  .btn-d{background:#dc2626;color:#fff;border:none;border-radius:7px;padding:9px 20px;font-size:.88rem;font-weight:700;cursor:pointer}
  .btn-d:hover{background:#b91c1c}
  .btn-print{display:flex;align-items:center;gap:6px;background:#0f172a;color:#fff;border:none;border-radius:7px;padding:7px 14px;font-size:.82rem;font-weight:600;cursor:pointer}
  .dlg-err{color:#dc2626;font-size:.82rem;margin-top:6px;padding:6px 10px;background:#fee2e2;border-radius:6px}
  .sum-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .sum-card{flex:1;min-width:120px;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0}
  .sum-card small{display:block;font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase}
  .sum-card strong{font-size:1.1rem;font-weight:800;display:block;margin-top:4px}
  .sum-card.green strong{color:#15803d}
  .sum-card.blue strong{color:#2563eb}
  .sum-card.red strong{color:#dc2626}
  .pay-info{display:flex;gap:12px;margin-bottom:16px}
  .pay-card{flex:1;padding:12px;border-radius:8px;border:1px solid #e2e8f0}
  .pay-card small{display:block;font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase}
  .pay-card strong{font-size:1.2rem;font-weight:800;color:#1e293b}
  .pay-card.red{border-color:#fca5a5;background:#fff1f2}
  .pay-card.red strong{color:#dc2626}
  .amt-wrap{display:flex;gap:8px}
  .amt-wrap .inp{flex:1}
  .btn-full{white-space:nowrap;background:#10b981;color:#fff;border:none;border-radius:7px;padding:6px 12px;font-size:.75rem;font-weight:700;cursor:pointer}
  .pb-tbl{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px}
  .pb-tbl thead{background:#374151;color:#fff}
  .pb-tbl th,.pb-tbl td{padding:8px 10px}
  .pb-tbl tbody tr{border-bottom:1px solid #f1f5f9}
  .pb-tbl tbody tr:hover{background:#f8fafc}
  .pb-tbl .tot{background:#f1f5f9;font-weight:700}
  .tr{text-align:right}
  .chip{background:#f1f5f9;color:#374151;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700;text-transform:uppercase}
  .amt-due{color:#dc2626;font-weight:700}
  .date-row{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}
  .pb-empty{text-align:center;padding:32px;color:#94a3b8}
  .confirm-msg{font-size:.95rem;color:#374151;margin:0 0 8px}
  .confirm-sub{font-size:.82rem;color:#64748b;margin:0}
  .radio-grp{display:flex;gap:16px;padding:6px 0}
  .radio-grp label{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.85rem;font-weight:600}
  @media(max-width:600px){.dlg-lg{min-width:96vw}.grid2{grid-template-columns:1fr}.span2{grid-column:span 1}}
`];

// ─── Dialog 1: Add/Edit Client ───────────────────────────────
@Component({
  selector: 'app-client-form-dialog', standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  styles: DS,
  template: `
    <div class="dlg">
      <div class="dlg-hdr">
        <h2><mat-icon>{{ data.client ? 'edit' : 'person_add' }}</mat-icon>
          {{ data.client ? 'Edit Client' : 'Add New Client' }}</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dlg-body">
        <div class="grid2">
          <div class="fr span2">
            <label>Client Name <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.name" class="inp" placeholder="Full name / company name">
          </div>
          <div class="fr">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="form.phone" class="inp" placeholder="+91 XXXXX XXXXX">
          </div>
          <div class="fr">
            <label>Address</label>
            <input type="text" [(ngModel)]="form.address" class="inp" placeholder="City / Area">
          </div>
        </div>
        <div class="dlg-err" *ngIf="err">{{ err }}</div>
      </div>
      <div class="dlg-footer">
        <button class="btn-c" (click)="ref.close()">Cancel</button>
        <button class="btn-p" [disabled]="saving" (click)="save()">
          {{ saving ? 'Saving...' : (data.client ? 'Update' : 'Add Client') }}
        </button>
      </div>
    </div>
  `
})
export class ClientFormDialogComponent {
  ref = inject(MatDialogRef<ClientFormDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { client?: Client };
  private cs = inject(ClientService);
  form = { name: this.data.client?.client_name||'', phone: this.data.client?.phone||'', address: this.data.client?.address||'' };
  err=''; saving=false;
  async save() {
    if (!this.form.name.trim()) { this.err='Name is required'; return; }
    this.saving=true; this.err='';
    try {
      if (this.data.client) {
        const r = await this.cs.updateClient(this.data.client.id, { client_name:this.form.name.trim(), phone:this.form.phone.trim()||undefined, address:this.form.address.trim()||undefined });
        if (!r.success) throw new Error(r.error);
        this.ref.close({updated:true});
      } else {
        const r = await this.cs.addClient({ client_name:this.form.name.trim(), phone:this.form.phone.trim()||undefined, address:this.form.address.trim()||undefined });
        if (!r.success) throw new Error(r.error);
        this.ref.close({added:true});
      }
    } catch(e:any){ this.err=e.message||'Failed'; } finally{ this.saving=false; }
  }
}

// ─── Dialog 2: Collect Payment ───────────────────────────────
@Component({
  selector: 'app-collect-dialog', standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  styles: DS,
  template: `
    <div class="dlg">
      <div class="dlg-hdr">
        <h2><mat-icon>payments</mat-icon> Collect Payment — {{ data.client.client_name }}</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dlg-body">
        <div class="pay-info">
          <div class="pay-card"><small>Total Billed</small><strong>₹{{ data.client.total_sales|number:'1.0-0' }}</strong></div>
          <div class="pay-card red"><small>Outstanding</small><strong>₹{{ data.outstanding|number:'1.0-0' }}</strong></div>
        </div>
        <div class="fr"><label>Date <span class="req">*</span></label><input type="date" [(ngModel)]="date" class="inp"></div>
        <div class="fr">
          <label>Amount (₹) <span class="req">*</span></label>
          <div class="amt-wrap">
            <input type="number" [(ngModel)]="amount" min="1" class="inp">
            <button class="btn-full" type="button" (click)="amount=data.outstanding">Pay Full ₹{{ data.outstanding|number:'1.0-0' }}</button>
          </div>
        </div>
        <div class="fr"><label>Payment Mode</label>
          <select [(ngModel)]="mode" class="inp">
            <option value="cash">Cash</option>
            <option value="upi">UPI / Online</option>
            <option value="cheque">Cheque</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div class="fr"><label>Collected By</label>
          <select [(ngModel)]="collectedBy" class="inp">
            <option value="firm">Firm Cash</option>
            <option *ngFor="let p of data.partners" [value]="p.id">{{ p.partner_name }}</option>
          </select>
        </div>
        <div class="fr" *ngIf="collectedBy !== 'firm'">
          <label>Deposited to Firm?</label>
          <div class="radio-grp">
            <label><input type="radio" name="dep" [value]="true" [(ngModel)]="deposited"><span>Yes</span></label>
            <label><input type="radio" name="dep" [value]="false" [(ngModel)]="deposited"><span>Not Yet</span></label>
          </div>
        </div>
        <div class="fr"><label>Notes</label><input type="text" [(ngModel)]="notes" class="inp" placeholder="Optional..."></div>
        <div class="dlg-err" *ngIf="err">{{ err }}</div>
      </div>
      <div class="dlg-footer">
        <button class="btn-c" (click)="ref.close()">Cancel</button>
        <button class="btn-p" [disabled]="saving||amount<=0" (click)="save()">{{ saving?'Saving...':'Confirm Collection' }}</button>
      </div>
    </div>
  `
})
export class CollectPaymentDialogComponent {
  ref = inject(MatDialogRef<CollectPaymentDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { client: ClientOutstanding; outstanding: number; partners: any[] };
  private cps = inject(ClientPaymentService);
  date = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  amount = this.data?.outstanding||0;
  mode = 'cash'; collectedBy = 'firm'; deposited = true; notes = ''; err=''; saving=false;
  async save() {
    if (!this.date||this.amount<=0) { this.err='Enter valid date and amount'; return; }
    this.saving=true; this.err='';
    try {
      const r = await this.cps.recordPayment({
        client_id: this.data.client.client_id,
        payment_date: this.date, amount_paid: this.amount,
        payment_mode: this.mode as any,
        collected_by_partner_id: this.collectedBy!=='firm' ? this.collectedBy : undefined,
        deposited_to_firm: this.deposited, notes: this.notes||undefined
      });
      if (!r.success) throw new Error(r.error);
      this.ref.close({collected:true, amount:this.amount});
    } catch(e:any){ this.err=e.message||'Failed'; } finally{ this.saving=false; }
  }
}

// ─── Dialog 3: Client Passbook ───────────────────────────────
@Component({
  selector: 'app-client-passbook-dialog', standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  styles: DS,
  template: `
    <div class="dlg dlg-lg">
      <div class="dlg-hdr">
        <h2><mat-icon>menu_book</mat-icon> Passbook — {{ data.client.client_name }}</h2>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn-print" (click)="print()"><mat-icon style="font-size:1rem">print</mat-icon> Print / PDF</button>
          <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
        </div>
      </div>
      <div class="dlg-body" id="cpb-area">
        <div class="sum-row">
          <div class="sum-card green"><small>Total Received</small><strong>₹{{ totalReceived|number:'1.0-0' }}</strong></div>
          <div class="sum-card red"><small>Outstanding</small><strong>₹{{ data.client.outstanding|number:'1.0-0' }}</strong></div>
          <div class="sum-card blue"><small>Transactions</small><strong>{{ history.length }}</strong></div>
        </div>
        <div class="date-row">
          <input type="date" [(ngModel)]="from" class="inp-sm">
          <span style="color:#9ca3af">to</span>
          <input type="date" [(ngModel)]="to" class="inp-sm">
          <button class="btn-c" style="padding:5px 12px;font-size:.78rem" (click)="load()">Filter</button>
          <button class="btn-c" style="padding:5px 12px;font-size:.78rem" (click)="from='';to='';load()">Clear</button>
        </div>
        <div *ngIf="loading" class="pb-empty">Loading...</div>
        <table class="pb-tbl" *ngIf="!loading && history.length>0">
          <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Collected By</th><th>Deposited</th><th>Notes</th></tr></thead>
          <tbody>
            <tr *ngFor="let h of history">
              <td>{{ h.payment_date|date:'dd MMM yyyy' }}</td>
              <td class="tr amt-due">₹{{ h.amount_paid|number:'1.0-0' }}</td>
              <td><span class="chip">{{ h.payment_mode }}</span></td>
              <td>{{ partnerName(h.collected_by_partner_id) }}</td>
              <td>{{ h.deposited_to_firm ? '✓ Yes' : '⏳ Pending' }}</td>
              <td>{{ h.notes||'—' }}</td>
            </tr>
          </tbody>
          <tfoot><tr class="tot"><td><strong>Total</strong></td><td class="tr"><strong>₹{{ totalReceived|number:'1.0-0' }}</strong></td><td colspan="4"></td></tr></tfoot>
        </table>
        <div *ngIf="!loading && history.length===0" class="pb-empty">No payment records found.</div>
      </div>
      <div class="dlg-footer">
        <button class="btn-c" (click)="ref.close()">Close</button>
        <button class="btn-print" (click)="print()"><mat-icon style="font-size:1rem">picture_as_pdf</mat-icon> Export PDF</button>
      </div>
    </div>
  `
})
export class ClientPassbookDialogComponent implements OnInit {
  ref = inject(MatDialogRef<ClientPassbookDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { client: ClientOutstanding; partners: any[] };
  private cps = inject(ClientPaymentService);
  history: any[] = []; from=''; to=''; loading=true;
  get totalReceived() { return this.history.reduce((s,h)=>s+(h.amount_paid||0),0); }
  async ngOnInit() { await this.load(); }
  async load() {
    this.loading=true;
    try {
      let h = await this.cps.getClientPaymentHistory(this.data.client.client_id);
      if (this.from) h=h.filter((x:any)=>x.payment_date>=this.from);
      if (this.to) h=h.filter((x:any)=>x.payment_date<=this.to);
      this.history=h;
    } finally { this.loading=false; }
  }
  partnerName(id?:string) {
    if(!id) return 'Firm';
    return this.data.partners.find((p:any)=>p.id===id)?.partner_name||'Partner';
  }
  print() {
    const el = document.getElementById('cpb-area'); if(!el) return;
    const w = window.open('','_blank','width=900,height=700'); if(!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Client Passbook - ${this.data.client.client_name}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border:1px solid #ccc;padding:7px 10px;text-align:left}
    th{background:#374151;color:#fff}.tr{text-align:right}
    .sum-row{display:flex;gap:16px;margin:12px 0}
    .sum-card{border:1px solid #ddd;padding:12px 20px;border-radius:8px}
    .sum-card small{display:block;font-size:.75rem;color:#666}
    .sum-card strong{font-size:1.2rem;font-weight:800}
    .date-row,.btn-print,.dlg-close,.dlg-footer{display:none}
    h2{margin:0 0 8px}
    </style></head><body>
    <h2>Suraksha Walls — Client Passbook</h2>
    <h3>${this.data.client.client_name} | Phone: ${this.data.client.phone||'N/A'}</h3>
    ${el.innerHTML}
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  }
}

// ─── Dialog 4: Confirm ───────────────────────────────────────
@Component({
  selector: 'app-c-confirm-dialog', standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  styles: DS,
  template: `
    <div class="dlg">
      <div class="dlg-hdr" [class.danger-hdr]="data.danger">
        <h2><mat-icon>{{ data.icon||'warning' }}</mat-icon> {{ data.title }}</h2>
      </div>
      <div class="dlg-body">
        <p class="confirm-msg">{{ data.message }}</p>
        <p class="confirm-sub" *ngIf="data.sub">{{ data.sub }}</p>
      </div>
      <div class="dlg-footer">
        <button class="btn-c" (click)="ref.close(false)">Cancel</button>
        <button [class]="data.danger?'btn-d':'btn-p'" (click)="ref.close(true)">{{ data.confirmLabel||'Confirm' }}</button>
      </div>
    </div>
  `
})
export class CConfirmDialogComponent {
  ref = inject(MatDialogRef<CConfirmDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { title:string;message:string;sub?:string;confirmLabel?:string;danger?:boolean;icon?:string };
}

// ─── Main Page Component ─────────────────────────────────────
@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, BreadcrumbComponent, MfgFooterComponent],
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent implements OnInit {
  clients: Client[] = [];
  outstanding: ClientOutstanding[] = [];
  partners: any[] = [];
  loading = false;
  searchTerm = '';
  filterStatus: 'all'|'active'|'inactive'|'outstanding' = 'active';
  stats = { total:0, active:0, withDue:0, totalDue:0 };
  successMsg = ''; errorMsg = '';

  constructor(
    private cs: ClientService,
    private cps: ClientPaymentService,
    private partnerService: PartnerService,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() { await this.loadAll(); }

  async loadAll() {
    this.loading = true;
    try {
      const [clients, outstanding, pd] = await Promise.all([
        this.cs.getAllClients(),
        this.cps.getClientsWithOutstanding(),
        this.partnerService.getAllPartners()
      ]);
      this.clients = clients;
      this.outstanding = outstanding;
      this.partners = (pd||[]).map((p:any)=>({ id:p.id||p.partner_id, partner_name:p.partner_name||p.name }));
      this.computeStats();
    } catch(e:any) { this.showError('Failed: '+e.message); }
    finally { this.loading=false; this.cd.detectChanges(); }
  }

  computeStats() {
    this.stats.total = this.clients.length;
    this.stats.active = this.clients.filter(c=>c.active).length;
    this.stats.withDue = this.outstanding.length;
    this.stats.totalDue = this.outstanding.reduce((s,c)=>s+(c.outstanding||0),0);
  }

  get filtered() {
    let list = this.clients;
    if (this.filterStatus==='active') list=list.filter(c=>c.active);
    else if (this.filterStatus==='inactive') list=list.filter(c=>!c.active);
    else if (this.filterStatus==='outstanding') list=list.filter(c=>this.getOutstanding(c.id)>0);
    if (this.searchTerm.trim()) {
      const s=this.searchTerm.toLowerCase().trim();
      list=list.filter(c=>c.client_name.toLowerCase().includes(s)||(c.phone||'').includes(s));
    }
    return list;
  }

  getOutstanding(id:string) { return this.outstanding.find(o=>o.client_id===id)?.outstanding||0; }

  openAdd() {
    this.dialog.open(ClientFormDialogComponent, { width:'500px', disableClose:true, data:{client:null} })
      .afterClosed().subscribe(r=>{ if(r?.added){ this.showSuccess('Client added'); this.loadAll(); } });
  }

  openEdit(c:Client) {
    this.dialog.open(ClientFormDialogComponent, { width:'500px', disableClose:true, data:{client:c} })
      .afterClosed().subscribe(r=>{ if(r?.updated){ this.showSuccess('Client updated'); this.loadAll(); } });
  }

  openCollect(c:Client) {
    const oo = this.outstanding.find(o=>o.client_id===c.id);
    if (!oo) { this.showError('No outstanding balance'); return; }
    const co: ClientOutstanding = oo;
    this.dialog.open(CollectPaymentDialogComponent, {
      width:'500px', disableClose:true,
      data:{ client:co, outstanding:oo.outstanding, partners:this.partners }
    }).afterClosed().subscribe(r=>{ if(r?.collected){ this.showSuccess(`₹${r.amount} collected`); this.loadAll(); } });
  }

  openPassbook(c:Client) {
    const oo = this.outstanding.find(o=>o.client_id===c.id) || {
      client_id:c.id, client_name:c.client_name, phone:c.phone||'',
      total_sales:c.total_billed||0, total_paid:c.total_paid||0,
      outstanding:c.outstanding||0, sales_transactions:[]
    };
    this.dialog.open(ClientPassbookDialogComponent, {
      width:'820px', maxWidth:'98vw',
      data:{ client:oo, partners:this.partners }
    });
  }

  openToggle(c:Client) {
    this.dialog.open(CConfirmDialogComponent, { width:'380px', data:{
      title: c.active?'Deactivate Client':'Activate Client',
      message:`${c.active?'Deactivate':'Activate'} "${c.client_name}"?`,
      confirmLabel: c.active?'Deactivate':'Activate',
      icon: c.active?'toggle_off':'toggle_on'
    }}).afterClosed().subscribe(async confirmed=>{
      if(!confirmed) return;
      const r = await this.cs.updateClient(c.id,{active:!c.active});
      if(r.success) { this.showSuccess('Client status updated'); this.loadAll(); }
      else this.showError(r.error||'Failed');
    });
  }

  openDelete(c:Client) {
    this.dialog.open(CConfirmDialogComponent, { width:'380px', data:{
      title:'Delete Client', danger:true, icon:'delete',
      message:`Remove "${c.client_name}"?`,
      sub:'Client will be deactivated. Transaction history is preserved.',
      confirmLabel:'Delete'
    }}).afterClosed().subscribe(async confirmed=>{
      if(!confirmed) return;
      const r = await this.cs.updateClient(c.id,{active:false});
      if(r.success) { this.showSuccess('Client removed'); this.loadAll(); }
      else this.showError(r.error||'Failed');
    });
  }

  showSuccess(msg:string) { this.successMsg=msg; this.cd.detectChanges(); setTimeout(()=>{this.successMsg='';this.cd.detectChanges();},3500); }
  showError(msg:string) { this.errorMsg=msg; this.cd.detectChanges(); setTimeout(()=>{this.errorMsg='';this.cd.detectChanges();},5000); }
  fmt(n:number) { return `₹${(n||0).toLocaleString('en-IN')}`; }
}
