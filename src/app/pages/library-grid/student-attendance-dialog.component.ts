import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LibraryService, LibraryStudent, LibraryAttendance } from '../../services/library.service';

@Component({
  selector: 'app-student-attendance-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="attendance-dialog">
      <h2 mat-dialog-title>📊 Monthly Attendance Report</h2>
      
      <mat-dialog-content>
        <div class="student-info">
          <h3>{{ student.name }}</h3>
          <p>Mobile: {{ student.mobile }}</p>
        </div>

        <div class="month-selector">
          <label>Select Month:</label>
          <select [(ngModel)]="selectedMonth" (change)="loadAttendance()">
            <option *ngFor="let month of months" [value]="month.value">
              {{ month.label }}
            </option>
          </select>
          
          <label>Year:</label>
          <select [(ngModel)]="selectedYear" (change)="loadAttendance()">
            <option *ngFor="let year of years" [value]="year">{{ year }}</option>
          </select>
        </div>

        <div *ngIf="loading" class="loading">Loading attendance records...</div>

        <div *ngIf="!loading && attendanceRecords.length === 0" class="no-data">
          No attendance records found for {{ getMonthName() }} {{ selectedYear }}.
        </div>

        <div *ngIf="!loading && attendanceRecords.length > 0" class="attendance-table">
          <div class="stats">
            <div class="stat-card">
              <span class="stat-label">Total Days Present</span>
              <span class="stat-value">{{ attendanceRecords.length }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">On Time</span>
              <span class="stat-value">{{ getOnTimeCount() }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Late Arrivals</span>
              <span class="stat-value">{{ getLateCount() }}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of attendanceRecords" [class.late]="record.status === 'late'">
                <td>{{ formatDate(record.date) }}</td>
                <td>{{ getDayName(record.date) }}</td>
                <td>{{ record.check_in_time }}</td>
                <td>{{ record.check_out_time || '-' }}</td>
                <td>{{ calculateDuration(record) }}</td>
                <td>
                  <span [class]="'status-badge ' + record.status">
                    {{ record.status === 'late' ? '⏰ Late' : '✓ On Time' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="download-section" *ngIf="!loading && attendanceRecords.length > 0">
          <button class="btn-download" (click)="downloadCSV()">📥 Download CSV</button>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .attendance-dialog {
      width: 100%;
      max-width: 800px;
    }

    h2[mat-dialog-title] {
      font-size: 1.25rem;
      margin: 0;
      padding: 16px;
    }

    mat-dialog-content {
      padding: 0 16px 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .student-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .student-info h3 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 1rem;
    }

    .student-info p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .month-selector {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .month-selector label {
      font-weight: 500;
      color: #555;
      font-size: 0.875rem;
    }

    .month-selector select {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.875rem;
      flex: 1;
      min-width: 100px;
    }

    .loading, .no-data {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 0.875rem;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .attendance-table {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      min-width: 600px;
    }

    thead {
      background: #f8f9fa;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #dee2e6;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    td {
      padding: 8px;
      border-bottom: 1px solid #eee;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    tr:hover {
      background: #f8f9fa;
    }

    tr.late {
      background: #fff3cd;
    }

    .status-badge {
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-badge.present {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.late {
      background: #fff3cd;
      color: #856404;
    }

    .download-section {
      text-align: center;
      padding: 16px 0;
    }

    .btn-download {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      width: 100%;
      max-width: 300px;
    }

    .btn-download:hover {
      background: #218838;
    }

    mat-dialog-actions {
      justify-content: flex-end;
      padding: 12px 16px;
    }

    mat-dialog-actions button {
      font-size: 0.875rem;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .attendance-dialog {
        max-width: 100vw;
        margin: 0;
      }

      h2[mat-dialog-title] {
        font-size: 1.125rem;
        padding: 12px;
      }

      mat-dialog-content {
        padding: 0 12px 12px;
        max-height: 60vh;
      }

      .student-info {
        padding: 10px;
        margin-bottom: 12px;
      }

      .student-info h3 {
        font-size: 0.9375rem;
      }

      .student-info p {
        font-size: 0.8125rem;
      }

      .month-selector {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        padding: 10px;
        margin-bottom: 12px;
      }

      .month-selector label {
        font-size: 0.8125rem;
      }

      .month-selector select {
        width: 100%;
        padding: 8px;
        font-size: 0.875rem;
      }

      .stats {
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .stat-card {
        padding: 10px;
      }

      .stat-label {
        font-size: 0.6875rem;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .loading, .no-data {
        padding: 20px;
        font-size: 0.8125rem;
      }

      table {
        min-width: 550px;
        font-size: 0.8125rem;
      }

      th, td {
        padding: 6px 4px;
        font-size: 0.75rem;
      }

      .status-badge {
        font-size: 0.6875rem;
        padding: 2px 4px;
      }

      .download-section {
        padding: 12px 0;
      }

      .btn-download {
        width: 100%;
        max-width: 100%;
        padding: 10px 12px;
        font-size: 0.875rem;
      }

      mat-dialog-actions {
        padding: 10px 12px;
      }

      mat-dialog-actions button {
        font-size: 0.8125rem;
      }
    }

    @media (max-width: 480px) {
      h2[mat-dialog-title] {
        font-size: 1rem;
        padding: 10px;
      }

      .stat-value {
        font-size: 1.125rem;
      }
    }
  `]
})
export class StudentAttendanceDialogComponent implements OnInit {
  student: LibraryStudent;
  attendanceRecords: LibraryAttendance[] = [];
  loading = false;
  
  selectedMonth: number;
  selectedYear: number;
  
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  years: number[] = [];

  constructor(
    private dialogRef: MatDialogRef<StudentAttendanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: LibraryStudent },
    private libraryService: LibraryService
  ) {
    this.student = data.student;
    
    // Default to current month/year
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    
    // Generate years (current year and 2 years back)
    for (let i = 0; i < 3; i++) {
      this.years.push(this.selectedYear - i);
    }
  }

  ngOnInit() {
    this.loadAttendance();
  }

  async loadAttendance() {
    this.loading = true;
    try {
      this.attendanceRecords = await this.libraryService.getStudentMonthlyAttendance(
        this.student.id,
        this.selectedMonth,
        this.selectedYear
      );
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      this.loading = false;
    }
  }

  getMonthName(): string {
    return this.months.find(m => m.value === this.selectedMonth)?.label || '';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }

  calculateDuration(record: LibraryAttendance): string {
    if (!record.check_out_time) return '-';
    
    const checkIn = new Date(`2000-01-01T${record.check_in_time}`);
    const checkOut = new Date(`2000-01-01T${record.check_out_time}`);
    const diff = checkOut.getTime() - checkIn.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  getOnTimeCount(): number {
    return this.attendanceRecords.filter(r => r.status === 'present').length;
  }

  getLateCount(): number {
    return this.attendanceRecords.filter(r => r.status === 'late').length;
  }

  downloadCSV() {
    const headers = ['Date', 'Day', 'Check-In', 'Check-Out', 'Duration', 'Status'];
    const rows = this.attendanceRecords.map(record => [
      this.formatDate(record.date),
      this.getDayName(record.date),
      record.check_in_time,
      record.check_out_time || '-',
      this.calculateDuration(record),
      record.status === 'late' ? 'Late' : 'On Time'
    ]);

    const csvContent = [
      [`Attendance Report - ${this.student.name}`],
      [`Month: ${this.getMonthName()} ${this.selectedYear}`],
      [],
      headers,
      ...rows
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.student.name}_attendance_${this.selectedMonth}_${this.selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  close() {
    this.dialogRef.close();
  }
}
