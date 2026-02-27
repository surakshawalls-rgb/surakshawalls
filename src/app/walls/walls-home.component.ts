// walls-home.component.ts - Main Entry Point for Suraksha Walls Management App
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { BreadcrumbComponent } from '../components/breadcrumb/breadcrumb.component';

interface ModuleCard {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
  badge?: number;
}

@Component({
  selector: 'app-walls-home',
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
    <div class="walls-home-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>
            <mat-icon class="header-icon">account_balance</mat-icon>
            Suraksha Walls
          </h1>
          <p class="subtitle">Manufacturing Management System</p>
        </div>
      </div>

      <!-- Module Cards -->
      <div class="modules-grid">
        <mat-card 
          *ngFor="let module of modules" 
          class="module-card"
          [style.border-left-color]="module.color"
          (click)="navigateTo(module.route)"
        >
          <mat-card-content>
            <div class="module-icon" [style.background-color]="module.color + '20'">
              <mat-icon [style.color]="module.color">{{ module.icon }}</mat-icon>
              <span *ngIf="module.badge" 
                    class="badge" 
                    [style.background-color]="module.color">
                {{ module.badge }}
              </span>
            </div>
            <h3>{{ module.title }}</h3>
            <p>{{ module.description }}</p>
            <button mat-button [style.color]="module.color">
              Open Module
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .walls-home-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .header {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .header-content {
      text-align: center;
    }

    .header h1 {
      margin: 0;
      color: #2563EB;
      font-size: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }

    .subtitle {
      color: #6B7280;
      margin: 0.5rem 0 0 0;
      font-size: 1.1rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .module-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 4px solid;
      background: white !important;
    }

    .module-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    .module-card mat-card-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .module-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .module-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #EF4444;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: bold;
    }

    .module-card h3 {
      margin: 0;
      color: #1F2937;
      font-size: 1.5rem;
    }

    .module-card p {
      margin: 0;
      color: #6B7280;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .module-card button {
      align-self: flex-start;
      margin-top: auto;
    }

    .module-card button mat-icon {
      margin-left: 0.5rem;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .walls-home-container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.8rem;
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WallsHomeComponent implements OnInit {
  modules: ModuleCard[] = [
    {
      icon: 'dashboard',
      title: 'Dashboard',
      description: 'Overview, today\'s summary, alerts, and quick actions',
      route: '/walls/dashboard',
      color: '#2563EB'
    },
    {
      icon: 'factory',
      title: 'Production',
      description: 'Production entry, history, damage tracking, and reports',
      route: '/walls/production',
      color: '#7C3AED'
    },
    {
      icon: 'point_of_sale',
      title: 'Sales',
      description: 'Sales orders, client management, and payment receipts',
      route: '/walls/sales',
      color: '#059669',
      badge: 5 // Placeholder - will be dynamic
    },
    {
      icon: 'inventory_2',
      title: 'Stock & Purchase',
      description: 'Stock overview, material purchase, and stock audit',
      route: '/walls/stock',
      color: '#DC2626',
      badge: 3 // Placeholder - low stock alerts
    },
    {
      icon: 'engineering',
      title: 'Labour & Workers',
      description: 'Attendance, wage payments, and worker directory',
      route: '/walls/labour',
      color: '#EA580C'
    },
    {
      icon: 'analytics',
      title: 'Reports & Analytics',
      description: 'Financial reports, P&L, cash flow, and exports',
      route: '/walls/reports',
      color: '#0891B2'
    },
    {
      icon: 'settings',
      title: 'Masters & Settings',
      description: 'Product master, material master, and app settings',
      route: '/walls/masters',
      color: '#4B5563'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Load badge counts dynamically
    // - Sales badge: clients with outstanding
    // - Stock badge: items below low stock alert
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
