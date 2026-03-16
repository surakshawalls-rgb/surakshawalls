// src/app/pages/library-bulk-whatsapp/library-bulk-whatsapp.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LibraryService } from '../../services/library.service';
import {
  WhatsAppService,
  WaStudent,
  WaPreset,
  WA_PRESETS,
  WaResult,
  WaBulkRequest,
  WaStatusSummary,
  WaTrackingStatus,
} from '../../services/whatsapp.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

// Enriched student record (student + seat expiry)
interface StudentRow {
  id: string;
  name: string;
  mobile: string;
  status: string;
  seat_no: number | null;
  shift: string | null;
  expiry_date: string | null;   // ISO date
  expiry_label: string;         // human-friendly
  expiry_class: string;         // CSS class: ok | warning | danger | expired
  selected: boolean;
  result?: WaResult;
}

type FilterKey = 'all' | 'expiring_7' | 'expiring_30' | 'expired';

@Component({
  selector: 'app-library-bulk-whatsapp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    BreadcrumbComponent,
  ],
  templateUrl: './library-bulk-whatsapp.component.html',
  styleUrls: ['./library-bulk-whatsapp.component.css'],
})
export class LibraryBulkWhatsappComponent implements OnInit, OnDestroy {

  rows: StudentRow[] = [];
  filteredRows: StudentRow[] = [];
  loading = true;

  filterKey: FilterKey = 'expiring_30';
  searchTerm = '';

  presets = WA_PRESETS;
  selectedPresetId = 'approved_hi_template';
  customMessage = '';
  approvedTemplateName = '';
  approvedTemplateLanguage = '';
  approvedTemplateVariables = '';

  get selectedPreset(): WaPreset {
    return this.presets.find(p => p.id === this.selectedPresetId) ?? this.presets[0];
  }

  sending = false;
  progress = 0;       // 0-100
  sentCount = 0;
  failedCount = 0;
  showResults = false;
  currentBatchId = '';
  trackingEnabled = false;
  statusSummary: WaStatusSummary = this.emptyStatusSummary();
  lastStatusCheckedAt = '';
  private statusPollTimer: ReturnType<typeof setTimeout> | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(
    private libraryService: LibraryService,
    private whatsapp: WhatsAppService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.onPresetSelect(this.selectedPresetId);
    await this.loadStudents();
  }

  onPresetSelect(presetId: string) {
    this.selectedPresetId = presetId;
    const preset = this.presets.find(p => p.id === presetId);

    if (!preset) return;
    if (preset.mode === 'text') return;

    // Prefill template config from selected preset; users can still edit manually.
    this.approvedTemplateName = preset.template_name ?? this.approvedTemplateName;
    this.approvedTemplateLanguage = preset.template_language ?? this.approvedTemplateLanguage;
    this.approvedTemplateVariables = (preset.template_params ?? []).join(', ');
  }

