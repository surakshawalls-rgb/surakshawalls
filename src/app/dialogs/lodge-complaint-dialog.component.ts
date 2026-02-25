import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LibraryService } from '../services/library.service';

@Component({
  selector: 'app-lodge-complaint-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="complaint-dialog">
      <h2 mat-dialog-title>
        <mat-icon>report_problem</mat-icon>
        Lodge Complaint
      </h2>
      
      <mat-dialog-content>
        <p class="info-text">
          Report disturbances or rule violations anonymously. 
          Only admin will be able to see this complaint.
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Seat Number (Against)</mat-label>
          <input matInput type="number" [(ngModel)]="seatNo" placeholder="Enter seat number" required min="1">
          <mat-icon matPrefix>event_seat</mat-icon>
          <mat-hint>Which seat is causing disturbance?</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Complaint Type</mat-label>
          <mat-select [(ngModel)]="complaintType" required>
            <mat-option value="Making Noise">🔊 Making Noise</mat-option>
            <mat-option value="Talking on Phone">📱 Talking on Phone</mat-option>
            <mat-option value="Disturbing Others">😤 Disturbing Others</mat-option>
            <mat-option value="Not Following Rules">⚠️ Not Following Rules</mat-option>
            <mat-option value="Inappropriate Behavior">🚫 Inappropriate Behavior</mat-option>
            <mat-option value="Other">❓ Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="description" rows="4" 
                    placeholder="Describe the issue in detail..." required></textarea>
          <mat-hint>Be specific about the disturbance</mat-hint>
        </mat-form-field>

        <div class="optional-section">
          <p class="section-label">Optional (if you want to identify yourself):</p>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Name (Optional)</mat-label>
            <input matInput [(ngModel)]="lodgedByName" placeholder="Leave blank for anonymous">
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Seat Number (Optional)</mat-label>
            <input matInput type="number" [(ngModel)]="lodgedBySeatNo" placeholder="Your seat number">
            <mat-icon matPrefix>event_seat</mat-icon>
          </mat-form-field>
        </div>

        <div class="alert-info">
          <mat-icon>info</mat-icon>
          <p>
            Your complaint will be reviewed by library admin. 
            Appropriate action will be taken to maintain a peaceful study environment.
          </p>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          <mat-icon>error</mat-icon>
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message">
          <mat-icon>check_circle</mat-icon>
          {{ successMessage }}
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="submitting">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="warn" (click)="onSubmit()" 
                [disabled]="!isValid() || submitting">
          <mat-icon>send</mat-icon>
          {{ submitting ? 'Submitting...' : 'Lodge Complaint' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .complaint-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #d32f2f;
    }

    mat-dialog-content {
      padding: 20px 24px !important;
    }

    .info-text {
      color: #666;
      margin-bottom: 20px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .optional-section {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }

    .section-label {
      font-weight: 500;
      color: #666;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .alert-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
      margin-top: 20px;
    }

    .alert-info mat-icon {
      color: #2196f3;
      font-size: 20px;
      margin-top: 2px;
    }

    .alert-info p {
      margin: 0;
      font-size: 13px;
      color: #1976d2;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      border-left: 4px solid #f44336;
      color: #c62828;
      margin-top: 16px;
      border-radius: 4px;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      color: #2e7d32;
      margin-top: 16px;
      border-radius: 4px;
    }

    mat-dialog-actions {
      padding: 16px 24px !important;
      gap: 12px;
    }

    button mat-icon {
      margin-right: 4px;
      font-size: 18px;
    }
  `]
})
export class LodgeComplaintDialogComponent {
  seatNo: number | null = null;
  complaintType: string = '';
  description: string = '';
  lodgedByName: string = '';
  lodgedBySeatNo: number | null = null;
  
  errorMessage: string = '';
  successMessage: string = '';
  submitting: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<LodgeComplaintDialogComponent>,
    private libraryService: LibraryService
  ) {}

  isValid(): boolean {
    return !!(this.seatNo && this.seatNo > 0 && this.complaintType && this.description.trim());
  }

  async onSubmit() {
    if (!this.isValid()) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const complaintData = {
      complaint_against_seat_no: this.seatNo!,
      complaint_type: this.complaintType,
      description: this.description.trim(),
      lodged_by_name: this.lodgedByName.trim() || undefined,
      lodged_by_seat_no: this.lodgedBySeatNo || undefined
    };

    const result = await this.libraryService.lodgeComplaint(complaintData);

    if (result.success) {
      this.successMessage = 'Complaint lodged successfully! Admin will review it.';
      setTimeout(() => {
        this.dialogRef.close(true);
      }, 2000);
    } else {
      this.errorMessage = result.error || 'Failed to lodge complaint';
      this.submitting = false;
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
