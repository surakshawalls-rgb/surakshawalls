// production-entry.component.ts - Production Entry Form
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-production-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="entry-container">
      <div class="entry-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>📝 Production Entry</h1>
      </div>

      <form [formGroup]="productionForm" (ngSubmit)="onSubmit()">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Basic Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Product</mat-label>
                <mat-select formControlName="product_id" required>
                  <mat-option *ngFor="let product of products" [value]="product.id">
                    {{ product.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Batch Number</mat-label>
                <input matInput formControlName="batch_number" placeholder="AUTO-GENERATED" readonly>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Shift</mat-label>
                <mat-select formControlName="shift" required>
                  <mat-option value="day">Day Shift</mat-option>
                  <mat-option value="night">Night Shift</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Production Quantities</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Target Quantity</mat-label>
                <input matInput type="number" formControlName="target_quantity" required>
                <span matSuffix>units</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Success Quantity</mat-label>
                <input matInput type="number" formControlName="success_quantity" required>
                <span matSuffix>units</span>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Rejection Quantity</mat-label>
                <input matInput type="number" formControlName="rejection_quantity">
                <span matSuffix>units</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Success Rate</mat-label>
                <input matInput [value]="calculateSuccessRate()" readonly>
                <span matSuffix>%</span>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Materials Used</mat-card-title>
            <button mat-icon-button type="button" (click)="addMaterial()">
              <mat-icon>add</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content formArrayName="materials">
            <div *ngFor="let material of materials.controls; let i = index" [formGroupName]="i" class="material-row">
              <mat-form-field appearance="outline">
                <mat-label>Material</mat-label>
                <mat-select formControlName="material_id" required>
                  <mat-option *ngFor="let mat of rawMaterials" [value]="mat.id">
                    {{ mat.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Quantity Used</mat-label>
                <input matInput type="number" formControlName="quantity_used" required>
              </mat-form-field>

              <button mat-icon-button type="button" (click)="removeMaterial(i)" color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Workers</mat-card-title>
            <button mat-icon-button type="button" (click)="addWorker()">
              <mat-icon>add</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content formArrayName="workers">
            <div *ngFor="let worker of workers.controls; let i = index" [formGroupName]="i" class="worker-row">
              <mat-form-field appearance="outline">
                <mat-label>Worker</mat-label>
                <mat-select formControlName="worker_id" required>
                  <mat-option *ngFor="let w of workersList" [value]="w.id">
                    {{ w.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role" required>
                  <mat-option value="operator">Operator</mat-option>
                  <mat-option value="helper">Helper</mat-option>
                  <mat-option value="supervisor">Supervisor</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hours Worked</mat-label>
                <input matInput type="number" formControlName="hours_worked" required>
              </mat-form-field>

              <button mat-icon-button type="button" (click)="removeWorker(i)" color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Additional Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Remarks</mat-label>
              <textarea matInput formControlName="remarks" rows="3"></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <div class="action-buttons">
          <button mat-raised-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || !productionForm.valid">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Save Production Entry</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .entry-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .entry-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .entry-header h1 {
      margin: 0;
      color: #1F2937;
    }

    .form-card {
      margin-bottom: 1.5rem;
    }

    .form-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .material-row, .worker-row {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .worker-row {
      grid-template-columns: 2fr 1fr 1fr auto;
    }

    .full-width {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .entry-container {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .material-row, .worker-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductionEntryComponent implements OnInit {
  productionForm: FormGroup;
  loading = false;
  products: any[] = [];
  rawMaterials: any[] = [];
  workersList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabase: SupabaseService,
    private snackBar: MatSnackBar
  ) {
    this.productionForm = this.fb.group({
      date: [new Date(), Validators.required],
      product_id: ['', Validators.required],
      batch_number: [''],
      shift: ['day', Validators.required],
      target_quantity: [0, [Validators.required, Validators.min(1)]],
      success_quantity: [0, [Validators.required, Validators.min(0)]],
      rejection_quantity: [0, Validators.min(0)],
      materials: this.fb.array([]),
      workers: this.fb.array([]),
      remarks: ['']
    });
  }

  get materials(): FormArray {
    return this.productionForm.get('materials') as FormArray;
  }

  get workers(): FormArray {
    return this.productionForm.get('workers') as FormArray;
  }

  ngOnInit(): void {
    this.loadMasterData();
    this.generateBatchNumber();
  }

  async loadMasterData(): Promise<void> {
    try {
      // Load products
      const { data: productsData } = await this.supabase.supabase
        .from('finished_goods_inventory')
        .select('id, product_name')
        .eq('active', true);
      
      if (productsData) {
        this.products = productsData.map((p: any) => ({ id: p.id, name: p.product_name }));
      }

      // Load raw materials
      const { data: materialsData } = await this.supabase.supabase
        .from('raw_materials_master')
        .select('id, material_name')
        .eq('active', true);
      
      if (materialsData) {
        this.rawMaterials = materialsData.map((m: any) => ({ id: m.id, name: m.material_name }));
      }

      // Load workers
      const { data: workersData } = await this.supabase.supabase
        .from('workers_master')
        .select('id, name')
        .eq('active', true);
      
      if (workersData) {
        this.workersList = workersData;
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  generateBatchNumber(): void {
    const date = new Date();
    const batchNumber = `BATCH-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    this.productionForm.patchValue({ batch_number: batchNumber });
  }

  addMaterial(): void {
    const materialGroup = this.fb.group({
      material_id: ['', Validators.required],
      quantity_used: [0, [Validators.required, Validators.min(0)]]
    });
    this.materials.push(materialGroup);
  }

  removeMaterial(index: number): void {
    this.materials.removeAt(index);
  }

  addWorker(): void {
    const workerGroup = this.fb.group({
      worker_id: ['', Validators.required],
      role: ['operator', Validators.required],
      hours_worked: [8, [Validators.required, Validators.min(0)]]
    });
    this.workers.push(workerGroup);
  }

  removeWorker(index: number): void {
    this.workers.removeAt(index);
  }

  calculateSuccessRate(): string {
    const target = this.productionForm.get('target_quantity')?.value || 0;
    const success = this.productionForm.get('success_quantity')?.value || 0;
    
    if (target === 0) return '0';
    
    const rate = (success / target) * 100;
    return rate.toFixed(2);
  }

  async onSubmit(): Promise<void> {
    if (this.productionForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.productionForm.value;
      
      // Insert production entry
      const { data: productionData, error: productionError } = await this.supabase.supabase
        .from('production_entries')
        .insert({
          date: formValue.date.toISOString().split('T')[0],
          product_id: formValue.product_id,
          batch_number: formValue.batch_number,
          shift: formValue.shift,
          target_quantity: formValue.target_quantity,
          success_quantity: formValue.success_quantity,
          rejection_quantity: formValue.rejection_quantity || 0,
          remarks: formValue.remarks
        })
        .select()
        .single();

      if (productionError) throw productionError;

      // Insert material consumption records
      if (formValue.materials.length > 0) {
        const materialsToInsert = formValue.materials.map((m: any) => ({
          production_entry_id: productionData.id,
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          date: formValue.date.toISOString().split('T')[0]
        }));

        const { error: materialError } = await this.supabase.supabase
          .from('material_consumption')
          .insert(materialsToInsert);

        if (materialError) throw materialError;
      }

      this.snackBar.open('Production entry saved successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/walls/production']);
    } catch (error) {
      console.error('Error saving production entry:', error);
      this.snackBar.open('Error saving production entry', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/walls/production']);
  }
}
