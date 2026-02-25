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

  sendWhatsApp(complaint: Complaint) {
    if (!complaint.student_phone) {
      this.snackBar.open('⚠️ No phone number available', 'Close', { duration: 3000 });
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const phoneNumber = complaint.student_phone.replace(/\D/g, '');
    
    // Create message
    const message = `Hello ${complaint.student_name || 'Student'},\n\nThis is from Suraksha Library Administration.\n\nWe have received a complaint regarding Seat #${complaint.complaint_against_seat_no}:\n\n*Complaint Type:* ${complaint.complaint_type}\n*Description:* ${complaint.description || 'No description provided'}\n*Date:* ${this.formatDate(complaint.created_at)}\n\nPlease be mindful of library rules and maintain a peaceful study environment for all students.\n\nThank you for your cooperation.\n\nRegards,\nSuraksha Library Team`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}
