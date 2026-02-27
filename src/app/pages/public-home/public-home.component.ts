import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface Business {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  gradientClass: string;
  externalUrl?: string;
  internalRoute?: string;
  description: string;
}

interface LoginOption {
  title: string;
  description: string;
  icon: string;
  gradientClass: string;
  route: string;
}

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './public-home.component.html',
  styleUrls: ['./public-home.component.css']
})
export class PublicHomeComponent {
  
  businesses: Business[] = [
    {
      id: 'walls',
      name: 'Suraksha Walls',
      tagline: 'Boundary Wall & Precast RCC Solutions',
      icon: 'domain',
      gradientClass: 'walls-gradient',
      externalUrl: 'https://www.surakshawalls.shop/surakshawalls',
      description: 'Leading provider of Boundary Walls, Precast RCC Walls, Fencing Poles, Cement Articles and Barbed Wire Fencing in Bhadohi.'
    },
    {
      id: 'library',
      name: 'Suraksha Library',
      tagline: 'Professional Study Environment',
      icon: 'menu_book',
      gradientClass: 'library-gradient',
      internalRoute: '/public-resources',
      description: 'Premium study environment with comfortable seating, AC rooms, digital resources, and expert guidance for competitive exam preparation.'
    },
    {
      id: 'software',
      name: 'Suraksha Software',
      tagline: 'Full Stack & Digital Solutions',
      icon: 'code',
      gradientClass: 'software-gradient',
      externalUrl: 'https://www.surakshawalls.shop',
      description: 'Custom software development, web applications, mobile apps, and complete digital transformation solutions for businesses.'
    },
    {
      id: 'carpet',
      name: 'Soft Step Carpet',
      tagline: 'Premium Interior Products',
      icon: 'deck',
      gradientClass: 'carpet-gradient',
      externalUrl: 'https://www.softstepscarpet.store/',
      description: 'High-quality carpets, rugs, and interior decoration products. Transform your space with premium flooring solutions.'
    }
  ];

  loginOptions: LoginOption[] = [
    {
      title: 'Admin Login',
      description: 'Access complete system with full permissions',
      icon: 'admin_panel_settings',
      gradientClass: 'admin-card',
      route: '/login'
    },
    {
      title: 'Student Login',
      description: 'Access library resources and study materials',
      icon: 'school',
      gradientClass: 'student-card',
      route: '/login'
    },
    {
      title: 'Staff Login',
      description: 'Access based on your assigned role',
      icon: 'badge',
      gradientClass: 'staff-card',
      route: '/login'
    }
  ];

  testimonials = [
    {
      text: 'Suraksha Walls delivered our boundary wall faster and stronger than expected. Highly recommended for all construction needs in Bhadohi!',
      author: 'Ramesh Singh',
      designation: 'Farmer, Bhadohi'
    },
    {
      text: 'The library is peaceful and well-equipped. The digital resources and study environment helped me crack my competitive exams!',
      author: 'Priya Sharma',
      designation: 'Civil Services Aspirant'
    },
    {
      text: 'Soft Steps Carpet quality is unmatched. Our hotel guests love the new look and the comfort. Best carpet supplier in Bhadohi!',
      author: 'Vikram Gupta',
      designation: 'Hotel Manager'
    },
    {
      text: 'Software training was practical and job-oriented. The team delivered exactly what we needed. Great experience working with Suraksha Software!',
      author: 'Amit Verma',
      designation: 'Software Developer'
    }
  ];
  
  activeTestimonial = 0;

  whatsappNumbers = [
    { number: '919506629814', display: '9506629814' },
    { number: '918090272727', display: '8090272727' }
  ];

  constructor(private router: Router) {}

  navigateTo(business: Business) {
    if (business.externalUrl) {
      window.open(business.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (business.internalRoute) {
      this.router.navigate([business.internalRoute]);
    }
  }

  navigateToRoute(path: string) {
    this.router.navigate([path]);
  }

  openWhatsApp(number: string) {
    window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
  }

  prevTestimonial() {
    this.activeTestimonial = (this.activeTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
  }

  nextTestimonial() {
    this.activeTestimonial = (this.activeTestimonial + 1) % this.testimonials.length;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
