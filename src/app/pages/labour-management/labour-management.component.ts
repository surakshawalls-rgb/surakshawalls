import {
  Component, OnInit, Inject, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MfgFooterComponent } from '../../components/mfg-footer/mfg-footer.component';
import { WorkerService, Worker, WAGE_RATES } from '../../services/worker.service';
import { ProductionService } from '../../services/production.service';
import { LaborPaymentService, WorkerOutstanding, WageEntryWithPayments } from '../../services/labor-payment.service';
import { PartnerService } from '../../services/partner.service';

const DIALOG_STYLES = [`
  :host { display: block; }
  .lm-dialog { display:flex; flex-direction:column; font-family:'Inter','Segoe UI',sans-serif; background:white; min-width:320px; }
  .lm-dialog-lg { min-width:560px; max-width:740px; }
  .lm-dialog-xl { min-width:660px; max-width:860px; }
  .lm-dialog-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #f1f5f9; background:#f8fafc; }
  .lm-dialog-header h2 { margin:0; font-size:1rem; font-weight:800; color:#1e293b; display:flex; align-items:center; gap:8px; }
  .lm-dialog-header h2 mat-icon { color:#3b82f6; }
  .danger-header { background:#fff1f2 !important; }
  .danger-header h2 mat-icon { color:#dc2626 !important; }
  .header-actions { display:flex; align-items:center; gap:8px; }
  .dlg-close { background:none; border:none; cursor:pointer; color:#9ca3af; padding:4px; border-radius:4px; display:flex; align-items:center; }
  .dlg-close:hover { background:#f1f5f9; color:#374151; }
  .lm-dialog-body { padding:20px; flex:1; overflow-y:auto; max-height:72vh; }
  .lm-dialog-footer { padding:14px 20px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:10px; background:#f8fafc; }
  .form-row { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .form-row label { font-size:0.8rem; font-weight:700; color:#374151; }
  .req { color:#ef4444; }
  .dlg-input { border:1px solid #d1d5db; border-radius:7px; padding:9px 12px; font-size:0.88rem; outline:none; width:100%; box-sizing:border-box; }
  .dlg-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
  .dlg-input:disabled { background:#f9fafb; }
  .dlg-input-sm { border:1px solid #d1d5db; border-radius:5px; padding:5px 8px; font-size:0.8rem; outline:none; width:100%; box-sizing:border-box; }
  .dlg-input-sm:disabled { background:#f9fafb; }
  .btn-dlg-primary { background:#2563eb; color:white; border:none; border-radius:7px; padding:9px 20px; font-size:0.88rem; font-weight:700; cursor:pointer; }
  .btn-dlg-primary:hover:not(:disabled) { background:#1d4ed8; }
  .btn-dlg-primary:disabled { opacity:.5; cursor:not-allowed; }
  .btn-dlg-cancel { background:white; color:#374151; border:1px solid #d1d5db; border-radius:7px; padding:9px 20px; font-size:0.88rem; cursor:pointer; }
  .btn-dlg-danger { background:#dc2626; color:white; border:none; border-radius:7px; padding:9px 20px; font-size:0.88rem; font-weight:700; cursor:pointer; }
  .btn-dlg-secondary { background:white; color:#374151; border:1px solid #d1d5db; border-radius:6px; padding:6px 14px; font-size:0.82rem; cursor:pointer; }
  .btn-dlg-secondary.btn-sm { padding:4px 10px; font-size:0.78rem; }
  .btn-print { display:flex; align-items:center; gap:6px; background:#0f172a; color:white; border:none; border-radius:7px; padding:7px 14px; font-size:0.82rem; font-weight:600; cursor:pointer; }
  .dlg-error { color:#dc2626; font-size:0.82rem; margin-top:6px; padding:6px 10px; background:#fee2e2; border-radius:6px; }
  .att-top-row { display:flex; gap:16px; margin-bottom:12px; }
  .att-select-all { display:flex; align-items:center; justify-content:space-between; padding:8px 0; }
  .check-row { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; font-weight:600; }
  .att-count { font-size:0.78rem; color:#64748b; }
  .att-table-wrap { border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; max-height:300px; overflow-y:auto; }
  .att-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
  .att-table thead { background:#374151; color:white; position:sticky; top:0; z-index:1; }
  .att-table th,.att-table td { padding:8px 10px; text-align:left; }
  .att-table tbody tr { border-bottom:1px solid #f1f5f9; }
  .att-table tbody tr.att-selected { background:#eff6ff; }
  .col-check { width:36px; } .col-type { width:120px; } .col-wage { width:90px; }
  .worker-cell { display:flex; align-items:center; gap:8px; }
  .w-avatar { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:0.7rem; }
  .worker-cell strong { display:block; font-size:0.82rem; }
  .worker-cell small { display:block; font-size:0.72rem; color:#9ca3af; }
  .att-summary { margin-top:10px; padding:10px; background:#eff6ff; border-radius:7px; font-size:0.82rem; color:#1d4ed8; }
  .pay-info-row { display:flex; gap:12px; margin-bottom:16px; }
  .pay-info-card { flex:1; padding:12px; border-radius:8px; border:1px solid #e2e8f0; }
  .pay-info-card small { display:block; font-size:0.72rem; color:#64748b; font-weight:700; text-transform:uppercase; }
  .pay-info-card strong { font-size:1.2rem; font-weight:800; color:#1e293b; }
  .pay-info-card.outstanding { border-color:#fca5a5; background:#fff1f2; }
  .pay-info-card.outstanding strong { color:#dc2626; }
  .amount-input-wrap { display:flex; gap:8px; }
  .amount-input-wrap .dlg-input { flex:1; }
  .btn-full-amt { white-space:nowrap; background:#10b981; color:white; border:none; border-radius:7px; padding:6px 12px; font-size:0.75rem; font-weight:700; cursor:pointer; }
  .pb-summary-row { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .pb-sum-card { flex:1; min-width:130px; padding:12px 16px; border-radius:8px; border:1px solid #e2e8f0; }
  .pb-sum-card small { display:block; font-size:0.72rem; color:#64748b; font-weight:700; text-transform:uppercase; }
  .pb-sum-card strong { font-size:1.15rem; font-weight:800; display:block; margin-top:4px; }
  .pb-sum-card.green strong { color:#15803d; } .pb-sum-card.blue strong { color:#2563eb; } .pb-sum-card.red strong { color:#dc2626; }
  .date-filter-row { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .pb-table { width:100%; border-collapse:collapse; font-size:0.82rem; margin-top:8px; }
  .pb-table thead { background:#374151; color:white; }
  .pb-table th,.pb-table td { padding:8px 10px; }
  .pb-table tbody tr { border-bottom:1px solid #f1f5f9; }
  .pb-table tbody tr.outstanding-row { background:#fffbeb; }
  .pb-table .totals-row { background:#f1f5f9; font-weight:700; }
  .text-right { text-align:right; }
  .amt-due { color:#dc2626; font-weight:700; }
  .type-chip { background:#f1f5f9; color:#374151; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:700; }
  .pb-loading,.pb-empty { text-align:center; padding:32px; color:#94a3b8; }
  .confirm-msg { font-size:0.95rem; color:#374151; margin:0 0 8px; }
  .confirm-sub { font-size:0.82rem; color:#64748b; margin:0; }
  .print-only { display:none; }
  @media (max-width:600px) { .lm-dialog-lg,.lm-dialog-xl { min-width:96vw; } .att-top-row { flex-direction:column; } }
`];

