import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClientDueService } from './client-due.service';
import { CompanyCashService } from './company-cash.service';
import { PartnerWalletService } from './partner-wallet.service';
import { StockSalesService } from './stock-sales.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {

  private supabase: SupabaseClient;

  constructor(
    private clientDueService: ClientDueService,
    private companyCashService: CompanyCashService,
    private partnerWalletService: PartnerWalletService,
    private stockSalesService: StockSalesService
  ) {
    this.supabase = createClient(
      'https://lcwjtwidxihclizliksd.supabase.co',
      'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
    );
  }

  // Labour Summary
  getLabourSummary(from?: string, to?: string) {
    let q = this.supabase.from('labour').select('amount');

    if (from && to) q = q.gte('date', from).lte('date', to);

    console.log('[ReportsService] getLabourSummary params ->', { from, to });
    return q;
  }

  // Partner Expenses
  getPartnerExpenses() {
    console.log('[ReportsService] getPartnerExpenses');
    return this.supabase
      .from('partner_expense')
      .select('partner,amount,category');
  }

  getProductionSummary(from?: string, to?: string) {
    let q = this.supabase.from('production').select('*');

    if (from && to) q = q.gte('date', from).lte('date', to);

    console.log('[ReportsService] getProductionSummary params ->', { from, to });
    return q;
  }

  // ⚠️ Damage Summary
  getDamageSummary(from?: string, to?: string) {
    let q = this.supabase.from('production_damage').select('*');

    if (from && to) q = q.gte('date', from).lte('date', to);

    console.log('[ReportsService] getDamageSummary params ->', { from, to });
    return q;
  }

  // 💰 Selling Summary
  getSellingsSummary(from?: string, to?: string) {
    let q = this.supabase.from('production_selling').select('*');

    if (from && to) q = q.gte('date', from).lte('date', to);

    console.log('[ReportsService] getSellingsSummary params ->', { from, to });
    return q;
  }

  // ============ NEW REPORTING FUNCTIONS ============

  // Client Financial Report (Revenue, Payments, Due)
  async getClientFinancialReport(from?: string, to?: string) {
    console.log('[ReportsService] getClientFinancialReport params ->', { from, to });
    const allClientsDue = await this.clientDueService.getAllClientsDue();
    const totalRevenue = await this.clientDueService.getTotalRevenue(from, to);
    const totalReceived = await this.clientDueService.getTotalReceived(from, to);
    const totalDue = await this.clientDueService.getTotalDue(from, to);

    return {
      period: { from, to },
      summary: {
        totalRevenue,
        totalReceived,
        totalDue,
        collectionRate: totalRevenue > 0 ? ((totalReceived / totalRevenue) * 100).toFixed(2) : 0
      },
      byClient: allClientsDue
    };
  }

  // Partner Financial Report
  async getPartnerFinancialReport(from?: string, to?: string) {
    console.log('[ReportsService] getPartnerFinancialReport params ->', { from, to });
    const partnerSummary = await this.partnerWalletService.getPartnerSummary(from, to);
    const totalExpense = partnerSummary.reduce((sum: number, p: any) => sum + p.totalExpense, 0);
    const totalWithdrawal = partnerSummary.reduce((sum: number, p: any) => sum + p.totalWithdrawal, 0);

    return {
      period: { from, to },
      summary: {
        totalExpense,
        totalWithdrawal,
        netBalance: totalExpense - totalWithdrawal
      },
      byPartner: partnerSummary
    };
  }

  // Company Cash Flow Report
  async getCompanyCashFlowReport(from: string, to: string) {
    console.log('[ReportsService] getCompanyCashFlowReport params ->', { from, to });
    return this.companyCashService.getCashSummary(from, to);
  }

  // Production & Stock Sales Report
  async getProductionStockReport(from?: string, to?: string) {
    console.log('[ReportsService] getProductionStockReport params ->', { from, to });
    const prodVsSales = await this.stockSalesService.getProductionVsSales(from, to);
    const salesByType = await this.stockSalesService.getStockSalesByType(from, to);
    const totalRevenue = await this.stockSalesService.getTotalStockSalesRevenue(from, to);

    return {
      period: { from, to },
      production: prodVsSales.production,
      sales: prodVsSales.sales,
      remaining: prodVsSales.remaining,
      salesDetail: salesByType,
      totalSalesRevenue: totalRevenue
    };
  }

  // Comprehensive Business Report
  async getComprehensiveReport(from?: string, to?: string) {
    console.log('[ReportsService] getComprehensiveReport params ->', { from, to });
    const [clientReport, partnerReport, prodReport] = await Promise.all([
      this.getClientFinancialReport(from, to),
      this.getPartnerFinancialReport(from, to),
      this.getProductionStockReport(from, to)
    ]);

    const labourSummary = await this.getLabourSummary(from, to);
    const labourTotal = (labourSummary.data || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0);

    const partnerExpenses = await this.getPartnerExpenses();
    const partnerExpenseTotal = (partnerExpenses.data || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const totalExpenses = labourTotal + partnerExpenseTotal + partnerReport.summary.totalWithdrawal;
    const totalIncome = clientReport.summary.totalReceived;
    const profitLoss = totalIncome - totalExpenses;

    return {
      period: { from, to },
      summary: {
        totalRevenue: clientReport.summary.totalRevenue,
        totalReceived: totalIncome,
        totalDue: clientReport.summary.totalDue,
        totalExpenses,
        profitLoss,
        profitMargin: clientReport.summary.totalRevenue > 0 ? ((profitLoss / clientReport.summary.totalRevenue) * 100).toFixed(2) : 0
      },
      financial: {
        client: clientReport,
        partner: partnerReport,
        labour: { total: labourTotal }
      },
      production: prodReport
    };
  }

  // Profit & Loss Statement
  async getProfitLossStatement(from?: string, to?: string) {
    console.log('[ReportsService] getProfitLossStatement params ->', { from, to });
    const revenue = await this.clientDueService.getTotalRevenue(from, to);
    const labourCost = (await this.getLabourSummary(from, to)).data || [];
    const partnerExpenses = (await this.getPartnerExpenses()).data || [];
    const partnerWithdrawals = await this.supabase
      .from('partner_withdrawal')
      .select('amount')
      .then(res => res.data || []);

    const totalLabour = labourCost.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
    const totalPartnerExpense = partnerExpenses.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalPartnerWithdraw = partnerWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    const totalExpenses = totalLabour + totalPartnerExpense + totalPartnerWithdraw;
    const grossProfit = revenue - totalExpenses;

    return {
      period: { from, to },
      revenue,
      expenses: {
        labour: totalLabour,
        partnerExpense: totalPartnerExpense,
        partnerWithdrawal: totalPartnerWithdraw,
        total: totalExpenses
      },
      profitLoss: {
        grossProfit,
        profitMargin: revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0
      }
    };
  }
}

