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
      min-width: 600px;
      max-width: 90vw;
    }

    .student-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .student-info h3 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .student-info p {
      margin: 0;
      color: #666;
    }

    .month-selector {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .month-selector label {
      font-weight: 500;
      color: #555;
    }

    .month-selector select {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }

    .loading, .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: bold;
    }

    .attendance-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    thead {
      background: #f8f9fa;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #dee2e6;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background: #f8f9fa;
    }

    tr.late {
      background: #fff3cd;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
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
      padding: 20px 0;
    }

    .btn-download {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-download:hover {
      background: #218838;
    }

    mat-dialog-actions {
      justify-content: flex-end;
      padding: 20px;
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
