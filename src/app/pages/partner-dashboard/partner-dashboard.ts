import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface PartnerInfo {
  id: string;
  name: string;
  percentage: number;
  total_earned: number;
  labour_contributed: number;
  materials_contributed: number;
  expenses_contributed: number;
  total_contributed: number;
  cash_given: number;
  cash_taken: number;
  net_cash: number;
  profit_due: number;
  settlement_due: number;
}

interface Settlement {
  id: string;
  partner_id: string;
  partner_name: string;
  settlement_date: string;
  amount: number;
  payment_mode: string;
  notes: string;
}

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-dashboard.html',
  styleUrl: './partner-dashboard.css'
})
export class PartnerDashboardComponent implements OnInit {
  partners: PartnerInfo[] = [];
  settlements: Settlement[] = [];
  
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedPartner: string = '';
  
  settlementForm = {
    partner_id: '',
    amount: 0,
    payment_mode: 'cash',
    notes: ''
  };
  
  showSettlementForm = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    setTimeout(() => {
      this.loading = true;
      this.cd.detectChanges();
      Promise.all([this.loadPartnerData(), this.loadSettlements()]).finally(() => {
        this.loading = false;
        this.cd.detectChanges();
      });
    });
  }

  async refreshData() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
    try {
      await Promise.all([this.loadPartnerData(), this.loadSettlements()]);
      this.successMessage = '✅ Data refreshed successfully!';
      this.cd.detectChanges();
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.errorMessage = '❌ Failed to refresh data';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  async loadPartnerData() {
    try {
      // Get partners from partner_master table
      const { data: partners, error } = await this.db.supabase
        .from('partner_master')
        .select('*');

      if (error) throw error;

      const partnerMap = new Map<string, any>();

      // Initialize with partners from database
      if (partners) {
        partners.forEach(p => {
          partnerMap.set(p.id, {
            id: p.id,
            name: p.partner_name,
            percentage: p.investment_percentage,
            total_earned: 0,
            labour_contributed: 0,
            materials_contributed: 0,
            expenses_contributed: 0,
            total_contributed: 0,
            cash_given: 0,
            cash_taken: 0,
            net_cash: 0,
            profit_due: 0,
            settlement_due: 0
          });
        });
      }

      // Get material purchases made by partners
      const { data: purchases } = await this.db.supabase
        .from('raw_materials_purchase')
        .select('partner_id, total_amount, paid_from');

      if (purchases) {
        purchases.forEach(p => {
          if (p.partner_id && partnerMap.has(p.partner_id)) {
            const partner = partnerMap.get(p.partner_id);
            if (p.paid_from === 'partner_pocket') {
              partner.materials_contributed += p.total_amount;
            }
          }
        });
      }

      // Get cash transactions from firm_cash_ledger
      const { data: cashTxns } = await this.db.supabase
        .from('firm_cash_ledger')
        .select('partner_id, type, amount');

      if (cashTxns) {
        cashTxns.forEach(txn => {
          if (txn.partner_id && partnerMap.has(txn.partner_id)) {
            const partner = partnerMap.get(txn.partner_id);
            if (txn.type === 'receipt') {
              partner.cash_given += txn.amount;
            } else if (txn.type === 'payment') {
              partner.cash_taken += txn.amount;
            }
          }
        });
      }

      // Calculate totals and profit share
      const totalRevenue = await this.getTotalRevenue();
      
      partnerMap.forEach(partner => {
        partner.total_contributed = partner.labour_contributed + 
                                   partner.materials_contributed + 
                                   partner.expenses_contributed;
        partner.total_earned = (totalRevenue * partner.percentage) / 100;
        partner.net_cash = partner.cash_given - partner.cash_taken;
        partner.profit_due = partner.total_earned - partner.net_cash;
        partner.settlement_due = Math.max(0, partner.profit_due);
      });

      this.partners = Array.from(partnerMap.values());
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading partner data:', error);
      this.errorMessage = 'Failed to load partner data';
      this.cd.detectChanges();
    }
  }

  async getTotalRevenue(): Promise<number> {
    try {
      const { data, error } = await this.db.supabase
        .from('sales_transactions')
        .select('total_amount');

      if (error) throw error;

      return data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    } catch (error) {
      console.error('Error calculating revenue:', error);
      return 0;
    }
  }

  getNextMonth(month: string): string {
    const date = new Date(month + '-01');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
  }

  async loadSettlements() {
    try {
      // Get settlements
      const { data: settlementsData, error: settlementsError } = await this.db.supabase
        .from('partner_settlements')
        .select('*')
        .order('settlement_date', { ascending: false })
        .limit(50);

      if (settlementsError) throw settlementsError;

      // Get partner names from partner_master
      const { data: partnersData } = await this.db.supabase
        .from('partner_master')
        .select('id, partner_name');

      const partnerNames = new Map<string, string>();
      partnersData?.forEach(p => partnerNames.set(p.id, p.partner_name));

      this.settlements = settlementsData?.map(s => ({
        ...s,
        partner_name: partnerNames.get(s.partner_id) || 'Unknown'
      })) || [];
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading settlements:', error);
      this.cd.detectChanges();
    }
  }

  openSettlementForm(partnerId: string) {
    this.settlementForm.partner_id = partnerId;
    this.settlementForm.amount = 0;
    this.settlementForm.payment_mode = 'cash';
    this.settlementForm.notes = '';
    this.showSettlementForm = true;
  }

  async submitSettlement() {
    if (!this.settlementForm.partner_id) {
      this.errorMessage = '⚠️ Please select a partner';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.settlementForm.amount || this.settlementForm.amount <= 0) {
      this.errorMessage = '⚠️ Enter a valid settlement amount';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    const partner = this.partners.find(p => p.id === this.settlementForm.partner_id);
    if (partner && this.settlementForm.amount > partner.settlement_due) {
      this.errorMessage = `⚠️ Settlement amount exceeds due amount (₹${partner.settlement_due.toFixed(2)})`;
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.loading = true;
    this.cd.detectChanges();
    try {
      const { error } = await this.db.supabase
        .from('partner_settlements')
        .insert([{
          partner_id: parseInt(this.settlementForm.partner_id),
          settlement_date: new Date().toISOString().split('T')[0],
          amount: this.settlementForm.amount,
          payment_mode: this.settlementForm.payment_mode,
          notes: this.settlementForm.notes
        }]);

      if (error) throw error;

      this.successMessage = `✅ Settlement of ₹${this.settlementForm.amount.toFixed(2)} recorded for ${partner?.name || 'partner'}`;
      this.showSettlementForm = false;
      this.cd.detectChanges();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
        this.loadPartnerData();
        this.loadSettlements();
      }, 2000);
    } catch (error) {
      console.error('Error submitting settlement:', error);
      this.errorMessage = '❌ Failed to record settlement';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  onMonthChange() {
    this.loadPartnerData();
  }

  getNetCashDisplay(partner: PartnerInfo): string {
    if (partner.net_cash > 0) return `+₹${partner.net_cash.toFixed(2)}`;
    if (partner.net_cash < 0) return `-₹${Math.abs(partner.net_cash).toFixed(2)}`;
    return '₹0.00';
  }

  getNetCashClass(partner: PartnerInfo): string {
    if (partner.net_cash > 0) return 'positive';
    if (partner.net_cash < 0) return 'negative';
    return '';
  }

  closeSettlementForm() {
    this.showSettlementForm = false;
    this.errorMessage = '';
  }
}
