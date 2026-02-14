import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

interface SalesOrder {
  order_id: string;
  date: string;
  client_name: string;
  client_phone: string;
  product_total: number;
  total_bill: number;
  paid_amount: number;
  due_amount: number;
  status: string;
}

@Component({
  selector: 'app-sales-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-order.html',
  styleUrls: ['./sales-order.css']
})
export class SalesOrderComponent implements OnInit {

  orders: SalesOrder[] = [];
  
  // Form
  orderDate: string = '';
  clientName: string = '';
  clientPhone: string = '';
  productTotal: number = 0;
  transportCharge: number = 0;
  otherCharges: number = 0;
  paidAmount: number = 0;
  paymentMode: string = 'cash';
  notes: string = '';
  
  loading = false;
  successMessage = '';
  errorMessage = '';
  
  constructor(private db: SupabaseService, private cd: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.loading = true;
    this.orderDate = new Date().toISOString().split('T')[0];
    this.loadOrders();
  }

  async refreshData() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cd.detectChanges();
    try {
      await this.loadOrders();
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

  async loadOrders() {
    try {
      const { data, error } = await this.db.queryView('sales_orders');
      if (error) throw error;
      this.orders = data || [];
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.errorMessage = 'Failed to load orders';
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  getTotalBill(): number {
    return this.productTotal + this.transportCharge + this.otherCharges;
  }
  
  getDueAmount(): number {
    return this.getTotalBill() - this.paidAmount;
  }
  
  async submitOrder() {
    if (!this.clientName) {
      this.errorMessage = '⚠️ Client name is required';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    if (this.productTotal <= 0) {
      this.errorMessage = '⚠️ Product total must be greater than 0';
      this.cd.detectChanges();
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.loading = true;
    this.cd.detectChanges();
    try {
      const { error } = await this.db.supabase
        .from('sales_orders')
        .insert([{
          date: this.orderDate,
          client_name: this.clientName,
          client_phone: this.clientPhone,
          product_json: { total: this.productTotal },
          product_total: this.productTotal,
          transport_charge: this.transportCharge,
          other_charges: this.otherCharges,
          total_bill: this.getTotalBill(),
          paid_amount: this.paidAmount,
          due_amount: this.getDueAmount(),
          payment_mode: this.paymentMode,
          notes: this.notes
        }]);
      
      if (error) throw error;
      
      this.successMessage = `✅ Order created for ${this.clientName} (₹${this.getTotalBill().toFixed(2)})`;
      this.cd.detectChanges();
      this.resetForm();
      await this.loadOrders();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cd.detectChanges();
      }, 3000);
    } catch (error) {
      this.errorMessage = '❌ Failed to create order. Please try again.';
      console.error(error);
      this.cd.detectChanges();
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }
  
  resetForm() {
    this.clientName = '';
    this.clientPhone = '';
    this.productTotal = 0;
    this.transportCharge = 0;
    this.otherCharges = 0;
    this.paidAmount = 0;
    this.notes = '';
  }
  
  getTotalBilled(): number {
    return this.orders.reduce((sum, o) => sum + o.total_bill, 0);
  }
  
  getTotalCollected(): number {
    return this.orders.reduce((sum, o) => sum + o.paid_amount, 0);
  }
  
  getTotalDue(): number {
    return this.orders.reduce((sum, o) => sum + o.due_amount, 0);
  }
}
