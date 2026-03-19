import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
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
      actionLabel: 'Open Walls Page',
      description: 'Precast walls, security add-ons, readymade structures, and field-ready fencing solutions.'
    },
    {
      id: 'library',
      name: 'Suraksha Library',
      tagline: 'Professional Study Environment',
      icon: 'menu_book',
      toneClass: 'library-tone',
      internalRoute: '/library',
      actionLabel: 'Open Library',
      description: 'Student-first library platform with seats, resources, and growth-focused study support.'
    },
    {
      id: 'software',
      name: 'Suraksha Software',
      tagline: 'Full Stack & Digital Solutions',
      icon: 'code',
      toneClass: 'software-tone',
      internalRoute: '/software',
      actionLabel: 'Open Software Page',
      description: 'Business software delivery, product engineering, and practical training tracks.'
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

  constructor(private router: Router) {}

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
