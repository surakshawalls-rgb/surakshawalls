import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

interface Platform {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  toneClass: string;
  actionLabel: string;
  externalUrl?: string;
  internalRoute?: string;
  description: string;
}

interface HomeStat {
  value: string;
  label: string;
  icon: string;
}

interface SpotlightCard {
  title: string;
  copy: string;
  icon: string;
}

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './public-home.component.html',
  styleUrls: ['./public-home.component.css']
})
export class PublicHomeComponent {

  platforms: Platform[] = [
    {
      id: 'walls',
      name: 'Suraksha Walls',
      tagline: 'Boundary Wall & Precast RCC Solutions',
      icon: 'home_work',
      toneClass: 'walls-tone',
      internalRoute: '/suraksha-walls',
      actionLabel: 'Explore Walls',
      description: 'Precast walls, security add-ons, readymade structures, and field-ready fencing solutions.'
    },
    {
      id: 'library',
      name: 'Suraksha Library',
      tagline: 'Professional Study Environment',
      icon: 'menu_book',
      toneClass: 'library-tone',
      internalRoute: '/library',
      actionLabel: 'Explore Library',
      description: 'Student-first library platform with seats, resources, and growth-focused study support.'
    },
    {
      id: 'software',
      name: 'Suraksha Software',
      tagline: 'Full Stack & Digital Solutions',
      icon: 'code',
      toneClass: 'software-tone',
      internalRoute: '/software',
      actionLabel: 'Explore Software',
      description: 'Software engineering, app delivery, digital growth support, and practical training tracks.'
    },
    {
      id: 'carpet',
      name: 'Soft Step Carpet',
      tagline: 'Premium Interior Products',
      icon: 'storefront',
      toneClass: 'carpet-tone',
      externalUrl: 'https://www.softstepscarpet.store/',
      actionLabel: 'Visit Store',
      description: 'Interior and flooring products crafted for homes, offices, and commercial spaces.'
    }
  ];

  gatewayTags = [
    'Suraksha Walls',
    'Suraksha Library',
    'Suraksha Software',
    'Soft Step Carpet',
    'Unified Login',
    'Fast Access'
  ];

  stats: HomeStat[] = [
    { value: '4+', label: 'Active Platforms', icon: 'hub' },
    { value: '100+', label: 'Clients Served', icon: 'groups' },
    { value: '24x7', label: 'Digital Presence', icon: 'schedule' }
  ];

  spotlightCards: SpotlightCard[] = [
    {
      title: 'Unified Ecosystem',
      copy: 'From construction operations to education and software delivery, everything is connected with one smart public gateway.',
      icon: 'apps'
    },
    {
      title: 'Fast Navigation',
      copy: 'No extra steps. Open your required platform directly and continue with focused workflows.',
      icon: 'bolt'
    },
    {
      title: 'Mobile Friendly',
      copy: 'Designed to work smoothly on phones, tablets, and desktops with responsive motion-rich cards.',
      icon: 'smartphone'
    }
  ];

  loginEmail = '';
  loginPassword = '';
  loginLoading = false;
  loginError = '';

  constructor(private router: Router, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  async onLogin() {
    const email = this.loginEmail.trim().toLowerCase();
    const password = this.loginPassword;

    if (!email || !password) {
      this.loginError = 'Please enter your email and password.';
      return;
    }

    this.loginLoading = true;
    this.loginError = '';
    this.cdr.detectChanges();

    try {
      const result = await this.authService.login(email, password);
      if (result.success) {
        const user = this.authService.currentUserValue;
        if (!user) return;
        if (user.modules.includes('library') && !user.modules.includes('manufacturing')) {
          this.router.navigate(['/library-grid']);
        } else if (user.modules.includes('manufacturing')) {
          this.router.navigate(['/reports-dashboard']);
        } else {
          this.router.navigate(['/reports-dashboard']);
        }
      } else {
        this.loginError = result.error || 'Login failed. Please check your credentials.';
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      this.loginError = error.message || 'An unexpected error occurred. Please try again.';
      this.cdr.detectChanges();
    } finally {
      this.loginLoading = false;
      this.cdr.detectChanges();
    }
  }

  navigateTo(platform: Platform) {
    if (platform.externalUrl) {
      window.open(platform.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (platform.internalRoute) {
      this.router.navigate([platform.internalRoute]);
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
