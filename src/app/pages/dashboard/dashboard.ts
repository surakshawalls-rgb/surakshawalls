import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ClientDueService } from '../../services/client-due.service';
import { CompanyCashService } from '../../services/company-cash.service';
import { PartnerWalletService } from '../../services/partner-wallet.service';
import { StockSalesService } from '../../services/stock-sales.service';
import { InventoryService } from '../../services/inventory.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private db: DashboardService,
    private clientDueService: ClientDueService,
    private companyCashService: CompanyCashService,
    private partnerWalletService: PartnerWalletService,
    private stockSalesService: StockSalesService,
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef
  ) {}

  loading = false;

  // Financial Summary
  clients: any[] = [];
  totalRevenue = 0;
  totalReceived = 0;
  totalDue = 0;
  cashBalance = 0;
  totalLabourCost = 0;
  totalPartnerExpense = 0;
  totalPartnerWithdrawal = 0;
  profitLoss = 0;

  // Detailed Breakdown
  dueLedger: any[] = [];
  partnerWallets: any[] = [];
  productionVsSales: any = {
    production: {},
    sales: {},
    remaining: {}
  };

  // Legacy fields for backward compatibility
  revenueTotal = 0;
  paymentTotal = 0;
  labourTotal = 0;
  partnerExpenseTotal = 0;
  production: any = {
    fencing_pole: 0,
    plain_plate: 0,
    jumbo_pillar: 0,
    round_plate: 0,
    biscuit_plate: 0
  };

  async ngOnInit() {
    console.log('[DashboardComponent] ngOnInit');
    await this.loadDashboard();
  }

  sum(rows: any[] | null, field: string) {
    if (!rows) return 0;
    return rows.reduce((s, r) => s + Number(r[field] || 0), 0);
  }

  getClientName(id: any) {
    return this.clients.find(c => c.id == id)?.client_name || 'Unknown';
  }

  async loadDashboard() {
    this.loading = true;
    this.cd.detectChanges();

    try {
      // Load all data in parallel for better performance
      const [
        clientsResult,
        clientsDue,
        cashBalance,
        partnerWallets,
        prodVsSales,
        revenue,
        payment,
        labour,
        pe,
        inventory
      ] = await Promise.all([
        this.db.getClients().catch(err => { console.error('Error loading clients:', err); return { data: [] }; }),
        this.clientDueService.getAllClientsDue().catch(err => { console.error('Error loading client dues:', err); return []; }),
        this.companyCashService.getCurrentBalance().catch(err => { console.error('Error loading cash balance:', err); return { balance: 0, labourCost: 0, partnerExpenseCost: 0, partnerWithdrawalAmount: 0 }; }),
        this.partnerWalletService.getAllPartnersWallet().catch(err => { console.error('Error loading partner wallets:', err); return []; }),
        this.stockSalesService.getProductionVsSales().catch(err => { console.error('Error loading prod vs sales:', err); return { production: {}, sales: {}, remaining: {} }; }),
        this.db.getRevenue().catch(err => { console.error('Error loading revenue:', err); return { data: [] }; }),
        this.db.getPayments().catch(err => { console.error('Error loading payments:', err); return { data: [] }; }),
        this.db.getLabour().catch(err => { console.error('Error loading labour:', err); return { data: [] }; }),
        this.db.getPartnerExpense().catch(err => { console.error('Error loading partner expense:', err); return { data: [] }; }),
        this.inventoryService.getInventory().catch(err => { console.error('Error loading inventory:', err); return []; })
      ]);

      // Set basic client data
      this.clients = clientsResult.data || [];
      console.log('[Dashboard] Clients loaded:', this.clients.length);

      // Set new financial data
      this.dueLedger = clientsDue as any[];
      this.partnerWallets = partnerWallets as any[];
      this.productionVsSales = prodVsSales;
      console.log('[Dashboard] Due Ledger:', this.dueLedger);

      // Calculate totals from new services
      this.totalRevenue = (clientsDue as any[]).reduce((sum: number, item: any) => sum + (item.totalBilled || 0), 0);
      this.totalReceived = (clientsDue as any[]).reduce((sum: number, item: any) => sum + (item.totalPaid || 0), 0);
      this.totalDue = (clientsDue as any[]).reduce((sum: number, item: any) => sum + (item.due || 0), 0);

      console.log('[Dashboard] Calculated Totals:', {
        totalRevenue: this.totalRevenue,
        totalReceived: this.totalReceived,
        totalDue: this.totalDue
      });

      this.cashBalance = cashBalance.balance || 0;
      this.totalLabourCost = cashBalance.labourCost || 0;
      this.totalPartnerExpense = cashBalance.partnerExpenseCost || 0;
      this.totalPartnerWithdrawal = cashBalance.partnerWithdrawalAmount || 0;

      // Calculate Profit/Loss
      this.profitLoss = this.totalReceived - (this.totalLabourCost + this.totalPartnerExpense);

      // Legacy totals for backward compatibility
      this.revenueTotal = this.sum(revenue.data, 'total_bill') || this.sum(revenue.data, 'bill_amount');
      this.paymentTotal = this.sum(payment.data, 'amount_paid') || this.sum(payment.data, 'amount');
      this.labourTotal = this.sum(labour.data, 'amount');
      this.partnerExpenseTotal = this.sum(pe.data, 'amount');

      // Production stock from inventory
      this.production = {
        fencing_pole: 0,
        plain_plate: 0,
        jumbo_pillar: 0,
        round_plate: 0,
        biscuit_plate: 0
      };

      // Map inventory to production object
      inventory.forEach((item: any) => {
        const productKey = item.product_name?.toLowerCase();
        if (productKey && this.production.hasOwnProperty(productKey)) {
          this.production[productKey] = item.current_stock || 0;
        }
      });

      this.loading = false;
      this.cd.detectChanges();
    } catch (error) {
      console.error('[DashboardComponent] Critical error loading dashboard:', error);
      this.loading = false;
      this.cd.detectChanges();
    }
  }
}
