// src/app/pages/library-grid/library-grid.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, LibrarySeat, LibraryStudent } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-library-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-grid.component.html',
  styleUrls: ['./library-grid.component.css']
})
export class LibraryGridComponent implements OnInit {
  seats: LibrarySeat[] = [];
  loading = false;
  
  // Registration Modal
  showRegistrationModal = false;
  selectedSeat: LibrarySeat | null = null;
  selectedShift: 'full_time' | 'first_half' | 'second_half' = 'full_time';
  
  // Student Profile Modal
  showProfileModal = false;
  selectedStudent: LibraryStudent | null = null;
  selectedSecondStudent: LibraryStudent | null = null; // For when both shifts are occupied
  showBothStudents = false;
  
  // Change Seat Modal
  showChangeSeatModal = false;
  changingSeatStudent: LibraryStudent | null = null;
  changingSeatShiftType: 'full_time' | 'first_half' | 'second_half' = 'full_time';
  changingSeatExpiry: string = '';
  newSeatNumber: number = 0;
  availableSeatsForTransfer: LibrarySeat[] = [];
  
  // New Student Form
  newStudent = {
    name: '',
    mobile: '',
    emergency_contact: '',
    emergency_contact_name: '',
    address: '',
    dob: null as any, // Use null for date field to avoid DB errors
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    registration_fee_paid: 100,
    notes: ''
  };
  
  // Payment Form
  feePayment = {
    shift_type: 'full_time' as 'full_time' | 'first_half' | 'second_half',
    amount_paid: 400,
    payment_mode: 'cash' as 'cash' | 'upi' | 'card',
    days: 30
  };
  
  photoFile: File | null = null;
  uploadingPhoto = false;
  
  // Existing student detection
  existingStudent: LibraryStudent | null = null;
  checkingMobile = false;
  
  // Fee Payment Modal
  showFeePaymentModal = false;
  additionalFeePayment = {
    amount_paid: 400,
    payment_mode: 'cash' as 'cash' | 'upi' | 'card',
    days: 30,
    transaction_reference: ''
  };
  
  // Receipt Modal
  showReceiptModal = false;
  receiptData: any = null;
  
  // Attendance
  todayAttendance: any = null;
  checkingAttendance = false;
  allTodayAttendance: any[] = []; // All students' attendance for today
  attendanceMap: { [studentId: string]: any } = {}; // Quick lookup by student ID

  // My Attendance (Self-marking)
  showMyAttendanceModal = false;
  myAttendanceMobile = '';
  myAttendanceStudent: LibraryStudent | null = null;
  myAttendanceStatus: any = null;
  searchingStudent = false;

  // Bulk Operations
  showBulkOperations = false;
  bulkMode = false;
  selectedSeats: number[] = [];
  bulkAction = '';
  
  successMessage = '';
  errorMessage = '';
  saving = false;

  constructor(
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadSeats();
  }

