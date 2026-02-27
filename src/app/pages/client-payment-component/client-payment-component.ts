import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { ClientPaymentService, ClientPaymentRecord } from '../../services/client-payment.service';
import { ClientService } from '../../services/client.service';
import { SalesService, SaleData } from '../../services/sales.service';
import { PartnerService } from '../../services/partner.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

interface PaymentHistoryItem {
  id: string;
  payment_date: string;
  amount_paid: number;
  payment_mode: string;
  collected_by_partner_id?: string;
  deposited_to_firm: boolean;
  notes?: string;
  partner_name?: string;
}

@Component({
  selector: 'app-client-payment',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    BreadcrumbComponent
  ],
  templateUrl: './client-payment-component.html',
  styleUrls: ['./client-payment-component-new.css']
})
export class ClientPaymentComponent implements OnInit {

  constructor(
    private clientPaymentService: ClientPaymentService,
    private clientService: ClientService,
    private salesService: SalesService,
    private partnerService: PartnerService,
    private cd: ChangeDetectorRef
  ) {}

  // Form Fields
  date = new Date().toISOString().split('T')[0];
  formatDateToDDMMYYYY = formatDateToDDMMYYYY;
  selectedClientId: string | null = null;
  siteName = '';
  totalBill = 0;
  paidAmount = 0;
  paymentMode = 'cash';
  receivedBy = '';
  depositedToFirm = true; // Default to deposited
  remarks = '';
  
  // Cheque/UPI details
  chequeNumber = '';
  upiTransactionId = '';

  clients: any[] = [];
  partners: any[] = [];
  dueLedger: any = {};
  
  // Payment history
  selectedClientForHistory: string | null = null;
  paymentHistory: PaymentHistoryItem[] = [];
  
  // Overdue clients
  overdueClients: any[] = [];
  
  // Last payment for receipt
  lastPayment: any = null;

  loading = false;
  activeTab = 0;

