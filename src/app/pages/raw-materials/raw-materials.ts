import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface Material {
  material_id: string;
  material_name: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  low_stock_alert: number;
}

@Component({
  selector: 'app-raw-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raw-materials.html',
  styleUrls: ['./raw-materials.css']
})
export class RawMaterialsComponent implements OnInit {

  materials: Material[] = [];
  partners: any[] = [];
  
  // Purchase form
  selectedMaterial: string = 'Cement';
  purchaseQuantity: number = 0;
  purchaseUnitCost: number = 0;
  vendorName: string = '';
  purchaseDate: string = '';
  paidByPartnerId: string = '';
  
  loading = false;
  successMessage = '';
  errorMessage = '';
  
  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.loading = true;
    this.purchaseDate = new Date().toISOString().split('T')[0];
    this.loadMaterials();
    this.loadPartners();
  }

  async refreshData() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
    try {
      await this.loadMaterials();
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

  async loadMaterials() {
    try {
      const { data, error } = await this.db.queryView('raw_materials_master');
      if (error) throw error;
      this.materials = data || [];
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading materials:', error);
      this.errorMessage = 'Failed to load materials';
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
      console.log('✅ Partners loaded:', this.partners);
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading partners:', error);
      this.errorMessage = 'Failed to load partners';
      this.cd.detectChanges();
    }
  }

  async recordPurchase() {
    if (!this.selectedMaterial) {
      this.errorMessage = '⚠️ Select a material first';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (this.purchaseQuantity <= 0) {
      this.errorMessage = '⚠️ Enter a valid quantity';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (this.purchaseUnitCost <= 0) {
      this.errorMessage = '⚠️ Enter a valid unit cost';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.vendorName) {
      this.errorMessage = '⚠️ Enter vendor name';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (!this.paidByPartnerId) {
      this.errorMessage = '⚠️ Select who paid for this purchase';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cd.detectChanges();
    try {
      const selectedMat = this.materials.find(m => m.material_name === this.selectedMaterial);
      if (!selectedMat) throw new Error('Material not found');
      
      const totalCost = this.purchaseQuantity * this.purchaseUnitCost;
      
      // Insert purchase record
      const { error } = await this.db.supabase
        .from('raw_materials_purchase')
        .insert([{
          date: this.purchaseDate,
          material_id: selectedMat.material_id,
          quantity: this.purchaseQuantity,
          unit_cost: this.purchaseUnitCost,
          total_cost: totalCost,
          vendor_name: this.vendorName
        }]);
      
      if (error) throw error;
      
      // Update material stock
      const { error: updateError } = await this.db.supabase
        .from('raw_materials_master')
        .update({ current_stock: selectedMat.current_stock + this.purchaseQuantity })
        .eq('material_id', selectedMat.material_id);
      
      if (updateError) throw updateError;
      
      // Record payment in firm cash ledger
      const selectedPartner = this.partners.find(p => p.partner_id === this.paidByPartnerId);
      const paymentSource = this.paidByPartnerId === 'FIRM_CASH' ? 'Firm Cash' : 
                           (selectedPartner?.full_name || 'Partner');
      
      const { error: ledgerError } = await this.db.supabase
        .from('firm_cash_ledger')
        .insert([{
          transaction_type: 'expense',
          category: 'material_purchase',
          amount: totalCost,
          partner_id: this.paidByPartnerId === 'FIRM_CASH' ? null : this.paidByPartnerId,
          description: `Material Purchase: ${this.purchaseQuantity} ${selectedMat.unit} ${this.selectedMaterial} from ${this.vendorName} (Paid by ${paymentSource})`,
          transaction_date: this.purchaseDate
        }]);
      
      if (ledgerError) throw ledgerError;
      
      this.successMessage = `✅ ${this.purchaseQuantity} ${selectedMat.unit} of ${this.selectedMaterial} purchased from ${this.vendorName} (Paid by ${paymentSource})`;
      this.cd.detectChanges();
      
      this.purchaseQuantity = 0;
      this.purchaseUnitCost = 0;
      this.vendorName = '';
      this.paidByPartnerId = '';
      this.cd.detectChanges();
      
      await this.loadMaterials();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      this.errorMessage = '❌ Failed to record purchase. Please try again.';
      console.error(error);
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  getTotalStockValue(): number {
    return this.materials.reduce((sum, m) => sum + (m.current_stock * m.unit_cost), 0);
  }
  
  getLowStockMaterials(): Material[] {
    return this.materials.filter(m => m.current_stock <= m.low_stock_alert);
  }
}
