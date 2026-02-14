import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ClientDueService } from '../../services/client-due.service';
import { CompanyCashService } from '../../services/company-cash.service';
import { PartnerWalletService } from '../../services/partner-wallet.service';
import { StockSalesService } from '../../services/stock-sales.service';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
      console.log('[DashboardComponent] loadDashboard - start');
      // Load client data
      const clients = await this.db.getClients();
      this.clients = clients.data || [];
      console.log('[DashboardComponent] clients ->', this.clients);

      // Load financial data from new services
      const clientsDue = await this.clientDueService.getAllClientsDue();
      const cashBalance = await this.companyCashService.getCurrentBalance();
      const partnerWallets = await this.partnerWalletService.getAllPartnersWallet();
      const prodVsSales = await this.stockSalesService.getProductionVsSales();

      console.log('[DashboardComponent] clientsDue ->', clientsDue);
      console.log('[DashboardComponent] cashBalance ->', cashBalance);
      console.log('[DashboardComponent] partnerWallets ->', partnerWallets);
      console.log('[DashboardComponent] prodVsSales ->', prodVsSales);

      // Set new financial data
      this.dueLedger = clientsDue;
      this.partnerWallets = partnerWallets;
      this.productionVsSales = prodVsSales;

      // Calculate totals
      this.totalRevenue = clientsDue.reduce((sum: number, item: any) => sum + item.totalBilled, 0);
      this.totalReceived = clientsDue.reduce((sum: number, item: any) => sum + item.totalPaid, 0);
      this.totalDue = clientsDue.reduce((sum: number, item: any) => sum + item.due, 0);

      this.cashBalance = cashBalance.balance;
      this.totalLabourCost = cashBalance.labourCost;
      this.totalPartnerExpense = cashBalance.partnerExpenseCost;
      this.totalPartnerWithdrawal = cashBalance.partnerWithdrawalAmount;

      // Calculate Profit/Loss
      this.profitLoss = this.totalReceived - (this.totalLabourCost + this.totalPartnerExpense);

      // Load legacy data for backward compatibility with existing templates
      const revenue = await this.db.getRevenue();
      const payment = await this.db.getPayments();
      const labour = await this.db.getLabour();
      const pe = await this.db.getPartnerExpense();

      this.revenueTotal = this.sum(revenue.data, 'total_bill');
      this.paymentTotal = this.sum(payment.data, 'amount_paid');
      this.labourTotal = this.sum(labour.data, 'amount');
      this.partnerExpenseTotal = this.sum(pe.data, 'amount');

      // Production stock - Load from finished_goods_inventory (new system)
      const inventory = await this.inventoryService.getInventory();
      console.log('[DashboardComponent] inventory ->', inventory);

      this.production = {
        fencing_pole: 0,
        plain_plate: 0,
        jumbo_pillar: 0,
        round_plate: 0,
        biscuit_plate: 0
      };

      inventory.forEach(item => {
        const productKey = item.product_name.toLowerCase();
        if (productKey === 'fencing_pole') {
          this.production.fencing_pole = item.current_stock;
        } else if (productKey === 'plain_plate') {
          this.production.plain_plate = item.current_stock;
        } else if (productKey === 'jumbo_pillar') {
          this.production.jumbo_pillar = item.current_stock;
        } else if (productKey === 'round_plate') {
          this.production.round_plate = item.current_stock;
        } else if (productKey === 'biscuit_plate') {
          this.production.biscuit_plate = item.current_stock;
        }
      });

      console.log('[DashboardComponent] production stock from inventory ->', this.production);

      this.loading = false;
      this.cd.detectChanges();
    } catch (error) {
      console.error('[DashboardComponent] Error loading dashboard:', error);
      this.loading = false;
      this.cd.detectChanges();
    }
  }
}
