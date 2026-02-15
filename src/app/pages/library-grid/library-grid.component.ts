// src/app/pages/library-grid/library-grid.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { LibraryService, LibrarySeat, LibraryStudent } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { RegistrationDialogComponent, RegistrationResult } from './registration-dialog.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-library-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatDialogModule, MatSnackBarModule, MatBadgeModule, MatDatepickerModule, MatNativeDateModule],
  providers: [MatDatepickerModule, MatNativeDateModule],
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
    gender: 'Male' as 'Male' | 'Female',
    joining_date: new Date().toISOString().split('T')[0],
    registration_fee_paid: 0,
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
    months: 1,
    shift_type: 'full_time' as 'full_time' | 'first_half' | 'second_half',
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

  // Date dropdown arrays
  days: number[] = Array.from({length: 31}, (_, i) => i + 1);
  months = [
    {value: '01', label: 'January'}, {value: '02', label: 'February'}, {value: '03', label: 'March'},
    {value: '04', label: 'April'}, {value: '05', label: 'May'}, {value: '06', label: 'June'},
    {value: '07', label: 'July'}, {value: '08', label: 'August'}, {value: '09', label: 'September'},
    {value: '10', label: 'October'}, {value: '11', label: 'November'}, {value: '12', label: 'December'}
  ];
  dobYears: number[] = [];
  joiningYears: number[] = [];

  // Separate date fields
  dobDay = '';
  dobMonth = '';
  dobYear = '';
  joiningDay = '';
  joiningMonth = '';
  joiningYear = '';
  expiryDay = '';
  expiryMonth = '';
  expiryYear = '';

  constructor(
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
        // Generate year ranges for DOB and Joining
    const currentYear = new Date().getFullYear();
    // DOB: 1990 to current year
    for (let year = currentYear; year >= 1990; year--) {
      this.dobYears.push(year);
    }
    // Joining: 2025 to current year
    for (let year = currentYear; year >= 2025; year--) {
      this.joiningYears.push(year);
    }
    // Set default joining date to today
    const today = new Date();
    this.joiningDay = String(today.getDate()).padStart(2, '0');
    this.joiningMonth = String(today.getMonth() + 1).padStart(2, '0');
    this.joiningYear = String(today.getFullYear());
    
    // Set default expiry date to end of current month
    this.calculateDefaultExpiryDate();
  }

  // Calculate expiry date as end of month from joining date
  calculateDefaultExpiryDate(triggerChangeDetection: boolean = false) {
    if (!this.joiningDay || !this.joiningMonth || !this.joiningYear) {
      return;
    }
    
    const joiningDate = new Date(
      parseInt(this.joiningYear),
      parseInt(this.joiningMonth) - 1,
      parseInt(this.joiningDay)
    );
    
    // Default expiry: 1 month from joining date minus 1 day
    const expiryDate = new Date(joiningDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(expiryDate.getDate() - 1);
    
    this.expiryDay = String(expiryDate.getDate()).padStart(2, '0');
    this.expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
    this.expiryYear = String(expiryDate.getFullYear());
    
    if (triggerChangeDetection) {
      this.cdr.detectChanges();
    }
  }

  // Called when joining date changes
  onJoiningDateChange() {
    this.calculateDefaultExpiryDate(true);
  }

  // Calculate days between joining and expiry for backend
  calculateDaysBetween(): number {
    if (!this.joiningDay || !this.joiningMonth || !this.joiningYear ||
        !this.expiryDay || !this.expiryMonth || !this.expiryYear) {
      return 30; // Default
    }
    
    const start = new Date(
      parseInt(this.joiningYear),
      parseInt(this.joiningMonth) - 1,
      parseInt(this.joiningDay)
    );
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(
      parseInt(this.expiryYear),
      parseInt(this.expiryMonth) - 1,
      parseInt(this.expiryDay)
    );
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 30;
  }

  async ngOnInit() {
    await this.loadSeats();
  }

  async loadSeats() {
    try {
      this.loading = true;
      
      // Clear cache to ensure fresh data
      this.libraryService.clearSeatsCache();
      
      // Load seats and attendance in parallel
      const [seats, attendance] = await Promise.all([
        this.libraryService.getAllSeats(false),
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
  // HELPER METHODS
  // ==============================

  getFullTimeStudentDisplay(seat: LibrarySeat): string {
    if (seat.full_time_student && seat.full_time_student.name) {
      return seat.full_time_student.name;
    }
    if (seat.full_time_student_id) {
      return 'ID: ' + seat.full_time_student_id.substring(0, 8);
    }
    return '';
  }

  getFirstHalfStudentDisplay(seat: LibrarySeat): string {
    if (seat.first_half_student && seat.first_half_student.name) {
      return seat.first_half_student.name;
    }
    if (seat.first_half_student_id) {
      return seat.first_half_student_id.substring(0, 6);
    }
    return '';
  }

  getSecondHalfStudentDisplay(seat: LibrarySeat): string {
    if (seat.second_half_student && seat.second_half_student.name) {
      return seat.second_half_student.name;
    }
    if (seat.second_half_student_id) {
      return seat.second_half_student_id.substring(0, 6);
    }
    return '';
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
    // Full day occupied
    if (seat.full_time_student_id) {
      return 'full-day-occupied';
    } 
    // Both shifts occupied (different students)
    else if (seat.first_half_student_id && seat.second_half_student_id) {
      return 'both-halves-occupied';
    } 
    // Only first half occupied
    else if (seat.first_half_student_id) {
      return 'first-half-occupied';
    } 
    // Only second half occupied
    else if (seat.second_half_student_id) {
      return 'second-half-occupied';
    }
    // Empty/Available
    return 'available';
  }

  getExpiryClass(expiryDate: string): string {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 2) return 'expiring';
    return 'occupied';
  }

  getDaysRemaining(expiryDate: string | undefined): string {
    if (!expiryDate) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago`;
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return 'Expires tomorrow';
    } else if (daysRemaining <= 7) {
      return `${daysRemaining} days left`;
    } else {
      // Format as dd-mm-yyyy
      const day = String(expiry.getDate()).padStart(2, '0');
      const month = String(expiry.getMonth() + 1).padStart(2, '0');
      const year = expiry.getFullYear();
      return `Expires: ${day}-${month}-${year}`;
    }
  }

  getDaysRemainingNumber(expiryDate: string | undefined): number | null {
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Return days remaining for all students
    return daysRemaining;
  }

  getBadgeColor(days: number | null): 'primary' | 'accent' | 'warn' | undefined {
    if (days === null) return undefined;
    if (days < 0) return 'warn'; // Expired - Red
    if (days <= 3) return 'warn'; // 1-3 days - Red
    if (days <= 7) return 'accent'; // 4-7 days - Yellow
    if (days <= 30) return 'primary'; // 8-30 days - Blue
    return undefined; // More than 30 days - No special color, use default
  }

  getSeatBadge(seat: LibrarySeat): { value: number | string, color: 'primary' | 'accent' | 'warn' | undefined, hidden: boolean } {
    // Determine which student to check
    const studentId = seat.full_time_student_id || seat.first_half_student_id || seat.second_half_student_id;
    
    // If no student, hide badge
    if (!studentId) {
      return { value: '', color: undefined, hidden: true };
    }
    
    // Check attendance status
    const attendance = this.getStudentAttendanceStatus(studentId);
    if (attendance?.check_in_time && !attendance?.check_out_time) {
      // Checked in (present)
      return { value: '🟢', color: 'primary', hidden: false };
    } else if (attendance?.check_out_time) {
      // Checked out
      return { value: '🔴', color: 'warn', hidden: false };
    }
    
    // No attendance today - show days remaining
    const expiryDate = seat.full_time_expiry || seat.first_half_expiry || seat.second_half_expiry;
    const days = this.getDaysRemainingNumber(expiryDate);
    
    return {
      value: days ?? '',
      color: this.getBadgeColor(days),
      hidden: days === null
    };
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

  // Statistics methods
  getFreeFullDaySeatsCount(): number {
    return this.seats.filter(seat => 
      !seat.full_time_student_id && 
      !seat.first_half_student_id && 
      !seat.second_half_student_id
    ).length;
  }

  getFreeHalfDaySeatsCount(): number {
    return this.seats.filter(seat => {
      // Count seats with at least one half available (not occupied by full time)
      if (seat.full_time_student_id) return false;
      return !seat.first_half_student_id || !seat.second_half_student_id;
    }).length;
  }

  getTotalMalesCount(): number {
    let count = 0;
    this.seats.forEach(seat => {
      if (seat.full_time_student?.gender === 'Male') count++;
      if (seat.first_half_student?.gender === 'Male') count++;
      if (seat.second_half_student?.gender === 'Male') count++;
    });
    return count;
  }

  getTotalFemalesCount(): number {
    let count = 0;
    this.seats.forEach(seat => {
      if (seat.full_time_student?.gender === 'Female') count++;
      if (seat.first_half_student?.gender === 'Female') count++;
      if (seat.second_half_student?.gender === 'Female') count++;
    });
    return count;
  }

  getOccupiedFullDaySeatsCount(): number {
    return this.seats.filter(seat => seat.full_time_student_id).length;
  }

  getOccupiedHalfDaySeatsCount(): number {
    return this.seats.filter(seat => {
      // Count seats with at least one half day occupied (not full time)
      if (seat.full_time_student_id) return false;
      return seat.first_half_student_id || seat.second_half_student_id;
    }).length;
  }

  // ==============================
  // REGISTRATION
  // ==============================

  openRegistrationModal(seat: LibrarySeat) {
    this.selectedSeat = seat;
    
    // Determine available shifts
    let availableShifts: string[] = [];
    let defaultShift = 'full_time';
    
    if (!seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id) {
      availableShifts = ['full_time', 'first_half', 'second_half'];
      defaultShift = 'full_time';
    } else if (seat.first_half_student_id && !seat.second_half_student_id) {
      availableShifts = ['second_half'];
      defaultShift = 'second_half';
    } else if (seat.second_half_student_id && !seat.first_half_student_id) {
      availableShifts = ['first_half'];
      defaultShift = 'first_half';
    }
    
    // Open Material Dialog with proper configuration
    const dialogRef = this.dialog.open(RegistrationDialogComponent, {
      width: '750px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        seat: seat,
        canViewPersonalDetails: this.canViewPersonalDetails()
      },
      disableClose: false,
      autoFocus: true,
      panelClass: ['registration-dialog', 'custom-dialog-container'],
      hasBackdrop: true,
      backdropClass: 'custom-dialog-backdrop',
      position: {
        top: '50px'
      }
    });
    
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.processRegistration(result, seat);
      }
    });
  }

  async processRegistration(result: any, seat: LibrarySeat) {
    try {
      let student: LibraryStudent;

      // Check if student already exists
      const existingStudent = await this.libraryService.getStudentByMobile(result.mobile);

      if (existingStudent) {
        // Use existing student
        student = existingStudent;
        
        // Update student details if they've changed
        await this.libraryService.updateStudent(student.id, {
          name: result.name,
          emergency_contact: result.emergency_contact,
          emergency_contact_name: result.emergency_contact_name,
          address: result.address,
          dob: result.dob ? result.dob.toISOString().split('T')[0] : null,
          gender: result.gender,
          notes: result.notes
        });
      } else {
        // Create new student
        const studentResult = await this.libraryService.addStudent({
          name: result.name,
          mobile: result.mobile,
          emergency_contact: result.emergency_contact,
          emergency_contact_name: result.emergency_contact_name,
          address: result.address,
          dob: result.dob ? result.dob.toISOString().split('T')[0] : null,
          gender: result.gender,
          joining_date: result.startDate.toISOString().split('T')[0],
          registration_fee_paid: result.registration_fee_paid || 0,
          notes: result.notes,
          status: 'active'
        });

        if (!studentResult.success || !studentResult.student) {
          throw new Error(studentResult.error || 'Failed to create student');
        }

        student = studentResult.student;

        // Record registration fee for new students
        if (result.registration_fee_paid > 0) {
          await this.libraryService.recordFeePayment({
            student_id: student.id,
            seat_no: seat.seat_no,
            shift_type: 'registration',
            amount_paid: result.registration_fee_paid,
            payment_date: new Date().toISOString().split('T')[0],
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: new Date().toISOString().split('T')[0],
            payment_mode: result.paymentMode
          });
        }
      }

      // Record seat fee payment
      const validFrom = new Date(result.startDate);
      validFrom.setHours(0, 0, 0, 0);
      
      const validUntil = new Date(result.endDate);
      validUntil.setHours(0, 0, 0, 0);

      const paymentResult = await this.libraryService.recordFeePayment({
        student_id: student.id,
        seat_no: seat.seat_no,
        shift_type: result.selectedShift,
        amount_paid: result.feeAmount,
        payment_date: validFrom.toISOString().split('T')[0],
        valid_from: validFrom.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        payment_mode: result.paymentMode
      });

      // Check if payment and seat assignment succeeded
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to record payment and assign seat');
      }

      // Show success message
      this.snackBar.open(
        existingStudent 
          ? '✅ Existing student registered to seat successfully!' 
          : '✅ New student registered successfully!',
        'Close',
        { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' }
      );

      // Reload seats with force refresh
      this.libraryService.clearSeatsCache();
      await this.loadSeats();
      this.cdr.detectChanges();
    } catch (error: any) {
      // Show error message
      this.snackBar.open(
        `❌ Error: ${error.message}`,
        'Close',
        { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
      );
      console.error('Registration error:', error);
    }
  }

  resetForm() {
    this.newStudent = {
      name: '',
      mobile: '',
      emergency_contact: '',
      emergency_contact_name: '',
      address: '',
      dob: null as any,
      gender: 'Male',
      joining_date: new Date().toISOString().split('T')[0],
      registration_fee_paid: 0,
      notes: ''
    };
    this.photoFile = null;
    this.existingStudent = null;
    this.checkingMobile = false;
    
    // Reset date dropdowns
    this.dobDay = '';
    this.dobMonth = '';
    this.dobYear = '';
    const today = new Date();
    this.joiningDay = String(today.getDate()).padStart(2, '0');
    this.joiningMonth = String(today.getMonth() + 1).padStart(2, '0');
    this.joiningYear = String(today.getFullYear());
    
    // Reset expiry date
    this.calculateDefaultExpiryDate(true);
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
    const currentShiftType = this.getCurrentShiftType();
    this.additionalFeePayment = {
      amount_paid: currentShiftType === 'full_time' ? 400 : 250,
      payment_mode: 'cash',
      months: 1,
      shift_type: currentShiftType,
      transaction_reference: ''
    };
    this.showFeePaymentModal = true;
    this.showProfileModal = false;
    this.cdr.detectChanges();
  }

  // Update fee amount based on shift type
  onShiftTypeChange() {
    this.additionalFeePayment.amount_paid = this.additionalFeePayment.shift_type === 'full_time' ? 400 : 250;
    this.cdr.detectChanges();
  }

  // Get current expiry date from seat
  getCurrentExpiryDate(): Date | null {
    if (!this.selectedSeat) return null;
    
    const shiftType = this.getCurrentShiftType();
    let expiryStr: string | null = null;
    
    if (shiftType === 'full_time') {
      expiryStr = this.selectedSeat.full_time_expiry || null;
    } else if (shiftType === 'first_half') {
      expiryStr = this.selectedSeat.first_half_expiry || null;
    } else if (shiftType === 'second_half') {
      expiryStr = this.selectedSeat.second_half_expiry || null;
    }
    
    if (!expiryStr) return null;
    
    const date = new Date(expiryStr);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Calculate new expiry date based on months from current expiry (or today if no current expiry)
  calculateExpiryDate(months: number): Date {
    const currentExpiry = this.getCurrentExpiryDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Determine start date for new subscription
    let startDate: Date;
    if (currentExpiry && currentExpiry >= today) {
      // Early payment: Start from day after current expiry
      startDate = new Date(currentExpiry);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // Overdue or no subscription: Start from today
      startDate = new Date(today);
    }
    
    // Calculate end date by adding months to start date
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    endDate.setDate(endDate.getDate() - 1); // Subtract 1 to get last day of period
    
    return endDate;
  }

  // Check if student subscription is overdue
  isSubscriptionOverdue(): boolean {
    const currentExpiry = this.getCurrentExpiryDate();
    if (!currentExpiry) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return currentExpiry < today;
  }

  // Get days overdue (returns 0 if not overdue)
  getDaysOverdue(): number {
    const currentExpiry = this.getCurrentExpiryDate();
    if (!currentExpiry) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentExpiry >= today) return 0;
    
    const diffTime = today.getTime() - currentExpiry.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Get days remaining for current subscription (returns 0 if expired)
  getCurrentSubscriptionDaysRemaining(): number {
    const currentExpiry = this.getCurrentExpiryDate();
    if (!currentExpiry) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentExpiry < today) return 0;
    
    const diffTime = currentExpiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Get subscription start date
  getSubscriptionStartDate(months: number): Date {
    const currentExpiry = this.getCurrentExpiryDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentExpiry && currentExpiry >= today) {
      // Early payment: Start from day after current expiry
      const startDate = new Date(currentExpiry);
      startDate.setDate(startDate.getDate() + 1);
      return startDate;
    } else {
      // Overdue or no subscription: Start from today
      return today;
    }
  }

  // Get days in the subscription period
  getDaysInSubscription(months: number): number {
    const startDate = this.getSubscriptionStartDate(months);
    const endDate = this.calculateExpiryDate(months);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
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

      // Determine valid from date based on current expiry
      const validFrom = this.getSubscriptionStartDate(this.additionalFeePayment.months);
      const validUntil = this.calculateExpiryDate(this.additionalFeePayment.months);

      const result = await this.libraryService.recordFeePayment({
        student_id: this.selectedStudent.id,
        seat_no: this.selectedSeat.seat_no,
        shift_type: this.additionalFeePayment.shift_type,
        amount_paid: this.additionalFeePayment.amount_paid,
        payment_date: validFrom.toISOString().split('T')[0],
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
      this.cdr.detectChanges();
      return;
    }

    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout - please try again')), 10000)
    );

    try {
      this.searchingStudent = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();
      
      // Race between service call and timeout
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
        
        // Load today's attendance status with timeout
        try {
          this.myAttendanceStatus = await Promise.race([
            this.libraryService.getTodayAttendanceStatus((student as LibraryStudent).id),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Attendance status timeout')), 5000)
            )
          ]);
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
      console.log('Finishing search, setting searchingStudent to false');
      this.searchingStudent = false;
      this.cdr.detectChanges();
      
      // Additional safety check to ensure UI updates
      setTimeout(() => {
        if (this.searchingStudent) {
          console.warn('searchingStudent still true after timeout, force setting to false');
          this.searchingStudent = false;
          this.cdr.detectChanges();
        }
      }, 100);
    }
  }

  // Manual reset function for debugging/emergency use
  forceResetAttendanceSearch() {
    console.log('Force resetting attendance search state');
    this.searchingStudent = false;
    this.myAttendanceStudent = null;
    this.myAttendanceStatus = null;
    this.myAttendanceMobile = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
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
