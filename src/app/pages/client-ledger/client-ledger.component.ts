// src/app/pages/client-ledger/client-ledger.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, ClientStatement } from '../../services/client.service';
import { ClientPaymentService, ClientOutstanding, ClientPaymentRecord, SalesTransactionWithPayments } from '../../services/client-payment.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-client-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './client-ledger.component.html',
  styleUrls: ['./client-ledger.component.css']
})
export class ClientLedgerComponent implements OnInit {
  // Data
  clients: Client[] = [];
  filteredClients: Client[] = [];
  clientsWithOutstanding: ClientOutstanding[] = [];
  selectedClient: Client | null = null;
  selectedClientOutstanding: ClientOutstanding | null = null;
  clientStatement: ClientStatement[] = [];
  topDebtors: Client[] = [];
  clientsSummary: any = null;

  // Filters
  searchTerm: string = '';
  filterStatus: 'all' | 'outstanding' | 'exceeding_limit' = 'all';
  statementStartDate: string = '';
  statementEndDate: string = '';

  // Modal
  showAddModal: boolean = false;
  showStatementModal: boolean = false;
  showPaymentModal: boolean = false;
  showPaymentHistoryModal: boolean = false;
  
  // Payment form
  selectedSaleForPayment: SalesTransactionWithPayments | null = null;
  paymentAmount: number = 0;
  paymentDate: string = '';
  paymentMode: 'cash' | 'upi' | 'cheque' | 'bank_transfer' = 'cash';
  chequeNumber: string = '';
  upiTransactionId: string = '';
  collectedByPartnerId: string = '';
  depositedToFirm: boolean = true;
  paymentNotes: string = '';
  partners: any[] = [];
  
  // Form
  formData = {
    client_name: '',
    contact_number: '',
    address: '',
    city: '',
    credit_limit: 50000,
    status: 'active' as 'active' | 'inactive'
  };

