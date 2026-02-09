import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface LabourEntry {
  name: string;
  type: string;
  amount: number;
}

interface MaterialEntry {
  material_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface ExpenseEntry {
  category: string;
  amount: number;
}

interface Partner {
  partner_id: string;
  name: string;
  profit_share: number;
}

@Component({
  selector: 'app-daily-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-entry.html',
  styleUrl: './daily-entry.css'
})
export class DailyEntryComponent implements OnInit {

  // Form data
  entryDate: string = '';
  
  // Labour section
  labourEntries: LabourEntry[] = [];
  newLabourName: string = '';
  newLabourType: string = 'Full Day';
  newLabourAmount: number = 0;
  labourTypes = ['Half Day', 'Full Day', 'Outdoor', 'Custom'];
  
  // Production section
  poles: number = 0;
  roundPlates: number = 0;
  plainPlates: number = 0;
  jumpoPillars: number = 0;
  biscuitPlates: number = 0;
  
  // Materials section
  materialEntries: MaterialEntry[] = [];
  selectedMaterial: string = 'Cement';
  customMaterialName: string = '';
  showCustomMaterialInput: boolean = false;
  materialQuantity: number = 0;
  materialUnitCost: number = 0;
  materialPaidByPartnerId: string = '';
  materials = ['Cement', 'Sariya', 'Sand', 'Gitti', 'Wire', 'Mobile', 'Custom'];
  materialUnits: { [key: string]: string } = {
    'Cement': 'bag',
    'Sariya': 'kg',
    'Sand': 'ton',
    'Gitti': 'ton',
    'Wire': 'kg',
    'Mobile': 'recharge',
    'Custom': 'unit'
  };
  materialCosts: { [key: string]: number } = {
    'Cement': 40,
    'Sariya': 60,
    'Sand': 500,
    'Gitti': 450,
    'Wire': 80,
    'Mobile': 100,
    'Custom': 0
  };
  
  // Expenses section
  expenseEntries: ExpenseEntry[] = [];
  expenseCategory: string = '';
  expenseAmount: number = 0;
  expensesPaidByPartnerId: string = '';
  expenseCategories = ['Diesel', 'Snacks', 'Maintenance', 'Transport', 'Other'];
  
  // Notes
  notes: string = '';
  
  // Partners list
  partners: Partner[] = [];
  
