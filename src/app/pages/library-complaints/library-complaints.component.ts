import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Complaint {
  id: string;
  complaint_against_seat_no: number;
  complaint_type: string;
  description: string;
  lodged_by_name: string | null;
  lodged_by_seat_no: number | null;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  // From the view join
  student_name?: string;
  student_phone?: string;
  student_gender?: string;
}

@Component({
  selector: 'app-library-complaints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './library-complaints.component.html',
  styleUrls: ['./library-complaints.component.css']
})
export class LibraryComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  pendingComplaints: Complaint[] = [];
  resolvedComplaints: Complaint[] = [];
  dismissedComplaints: Complaint[] = [];
  loading = false;
  selectedTab = 0;

  displayedColumns: string[] = [
    'created_at',
    'seat_no',
    'student_name',
    'complaint_type',
    'description',
    'lodged_by',
    'status',
    'actions'
  ];

  constructor(
    private libraryService: LibraryService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.snackBar.open('❌ Admin access required', 'Close', { duration: 3000 });
      this.router.navigate(['/library']);
      return;
    }

    await this.loadComplaints();
  }

  async loadComplaints() {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const complaints = await this.libraryService.getAllComplaints();
      this.complaints = complaints || [];
      this.categorizeComplaints();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading complaints:', error);
      this.snackBar.open('❌ Error loading complaints', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  categorizeComplaints() {
    this.pendingComplaints = this.complaints.filter(c => c.status === 'pending');
    this.resolvedComplaints = this.complaints.filter(c => c.status === 'resolved');
    this.dismissedComplaints = this.complaints.filter(c => c.status === 'dismissed');
    this.cdr.detectChanges();
  }

  async resolveComplaint(complaint: Complaint) {
    const notes = prompt('Enter resolution notes (optional):');
    if (notes === null) return; // User cancelled

    this.loading = true;
    this.cdr.detectChanges();
    try {
      const result = await this.libraryService.resolveComplaint(complaint.id, notes || undefined);
      if (result.success) {
        this.snackBar.open('✅ Complaint resolved successfully', 'Close', { duration: 3000 });
        await this.loadComplaints();
      } else {
        this.snackBar.open('❌ Failed to resolve complaint', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      this.snackBar.open('❌ Error resolving complaint', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async dismissComplaint(complaint: Complaint) {
    const notes = prompt('Enter dismissal reason (optional):');
    if (notes === null) return; // User cancelled

    this.loading = true;
    this.cdr.detectChanges();
    try {
      const result = await this.libraryService.dismissComplaint(complaint.id, notes || undefined);
      if (result.success) {
        this.snackBar.open('✅ Complaint dismissed', 'Close', { duration: 3000 });
        await this.loadComplaints();
      } else {
        this.snackBar.open('❌ Failed to dismiss complaint', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error dismissing complaint:', error);
      this.snackBar.open('❌ Error dismissing complaint', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warn';
      case 'resolved': return 'primary';
      case 'dismissed': return 'accent';
      default: return '';
    }
  }

  getComplaintTypeIcon(type: string): string {
    switch (type) {
      case 'Making Noise': return '🔊';
      case 'Talking on Phone': return '📱';
      case 'Disturbing Others': return '😤';
      case 'Not Following Rules': return '⚠️';
      case 'Inappropriate Behavior': return '🚫';
      default: return '📝';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLodgedByText(complaint: Complaint): string {
    if (complaint.lodged_by_name && complaint.lodged_by_seat_no) {
      return `${complaint.lodged_by_name} (Seat ${complaint.lodged_by_seat_no})`;
    }
    return 'Anonymous';
  }

  goBack() {
    this.router.navigate(['/library-grid']);
  }

  private normalizeWhatsAppNumber(rawPhone: string): string | null {
    const digits = (rawPhone || '').replace(/\D/g, '');

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.substring(1)}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }

    return null;
  }

  private buildWhatsAppReminderMessage(complaint: Complaint): string {
    return `Hello ${complaint.student_name || 'Student'},\n\nThis is a reminder from Suraksha Library Administration regarding a complaint on Seat #${complaint.complaint_against_seat_no}.\n\n*Complaint Type:* ${complaint.complaint_type}\n*Description:* ${complaint.description || 'No description provided'}\n*Reported On:* ${this.formatDate(complaint.created_at)}\n\nPlease follow library rules and ensure a peaceful study environment for everyone.\n\nThank you for your cooperation.\n\nRegards,\nSuraksha Library Admin Team`;
  }

  sendWhatsApp(complaint: Complaint) {
    let phoneInput = complaint.student_phone?.trim() || '';

    if (!phoneInput) {
      const enteredPhone = prompt('⚠️ Student phone not found. Enter WhatsApp number (10 digits):');
      if (enteredPhone === null) {
        return;
      }
      phoneInput = enteredPhone.trim();
    }

    const whatsappNumber = this.normalizeWhatsAppNumber(phoneInput);
    if (!whatsappNumber) {
      this.snackBar.open('⚠️ Invalid phone number. Please enter a valid 10-digit number.', 'Close', { duration: 3500 });
      return;
    }

    const message = this.buildWhatsAppReminderMessage(complaint);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}
