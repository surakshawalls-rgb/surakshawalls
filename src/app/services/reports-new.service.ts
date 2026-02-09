// src/app/services/reports-new.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DailySummary {
  date: string;
  production_quantity: number;
  production_cost: number;
  sales_quantity: number;
  sales_revenue: number;
  sales_collected: number;
  material_purchase: number;
  labor_wages: number;
  yard_loss: number;
  firm_cash_balance: number;
}

export interface MonthlyPL {
  month: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  operational_expenses: number;
  labor_cost: number;
  net_profit: number;
  profit_margin: number;
}

export interface PartnerSettlement {
  partner_id: string;
  partner_name: string;
  investment_share: number;
  purchases_from_pocket: number;
  collections_made: number;
  withdrawals: number;
  net_position: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsNewService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get daily summary report
   */
  async getDailySummary(date: string): Promise<DailySummary | null> {
    try {
      // Production
      const { data: production } = await this.supabase.supabase
        .from('production_entries')
        .select('success_quantity, rejected_quantity, total_material_cost, labor_cost')
        .eq('date', date);

      const productionQty = production?.reduce((sum, p) => sum + p.success_quantity + p.rejected_quantity, 0) || 0;
      const productionCost = production?.reduce((sum, p) => sum + p.total_material_cost + p.labor_cost, 0) || 0;

      // Sales
      const { data: sales } = await this.supabase.supabase
        .from('sales_transactions')
        .select('quantity, total_amount, paid_amount')
        .eq('date', date);

      const salesQty = sales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
      const salesRevenue = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const salesCollected = sales?.reduce((sum, s) => sum + s.paid_amount, 0) || 0;

      // Material Purchase
      const { data: purchases } = await this.supabase.supabase
        .from('raw_materials_purchase')
        .select('total_amount')
        .eq('date', date);

      const materialPurchase = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

      // Labor Wages
      const laborWages = production?.reduce((sum, p) => sum + p.labor_cost, 0) || 0;

      // Yard Loss
      const { data: wastage } = await this.supabase.supabase
        .from('yard_loss')
        .select('quantity')
        .eq('date', date);

      const yardLoss = wastage?.reduce((sum, w) => sum + w.quantity, 0) || 0;

      // Firm Cash Balance
      const { data: cashBalance } = await this.supabase.supabase.rpc('get_firm_cash_balance');
      const firmCashBalance = cashBalance || 0;

      return {
        date,
        production_quantity: productionQty,
        production_cost: productionCost,
        sales_quantity: salesQty,
        sales_revenue: salesRevenue,
        sales_collected: salesCollected,
        material_purchase: materialPurchase,
        labor_wages: laborWages,
        yard_loss: yardLoss,
        firm_cash_balance: firmCashBalance
      };

    } catch (error: any) {
      console.error('[ReportsNewService] getDailySummary error:', error);
      return null;
    }
  }

