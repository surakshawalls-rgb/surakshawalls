// src/app/pages/library-students/library-students.component.ts
import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LibraryService, LibraryStudent, LibrarySeat } from '../../services/library.service';

@Component({
  selector: 'app-library-students',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTableModule, 
    MatSortModule, 
    MatPaginatorModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './library-students.component.html',
  styleUrls: ['./library-students.component.css']
})
export class LibraryStudentsComponent implements OnInit {
  students: LibraryStudent[] = [];
  filteredStudents: LibraryStudent[] = [];
  dataSource: MatTableDataSource<LibraryStudent> = new MatTableDataSource<LibraryStudent>();
  displayedColumns: string[] = ['photo', 'name', 'gender', 'mobile', 'seat_no', 'emergency_contact', 'address', 'joining_date', 'registration_fee_paid', 'status', 'actions'];
  studentSeatMap: { [studentId: string]: { seatNo: number, shiftType: string } } = {};
  
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  searchTerm = '';
  filterStatus = 'all';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showAddModal = false;
  showEditModal = false;
  showPaymentHistoryModal = false;
  showChangeSeatModal = false;
  showProfileModal = false;
  showAddShiftModal = false;
  selectedStudent: LibraryStudent | null = null;
  paymentHistory: any[] = [];
  newShiftType: 'first_half' | 'second_half' = 'first_half';
  canShowAddShiftButton = false;
  addShiftButtonText = '';
  
  // Seat management
  availableSeats: LibrarySeat[] = [];
  newSeatNumber: number = 0;
  currentShiftType: 'full_time' | 'first_half' | 'second_half' = 'full_time';
  currentSeatNo: number = 0;
  
  // Attendance
  todayAttendance: any[] = [];
  attendanceMap: { [studentId: string]: any } = {};

  newStudent: Partial<LibraryStudent> = {
    name: '',
    mobile: '',
    emergency_contact: '',
    emergency_contact_name: '',
    address: '',
    gender: 'Male',
    joining_date: new Date().toISOString().split('T')[0],
    registration_fee_paid: 0,
    status: 'active'
  };

  selectedPhoto: File | null = null;
  uploadingPhoto = false;
  originalJoiningDate: string = ''; // Track original joining date for edit

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

  constructor(
    private libraryService: LibraryService,
    private cdr: ChangeDetectorRef
  ) {
    // Generate year ranges
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
  }

  async ngOnInit() {
    await this.loadStudents();
    await this.loadTodayAttendance();
  }

