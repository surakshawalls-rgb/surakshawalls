import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { LibraryStudent } from '../../services/library.service';

@Component({
  selector: 'app-edit-student-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  template: `
    <mat-card class="edit-student-card">
      <mat-card-header>
        <mat-card-title><mat-icon>edit</mat-icon> Edit Student</mat-card-title>
        <button mat-icon-button (click)="dialogRef.close()" style="float:right"><mat-icon>close</mat-icon></button>
      </mat-card-header>
      <div class="edit-student-content-wrapper">
        <mat-card-content *ngIf="student">
          <form (ngSubmit)="save()" autocomplete="off">
            <div class="mat-dialog-form responsive-grid">
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Full Name</mat-label>
                <input matInput type="text" [(ngModel)]="student.name" name="name" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Mobile</mat-label>
                <input matInput type="tel" [(ngModel)]="student.mobile" name="mobile" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Emergency Contact</mat-label>
                <input matInput type="tel" [(ngModel)]="student.emergency_contact" name="emergency_contact">
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Emergency Contact Name</mat-label>
                <input matInput type="text" [(ngModel)]="student.emergency_contact_name" name="emergency_contact_name">
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item address-item">
                <mat-label>Address</mat-label>
                <textarea matInput [(ngModel)]="student.address" name="address" rows="2"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="dobPicker" [(ngModel)]="student.dob" name="dob">
                <mat-datepicker-toggle matSuffix [for]="dobPicker"></mat-datepicker-toggle>
                <mat-datepicker #dobPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Gender</mat-label>
                <mat-select [(ngModel)]="student.gender" name="gender">
                  <mat-option value="Male">Male</mat-option>
                  <mat-option value="Female">Female</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Joining Date</mat-label>
                <input matInput [matDatepicker]="joiningPicker" [(ngModel)]="student.joining_date" name="joining_date">
                <mat-datepicker-toggle matSuffix [for]="joiningPicker"></mat-datepicker-toggle>
                <mat-datepicker #joiningPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="student.status" name="status">
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                  <mat-option value="suspended">Suspended</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="grid-item notes-item">
                <mat-label>Notes</mat-label>
                <textarea matInput [(ngModel)]="student.notes" name="notes" rows="2"></textarea>
              </mat-form-field>
            </div>
            <div class="sticky-actions">
              <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
              <button mat-raised-button color="primary" type="submit"><mat-icon>save</mat-icon> Update</button>
            </div>
          </form>
        </mat-card-content>
      </div>
    </mat-card>
  `,
  styles: [`
    .edit-student-card { max-width: 600px; margin: 0 auto; }
    .edit-student-content-wrapper {
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      padding-bottom: 72px;
    }
    .mat-dialog-form.responsive-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-item { width: 100%; }
    .address-item, .notes-item { grid-column: span 2; }
    @media (max-width: 600px) {
      .mat-dialog-form.responsive-grid {
        grid-template-columns: 1fr;
      }
      .address-item, .notes-item { grid-column: span 1; }
    }
    .sticky-actions {
      position: sticky;
      bottom: 0;
      left: 0;
      width: 100%;
      background: #fff;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
      z-index: 2;
      border-top: 1px solid #eee;
    }
  `]
})
export class EditStudentDialogComponent {
  student: LibraryStudent;
  constructor(
    public dialogRef: MatDialogRef<EditStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LibraryStudent
  ) {
    this.student = { ...data };
  }

  save() {
    this.dialogRef.close({ action: 'save', student: this.student });
  }
}
