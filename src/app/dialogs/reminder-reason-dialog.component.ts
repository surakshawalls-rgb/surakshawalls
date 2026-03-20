import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ReminderReasonType =
  | 'fee_due'
  | 'discipline'
  | 'disturbance'
  | 'attendance'
  | 'holiday_closure'
  | 'status_check'
  | 'cleanliness'
  | 'other';

export interface ReminderReasonOption {
  value: ReminderReasonType;
  label: string;
  helper: string;
}

export interface ReminderReasonDialogData {
  studentName?: string;
}

export interface ReminderReasonSelection {
  reason: ReminderReasonType;
  customNote: string;
  closureStartDate?: string | null;
  closureEndDate?: string | null;
}

export interface ReminderMessageContext {
  studentName: string;
  seatLabel?: string | null;
  expiryDate?: string | null;
}

export const REMINDER_REASON_OPTIONS: ReminderReasonOption[] = [
  {
    value: 'fee_due',
    label: 'Fee Reminder',
    helper: 'Use this when fee renewal or seat extension payment is pending.'
  },
  {
    value: 'discipline',
    label: 'Discipline Issue',
    helper: 'Use this for silence, rules, behavior, or phone usage related reminders.'
  },
  {
    value: 'disturbance',
    label: 'Disturbance Complaint',
    helper: 'Use this when the student is disturbing nearby students or the study environment.'
  },
  {
    value: 'attendance',
    label: 'Attendance Reminder',
    helper: 'Use this for irregular attendance or prolonged absence reminders.'
  },
  {
    value: 'holiday_closure',
    label: 'Holiday / Closed Notice',
    helper: 'Use this when library will remain closed for festival, emergency, or maintenance.'
  },
  {
    value: 'status_check',
    label: 'Continue or Quit Status',
    helper: 'Use this when the student has been absent for a few days without notice and the team needs confirmation.'
  },
  {
    value: 'cleanliness',
    label: 'Cleanliness Reminder',
    helper: 'Use this when the student needs to maintain seat and desk cleanliness.'
  },
  {
    value: 'other',
    label: 'Other Reason',
    helper: 'Use this for any custom reminder that does not fit the listed reasons.'
  }
];

export function getReminderReasonLabel(reason: ReminderReasonType): string {
  return REMINDER_REASON_OPTIONS.find(option => option.value === reason)?.label || 'Reminder';
}

function parseIsoDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatReminderDateLabel(dateValue: string | null | undefined): string {
  const parsed = parseIsoDate(dateValue);
  if (!parsed) {
    return 'selected date';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getInclusiveDaysBetween(startDate: string | null | undefined, endDate: string | null | undefined): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

export function buildLibraryReminderMessage(
  selection: ReminderReasonSelection,
  context: ReminderMessageContext
): string {
  const seatLine = context.seatLabel ? `Seat: ${context.seatLabel}\n` : '';
  const expiryLine = context.expiryDate ? `Expiry / Renewal Date: ${context.expiryDate}\n` : '';
  const additionalNote = selection.customNote.trim()
    ? `\nAdditional note:\n${selection.customNote.trim()}\n`
    : '';

  switch (selection.reason) {
    case 'fee_due':
      return `Hello ${context.studentName},\n\nThis is a fee reminder from Suraksha Library.\n${seatLine}${expiryLine}\nPlease renew your library fee on time to continue using your seat without interruption. If payment has already been made, please share the update with the library desk.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'discipline':
      return `Hello ${context.studentName},\n\nThis is an important reminder from Suraksha Library regarding discipline and library rules.\n${seatLine}\nPlease maintain silence, avoid phone conversations, and follow staff instructions so the study environment remains peaceful for everyone.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'disturbance':
      return `Hello ${context.studentName},\n\nA disturbance-related issue has been reported in the study area.\n${seatLine}\nPlease avoid loud conversation, unnecessary movement, or any behavior that affects other students. We request your cooperation in maintaining a calm study environment.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'attendance':
      return `Hello ${context.studentName},\n\nThis is a reminder from Suraksha Library regarding regular attendance and seat usage.\n${seatLine}${expiryLine}\nPlease use your allotted seat regularly. If you are unable to continue, kindly inform the library desk so we can update the record accordingly.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'holiday_closure': {
      const fromDate = formatReminderDateLabel(selection.closureStartDate);
      const toDate = formatReminderDateLabel(selection.closureEndDate || selection.closureStartDate);
      const dayCount = getInclusiveDaysBetween(selection.closureStartDate, selection.closureEndDate || selection.closureStartDate);
      const durationLabel = dayCount > 0 ? `${dayCount} day${dayCount === 1 ? '' : 's'}` : 'a short duration';
      const closureReasonLine = selection.customNote.trim()
        ? `Reason: ${selection.customNote.trim()}\n`
        : '';

      return `Hello ${context.studentName},\n\nThis is to inform you that Suraksha Library will remain closed from ${fromDate} to ${toDate} (${durationLabel}).\n${closureReasonLine}\nPlease plan your study schedule accordingly. Library services will resume as per regular timings after this closure period.\n\nRegards,\nSuraksha Library Admin Team`;
    }

    case 'status_check':
      return `Hello ${context.studentName},\n\nWe noticed that you have not been coming to Suraksha Library for the last few days and no prior notice has been received.\n${seatLine}\nPlease confirm your current status so we can manage your seat properly:\n1. Reply *CONTINUE* if you want to continue and keep your seat.\n2. Reply *QUIT* if you do not want to continue, so we can vacate and release the seat for another student.\n\nPlease update us as soon as possible.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'cleanliness':
      return `Hello ${context.studentName},\n\nThis is a reminder from Suraksha Library regarding cleanliness and seat maintenance.\n${seatLine}\nPlease keep your seat, desk, and surrounding area clean. Avoid leaving waste, food items, or unnecessary materials on the study table.${additionalNote}\nRegards,\nSuraksha Library Admin Team`;

    case 'other':
    default:
      return `Hello ${context.studentName},\n\nThis is a reminder from Suraksha Library.\n${seatLine}${expiryLine}${selection.customNote.trim() || 'Please contact the library desk for further details.'}\n\nRegards,\nSuraksha Library Admin Team`;
  }
}

@Component({
  selector: 'app-reminder-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="reminder-dialog">
      <h2 mat-dialog-title>
        <mat-icon>chat</mat-icon>
        Select Reminder Reason
      </h2>

      <mat-dialog-content>
        <p class="info-text">
          Choose the reason for the reminder before opening WhatsApp
          <span *ngIf="data.studentName">for {{ data.studentName }}</span>.
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reminder Reason</mat-label>
          <mat-select [(ngModel)]="selectedReason" (ngModelChange)="onReasonChange()" required>
            <mat-option *ngFor="let option of reasonOptions" [value]="option.value">
              {{ option.label }}
            </mat-option>
          </mat-select>
          <mat-hint>{{ selectedOption.helper }}</mat-hint>
        </mat-form-field>

        <div class="closure-details" *ngIf="selectedReason === 'holiday_closure'">
          <p class="section-title">Closure Date Range (Maximum 3 days)</p>

          <div class="date-grid">
            <label class="date-field">
              <span>From Date</span>
              <input type="date" [(ngModel)]="closureStartDate" (ngModelChange)="onClosureStartDateChange()">
            </label>

            <label class="date-field">
              <span>To Date</span>
              <input type="date" [(ngModel)]="closureEndDate" [min]="closureStartDate || null">
            </label>
          </div>

          <div class="quick-days">
            <span>Quick select:</span>
            <button type="button" class="day-btn" [class.active]="getClosureDayCount() === 1" (click)="setClosureDuration(1)">1 Day</button>
            <button type="button" class="day-btn" [class.active]="getClosureDayCount() === 2" (click)="setClosureDuration(2)">2 Days</button>
            <button type="button" class="day-btn" [class.active]="getClosureDayCount() === 3" (click)="setClosureDuration(3)">3 Days</button>
          </div>

          <p class="closure-summary" *ngIf="closureStartDate && closureEndDate && !closureValidationError">
            Closure selected for {{ getClosureDayCount() }} day{{ getClosureDayCount() === 1 ? '' : 's' }}.
          </p>
          <p class="validation-error" *ngIf="closureValidationError">{{ closureValidationError }}</p>
        </div>

        <div class="custom-note-section" *ngIf="selectedReason === 'holiday_closure' || selectedReason === 'other'">
          <label class="note-label">
            {{ selectedReason === 'holiday_closure' ? 'Reason (optional)' : 'Custom note (optional)' }}
          </label>
          <textarea
            [(ngModel)]="customNote"
            rows="3"
            maxlength="300"
            placeholder="Example: Closed for festival / emergency."
          ></textarea>
        </div>

        <div class="alert-info">
          <mat-icon>info</mat-icon>
          <p>
            A reason-specific WhatsApp template will be generated automatically.
            You can review it in WhatsApp before sending.
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="submit()" [disabled]="!isValid()">
          <mat-icon>send</mat-icon>
          Continue
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .reminder-dialog {
      min-width: 460px;
      max-width: 560px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: #1f5aa8;
    }

    mat-dialog-content {
      padding: 20px 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .info-text {
      margin-bottom: 18px;
      padding: 12px;
      border-radius: 8px;
      background: #f3f8ff;
      color: #355074;
      font-size: 14px;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .closure-details {
      margin-top: 6px;
      margin-bottom: 14px;
      padding: 12px;
      border: 1px solid #dbe7f8;
      border-radius: 8px;
      background: #f8fbff;
    }

    .section-title {
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 600;
      color: #26486d;
    }

    .date-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .date-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #355074;
    }

    .date-field input {
      border: 1px solid #c6d7ef;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      color: #1f2f45;
      background: #fff;
    }

    .quick-days {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #466386;
    }

    .day-btn {
      border: 1px solid #9ab9e2;
      background: #fff;
      color: #214b7a;
      border-radius: 999px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 12px;
    }

    .day-btn.active {
      background: #1f5aa8;
      color: #fff;
      border-color: #1f5aa8;
    }

    .closure-summary {
      margin: 10px 0 0;
      font-size: 12px;
      color: #2e7d32;
      font-weight: 600;
    }

    .validation-error {
      margin: 10px 0 0;
      font-size: 12px;
      color: #b42318;
      font-weight: 600;
    }

    .custom-note-section {
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .note-label {
      font-size: 12px;
      font-weight: 600;
      color: #355074;
    }

    .custom-note-section textarea {
      width: 100%;
      resize: vertical;
      min-height: 80px;
      border: 1px solid #c6d7ef;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      color: #1f2f45;
      font-family: inherit;
      background: #fff;
      box-sizing: border-box;
    }

    .alert-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: #edf7f1;
      border-left: 4px solid #2e7d32;
      border-radius: 4px;
      margin-top: 12px;
    }

    .alert-info mat-icon {
      color: #2e7d32;
      font-size: 20px;
      margin-top: 2px;
    }

    .alert-info p {
      margin: 0;
      color: #225a28;
      font-size: 13px;
      line-height: 1.5;
    }

    mat-dialog-actions {
      padding: 16px 24px !important;
      gap: 12px;
    }

    button mat-icon {
      margin-right: 4px;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .reminder-dialog {
        min-width: 90vw;
        max-width: 95vw;
      }
    }

    @media (max-width: 480px) {
      .reminder-dialog {
        min-width: 95vw;
        max-width: 98vw;
      }

      .date-grid {
        grid-template-columns: 1fr;
      }

      mat-dialog-actions {
        padding: 12px !important;
        flex-direction: column;
      }

      mat-dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class ReminderReasonDialogComponent {
  reasonOptions = REMINDER_REASON_OPTIONS;
  selectedReason: ReminderReasonType = 'fee_due';
  customNote = '';
  closureStartDate = '';
  closureEndDate = '';

  constructor(
    private dialogRef: MatDialogRef<ReminderReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderReasonDialogData
  ) {}

  get selectedOption(): ReminderReasonOption {
    return this.reasonOptions.find(option => option.value === this.selectedReason) || this.reasonOptions[0];
  }

  get closureValidationError(): string {
    if (this.selectedReason !== 'holiday_closure') {
      return '';
    }

    if (!this.closureStartDate || !this.closureEndDate) {
      return '';
    }

    const dayCount = this.getClosureDayCount();
    if (dayCount <= 0) {
      return 'End date must be same as or after start date.';
    }

    if (dayCount > 3) {
      return 'Maximum closure range is 3 days.';
    }

    return '';
  }

  onReasonChange() {
    if (this.selectedReason === 'holiday_closure' && !this.closureStartDate) {
      const today = new Date();
      this.closureStartDate = this.toIsoDate(today);
      this.closureEndDate = this.closureStartDate;
      return;
    }

    if (this.selectedReason !== 'holiday_closure') {
      this.closureStartDate = '';
      this.closureEndDate = '';
    }
  }

  onClosureStartDateChange() {
    if (!this.closureStartDate) {
      this.closureEndDate = '';
      return;
    }

    if (!this.closureEndDate || this.closureEndDate < this.closureStartDate) {
      this.closureEndDate = this.closureStartDate;
    }
  }

  setClosureDuration(days: 1 | 2 | 3) {
    if (!this.closureStartDate) {
      this.closureStartDate = this.toIsoDate(new Date());
    }

    const startDate = parseIsoDate(this.closureStartDate);
    if (!startDate) {
      return;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (days - 1));
    this.closureEndDate = this.toIsoDate(endDate);
  }

  getClosureDayCount(): number {
    return getInclusiveDaysBetween(this.closureStartDate, this.closureEndDate);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isValid(): boolean {
    if (!this.selectedReason) {
      return false;
    }

    if (this.selectedReason === 'holiday_closure') {
      if (!this.closureStartDate || !this.closureEndDate) {
        return false;
      }

      return !this.closureValidationError;
    }

    return true;
  }

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    this.dialogRef.close({
      reason: this.selectedReason,
      customNote: this.customNote.trim(),
      closureStartDate: this.selectedReason === 'holiday_closure' ? this.closureStartDate : null,
      closureEndDate: this.selectedReason === 'holiday_closure' ? this.closureEndDate : null
    } satisfies ReminderReasonSelection);
  }
}