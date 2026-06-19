import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { LibraryStudent } from '../../services/library.service';

@Component({
  selector: 'app-student-profile-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, MatCardModule],
  template: `
    <mat-card class="profile-card">
      <mat-card-header>
        <div mat-card-avatar class="profile-photo-section">
          <img *ngIf="data.photo_url" [src]="data.photo_url" alt="Student Photo" class="profile-photo-large">
          <div *ngIf="!data.photo_url" class="no-photo-large"><mat-icon>photo_camera</mat-icon></div>
        </div>
        <mat-card-title>{{ data.name }}</mat-card-title>
        <mat-card-subtitle>{{ data.mobile }}</mat-card-subtitle>
        <button mat-icon-button (click)="dialogRef.close()" style="float:right"><mat-icon>close</mat-icon></button>
      </mat-card-header>
      <mat-card-content>
        <div class="info-grid">
          <div class="info-item"><strong>Seat:</strong> {{ seatInfo }}</div>
          <div class="info-item"><strong>Status:</strong> {{ data.status }}</div>
          <div class="info-item"><strong>Gender:</strong> {{ data.gender }}</div>
          <div class="info-item"><strong>Joining Date:</strong> {{ data.joining_date }}</div>
          <div class="info-item"><strong>DOB:</strong> {{ data.dob || 'N/A' }}</div>
          <div class="info-item"><strong>Address:</strong> {{ data.address }}</div>
          <div class="info-item"><strong>Emergency Contact:</strong> {{ data.emergency_contact }}</div>
          <div class="info-item"><strong>Emergency Name:</strong> {{ data.emergency_contact_name || 'N/A' }}</div>
          <div class="info-item"><strong>Registration Fee:</strong> {{ data.registration_fee_paid }}</div>
          <div class="info-item full-width" *ngIf="data.notes"><strong>Notes:</strong> {{ data.notes }}</div>
        </div>
      </mat-card-content>
      <mat-card-actions align="end" class="profile-actions">
        <button mat-raised-button color="primary" (click)="assignOrChangeSeat()">
          <mat-icon>event_seat</mat-icon> {{ seatInfo === '-' ? 'Assign Seat' : 'Change Seat' }}
        </button>
        <button mat-raised-button color="accent" (click)="openPaymentHistory()">
          <mat-icon>receipt_long</mat-icon> Payment History
        </button>
        <button mat-raised-button color="warn" (click)="openEditStudent()">
          <mat-icon>edit</mat-icon> Edit Student
        </button>
        <button mat-button mat-dialog-close>Close</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .profile-card { max-width: 480px; margin: 0 auto; }
    .profile-photo-section { display: flex; flex-direction: column; align-items: center; }
    .profile-photo-large, .no-photo-large { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 2px solid #dce0e4; display: flex; align-items: center; justify-content: center; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 12px 32px; margin-top: 16px; }
    .info-item { min-width: 180px; }
    .full-width { flex-basis: 100%; }
    .profile-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  `]
})
export class StudentProfileDialogComponent {
  seatInfo = '-';
  constructor(
    public dialogRef: MatDialogRef<StudentProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LibraryStudent
  ) {}

  ngOnInit() {
    // Assume seat info is passed in data or fetch from service if needed
    this.seatInfo = (this.data as any).seatInfo || '-';
  }

  assignOrChangeSeat() {
    // Emit or call parent to open seat assignment dialog
    this.dialogRef.close({ action: 'assignSeat', student: this.data });
  }

  openPaymentHistory() {
    this.dialogRef.close({ action: 'paymentHistory', student: this.data });
  }

  openEditStudent() {
    this.dialogRef.close({ action: 'editStudent', student: this.data });
  }
}
