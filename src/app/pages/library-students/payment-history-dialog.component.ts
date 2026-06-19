import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-payment-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatCardModule],
  template: `
    <mat-card class="payment-history-card">
      <mat-card-header>
        <mat-card-title><mat-icon>receipt_long</mat-icon> Payment History - {{ data.student?.name }}</mat-card-title>
        <button mat-icon-button (click)="dialogRef.close()" style="float:right"><mat-icon>close</mat-icon></button>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="!data.paymentHistory || data.paymentHistory.length === 0" class="empty-state">
          <p>No payment history</p>
        </div>
        <table *ngIf="data.paymentHistory && data.paymentHistory.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Seat</th>
              <th>Shift</th>
              <th>Amount</th>
              <th>Valid From</th>
              <th>Valid Until</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of data.paymentHistory">
              <td>{{ payment.date | date:'dd/MM/yyyy' }}</td>
              <td>{{ payment.seat_no }}</td>
              <td>{{ payment.shift }}</td>
              <td>{{ payment.amount | currency:'INR' }}</td>
              <td>{{ payment.valid_from | date:'dd/MM/yyyy' }}</td>
              <td>{{ payment.valid_until | date:'dd/MM/yyyy' }}</td>
            </tr>
          </tbody>
        </table>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-button (click)="dialogRef.close()">Close</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .payment-history-card { max-width: 600px; margin: 0 auto; }
    .empty-state { text-align: center; margin: 24px 0; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .data-table th, .data-table td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; }
    mat-card-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  `]
})
export class PaymentHistoryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: any, paymentHistory: any[] }
  ) {}
}
