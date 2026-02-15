// src/app/pages/manage-clients/manage-clients.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClientService, Client } from '../../services/client.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-manage-clients',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, 
    MatTableModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './manage-clients.component.html',
  styleUrls: ['./manage-clients.component.css']
})
export class ManageClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  editingClient: Client | null = null;
  editForm = {
    client_name: '',
    phone: '',
    address: '',
    credit_limit: 0,
    active: true
  };

  // Delete confirmation
  showDeleteModal: boolean = false;
  deletingClient: Client | null = null;

  displayedColumns: string[] = ['client_name', 'phone', 'address', 'credit_limit', 'outstanding', 'active', 'actions'];

  constructor(
    private clientService: ClientService,
    private notificationService: NotificationService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.loading = true;
      this.clients = await this.clientService.getAllClients();
      this.filteredClients = [...this.clients];
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to load clients: ' + error.message, 'error');
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(c =>
      c.client_name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  }

  openEditModal(client: Client) {
    this.editingClient = client;
    this.editForm = {
      client_name: client.client_name,
      phone: client.phone || '',
      address: client.address || '',
      credit_limit: client.credit_limit,
      active: client.active
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingClient = null;
  }

  async saveEdit() {
    if (!this.editingClient || !this.editForm.client_name.trim()) {
      this.notificationService.notify('Error', 'Client name is required', 'error');
      return;
    }

    try {
      const result = await this.clientService.updateClient(this.editingClient.id, this.editForm);
      
      if (result.success) {
        this.notificationService.notify('Success', 'Client updated successfully', 'success');
        this.closeEditModal();
        await this.loadClients();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to update client', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to update client: ' + error.message, 'error');
    }
  }

  openDeleteModal(client: Client) {
    this.deletingClient = client;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingClient = null;
  }

  async confirmDelete() {
    if (!this.deletingClient) return;

    try {
      const result = await this.clientService.deleteClient(this.deletingClient.id);
      
      if (result.success) {
        this.notificationService.notify('Success', 'Client deleted successfully', 'success');
        this.closeDeleteModal();
        await this.loadClients();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to delete client', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to delete client: ' + error.message, 'error');
    }
  }

  getStatusClass(active: boolean): string {
    return active ? 'status-active' : 'status-inactive';
  }

  getOutstandingClass(client: Client): string {
    if (client.outstanding > client.credit_limit) return 'exceeding';
    if (client.outstanding > 0) return 'outstanding';
    return 'clear';
  }
}
