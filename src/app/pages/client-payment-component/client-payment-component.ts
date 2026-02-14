import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientPaymentService } from '../../services/client-payment.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-client-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-payment-component.html',
  styleUrls: ['./client-payment-component.css']
})
export class ClientPaymentComponent implements OnInit {

  constructor(private db: ClientPaymentService, private cd: ChangeDetectorRef) {}

  // Form Fields
  date = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;
  selectedClientId: string | null = null;
  siteName = '';
  totalBill = 0;
  paidAmount = 0;
  paymentMode = 'Cash';
  receivedBy = 'Pradeep';
  remarks = '';

  clients: any[] = [];
  dueLedger: any = {};

  loading = false;

  async ngOnInit() {
    await this.loadClients();
    await this.loadDueLedger();
  }

  private startLoading() {
    this.loading = true;
    this.cd.detectChanges();
  }

  private stopLoading() {
    this.loading = false;
    this.cd.detectChanges();
  }

  async loadClients() {
    const res = await this.db.getClients();
    this.clients = res.data || [];
  }

  async saveRevenue() {
    if (!this.selectedClientId) return alert("Select Client");

    this.startLoading();

    // Save Revenue
    if (this.totalBill > 0) {
      await this.db.addRevenue(this.date, this.selectedClientId, this.siteName, this.totalBill);
    }

    // Save Payment
    if (this.paidAmount > 0) {
      await this.db.addPayment(this.date, this.selectedClientId, this.paidAmount, this.paymentMode, this.receivedBy, this.remarks);
    }

    this.stopLoading();
    alert("✅ Saved Successfully");

    this.resetForm();
    await this.loadDueLedger();
  }

  resetForm() {
    this.siteName = '';
    this.totalBill = 0;
    this.paidAmount = 0;
    this.remarks = '';
  }

  async loadDueLedger() {
    this.startLoading();

    const res = await this.db.getDueSummary();
    const revenue = res.revenue;
    const payments = res.payments;

    this.dueLedger = {};

    // Add Bills
    revenue.forEach((r: any) => {
      this.dueLedger[r.client_id] = (this.dueLedger[r.client_id] || 0) + Number(r.total_bill);
    });

    // Subtract Payments
    payments.forEach((p: any) => {
      this.dueLedger[p.client_id] = (this.dueLedger[p.client_id] || 0) - Number(p.amount_paid);
    });

    this.stopLoading();
  }
}
