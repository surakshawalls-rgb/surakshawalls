import { Routes } from '@angular/router';
import { authGuard, loginGuard, manufacturingGuard, libraryGuard, adminGuard, dailyEntryOnlyGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 🌐 PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
  { 
    path: '', 
    loadComponent: () => import('./pages/public-home/public-home.component').then(m => m.PublicHomeComponent)
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/public-home/public-home.component').then(m => m.PublicHomeComponent)
  },
  {
    path: 'suraksha-walls',
    loadComponent: () => import('./pages/suraksha-walls/suraksha-walls.component').then(m => m.SurakshaWallsComponent)
  },
  {
    path: 'software',
    loadComponent: () => import('./pages/suraksha-software/suraksha-software.component').then(m => m.SurakshaSoftwareComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/suraksha-software/suraksha-software.component').then(m => m.SurakshaSoftwareComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/suraksha-software/suraksha-software.component').then(m => m.SurakshaSoftwareComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/public-contact/public-contact.component').then(m => m.PublicContactComponent)
  },
  { 
    path: 'library/resources', 
    loadComponent: () => import('./pages/public-resources/public-resources.component').then(m => m.PublicResourcesComponent)
  },
  { 
    path: 'library', 
    loadComponent: () => import('./pages/library-public/library-public.component').then(m => m.LibraryPublicComponent)
  },
  {
    path: 'public-resources',
    redirectTo: 'library/resources',
    pathMatch: 'full'
  },
  { 
    path: 'quotation', 
    loadComponent: () => import('./pages/public-quotation/public-quotation.component').then(m => m.PublicQuotationComponent)
  },
  
  // 🔐 Login route (lazy loaded)
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard] 
  },

  // ⭐⭐⭐ UNIFIED DAILY ENTRY - ALL-IN-ONE FORM
  // Handles: Production, Labour, Sales, Expenses, Yard Loss
  { 
    path: 'daily-entry', 
    loadComponent: () => import('./pages/daily-entry/daily-entry').then(m => m.UnifiedDailyEntryComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },

  // 👷 LABOUR MANAGEMENT - Dedicated labour page
  {
    path: 'labour',
    loadComponent: () => import('./pages/labour-management/labour-management.component').then(m => m.LabourManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 👤 CLIENT MANAGEMENT
  {
    path: 'clients',
    loadComponent: () => import('./pages/client-management/client-management.component').then(m => m.ClientManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 🏭 PRODUCTION MANAGEMENT
  {
    path: 'production',
    loadComponent: () => import('./pages/production-management/production-management.component').then(m => m.ProductionManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 💰 SALES MANAGEMENT
  {
    path: 'sales',
    loadComponent: () => import('./pages/sales-management/sales-management.component').then(m => m.SalesManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 🧾 EXPENSES MANAGEMENT
  {
    path: 'expenses',
    loadComponent: () => import('./pages/expenses-management/expenses-management.component').then(m => m.ExpensesManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 💥 DAMAGE / YARD LOSS
  {
    path: 'damage',
    loadComponent: () => import('./pages/damage-management/damage-management.component').then(m => m.DamageManagementComponent),
    canActivate: [authGuard, manufacturingGuard]
  },

  // 🤝 PARTNERS & FIRM BALANCE SHEET
  {
    path: 'partners',
    loadComponent: () => import('./pages/partners-firm/partners-firm.component').then(m => m.PartnersFirmComponent),
    canActivate: [authGuard, manufacturingGuard, dailyEntryOnlyGuard]
  },

  {
    path: 'passbook-hub',
    loadComponent: () => import('./pages/workspaces/labour-workspace.component').then(m => m.LabourWorkspaceComponent),
    canActivate: [authGuard, manufacturingGuard]
  },
  {
    path: 'labour-workspace',
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'production-workspace', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'stock-workspace', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },

  // 📊 REPORTS & LEDGERS
  { 
    path: 'pending-approvals', 
    loadComponent: () => import('./pages/pending-approvals/pending-approvals').then(m => m.PendingApprovalsComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'client-ledger', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'labour-ledger', 
    redirectTo: 'labour-workspace',
    pathMatch: 'full'
  },
  { 
    path: 'reports-dashboard', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },

  // 🏭 MANAGEMENT & OPERATIONS
  { 
    path: 'worker-management', 
    redirectTo: 'labour-workspace',
    pathMatch: 'full'
  },
  { 
    path: 'material-purchase', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'inventory', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'stock-audit', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },

  // DEPRECATED - Use daily-entry instead
  // { 
  //   path: 'production-entry', 
  //   loadComponent: () => import('./pages/production-entry/production-entry').then(m => m.ProductionEntryComponent),
  //   canActivate: [authGuard, manufacturingGuard] 
  // },
  // { 
  //   path: 'sales-entry', 
  //   loadComponent: () => import('./pages/sales-entry/sales-entry.component').then(m => m.SalesEntryComponent),
  //   canActivate: [authGuard, manufacturingGuard] 
  // },
  // { 
  //   path: 'yard-loss', 
  //   loadComponent: () => import('./pages/yard-loss/yard-loss.component').then(m => m.YardLossComponent),
  //   canActivate: [authGuard, manufacturingGuard] 
  // },

  // 📊 DASHBOARD (Lazy Loaded)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard, manufacturingGuard, dailyEntryOnlyGuard] 
  },

  // 📚 LIBRARY MANAGEMENT SYSTEM (Lazy Loaded)
  { 
    path: 'library-grid', 
    loadComponent: () => import('./pages/library-grid/library-grid.component').then(m => m.LibraryGridComponent),
    canActivate: [authGuard, libraryGuard] 
  },
  { 
    path: 'library-dashboard', 
    loadComponent: () => import('./pages/library-dashboard/library-dashboard.component').then(m => m.LibraryDashboardComponent),
    canActivate: [authGuard, libraryGuard] 
  },
  { 
    path: 'library-students', 
    loadComponent: () => import('./pages/library-students/library-students.component').then(m => m.LibraryStudentsComponent),
    canActivate: [authGuard, libraryGuard] 
  },
  { 
    path: 'library-expenses', 
    loadComponent: () => import('./pages/library-expenses/library-expenses.component').then(m => m.LibraryExpensesComponent),
    canActivate: [authGuard, libraryGuard] 
  },
  { 
    path: 'library-registration-requests', 
    loadComponent: () => import('./pages/library-registration-requests/library-registration-requests.component').then(m => m.LibraryRegistrationRequestsComponent),
    canActivate: [authGuard, libraryGuard] 
  },
  { 
    path: 'library-complaints', 
    loadComponent: () => import('./pages/library-complaints/library-complaints.component').then(m => m.LibraryComplaintsComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'library-bulk-whatsapp', 
    loadComponent: () => import('./pages/library-bulk-whatsapp/library-bulk-whatsapp.component').then(m => m.LibraryBulkWhatsappComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'resources', 
    loadComponent: () => import('./pages/digital-library/digital-library.component').then(m => m.DigitalLibraryComponent)
    // NO authGuard - Public access for advertisement/marketing
  },

  // � SURAKSHA WALLS - COMPLETE MANAGEMENT SYSTEM (Lazy Loaded)
  { 
    path: 'walls', 
    redirectTo: 'walls/home', 
    pathMatch: 'full' 
  },
  { 
    path: 'walls/home', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'walls/dashboard', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  
  // Production Module Routes
  { 
    path: 'walls/production', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'walls/production/entry', 
    redirectTo: 'daily-entry',
    pathMatch: 'full'
  },
  
  // Sales Module Routes
  { 
    path: 'walls/sales', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'walls/sales/entry', 
    redirectTo: 'daily-entry',
    pathMatch: 'full'
  },
  
  // Stock Module Routes
  { 
    path: 'walls/stock', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'walls/stock/raw-materials', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  
  // Labour Module Routes
  { 
    path: 'walls/labour', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'walls/labour/wages', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  
  // Reports Module Routes
  { 
    path: 'walls/reports', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  
  // Masters Module Routes
  { 
    path: 'walls/masters', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },



  // Payment & Supplier Management Routes
  { 
    path: 'client-payment', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'supplier-management', 
    loadComponent: () => import('./pages/supplier-management/supplier-management.component').then(m => m.SupplierManagementComponent),
    canActivate: [authGuard, manufacturingGuard, dailyEntryOnlyGuard] 
  },
  // �🤝 PARTNER ROUTES (Admin only)
  { 
    path: 'partner-dashboard', 
    loadComponent: () => import('./pages/partner-dashboard/partner-dashboard').then(m => m.PartnerDashboardComponent),
    canActivate: [authGuard, manufacturingGuard, dailyEntryOnlyGuard] 
  },
  { 
    path: 'company-cash', 
    redirectTo: 'passbook-hub',
    pathMatch: 'full'
  },
  { 
    path: 'partner', 
    loadComponent: () => import('./pages/partner/partner').then(m => m.PartnerComponent),
    canActivate: [authGuard, manufacturingGuard, dailyEntryOnlyGuard] 
  },
  {
    path: 'admin-user-management',
    loadComponent: () => import('./pages/admin-user-management/admin-user-management.component').then(m => m.AdminUserManagementComponent),
    canActivate: [authGuard, adminGuard]
  }

  // DEPRECATED - Replaced by unified-daily-entry
  // { 
  //   path: 'clients-pay', 
  //   loadComponent: () => import('./pages/client-payment-component/client-payment-component').then(m => m.ClientPaymentComponent),
  //   canActivate: [authGuard, manufacturingGuard] 
  // },
  // { 
  //   path: 'labour', 
  //   loadComponent: () => import('./pages/labour/labour').then(m => m.LabourComponent),
  //   canActivate: [authGuard, manufacturingGuard] 
  // },
];
