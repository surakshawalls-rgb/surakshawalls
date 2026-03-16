import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface TrainingTrack {
  title: string;
  icon: string;
  topics: string[];
}

interface DevelopmentService {
  title: string;
  icon: string;
  description: string;
  deliverables: string[];
}

interface ClientShowcase {
  name: string;
  url: string;
  summary: string;
}

@Component({
  selector: 'app-suraksha-software',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './suraksha-software.component.html',
  styleUrls: ['./suraksha-software.component.css']
})
export class SurakshaSoftwareComponent {
  focusMode: 'development' | 'training' = 'development';

  trainingTracks: TrainingTrack[] = [
    {
      title: 'Frontend and UI Engineering',
      icon: 'web',
      topics: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Angular', 'UI architecture']
    },
    {
      title: 'Java Full Stack Development',
      icon: 'code',
      topics: ['Core Java', 'Java Streams', 'JSP', 'Servlet', 'JDBC', 'SQL']
    },
    {
      title: 'Spring Ecosystem and Data',
      icon: 'storage',
      topics: ['Spring', 'Spring Boot', 'Spring Data JPA', 'Hibernate', 'MongoDB', 'REST APIs']
    },
    {
      title: 'Python and AI Productivity',
      icon: 'smart_toy',
      topics: ['Python basics', 'ChatGPT workflows', 'Generative AI tooling', 'Prompt patterns', 'Automation basics']
    },
    {
      title: 'Dev Workflow and Delivery',
      icon: 'build_circle',
      topics: ['Maven', 'Gradle', 'Jenkins', 'Git collaboration', 'Project deployment', 'Interview preparation']
    }
  ];

  developmentServices: DevelopmentService[] = [
    {
      title: 'Website Design and Development',
      icon: 'language',
      description: 'Business websites, portals, and admin dashboards designed for speed, SEO, and conversions.',
      deliverables: ['Landing pages', 'CMS or custom web apps', 'Payment and form integrations']
    },
    {
      title: 'Android and iOS Applications',
      icon: 'phone_android',
      description: 'Feature-rich mobile applications for operations, customers, and field teams.',
      deliverables: ['Native-like experience', 'Push notifications', 'Store-ready builds']
    },
    {
      title: 'Desktop and Internal Tools',
      icon: 'desktop_windows',
      description: 'Desktop and hybrid applications for internal workflows, reporting, and automation.',
      deliverables: ['Cross-platform builds', 'Role-based access', 'Offline-friendly modules']
    },
    {
      title: 'End-to-End Product Partnership',
      icon: 'hub',
      description: 'From idea to deployment and support, we handle architecture, development, testing, and upgrades.',
      deliverables: ['Technical planning', 'Agile execution', 'Maintenance and scaling support']
    }
  ];

  clients: ClientShowcase[] = [
    {
      name: 'Suraksha Walls',
      url: 'https://www.surakshawalls.shop/',
      summary: 'Construction and precast solutions website with brand and lead flow support.'
    },
    {
      name: 'Suraksha Library',
      url: 'https://www.surakshawalls.space',
      summary: 'Learning and library-focused digital presence for students and operations.'
    },
    {
      name: 'All India Fire Solutions',
      url: 'https://www.allindiafiresolutions.com',
      summary: 'Business site for fire safety products and service outreach.'
    },
    {
      name: 'Square Associates',
      url: 'https://www.squareassociates.org',
      summary: 'Professional services website with clear service communication.'
    },
    {
      name: 'Soft Steps Carpet',
      url: 'https://www.softstepscarpet.store/',
      summary: 'Ecommerce-focused storefront for carpet and flooring products.'
    }
  ];

  switchFocus(mode: 'development' | 'training') {
    this.focusMode = mode;
  }
}
