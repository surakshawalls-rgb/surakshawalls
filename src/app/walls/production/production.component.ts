// production.component.ts - Production Module Main Page
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

interface ProductionFeature {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: number;
}

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    BreadcrumbComponent
  ],
  template: `
    <app-breadcrumb></app-breadcrumb>
    <div class="production-container">
      <!-- Header -->
      <div class="production-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>🏭 Production Management</h1>
          <p>Manage production entries, batches, and quality control</p>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="features-grid">
        <mat-card 
          *ngFor="let feature of features" 
          class="feature-card"
          (click)="navigate(feature.route)"
          [style.border-left-color]="feature.color"
        >
          <mat-card-content>
            <div class="card-header">
              <div class="icon-container" [style.background-color]="feature.color + '20'">
                <mat-icon [style.color]="feature.color">{{ feature.icon }}</mat-icon>
              </div>
              <span class="badge" *ngIf="feature.badge" [matBadge]="feature.badge" matBadgeColor="warn"></span>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
            <mat-icon class="arrow">arrow_forward</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .production-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .production-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .production-header h1 {
      margin: 0;
      color: #1F2937;
      font-size: 1.75rem;
    }

    .production-header p {
      margin: 0.25rem 0 0 0;
      color: #6B7280;
      font-size: 0.875rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .feature-card mat-card-content {
      padding: 1.5rem !important;
      position: relative;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .icon-container {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-container mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .feature-card h3 {
      margin: 0 0 0.5rem 0;
      color: #1F2937;
      font-size: 1.25rem;
    }

    .feature-card p {
      margin: 0;
      color: #6B7280;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .arrow {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .production-container {
        padding: 1rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductionComponent {
  features: ProductionFeature[] = [
    {
      title: 'Production Entry',
      description: 'Record daily production with materials, workers, and output details',
      icon: 'add_box',
      route: '/walls/production/entry',
      color: '#7C3AED'
    },
    {
      title: 'Batch Tracking',
      description: 'Track production batches, status, and history',
      icon: 'inventory',
      route: '/walls/production/batches',
      color: '#2563EB',
      badge: 8
    },
    {
      title: 'Quality Control',
      description: 'Record quality checks, rejection rates, and issues',
      icon: 'verified',
      route: '/walls/production/quality',
      color: '#059669'
    },
    {
      title: 'Production History',
      description: 'View and analyze past production entries',
      icon: 'history',
      route: '/walls/production/history',
      color: '#EA580C'
    }
  ];

  constructor(private router: Router) {}

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  goBack(): void {
    this.router.navigate(['/walls/home']);
  }
}
