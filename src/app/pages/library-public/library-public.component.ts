import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-library-public',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatTabsModule],
  templateUrl: './library-public.component.html',
  styleUrls: ['./library-public.component.css']
})
export class LibraryPublicComponent implements OnInit {
  
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
    { name: 'Daily Pass', duration: '1 Day', price: 50, features: ['Basic seating', 'Library access', 'WiFi'] },
    { name: 'Monthly', duration: '30 Days', price: 1000, features: ['Full access', 'Locker facility', 'Digital library'] },
    { name: 'Quarterly', duration: '3 Months', price: 2500, features: ['All monthly features', 'Priority seating', 'Extended hours'], popular: true },
    { name: 'Yearly', duration: '12 Months', price: 8000, features: ['All quarterly features', 'VIP seating', 'Free printing'] }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn;
  }

  navigateToResources() {
    if (this.isLoggedIn) {
      this.router.navigate(['/resources']);
    } else {
      this.router.navigate(['/library/public-resources']);
    }
  }

  navigateToInquiry() {
    this.router.navigate(['/library/inquiry']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  contactWhatsApp() {
    window.open('https://wa.me/9506629814?text=Hi, I am interested in Suraksha Library membership', '_blank');
  }

  callNow() {
    window.location.href = 'tel:9506629814';
  }
}