  // UI state
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  
  constructor(
    private db: SupabaseService,
    private cd: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.entryDate = today;
    this.loading = true;
    this.loadPartners().finally(() => {
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  async refreshData() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
    try {
      await this.loadPartners();
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

  async loadPartners() {
    try {
      const { data, error } = await this.db.queryView('partner_master');
      if (error) throw error;
      this.partners = data || [];
      if (this.partners.length > 0) {
        this.materialPaidByPartnerId = this.partners[0].partner_id;
        this.expensesPaidByPartnerId = this.partners[0].partner_id;
      }
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading partners:', error);
      this.errorMessage = 'Failed to load partners';
    } finally {
      this.loading = false;
    }
  }

  // ===== LABOUR SECTION =====
  onLabourTypeChange() {
    // Auto-set amount based on labour type
    const typeAmounts: { [key: string]: number } = {
      'Half Day': 200,
      'Full Day': 400,
      'Outdoor': 450,
      'Custom': 0
    };
    
    if (this.newLabourType === 'Custom') {
      this.newLabourAmount = 0; // User will enter custom amount
    } else {
      this.newLabourAmount = typeAmounts[this.newLabourType] || 0;
    }
  }

  addLabourEntry() {
    if (!this.newLabourName) {
      this.errorMessage = '⚠️ Labour name is required';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.newLabourType || this.newLabourAmount <= 0) {
      this.errorMessage = '⚠️ Please fill all labour fields with valid amounts';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.labourEntries.push({
      name: this.newLabourName,
      type: this.newLabourType,
      amount: this.newLabourAmount
    });
    
    this.successMessage = `✅ ${this.newLabourName} added`;
    this.cd.detectChanges();
    setTimeout(() => this.successMessage = '', 2000);
    
    this.newLabourName = '';
    this.newLabourType = 'Full Day';
    this.newLabourAmount = 0;
    this.cd.detectChanges();
  }
  
  removeLabourEntry(index: number) {
    this.labourEntries.splice(index, 1);
  }
  
  getTotalLabourCost(): number {
    return this.labourEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }
  
  // ===== PRODUCTION SECTION =====
  getTotalProduction() {
    return {
      poles: this.poles,
      roundPlates: this.roundPlates,
      plainPlates: this.plainPlates,
      jumpoPillars: this.jumpoPillars,
      biscuitPlates: this.biscuitPlates
    };
  }
  
  // ===== MATERIALS SECTION =====
  addMaterialEntry() {
    // Validate custom material name if Custom is selected
    if (this.selectedMaterial === 'Custom' && !this.customMaterialName.trim()) {
      this.errorMessage = '⚠️ Please enter custom material name';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (!this.selectedMaterial || this.materialQuantity <= 0 || this.materialUnitCost <= 0) {
      this.errorMessage = '⚠️ Please fill all material fields with valid amounts';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    if (!this.materialPaidByPartnerId) {
      this.errorMessage = '⚠️ Please select who paid for the material';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    const totalCost = this.materialQuantity * this.materialUnitCost;
    const materialName = this.selectedMaterial === 'Custom' ? this.customMaterialName : this.selectedMaterial;
    
    this.materialEntries.push({
      material_name: materialName,
      quantity: this.materialQuantity,
      unit_cost: this.materialUnitCost,
      total_cost: totalCost
    });
    
    this.successMessage = `✅ ${materialName} added (₹${totalCost.toFixed(2)})`;
    this.cd.detectChanges();
    setTimeout(() => this.successMessage = '', 2000);
    
    this.selectedMaterial = 'Cement';
    this.customMaterialName = '';
    this.showCustomMaterialInput = false;
    this.materialQuantity = 0;
    this.materialUnitCost = 0;
    this.materialPaidByPartnerId = '';
    this.cd.detectChanges();
  }
  
  removeMaterialEntry(index: number) {
    this.materialEntries.splice(index, 1);
  }
  
  getTotalMaterialCost(): number {
    return this.materialEntries.reduce((sum, entry) => sum + entry.total_cost, 0);
  }
  
  onMaterialSelected(material: string) {
    this.selectedMaterial = material;
    this.showCustomMaterialInput = (material === 'Custom');
    if (material === 'Custom') {
      this.customMaterialName = '';
      this.materialUnitCost = 0;
    } else {
      this.materialUnitCost = this.materialCosts[material] || 0;
    }
    this.cd.detectChanges();
  }
  
  // ===== EXPENSES SECTION =====
  addExpenseEntry() {
    if (!this.expenseCategory) {
      this.errorMessage = '⚠️ Select expense category';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.errorMessage = '⚠️ Enter valid expense amount';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.expenseEntries.push({
      category: this.expenseCategory,
      amount: this.expenseAmount
    });
    
    this.successMessage = `✅ ${this.expenseCategory} expense added (₹${this.expenseAmount.toFixed(2)})`;
    this.cd.detectChanges();
    setTimeout(() => this.successMessage = '', 2000);
    
    this.expenseCategory = '';
    this.expenseAmount = 0;
    this.cd.detectChanges();
  }
  
  removeExpenseEntry(index: number) {
    this.expenseEntries.splice(index, 1);
  }
  
  getTotalExpenses(): number {
    return this.expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }
  
  // ===== TOTALS =====
  getGrandTotal(): number {
    return this.getTotalLabourCost() + this.getTotalMaterialCost() + this.getTotalExpenses();
  }
  
  // ===== SUBMIT =====
  async submitDailyEntry() {
    this.submitted = true;
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    try {
      // Validation
      if (!this.entryDate) {
        throw new Error('Date is required');
      }
      
      if (!this.materialPaidByPartnerId || !this.expensesPaidByPartnerId) {
        throw new Error('Please select which partner paid for materials and expenses');
      }
      
      // Prepare data
      const dailyEntry = {
        date: this.entryDate,
        labour_json: this.labourEntries,
        total_labour_cost: this.getTotalLabourCost(),
        labour_paid_by_partner_id: null, // Labour payments recorded separately in Labour Ledger
        production_json: this.getTotalProduction(),
        materials_json: this.materialEntries,
        total_material_cost: this.getTotalMaterialCost(),
        material_paid_by_partner_id: this.materialPaidByPartnerId,
        expenses_json: this.expenseEntries,
        total_expenses: this.getTotalExpenses(),
        expenses_paid_by_partner_id: this.expensesPaidByPartnerId,
        notes: this.notes
      };
      
      // Insert into database
      const { data, error } = await this.db.supabase
        .from('daily_entries')
        .upsert([dailyEntry], { onConflict: 'date' });
      
      if (error) throw error;
      
      // Also record in partner_expense_tracking (only for materials and expenses, not labour)
      if (this.getTotalMaterialCost() > 0) {
        await this.recordPartnerExpense('material', this.getTotalMaterialCost(), this.materialPaidByPartnerId);
      }
      if (this.getTotalExpenses() > 0) {
        await this.recordPartnerExpense('daily_expense', this.getTotalExpenses(), this.expensesPaidByPartnerId);
      }
      
      this.successMessage = `✅ Daily entry for ${this.entryDate} saved successfully!`;
      
      // Reset form
      setTimeout(() => {
        this.resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Error saving daily entry:', error);
      this.errorMessage = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    } finally {
      this.loading = false;
      this.submitted = false;
      this.cd.detectChanges();
    }
  }
  
  private async recordPartnerExpense(expenseType: string, amount: number, partnerId: string) {
    try {
      const { error } = await this.db.supabase
        .from('partner_expense_tracking')
        .insert([{
          date: this.entryDate,
          paid_by_partner_id: partnerId,
          expense_type: expenseType,
          amount: amount,
          daily_entry_id: null
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error recording partner expense:', error);
    }
  }
  
  resetForm() {
    this.entryDate = new Date().toISOString().split('T')[0];
    this.labourEntries = [];
    this.newLabourName = '';
    this.newLabourType = 'Full Day';
    this.newLabourAmount = 0;
    this.poles = 0;
    this.roundPlates = 0;
    this.plainPlates = 0;
    this.jumpoPillars = 0;
    this.biscuitPlates = 0;
    this.materialEntries = [];
    this.selectedMaterial = 'Cement';
    this.materialQuantity = 0;
    this.materialUnitCost = 0;
    this.expenseEntries = [];
    this.expenseCategory = '';
    this.expenseAmount = 0;
    this.notes = '';
    this.successMessage = '';
  }
}
