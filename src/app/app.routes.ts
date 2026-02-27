import { Routes } from '@angular/router';
import { authGuard, loginGuard, manufacturingGuard, libraryGuard, adminGuard } from './guards/auth.guard';

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
    path: 'public-resources', 
    loadComponent: () => import('./pages/public-resources/public-resources.component').then(m => m.PublicResourcesComponent)
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

  // 📊 REPORTS & LEDGERS
  { 
    path: 'client-ledger', 
    loadComponent: () => import('./pages/client-ledger/client-ledger.component').then(m => m.ClientLedgerComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'labour-ledger', 
    loadComponent: () => import('./pages/labour-ledger/labour-ledger').then(m => m.LabourLedgerComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'reports-dashboard', 
    loadComponent: () => import('./pages/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },

  // 🏭 MANAGEMENT & OPERATIONS
  { 
    path: 'worker-management', 
    loadComponent: () => import('./pages/worker-management/worker-management.component').then(m => m.WorkerManagementComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'material-purchase', 
    loadComponent: () => import('./pages/material-purchase/material-purchase.component').then(m => m.MaterialPurchaseComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'inventory', 
    loadComponent: () => import('./pages/inventory-view/inventory-view.component').then(m => m.InventoryViewComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'stock-audit', 
    loadComponent: () => import('./pages/stock-audit/stock-audit.component').then(m => m.StockAuditComponent),
    canActivate: [authGuard, manufacturingGuard] 
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
    canActivate: [authGuard, manufacturingGuard] 
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
    path: 'library-complaints', 
    loadComponent: () => import('./pages/library-complaints/library-complaints.component').then(m => m.LibraryComplaintsComponent),
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
    loadComponent: () => import('./walls/walls-home.component').then(m => m.WallsHomeComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'walls/dashboard', 
    loadComponent: () => import('./walls/dashboard/walls-dashboard.component').then(m => m.WallsDashboardComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Production Module Routes
  { 
    path: 'walls/production', 
    loadComponent: () => import('./walls/production/production.component').then(m => m.ProductionComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'walls/production/entry', 
    loadComponent: () => import('./walls/production/production-entry.component').then(m => m.ProductionEntryComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Sales Module Routes
  { 
    path: 'walls/sales', 
    loadComponent: () => import('./walls/sales/sales.component').then(m => m.SalesComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'walls/sales/entry', 
    loadComponent: () => import('./walls/sales/sales-entry.component').then(m => m.SalesEntryComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Stock Module Routes
  { 
    path: 'walls/stock', 
    loadComponent: () => import('./walls/stock/stock.component').then(m => m.StockComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'walls/stock/raw-materials', 
    loadComponent: () => import('./walls/stock/raw-materials.component').then(m => m.RawMaterialsComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Labour Module Routes
  { 
    path: 'walls/labour', 
    loadComponent: () => import('./walls/labour/labour.component').then(m => m.LabourComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'walls/labour/wages', 
    loadComponent: () => import('./walls/labour/wage-payment.component').then(m => m.WagePaymentComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Reports Module Routes
  { 
    path: 'walls/reports', 
    loadComponent: () => import('./walls/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  
  // Masters Module Routes
  { 
    path: 'walls/masters', 
    loadComponent: () => import('./walls/masters/masters.component').then(m => m.MastersComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },


  // Payment & Supplier Management Routes
  { 
    path: 'client-payment', 
    loadComponent: () => import('./pages/client-payment-component/client-payment-component').then(m => m.ClientPaymentComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'supplier-management', 
    loadComponent: () => import('./pages/supplier-management/supplier-management.component').then(m => m.SupplierManagementComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  // �🤝 PARTNER ROUTES (Admin only)
  { 
    path: 'partner-dashboard', 
    loadComponent: () => import('./pages/partner-dashboard/partner-dashboard').then(m => m.PartnerDashboardComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'company-cash', 
    loadComponent: () => import('./pages/company-cash-component/company-cash-component').then(m => m.CompanyCashComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'partner', 
    loadComponent: () => import('./pages/partner/partner').then(m => m.PartnerComponent),
    canActivate: [authGuard, manufacturingGuard] 
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
