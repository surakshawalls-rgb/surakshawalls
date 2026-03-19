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
          <mat-select [(ngModel)]="selectedReason" required>
            <mat-option *ngFor="let option of reasonOptions" [value]="option.value">
              {{ option.label }}
            </mat-option>
          </mat-select>
          <mat-hint>{{ selectedOption.helper }}</mat-hint>
        </mat-form-field>

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

  constructor(
    private dialogRef: MatDialogRef<ReminderReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderReasonDialogData
  ) {}

  get selectedOption(): ReminderReasonOption {
    return this.reasonOptions.find(option => option.value === this.selectedReason) || this.reasonOptions[0];
  }

  isValid(): boolean {
    return !!this.selectedReason;
  }

  cancel() {
    this.dialogRef.close();
  }

  submit() {
    this.dialogRef.close({
      reason: this.selectedReason,
      customNote: ''
    } satisfies ReminderReasonSelection);
  }
}