  async loadStudents() {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.students = await this.libraryService.getAllStudents();
      
      // Load seats to get seat numbers for students
      await this.loadStudentSeats();
      
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error loading students:', error);
      this.errorMessage = 'Failed to load students: ' + error.message;
      this.loading = false;
    }
  }

  async loadStudentSeats() {
    try {
      const seats = await this.libraryService.getAllSeats();
      this.studentSeatMap = {};
      
      seats.forEach(seat => {
        if (seat.full_time_student_id) {
          this.studentSeatMap[seat.full_time_student_id] = {
            seatNo: seat.seat_no,
            shiftType: 'Full Time'
          };
        }
        if (seat.first_half_student_id) {
          this.studentSeatMap[seat.first_half_student_id] = {
            seatNo: seat.seat_no,
            shiftType: 'First Half'
          };
        }
        if (seat.second_half_student_id) {
          this.studentSeatMap[seat.second_half_student_id] = {
            seatNo: seat.seat_no,
            shiftType: 'Second Half'
          };
        }
      });
    } catch (error) {
      console.error('Error loading student seats:', error);
    }
  }

  getStudentSeatInfo(studentId: string): string {
    const seatInfo = this.studentSeatMap[studentId];
    if (seatInfo) {
      return `${seatInfo.seatNo} (${seatInfo.shiftType})`;
    }
    return '-';
  }

  async loadTodayAttendance() {
    try {
      this.todayAttendance = await this.libraryService.getAllTodayAttendance();
      this.attendanceMap = {};
      this.todayAttendance.forEach((att: any) => {
        this.attendanceMap[att.student_id] = att;
      });
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  }

  applyFilters() {
    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = !this.searchTerm || 
        student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.mobile.includes(this.searchTerm);
      
      const matchesStatus = this.filterStatus === 'all' || student.status === this.filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    // Update MatTableDataSource
    this.dataSource.data = this.filteredStudents;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  openAddModal() {
    this.newStudent = {
      name: '',
      mobile: '',
      emergency_contact: '',
      emergency_contact_name: '',
      address: '',
      gender: 'Male',
      joining_date: new Date().toISOString().split('T')[0],
      registration_fee_paid: 0,
      status: 'active'
    };
    this.selectedPhoto = null;
    this.showAddModal = true;
  }

  openEditModal(student: LibraryStudent) {
    this.selectedStudent = { ...student };
    this.originalJoiningDate = student.joining_date; // Store original joining date
    this.showEditModal = true;
  }

  async openPaymentHistory(student: LibraryStudent) {
    try {
      this.selectedStudent = student;
      this.paymentHistory = await this.libraryService.getStudentPaymentHistory(student.id!);
      this.showPaymentHistoryModal = true;
    } catch (error: any) {
      console.error('Error loading payment history:', error);
      this.errorMessage = 'Failed to load payment history: ' + error.message;
    }
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showPaymentHistoryModal = false;
    this.showChangeSeatModal = false;
    this.showProfileModal = false;
    this.showAddShiftModal = false;
    this.selectedStudent = null;
    this.selectedPhoto = null;
    this.originalJoiningDate = ''; // Clear original joining date
  }

  async openProfileModal(student: LibraryStudent) {
    this.selectedStudent = student;
    this.showProfileModal = true;
    
    // Precompute shift button visibility and text
    this.canShowAddShiftButton = await this.canAddShift(student);
    if (this.canShowAddShiftButton) {
      this.addShiftButtonText = await this.getAddShiftButtonText(student);
    }
  }

  onPhotoSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'Photo size must be less than 2MB';
        return;
      }
      this.selectedPhoto = file;
    }
  }

  async submitAddStudent() {
    try {
      // Combine date fields
      if (this.dobDay && this.dobMonth && this.dobYear) {
        this.newStudent.dob = `${this.dobYear}-${this.dobMonth}-${String(this.dobDay).padStart(2, '0')}`;
      }
      if (this.joiningDay && this.joiningMonth && this.joiningYear) {
        this.newStudent.joining_date = `${this.joiningYear}-${this.joiningMonth}-${String(this.joiningDay).padStart(2, '0')}`;
      }

      if (!this.newStudent.name || !this.newStudent.mobile || !this.newStudent.address || !this.newStudent.joining_date) {
        this.errorMessage = 'Please fill all required fields';
        return;
      }

      this.uploadingPhoto = true;

      // Upload photo if selected
      if (this.selectedPhoto) {
        const photoUrl = await this.libraryService.uploadStudentPhoto(this.selectedPhoto);
        this.newStudent.photo_url = photoUrl;
      }

      this.uploadingPhoto = false;

      // Add student
      const studentId = await this.libraryService.addStudent(this.newStudent as Omit<LibraryStudent, 'id' | 'created_at' | 'updated_at'>);
      
      this.successMessage = 'Student added successfully!';
      this.closeModal();
      await this.loadStudents();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error adding student:', error);
      this.errorMessage = 'Failed to add student: ' + error.message;
      this.uploadingPhoto = false;
    }
  }

  async submitEditStudent() {
    try {
      if (!this.selectedStudent) return;

      // Update student details
      await this.libraryService.updateStudent(this.selectedStudent.id!, this.selectedStudent);
      
      // If joining date changed, update seat expiry dates
      if (this.selectedStudent.joining_date !== this.originalJoiningDate) {
        const result = await this.libraryService.updateSeatExpiryForStudent(
          this.selectedStudent.id!,
          this.selectedStudent.joining_date
        );
        
        if (!result.success) {
          console.error('Failed to update seat expiry:', result.error);
          this.successMessage = 'Student updated, but expiry date update failed. Please check seat assignments.';
        } else {
          this.successMessage = 'Student and seat expiry dates updated successfully!';
        }
      } else {
        this.successMessage = 'Student updated successfully!';
      }
      
      this.closeModal();
      await this.loadStudents();
      await this.loadStudentSeats(); // Reload seats to reflect expiry changes
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error updating student:', error);
      this.errorMessage = 'Failed to update student: ' + error.message;
    }
  }

  onJoiningDateChange() {
    // Show info message that expiry will be recalculated
    if (this.selectedStudent && this.selectedStudent.joining_date !== this.originalJoiningDate) {
      // Calculate what the new expiry date will be
      const joiningDate = new Date(this.selectedStudent.joining_date);
      const daysInMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + 1, 0).getDate();
      const expiryDate = new Date(joiningDate);
      expiryDate.setDate(expiryDate.getDate() + daysInMonth - 1);
      
      const expiryString = expiryDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      this.successMessage = `📅 Seat expiry will be updated to: ${expiryString}`;
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  async deleteStudent(student: LibraryStudent) {
    if (!confirm(`Are you sure you want to delete ${student.name}? This will remove all associated seat assignments.`)) {
      return;
    }

    try {
      await this.libraryService.deleteStudent(student.id!);
      this.successMessage = 'Student deleted successfully!';
      await this.loadStudents();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      this.errorMessage = 'Failed to delete student: ' + error.message;
    }
  }

  sendWhatsApp(student: LibraryStudent) {
    const message = `Hello ${student.name}! This is a message from Suraksha Library. Thank you for being with us!`;
    const url = `https://wa.me/${student.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'badge-success',
      'inactive': 'badge-secondary',
      'suspended': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  // ========== ATTENDANCE MANAGEMENT ==========
  
  getStudentAttendanceStatus(studentId: string): any {
    return this.attendanceMap[studentId] || null;
  }

  isCheckedIn(studentId: string): boolean {
    const attendance = this.getStudentAttendanceStatus(studentId);
    return attendance && attendance.check_in_time && !attendance.check_out_time;
  }

  isCheckedOut(studentId: string): boolean {
    const attendance = this.getStudentAttendanceStatus(studentId);
    return attendance && attendance.check_out_time;
  }

  getAttendanceButtonText(studentId: string): string {
    if (this.isCheckedIn(studentId)) {
      return '✅ Check-out';
    } else if (this.isCheckedOut(studentId)) {
      return '✓ Already Checked-out';
    } else {
      return '⏱️ Check-in';
    }
  }

  getAttendanceButtonClass(studentId: string): string {
    if (this.isCheckedIn(studentId)) {
      return 'btn-warning';
    } else if (this.isCheckedOut(studentId)) {
      return 'btn-success disabled';
    } else {
      return 'btn-primary';
    }
  }

  async toggleAttendance(student: LibraryStudent) {
    if (this.isCheckedOut(student.id!)) {
      this.errorMessage = 'Student has already checked out today';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    try {
      if (this.isCheckedIn(student.id!)) {
        // Check-out
        const result = await this.libraryService.checkOutStudent(student.id!);
        if (!result.success) {
          throw new Error(result.error || 'Check-out failed');
        }
        this.successMessage = `${student.name} checked out successfully!`;
      } else {
        // Check-in
        const result = await this.libraryService.checkInStudent(student.id!);
        if (!result.success) {
          throw new Error(result.error || 'Check-in failed');
        }
        this.successMessage = `${student.name} checked in successfully!`;
      }
      
      await this.loadTodayAttendance();
      this.cdr.detectChanges();
      
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error toggling attendance:', error);
      this.errorMessage = 'Failed to update attendance: ' + error.message;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // ========== SEAT MANAGEMENT ==========

  async openChangeSeatModal(student: LibraryStudent) {
    try {
      this.selectedStudent = student;
      
      // Find student's current seat assignment
      const seats = await this.libraryService.getAllSeats();
      const currentSeat = seats.find((seat: LibrarySeat) => 
        seat.full_time_student_id === student.id ||
        seat.first_half_student_id === student.id ||
        seat.second_half_student_id === student.id
      );
      
      if (!currentSeat) {
        this.errorMessage = 'Student is not assigned to any seat';
        return;
      }
      
      this.currentSeatNo = currentSeat.seat_no;
      
      // Determine shift type
      if (currentSeat.full_time_student_id === student.id) {
        this.currentShiftType = 'full_time';
      } else if (currentSeat.first_half_student_id === student.id) {
        this.currentShiftType = 'first_half';
      } else {
        this.currentShiftType = 'second_half';
      }
      
      // Get available seats for this shift type
      this.availableSeats = seats.filter((seat: LibrarySeat) => this.isSeatAvailableForShift(seat, this.currentShiftType));
      
      this.showChangeSeatModal = true;
    } catch (error: any) {
      console.error('Error opening change seat modal:', error);
      this.errorMessage = 'Failed to load seat information';
    }
  }

  isSeatAvailableForShift(seat: LibrarySeat, shiftType: 'full_time' | 'first_half' | 'second_half'): boolean {
    if (shiftType === 'full_time') {
      return !seat.full_time_student_id && !seat.first_half_student_id && !seat.second_half_student_id;
    } else if (shiftType === 'first_half') {
      return !seat.full_time_student_id && !seat.first_half_student_id;
    } else {
      return !seat.full_time_student_id && !seat.second_half_student_id;
    }
  }

  async confirmSeatChange() {
    if (!this.selectedStudent || !this.newSeatNumber) {
      this.errorMessage = 'Please select a new seat';
      return;
    }

    try {
      // Get current seat to retrieve expiry date
      const seats = await this.libraryService.getAllSeats();
      const currentSeat = seats.find((seat: LibrarySeat) => seat.seat_no === this.currentSeatNo);
      
      let expiryDate = '';
      if (currentSeat) {
        if (this.currentShiftType === 'full_time') {
          expiryDate = currentSeat.full_time_expiry || '';
        } else if (this.currentShiftType === 'first_half') {
          expiryDate = currentSeat.first_half_expiry || '';
        } else {
          expiryDate = currentSeat.second_half_expiry || '';
        }
      }
      
      const result = await this.libraryService.changeSeat(
        this.selectedStudent.id!,
        this.currentSeatNo,
        this.newSeatNumber,
        this.currentShiftType,
        expiryDate
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Seat change failed');
      }
      
      this.successMessage = `Seat changed successfully from ${this.currentSeatNo} to ${this.newSeatNumber}`;
      this.showChangeSeatModal = false;
      this.newSeatNumber = 0;
      
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error changing seat:', error);
      this.errorMessage = 'Failed to change seat: ' + error.message;
    }
  }

  // ========== EMERGENCY SOS ==========

  async sendEmergencySOS(student: LibraryStudent) {
    if (!student.emergency_contact) {
      this.errorMessage = 'No emergency contact available for this student';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const confirmSOS = confirm(`Send emergency SOS to ${student.emergency_contact_name || 'emergency contact'} (${student.emergency_contact})?`);
    if (!confirmSOS) return;

    try {
      const message = `🚨 URGENT: This is an emergency message from Suraksha Library regarding ${student.name}. Please contact the library immediately at your earliest convenience. Library Contact: 8090272727`;
      const url = `https://wa.me/${student.emergency_contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      
      this.successMessage = 'Emergency SOS sent!';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error sending SOS:', error);
      this.errorMessage = 'Failed to send SOS';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // ========== RELEASE SEAT ==========

  async releaseSeat(student: LibraryStudent) {
    const confirmRelease = confirm(`Are you sure you want to release the seat for ${student.name}? This will remove their seat assignment.`);
    if (!confirmRelease) return;

    try {
      // Find student's seat to release
      const seats = await this.libraryService.getAllSeats();
      const seat = seats.find((s: LibrarySeat) => 
        s.full_time_student_id === student.id ||
        s.first_half_student_id === student.id ||
        s.second_half_student_id === student.id
      );
      
      if (!seat) {
        this.errorMessage = 'Student is not assigned to any seat';
        return;
      }

      let shiftType: 'full_time' | 'first_half' | 'second_half';
      if (seat.full_time_student_id === student.id) {
        shiftType = 'full_time';
      } else if (seat.first_half_student_id === student.id) {
        shiftType = 'first_half';
      } else {
        shiftType = 'second_half';
      }

      await this.libraryService.releaseSeat(seat.seat_no, shiftType);
      
      this.successMessage = `Seat ${seat.seat_no} released for ${student.name}`;
      await this.loadStudents();
      
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error releasing seat:', error);
      this.errorMessage = 'Failed to release seat: ' + error.message;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // ========== PAY FEE ==========

  openPayFeeModal(student: LibraryStudent) {
    this.selectedStudent = student;
    // Implementation would open a fee payment modal
    // For now, just show a message
    this.successMessage = 'Fee payment feature - would open payment modal';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ========== ADD SHIFT ==========

  // Check if student can add another shift
  async canAddShift(student: LibraryStudent): Promise<boolean> {
    try {
      const seats = await this.libraryService.getAllSeats();
      const hasFullTime = seats.some((s: LibrarySeat) => s.full_time_student_id === student.id);
      return !hasFullTime; // Can add shift only if not on full time
    } catch (error) {
      console.error('Error checking shift availability:', error);
      return false;
    }
  }

  // Get the shift type that can be added
  async getAvailableShiftToAdd(student: LibraryStudent): Promise<'first_half' | 'second_half' | null> {
    try {
      const seats = await this.libraryService.getAllSeats();
      const hasFirstHalf = seats.some((s: LibrarySeat) => s.first_half_student_id === student.id);
      const hasSecondHalf = seats.some((s: LibrarySeat) => s.second_half_student_id === student.id);
      
      if (hasFirstHalf && !hasSecondHalf) return 'second_half';
      if (hasSecondHalf && !hasFirstHalf) return 'first_half';
      return null;
    } catch (error) {
      console.error('Error getting available shift:', error);
      return null;
    }
  }

  // Get button text for add shift
  async getAddShiftButtonText(student: LibraryStudent): Promise<string> {
    const availableShift = await this.getAvailableShiftToAdd(student);
    if (availableShift === 'second_half') return '➕ Add Evening Shift';
    if (availableShift === 'first_half') return '➕ Add Morning Shift';
    return '';
  }

  // Open add shift modal
  async openAddShiftModal(student: LibraryStudent) {
    const canAdd = await this.canAddShift(student);
    if (!canAdd) {
      alert('Student is already on full time or has both shifts');
      return;
    }

    const availableShift = await this.getAvailableShiftToAdd(student);
    if (!availableShift) {
      alert('No available shift to add');
      return;
    }

    this.selectedStudent = student;
    this.newShiftType = availableShift;
    this.currentShiftType = availableShift;
    
    // Load available seats for this shift
    const seats = await this.libraryService.getAllSeats();
    this.availableSeats = seats.filter((seat: LibrarySeat) => this.isSeatAvailableForShift(seat, availableShift));
    
    this.showProfileModal = false;
    this.showAddShiftModal = true;
  }

  // Confirm adding shift
  async confirmAddShift() {
    if (!this.selectedStudent || !this.newSeatNumber) {
      alert('Please select a seat');
      return;
    }

    try {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);
      const validUntilStr = validUntil.toISOString().split('T')[0];

      const result = await this.libraryService.assignSeat(
        this.newSeatNumber,
        this.selectedStudent.id,
        this.newShiftType,
        validUntilStr
      );

      if (result.success) {
        this.successMessage = `${this.newShiftType === 'first_half' ? 'Morning' : 'Evening'} shift added successfully!`;
        this.showAddShiftModal = false;
        await this.loadStudents();
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = 'Failed to add shift: ' + result.error;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    } catch (error: any) {
      console.error('Error adding shift:', error);
      this.errorMessage = 'Failed to add shift: ' + error.message;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // ========== WHATSAPP REMINDER ==========

  sendWhatsAppReminder(student: LibraryStudent) {
    const message = `Hello ${student.name}! 👋\n\nThis is a reminder from Suraksha Library 📚\n\nPlease remember to:\n✅ Maintain library discipline\n✅ Keep your seat clean\n✅ Pay fees on time\n\nThank you for being a valued member! 🙏\n\nFor queries: 8090272727`;
    const url = `https://wa.me/${student.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}
