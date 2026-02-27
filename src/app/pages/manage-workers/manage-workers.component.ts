import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkerService, Worker } from '../../services/worker.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-manage-workers',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule, 
    MatButtonModule, 
    MatCardModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './manage-workers.component.html',
  styleUrls: ['./manage-workers.component.css']
})
export class ManageWorkersComponent implements OnInit {

  workers: Worker[] = [];
  filteredWorkers: Worker[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  editingWorker: Worker | null = null;
  editForm = {
    name: '',
    phone: '',
    notes: '',
    active: true
  };

  // Delete modal
  showDeleteModal: boolean = false;
  deletingWorker: Worker | null = null;

  // Table columns
  displayedColumns: string[] = ['name', 'phone', 'total_days_worked', 'total_earned', 'total_paid', 'cumulative_balance', 'active', 'actions'];

  constructor(
    private workerService: WorkerService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWorkers();
  }

  async loadWorkers() {
    try {
      this.loading = true;
      this.workers = await this.workerService.getAllWorkers();
      this.filteredWorkers = [...this.workers];
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to load workers: ' + error.message, 'error');
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredWorkers = [...this.workers];
      return;
    }

    this.filteredWorkers = this.workers.filter(worker =>
      worker.name.toLowerCase().includes(term) ||
      (worker.phone && worker.phone.includes(term)) ||
      (worker.notes && worker.notes.toLowerCase().includes(term))
    );
  }

  openEditModal(worker: Worker) {
    this.editingWorker = worker;
    this.editForm = {
      name: worker.name,
      phone: worker.phone || '',
      notes: worker.notes || '',
      active: worker.active
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingWorker = null;
  }

  async saveEdit() {
    if (!this.editingWorker || !this.editForm.name.trim()) {
      this.notificationService.notify('Error', 'Worker name is required', 'error');
      return;
    }

    try {
      const result = await this.workerService.updateWorker(this.editingWorker.id, this.editForm);
      if (result.success) {
        this.notificationService.notify('Success', 'Worker updated successfully', 'success');
        this.closeEditModal();
        await this.loadWorkers();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to update worker', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to update worker: ' + error.message, 'error');
    }
  }

  openDeleteModal(worker: Worker) {
    this.deletingWorker = worker;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingWorker = null;
  }

  async confirmDelete() {
    if (!this.deletingWorker) return;

    try {
      const result = await this.workerService.deleteWorker(this.deletingWorker.id);
      if (result.success) {
        this.notificationService.notify('Success', 'Worker deleted successfully', 'success');
        this.closeDeleteModal();
        await this.loadWorkers();
      } else {
        this.notificationService.notify('Error', result.error || 'Failed to delete worker', 'error');
      }
    } catch (error: any) {
      this.notificationService.notify('Error', 'Failed to delete worker: ' + error.message, 'error');
    }
  }

  getStatusClass(active: boolean): string {
    return active ? 'status-active' : 'status-inactive';
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'balance-positive'; // Worker owes money
    if (balance < 0) return 'balance-negative'; // We owe worker
    return 'balance-clear';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
