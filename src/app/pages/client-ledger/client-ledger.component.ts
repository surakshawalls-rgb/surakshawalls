// src/app/pages/client-ledger/client-ledger.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, ClientStatement } from '../../services/client.service';

@Component({
  selector: 'app-client-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-ledger.component.html',
  styleUrls: ['./client-ledger.component.css']
})
export class ClientLedgerComponent implements OnInit {
  // Data
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClient: Client | null = null;
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
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      console.log('[ClientLedger] Loading data...');

      const [clients, topDebtors, summary] = await Promise.all([
        this.clientService.getAllClients(),
        this.clientService.getTopDebtors(10),
        this.clientService.getClientsSummary()
      ]);

      this.clients = clients;
      this.topDebtors = topDebtors;
      this.clientsSummary = summary;
      this.applyFilters();

      console.log('[ClientLedger] Loaded:', this.clients.length, 'clients');

    } catch (error: any) {
      console.error('[ClientLedger] loadData error:', error);
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
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

  getOutstandingClass(client: Client): string {
    if (client.outstanding > client.credit_limit) return 'exceeding';
    if (client.outstanding > 0) return 'outstanding';
    return 'clear';
  }
}
