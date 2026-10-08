import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mfg-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <footer class="mfg-footer">
      <div class="mfg-footer-links">
        <a routerLink="/daily-entry" class="mfg-link" *ngIf="isLabourStaff || hasMfgAccess">
          <mat-icon>edit_note</mat-icon> Entry
        </a>
        <a routerLink="/labour" class="mfg-link" *ngIf="isLabourStaff || hasMfgAccess">
          <mat-icon>groups</mat-icon> Labour
        </a>
        <a routerLink="/clients" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>people</mat-icon> Clients
        </a>
        <a routerLink="/production" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>precision_manufacturing</mat-icon> Production
        </a>
        <a routerLink="/sales" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>point_of_sale</mat-icon> Sales
        </a>
        <a routerLink="/expenses" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>receipt_long</mat-icon> Expenses
        </a>
        <a routerLink="/damage" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>report_problem</mat-icon> Damage
        </a>
        <a routerLink="/partners" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>account_balance</mat-icon> Firm
        </a>
        <a routerLink="/dashboard" class="mfg-link" *ngIf="hasMfgAccess">
          <mat-icon>dashboard</mat-icon> Dashboard
        </a>
        <a routerLink="/library-grid" class="mfg-link" *ngIf="hasLibraryAccess">
          <mat-icon>grid_on</mat-icon> Library
        </a>
        <a routerLink="/admin-user-management" class="mfg-link" *ngIf="isAdmin">
          <mat-icon>manage_accounts</mat-icon> Admin
        </a>
        <span class="mfg-copy">&copy; {{ currentYear }} Suraksha</span>
      </div>
    </footer>
  `,
  styles: [`
    .mfg-footer {
      background: #0f172a;
      border-top: 1px solid rgba(255,255,255,0.08);
      color: #e2e8f0;
    }

    .mfg-footer-links {
      max-width: 1200px;
      margin: 0 auto;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .mfg-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.78rem;
      padding: 4px 8px;
      border-radius: 5px;
      transition: background 0.15s ease;
    }
    .mfg-link mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: #93c5fd;
    }
    .mfg-link:hover { background: rgba(148,163,184,0.16); }

    .mfg-copy {
      margin-left: auto;
      font-size: 0.72rem;
      color: #94a3b8;
      padding: 0 6px;
    }

    @media (max-width: 720px) {
      .mfg-copy {
        display: none;
      }
    }
  `]
})
export class MfgFooterComponent {
  readonly currentYear = new Date().getFullYear();

  constructor(private auth: AuthService) {}

  get isAdmin(): boolean       { return this.auth.isAdmin(); }
  get isLabourStaff(): boolean { return this.auth.isLabourStaff(); }
  get hasMfgAccess(): boolean  { return this.auth.hasAccess('manufacturing') && !this.auth.isLabourStaff(); }
  get hasLibraryAccess(): boolean { return this.auth.hasAccess('library'); }
  get hasFullLibraryAccess(): boolean {
    return this.auth.isAdmin() || this.auth.isEditor() || this.auth.isLibraryManager();
  }
}
