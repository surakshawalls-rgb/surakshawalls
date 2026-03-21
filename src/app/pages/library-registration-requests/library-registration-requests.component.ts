import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { LibFooterComponent } from '../../components/lib-footer/lib-footer.component';
import {
  ApproveLibraryRegistrationRequestInput,
  LibraryRegistrationRequest,
  LibrarySeat,
  LibraryService
} from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-library-registration-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, LibFooterComponent],
  templateUrl: './library-registration-requests.component.html',
  styleUrls: ['./library-registration-requests.component.css']
})
export class LibraryRegistrationRequestsComponent implements OnInit, OnDestroy {
  requests: LibraryRegistrationRequest[] = [];
  filteredRequests: LibraryRegistrationRequest[] = [];
  seats: LibrarySeat[] = [];
  availableSeats: LibrarySeat[] = [];

  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  showApproveModal = false;
  showRejectModal = false;
  selectedRequest: LibraryRegistrationRequest | null = null;

  approvalSeatNo: number | null = null;
  approvalRegistrationFee = 0;
  approvalSeatFee = 0;
  approvalPaymentMode: 'cash' | 'upi' | 'card' | 'other' = 'cash';
  approvalPaymentReference = '';
  rejectionReason = '';

  private realtimeChannel?: any;

  constructor(
    private libraryService: LibraryService,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.canManageRequests()) {
      this.router.navigate(['/library-grid']);
      return;
    }

    await this.loadData();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.supabase.removeChannel(this.realtimeChannel);
    }
  }

  canManageRequests(): boolean {
    return this.authService.hasAccess('library') && this.authService.canEdit();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [requests, seats] = await Promise.all([
        this.libraryService.getRegistrationRequests(),
        this.libraryService.getAllSeats(false)
      ]);

      this.requests = requests;
      this.seats = seats;
      this.applyFilter();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Failed to load membership requests';
    } finally {
      this.loading = false;
    }
  }

  setupRealtimeSubscription(): void {
    this.realtimeChannel = this.supabaseService.supabase
      .channel('library-registration-request-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'library_registration_requests'
        },
        async () => {
          await this.loadData();
        }
      )
      .subscribe();
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredRequests = [...this.requests];
      return;
    }

    this.filteredRequests = this.requests.filter(request => request.status === this.filterStatus);
  }

  setFilter(status: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  getStatusCount(status: 'pending' | 'approved' | 'rejected'): number {
    return this.requests.filter(request => request.status === status).length;
  }

  getShiftLabel(shiftType: string): string {
    switch (shiftType) {
      case 'full_time':
        return 'Full Day';
      case 'first_half':
        return 'Morning';
      case 'second_half':
        return 'Evening';
      default:
        return shiftType;
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refresh(): void {
    this.loadData();
  }

  async openApproveModal(request: LibraryRegistrationRequest): Promise<void> {
    try {
      this.selectedRequest = request;
      this.approvalRegistrationFee = Number(request.registration_fee_amount || 0);
      this.approvalSeatFee = Number(request.seat_fee_amount || 0);
      this.approvalPaymentMode = request.payment_mode || 'cash';
      this.approvalPaymentReference = request.payment_reference || '';

      this.seats = await this.libraryService.getAllSeats(false);
      this.availableSeats = this.getAvailableSeatsForShift(request.requested_shift_type);
      this.approvalSeatNo = this.availableSeats.length > 0 ? this.availableSeats[0].seat_no : null;
      this.showApproveModal = true;
      this.showRejectModal = false;
    } catch (error: any) {
      this.errorMessage = error?.message || 'Failed to load available seats';
    }
  }

  openRejectModal(request: LibraryRegistrationRequest): void {
    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showRejectModal = true;
    this.showApproveModal = false;
  }

  closeModal(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedRequest = null;
    this.approvalSeatNo = null;
    this.approvalPaymentReference = '';
    this.rejectionReason = '';
  }

  private getAvailableSeatsForShift(shiftType: 'full_time' | 'first_half' | 'second_half'): LibrarySeat[] {
    return this.seats.filter(seat => {
      if (shiftType === 'full_time') {
        return !seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id;
      }

      if (shiftType === 'first_half') {
        return !seat.full_time_student_id && !seat.first_half_student_id;
      }

      return !seat.full_time_student_id && !seat.second_half_student_id;
    });
  }

  async approveSelectedRequest(): Promise<void> {
    if (!this.selectedRequest || !this.approvalSeatNo) {
      this.errorMessage = 'Please select a seat before approving';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const approvalPayload: ApproveLibraryRegistrationRequestInput = {
        seat_no: this.approvalSeatNo,
        registration_fee_amount: Number(this.approvalRegistrationFee || 0),
        seat_fee_amount: Number(this.approvalSeatFee || 0),
        payment_mode: this.approvalPaymentMode,
        payment_reference: this.approvalPaymentReference || null
      };

      const result = await this.libraryService.approveRegistrationRequest(this.selectedRequest.id, approvalPayload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve membership request');
      }

      this.successMessage = `✅ ${this.selectedRequest.name} has been approved and assigned Seat ${this.approvalSeatNo}`;
      if (result.warning) {
        this.successMessage += ` ${result.warning}`;
      }
      this.closeModal();
      await this.loadData();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Failed to approve membership request';
    } finally {
      this.saving = false;
    }
  }

  async rejectSelectedRequest(): Promise<void> {
    if (!this.selectedRequest) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.libraryService.rejectRegistrationRequest(
        this.selectedRequest.id,
        this.rejectionReason.trim()
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject membership request');
      }

      this.successMessage = `❌ ${this.selectedRequest.name}'s request has been rejected`;
      this.closeModal();
      await this.loadData();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Failed to reject membership request';
    } finally {
      this.saving = false;
    }
  }
}