  // UI State
  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private clientService: ClientService,
    private clientPaymentService: ClientPaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.paymentDate = new Date().toISOString().split('T')[0];
    await this.loadData();
    await this.loadPartners();
  }

  async loadData() {
    try {
      this.loading = true;
      console.log('[ClientLedger] Loading data...');

      const [clients, topDebtors, summary, outstanding] = await Promise.all([
        this.clientService.getAllClients(),
        this.clientService.getTopDebtors(10),
        this.clientService.getClientsSummary(),
        this.clientPaymentService.getClientsWithOutstanding()
      ]);

      this.clients = clients;
      this.topDebtors = topDebtors;
      this.clientsSummary = summary;
      this.clientsWithOutstanding = outstanding;
      this.applyFilters();

      console.log('[ClientLedger] Loaded:', this.clients.length, 'clients,', this.clientsWithOutstanding.length, 'with outstanding');

    } catch (error: any) {
      console.error('[ClientLedger] loadData error:', error);
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadPartners() {
    try {
      const { data, error } = await (this.clientPaymentService as any).supabase.client
        .from('partner_master')
        .select('partner_id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      this.partners = data || [];
      
      if (this.partners.length > 0) {
        this.collectedByPartnerId = this.partners[0].partner_id;
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  }

  applyFilters() {
    let filtered = [...this.clients];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.client_name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.address && c.address.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.filterStatus === 'outstanding') {
      filtered = filtered.filter(c => c.outstanding > 0);
    } else if (this.filterStatus === 'exceeding_limit') {
      filtered = filtered.filter(c => c.outstanding > c.credit_limit);
    }

    this.filteredClients = filtered;
  }

  async viewStatement(client: Client) {
    try {
      this.selectedClient = client;
      this.showStatementModal = true;

      // Set default date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      this.statementEndDate = endDate.toISOString().split('T')[0];
      this.statementStartDate = startDate.toISOString().split('T')[0];

      await this.loadStatement();

    } catch (error: any) {
      console.error('[ClientLedger] viewStatement error:', error);
      this.errorMessage = 'Failed to load statement: ' + error.message;
    }
  }

  async loadStatement() {
    if (!this.selectedClient) return;

    try {
      this.clientStatement = await this.clientService.getClientStatement(
        this.selectedClient.id,
        this.statementStartDate,
        this.statementEndDate
      );

      console.log('[ClientLedger] Loaded statement:', this.clientStatement.length, 'entries');

    } catch (error: any) {
      console.error('[ClientLedger] loadStatement error:', error);
      this.errorMessage = 'Failed to load statement: ' + error.message;
    }
  }

  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  closeStatementModal() {
    this.showStatementModal = false;
    this.selectedClient = null;
    this.clientStatement = [];
  }

  async saveClient() {
    if (!this.formData.client_name.trim()) {
      this.errorMessage = 'Client name is required';
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const result = await this.clientService.addClient(this.formData);

      if (result.success) {
        this.successMessage = 'Client added successfully!';
        this.closeAddModal();
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to add client';
      }

    } catch (error: any) {
      console.error('[ClientLedger] saveClient error:', error);
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  resetForm() {
    this.formData = {
      client_name: '',
      contact_number: '',
      address: '',
      city: '',
      credit_limit: 50000,
      status: 'active'
    };
  }

  openPaymentModal(sale: SalesTransactionWithPayments, clientOutstanding: ClientOutstanding) {
    this.selectedSaleForPayment = sale;
    this.selectedClientOutstanding = clientOutstanding;
    this.paymentAmount = sale.current_outstanding;
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedSaleForPayment = null;
    this.selectedClientOutstanding = null;
    this.paymentAmount = 0;
    this.paymentMode = 'cash';
    this.chequeNumber = '';
    this.upiTransactionId = '';
    this.paymentNotes = '';
  }

  async recordClientPayment() {
    if (!this.selectedSaleForPayment || !this.selectedClientOutstanding) {
      this.errorMessage = 'No sale selected';
      return;
    }

    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.errorMessage = 'Enter a valid payment amount';
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const payment: ClientPaymentRecord = {
        client_id: this.selectedClientOutstanding.client_id,
        sales_transaction_id: this.selectedSaleForPayment.sales_id,
        payment_date: this.paymentDate,
        amount_paid: this.paymentAmount,
        payment_mode: this.paymentMode,
        cheque_number: this.paymentMode === 'cheque' ? this.chequeNumber : undefined,
        upi_transaction_id: this.paymentMode === 'upi' ? this.upiTransactionId : undefined,
        collected_by_partner_id: this.collectedByPartnerId || undefined,
        deposited_to_firm: this.depositedToFirm,
        notes: this.paymentNotes
      };

      const result = await this.clientPaymentService.recordPayment(payment);

      if (result.success) {
        this.successMessage = `✅ Payment of ₹${this.paymentAmount.toFixed(2)} recorded from ${this.selectedClientOutstanding.client_name}`;
        this.closePaymentModal();
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to record payment';
      }

    } catch (error: any) {
      console.error('[ClientLedger] recordClientPayment error:', error);
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  async clearAllOutstanding(sale: SalesTransactionWithPayments, clientOutstanding: ClientOutstanding) {
    if (!confirm(`Clear all outstanding ₹${sale.current_outstanding.toFixed(2)} from ${clientOutstanding.client_name}?`)) {
      return;
    }

    try {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const result = await this.clientPaymentService.clearOutstanding(
        sale.sales_id,
        clientOutstanding.client_id,
        this.collectedByPartnerId,
        this.paymentDate,
        'cash',
        'Full outstanding cleared'
      );

      if (result.success) {
        this.successMessage = `✅ Cleared outstanding ₹${sale.current_outstanding.toFixed(2)} from ${clientOutstanding.client_name}`;
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to clear outstanding';
      }

    } catch (error: any) {
      console.error('[ClientLedger] clearAllOutstanding error:', error);
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.loading = false;
    }
  }

  viewPaymentHistory(clientOutstanding: ClientOutstanding) {
    this.selectedClientOutstanding = clientOutstanding;
    this.showPaymentHistoryModal = true;
  }

  closePaymentHistoryModal() {
    this.showPaymentHistoryModal = false;
    this.selectedClientOutstanding = null;
  }

  getOutstandingClass(client: Client): string {
    if (client.outstanding > client.credit_limit) return 'exceeding';
    if (client.outstanding > 0) return 'outstanding';
    return 'clear';
  }
}
