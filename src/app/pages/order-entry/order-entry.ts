import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

interface Worker {
  name: string;
  type: 'HALF' | 'FULL' | 'OUTDOOR' | 'CUSTOM';
  amount: number;
}

interface OrderData {
  [key: string]: any; // Add index signature for template binding
  
  id?: string;
  date: string;
  client_name: string;
  client_phone: string;
  client_location: string;
  is_registered: boolean;
  
  // Production
  fencingPole: number;
  plainPlate: number;
  jumboPillar: number;
  roundPlate: number;
  biscuitPlate: number;
  production_unit_price: number;
  production_total: number;
  
  // Labour
  labour_json: Worker[];
  labour_total: number;
  
  // Additional Charges
  transport_charge: number;
  installation_charge: number;
  other_charge: number;
  notes: string;
  
  // Payment
  total_bill: number;
  paid_amount: number;
  due_amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Bank';
}

@Component({
  selector: 'app-order-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-entry.html',
  styleUrls: ['./order-entry.css']
})
export class OrderEntryComponent implements OnInit {

  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}

  // Language
  language: 'EN' | 'HI' = 'EN';
  toggleLang() { this.language = this.language === 'EN' ? 'HI' : 'EN'; }

  // Date & Format
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;
  
  // Form State
  order: OrderData = {
    date: new Date().toISOString().split('T')[0],
    client_name: '',
    client_phone: '',
    client_location: '',
    is_registered: false,
    
    fencingPole: 0,
    plainPlate: 0,
    jumboPillar: 0,
    roundPlate: 0,
    biscuitPlate: 0,
    production_unit_price: 0,
    production_total: 0,
    
    labour_json: [],
    labour_total: 0,
    
    transport_charge: 0,
    installation_charge: 0,
    other_charge: 0,
    notes: '',
    
    total_bill: 0,
    paid_amount: 0,
    due_amount: 0,
    payment_mode: 'Cash'
  };

  // Labour Form
  newWorker = '';
  workerType: 'HALF' | 'FULL' | 'OUTDOOR' | 'CUSTOM' = 'FULL';
  customWorkerAmount: number | null = null;

  // UI State
  activeTab: 'client' | 'production' | 'labour' | 'charges' | 'payment' = 'client';
  loading = false;
  orderHistory: any[] = [];
  showHistory = false;

  // Production Items Config
  productionItems = [
    { key: 'fencingPole', labelEN: 'Fencing Pole', labelHI: 'फेंसिंग पोल' },
    { key: 'plainPlate', labelEN: 'Plain Plate', labelHI: 'सादा प्लेट' },
    { key: 'jumboPillar', labelEN: 'Jumbo Pillar', labelHI: 'जंबो पिलर' },
    { key: 'roundPlate', labelEN: 'Round Plate', labelHI: 'राउंड प्लेट' },
    { key: 'biscuitPlate', labelEN: 'Biscuit Plate', labelHI: 'बिस्किट प्लेट' }
  ];

  // Worker Type Rates
  workerRates = {
    HALF: 200,
    FULL: 400,
    OUTDOOR: 450,
    CUSTOM: 0
  };

  async ngOnInit() {
    await this.loadOrderHistory();
  }

  // ========== LABOUR SECTION ==========
  addWorker() {
    if (!this.newWorker) return alert(this.language === 'EN' ? 'Enter worker name' : 'मजदूर का नाम दर्ज करें');

    let amount = 0;
    if (this.workerType === 'HALF') amount = 200;
    if (this.workerType === 'FULL') amount = 400;
    if (this.workerType === 'OUTDOOR') amount = 450;
    if (this.workerType === 'CUSTOM') {
      if (!this.customWorkerAmount) return alert(this.language === 'EN' ? 'Enter amount' : 'राशि दर्ज करें');
      amount = this.customWorkerAmount;
    }

    this.order.labour_json.push({
      name: this.newWorker,
      type: this.workerType,
      amount: amount
    });

    this.newWorker = '';
    this.customWorkerAmount = null;
    this.workerType = 'FULL';
    this.updateTotals();
  }

  removeWorker(index: number) {
    this.order.labour_json.splice(index, 1);
    this.updateTotals();
  }

  // ========== PRODUCTION SECTION ==========
  increaseProduction(key: string) {
    (this.order as any)[key]++;
    this.updateTotals();
  }

  decreaseProduction(key: string) {
    if ((this.order as any)[key] > 0) {
      (this.order as any)[key]--;
      this.updateTotals();
    }
  }

  // ========== CALCULATIONS ==========
  updateTotals() {
    // Production Total
    const productionCount = 
      this.order.fencingPole + 
      this.order.plainPlate + 
      this.order.jumboPillar + 
      this.order.roundPlate + 
      this.order.biscuitPlate;
    
    this.order.production_total = productionCount * (this.order.production_unit_price || 0);

    // Labour Total
    this.order.labour_total = this.order.labour_json.reduce((sum, w) => sum + w.amount, 0);

    // Bill Total
    this.order.total_bill = 
      this.order.production_total + 
      this.order.labour_total + 
      this.order.transport_charge + 
      this.order.installation_charge + 
      this.order.other_charge;

    // Due Amount
    this.order.due_amount = Math.max(0, this.order.total_bill - this.order.paid_amount);

    this.cd.detectChanges();
  }

  getTotalProduction(): number {
    return this.order.fencingPole + 
           this.order.plainPlate + 
           this.order.jumboPillar + 
           this.order.roundPlate + 
           this.order.biscuitPlate;
  }

  // ========== SAVE ORDER ==========
  async saveOrder() {
    if (!this.order.client_name) {
      return alert(this.language === 'EN' ? 'Enter client name' : 'क्लाइंट का नाम दर्ज करें');
    }

    const hasSomething = this.getTotalProduction() > 0 || this.order.labour_json.length > 0;
    if (!hasSomething) {
      return alert(this.language === 'EN' ? 'Add production or labour' : 'उत्पादन या मजदूरी जोड़ें');
    }

    this.startLoading();

    try {
      // Save order
      const response = await this.db.insertOrder(this.order);
      
      if (response.error) {
        alert(this.language === 'EN' ? 'Error saving order' : 'ऑर्डर सहेजने में त्रुटि');
        return;
      }

      alert(this.language === 'EN' ? '✅ Order saved successfully!' : '✅ ऑर्डर सफलतापूर्वक सहेजा गया!');
      
      // Reset Form
      this.resetForm();
      await this.loadOrderHistory();
      
    } catch (error) {
      console.error('Error:', error);
      alert(this.language === 'EN' ? 'Error saving order' : 'ऑर्डर सहेजने में त्रुटि');
    } finally {
      this.stopLoading();
    }
  }

  resetForm() {
    this.order = {
      date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_phone: '',
      client_location: '',
      is_registered: false,
      
      fencingPole: 0,
      plainPlate: 0,
      jumboPillar: 0,
      roundPlate: 0,
      biscuitPlate: 0,
      production_unit_price: 0,
      production_total: 0,
      
      labour_json: [],
      labour_total: 0,
      
      transport_charge: 0,
      installation_charge: 0,
      other_charge: 0,
      notes: '',
      
      total_bill: 0,
      paid_amount: 0,
      due_amount: 0,
      payment_mode: 'Cash'
    };

    this.newWorker = '';
    this.customWorkerAmount = null;
    this.workerType = 'FULL';
    this.activeTab = 'client';
  }

  // ========== ORDER HISTORY ==========
  async loadOrderHistory() {
    try {
      const response = await this.db.getOrders(0, 50);
      this.orderHistory = response.data || [];
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }

  // ========== UI HELPERS ==========
  private startLoading() {
    this.loading = true;
    this.cd.detectChanges();
  }

  private stopLoading() {
    this.loading = false;
    this.cd.detectChanges();
  }

  getLabel(labelEN: string, labelHI: string): string {
    return this.language === 'EN' ? labelEN : labelHI;
  }
}
