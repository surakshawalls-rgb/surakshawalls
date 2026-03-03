import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibraryService, LibraryStudent, LibraryAttendance } from '../../services/library.service';

@Component({
  selector: 'app-mark-attendance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="attendance-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <span class="header-icon">📝</span>
          <h2 mat-dialog-title>Mark My Attendance</h2>
        </div>
        <button class="close-btn" (click)="closeDialog()" mat-icon-button>
          <span class="close-icon">×</span>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Success/Error Messages -->
        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <!-- Search by Mobile Section -->
        <div *ngIf="!myAttendanceStudent" class="search-section">
          <div class="search-card">
            <div class="search-header">
              <span class="search-icon">📱</span>
              <div class="search-title">
                <h4>Enter registered mobile number</h4>
                <p class="search-subtitle">Available 7:00 AM - 7:00 PM</p>
              </div>
            </div>
            
            <div class="input-container">
              <span class="input-icon">📞</span>
              <input 
                type="tel" 
                [(ngModel)]="myAttendanceMobile"
                maxlength="10"
                placeholder="Enter your 10-digit mobile number"
                class="mobile-input"
                [disabled]="searchingStudent"
                (input)="errorMessage = ''; successMessage = ''">
            </div>
          </div>

          <button 
            mat-raised-button
            color="primary"
            class="search-btn"
            (click)="searchMyStudent()" 
            [disabled]="searchingStudent || myAttendanceMobile.length !== 10">
            <mat-spinner *ngIf="searchingStudent" diameter="20" class="btn-spinner"></mat-spinner>
            <span class="btn-icon" *ngIf="!searchingStudent">🔍</span>
            {{ searchingStudent ? 'Searching...' : 'Find My Profile' }}
          </button>

          <button 
            *ngIf="searchingStudent"
            mat-stroked-button
            color="warn"
            class="reset-btn"
            (click)="forceResetAttendanceSearch()">
            ⚠️ Reset Search (if stuck)
          </button>
        </div>

        <!-- Student Found - Mark Attendance Section -->
        <div *ngIf="myAttendanceStudent" class="attendance-section">
          <div class="student-card">
            <div class="student-header">
              <div class="student-avatar">👋</div>
              <div class="student-info">
                <h4>Welcome, {{ myAttendanceStudent.name }}!</h4>
                <div class="student-meta">
                  <span>📱 {{ myAttendanceStudent.mobile }}</span>
                  <span class="status-badge">{{ myAttendanceStudent.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Attendance Status -->
          <div *ngIf="myAttendanceStatus" class="status-card">
            <h5>
              <span class="status-icon">📊</span>
              Today's Status
            </h5>
            <div class="status-details">
              <div class="status-item">
                <span class="label">Check-in:</span>
                <span class="value">{{ myAttendanceStatus.check_in_time }}</span>
                <span *ngIf="myAttendanceStatus.status === 'late'" class="late-badge">⏰ Late</span>
                <span *ngIf="myAttendanceStatus.status === 'present'" class="ontime-badge">✅ On Time</span>
              </div>
              <div *ngIf="myAttendanceStatus.check_out_time" class="status-item">
                <span class="label">Check-out:</span>
                <span class="value">{{ myAttendanceStatus.check_out_time }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              mat-raised-button
              [color]="getButtonColor()"
              class="mark-btn"
              (click)="markMyAttendance()"
              [disabled]="isMyAttendanceButtonDisabled()">
              {{ getMyAttendanceButtonText() }}
            </button>

            <button 
              mat-icon-button
              class="refresh-btn"
              (click)="resetStudent()">
              🔄
            </button>
          </div>
          
          <div class="available-hours">
            ⏰ Available hours: 7:00 AM - 7:00 PM
          </div>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .attendance-dialog {
      min-width: 320px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -24px -24px 0 -24px;
      border-radius: 4px 4px 0 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 2rem;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .close-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .alert-success {
      background: rgba(72, 187, 120, 0.1);
      border: 1px solid rgba(72, 187, 120, 0.3);
      color: #48bb78;
    }

    .alert-error {
      background: rgba(245, 101, 101, 0.1);
      border: 1px solid rgba(245, 101, 101, 0.3);
      color: #f56565;
    }

    .search-section, .attendance-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-card, .student-card, .status-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e9ecef;
    }

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-icon, .status-icon {
      font-size: 1.5rem;
    }

    .search-title h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #2d3748;
    }

    .search-subtitle {
      margin: 4px 0 0 0;
      font-size: 0.9rem;
      color: #718096;
    }

    .input-container {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      color: #4a5568;
    }

    .mobile-input {
      width: 100%;
      padding: 14px 20px 14px 50px;
      border: 2px solid #e2e8f0;
      border-radius: 50px;
      background: white;
      color: #2d3748;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .mobile-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .mobile-input:disabled {
      background: #f7fafc;
      cursor: not-allowed;
    }

    .search-btn, .mark-btn {
      width: 100%;
      height: 48px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-spinner {
      display: inline-block;
    }

    ::ng-deep .btn-spinner circle {
      stroke: white;
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .reset-btn {
      width: 100%;
      height: 40px;
      border-radius: 50px;
      font-size: 0.9rem;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .student-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .student-info {
      flex: 1;
    }

    .student-info h4 {
      margin: 0 0 8px 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: #2d3748;
    }

    .student-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
      color: #4a5568;
      flex-wrap: wrap;
    }

    .status-badge {
      background: rgba(72, 187, 120, 0.2);
      color: #48bb78;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-card h5 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #2d3748;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status-item .label {
      color: #718096;
      font-size: 0.9rem;
    }

    .status-item .value {
      font-weight: 600;
      color: #2d3748;
    }

    .late-badge {
      background: rgba(237, 137, 54, 0.2);
      color: #ed8936;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .ontime-badge {
      background: rgba(72, 187, 120, 0.2);
      color: #48bb78;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .mark-btn {
      flex: 1;
    }

    .refresh-btn {
      width: 48px;
      height: 48px;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .available-hours {
      text-align: center;
      font-size: 0.9rem;
      color: #718096;
    }

    @media (max-width: 600px) {
      .attendance-dialog {
        min-width: 280px;
      }

      .dialog-header {
        padding: 16px 20px;
      }

      h2 {
        font-size: 1.25rem;
      }

      mat-dialog-content {
        padding: 20px;
      }

      .student-info h4 {
        font-size: 1.1rem;
      }

      .student-avatar {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }
    }
  `]
})
export class MarkAttendanceDialogComponent implements OnInit {
  myAttendanceMobile = '';
  myAttendanceStudent: LibraryStudent | null = null;
  myAttendanceStatus: LibraryAttendance | null = null;
  searchingStudent = false;
  checkingAttendance = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private dialogRef: MatDialogRef<MarkAttendanceDialogComponent>,
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize any required data
  }

  closeDialog() {
    this.dialogRef.close();
  }

  resetStudent() {
    this.myAttendanceStudent = null;
    this.myAttendanceStatus = null;
    this.myAttendanceMobile = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  async searchMyStudent() {
    if (!this.myAttendanceMobile || this.myAttendanceMobile.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      this.cdr.detectChanges();
      return;
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout - please try again')), 10000)
    );

    try {
      this.searchingStudent = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();
      
      const student = await Promise.race([
        this.libraryService.findStudentByMobile(this.myAttendanceMobile),
        timeoutPromise
      ]) as LibraryStudent | null;
      
      if (!student) {
        this.errorMessage = 'No student found with this mobile number. Please check your number or contact admin.';
        this.myAttendanceStudent = null;
        this.myAttendanceStatus = null;
      } else {
        this.myAttendanceStudent = student as LibraryStudent;
        
        try {
          this.myAttendanceStatus = await Promise.race([
            this.libraryService.getTodayAttendanceStatus((student as LibraryStudent).id),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Attendance status timeout')), 5000)
            )
          ]) as LibraryAttendance | null;
        } catch (attendanceError) {
          this.myAttendanceStatus = null;
        }
        
        this.successMessage = `Welcome ${(student as LibraryStudent).name}! You can now mark your attendance.`;
      }

      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error in searchMyStudent:', error);
      this.errorMessage = error.message || 'An error occurred while searching. Please check your connection and try again.';
      this.myAttendanceStudent = null;
      this.myAttendanceStatus = null;
      this.cdr.detectChanges();
    } finally {
      this.searchingStudent = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        if (this.searchingStudent) {
          this.searchingStudent = false;
          this.cdr.detectChanges();
        }
      }, 100);
    }
  }

  forceResetAttendanceSearch() {
    this.searchingStudent = false;
    this.resetStudent();
  }

  async markMyAttendance() {
    if (!this.myAttendanceStudent) {
      this.errorMessage = 'Please search for your student record first';
      return;
    }

    if (this.checkingAttendance) return;

    try {
      this.checkingAttendance = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();

      if (!this.myAttendanceStatus) {
        // Check in
        const result = await this.libraryService.checkInStudent(this.myAttendanceStudent.id, false);
        if (result.success) {
          this.successMessage = '✅ Checked in successfully!';
          this.myAttendanceStatus = result.attendance || null;
          
          // Close dialog after 2 seconds on success
          setTimeout(() => {
            this.dialogRef.close({ success: true, action: 'checkin', attendance: result.attendance });
          }, 2000);
        } else {
          this.errorMessage = result.error || 'Failed to check in';
        }
      } else if (!this.myAttendanceStatus.check_out_time) {
        // Check out
        const result = await this.libraryService.checkOutStudent(this.myAttendanceStudent.id, false);
        if (result.success) {
          this.successMessage = '✅ Checked out successfully!';
          this.myAttendanceStatus = await this.libraryService.getTodayAttendanceStatus(this.myAttendanceStudent.id);
          
          // Close dialog after 2 seconds on success
          setTimeout(() => {
            this.dialogRef.close({ success: true, action: 'checkout', attendance: this.myAttendanceStatus });
          }, 2000);
        } else {
          this.errorMessage = result.error || 'Failed to check out';
        }
      } else {
        this.errorMessage = 'Already checked out for today';
      }

      this.cdr.detectChanges();

    } catch (error: any) {
      this.errorMessage = error.message;
      this.cdr.detectChanges();
    } finally {
      this.checkingAttendance = false;
      this.cdr.detectChanges();
    }
  }

  getMyAttendanceButtonText(): string {
    if (!this.myAttendanceStatus) return '🟢 Check In';
    if (!this.myAttendanceStatus.check_out_time) return '🔴 Check Out';
    return '✅ Checked Out';
  }

  getButtonColor(): string {
    if (!this.myAttendanceStatus) return 'primary';
    if (!this.myAttendanceStatus.check_out_time) return 'warn';
    return '';
  }

  isMyAttendanceButtonDisabled(): boolean {
    return this.checkingAttendance || (this.myAttendanceStatus !== null && !!this.myAttendanceStatus.check_out_time);
  }
}
