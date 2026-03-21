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

      <div class="mfg-footer-top">
        <div class="mfg-brand">
          <div class="mfg-brand-logo"><mat-icon>shield</mat-icon></div>
          <div class="mfg-brand-text">
            <span class="mfg-brand-name">Suraksha Group</span>
            <span class="mfg-brand-tag">Manufacturing &amp; Library System</span>
          </div>
        </div>
        <span class="mfg-copy">&copy; {{ currentYear }} Suraksha Group &middot; All rights reserved</span>
      </div>

      <div class="mfg-footer-links">

        <!-- Col 1: Operations — labour_staff see only Daily Entry; mfg users see all -->
        <div class="mfg-col" *ngIf="isLabourStaff || hasMfgAccess">
          <p class="mfg-col-heading"><mat-icon>settings</mat-icon>Operations</p>
          <a routerLink="/daily-entry"          class="mfg-link"><mat-icon>edit_note</mat-icon>Daily Entry</a>
          <a routerLink="/pending-approvals"    class="mfg-link" *ngIf="isAdmin"><mat-icon>pending_actions</mat-icon>Pending Approvals</a>
        </div>

        <!-- Col 2: Inventory — mfg access only -->
        <div class="mfg-col" *ngIf="hasMfgAccess">
          <p class="mfg-col-heading"><mat-icon>inventory_2</mat-icon>Inventory</p>
          <a routerLink="/inventory"            class="mfg-link"><mat-icon>inventory_2</mat-icon>Current Stock</a>
          <a routerLink="/stock-audit"          class="mfg-link"><mat-icon>fact_check</mat-icon>Stock Audit</a>
          <a routerLink="/material-purchase"    class="mfg-link"><mat-icon>shopping_cart</mat-icon>Material Purchase</a>
          <a routerLink="/supplier-management"  class="mfg-link"><mat-icon>local_shipping</mat-icon>Supplier Management</a>
        </div>

        <!-- Col 3: Finance — mfg access only -->
        <div class="mfg-col" *ngIf="hasMfgAccess">
          <p class="mfg-col-heading"><mat-icon>account_balance</mat-icon>Finance</p>
          <a routerLink="/client-ledger"        class="mfg-link"><mat-icon>people</mat-icon>Client Ledger</a>
          <a routerLink="/client-payment"       class="mfg-link"><mat-icon>payments</mat-icon>Client Payments</a>
          <a routerLink="/labour-ledger"        class="mfg-link"><mat-icon>account_balance_wallet</mat-icon>Labour Ledger</a>
        </div>

        <!-- Col 4: Reports (mfg) + Admin partner links (admin/su only) -->
        <div class="mfg-col" *ngIf="hasMfgAccess || isAdmin">
          <p class="mfg-col-heading"><mat-icon>assessment</mat-icon>Reports</p>
          <a routerLink="/dashboard"            class="mfg-link" *ngIf="hasMfgAccess"><mat-icon>dashboard</mat-icon>Dashboard</a>
          <a routerLink="/reports-dashboard"    class="mfg-link" *ngIf="hasMfgAccess"><mat-icon>bar_chart</mat-icon>Business Reports</a>
          <ng-container *ngIf="isAdmin">
            <a routerLink="/partner-dashboard"  class="mfg-link"><mat-icon>dashboard</mat-icon>Partner Dashboard</a>
            <a routerLink="/partner"            class="mfg-link"><mat-icon>handshake</mat-icon>Partner Settings</a>
            <a routerLink="/company-cash"       class="mfg-link"><mat-icon>account_balance</mat-icon>Company Cash</a>
          </ng-container>
        </div>

        <!-- Col 5: Library main — any library access; full links for manager/admin -->
        <div class="mfg-col mfg-col--lib mfg-col--lib-border" *ngIf="hasLibraryAccess">
          <p class="mfg-col-heading mfg-col-heading--lib"><mat-icon>menu_book</mat-icon>Library</p>
          <a routerLink="/library-grid"                    class="mfg-link mfg-link--library"><mat-icon>grid_on</mat-icon>Seat Grid</a>
          <ng-container *ngIf="hasFullLibraryAccess">
            <a routerLink="/library-dashboard"             class="mfg-link mfg-link--library"><mat-icon>dashboard</mat-icon>Library Dashboard</a>
            <a routerLink="/library-students"              class="mfg-link mfg-link--library"><mat-icon>school</mat-icon>Students</a>
            <a routerLink="/library-registration-requests" class="mfg-link mfg-link--library"><mat-icon>how_to_reg</mat-icon>Membership Requests</a>
          </ng-container>
        </div>

        <!-- Col 6: Library extras — expenses (full library access), complaints (admin only) -->
        <div class="mfg-col mfg-col--lib" *ngIf="hasLibraryAccess && (hasFullLibraryAccess || isAdmin)">
          <p class="mfg-col-heading mfg-col-heading--lib mfg-col-heading--invisible">&nbsp;</p>
          <a routerLink="/library-expenses"     class="mfg-link mfg-link--library" *ngIf="hasFullLibraryAccess"><mat-icon>payments</mat-icon>Expenses</a>
          <a routerLink="/library-complaints"   class="mfg-link mfg-link--library" *ngIf="isAdmin"><mat-icon>feedback</mat-icon>View Complaints</a>
        </div>

      </div>
    </footer>
  `,
  styles: [`
    .mfg-footer {
      background: linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 60%, #131a0e 100%);
      color: rgba(255,255,255,0.72);
      font-family: 'Inter', system-ui, sans-serif;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    /* ── Top bar: brand + copyright ── */
    .mfg-footer-top {
      max-width: 1400px;
      margin: 0 auto;
      padding: 18px 32px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .mfg-brand { display: flex; align-items: center; gap: 10px; }
    .mfg-brand-logo {
      width: 34px; height: 34px;
      background: rgba(245,158,11,0.15);
      border: 1px solid rgba(245,158,11,0.3);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .mfg-brand-logo mat-icon { color: #f59e0b; font-size: 18px; width: 18px; height: 18px; }
    .mfg-brand-text { display: flex; flex-direction: column; gap: 1px; }
    .mfg-brand-name { font-size: 0.9rem; font-weight: 800; color: #fff; }
    .mfg-brand-tag  { font-size: 0.68rem; color: rgba(255,255,255,0.35); }
    .mfg-copy       { font-size: 0.7rem; color: rgba(255,255,255,0.25); white-space: nowrap; }

    /* ── Flexbox links row — auto-adapts when columns are hidden ── */
    .mfg-footer-links {
      max-width: 1400px;
      margin: 0 auto;
      padding: 14px 32px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: start;
      align-items: start;
    }

    /* Column headings */
    .mfg-col-heading {
      display: flex;
      align-items: center;
      gap: 5px;
      margin: 0 0 6px;
      padding: 0 6px 6px;
      font-size: 0.67rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: rgba(255,255,255,0.35);
      border-bottom: 1px solid rgba(245,158,11,0.2);
    }
    .mfg-col-heading mat-icon {
      font-size: 13px; width: 13px; height: 13px; color: #f59e0b;
    }
    .mfg-col-heading--gap { margin-top: 14px; }
    .mfg-col-heading--lib {
      border-bottom-color: rgba(16,185,129,0.25);
    }
    .mfg-col-heading--lib mat-icon { color: #10b981; }
    .mfg-col-heading--invisible {
      opacity: 0;
      pointer-events: none;
    }

    /* Individual columns — flex children, grow equally */
    .mfg-col {
      flex: 1 1 155px;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 6px 8px;
    }
    /* Vertical divider before library columns */
    .mfg-col--lib-border {
      border-left: 1px solid rgba(255,255,255,0.07);
    }

    /* Links */
    .mfg-link {
      display: flex;
      align-items: center;
      gap: 5px;
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      font-size: 0.79rem;
      padding: 3px 6px;
      border-radius: 5px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .mfg-link mat-icon {
      font-size: 13px; width: 13px; height: 13px;
      color: #f59e0b; opacity: 0.65; flex-shrink: 0;
    }
    .mfg-link:hover { color: #f59e0b; background: rgba(245,158,11,0.09); }
    .mfg-link:hover mat-icon { opacity: 1; }

    .mfg-link--library mat-icon { color: #10b981; }
    .mfg-link--library:hover { color: #10b981; background: rgba(16,185,129,0.09); }

    /* Responsive */
    @media (max-width: 700px) {
      .mfg-col--lib-border { border-left: none; }
      .mfg-col { flex-basis: 140px; }
    }
    @media (max-width: 560px) {
      .mfg-footer-links {
        padding: 10px 16px 14px;
      }
      .mfg-col { flex-basis: calc(50% - 16px); }
      .mfg-footer-top { padding: 14px 16px 0; }
      .mfg-copy { display: none; }
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
