import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { LabourComponent } from './pages/labour/labour';
import { ProductionComponent } from './pages/production/production';
import { PartnerComponent } from './pages/partner/partner';
import { ReportsComponent } from './pages/reports/reports';
import { PartnerWithdrawComponent } from './pages/partner-withdraw-component/partner-withdraw-component';
import { ClientPaymentComponent } from './pages/client-payment-component/client-payment-component';
import { CompanyCashComponent } from './pages/company-cash-component/company-cash-component';
import { ClientMasterComponent } from './pages/client-master-component/client-master-component';
import { OrderEntryComponent } from './pages/order-entry/order-entry';
import { DailyEntryComponent } from './pages/daily-entry/daily-entry';
import { LabourLedgerComponent } from './pages/labour-ledger/labour-ledger';
import { RawMaterialsComponent } from './pages/raw-materials/raw-materials';
import { SalesOrderComponent } from './pages/sales-order/sales-order';
import { PartnerDashboardComponent } from './pages/partner-dashboard/partner-dashboard';

// ✨✨✨ NEW RECIPE-BASED SYSTEM COMPONENTS ✨✨✨
import { ProductionEntryComponent } from './pages/production-entry/production-entry';
import { SalesEntryComponent } from './pages/sales-entry/sales-entry.component';
import { ClientLedgerComponent } from './pages/client-ledger/client-ledger.component';
import { MaterialPurchaseComponent } from './pages/material-purchase/material-purchase.component';
import { WorkerManagementComponent } from './pages/worker-management/worker-management.component';
import { InventoryViewComponent } from './pages/inventory-view/inventory-view.component';
import { YardLossComponent } from './pages/yard-loss/yard-loss.component';
import { StockAuditComponent } from './pages/stock-audit/stock-audit.component';
import { ReportsDashboardComponent } from './pages/reports-dashboard/reports-dashboard.component';

// 📚📚📚 LIBRARY MANAGEMENT SYSTEM COMPONENTS 📚📚📚
import { LibraryGridComponent } from './pages/library-grid/library-grid.component';
import { LibraryDashboardComponent } from './pages/library-dashboard/library-dashboard.component';
import { LibraryStudentsComponent } from './pages/library-students/library-students.component';
import { LibraryExpensesComponent } from './pages/library-expenses/library-expenses.component';
import { DigitalLibraryComponent } from './pages/digital-library/digital-library.component';

// 🌐🌐🌐 PUBLIC PAGES (NO AUTH REQUIRED) 🌐🌐🌐
// EXCLUDED FROM DEPLOYMENT - Public pages not committed to repository
// import { PublicHomeComponent } from './pages/public-home/public-home.component';
// import { WallsComponent } from './pages/walls/walls.component';
// import { LibraryPublicComponent } from './pages/library-public/library-public.component';
// import { PublicResourcesComponent } from './pages/public-resources/public-resources.component';
// import { QuotationComponent } from './pages/quotation/quotation.component';

// 🔐 AUTHENTICATION
import { LoginComponent } from './pages/login/login.component';
import { authGuard, loginGuard, manufacturingGuard, libraryGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 🌐 PUBLIC ROUTES - EXCLUDED FROM DEPLOYMENT
  // Public pages not available in this deployment
  { path: '', redirectTo: 'login', pathMatch: 'full' },  // Redirect root to login
  { path: 'home', redirectTo: 'login', pathMatch: 'full' },
  
  // Login route (accessible without auth but redirects if already logged in)
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },

  // ⭐⭐⭐ NEW RECIPE-BASED PRODUCTION SYSTEM (Protected - Manufacturing Access Required) ⭐⭐⭐
  { path: 'production-entry', component: ProductionEntryComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'sales-entry', component: SalesEntryComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'client-ledger', component: ClientLedgerComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'material-purchase', component: MaterialPurchaseComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'worker-management', component: WorkerManagementComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'inventory', component: InventoryViewComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'yard-loss', component: YardLossComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'stock-audit', component: StockAuditComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'reports-dashboard', component: ReportsDashboardComponent, canActivate: [authGuard, manufacturingGuard] },

  // � DASHBOARDS (Protected - Manufacturing)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard, manufacturingGuard] }, // Production Stock Dashboard
  { path: 'manufacturing-dashboard', component: DashboardComponent, canActivate: [authGuard, manufacturingGuard] }, // Alias for clarity

  // 📚 LIBRARY MANAGEMENT SYSTEM (Protected - Library Access Required)
  { path: 'library-grid', component: LibraryGridComponent, canActivate: [authGuard, libraryGuard] },
  { path: 'library-dashboard', component: LibraryDashboardComponent, canActivate: [authGuard, libraryGuard] },
  { path: 'library-students', component: LibraryStudentsComponent, canActivate: [authGuard, libraryGuard] },
  { path: 'library-expenses', component: LibraryExpensesComponent, canActivate: [authGuard, libraryGuard] },
  { path: 'resources', component: DigitalLibraryComponent, canActivate: [authGuard, libraryGuard] }, // 📚 Digital Resources - Library Members Only

  // Legacy routes (Protected - Manufacturing)
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard, manufacturingGuard] },

  // 🏭 Daily Operations (Legacy - Protected - Manufacturing)
  { path: 'daily-entry', component: DailyEntryComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'labour-ledger', component: LabourLedgerComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'raw-materials', component: RawMaterialsComponent, canActivate: [authGuard, manufacturingGuard] },

  // 🛒 Sales (Legacy - Protected - Manufacturing)
  { path: 'sales-order', component: SalesOrderComponent, canActivate: [authGuard, manufacturingGuard] },

  // 🤝 Partner Management (Legacy - Protected - Manufacturing)
  { path: 'partner-dashboard', component: PartnerDashboardComponent, canActivate: [authGuard, manufacturingGuard] },

  // ⭐ Unified Order Entry (Legacy - Protected - Manufacturing)
  { path: 'orders', component: OrderEntryComponent, canActivate: [authGuard, manufacturingGuard] },

  // Data Entry (Legacy - kept for backward compatibility - Protected - Manufacturing)
  { path: 'clients', component: ClientMasterComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'clients-pay', component: ClientPaymentComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'labour', component: LabourComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'production', component: ProductionComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'company-cash', component: CompanyCashComponent, canActivate: [authGuard, manufacturingGuard] },

  // Partner (all partner operations in one route with tabs - Protected - Manufacturing)
  { path: 'partner', component: PartnerComponent, canActivate: [authGuard, manufacturingGuard] },
  { path: 'partner-withdraw', component: PartnerWithdrawComponent, canActivate: [authGuard, manufacturingGuard] }, // Legacy support
];
