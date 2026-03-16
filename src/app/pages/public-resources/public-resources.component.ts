import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { DigitalLibraryService } from '../../services/digital-library.service';
import { LibrarySeat, LibraryService } from '../../services/library.service';
import { RegistrationDialogComponent } from '../library-grid/registration-dialog.component';

@Component({
  selector: 'app-public-resources',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './public-resources.component.html',
  styleUrls: ['./public-resources.component.css']
})
export class PublicResourcesComponent implements OnInit {
  private readonly publicRegistrationSeat: LibrarySeat = {
    seat_no: 0,
    updated_at: ''
  };
  
  books: any[] = [];
  filteredBooks: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';

  categories = [
    { value: 'all', label: 'All Books' },
    { value: 'competitive', label: 'Competitive Exams' },
    { value: 'academic', label: 'Academic' },
    { value: 'reference', label: 'Reference' },
    { value: 'magazines', label: 'Magazines' }
  ];

  constructor(
    private router: Router,
    private digitalLibraryService: DigitalLibraryService,
    private membershipService: LibraryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    try {
      this.books = await this.digitalLibraryService.getBooks();
      this.filteredBooks = this.books;
    } catch (error) {
      console.error('Error loading books:', error);
      // For demo, show sample books
      this.books = this.getSampleBooks();
      this.filteredBooks = this.books;
    }
  }

  getSampleBooks() {
    return [
      { id: 1, title: 'UPSC General Studies', author: 'Laxmikant', category: 'competitive', available: true, description: 'Complete guide for UPSC preparation' },
      { id: 2, title: 'Indian Polity', author: 'M. Laxmikant', category: 'competitive', available: true, description: 'Comprehensive study of Indian Constitution' },
      { id: 3, title: 'Mathematics Class 12', author: 'R.D. Sharma', category: 'academic', available: false, description: 'Complete mathematics for class 12' },
      { id: 4, title: 'Physics Vol 1', author: 'HC Verma', category: 'academic', available: true, description: 'Concepts of Physics Volume 1' },
      { id: 5, title: 'English Grammar', author: 'Wren & Martin', category: 'reference', available: true, description: 'High School English Grammar' },
      { id: 6, title: 'Current Affairs 2026', author: 'Various', category: 'magazines', available: true, description: 'Monthly current affairs compilation' },
      { id: 7, title: 'Indian Economy', author: 'Ramesh Singh', category: 'competitive', available: true, description: 'For UPSC Civil Services' },
      { id: 8, title: 'History of Modern India', author: 'Bipin Chandra', category: 'competitive', available: false, description: 'Modern Indian history for competitive exams' }
    ];
  }

  filterBooks() {
    let filtered = this.books;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term)
      );
    }

    this.filteredBooks = filtered;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterBooks();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  inquireForMembership() {
    const isMobile = window.innerWidth <= 768;
    const dialogRef = this.dialog.open(RegistrationDialogComponent, {
      width: isMobile ? '100vw' : '750px',
      maxWidth: isMobile ? '100vw' : '95vw',
      maxHeight: '90vh',
      data: {
        seat: this.publicRegistrationSeat,
        canViewPersonalDetails: true,
        mode: 'public_request',
        title: '📝 Register for Library Membership',
        submitLabel: '✓ Submit Request',
        allowExistingStudentLookup: false
      },
      disableClose: false,
      autoFocus: true,
      panelClass: ['registration-dialog', 'custom-dialog-container'],
      hasBackdrop: true,
      backdropClass: 'custom-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      const response = await this.membershipService.createRegistrationRequest({
        name: result.name,
        mobile: result.mobile,
        emergency_contact: result.emergency_contact || null,
        emergency_contact_name: result.emergency_contact_name || null,
        address: result.address,
        dob: result.dob ? format(result.dob, 'yyyy-MM-dd') : null,
        gender: result.gender,
        requested_start_date: format(result.startDate, 'yyyy-MM-dd'),
        requested_end_date: format(result.endDate, 'yyyy-MM-dd'),
        requested_shift_type: result.selectedShift,
        registration_fee_amount: Number(result.registration_fee_paid || 0),
        seat_fee_amount: Number(result.feeAmount || 0),
        payment_mode: result.paymentMode,
        notes: result.notes || null
      });

      if (response.success) {
        this.snackBar.open(
          '✅ Membership request submitted. Payment will be verified manually before seat allocation.',
          'Close',
          { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
        );
        return;
      }

      this.snackBar.open(
        `❌ ${response.error || 'Failed to submit membership request'}`,
        'Close',
        { duration: 6000, horizontalPosition: 'center', verticalPosition: 'top' }
      );
    });
  }
}
