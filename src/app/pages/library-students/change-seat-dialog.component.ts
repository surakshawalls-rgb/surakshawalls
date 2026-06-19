import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LibrarySeat, LibraryStudent, LibraryService } from '../../services/library.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-seat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule
  ],
  styleUrls: ['./change-seat-dialog.component.css'],
  template: `
    <mat-card class="change-seat-dialog-card">
      <mat-card-header>
        <mat-card-title><mat-icon>event_seat</mat-icon> Change/Assign Seat</mat-card-title>
        <button mat-icon-button (click)="dialogRef.close()" style="float:right"><mat-icon>close</mat-icon></button>
      </mat-card-header>
      <mat-card-content *ngIf="student">
        <div class="student-info">
          <h4>{{ student.name }}</h4>
          <p *ngIf="currentSeatNo">Current Seat: <strong>{{ currentSeatNo }}</strong></p>
          <p *ngIf="currentShiftType">Current Shift: <strong>{{ getShiftLabel(currentShiftType) }}</strong></p>
        </div>
        <div *ngIf="!currentShiftType" class="form-group full-width">
          <label>Select Shift Type <span class="required">*</span></label>
          <mat-radio-group [(ngModel)]="selectedShiftType" (change)="onShiftTypeSelected()">
            <mat-radio-button value="full_time">Full Time</mat-radio-button>
            <mat-radio-button value="first_half">Morning</mat-radio-button>
            <mat-radio-button value="second_half">Evening</mat-radio-button>
          </mat-radio-group>
        </div>
        <div class="form-group full-width" *ngIf="currentShiftType">
          <label>Select New Seat <span class="required">*</span></label>
          <div class="available-seats-grid">
            <div *ngFor="let seat of availableSeats"
                 class="seat-option"
                 [class.selected]="newSeatNumber === seat.seat_no"
                 (click)="newSeatNumber = seat.seat_no">
              <div class="seat-option-number">{{ seat.seat_no }}</div>
              <div class="seat-option-status">Available</div>
            </div>
          </div>
          <p class="text-muted" *ngIf="availableSeats.length === 0">
            No available seats for this shift type
          </p>
        </div>
        <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="confirmChange()" [disabled]="!newSeatNumber || !currentShiftType || loading">
          Confirm Change
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .change-seat-dialog-card { max-width: 420px; margin: 0 auto; }
    .student-info { margin-bottom: 16px; }
    .available-seats-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .seat-option { border: 1px solid #ccc; border-radius: 4px; padding: 8px 16px; cursor: pointer; background: #fafafa; }
    .seat-option.selected { border: 2px solid #1976d2; background: #e3f2fd; }
    .form-group { margin-bottom: 16px; }
    mat-card-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  `]
})
export class ChangeSeatDialogComponent {
  student: LibraryStudent;
  currentSeatNo: number = 0;
  currentShiftType: 'full_time' | 'first_half' | 'second_half' | null = null;
  selectedShiftType: 'full_time' | 'first_half' | 'second_half' | null = null;
  availableSeats: LibrarySeat[] = [];
  newSeatNumber: number = 0;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<ChangeSeatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: LibraryStudent },
    private libraryService: LibraryService
  ) {
    this.student = data.student;
    this.init();
  }

  async init() {
    this.loading = true;
    const seats = await this.libraryService.getAllSeats();
    const currentSeat = seats.find((seat: LibrarySeat) =>
      seat.full_time_student_id === this.student.id ||
      seat.first_half_student_id === this.student.id ||
      seat.second_half_student_id === this.student.id
    );
    if (currentSeat) {
      this.currentSeatNo = currentSeat.seat_no;
      if (currentSeat.full_time_student_id === this.student.id) {
        this.currentShiftType = 'full_time';
      } else if (currentSeat.first_half_student_id === this.student.id) {
        this.currentShiftType = 'first_half';
      } else {
        this.currentShiftType = 'second_half';
      }
      this.selectedShiftType = this.currentShiftType;
      this.availableSeats = seats.filter((seat: LibrarySeat) => this.isSeatAvailableForShift(seat, this.currentShiftType!));
    } else {
      // No seat assigned: allow assignment, prompt for shift type
      this.currentSeatNo = 0;
      this.currentShiftType = null;
      this.selectedShiftType = null;
      this.availableSeats = [];
    }
    this.loading = false;
  }

  async onShiftTypeSelected() {
    if (!this.selectedShiftType) return;
    this.currentShiftType = this.selectedShiftType;
    this.loading = true;
    const seats = await this.libraryService.getAllSeats();
    this.availableSeats = seats.filter((seat: LibrarySeat) => this.isSeatAvailableForShift(seat, this.currentShiftType!));
    this.loading = false;
  }

  isSeatAvailableForShift(seat: LibrarySeat, shiftType: 'full_time' | 'first_half' | 'second_half'): boolean {
    if (shiftType === 'full_time') {
      return !seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id;
    } else if (shiftType === 'first_half') {
      return !seat.full_time_student_id && !seat.first_half_student_id;
    } else {
      return !seat.full_time_student_id && !seat.second_half_student_id;
    }
  }

  getShiftLabel(shiftType: 'full_time' | 'first_half' | 'second_half'): string {
    if (shiftType === 'full_time') return 'Full Time';
    if (shiftType === 'first_half') return 'Morning';
    return 'Evening';
  }

  async confirmChange() {
    if (!this.currentShiftType || !this.newSeatNumber) return;
    this.loading = true;
    // For new assignment, currentSeatNo may be 0
    const result = await this.libraryService.changeSeat(
      this.student.id!,
      this.currentSeatNo,
      this.newSeatNumber,
      this.currentShiftType,
      ''
    );
    this.loading = false;
    if (result.success) {
      this.dialogRef.close({ success: true });
    } else {
      alert(result.error || 'Failed to change seat');
    }
  }
}
