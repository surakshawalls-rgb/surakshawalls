import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface TrainingTrack {
  title: string;
  icon: string;
  description: string;
  outcome: string;
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

interface AboutHighlight {
  title: string;
  description: string;
  icon: string;
}

interface DeliveryStep {
  title: string;
  description: string;
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

  aboutHighlights: AboutHighlight[] = [
    {
      title: 'Business-first execution',
      description: 'We design software around actual workflows, reporting needs, approvals, and operational clarity.',
      icon: 'business_center'
    },
    {
      title: 'Clean and maintainable delivery',
      description: 'Our focus stays on practical architecture, stable releases, and systems that are easy to extend later.',
      icon: 'verified'
    },
    {
      title: 'Direct collaboration',
      description: 'Clients work with a delivery-focused team that communicates clearly from planning through launch and support.',
      icon: 'handshake'
    }
  ];

  deliverySteps: DeliveryStep[] = [
    {
      title: 'Discovery and planning',
      description: 'We understand the business problem, define scope, and map the right platform and delivery approach.'
    },
    {
      title: 'Design and development',
      description: 'We build the product with attention to usability, performance, and maintainable code structure.'
    },
    {
      title: 'Launch and support',
      description: 'We help with deployment, production readiness, fixes, and the next phase of product improvements.'
    }
  ];

  trainingTracks: TrainingTrack[] = [
    {
      title: 'Frontend and UI Engineering',
      icon: 'web',
      description: 'Master the building blocks of modern user interfaces — from core HTML, CSS, and JavaScript to Angular framework and component architecture for production applications.',
      outcome: 'Junior Front-end Developer / UI Engineer',
      topics: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Angular', 'UI architecture']
    },
    {
      title: 'Java Full Stack Development',
      icon: 'code',
      description: 'Build complete Java-based web applications with core language fundamentals, server-side rendering with JSP and Servlet, JDBC, and relational database integration.',
      outcome: 'Java Full Stack Developer',
      topics: ['Core Java', 'Java Streams', 'JSP', 'Servlet', 'JDBC', 'SQL']
    },
    {
      title: 'Spring Ecosystem and Data',
      icon: 'storage',
      description: 'Learn the Spring and Spring Boot ecosystem for building production-grade REST APIs, JPA-based data access, Hibernate ORM, and MongoDB integration.',
      outcome: 'Backend Developer / Spring API Engineer',
      topics: ['Spring', 'Spring Boot', 'Spring Data JPA', 'Hibernate', 'MongoDB', 'REST APIs']
    },
    {
      title: 'Python and AI Productivity',
      icon: 'smart_toy',
      description: 'Apply Python to practical automation use-cases and modern AI workflows — including ChatGPT integration, prompt engineering, and generative AI tooling for real productivity gains.',
      outcome: 'Python Developer / AI-assisted Engineer',
      topics: ['Python basics', 'ChatGPT workflows', 'Generative AI tooling', 'Prompt patterns', 'Automation basics']
    },
    {
      title: 'Dev Workflow and Delivery',
      icon: 'build_circle',
      description: 'Complete the full delivery loop with build tools, CI/CD pipelines, Git collaboration, structured deployment, and interview preparation for placement-readiness.',
      outcome: 'Deployment-ready Full Stack Developer',
      topics: ['Maven', 'Gradle', 'Jenkins', 'Git collaboration', 'Project deployment', 'Interview preparation']
    }
  ];

  developmentServices: DevelopmentService[] = [
    {
      title: 'Web Applications and Portals',
      icon: 'language',
      description: 'We build business websites, customer portals, and operational dashboards — clean UI, fast performance, and structured for daily real-world use.',
      deliverables: ['Multi-page corporate websites', 'Customer and staff portals', 'Admin and operations dashboards', 'Payment, booking, and inquiry flows']
    },
    {
      title: 'Mobile Application Development',
      icon: 'phone_android',
      description: 'Production-ready apps for Android and iOS — built for customer-facing products, field workflows, and team communication.',
      deliverables: ['Cross-platform Android and iOS builds', 'Offline support with backend sync', 'Push alerts and in-app notifications', 'Play Store and App Store release-ready']
    },
    {
      title: 'Desktop and Internal Software',
      icon: 'desktop_windows',
      description: 'Purpose-built desktop software for factories, offices, and field teams — designed around the approvals, data entry, and reports your staff actually needs.',
      deliverables: ['Windows or cross-platform builds', 'Role-based access and approval flows', 'Data entry, reports, and export modules', 'Cloud or API backend integration']
    },
    {
      title: 'Full Product Delivery and Support',
      icon: 'hub',
      description: 'For teams who need a reliable technology partner — we own architecture, iterative delivery, testing, and long-term product improvements end to end.',
      deliverables: ['Technical scoping and product planning', 'Sprint delivery with regular check-ins', 'QA testing and production deployment', 'Post-launch support and new feature releases']
    }
  ];

  clients: ClientShowcase[] = [
    {
      name: 'Suraksha Walls',
      url: 'https://www.surakshawalls.shop',
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
      url: 'https://www.softstepscarpet.store',
      summary: 'Ecommerce-focused storefront for carpet and flooring products.'
    }
  ];

  switchFocus(mode: 'development' | 'training') {
    this.focusMode = mode;
  }
}
