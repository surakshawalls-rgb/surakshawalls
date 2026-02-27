// src/app/pages/worker-management/worker-management.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../services/worker.service';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-worker-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './worker-management.component.html',
  styleUrls: ['./worker-management.component.css']
})
export class WorkerManagementComponent implements OnInit {
  workers: any[] = [];
  selectedWorker: any = null;
  workerStatement: any[] = [];
  totalLiability: number = 0;

  showAddModal: boolean = false;
  showPaymentModal: boolean = false;
  showStatementModal: boolean = false;

  newWorker = {
    name: '',
    phone: '',
    notes: ''
  };

  payment = {
    amount: 0,
    notes: ''
  };

  statementDates = {
    start: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  loading: boolean = false;
  saving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private workerService: WorkerService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      const [workers, liability] = await Promise.all([
        this.workerService.getWorkers(),
        this.workerService.getTotalLaborLiability()
      ]);
      this.workers = workers;
      this.totalLiability = liability;
    } catch (error: any) {
      this.errorMessage = 'Failed to load data: ' + error.message;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async viewStatement(worker: any) {
    try {
      this.selectedWorker = worker;
      this.showStatementModal = true;
      const statement = await this.workerService.getWorkerStatement(
        worker.id,
        this.statementDates.start,
        this.statementDates.end
      );
      this.workerStatement = statement;
    } catch (error: any) {
      this.errorMessage = 'Failed to load statement: ' + error.message;
    }
  }

  async payWorker(worker: any) {
    this.selectedWorker = worker;
    this.payment = { amount: 0, notes: '' };
    this.showPaymentModal = true;
  }

  async submitPayment() {
    if (!this.selectedWorker || this.payment.amount <= 0) return;

    try {
      this.saving = true;
      const result = await this.workerService.payWorker(
        this.selectedWorker.id,
        this.payment.amount,
        new Date().toISOString().split('T')[0],
        this.payment.notes
      );

      if (result.success) {
        this.successMessage = 'Payment recorded successfully!';
        this.showPaymentModal = false;
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to record payment';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
    }
  }

  async addWorker() {
    if (!this.newWorker.name.trim()) {
      this.errorMessage = 'Worker name is required';
      return;
    }

    try {
      this.saving = true;
      const result = await this.workerService.addWorker(
        this.newWorker.name,
        this.newWorker.phone,
        this.newWorker.notes
      );

      if (result.success) {
        this.successMessage = 'Worker added successfully!';
        this.showAddModal = false;
        this.newWorker = { name: '', phone: '', notes: '' };
        await this.loadData();
      } else {
        this.errorMessage = result.error || 'Failed to add worker';
      }
    } catch (error: any) {
      this.errorMessage = 'Error: ' + error.message;
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
