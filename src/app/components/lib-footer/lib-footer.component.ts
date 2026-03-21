import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lib-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <footer class="lib-footer">
      <div class="footer-inner">

        <div class="footer-brand">
          <div class="brand-logo">
            <mat-icon>menu_book</mat-icon>
          </div>
          <div class="brand-text">
            <span class="brand-name">Suraksha Library</span>
            <span class="brand-tag">Premium Study Environment</span>
          </div>
        </div>

        <div class="footer-links">
          <!-- Always visible to everyone -->
          <a routerLink="/library" class="footer-link">
            <mat-icon>home</mat-icon>Library Home
          </a>
          <a routerLink="/library-grid" class="footer-link">
            <mat-icon>view_module</mat-icon>Seat Grid
          </a>

          <!-- Admin/Manager: clickable. Student: disabled with tooltip -->
          <ng-container *ngIf="!isStudent; else dashboardDisabled">
            <a routerLink="/library-dashboard" class="footer-link">
              <mat-icon>dashboard</mat-icon>Dashboard
            </a>
          </ng-container>
          <ng-template #dashboardDisabled>
            <span class="footer-link footer-link--disabled"
                  title="Students are not allowed to access this section">
              <mat-icon>dashboard</mat-icon>Dashboard
              <mat-icon class="lock-icon">lock</mat-icon>
            </span>
          </ng-template>

          <ng-container *ngIf="!isStudent; else studentsDisabled">
            <a routerLink="/library-students" class="footer-link">
              <mat-icon>school</mat-icon>Students
            </a>
          </ng-container>
          <ng-template #studentsDisabled>
            <span class="footer-link footer-link--disabled"
                  title="Students are not allowed to access this section">
              <mat-icon>school</mat-icon>Students
              <mat-icon class="lock-icon">lock</mat-icon>
            </span>
          </ng-template>

          <!-- Student-only quick links -->
          <ng-container *ngIf="isStudent">
            <div class="student-links-divider"></div>
            <a routerLink="/library" class="footer-link footer-link--student">
              <mat-icon>how_to_reg</mat-icon>Mark My Attendance
            </a>
            <a routerLink="/library-complaints" class="footer-link footer-link--student">
              <mat-icon>report_problem</mat-icon>Lodge Complaint
            </a>
            <a routerLink="/library/resources" class="footer-link footer-link--student">
              <mat-icon>auto_stories</mat-icon>Library Resources
            </a>
            <button type="button" (click)="reload()" class="footer-link footer-link--student footer-link--refresh">
              <mat-icon>refresh</mat-icon>Refresh
            </button>
          </ng-container>
        </div>

        <div class="footer-contact">
          <div class="contact-row">
            <mat-icon>location_on</mat-icon>
            <span>Near Union Bank, Mishra Bhawan, Mahajuda, Suriyawan, Bhadohi 221404</span>
          </div>
          <div class="contact-row">
            <mat-icon>schedule</mat-icon>
            <span>Open 7 AM – 8 PM · Every day</span>
          </div>
          <div class="contact-row">
            <mat-icon>phone</mat-icon>
            <span>+91 9506629814 &nbsp;·&nbsp; +91 8090272727</span>
          </div>
        </div>

      </div>

      <div class="footer-bottom">
        <span>© {{ currentYear }} Suraksha Library · Suraksha Group · All rights reserved</span>
      </div>
    </footer>
  `,
  styles: [`
    .lib-footer {
      background: linear-gradient(135deg, #050e1d 0%, #0d2137 60%, #062b17 100%);
      color: rgba(255, 255, 255, 0.75);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin-top: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
    }

    .footer-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 40px 28px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 40px;
      align-items: start;
    }

    /* Brand */
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-logo mat-icon {
      color: #10b981;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .brand-name {
      font-family: 'Syne', sans-serif;
      font-size: 1rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
    .brand-tag {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.45);
      white-space: nowrap;
    }

    /* Links */
    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
      align-items: center;
      justify-content: center;
    }
    .footer-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 500;
      padding: 5px 10px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    .footer-link mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      line-height: 15px;
    }
    .footer-link:hover {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    /* Disabled nav links (admin-only pages - students see but can't use) */
    .footer-link--disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: auto;
    }
    .footer-link--disabled:hover {
      color: rgba(255, 255, 255, 0.6);
      background: transparent;
    }
    .footer-link--disabled .lock-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      line-height: 12px;
      color: rgba(255, 255, 255, 0.4);
      margin-left: 2px;
    }

    /* Student-only quick links */
    .student-links-divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.15);
      margin: 0 4px;
      align-self: center;
    }
    .footer-link--student {
      color: rgba(16, 185, 129, 0.8);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .footer-link--student:hover {
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.4);
    }
    .footer-link--refresh {
      background: none;
      cursor: pointer;
      font-family: inherit;
    }

    /* Contact */
    .footer-contact {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .contact-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.4;
    }
    .contact-row mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      line-height: 14px;
      color: #10b981;
      margin-top: 1px;
      flex-shrink: 0;
    }

    /* Bottom bar */
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.07);
      padding: 14px 40px;
      text-align: center;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.3);
      max-width: 100%;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .footer-inner {
        grid-template-columns: 1fr;
        gap: 24px;
        padding: 28px 20px 20px;
      }
      .footer-links { justify-content: flex-start; }
      .footer-bottom { padding: 12px 20px; }
    }
  `]
})
export class LibFooterComponent {
  private auth = inject(AuthService);
  currentYear = new Date().getFullYear();

  get isStudent(): boolean {
    return this.auth.isLibraryViewer();
  }

  reload(): void {
    window.location.reload();
  }
}
