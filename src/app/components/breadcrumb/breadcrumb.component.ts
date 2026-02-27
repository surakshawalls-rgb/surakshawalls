import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item" *ngFor="let crumb of breadcrumbs; let last = last">
          <a 
            *ngIf="!last" 
            [routerLink]="crumb.url" 
            class="breadcrumb-link"
            [attr.aria-current]="last ? 'page' : null">
            <mat-icon *ngIf="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</mat-icon>
            {{ crumb.label }}
          </a>
          <span *ngIf="last" class="breadcrumb-active">
            <mat-icon *ngIf="crumb.icon" class="breadcrumb-icon">{{ crumb.icon }}</mat-icon>
            {{ crumb.label }}
          </span>
          <mat-icon *ngIf="!last" class="breadcrumb-separator">chevron_right</mat-icon>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-container {
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 8px;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .breadcrumb-link {
      color: #1976d2;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .breadcrumb-link:hover {
      background: rgba(25, 118, 210, 0.08);
      text-decoration: underline;
    }

    .breadcrumb-active {
      color: #424242;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
    }

    .breadcrumb-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .breadcrumb-separator {
      color: #9e9e9e;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 600px) {
      .breadcrumb-container {
        padding: 8px 12px;
      }

      .breadcrumb-item {
        font-size: 12px;
      }

      .breadcrumb-icon,
      .breadcrumb-separator {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  
  // Route labels mapping
  private routeLabels: { [key: string]: { label: string; icon?: string } } = {
    'dashboard': { label: 'Dashboard', icon: 'dashboard' },
    'daily-entry': { label: 'Daily Entry', icon: 'edit_note' },
    'client-ledger': { label: 'Client Ledger', icon: 'people' },
    'labour-ledger': { label: 'Labour Ledger', icon: 'groups' },
    'reports-dashboard': { label: 'Reports Dashboard', icon: 'assessment' },
    'worker-management': { label: 'Workers', icon: 'engineering' },
    'material-purchase': { label: 'Material Purchase', icon: 'shopping_cart' },
    'inventory': { label: 'Inventory', icon: 'inventory_2' },
    'stock-audit': { label: 'Stock Audit', icon: 'fact_check' },
    'library-grid': { label: 'Library Grid', icon: 'view_module' },
    'library-dashboard': { label: 'Library Dashboard', icon: 'dashboard' },
    'library-students': { label: 'Students', icon: 'school' },
    'library-expenses': { label: 'Expenses', icon: 'payments' },
    'library-complaints': { label: 'Complaints', icon: 'feedback' },
    'resources': { label: 'Resources', icon: 'book' },
    'partner-dashboard': { label: 'Partner Dashboard', icon: 'handshake' },
    'company-cash': { label: 'Company Cash', icon: 'account_balance' },
    'partner': { label: 'Partner', icon: 'person' },
    'client-payment': { label: 'Client Payment', icon: 'payments' },
    'supplier-management': { label: 'Supplier Management', icon: 'inventory' },
    
    // Walls module routes
    'walls': { label: 'Suraksha Walls', icon: 'business' },
    'home': { label: 'Home', icon: 'home' },
    'production': { label: 'Production', icon: 'factory' },
    'sales': { label: 'Sales', icon: 'point_of_sale' },
    'stock': { label: 'Stock', icon: 'inventory' },
    'labour': { label: 'Labour', icon: 'construction' },
    'reports': { label: 'Reports', icon: 'bar_chart' },
    'masters': { label: 'Masters', icon: 'settings' },
    'entry': { label: 'Entry', icon: 'add' },
    'raw-materials': { label: 'Raw Materials', icon: 'category' },
    'wages': { label: 'Wage Payment', icon: 'payments' },
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });
    
    // Initial breadcrumb build
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    // Get the child routes
    const children: ActivatedRoute[] = route.children;

    // Return if there are no more children
    if (children.length === 0) {
      return breadcrumbs;
    }

    // Iterate over each child
    for (const child of children) {
      // Get the route path
      const routeURL: string = child.snapshot.url
        .map(segment => segment.path)
        .join('/');

      // Skip empty paths
      if (routeURL !== '') {
        url += `/${routeURL}`;

        // Get label and icon for this route segment
        const routeConfig = this.routeLabels[routeURL] || { label: this.formatLabel(routeURL) };

        // Add breadcrumb
        breadcrumbs.push({
          label: routeConfig.label,
          url: url,
          icon: routeConfig.icon
        });
      }

      // Recursive call
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private formatLabel(route: string): string {
    // Convert kebab-case to Title Case
    return route
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
