import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { format } from 'date-fns';
import { AuthService } from '../../services/auth.service';
import { LibrarySeat, LibraryService } from '../../services/library.service';
import { RegistrationDialogComponent } from '../library-grid/registration-dialog.component';
import { LibFooterComponent } from '../../components/lib-footer/lib-footer.component';

@Component({
  selector: 'app-library-public',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatTabsModule, MatDialogModule, MatSnackBarModule, LibFooterComponent],
  templateUrl: './library-public.component.html',
  styleUrls: ['./library-public.component.css']
})
export class LibraryPublicComponent implements OnInit {
  private readonly publicRegistrationSeat: LibrarySeat = {
    seat_no: 0,
    updated_at: ''
  };
  
  isLoggedIn:boolean = false;

  facilities = [
    { icon: 'event_seat', title: 'Comfortable Seating', description: 'Spacious study tables with comfortable chairs' },
    { icon: 'ac_unit', title: 'Air Conditioned', description: 'Cool and comfortable environment' },
    { icon: 'lightbulb', title: 'Proper Lighting', description: 'Well-lit study area for long hours' },
    { icon: 'wifi', title: 'Free WiFi', description: 'High-speed internet access' },
    { icon: 'local_drink', title: 'Drinking Water', description: 'RO water facility' },
    { icon: 'wc', title: 'Clean Washrooms', description: 'Well-maintained facilities' },
    { icon: 'lock', title: 'Secure Lockers', description: 'Personal storage available' },
    { icon: 'local_parking', title: 'Parking', description: 'Two-wheeler parking space' }
  ];

  plans = [
    { name: 'Daily Pass', duration: '1 Day', price: 10, features: ['Basic seating', 'Library access', 'WiFi'] },
    { name: 'Monthly', duration: '30 Days', price: 400, features: ['Full access', 'Locker facility', 'Digital library'] },
    { name: 'Quarterly', duration: '3 Months', price: 1100, features: ['All monthly features', 'Priority seating', 'Extended hours'], popular: true },
    { name: 'Yearly', duration: '12 Months', price: 3000, features: ['All quarterly features', 'VIP seating', 'Free printing'] }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private membershipService: LibraryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn;
  }

  navigateToResources() {
    if (this.isLoggedIn) {
      this.router.navigate(['/resources']);
    } else {
      this.router.navigate(['/library/resources']);
    }
  }

  navigateToInquiry() {
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

  goToLogin() {
    this.router.navigate(['/login']);
  }

  contactWhatsApp() {
    window.open('https://wa.me/919506629814?text=Hi, I am interested in Suraksha Library membership', '_blank');
  }

  callNow() {
    window.location.href = 'tel:9506629814';
  }
}