// ─────────────────────────────────────────────────────────────
// DIALOG 1 – Add / Edit Worker
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-worker-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lm-dialog">
      <div class="lm-dialog-header">
        <h2><mat-icon>{{ data.worker ? 'edit' : 'person_add' }}</mat-icon>
          {{ data.worker ? 'Edit Worker' : 'Add New Worker' }}</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="lm-dialog-body">
        <div class="form-row">
          <label>Name <span class="req">*</span></label>
          <input type="text" [(ngModel)]="form.name" placeholder="Full name" class="dlg-input" autofocus>
        </div>
        <div class="form-row">
          <label>Phone (optional)</label>
          <input type="tel" [(ngModel)]="form.phone" placeholder="+91 XXXXX XXXXX" class="dlg-input">
        </div>
        <div class="form-row">
          <label>Notes (optional)</label>
          <textarea [(ngModel)]="form.notes" placeholder="Any notes about this worker..." rows="2" class="dlg-input"></textarea>
        </div>
        <div class="dlg-error" *ngIf="error">{{ error }}</div>
      </div>
      <div class="lm-dialog-footer">
        <button class="btn-dlg-cancel" (click)="ref.close()">Cancel</button>
        <button class="btn-dlg-primary" [disabled]="saving" (click)="save()">
          {{ saving ? 'Saving...' : (data.worker ? 'Update Worker' : 'Add Worker') }}
        </button>
      </div>
    </div>
  `,
  styles: DIALOG_STYLES
})
export class WorkerFormDialogComponent {
  ref = inject(MatDialogRef<WorkerFormDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { worker?: Worker };
  private workerService = inject(WorkerService);

  form = {
    name: this.data?.worker?.name || '',
    phone: this.data?.worker?.phone || '',
    notes: this.data?.worker?.notes || ''
  };
  error = '';
  saving = false;

  async save() {
    if (!this.form.name.trim()) { this.error = 'Name is required'; return; }
    this.saving = true;
    this.error = '';
    try {
      if (this.data?.worker) {
        const result = await this.workerService.updateWorker(this.data.worker.id, {
          name: this.form.name.trim(),
          phone: this.form.phone.trim() || undefined,
          notes: this.form.notes.trim() || undefined
        });
        if (!result.success) throw new Error(result.error);
        this.ref.close({ updated: true });
      } else {
        const result = await this.workerService.addWorker(
          this.form.name.trim(),
          this.form.phone.trim() || undefined,
          this.form.notes.trim() || undefined
        );
        if (!result.success) throw new Error(result.error);
        this.ref.close({ added: true });
      }
    } catch (e: any) {
      this.error = e.message || 'Operation failed';
    } finally {
      this.saving = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DIALOG 2 – Mark Attendance
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-attendance-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lm-dialog lm-dialog-lg">
      <div class="lm-dialog-header">
        <h2><mat-icon>event_available</mat-icon> Mark Attendance</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="lm-dialog-body">
        <div class="att-top-row">
          <div class="form-row" style="flex:1">
            <label>Attendance Date <span class="req">*</span></label>
            <input type="date" [(ngModel)]="date" class="dlg-input">
          </div>
          <div class="form-row" style="flex:1">
            <label>Default Wage Type</label>
            <select [(ngModel)]="defaultType" (change)="applyDefaultType()" class="dlg-input">
              <option value="Full Day">Full Day (₹{{ wages['Full Day'] }})</option>
              <option value="Half Day">Half Day (₹{{ wages['Half Day'] }})</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="att-select-all">
          <label class="check-row">
            <input type="checkbox" [checked]="allSelected" (change)="toggleAll($event)">
            <span>Select All Workers</span>
          </label>
          <span class="att-count">{{ selectedCount }} of {{ workers.length }} selected</span>
        </div>

        <div class="att-table-wrap">
          <table class="att-table">
            <thead>
              <tr>
                <th class="col-check"></th>
                <th>Worker</th>
                <th class="col-type">Type</th>
                <th class="col-wage">Wage (₹)</th>
                <th class="col-paid">Paid Now?</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of workerRows" [class.att-selected]="w.selected">
                <td class="col-check">
                  <input type="checkbox" [(ngModel)]="w.selected" (change)="onRowCheck(w)">
                </td>
                <td>
                  <div class="worker-cell">
                    <div class="w-avatar" [style.background]="getColor(w.name)">{{ initials(w.name) }}</div>
                    <div>
                      <strong>{{ w.name }}</strong>
                      <small>{{ w.phone || 'No phone' }}</small>
                    </div>
                  </div>
                </td>
                <td class="col-type">
                  <select [(ngModel)]="w.type" (change)="onTypeChange(w)" class="dlg-input-sm" [disabled]="!w.selected">
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Custom">Custom</option>
                  </select>
                </td>
                <td class="col-wage">
                  <input type="number" [(ngModel)]="w.wage" class="dlg-input-sm" [disabled]="!w.selected" min="0">
                </td>
                <td class="col-paid">
                  <input type="checkbox" [(ngModel)]="w.paidNow" [disabled]="!w.selected">
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="att-summary" *ngIf="selectedCount > 0">
          <span>{{ selectedCount }} worker(s) · Total Wage: <strong>₹{{ totalWage | number }}</strong></span>
        </div>
        <div class="dlg-error" *ngIf="error">{{ error }}</div>
      </div>
      <div class="lm-dialog-footer">
        <button class="btn-dlg-cancel" (click)="ref.close()">Cancel</button>
        <button class="btn-dlg-primary" [disabled]="saving || selectedCount === 0" (click)="save()">
          {{ saving ? 'Saving...' : 'Save Attendance' }}
        </button>
      </div>
    </div>
  `,
  styles: DIALOG_STYLES
})
export class AttendanceDialogComponent implements OnInit {
  ref = inject(MatDialogRef<AttendanceDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { workers: Worker[]; partners: any[] };
  private productionService = inject(ProductionService);

  wages = WAGE_RATES;
  workers: Worker[] = [];

  workerRows: Array<{
    id: string; name: string; phone: string;
    selected: boolean; type: string; wage: number; paidNow: boolean;
  }> = [];

  date = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  defaultType = 'Full Day';
  error = '';
  saving = false;

  ngOnInit() {
    this.workers = this.data?.workers?.filter(w => w.active) || [];
    this.workerRows = this.workers.map(w => ({
      id: w.id, name: w.name, phone: w.phone || '',
      selected: false, type: 'Full Day', wage: WAGE_RATES['Full Day'], paidNow: false
    }));
  }

  get selectedCount() { return this.workerRows.filter(r => r.selected).length; }
  get allSelected() { return this.workerRows.length > 0 && this.workerRows.every(r => r.selected); }
  get totalWage() { return this.workerRows.filter(r => r.selected).reduce((s, r) => s + (r.wage || 0), 0); }

  toggleAll(e: any) {
    const checked = (e.target as HTMLInputElement).checked;
    this.workerRows.forEach(r => r.selected = checked);
  }

  onRowCheck(row: any) { /* checkbox handles ngModel */ }

  onTypeChange(row: any) {
    if (row.type !== 'Custom') row.wage = WAGE_RATES[row.type as keyof typeof WAGE_RATES] || 0;
  }

  applyDefaultType() {
    this.workerRows.filter(r => r.selected).forEach(r => {
      r.type = this.defaultType;
      if (this.defaultType !== 'Custom') r.wage = WAGE_RATES[this.defaultType as keyof typeof WAGE_RATES] || 0;
    });
  }

  getColor(name: string) {
    const colors = ['#F44336','#E91E63','#9C27B0','#3F51B5','#2196F3','#009688','#4CAF50','#FF9800','#FF5722'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  initials(name: string) {
    const p = name.split(' '); return (p[0][0] + (p[1]?.[0] || '')).toUpperCase();
  }

  async save() {
    if (!this.date) { this.error = 'Select attendance date'; return; }
    if (this.selectedCount === 0) { this.error = 'Select at least one worker'; return; }
    this.saving = true; this.error = '';
    try {
      const selected = this.workerRows.filter(r => r.selected);
      const payload = selected.map(r => ({
        worker_id: r.id,
        worker_name: r.name,
        attendance_type: r.type as 'Full Day' | 'Half Day' | 'Custom',
        wage_earned: r.wage || 0,
        paid_today: r.paidNow ? (r.wage || 0) : 0,
        paid_by_partner_id: undefined
      }));
      const result = await this.productionService.saveWorkerWagesOnly(payload, this.date);
      if (!result.success) throw new Error(result.error);
      this.ref.close({ saved: true, count: selected.length });
    } catch (e: any) {
      this.error = e.message || 'Failed to save attendance';
    } finally {
      this.saving = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DIALOG 3 – Worker Passbook
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-passbook-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lm-dialog lm-dialog-xl">
      <div class="lm-dialog-header">
        <h2><mat-icon>menu_book</mat-icon> Passbook — {{ data.worker.worker_name }}</h2>
        <div class="header-actions">
          <button class="btn-print" (click)="printPassbook()" title="Print / Save as PDF">
            <mat-icon>print</mat-icon> Print / PDF
          </button>
          <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
        </div>
      </div>

      <div class="lm-dialog-body" id="passbook-print-area">
        <!-- Print Header -->
        <div class="print-only print-header">
          <h1>Suraksha Walls</h1>
          <h3>Worker Passbook — {{ data.worker.worker_name }}</h3>
          <p>Phone: {{ data.worker.phone || 'N/A' }}</p>
        </div>

        <!-- Summary -->
        <div class="pb-summary-row">
          <div class="pb-sum-card green">
            <small>Total Earned</small>
            <strong>₹{{ data.worker.total_earned | number:'1.0-0' }}</strong>
          </div>
          <div class="pb-sum-card blue">
            <small>Total Paid</small>
            <strong>₹{{ data.worker.total_paid | number:'1.0-0' }}</strong>
          </div>
          <div class="pb-sum-card" [class.red]="data.worker.outstanding > 0" [class.grey]="data.worker.outstanding === 0">
            <small>Outstanding</small>
            <strong>₹{{ data.worker.outstanding | number:'1.0-0' }}</strong>
          </div>
        </div>

        <!-- Date Filter (non-print) -->
        <div class="no-print date-filter-row">
          <input type="date" [(ngModel)]="startDate" class="dlg-input-sm" placeholder="From">
          <span style="color:#9ca3af">to</span>
          <input type="date" [(ngModel)]="endDate" class="dlg-input-sm" placeholder="To">
          <button class="btn-dlg-secondary btn-sm" (click)="load()">Filter</button>
          <button class="btn-dlg-secondary btn-sm" (click)="clearFilter()">Clear</button>
        </div>

        <div *ngIf="loading" class="pb-loading">Loading...</div>

        <table class="pb-table" *ngIf="!loading && entries.length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th class="text-right">Earned</th>
              <th class="text-right">Paid Same Day</th>
              <th class="text-right">Paid Later</th>
              <th class="text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of entries" [class.outstanding-row]="e.current_outstanding > 0">
              <td>{{ e.work_date | date:'dd MMM yyyy' }}</td>
              <td><span class="type-chip">{{ e.attendance_type }}</span></td>
              <td class="text-right">₹{{ e.wage_earned | number:'1.0-0' }}</td>
              <td class="text-right">₹{{ e.paid_initially | number:'1.0-0' }}</td>
              <td class="text-right">₹{{ e.total_paid_later | number:'1.0-0' }}</td>
              <td class="text-right" [class.amt-due]="e.current_outstanding > 0">
                ₹{{ e.current_outstanding | number:'1.0-0' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2"><strong>Total</strong></td>
              <td class="text-right"><strong>₹{{ totalEarned | number:'1.0-0' }}</strong></td>
              <td class="text-right"><strong>₹{{ totalPaidInitially | number:'1.0-0' }}</strong></td>
              <td class="text-right"><strong>₹{{ totalPaidLater | number:'1.0-0' }}</strong></td>
              <td class="text-right amt-due"><strong>₹{{ totalOutstanding | number:'1.0-0' }}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div *ngIf="!loading && entries.length === 0" class="pb-empty">
          No wage entries found for this period.
        </div>
      </div>

      <div class="lm-dialog-footer no-print">
        <button class="btn-dlg-cancel" (click)="ref.close()">Close</button>
        <button class="btn-dlg-primary" (click)="printPassbook()">
          <mat-icon style="font-size:1rem;vertical-align:middle;">picture_as_pdf</mat-icon> Export PDF
        </button>
      </div>
    </div>
  `,
  styles: DIALOG_STYLES
})
export class PassbookDialogComponent implements OnInit {
  ref = inject(MatDialogRef<PassbookDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { worker: WorkerOutstanding };
  private laborPaymentService = inject(LaborPaymentService);

  entries: WageEntryWithPayments[] = [];
  startDate = '';
  endDate = '';
  loading = true;

  get totalEarned() { return this.entries.reduce((s,e) => s+e.wage_earned, 0); }
  get totalPaidInitially() { return this.entries.reduce((s,e) => s+e.paid_initially, 0); }
  get totalPaidLater() { return this.entries.reduce((s,e) => s+e.total_paid_later, 0); }
  get totalOutstanding() { return this.entries.reduce((s,e) => s+e.current_outstanding, 0); }

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    try {
      this.entries = await this.laborPaymentService.getWorkerPaymentHistory(this.data.worker.worker_id);
      if (this.startDate) this.entries = this.entries.filter(e => e.work_date >= this.startDate);
      if (this.endDate) this.entries = this.entries.filter(e => e.work_date <= this.endDate);
    } finally {
      this.loading = false;
    }
  }

  clearFilter() {
    this.startDate = '';
    this.endDate = '';
    this.load();
  }

  printPassbook() {
    const printContent = document.getElementById('passbook-print-area');
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Allow popups to print'); return; }
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Passbook - ${this.data.worker.worker_name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 13px; }
        table { width:100%; border-collapse: collapse; margin-top:16px; }
        th, td { border: 1px solid #ccc; padding: 7px 10px; text-align:left; }
        th { background:#374151; color:#fff; }
        .text-right { text-align:right; }
        .pb-summary-row { display:flex; gap:16px; margin:16px 0; }
        .pb-sum-card { border:1px solid #ddd; padding:12px 20px; border-radius:8px; min-width:140px; }
        .pb-sum-card small { display:block; font-size:0.75rem; color:#666; }
        .pb-sum-card strong { font-size:1.2rem; display:block; margin-top:4px; }
        .totals-row { background:#f3f4f6; font-weight:700; }
        h1, h3 { margin:0; }
        .date-filter-row { display:none; }
        .no-print { display:none; }
        .btn-print { display:none; }
        .dlg-close { display:none; }
        .header-actions { display:none; }
      </style>
      </head><body>
      <h2>Suraksha Walls — Worker Passbook</h2>
      <h3>${this.data.worker.worker_name} | Phone: ${this.data.worker.phone || 'N/A'}</h3>
      ${printContent.innerHTML}
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}

// ─────────────────────────────────────────────────────────────
// DIALOG 4 – Pay Worker
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-pay-worker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lm-dialog">
      <div class="lm-dialog-header">
        <h2><mat-icon>payments</mat-icon> Record Payment — {{ data.worker.worker_name }}</h2>
        <button class="dlg-close" (click)="ref.close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="lm-dialog-body">
        <div class="pay-info-row">
          <div class="pay-info-card">
            <small>Total Earned</small>
            <strong>₹{{ data.worker.total_earned | number:'1.0-0' }}</strong>
          </div>
          <div class="pay-info-card outstanding">
            <small>Outstanding</small>
            <strong>₹{{ data.worker.outstanding | number:'1.0-0' }}</strong>
          </div>
        </div>

        <div class="form-row">
          <label>Payment Date <span class="req">*</span></label>
          <input type="date" [(ngModel)]="payDate" class="dlg-input">
        </div>
        <div class="form-row">
          <label>Amount (₹) <span class="req">*</span></label>
          <div class="amount-input-wrap">
            <input type="number" [(ngModel)]="amount" [max]="data.worker.outstanding"
                   min="1" class="dlg-input" placeholder="Enter amount">
            <button class="btn-full-amt" (click)="amount = data.worker.outstanding" type="button">
              Pay Full (₹{{ data.worker.outstanding | number:'1.0-0' }})
            </button>
          </div>
        </div>
        <div class="form-row">
          <label>Paid By (Partner) <span class="req">*</span></label>
          <select [(ngModel)]="partnerId" class="dlg-input">
            <option value="">-- Select Partner --</option>
            <option *ngFor="let p of data.partners" [value]="p.id">{{ p.partner_name }}</option>
          </select>
        </div>
        <div class="form-row">
          <label>Notes (optional)</label>
          <input type="text" [(ngModel)]="notes" placeholder="e.g. July settlement" class="dlg-input">
        </div>
        <div class="dlg-error" *ngIf="error">{{ error }}</div>
      </div>
      <div class="lm-dialog-footer">
        <button class="btn-dlg-cancel" (click)="ref.close()">Cancel</button>
        <button class="btn-dlg-primary" [disabled]="saving || amount <= 0" (click)="save()">
          {{ saving ? 'Recording...' : 'Confirm Payment' }}
        </button>
      </div>
    </div>
  `,
  styles: DIALOG_STYLES
})
export class PayWorkerDialogComponent {
  ref = inject(MatDialogRef<PayWorkerDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { worker: WorkerOutstanding; partners: any[] };
  private laborPaymentService = inject(LaborPaymentService);

  payDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  amount = this.data?.worker?.outstanding || 0;
  partnerId = '';
  notes = '';
  error = '';
  saving = false;

  async save() {
    if (!this.payDate) { this.error = 'Select payment date'; return; }
    if (this.amount <= 0) { this.error = 'Enter valid amount'; return; }
    if (this.amount > this.data.worker.outstanding) {
      this.error = `Amount cannot exceed outstanding ₹${this.data.worker.outstanding}`; return;
    }
    this.saving = true; this.error = '';
    try {
      let remaining = this.amount;
      for (const entry of this.data.worker.wage_entries) {
        if (remaining <= 0) break;
        const toPay = Math.min(remaining, entry.current_outstanding);
        if (toPay > 0) {
          const r = await this.laborPaymentService.recordPayment({
            wage_entry_id: entry.wage_entry_id,
            worker_id: this.data.worker.worker_id,
            payment_date: this.payDate,
            amount_paid: toPay,
            paid_by_partner_id: this.partnerId || undefined,
            payment_mode: 'cash',
            notes: this.notes || undefined
          });
          if (!r.success) throw new Error(r.error);
          remaining -= toPay;
        }
      }
      this.ref.close({ paid: true, amount: this.amount });
    } catch (e: any) {
      this.error = e.message || 'Payment failed';
    } finally {
      this.saving = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// DIALOG 5 – Confirm Action
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="lm-dialog lm-dialog-sm">
      <div class="lm-dialog-header" [class.danger-header]="data.danger">
        <h2><mat-icon>{{ data.icon || 'warning' }}</mat-icon> {{ data.title }}</h2>
      </div>
      <div class="lm-dialog-body">
        <p class="confirm-msg">{{ data.message }}</p>
        <p class="confirm-sub" *ngIf="data.sub">{{ data.sub }}</p>
      </div>
      <div class="lm-dialog-footer">
        <button class="btn-dlg-cancel" (click)="ref.close(false)">Cancel</button>
        <button [class]="data.danger ? 'btn-dlg-danger' : 'btn-dlg-primary'" (click)="ref.close(true)">
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: DIALOG_STYLES
})
export class ConfirmDialogComponent {
  ref = inject(MatDialogRef<ConfirmDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as {
    title: string; message: string; sub?: string;
    confirmLabel?: string; danger?: boolean; icon?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-labour-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatIconModule,
    BreadcrumbComponent, MfgFooterComponent
  ],
  templateUrl: './labour-management.component.html',
  styleUrls: ['./labour-management.component.css']
})
export class LabourManagementComponent implements OnInit {

  workers: (Worker & { outstanding?: number })[] = [];
  allWorkersOutstanding: WorkerOutstanding[] = [];
  partners: any[] = [];

  loading = false;
  saving = false;
  successMsg = '';
  errorMsg = '';

  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' | 'outstanding' = 'active';

  stats = { total: 0, active: 0, outstanding: 0, totalDue: 0, totalEarned: 0 };

  constructor(
    private workerService: WorkerService,
    private laborPaymentService: LaborPaymentService,
    private partnerService: PartnerService,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    try {
      const [workers, outstanding, partnersData] = await Promise.all([
        this.workerService.getAllWorkers(),
        this.laborPaymentService.getWorkersWithOutstanding(false, 'all'),
        this.partnerService.getAllPartners()
      ]);
      this.allWorkersOutstanding = outstanding;
      const outstandingMap = new Map(outstanding.map(w => [w.worker_id, w.outstanding]));
      this.workers = workers.map(w => ({
        ...w,
        outstanding: outstandingMap.get(w.id) || 0
      }));
      this.partners = (partnersData || []).map((p: any) => ({
        id: p.id || p.partner_id,
        partner_name: p.partner_name || p.name
      }));
      this.computeStats();
    } catch (e: any) {
      this.showError('Failed to load workers: ' + e.message);
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  computeStats() {
    this.stats.total = this.workers.length;
    this.stats.active = this.workers.filter(w => w.active).length;
    this.stats.outstanding = this.workers.filter(w => (w.outstanding || 0) > 0).length;
    this.stats.totalDue = this.workers.reduce((s, w) => s + (w.outstanding || 0), 0);
    this.stats.totalEarned = this.workers.reduce((s, w) => s + (w.total_earned || 0), 0);
  }

  get filteredWorkers() {
    let list = this.workers;
    if (this.filterStatus === 'active') list = list.filter(w => w.active);
    else if (this.filterStatus === 'inactive') list = list.filter(w => !w.active);
    else if (this.filterStatus === 'outstanding') list = list.filter(w => (w.outstanding || 0) > 0);
    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase().trim();
      list = list.filter(w => w.name.toLowerCase().includes(s) || (w.phone || '').includes(s));
    }
    return list;
  }

  getColor(name: string) {
    const colors = ['#F44336','#E91E63','#9C27B0','#3F51B5','#2196F3','#00BCD4','#009688','#4CAF50','#FF9800','#FF5722'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  initials(name: string) {
    const p = name.trim().split(' '); return (p[0][0] + (p[1]?.[0] || '')).toUpperCase();
  }

  // ── OPEN DIALOGS ────────────────────────────────────────

  openAddWorker() {
    this.dialog.open(WorkerFormDialogComponent, {
      width: '480px', disableClose: true,
      data: { worker: null }
    }).afterClosed().subscribe(r => {
      if (r?.added) { this.showSuccess('Worker added successfully'); this.loadAll(); }
    });
  }

  openEditWorker(worker: Worker) {
    this.dialog.open(WorkerFormDialogComponent, {
      width: '480px', disableClose: true,
      data: { worker }
    }).afterClosed().subscribe(r => {
      if (r?.updated) { this.showSuccess('Worker updated'); this.loadAll(); }
    });
  }

  openAttendance() {
    this.dialog.open(AttendanceDialogComponent, {
      width: '720px', maxWidth: '98vw', disableClose: true,
      data: { workers: this.workers, partners: this.partners }
    }).afterClosed().subscribe(r => {
      if (r?.saved) { this.showSuccess(`Attendance saved for ${r.count} worker(s)`); this.loadAll(); }
    });
  }

  openPassbook(worker: Worker) {
    const outstanding = this.allWorkersOutstanding.find(w => w.worker_id === worker.id) || {
      worker_id: worker.id,
      worker_name: worker.name,
      phone: worker.phone || '',
      total_earned: worker.total_earned,
      total_paid: worker.total_paid,
      outstanding: (worker as any).outstanding || 0,
      wage_entries: []
    };
    this.dialog.open(PassbookDialogComponent, {
      width: '840px', maxWidth: '98vw',
      data: { worker: outstanding }
    });
  }

  openPay(worker: Worker) {
    const wo = this.allWorkersOutstanding.find(w => w.worker_id === worker.id);
    if (!wo || wo.outstanding <= 0) {
      this.showSuccess('No outstanding balance for this worker');
      return;
    }
    this.dialog.open(PayWorkerDialogComponent, {
      width: '480px', disableClose: true,
      data: { worker: wo, partners: this.partners }
    }).afterClosed().subscribe(r => {
      if (r?.paid) { this.showSuccess(`₹${r.amount} recorded for ${worker.name}`); this.loadAll(); }
    });
  }

  openToggleStatus(worker: Worker) {
    const action = worker.active ? 'deactivate' : 'reactivate';
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: worker.active ? 'Deactivate Worker' : 'Activate Worker',
        message: `Are you sure you want to ${action} "${worker.name}"?`,
        sub: worker.active ? 'Worker will be hidden from attendance sheets.' : 'Worker will appear in attendance sheets again.',
        confirmLabel: worker.active ? 'Deactivate' : 'Activate',
        icon: worker.active ? 'pause_circle' : 'play_circle'
      }
    }).afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      const r = await this.workerService.updateWorker(worker.id, { active: !worker.active });
      if (r.success) { this.showSuccess(`Worker ${action}d`); this.loadAll(); }
      else this.showError(r.error || 'Failed');
    });
  }

  openDelete(worker: Worker) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Worker',
        message: `Remove "${worker.name}" from the system?`,
        sub: 'This will deactivate the worker. Payment history will be preserved.',
        confirmLabel: 'Remove', danger: true, icon: 'delete_forever'
      }
    }).afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      const r = await this.workerService.updateWorker(worker.id, { active: false });
      if (r.success) { this.showSuccess(`${worker.name} removed`); this.loadAll(); }
      else this.showError(r.error || 'Failed');
    });
  }

  // ── MESSAGES ─────────────────────────────────────────────

  showSuccess(msg: string) {
    this.successMsg = msg;
    this.cd.detectChanges();
    setTimeout(() => { this.successMsg = ''; this.cd.detectChanges(); }, 3500);
  }

  showError(msg: string) {
    this.errorMsg = msg;
    this.cd.detectChanges();
    setTimeout(() => { this.errorMsg = ''; this.cd.detectChanges(); }, 5000);
  }

  formatCurrency(n: number) {
    return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  }
}
