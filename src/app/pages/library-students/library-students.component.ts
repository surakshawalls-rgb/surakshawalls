// src/app/pages/library-students/library-students.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, LibraryStudent } from '../../services/library.service';

@Component({
  selector: 'app-library-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-students.component.html',
  styleUrls: ['./library-students.component.css']
})
export class LibraryStudentsComponent implements OnInit {
  students: LibraryStudent[] = [];
  filteredStudents: LibraryStudent[] = [];
  searchTerm = '';
  filterStatus = 'all';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showAddModal = false;
  showEditModal = false;
  showPaymentHistoryModal = false;
  selectedStudent: LibraryStudent | null = null;
  paymentHistory: any[] = [];

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
  }

  async loadStudents() {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.students = await this.libraryService.getAllStudents();
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error loading students:', error);
      this.errorMessage = 'Failed to load students: ' + error.message;
      this.loading = false;
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
    this.selectedStudent = null;
    this.selectedPhoto = null;
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

      await this.libraryService.updateStudent(this.selectedStudent.id!, this.selectedStudent);
      
      this.successMessage = 'Student updated successfully!';
      this.closeModal();
      await this.loadStudents();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error updating student:', error);
      this.errorMessage = 'Failed to update student: ' + error.message;
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
}
