import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientPaymentService, ClientPaymentRecord } from '../../services/client-payment.service';
import { ClientService } from '../../services/client.service';
import { SalesService, SaleData } from '../../services/sales.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-client-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-payment-component.html',
  styleUrls: ['./client-payment-component.css']
})
export class ClientPaymentComponent implements OnInit {

  constructor(
    private clientPaymentService: ClientPaymentService,
    private clientService: ClientService,
    private salesService: SalesService,
    private cd: ChangeDetectorRef
  ) {}

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
    this.clients = await this.clientService.getAllClients();
  }

  async saveRevenue() {
    if (!this.selectedClientId) return alert("Select Client");

    this.startLoading();

    try {
      // Save Revenue (as a sale transaction)
      if (this.totalBill > 0) {
        const saleData: SaleData = {
          date: this.date,
          client_id: this.selectedClientId,
          product_name: this.siteName || 'General Sale',
          product_variant: null,
          quantity: 1,
          rate_per_unit: this.totalBill,
          payment_type: this.paidAmount >= this.totalBill ? 'full' : this.paidAmount > 0 ? 'partial' : 'credit',
          paid_amount: this.paidAmount,
          collected_by_partner_id: undefined,
          deposited_to_firm: this.paymentMode !== 'Cash',
          notes: this.remarks || undefined
        };
        await this.salesService.createSale(saleData);
      } else if (this.paidAmount > 0) {
        // Save Payment only (against existing outstanding)
        const payment: ClientPaymentRecord = {
          client_id: this.selectedClientId,
          payment_date: this.date,
          amount_paid: this.paidAmount,
          payment_mode: this.paymentMode.toLowerCase() as 'cash' | 'upi' | 'cheque' | 'bank_transfer',
          deposited_to_firm: this.paymentMode !== 'Cash',
          notes: this.remarks || undefined
        };
        await this.clientPaymentService.recordPayment(payment);
      }

      this.stopLoading();
      alert("✅ Saved Successfully");

      this.resetForm();
      await this.loadDueLedger();
    } catch (error) {
      this.stopLoading();
      console.error('Error saving:', error);
      alert("❌ Error saving data");
    }
  }

  resetForm() {
    this.siteName = '';
    this.totalBill = 0;
    this.paidAmount = 0;
    this.remarks = '';
  }

  async loadDueLedger() {
    this.startLoading();

    const clientsWithOutstanding = await this.clientPaymentService.getClientsWithOutstanding();

    this.dueLedger = {};

    // Build due ledger from clients with outstanding
    clientsWithOutstanding.forEach(client => {
      this.dueLedger[client.client_id] = client.outstanding;
    });

    this.stopLoading();
  }
}
