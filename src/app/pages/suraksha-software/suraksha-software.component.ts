import { Component, OnDestroy, OnInit } from '@angular/core';
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

interface ShowcaseSlide {
  title: string;
  summary: string;
  metric: string;
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

interface HeroStat {
  value: string;
  label: string;
}

interface AboutStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-suraksha-software',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './suraksha-software.component.html',
  styleUrls: ['./suraksha-software.component.css']
})
export class SurakshaSoftwareComponent implements OnInit, OnDestroy {
  focusMode: 'development' | 'training' = 'development';
  currentSlide = 0;
  expandedServiceIndex: number | null = null;
  private slideTimer?: ReturnType<typeof setInterval>;

  heroStats: HeroStat[] = [
    { value: '8+', label: 'Service Areas' },
    { value: '5', label: 'Training Tracks' },
    { value: '100+', label: 'Clients Served' },
    { value: '24×7', label: 'Support' }
  ];

  aboutStats: AboutStat[] = [
    { value: '100+', label: 'Projects' },
    { value: '5+', label: 'Years' },
    { value: '24×7', label: 'Support' }
  ];

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
    },
    {
      title: 'C and C++ Programming',
      icon: 'memory',
      description: 'Build a deep understanding of systems-level programming — from C fundamentals, pointers, and memory management to C++ Object-Oriented Programming, templates, and the Standard Template Library.',
      outcome: 'Systems Developer / Embedded Engineer',
      topics: ['C fundamentals', 'Pointers & memory', 'Data structures in C', 'C++ OOP', 'STL', 'File I/O']
    },
    {
      title: 'Go and Cloud Backend',
      icon: 'cloud_queue',
      description: 'Learn Go (Golang) for building high-performance, concurrent backend systems — including REST API development, goroutines, channels, Docker fundamentals, and cloud deployment basics.',
      outcome: 'Go Backend Developer / Cloud Engineer',
      topics: ['Go basics', 'Goroutines & channels', 'Go REST APIs', 'Docker', 'Kubernetes basics', 'Cloud deploy']
    },
    {
      title: 'React and Frontend Frameworks',
      icon: 'widgets',
      description: 'Master React.js for building modern interactive web applications, state management patterns with Redux and Context API, and Next.js for server-side rendering and full-stack React development.',
      outcome: 'React Developer / Frontend Engineer',
      topics: ['React basics', 'Hooks & Context', 'Redux', 'Next.js', 'API Integration', 'Component design']
    }
  ];

  developmentServices: DevelopmentService[] = [
    {
      title: 'Web Applications and Portals',
      icon: 'language',
      description: 'Business websites, corporate pages, and operational portals with clear UX and scalable architecture.',
      deliverables: ['Multi-page corporate websites', 'Customer and staff portals', 'Admin and operations dashboards', 'Payment, booking, and inquiry flows']
    },
    {
      title: 'Software Development',
      icon: 'code',
      description: 'Custom software systems for workflow automation, approvals, inventory, and reporting.',
      deliverables: ['Business process automation', 'Data-driven dashboards', 'Role-based user access', 'Secure backend integrations']
    },
    {
      title: 'App Development',
      icon: 'phone_android',
      description: 'Android and iOS solutions for customer products, internal teams, and field operations.',
      deliverables: ['Cross-platform app builds', 'Offline-ready workflows', 'Push notification setup', 'Store release support']
    },
    {
      title: 'E-commerce Solutions',
      icon: 'shopping_cart',
      description: 'Online commerce platforms designed for discovery, trust, and conversion.',
      deliverables: ['Catalog and product setup', 'Order and payment flow', 'Customer account modules', 'Performance and SEO baseline']
    },
    {
      title: 'Branding and Promotion',
      icon: 'campaign',
      description: 'Promotion strategy and online brand positioning to strengthen digital recognition.',
      deliverables: ['Messaging and positioning', 'Campaign content planning', 'Lead-driven landing pages', 'Conversion-focused updates']
    },
    {
      title: 'SEO and SMO',
      icon: 'trending_up',
      description: 'Sustainable visibility strategy through search optimization and social discoverability.',
      deliverables: ['Keyword-led page structure', 'Technical SEO fixes', 'Local discoverability setup', 'Social profile alignment']
    },
    {
      title: 'Bulk SMS Services',
      icon: 'sms',
      description: 'High-volume communication for customer alerts, campaigns, and transactional messages.',
      deliverables: ['Campaign-ready templates', 'Target segment messaging', 'Delivery status support', 'Regulatory-safe communication flow']
    },
    {
      title: 'Domain and Hosting',
      icon: 'dns',
      description: 'Domain purchase, hosting setup, SSL, and reliable deployment for business continuity.',
      deliverables: ['Domain and DNS setup', 'Hosting and server configuration', 'SSL and security setup', 'Deployment and uptime monitoring']
    }
  ];

  showcaseSlides: ShowcaseSlide[] = [
    {
      title: 'Web Systems That Convert',
      summary: 'Business websites and portals designed to turn traffic into leads and business inquiries.',
      metric: 'Lead Focus'
    },
    {
      title: 'Operational Software Delivery',
      summary: 'Workflow-based systems for approvals, reporting, and visibility across business units.',
      metric: 'Execution Focus'
    },
    {
      title: 'Mobile and Field Enablement',
      summary: 'Apps that support customer interaction, field work, and real-time team communication.',
      metric: 'Mobility Focus'
    },
    {
      title: 'Scale With Suraksha Software',
      summary: 'From planning to deployment and support, we deliver with speed and accountability.',
      metric: 'Growth Focus'
    }
  ];

  movingTags: string[] = [
    'Web Development',
    'Software Engineering',
    'App Development',
    'SEO and SMO',
    'Branding and Promotion',
    'E-commerce Solutions',
    'Bulk SMS',
    'Domain and Hosting'
  ];

  ngOnInit() {
    this.slideTimer = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.showcaseSlides.length;
    }, 3500);
  }

  ngOnDestroy() {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  switchFocus(mode: 'development' | 'training') {
    this.focusMode = mode;
  }

  toggleService(index: number) {
    this.expandedServiceIndex = this.expandedServiceIndex === index ? null : index;
  }
}