  async loadSeats() {
    try {
      this.loading = true;
      
      // Load seats and attendance in parallel
      const [seats, attendance] = await Promise.all([
        this.libraryService.getAllSeats(),
        this.libraryService.getAllTodayAttendance()
      ]);
      
      this.seats = seats;
      this.allTodayAttendance = attendance;
      
      // Create attendance map for quick lookup
      this.attendanceMap = {};
      attendance.forEach((att: any) => {
        this.attendanceMap[att.student_id] = att;
      });
      
      this.cdr.detectChanges();
      
    } catch (error: any) {
      this.errorMessage = 'Failed to load seats: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ==============================
  // SEAT ACTIONS
  // ==============================

  onSeatClick(seat: LibrarySeat) {
    // Viewers can only VIEW - no clicking allowed
    if (!this.authService.canEdit()) {
      return; // Silently ignore clicks for viewers
    }

    this.selectedSeat = seat;
    this.selectedSecondStudent = null;
    this.showBothStudents = false;
    
    // Check seat status
    if (seat.full_time_student_id && seat.full_time_student) {
      // Show full time student profile
      this.selectedStudent = seat.full_time_student;
      this.loadTodayAttendance(seat.full_time_student.id);
      this.showProfileModal = true;
      this.cdr.detectChanges();
    } else if (seat.first_half_student_id && seat.second_half_student_id) {
      // Both shifts occupied - show BOTH students
      this.selectedStudent = seat.first_half_student || null;
      this.selectedSecondStudent = seat.second_half_student || null;
      this.showBothStudents = true;
      // Load attendance for both students
      if (this.selectedStudent) this.loadTodayAttendance(this.selectedStudent.id);
      if (this.selectedSecondStudent) {
        // Ensure second student's attendance is in the map
        this.libraryService.getTodayAttendanceStatus(this.selectedSecondStudent.id).then(att => {
          if (att) {
            this.attendanceMap[this.selectedSecondStudent!.id] = att;
            this.cdr.detectChanges();
          }
        });
      }
      this.showProfileModal = true;
      this.cdr.detectChanges();
    } else if (seat.first_half_student_id && seat.first_half_student) {
      // Only first half occupied - show student profile
      this.selectedStudent = seat.first_half_student;
      this.loadTodayAttendance(seat.first_half_student.id);
      this.showProfileModal = true;
      this.cdr.detectChanges();
    } else if (seat.second_half_student_id && seat.second_half_student) {
      // Only second half occupied - show student profile
      this.selectedStudent = seat.second_half_student;
      this.loadTodayAttendance(seat.second_half_student.id);
      this.showProfileModal = true;
      this.cdr.detectChanges();
    } else {
      // Empty seat - show registration form
      this.openRegistrationModal(seat);
    }
  }

  // Helper method to check if user can view personal details
  canViewPersonalDetails(): boolean {
    return this.authService.isAdmin() || this.authService.isLibraryManager();
  }

  // Helper method to check if user is admin (for bulk operations)
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Check if the other half-shift is available for the current seat
  isOtherShiftAvailable(): boolean {
    if (!this.selectedSeat) return false;
    
    // If full-time occupied, no other shift available
    if (this.selectedSeat.full_time_student_id) return false;
    
    // If only first-half occupied, second-half is available
    if (this.selectedSeat.first_half_student_id && !this.selectedSeat.second_half_student_id) {
      return true;
    }
    
    // If only second-half occupied, first-half is available
    if (this.selectedSeat.second_half_student_id && !this.selectedSeat.first_half_student_id) {
      return true;
    }
    
    return false;
  }

  // Get the shift type of the currently selected student
  getCurrentShiftType(): 'full_time' | 'first_half' | 'second_half' {
    if (!this.selectedSeat) return 'full_time';
    
    if (this.selectedSeat.full_time_student_id) {
      return 'full_time';
    } else if (this.selectedSeat.first_half_student_id && this.selectedStudent?.id === this.selectedSeat.first_half_student_id) {
      return 'first_half';
    } else if (this.selectedSeat.second_half_student_id && this.selectedStudent?.id === this.selectedSeat.second_half_student_id) {
      return 'second_half';
    }
    
    return 'full_time';
  }

  // Get the name of the available shift
  getAvailableShiftName(): string {
    if (!this.selectedSeat) return '';
    
    if (this.selectedSeat.first_half_student_id && !this.selectedSeat.second_half_student_id) {
      return 'Evening Shift';
    }
    
    if (this.selectedSeat.second_half_student_id && !this.selectedSeat.first_half_student_id) {
      return 'Morning Shift';
    }
    
    return 'Other Shift';
  }

  // Open registration for the other available shift
  addStudentForOtherShift() {
    if (!this.selectedSeat) return;
    
    // Close profile modal
    this.showProfileModal = false;
    
    // Open registration modal - it will auto-select the available shift
    this.openRegistrationModal(this.selectedSeat);
    this.cdr.detectChanges();
  }

  getSeatClass(seat: LibrarySeat): string {
    if (seat.full_time_student_id) {
      return this.getExpiryClass(seat.full_time_expiry!);
    } else if (seat.first_half_student_id && seat.second_half_student_id) {
      // Both occupied
      const firstExpiry = this.getExpiryClass(seat.first_half_expiry!);
      const secondExpiry = this.getExpiryClass(seat.second_half_expiry!);
      // Return most urgent status
      if (firstExpiry === 'expired' || secondExpiry === 'expired') return 'expired';
      if (firstExpiry === 'expiring' || secondExpiry === 'expiring') return 'expiring';
      return 'occupied';
    } else if (seat.first_half_student_id || seat.second_half_student_id) {
      const expiry = seat.first_half_student_id ? seat.first_half_expiry! : seat.second_half_expiry!;
      return this.getExpiryClass(expiry) + ' half-occupied';
    }
    return 'empty';
  }

  getExpiryClass(expiryDate: string): string {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 2) return 'expiring';
    return 'occupied';
  }

  getSeatTooltip(seat: LibrarySeat): string {
    if (seat.full_time_student_id) {
      return `${seat.full_time_student?.name}\nFull Time\nExpires: ${seat.full_time_expiry}`;
    } else if (seat.first_half_student_id && seat.second_half_student_id) {
      return `Morning: ${seat.first_half_student?.name}\nEvening: ${seat.second_half_student?.name}`;
    } else if (seat.first_half_student_id) {
      return `${seat.first_half_student?.name}\nMorning Shift\nEvening Available`;
    } else if (seat.second_half_student_id) {
      return `${seat.second_half_student?.name}\nEvening Shift\nMorning Available`;
    }
    return 'Available';
  }

  // ==============================
  // REGISTRATION
  // ==============================

  openRegistrationModal(seat: LibrarySeat) {
    this.selectedSeat = seat;
    
    // Determine available shifts
    if (!seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id) {
      this.selectedShift = 'full_time';
    } else if (seat.first_half_student_id && !seat.second_half_student_id) {
      this.selectedShift = 'second_half';
    } else if (seat.second_half_student_id && !seat.first_half_student_id) {
      this.selectedShift = 'first_half';
    }
    
    this.updateFeeAmount();
    this.showRegistrationModal = true;
    this.cdr.detectChanges();
  }

  onShiftChange() {
    this.updateFeeAmount();
    this.cdr.detectChanges();
  }

  updateFeeAmount() {
    if (this.selectedShift === 'full_time') {
      this.feePayment.amount_paid = 400;
    } else {
      this.feePayment.amount_paid = 250;
    }
    this.cdr.detectChanges();
  }

  onPhotoSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.photoFile = file;
    } else {
      this.errorMessage = 'Please select a valid image file';
    }
  }

  async checkExistingStudent() {
    const mobile = this.newStudent.mobile.trim();
    
    // Reset existing student info
    this.existingStudent = null;
    this.successMessage = '';
    
    if (!mobile || mobile.length < 10) {
      return;
    }

    try {
      this.checkingMobile = true;
      this.cdr.detectChanges();
      
      const student = await this.libraryService.getStudentByMobile(mobile);
      
      if (student) {
        // Student already exists - pre-fill form
        this.existingStudent = student;
        this.newStudent = {
          name: student.name,
          mobile: student.mobile,
          emergency_contact: student.emergency_contact,
          emergency_contact_name: student.emergency_contact_name || '',
          address: student.address,
          dob: student.dob || '',
          gender: student.gender || 'Male',
          registration_fee_paid: 100,
          notes: student.notes || ''
        };
        this.successMessage = `ℹ️ Student already registered: ${student.name}. Using existing details.`;
      }
    } catch (error: any) {
      console.error('Error checking mobile:', error);
    } finally {
      this.checkingMobile = false;
      this.cdr.detectChanges();
    }
  }

  async submitRegistration() {
    if (!this.newStudent.name || !this.newStudent.mobile || !this.newStudent.emergency_contact || !this.newStudent.address) {
      this.errorMessage = 'Please fill all required fields';
      this.cdr.detectChanges();
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();

      let student: LibraryStudent;

      // 1. Use existing student or create new one
      if (this.existingStudent) {
        // Using existing student
        student = this.existingStudent;
      } else {
        // Create new student
        const studentResult = await this.libraryService.addStudent({
          ...this.newStudent,
          status: 'active'
        });

        if (!studentResult.success || !studentResult.student) {
          throw new Error(studentResult.error || 'Failed to create student');
        }

        student = studentResult.student;
      }

      // 2. Upload photo if provided
      // TODO: TEMPORARILY DISABLED - Fix storage bucket RLS policies first
      // Uncomment this block after running the storage setup SQL in Supabase
      /*
      if (this.photoFile) {
        this.uploadingPhoto = true;
        const photoUrl = await this.libraryService.uploadStudentPhoto(this.photoFile);
        await this.libraryService.updateStudent(student.id, { photo_url: photoUrl });
        this.uploadingPhoto = false;
      }
      */

      // 3. Record registration fee (skip for existing students)
      if (!this.existingStudent) {
        await this.libraryService.recordFeePayment({
          student_id: student.id,
          seat_no: this.selectedSeat!.seat_no,
          shift_type: 'registration',
          amount_paid: this.newStudent.registration_fee_paid,
          payment_date: new Date().toISOString().split('T')[0],
          valid_from: new Date().toISOString().split('T')[0],
          valid_until: new Date().toISOString().split('T')[0],
          payment_mode: this.feePayment.payment_mode
        });
      }

      // 4. Record seat fee payment
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + this.feePayment.days);

      await this.libraryService.recordFeePayment({
        student_id: student.id,
        seat_no: this.selectedSeat!.seat_no,
        shift_type: this.selectedShift,
        amount_paid: this.feePayment.amount_paid,
        payment_date: validFrom.toISOString().split('T')[0],
        valid_from: validFrom.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        payment_mode: this.feePayment.payment_mode
      });

      this.successMessage = this.existingStudent ? 
        '✅ Existing student registered to seat successfully!' : 
        '✅ New student registered successfully!';
      this.showRegistrationModal = false;
      this.resetForm();
      await this.loadSeats();
      
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.saving = false;
      this.uploadingPhoto = false;
      this.cdr.detectChanges();
    }
  }

  resetForm() {
    this.newStudent = {
      name: '',
      mobile: '',
      emergency_contact: '',
      emergency_contact_name: '',
      address: '',
      dob: null as any, // Use null instead of empty string for date field
      gender: 'Male',
      registration_fee_paid: 100,
      notes: ''
    };
    this.photoFile = null;
    this.existingStudent = null;
    this.checkingMobile = false;
  }

  // ==============================
  // STUDENT PROFILE
  // ==============================

  sendWhatsAppReminder(student?: LibraryStudent) {
    const targetStudent = student || this.selectedStudent;
    if (!targetStudent) return;
    
    const message = `Dear ${targetStudent.name}, your Suraksha Library fee is due soon. Please renew to keep your seat reserved. Thank you!`;
    const url = `https://wa.me/${targetStudent.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  sendEmergencySOS(student?: LibraryStudent) {
    const targetStudent = student || this.selectedStudent;
    if (!targetStudent) return;
    
    const message = `URGENT: This is Suraksha Library. Regarding ${targetStudent.name}, there is an emergency. Please contact us immediately.`;
    const url = `https://wa.me/${targetStudent.emergency_contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  async releaseSeatConfirm(studentOrShift?: LibraryStudent | 'full_time' | 'first_half' | 'second_half', shiftTypeParam?: 'full_time' | 'first_half' | 'second_half') {
    // Determine the shift type
    let shiftType: 'full_time' | 'first_half' | 'second_half' | undefined;
    
    if (typeof studentOrShift === 'string') {
      // Old API: releaseSeatConfirm('first_half')
      shiftType = studentOrShift;
    } else if (shiftTypeParam) {
      // New API: releaseSeatConfirm(student, 'first_half')
      shiftType = shiftTypeParam;
    }
    
    if (!confirm('Are you sure you want to release this seat?')) return;
    
    try {
      const result = await this.libraryService.releaseSeat(this.selectedSeat!.seat_no, shiftType);
      if (result.success) {
        this.successMessage = '✅ Seat released successfully';
        this.showProfileModal = false;
        await this.loadSeats();
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      }
    } catch (error: any) {
      this.errorMessage = error.message;
      this.cdr.detectChanges();
    }
  }

  // ==============================
  // CHANGE SEAT
  // ==============================

  openChangeSeatModal(student: LibraryStudent, shiftType: 'full_time' | 'first_half' | 'second_half') {
    this.changingSeatStudent = student;
    this.changingSeatShiftType = shiftType;
    
    // Get the expiry date for this student's shift
    if (shiftType === 'full_time') {
      this.changingSeatExpiry = this.selectedSeat?.full_time_expiry || '';
    } else if (shiftType === 'first_half') {
      this.changingSeatExpiry = this.selectedSeat?.first_half_expiry || '';
    } else {
      this.changingSeatExpiry = this.selectedSeat?.second_half_expiry || '';
    }
    
    // Get available seats for this shift type
    this.availableSeatsForTransfer = this.seats.filter(seat => {
      // Exclude current seat
      if (seat.seat_no === this.selectedSeat?.seat_no) return false;
      
      // Check if the shift is available
      if (shiftType === 'full_time') {
        return !seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id;
      } else if (shiftType === 'first_half') {
        return !seat.full_time_student_id && !seat.first_half_student_id;
      } else {
        return !seat.full_time_student_id && !seat.second_half_student_id;
      }
    });
    
    this.showProfileModal = false;
    this.showChangeSeatModal = true;
    this.cdr.detectChanges();
  }

  async confirmChangeSeat() {
    if (!this.changingSeatStudent || !this.selectedSeat || !this.newSeatNumber) {
      this.errorMessage = 'Please select a new seat';
      this.cdr.detectChanges();
      return;
    }

    if (!confirm(`Change ${this.changingSeatStudent.name} from Seat ${this.selectedSeat.seat_no} to Seat ${this.newSeatNumber}?`)) {
      return;
    }

    try {
      this.saving = true;
      this.cdr.detectChanges();
      
      const result = await this.libraryService.changeSeat(
        this.changingSeatStudent.id,
        this.selectedSeat.seat_no,
        this.newSeatNumber,
        this.changingSeatShiftType,
        this.changingSeatExpiry
      );

      if (result.success) {
        this.successMessage = `✅ Seat changed successfully from ${this.selectedSeat.seat_no} to ${this.newSeatNumber}`;
        this.showChangeSeatModal = false;
        this.newSeatNumber = 0;
        await this.loadSeats();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Failed to change seat';
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  closeModal() {
    this.showRegistrationModal = false;
    this.showProfileModal = false;
    this.showChangeSeatModal = false;
    this.showFeePaymentModal = false;
    this.showReceiptModal = false;
    this.selectedSeat = null;
    this.selectedStudent = null;
    this.newSeatNumber = 0;
    this.receiptData = null;
    this.cdr.detectChanges();
  }

  // ==============================
  // FEE PAYMENT
  // ==============================

  openFeePaymentModal(student: LibraryStudent) {
    this.selectedStudent = student;
    this.additionalFeePayment = {
      amount_paid: 400,
      payment_mode: 'cash',
      days: 30,
      transaction_reference: ''
    };
    this.showFeePaymentModal = true;
    this.showProfileModal = false;
    this.cdr.detectChanges();
  }

  async submitFeePayment() {
    if (!this.selectedStudent || !this.selectedSeat) {
      this.errorMessage = 'Student or seat information missing';
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + this.additionalFeePayment.days);

      const result = await this.libraryService.recordFeePayment({
        student_id: this.selectedStudent.id,
        seat_no: this.selectedSeat.seat_no,
        shift_type: this.getCurrentShiftType(),
        amount_paid: this.additionalFeePayment.amount_paid,
        payment_date: new Date().toISOString().split('T')[0],
        valid_from: validFrom.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        payment_mode: this.additionalFeePayment.payment_mode,
        transaction_reference: this.additionalFeePayment.transaction_reference || undefined
      });

      if (result.success && result.payment) {
        // Generate receipt
        this.receiptData = this.libraryService.generateReceiptData(result.payment, this.selectedStudent);
        
        this.successMessage = '✅ Fee payment recorded successfully!';
        this.showFeePaymentModal = false;
        this.showReceiptModal = true;
        // Reload seats and attendance data
        await this.loadSeats();
        this.cdr.detectChanges();
      } else {
        this.errorMessage = result.error || 'Failed to record payment';
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      this.errorMessage = error.message;
      this.cdr.detectChanges();
    } finally {
      this.saving = false;
      // Ensure UI reflects all changes
      this.cdr.detectChanges();
    }
  }

  // ==============================
  // RECEIPT
  // ==============================

  printReceipt() {
    if (!this.receiptData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${this.receiptData.receipt_no}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #2196F3; }
          .header p { margin: 5px 0; color: #666; }
          .receipt-details { margin: 20px 0; }
          .receipt-details table { width: 100%; border-collapse: collapse; }
          .receipt-details td { padding: 8px; border-bottom: 1px solid #eee; }
          .receipt-details td:first-child { font-weight: bold; width: 40%; }
          .amount { font-size: 24px; color: #4CAF50; font-weight: bold; text-align: center; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 Suraksha Library</h1>
          <p>Fee Payment Receipt</p>
          <p><strong>Receipt No:</strong> ${this.receiptData.receipt_no}</p>
        </div>
        
        <div class="receipt-details">
          <table>
            <tr><td>Date:</td><td>${this.receiptData.date}</td></tr>
            <tr><td>Student Name:</td><td>${this.receiptData.student_name}</td></tr>
            <tr><td>Mobile:</td><td>${this.receiptData.mobile}</td></tr>
            <tr><td>Seat Number:</td><td>${this.receiptData.seat_no}</td></tr>
            <tr><td>Shift Type:</td><td>${this.receiptData.shift_type.replace('_', ' ').toUpperCase()}</td></tr>
            <tr><td>Payment Mode:</td><td>${this.receiptData.payment_mode.toUpperCase()}</td></tr>
            <tr><td>Transaction Ref:</td><td>${this.receiptData.transaction_ref}</td></tr>
            <tr><td>Valid From:</td><td>${this.receiptData.valid_from}</td></tr>
            <tr><td>Valid Until:</td><td>${this.receiptData.valid_until}</td></tr>
          </table>
        </div>
        
        <div class="amount">
          Amount Paid: ₹${this.receiptData.amount_paid}
        </div>
        
        <div class="footer">
          <p>Thank you for your payment!</p>
          <p>Suraksha Library Management System</p>
          <p>For queries, contact: library@surakshawall.com</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  shareReceiptOnWhatsApp() {
    if (!this.receiptData) return;
    
    const message = `📚 *Suraksha Library - Fee Receipt*\n\n` +
      `Receipt No: ${this.receiptData.receipt_no}\n` +
      `Date: ${this.receiptData.date}\n\n` +
      `Student: ${this.receiptData.student_name}\n` +
      `Seat: ${this.receiptData.seat_no}\n` +
      `Shift: ${this.receiptData.shift_type.replace('_', ' ').toUpperCase()}\n\n` +
      `Amount Paid: ₹${this.receiptData.amount_paid}\n` +
      `Payment Mode: ${this.receiptData.payment_mode.toUpperCase()}\n` +
      `Valid From: ${this.receiptData.valid_from}\n` +
      `Valid Until: ${this.receiptData.valid_until}\n\n` +
      `Thank you for your payment! 🙏`;
    
    const url = `https://wa.me/${this.receiptData.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    this.successMessage = '✅ Receipt shared on WhatsApp!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ==============================
  // ATTENDANCE
  // ==============================

  async loadTodayAttendance(studentId: string) {
    this.todayAttendance = await this.libraryService.getTodayAttendanceStatus(studentId);
    this.cdr.detectChanges();
  }

  async toggleAttendance(student: LibraryStudent) {
    if (this.checkingAttendance) return;
    
    try {
      this.checkingAttendance = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      // Load today's attendance first
      await this.loadTodayAttendance(student.id);

      if (!this.todayAttendance) {
        // Check in - admin bypasses time restriction
        const result = await this.libraryService.checkInStudent(student.id, this.isAdmin());
        if (result.success) {
          this.successMessage = '✅ Checked in successfully!';
          this.todayAttendance = result.attendance;
          // Update attendance map for grid and modal display
          this.attendanceMap[student.id] = result.attendance;
          // Force UI update for dual-student modal
          this.cdr.detectChanges();
        } else {
          this.errorMessage = result.error || 'Failed to check in';
          this.cdr.detectChanges();
        }
      } else if (!this.todayAttendance.check_out_time) {
        // Check out - admin bypasses time restriction
        const result = await this.libraryService.checkOutStudent(student.id, this.isAdmin());
        if (result.success) {
          this.successMessage = '✅ Checked out successfully!';
          await this.loadTodayAttendance(student.id);
          // Update attendance map for grid and modal display
          this.attendanceMap[student.id] = this.todayAttendance;
          // Force UI update for dual-student modal
          this.cdr.detectChanges();
        } else {
          this.errorMessage = result.error || 'Failed to check out';
          this.cdr.detectChanges();
        }
      } else {
        this.errorMessage = 'Already checked out for today';
        this.cdr.detectChanges();
      }

      // Clear messages after delay
      setTimeout(() => {
        this.successMessage = '';
        this.errorMessage = '';
        this.cdr.detectChanges();
      }, 3000);

    } catch (error: any) {
      this.errorMessage = error.message;
      this.cdr.detectChanges();
    } finally {
      this.checkingAttendance = false;
      // Final change detection to ensure all UI updates are reflected
      this.cdr.detectChanges();
    }
  }

  getAttendanceButtonText(): string {
    if (!this.todayAttendance) return '🟢 Check In';
    if (!this.todayAttendance.check_out_time) return '🔴 Check Out';
    return '✅ Checked Out';
  }

  getAttendanceButtonClass(): string {
    if (!this.todayAttendance) return 'btn-success';
    if (!this.todayAttendance.check_out_time) return 'btn-danger';
    return 'btn-secondary';
  }

  isAttendanceButtonDisabled(): boolean {
    return this.checkingAttendance || (this.todayAttendance && !!this.todayAttendance.check_out_time);
  }

  // Attendance button helpers for dual-student modal (accepts studentId)
  getAttendanceButtonTextForStudent(studentId: string): string {
    const attendance = this.getStudentAttendanceStatus(studentId);
    if (!attendance) return '✅ Check In';
    if (!attendance.check_out_time) return '🚪 Check Out';
    return '✅ Checked Out';
  }

  getAttendanceButtonClassForStudent(studentId: string): string {
    const attendance = this.getStudentAttendanceStatus(studentId);
    if (!attendance) return 'btn-primary';
    if (!attendance.check_out_time) return 'btn-warning';
    return 'btn-secondary';
  }

  isAttendanceButtonDisabledForStudent(studentId: string): boolean {
    const attendance = this.getStudentAttendanceStatus(studentId);
    return this.checkingAttendance || (attendance && !!attendance.check_out_time);
  }

  // Get attendance status for a student (for grid display)
  getStudentAttendanceStatus(studentId: string | undefined): any {
    if (!studentId) return null;
    return this.attendanceMap[studentId] || null;
  }

  getAttendanceIndicator(studentId: string | undefined): string {
    const attendance = this.getStudentAttendanceStatus(studentId);
    if (!attendance) return '';
    
    const checkInTime = attendance.check_in_time.substring(0, 5); // HH:MM
    
    // If checked out, show both check-in and check-out times
    if (attendance.check_out_time) {
      const checkOutTime = attendance.check_out_time.substring(0, 5); // HH:MM
      return `🟢 ${checkInTime} 🔴 ${checkOutTime}`;
    }
    
    // If only checked in, show checkin time only
    return `🟢 ${checkInTime}`;
  }

  getAttendanceIndicatorClass(studentId: string | undefined): string {
    const attendance = this.getStudentAttendanceStatus(studentId);
    if (!attendance) return '';
    if (attendance.check_out_time) return 'status-out';
    return 'status-in';
  }

  // ==============================
  // MY ATTENDANCE (SELF-MARKING)
  // ==============================

  openMyAttendanceModal() {
    this.showMyAttendanceModal = true;
    this.myAttendanceMobile = '';
    this.myAttendanceStudent = null;
    this.myAttendanceStatus = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  closeMyAttendanceModal() {
    this.showMyAttendanceModal = false;
    this.myAttendanceMobile = '';
    this.myAttendanceStudent = null;
    this.myAttendanceStatus = null;
    this.cdr.detectChanges();
  }

  async searchMyStudent() {
    if (!this.myAttendanceMobile || this.myAttendanceMobile.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return;
    }

    try {
      this.searchingStudent = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const student = await this.libraryService.findStudentByMobile(this.myAttendanceMobile);
      
      if (!student) {
        this.errorMessage = 'No student found with this mobile number';
        this.myAttendanceStudent = null;
        this.myAttendanceStatus = null;
      } else {
        this.myAttendanceStudent = student;
        // Load today's attendance status
        this.myAttendanceStatus = await this.libraryService.getTodayAttendanceStatus(student.id);
      }

      this.cdr.detectChanges();
    } catch (error: any) {
      this.errorMessage = error.message;
      this.cdr.detectChanges();
    } finally {
      this.searchingStudent = false;
      this.cdr.detectChanges();
    }
  }

  async markMyAttendance() {
    if (!this.myAttendanceStudent) {
      this.errorMessage = 'Please search for your studentrecord first';
      return;
    }

    if (this.checkingAttendance) return;

    try {
      this.checkingAttendance = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();

      if (!this.myAttendanceStatus) {
        // Check in - admin bypasses time restriction
        const result = await this.libraryService.checkInStudent(this.myAttendanceStudent.id, this.isAdmin());
        if (result.success) {
          this.successMessage = '✅ Checked in successfully!';
          this.myAttendanceStatus = result.attendance;
          // Update attendance map for grid display
          this.attendanceMap[this.myAttendanceStudent.id] = result.attendance;
        } else {
          this.errorMessage = result.error || 'Failed to check in';
        }
      } else if (!this.myAttendanceStatus.check_out_time) {
        // Check out - admin bypasses time restriction
        const result = await this.libraryService.checkOutStudent(this.myAttendanceStudent.id, this.isAdmin());
        if (result.success) {
          this.successMessage = '✅ Checked out successfully!';
          // Reload status
          this.myAttendanceStatus = await this.libraryService.getTodayAttendanceStatus(this.myAttendanceStudent.id);
          // Update attendance map for grid display
          this.attendanceMap[this.myAttendanceStudent.id] = this.myAttendanceStatus;
        } else {
          this.errorMessage = result.error || 'Failed to check out';
        }
      } else {
        this.errorMessage = 'Already checked out for today';
      }

      this.cdr.detectChanges();

      if (this.successMessage) {
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }

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

  getMyAttendanceButtonClass(): string {
    if (!this.myAttendanceStatus) return 'btn-success';
    if (!this.myAttendanceStatus.check_out_time) return 'btn-danger';
    return 'btn-secondary';
  }

  isMyAttendanceButtonDisabled(): boolean {
    return this.checkingAttendance || (this.myAttendanceStatus && !!this.myAttendanceStatus.check_out_time);
  }

  // ==============================
  // BULK OPERATIONS
  // ==============================

  toggleBulkOperations() {
    if (!this.isAdmin()) {
      this.errorMessage = 'Bulk operations are only available to administrators';
      return;
    }
    this.showBulkOperations = !this.showBulkOperations;
    if (!this.showBulkOperations) {
      this.bulkMode = false;
      this.selectedSeats = [];
    }
    this.cdr.detectChanges();
  }

  toggleBulkMode() {
    if (!this.isAdmin()) {
      this.errorMessage = 'Bulk operations are only available to administrators';
      return;
    }
    this.bulkMode = !this.bulkMode;
    this.selectedSeats = [];
    this.cdr.detectChanges();
  }

  toggleSeatSelection(seatNo: number) {
    const index = this.selectedSeats.indexOf(seatNo);
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push(seatNo);
    }
    this.cdr.detectChanges();
  }

  isSeatSelected(seatNo: number): boolean {
    return this.selectedSeats.includes(seatNo);
  }

  selectAllOccupiedSeats() {
    this.selectedSeats = this.seats
      .filter(s => s.full_time_student_id || s.first_half_student_id || s.second_half_student_id)
      .map(s => s.seat_no);
    this.cdr.detectChanges();
  }

  selectAllEmptySeats() {
    this.selectedSeats = this.seats
      .filter(s => !s.full_time_student_id && !s.first_half_student_id && !s.second_half_student_id)
      .map(s => s.seat_no);
    this.cdr.detectChanges();
  }

  clearSelection() {
    this.selectedSeats = [];
    this.cdr.detectChanges();
  }

  async executeBulkRelease() {
    if (!this.isAdmin()) {
      this.errorMessage = 'Bulk operations are only available to administrators';
      return;
    }

    if (this.selectedSeats.length === 0) {
      this.errorMessage = 'Please select seats to release';
      return;
    }

    if (!confirm(`Are you sure you want to release ${this.selectedSeats.length} seats? This action cannot be undone.`)) {
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const result = await this.libraryService.bulkReleaseSeat(this.selectedSeats);
      
      if (result.success) {
        this.successMessage = `✅ Released ${result.released} seats successfully!`;
        if (result.errors.length > 0) {
          this.errorMessage = `⚠️ Some errors occurred:\n${result.errors.join('\n')}`;
        }
        this.selectedSeats = [];
        await this.loadSeats();
      } else {
        this.errorMessage = 'Failed to release seats';
      }

      setTimeout(() => {
        this.successMessage = '';
        this.errorMessage = '';
      }, 5000);

    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async sendBulkWhatsAppMessages() {
    if (!this.isAdmin()) {
      this.errorMessage = 'Bulk operations are only available to administrators';
      return;
    }

    if (this.selectedSeats.length === 0) {
      this.errorMessage = 'Please select seats to send messages';
      return;
    }

    const message = prompt('Enter message to send to all selected students:');
    if (!message) return;

    let count = 0;
    this.selectedSeats.forEach(seatNo => {
      const seat = this.seats.find(s => s.seat_no === seatNo);
      if (seat) {
        const student = seat.full_time_student || seat.first_half_student || seat.second_half_student;
        if (student) {
          const url = `https://wa.me/${student.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
          count++;
        }
      }
    });

    this.successMessage = `✅ Opened ${count} WhatsApp messages!`;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