  async ngOnInit() {
    await Promise.all([
      this.loadClients(),
      this.loadPartners(),
      this.loadDueLedger(),
      this.loadOverdueClients()
    ]);
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
  
  async loadPartners() {
    this.partners = await this.partnerService.getAllPartners();
  }

  async saveRevenue() {
    if (!this.selectedClientId) return alert("Select Client");

    this.startLoading();

    try {
      // Save Revenue (as a sale transaction)
      if (this.totalBill > 0) {
        const partnerId = this.receivedBy ? this.partners.find(p => p.partner_name === this.receivedBy)?.id : undefined;
        
        const saleData: SaleData = {
          date: this.date,
          client_id: this.selectedClientId,
          product_name: this.siteName || 'General Sale',
          product_variant: null,
          quantity: 1,
          rate_per_unit: this.totalBill,
          payment_type: this.paidAmount >= this.totalBill ? 'full' : this.paidAmount > 0 ? 'partial' : 'credit',
          paid_amount: this.paidAmount,
          collected_by_partner_id: partnerId,
          deposited_to_firm: this.receivedBy ? this.depositedToFirm : true, // Use form field if partner, else true
          notes: this.remarks || undefined
        };
        await this.salesService.createSale(saleData);
      } else if (this.paidAmount > 0) {
        // Save Payment only (against existing outstanding)
        const partnerId = this.receivedBy ? this.partners.find(p => p.partner_name === this.receivedBy)?.id : undefined;
        
        const payment: ClientPaymentRecord = {
          client_id: this.selectedClientId,
          payment_date: this.date,
          amount_paid: this.paidAmount,
          payment_mode: this.paymentMode as 'cash' | 'upi' | 'cheque' | 'bank_transfer',
          cheque_number: this.chequeNumber || undefined,
          upi_transaction_id: this.upiTransactionId || undefined,
          collected_by_partner_id: partnerId,
          deposited_to_firm: this.receivedBy ? this.depositedToFirm : true, // Use form field if partner, else true
          notes: this.remarks || undefined
        };
        
        const result = await this.clientPaymentService.recordPayment(payment);
        
        if (result.success) {
          // Store payment info for receipt generation
          const client = this.clients.find(c => c.id === this.selectedClientId);
          this.lastPayment = {
            payment_date: payment.payment_date,
            amount_paid: payment.amount_paid,
            payment_mode: payment.payment_mode,
            cheque_number: payment.cheque_number,
            upi_transaction_id: payment.upi_transaction_id,
            client_name: client?.client_name,
            partner_name: this.receivedBy,
            notes: payment.notes
          };
        }
      }

      this.stopLoading();
      alert("✅ Saved Successfully");

      // Show receipt option
      if (this.lastPayment && confirm("Payment saved! Do you want to print receipt?")) {
        this.printReceipt();
      }

      this.resetForm();
      await Promise.all([
        this.loadDueLedger(),
        this.loadOverdueClients()
      ]);
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
    this.paymentMode = 'cash';
    this.receivedBy = '';
    this.depositedToFirm = true;
    this.remarks = '';
    this.chequeNumber = '';
    this.upiTransactionId = '';
    this.selectedClientId = null;
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
  
  async loadOverdueClients() {
    try {
      this.overdueClients = await this.clientService.getOverdueClients();
    } catch (error) {
      console.error('Error loading overdue clients:', error);
    }
  }
  
  /**
   * Load payment history for selected client
   */
  async loadPaymentHistory(clientId: string) {
    this.selectedClientForHistory = clientId;
    this.startLoading();
    
    try {
      const payments = await this.clientPaymentService.getClientPaymentHistory(clientId);
      
      // Enrich with partner names
      this.paymentHistory = await Promise.all(
        payments.map(async (payment) => {
          let partner_name = 'Firm Cash';
          if (payment.collected_by_partner_id) {
            const partner = this.partners.find(p => p.id === payment.collected_by_partner_id);
            partner_name = partner?.name || 'Unknown Partner';
          }
          
          return {
            ...payment,
            partner_name
          };
        })
      );
    } catch (error) {
      console.error('Error loading payment history:', error);
      this.paymentHistory = [];
    } finally {
      this.stopLoading();
    }
  }
  
  /**
   * Print payment receipt
   */
  printReceipt() {
    if (!this.lastPayment) {
      alert('No recent payment to print');
      return;
    }
    
    const receiptWindow = window.open('', '_blank', 'width=800,height=600');
    if (!receiptWindow) {
      alert('Please allow popups to print receipt');
      return;
    }
    
    const receiptHTML = this.generateReceiptHTML(this.lastPayment);
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  }
  
  /**
   * Generate receipt HTML
   */
  private generateReceiptHTML(payment: any): string {
    const date = new Date(payment.payment_date);
    const formattedDate = formatDateToDDMMYYYY(payment.payment_date);
    const receiptNo = payment.id.substring(0, 8).toUpperCase();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt - ${receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }
          .receipt {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 2px solid #333;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            color: #2196F3;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 14px;
            color: #666;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .receipt-info div {
            line-height: 1.8;
          }
          .receipt-info strong {
            color: #333;
          }
          .amount-box {
            background: #E3F2FD;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          .amount-box .label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
          }
          .amount-box .amount {
            font-size: 36px;
            font-weight: bold;
            color: #2196F3;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .details-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          .details-table td:first-child {
            font-weight: bold;
            width: 40%;
            color: #555;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
          .signature {
            margin-top: 60px;
            text-align: right;
          }
          .signature-line {
            border-top: 2px solid #333;
            width: 250px;
            margin-left: auto;
            margin-top: 80px;
            padding-top: 10px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
          }
          @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>SURAKSHA WALLS</h1>
            <p>Premium Pre-Cast Wall Manufacturing</p>
            <p style="margin-top: 8px; font-weight: bold; font-size: 16px;">PAYMENT RECEIPT</p>
          </div>
          
          <div class="receipt-info">
            <div>
              <strong>Receipt No:</strong> ${receiptNo}<br>
              <strong>Date:</strong> ${formattedDate}
            </div>
            <div style="text-align: right;">
              <strong>Client:</strong> ${payment.client_name || 'N/A'}<br>
              <strong>Collected By:</strong> ${payment.partner_name || 'Firm'}
            </div>
          </div>
          
          <div class="amount-box">
            <div class="label">Amount Received</div>
            <div class="amount">₹ ${payment.amount_paid.toLocaleString('en-IN')}</div>
          </div>
          
          <table class="details-table">
            <tr>
              <td>Payment Mode</td>
              <td>${payment.payment_mode.toUpperCase()}</td>
            </tr>
            ${payment.cheque_number ? `
            <tr>
              <td>Cheque Number</td>
              <td>${payment.cheque_number}</td>
            </tr>
            ` : ''}
            ${payment.upi_transaction_id ? `
            <tr>
              <td>UPI Transaction ID</td>
              <td>${payment.upi_transaction_id}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Deposited To</td>
              <td>${payment.deposited_to_firm ? 'Firm Account' : 'Partner Account'}</td>
            </tr>
            ${payment.notes ? `
            <tr>
              <td>Notes</td>
              <td>${payment.notes}</td>
            </tr>
            ` : ''}
          </table>
          
          <div class="signature">
            <div class="signature-line">
              Authorized Signatory
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p style="margin-top: 5px;">This is a computer generated receipt.</p>
            <p style="margin-top: 10px; font-weight: bold;">For queries, contact: Suraksha Walls</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Send payment reminder to client
   */
  async sendPaymentReminder(clientId: string) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    const outstanding = this.dueLedger[clientId] || 0;
    if (outstanding <= 0) {
      alert('No outstanding balance for this client');
      return;
    }
    
    // In a real app, this would send SMS/WhatsApp/Email
    // For now, just show a confirmation
    const message = `Dear ${client.client_name},\n\n` +
      `Your outstanding balance with Suraksha Walls is ₹${outstanding.toLocaleString('en-IN')}.\n` +
      `Please make the payment at your earliest convenience.\n\n` +
      `Thank you for your business!\n` +
      `- Suraksha Walls`;
    
    if (confirm(`Send this reminder?\n\n${message}`)) {
      alert('Reminder sent! (Feature will be integrated with SMS/WhatsApp gateway)');
      console.log('Reminder for client:', client.client_name, 'Amount:', outstanding);
    }
  }
  
  /**
   * Get payment mode icon
   */
  getPaymentModeIcon(mode: string): string {
    const icons: any = {
      'cash': 'payments',
      'upi': 'qr_code_2',
      'cheque': 'receipt_long',
      'bank_transfer': 'account_balance'
    };
    return icons[mode.toLowerCase()] || 'payment';
  }
  
  /**
   * Get days overdue
   */
  getDaysOverdue(lastPurchaseDate: string): number {
    if (!lastPurchaseDate) return 0;
    const lastDate = new Date(lastPurchaseDate);
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30 ? diffDays : 0;
  }

  // Helper methods for template
  getClientNameForHistory(): string {
    if (!this.selectedClientForHistory) return '';
    const client = this.clients.find(c => c.id === this.selectedClientForHistory);
    return client?.client_name || '';
  }

  prepareReceiptForPayment(payment: any) {
    const client = this.clients.find(c => c.id === this.selectedClientForHistory);
    this.lastPayment = {
      ...payment,
      client_name: client?.client_name
    };
    this.printReceipt();
  }
}