  /**
   * Get monthly P&L report
   */
  async getMonthlyPL(month: string): Promise<MonthlyPL | null> {
    try {
      // Calculate proper end date for the month
      const [year, monthNum] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

      // Revenue (sales)
      const { data: sales } = await this.supabase.supabase
        .from('sales_transactions')
        .select('total_amount')
        .gte('date', startDate)
        .lte('date', endDate);

      const revenue = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;

      // COGS (production material cost)
      const { data: production } = await this.supabase.supabase
        .from('production_entries')
        .select('total_material_cost')
        .gte('date', startDate)
        .lte('date', endDate);

      const cogs = production?.reduce((sum, p) => sum + p.total_material_cost, 0) || 0;

      // Labor Cost
      const { data: labor } = await this.supabase.supabase
        .from('production_entries')
        .select('labor_cost')
        .gte('date', startDate)
        .lte('date', endDate);

      const laborCost = labor?.reduce((sum, l) => sum + l.labor_cost, 0) || 0;

      // Operational Expenses (firm cash payments)
      const { data: expenses } = await this.supabase.supabase
        .from('firm_cash_ledger')
        .select('amount')
        .eq('type', 'payment')
        .in('category', ['operational', 'purchase'])
        .gte('date', startDate)
        .lte('date', endDate);

      const operationalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - laborCost - operationalExpenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        month,
        revenue,
        cogs,
        gross_profit: grossProfit,
        operational_expenses: operationalExpenses,
        labor_cost: laborCost,
        net_profit: netProfit,
        profit_margin: profitMargin
      };

    } catch (error: any) {
      console.error('[ReportsNewService] getMonthlyPL error:', error);
      return null;
    }
  }

  /**
   * Get partner settlement report
   */
  async getPartnerSettlement(startDate: string, endDate: string): Promise<PartnerSettlement[]> {
    try {
      const { data: partners } = await this.supabase.supabase
        .from('partner_master')
        .select('*');

      if (!partners) return [];

      const settlements: PartnerSettlement[] = [];

      for (const partner of partners) {
        // Purchases from partner pocket
        const { data: purchases } = await this.supabase.supabase
          .from('raw_materials_purchase')
          .select('total_amount')
          .eq('partner_id', partner.id)
          .eq('paid_from', 'partner_pocket')
          .gte('date', startDate)
          .lte('date', endDate);

        const purchasesFromPocket = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

        // Collections made by partner
        const { data: collections } = await this.supabase.supabase
          .from('sales_transactions')
          .select('paid_amount')
          .eq('collected_by_partner_id', partner.id)
          .eq('deposited_to_firm', false)
          .gte('date', startDate)
          .lte('date', endDate);

        const collectionsMade = collections?.reduce((sum, c) => sum + c.paid_amount, 0) || 0;

        // Withdrawals
        const { data: withdrawals } = await this.supabase.supabase
          .from('firm_cash_ledger')
          .select('amount')
          .eq('type', 'payment')
          .eq('category', 'partner_withdrawal')
          .eq('partner_id', partner.id)
          .gte('date', startDate)
          .lte('date', endDate);

        const withdrawalAmount = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

        // Net position: collections + purchases - withdrawals
        const netPosition = collectionsMade + purchasesFromPocket - withdrawalAmount;

        settlements.push({
          partner_id: partner.id,
          partner_name: partner.partner_name,
          investment_share: partner.investment_percentage,
          purchases_from_pocket: purchasesFromPocket,
          collections_made: collectionsMade,
          withdrawals: withdrawalAmount,
          net_position: netPosition
        });
      }

      return settlements;

    } catch (error: any) {
      console.error('[ReportsNewService] getPartnerSettlement error:', error);
      return [];
    }
  }

  /**
   * Get worker ledger report
   */
  async getWorkerLedgerReport(startDate: string, endDate: string) {
    try {
      const { data: workers } = await this.supabase.supabase
        .from('workers_master')
        .select('*');

      if (!workers) return [];

      const workerReports = [];

      for (const worker of workers) {
        const { data: statement } = await this.supabase.supabase.rpc('get_worker_statement', {
          p_worker_id: worker.id,
          p_start_date: startDate,
          p_end_date: endDate
        });

        workerReports.push({
          worker_id: worker.id,
          worker_name: worker.name,
          total_earned: statement?.reduce((sum: number, s: any) => sum + (s.earned || 0), 0) || 0,
          total_paid: statement?.reduce((sum: number, s: any) => sum + (s.paid || 0), 0) || 0,
          current_balance: worker.cumulative_balance
        });
      }

      return workerReports;

    } catch (error: any) {
      console.error('[ReportsNewService] getWorkerLedgerReport error:', error);
      return [];
    }
  }

  /**
   * Get material stock report
   */
  async getMaterialStockReport() {
    try {
      const { data: materials } = await this.supabase.supabase
        .from('raw_materials_master')
        .select('*')
        .order('material_name');

      return materials?.map(m => ({
        material_name: m.material_name,
        current_stock: m.current_stock,
        unit: m.unit,
        unit_cost: m.unit_cost,
        stock_value: m.current_stock * m.unit_cost,
        reorder_level: m.reorder_level,
        needs_reorder: m.current_stock <= m.reorder_level,
        last_purchase_date: m.last_purchase_date,
        last_purchase_rate: m.last_purchase_rate
      })) || [];

    } catch (error: any) {
      console.error('[ReportsNewService] getMaterialStockReport error:', error);
      return [];
    }
  }

  /**
   * Get client outstanding report
   */
  async getClientOutstandingReport() {
    try {
      const { data: clients } = await this.supabase.supabase
        .from('client_ledger')
        .select('*')
        .gt('outstanding', 0)
        .order('outstanding', { ascending: false });

      return clients?.map(c => ({
        client_name: c.client_name,
        phone: c.phone,
        total_billed: c.total_billed,
        total_paid: c.total_paid,
        outstanding: c.outstanding,
        credit_limit: c.credit_limit,
        exceeding_limit: c.outstanding > c.credit_limit,
        overdue_days: 0 // TODO: Calculate based on last invoice date
      })) || [];

    } catch (error: any) {
      console.error('[ReportsNewService] getClientOutstandingReport error:', error);
      return [];
    }
  }

  /**
   * Get inventory valuation report
   */
  async getInventoryValuationReport() {
    try {
      const { data: inventory } = await this.supabase.supabase
        .from('finished_goods_inventory')
        .select('*')
        .order('product_name');

      return inventory?.map(i => ({
        product_name: i.product_name,
        current_stock: i.current_stock,
        unit_cost: i.unit_cost,
        selling_price: i.selling_price,
        stock_value: i.current_stock * i.unit_cost,
        potential_revenue: i.current_stock * i.selling_price,
        potential_profit: i.current_stock * (i.selling_price - i.unit_cost)
      })) || [];

    } catch (error: any) {
      console.error('[ReportsNewService] getInventoryValuationReport error:', error);
      return [];
    }
  }
}
