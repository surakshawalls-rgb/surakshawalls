import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibrarySeat } from '../../services/library.service';

export interface RegistrationDialogData {
  seat: LibrarySeat;
  canViewPersonalDetails: boolean;
}

export interface RegistrationResult {
  name: string;
  mobile: string;
  emergency_contact: string;
  emergency_contact_name: string;
  address: string;
  dob: Date | null;
  gender: 'Male' | 'Female';
  startDate: Date;
  endDate: Date;
  registration_fee_paid: number;
  notes: string;
  selectedShift: 'full_time' | 'first_half' | 'second_half';
  feeAmount: number;
  paymentMode: 'cash' | 'upi' | 'card';
}

@Component({
  selector: 'app-registration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>Register Student - Seat {{ data.seat.seat_no }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="registrationForm" class="registration-form">
        <mat-form-field appearance="outline">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter full name" required>
          <mat-error *ngIf="registrationForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="data.canViewPersonalDetails">
          <mat-label>Mobile Number</mat-label>
          <input matInput formControlName="mobile" type="tel" maxlength="10" placeholder="10-digit mobile" required>
          <mat-error *ngIf="registrationForm.get('mobile')?.hasError('required')">
            Mobile number is required
          </mat-error>
          <mat-error *ngIf="registrationForm.get('mobile')?.hasError('pattern')">
            Must be exactly 10 digits
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="data.canViewPersonalDetails">
          <mat-label>Emergency Contact</mat-label>
          <input matInput formControlName="emergency_contact" type="tel" maxlength="10" placeholder="10-digit mobile">
          <mat-error *ngIf="registrationForm.get('emergency_contact')?.hasError('pattern')">
            Must be exactly 10 digits
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="data.canViewPersonalDetails">
          <mat-label>Emergency Contact Name</mat-label>
          <input matInput formControlName="emergency_contact_name" placeholder="Parent/Guardian name">
        </mat-form-field>

        <div class="form-group">
          <mat-form-field class="example-form-field" appearance="outline" style="width: 100%;">
            <mat-label>Choose a date</mat-label>
            <input matInput [matDatepicker]="datepicker" formControlName="dob" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="datepicker"></mat-datepicker-toggle>
            <mat-datepicker #datepicker>
              <mat-datepicker-actions>
                <button matButton matDatepickerCancel>Cancel</button>
                <button matButton="elevated" matDatepickerApply>Apply</button>
              </mat-datepicker-actions>
            </mat-datepicker>
            <mat-error *ngIf="registrationForm.get('dob')?.invalid && registrationForm.get('dob')?.touched">
              Date of Birth is required
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Professional Toggle Button Section -->
        <div class="toggle-section">
          <div class="toggle-row">
            <label class="group-label">Gender</label>
            <mat-button-toggle-group formControlName="gender" class="toggle-group">
              <mat-button-toggle value="Male">Male</mat-button-toggle>
              <mat-button-toggle value="Female">Female</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>
        <!-- End of Professional Toggle Button Section -->

        <div class="form-group full-width date-range">

          <mat-form-field class="example-form-field" appearance="outline" style="width: 100%;">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" placeholder="Start date" (dateChange)="onStartDateChange($event)" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
            <mat-error *ngIf="registrationForm.get('startDate')?.invalid && registrationForm.get('startDate')?.touched">
              Start date is required
            </mat-error>
          </mat-form-field>
          <mat-form-field class="example-form-field" appearance="outline" style="width: 100%;">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" placeholder="End date" />
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
            <mat-error *ngIf="registrationForm.get('endDate')?.invalid && registrationForm.get('endDate')?.touched">
              End date is required
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Registration Fee</mat-label>
          <input matInput type="number" formControlName="registration_fee_paid" placeholder="Enter amount">
        </mat-form-field>

        <div class="form-group full-width">
          <label class="group-label">Shift Type</label>
          <mat-button-toggle-group formControlName="selectedShift" (change)="onShiftChange()" class="full-width-toggle">
            <mat-button-toggle value="full_time" *ngIf="isShiftAvailable('full_time')">Full Day</mat-button-toggle>
            <mat-button-toggle value="first_half" *ngIf="isShiftAvailable('first_half')">Morning</mat-button-toggle>
            <mat-button-toggle value="second_half" *ngIf="isShiftAvailable('second_half')">Evening</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline" class="readonly-field">
          <mat-label>Fee Amount</mat-label>
          <input matInput type="number" formControlName="feeAmount" readonly>
        </mat-form-field>

        <div class="form-group">
          <label class="group-label">Payment Mode</label>
          <mat-button-toggle-group formControlName="paymentMode" class="full-width-toggle">
            <mat-button-toggle value="cash">Cash</mat-button-toggle>
            <mat-button-toggle value="upi">UPI</mat-button-toggle>
            <mat-button-toggle value="card">Card</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline" class="full-width" *ngIf="data.canViewPersonalDetails">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="1" placeholder="Full address" required autoCapitalize="off" spellcheck="true"></textarea>
          <mat-error *ngIf="registrationForm.get('address')?.hasError('required')">
            Address is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="1" placeholder="Any additional notes" autoCapitalize="off" spellcheck="true"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!registrationForm.valid || saving">
        <mat-spinner diameter="20" *ngIf="saving" style="display: inline-block; margin-right: 8px;"></mat-spinner>
        {{ saving ? 'Saving...' : 'Register Student' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .registration-form {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      padding: 14px 0;
      min-width: 600px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .date-range {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .group-label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    mat-button-toggle-group {
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 4px;
    }

    .full-width-toggle {
      width: 100%;
      display: flex;
    }

    .full-width-toggle mat-button-toggle {
      flex: 1;
    }

    ::ng-deep .mat-button-toggle-checked {
      background-color: #3f51b5 !important;
      color: white !important;
    }

    ::ng-deep .mat-button-toggle-label-content {
      line-height: 36px !important;
      padding: 0 12px !important;
    }

    .readonly-field input {
      cursor: default;
      color: rgba(0, 0, 0, 0.87);
    }

    .readonly-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: #fafafa;
    }

    .readonly-field ::ng-deep .mat-mdc-form-field-focus-overlay {
      display: none;
    }

    mat-form-field {
      width: 100%;
    }

    input[readonly] {
      cursor: pointer !important;
      user-select: none;
    }

    ::ng-deep input[readonly]:focus {
      cursor: pointer !important;
    }

    ::ng-deep .mat-date-range-input-container {
      cursor: pointer;
    }

    ::ng-deep .mat-mdc-form-field {
      margin-bottom: 0 !important;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      padding-bottom: 0 !important;
    }

    mat-dialog-content {
      overflow-y: auto;
      max-height: 60vh;
      padding: 16px 20px;
    }

    mat-dialog-title {
      padding: 12px 20px;
      margin: 0;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-size: 18px;
      flex-shrink: 0;
    }

    mat-dialog-actions {
      padding: 12px 20px;
      border-top: 1px solid #e0e0e0;
      background: #f9f9f9;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      flex-shrink: 0;
      margin-top: auto;
    }

    button[mat-button] {
      min-width: 80px;
    }

    button[mat-raised-button] {
      min-width: 140px;
    }

    ::ng-deep .mat-mdc-dialog-container {
      --mdc-dialog-container-color: white;
      display: flex !important;
      flex-direction: column !important;
      max-height: 90vh !important;
    }

    ::ng-deep .mat-mdc-dialog-surface {
      display: flex !important;
      flex-direction: column !important;
    }

    ::ng-deep .mat-mdc-dialog-content {
      flex-grow: 1;
      overflow-y: auto;
    }

    ::ng-deep .mat-mdc-dialog-actions {
      flex-shrink: 0 !important;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 12px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
      border: 2px solid #1976d2 !important;
      box-shadow: 0 8px 32px rgba(25, 118, 210, 0.08);
    }

    ::ng-deep .mat-mdc-form-field {
      background-color: white;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: white !important;
    }
  `]
})
export class RegistrationDialogComponent implements OnInit {
      onStartDateChange(event: any): void {
        const start: Date = event.value;
        if (start && (!this.registrationForm.get('endDate')?.value || this.registrationForm.get('endDate')?.pristine)) {
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(end.getDate() - 1);
          this.registrationForm.get('endDate')?.setValue(end);
        }
      }
    // Removed flatpickr instances
  registrationForm!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RegistrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistrationDialogData
  ) {}

  ngOnInit() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);

    // Determine default shift based on seat availability
    let defaultShift = 'full_time';
    const seat = this.data.seat;
    
    if (!seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id) {
      defaultShift = 'full_time';
    } else if (seat.first_half_student_id && !seat.second_half_student_id) {
      defaultShift = 'second_half';
    } else if (seat.second_half_student_id && !seat.first_half_student_id) {
      defaultShift = 'first_half';
    }

    this.registrationForm = this.fb.group({
      name: ['', Validators.required],
      mobile: [
        this.data.canViewPersonalDetails ? '' : 'N/A', 
        this.data.canViewPersonalDetails ? [Validators.required, Validators.pattern(/^[0-9]{10}$/)] : []
      ],
      emergency_contact: ['', (control: any) => {
        const value = control.value;
        if (!value || value.trim() === '') {
          return null; // No validation if empty
        }
        return /^[0-9]{10}$/.test(value) ? null : { pattern: true };
      }],
      emergency_contact_name: [''],
      address: [this.data.canViewPersonalDetails ? '' : 'N/A', this.data.canViewPersonalDetails ? Validators.required : []],
      dob: [null],
      gender: ['Male'],
      startDate: [today, Validators.required],
      endDate: [endDate, Validators.required],
      registration_fee_paid: [0],
      notes: [''],
      selectedShift: [defaultShift],
      feeAmount: [defaultShift === 'full_time' ? 400 : 250],
      paymentMode: ['cash']
    });

    // Flatpickr removed. Will use Angular Material pickers.

    // Auto-adjust end date when start date changes
    this.registrationForm.get('startDate')?.valueChanges.subscribe(startDate => {
      if (startDate && startDate instanceof Date) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        this.registrationForm.patchValue({ endDate }, { emitEvent: false });
      }
    });
  }

  onDateRangeChange() {
    const startDate = this.registrationForm.get('startDate')?.value;
    if (startDate && startDate instanceof Date) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      this.registrationForm.patchValue({ endDate }, { emitEvent: false });
    }
  }

  onShiftChange() {
    const shift = this.registrationForm.get('selectedShift')?.value;
    const feeMap: { [key: string]: number } = {
      'full_time': 400,
      'first_half': 250,
      'second_half': 250
    };
    this.registrationForm.patchValue({ feeAmount: feeMap[shift] || 400 });
  }

  isShiftAvailable(shift: 'full_time' | 'first_half' | 'second_half'): boolean {
    const seat = this.data.seat;
    
    if (shift === 'full_time') {
      return !seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id;
    } else if (shift === 'first_half') {
      return !seat.full_time_student_id && !seat.first_half_student_id;
    } else if (shift === 'second_half') {
      return !seat.full_time_student_id && !seat.second_half_student_id;
    }
    
    return false;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      this.dialogRef.close(this.registrationForm.value);
    }
  }
}