  ngOnDestroy() {
    this.stopStatusPolling();
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  async loadStudents() {
    this.loading = true;
    try {
      const seats = await this.libraryService.getAllSeats(false);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const rowMap = new Map<string, StudentRow>();

      for (const seat of seats) {
        const entries: [any, string | null | undefined, string][] = [
          [seat.full_time_student,    seat.full_time_expiry,    'Full-Day'],
          [seat.first_half_student,   seat.first_half_expiry,   'Morning'],
          [seat.second_half_student,  seat.second_half_expiry,  'Evening'],
        ];

        for (const [student, expiry, shift] of entries) {
          if (!student || rowMap.has(student.id)) continue;
          if (student.status !== 'active') continue;

          const row = this.buildRow(student, seat.seat_no, shift, expiry ?? null, today);
          rowMap.set(student.id, row);
        }
      }

      this.rows = Array.from(rowMap.values()).sort((a, b) => {
        const order = { expired: 0, danger: 1, warning: 2, ok: 3 };
        const diff = (order[a.expiry_class as keyof typeof order] ?? 4)
                   - (order[b.expiry_class as keyof typeof order] ?? 4);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      });

      this.applyFilter();
    } catch (err: any) {
      this.errorMessage = `Failed to load students: ${err.message}`;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private buildRow(
    student: any,
    seatNo: number,
    shift: string,
    expiry: string | null,
    today: Date
  ): StudentRow {
    let expiryLabel = 'No expiry';
    let expiryClass = 'ok';

    if (expiry) {
      const exp = new Date(expiry); exp.setHours(0, 0, 0, 0);
      const days = Math.round((exp.getTime() - today.getTime()) / 86_400_000);
      if (days < 0) {
        expiryLabel = `Expired ${Math.abs(days)}d ago`;
        expiryClass = 'expired';
      } else if (days === 0) {
        expiryLabel = 'Expires today';
        expiryClass = 'danger';
      } else if (days <= 7) {
        expiryLabel = `Expires in ${days}d`;
        expiryClass = 'danger';
      } else if (days <= 30) {
        expiryLabel = `Expires in ${days}d`;
        expiryClass = 'warning';
      } else {
        expiryLabel = `Expires ${exp.toLocaleDateString('en-IN')}`;
        expiryClass = 'ok';
      }
    }

    return {
      id: student.id,
      name: student.name,
      mobile: student.mobile,
      status: student.status,
      seat_no: seatNo,
      shift,
      expiry_date: expiry,
      expiry_label: expiryLabel,
      expiry_class: expiryClass,
      selected: false,
    };
  }

  // ── Filtering ───────────────────────────────────────────────────────────────

  setFilter(key: FilterKey) {
    this.filterKey = key;
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    this.filteredRows = this.rows.filter(r => {
      if (term && !r.name.toLowerCase().includes(term) && !r.mobile.includes(term)) {
        return false;
      }

      switch (this.filterKey) {
        case 'expiring_7':
          return r.expiry_class === 'danger';
        case 'expiring_30':
          return r.expiry_class === 'danger' || r.expiry_class === 'warning';
        case 'expired':
          return r.expiry_class === 'expired';
        default:
          return true;
      }
    });

    this.cdr.detectChanges();
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  get selectedRows(): StudentRow[] {
    return this.filteredRows.filter(r => r.selected);
  }

  get allSelected(): boolean {
    return this.filteredRows.length > 0 && this.filteredRows.every(r => r.selected);
  }

  toggleAll(checked: boolean) {
    this.filteredRows.forEach(r => (r.selected = checked));
  }

  selectExpiring() {
    this.filteredRows.forEach(r => (r.selected = r.expiry_class === 'danger' || r.expiry_class === 'warning'));
  }

  // ── Message preview ─────────────────────────────────────────────────────────

  get previewMessage(): string {
    const p = this.selectedPreset;
    if (p.id === 'custom_text') return this.customMessage || '(Enter your custom message above)';
    const sample = this.filteredRows[0];
    if (!sample) return p.preview;
    return this.whatsapp.resolvePreview(p.preview, this.toWaStudent(sample));
  }

  isCustomMode(): boolean {
    return this.selectedPreset.id === 'custom_text';
  }

  isApprovedTemplateMode(): boolean {
    return this.selectedPreset.mode === 'template' && this.selectedPreset.id !== 'hello_world';
  }

  private parseTemplateVariables(): string[] {
    return this.approvedTemplateVariables
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  // ── Send ────────────────────────────────────────────────────────────────────

  async sendMessages() {
    const targets = this.selectedRows;
    if (targets.length === 0) {
      this.errorMessage = 'Please select at least one student.';
      return;
    }

    const preset = this.selectedPreset;
    const activeTemplateName = this.approvedTemplateName.trim() || (preset.template_name ?? '').trim();
    const activeTemplateLanguage = this.approvedTemplateLanguage.trim() || (preset.template_language ?? '').trim() || 'en_US';
    const templateParamsInput = this.approvedTemplateVariables.trim();
    const activeTemplateParams = templateParamsInput
      ? this.parseTemplateVariables()
      : (preset.template_params ?? []);

    if (preset.id === 'custom_text' && !this.customMessage.trim()) {
      this.errorMessage = 'Please enter a custom message.';
      return;
    }

    if (preset.id === 'hello_world') {
      this.errorMessage = 'hello_world only works with Meta public test numbers. Your live sender needs an approved template name.';
      return;
    }

    if (this.isApprovedTemplateMode() && !activeTemplateName) {
      this.errorMessage = 'Please enter your approved WhatsApp template name.';
      return;
    }

    if (!confirm(`Send WhatsApp messages to ${targets.length} student(s) using "${preset.label}"?`)) return;

    this.sending = true;
    this.progress = 0;
    this.sentCount = 0;
    this.failedCount = 0;
    this.showResults = false;
    this.currentBatchId = '';
    this.trackingEnabled = false;
    this.statusSummary = this.emptyStatusSummary();
    this.lastStatusCheckedAt = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.stopStatusPolling();

    targets.forEach(r => (r.result = undefined));

    try {
      const students = targets.map(r => this.toWaStudent(r));

      let overrides: Partial<WaBulkRequest> = {};
      if (preset.id === 'custom_text') {
        overrides = { text_message: this.customMessage };
      } else if (this.isApprovedTemplateMode()) {
        overrides = {
          template_name: activeTemplateName,
          template_language: activeTemplateLanguage,
          template_params: activeTemplateParams,
          use_student_values: true,
        };
      }

      const request = this.whatsapp.buildRequest(preset, students, overrides);
      const response = await this.whatsapp.sendBulk(request);

      this.sentCount = response.sent;
      this.failedCount = response.failed;
      this.progress = 100;
      this.currentBatchId = response.batch_id ?? '';
      this.trackingEnabled = !!response.tracking_enabled && !!this.currentBatchId;

      this.applyTrackedResults(response.results);
      this.statusSummary = this.buildSummaryFromResults(response.results);

      this.successMessage = this.trackingEnabled
        ? `✅ WhatsApp accepted ${this.sentCount} / ${targets.length} message request(s). Live delivery tracking is active below.`
        : `✅ WhatsApp accepted ${this.sentCount} / ${targets.length} message request(s).`;

      if (this.failedCount > 0) {
        const missingTemplate = response.results.some(r => (r.error ?? '').includes('132001'));

        if (missingTemplate && this.isApprovedTemplateMode()) {
          this.errorMessage = `Template not found in WhatsApp Manager: "${activeTemplateName}" (${activeTemplateLanguage}). Create/approve this exact template and retry.`;
        } else {
          const failureReasons = Array.from(
            new Set(
              response.results
                .filter(r => !r.success && r.error)
                .map(r => r.error as string)
            )
          ).slice(0, 3);

          this.errorMessage = `⚠️ ${this.failedCount} message(s) failed${failureReasons.length ? `: ${failureReasons.join(' | ')}` : ' – see results below.'}`;
        }
      }

      this.showResults = true;

      if (this.trackingEnabled) {
        const allComplete = await this.refreshDeliveryStatus(true);
        if (!allComplete) {
          this.scheduleStatusPolling();
        }
      }
    } catch (err: any) {
      this.errorMessage = `Send failed: ${err.message}`;
    } finally {
      this.sending = false;
      this.cdr.detectChanges();
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private toWaStudent(r: StudentRow): WaStudent {
    return {
      student_id: r.id,
      phone: r.mobile,
      name: r.name,
      expiry_date: r.expiry_date ?? undefined,
    };
  }

  private emptyStatusSummary(): WaStatusSummary {
    return {
      queued: 0,
      accepted: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };
  }

  private buildSummaryFromResults(results: WaResult[]): WaStatusSummary {
    const summary = this.emptyStatusSummary();

    results.forEach(result => {
      const status = (result.status ?? (result.success ? 'accepted' : 'failed')) as WaTrackingStatus;
      summary[status] += 1;
    });

    return summary;
  }

  private findRowForResult(result: WaResult): StudentRow | undefined {
    if (result.student_id) {
      const byId = this.rows.find(row => row.id === result.student_id);
      if (byId) return byId;
    }

    return this.rows.find(row => row.mobile.replace(/\D/g, '').endsWith(result.phone.slice(-10)));
  }

  private applyTrackedResults(results: WaResult[]) {
    results.forEach(result => {
      const row = this.findRowForResult(result);
      if (row) {
        row.result = { ...row.result, ...result };
      }
    });
  }

  async refreshDeliveryStatus(silent: boolean = false): Promise<boolean> {
    if (!this.trackingEnabled || !this.currentBatchId) {
      return true;
    }

    try {
      const response = await this.whatsapp.getBatchStatus(this.currentBatchId);

      this.applyTrackedResults(response.results);
      this.statusSummary = { ...response.summary };
      this.failedCount = response.summary.failed;
      this.lastStatusCheckedAt = new Date().toLocaleString('en-IN');

      if (!silent && response.all_complete) {
        this.successMessage = '✅ Delivery tracking updated. Final statuses are shown below.';
      }

      return response.all_complete;
    } catch (err: any) {
      if (!silent) {
        this.errorMessage = `Status refresh failed: ${err.message}`;
      }
      return false;
    } finally {
      this.cdr.detectChanges();
    }
  }

  private scheduleStatusPolling() {
    this.stopStatusPolling();

    if (!this.trackingEnabled || !this.currentBatchId) {
      return;
    }

    this.statusPollTimer = setTimeout(async () => {
      const allComplete = await this.refreshDeliveryStatus(true);
      if (!allComplete) {
        this.scheduleStatusPolling();
      } else {
        this.stopStatusPolling();
      }
    }, 10000);
  }

  private stopStatusPolling() {
    if (this.statusPollTimer) {
      clearTimeout(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

  get batchTrackingComplete(): boolean {
    const active = this.statusSummary.queued + this.statusSummary.accepted + this.statusSummary.sent;
    const total = active + this.statusSummary.delivered + this.statusSummary.read + this.statusSummary.failed;
    return total > 0 && active === 0;
  }

  getResultLabel(result?: WaResult): string {
    switch (result?.status) {
      case 'accepted':
        return '✅ Accepted by WhatsApp';
      case 'sent':
        return '📤 Sent';
      case 'delivered':
        return '📬 Delivered';
      case 'read':
        return '👁️ Read';
      case 'failed':
        return '❌ Failed';
      default:
        return '⏳ Pending';
    }
  }

  getResultClass(status?: WaTrackingStatus): string {
    switch (status) {
      case 'accepted':
        return 'result-accepted';
      case 'sent':
        return 'result-sent';
      case 'delivered':
        return 'result-delivered';
      case 'read':
        return 'result-read';
      case 'failed':
        return 'result-failed';
      default:
        return 'result-neutral';
    }
  }

  getResultTimestamp(result?: WaResult): string {
    const timestamp = result?.read_at
      ?? result?.delivered_at
      ?? result?.sent_at
      ?? result?.failed_at
      ?? result?.accepted_at
      ?? result?.last_status_at;

    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleString('en-IN');
  }

  goBack() {
    this.router.navigate(['/library-grid']);
  }

  trackById(_: number, row: StudentRow) { return row.id; }
}
