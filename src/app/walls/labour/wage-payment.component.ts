// wage-payment.component.ts - Wage Payment Entry Form
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

interface Worker {
  id: number;
  name: string;
  cumulative_balance: number;
}

@Component({
  selector: 'app-wage-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-container">
      <div class="payment-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>💵 Wage Payment</h1>
      </div>

      <form [formGroup]="wageForm" (ngSubmit)="onSubmit()">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Payment Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Worker</mat-label>
                <mat-select formControlName="worker_id" required (selectionChange)="onWorkerChange()">
                  <mat-option *ngFor="let worker of workers" [value]="worker.id">
                    {{ worker.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Worker Balance Info -->
            <div *ngIf="selectedWorker" class="balance-info">
              <mat-icon>info</mat-icon>
              <div>
                <strong>Current Balance:</strong>
                <span class="balance" [class.positive]="selectedWorker.cumulative_balance > 0">
                  ₹{{ selectedWorker.cumulative_balance.toLocaleString() }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Wage Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Wage Type</mat-label>
                <mat-select formControlName="wage_type" required>
                  <mat-option value="daily">Daily Wage</mat-option>
                  <mat-option value="weekly">Weekly Wage</mat-option>
                  <mat-option value="monthly">Monthly Salary</mat-option>
                  <mat-option value="piece_rate">Piece Rate</mat-option>
                  <mat-option value="overtime">Overtime</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Work Done Value</mat-label>
                <input matInput type="number" formControlName="work_done" required min="0">
                <span matPrefix>₹</span>
                <mat-hint>Value of work completed</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Amount Paid Today</mat-label>
                <input matInput type="number" formControlName="paid_today" required min="0">
                <span matPrefix>₹</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="payment_method" required>
                  <mat-option value="cash">Cash</mat-option>
                  <mat-option value="bank">Bank Transfer</mat-option>
                  <mat-option value="upi">UPI</mat-option>
                  <mat-option value="cheque">Cheque</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Calculation Summary -->
            <div class="calculation-summary">
              <div class="calc-row">
                <span>Work Done:</span>
                <span>₹{{ wageForm.get('work_done')?.value || 0 }}</span>
              </div>
              <div class="calc-row">
                <span>Paid Today:</span>
                <span class="negative">-₹{{ wageForm.get('paid_today')?.value || 0 }}</span>
              </div>
              <div class="calc-row total">
                <span>Balance Change:</span>
                <span [class.positive]="getBalanceChange() > 0" [class.negative]="getBalanceChange() < 0">
                  {{ getBalanceChange() >= 0 ? '+' : '' }}₹{{ getBalanceChange() }}
                </span>
              </div>
              <div class="calc-row final" *ngIf="selectedWorker">
                <span>New Balance:</span>
                <span [class.positive]="getNewBalance() > 0">
                  ₹{{ getNewBalance().toLocaleString() }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Additional Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Remarks</mat-label>
              <textarea matInput formControlName="remarks" rows="2"></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <div class="action-buttons">
          <button mat-raised-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || !wageForm.valid">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Save Payment</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .payment-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .payment-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .payment-header h1 {
      margin: 0;
      color: #1F2937;
    }

    .form-card {
      margin-bottom: 1.5rem;
    }

    .form-card mat-card-header {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .balance-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #EFF6FF;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .balance-info mat-icon {
      color: #2563EB;
    }

    .balance-info strong {
      margin-right: 0.5rem;
    }

    .balance-info .balance {
      font-size: 1.25rem;
      font-weight: bold;
      color: #DC2626;
    }

    .balance-info .balance.positive {
      color: #DC2626;
    }

    .calculation-summary {
      background: #F9FAFB;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #E5E7EB;
    }

    .calc-row:last-child {
      border-bottom: none;
    }

    .calc-row.total {
      font-weight: 600;
      padding-top: 1rem;
      border-top: 2px solid #D1D5DB;
    }

    .calc-row.final {
      font-size: 1.125rem;
      font-weight: bold;
      color: #1F2937;
      background: #EFF6FF;
      margin: 1rem -1rem -1rem -1rem;
      padding: 1rem;
      border-radius: 0 0 8px 8px;
    }

    .positive {
      color: #DC2626;
    }

    .negative {
      color: #059669;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .payment-container {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WagePaymentComponent implements OnInit {
  wageForm: FormGroup;
  loading = false;
  workers: Worker[] = [];
  selectedWorker: Worker | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabase: SupabaseService,
    private snackBar: MatSnackBar
  ) {
    this.wageForm = this.fb.group({
      date: [new Date(), Validators.required],
      worker_id: ['', Validators.required],
      wage_type: ['daily', Validators.required],
      work_done: [0, [Validators.required, Validators.min(0)]],
      paid_today: [0, [Validators.required, Validators.min(0)]],
      payment_method: ['cash', Validators.required],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadWorkers();
  }

  async loadWorkers(): Promise<void> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('workers_master')
        .select('id, name, cumulative_balance')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      if (data) {
        this.workers = data;
      }
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  }

  onWorkerChange(): void {
    const workerId = this.wageForm.get('worker_id')?.value;
    this.selectedWorker = this.workers.find(w => w.id === workerId) || null;
  }

  getBalanceChange(): number {
    const workDone = this.wageForm.get('work_done')?.value || 0;
    const paidToday = this.wageForm.get('paid_today')?.value || 0;
    return workDone - paidToday;
  }

  getNewBalance(): number {
    if (!this.selectedWorker) return 0;
    return this.selectedWorker.cumulative_balance + this.getBalanceChange();
  }

  async onSubmit(): Promise<void> {
    if (this.wageForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.wageForm.value;

      // Insert wage entry
      const { error: wageError } = await this.supabase.supabase
        .from('wage_entries')
        .insert({
          date: formValue.date.toISOString().split('T')[0],
          worker_id: formValue.worker_id,
          wage_type: formValue.wage_type,
          work_done: formValue.work_done,
          paid_today: formValue.paid_today,
          payment_method: formValue.payment_method,
          remarks: formValue.remarks
        });

      if (wageError) throw wageError;

      this.snackBar.open('Wage payment recorded successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/walls/labour']);
    } catch (error) {
      console.error('Error saving wage payment:', error);
      this.snackBar.open('Error saving wage payment', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/walls/labour']);
  }
}
