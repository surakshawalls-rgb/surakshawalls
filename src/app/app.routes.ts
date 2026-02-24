import { Routes } from '@angular/router';
import { authGuard, loginGuard, manufacturingGuard, libraryGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  // 🌐 PUBLIC ROUTES - EXCLUDED FROM DEPLOYMENT
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', redirectTo: 'login', pathMatch: 'full' },
  
  // 🔐 Login route (lazy loaded)
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard] 
  },

  // 🔧 ADMIN MANAGEMENT ROUTES (Admin only)
  { 
    path: 'admin-manage', 
    loadComponent: () => import('./pages/admin-manage/admin-manage.component').then(m => m.AdminManageComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'manage/clients', 
    loadComponent: () => import('./pages/manage-clients/manage-clients.component').then(m => m.ManageClientsComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'manage/workers', 
    loadComponent: () => import('./pages/manage-workers/manage-workers.component').then(m => m.ManageWorkersComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'manage/materials', 
    loadComponent: () => import('./pages/manage-materials/manage-materials.component').then(m => m.ManageMaterialsComponent),
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'manage/products', 
    loadComponent: () => import('./pages/manage-products/manage-products.component').then(m => m.ManageProductsComponent),
    canActivate: [authGuard, adminGuard] 
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

  // 📊 DASHBOARDS (Lazy Loaded)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'manufacturing-dashboard', 
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
    path: 'resources', 
    loadComponent: () => import('./pages/digital-library/digital-library.component').then(m => m.DigitalLibraryComponent),
    canActivate: [authGuard, libraryGuard] 
  },

  // 📋 Legacy routes (Lazy Loaded) - For backward compatibility
  { 
    path: 'reports', 
    loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'raw-materials', 
    loadComponent: () => import('./pages/raw-materials/raw-materials').then(m => m.RawMaterialsComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'sales-order', 
    loadComponent: () => import('./pages/sales-order/sales-order').then(m => m.SalesOrderComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'partner-dashboard', 
    loadComponent: () => import('./pages/partner-dashboard/partner-dashboard').then(m => m.PartnerDashboardComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'orders', 
    loadComponent: () => import('./pages/order-entry/order-entry').then(m => m.OrderEntryComponent),
    canActivate: [authGuard, manufacturingGuard] 
  },
  { 
    path: 'clients', 
    loadComponent: () => import('./pages/client-master-component/client-master-component').then(m => m.ClientMasterComponent),
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
  },
  { 
    path: 'partner-withdraw', 
    loadComponent: () => import('./pages/partner-withdraw-component/partner-withdraw-component').then(m => m.PartnerWithdrawComponent),
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
