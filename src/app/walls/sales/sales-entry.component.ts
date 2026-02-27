// sales-entry.component.ts - Sales Order Entry Form
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
import { MatRadioModule } from '@angular/material/radio';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-sales-entry',
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
    MatProgressSpinnerModule,
    MatRadioModule
  ],
  template: `
    <div class="entry-container">
      <div class="entry-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>🛒 Sales Entry</h1>
      </div>

      <form [formGroup]="salesForm" (ngSubmit)="onSubmit()">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Order Information</mat-card-title>
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
                <mat-label>Invoice Number</mat-label>
                <input matInput formControlName="invoice_number" readonly>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Client</mat-label>
              <mat-select formControlName="client_id" required>
                <mat-option *ngFor="let client of clients" [value]="client.id">
                  {{ client.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Products</mat-card-title>
            <button mat-icon-button type="button" (click)="addProduct()">
              <mat-icon>add</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content formArrayName="products">
            <div *ngFor="let product of products.controls; let i = index" [formGroupName]="i" class="product-row">
              <mat-form-field appearance="outline">
                <mat-label>Product</mat-label>
                <mat-select formControlName="product_id" required (selectionChange)="onProductChange(i)">
                  <mat-option *ngFor="let prod of productsList" [value]="prod.id">
                    {{ prod.name }} (Stock: {{ prod.stock }})
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" formControlName="quantity" required (input)="calculateRowTotal(i)">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Unit Price</mat-label>
                <input matInput type="number" formControlName="unit_price" required (input)="calculateRowTotal(i)">
                <span matPrefix>₹</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Total</mat-label>
                <input matInput [value]="getRowTotal(i)" readonly>
                <span matPrefix>₹</span>
              </mat-form-field>

              <button mat-icon-button type="button" (click)="removeProduct(i)" color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Payment Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span class="amount">₹{{ calculateSubtotal() }}</span>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Discount (%)</mat-label>
                <input matInput type="number" formControlName="discount_percent" (input)="recalculateTotal()">
                <span matSuffix>%</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Discount Amount</mat-label>
                <input matInput [value]="calculateDiscount()" readonly>
                <span matPrefix>₹</span>
              </mat-form-field>
            </div>

            <div class="summary-row total">
              <span>Total Amount:</span>
              <span class="amount">₹{{ calculateTotal() }}</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Payment Type</mat-label>
              <mat-select formControlName="payment_type" required>
                <mat-option value="full">Full Payment</mat-option>
                <mat-option value="partial">Partial Payment</mat-option>
                <mat-option value="credit">Credit (Pay Later)</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width" *ngIf="salesForm.get('payment_type')?.value === 'partial'">
              <mat-label>Amount Paid</mat-label>
              <input matInput type="number" formControlName="paid_amount">
              <span matPrefix>₹</span>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Payment Method</mat-label>
              <mat-select formControlName="payment_method" required>
                <mat-option value="cash">Cash</mat-option>
                <mat-option value="bank">Bank Transfer</mat-option>
                <mat-option value="cheque">Cheque</mat-option>
                <mat-option value="online">Online Payment</mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Additional Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Remarks</mat-label>
              <textarea matInput formControlName="remarks" rows="2"></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <div class="action-buttons">
          <button mat-raised-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || !salesForm.valid">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Save & Generate Invoice</span>
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

    .product-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .full-width {
      width: 100%;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #F9FAFB;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .summary-row.total {
      background: #EFF6FF;
      font-size: 1.125rem;
      font-weight: bold;
      color: #1E40AF;
    }

    .summary-row .amount {
      font-weight: 600;
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

      .form-row, .product-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SalesEntryComponent implements OnInit {
  salesForm: FormGroup;
  loading = false;
  clients: any[] = [];
  productsList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabase: SupabaseService,
    private snackBar: MatSnackBar
  ) {
    this.salesForm = this.fb.group({
      date: [new Date(), Validators.required],
      invoice_number: [''],
      client_id: ['', Validators.required],
      products: this.fb.array([]),
      discount_percent: [0, Validators.min(0)],
      payment_type: ['full', Validators.required],
      paid_amount: [0],
      payment_method: ['cash', Validators.required],
      remarks: ['']
    });
  }

  get products(): FormArray {
    return this.salesForm.get('products') as FormArray;
  }

  ngOnInit(): void {
    this.loadMasterData();
    this.generateInvoiceNumber();
  }

  async loadMasterData(): Promise<void> {
    try {
      // Load clients
      const { data: clientsData } = await this.supabase.supabase
        .from('client_ledger')
        .select('id, client_name')
        .eq('active', true);
      
      if (clientsData) {
        this.clients = clientsData.map((c: any) => ({ id: c.id, name: c.client_name }));
      }

      // Load products with stock
      const { data: productsData } = await this.supabase.supabase
        .from('finished_goods_inventory')
        .select('id, product_name, current_stock, unit_price')
        .eq('active', true)
        .gt('current_stock', 0);
      
      if (productsData) {
        this.productsList = productsData.map((p: any) => ({ 
          id: p.id, 
          name: p.product_name,
          stock: p.current_stock,
          price: p.unit_price
        }));
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  generateInvoiceNumber(): void {
    const date = new Date();
    const invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
    this.salesForm.patchValue({ invoice_number: invoiceNumber });
  }

  addProduct(): void {
    const productGroup = this.fb.group({
      product_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      row_total: [0]
    });
    this.products.push(productGroup);
  }

  removeProduct(index: number): void {
    this.products.removeAt(index);
    this.recalculateTotal();
  }

  onProductChange(index: number): void {
    const productId = this.products.at(index).get('product_id')?.value;
    const selectedProduct = this.productsList.find(p => p.id === productId);
    
    if (selectedProduct) {
      this.products.at(index).patchValue({
        unit_price: selectedProduct.price
      });
      this.calculateRowTotal(index);
    }
  }

  calculateRowTotal(index: number): void {
    const product = this.products.at(index);
    const quantity = product.get('quantity')?.value || 0;
    const unitPrice = product.get('unit_price')?.value || 0;
    const total = quantity * unitPrice;
    
    product.patchValue({ row_total: total }, { emitEvent: false });
    this.recalculateTotal();
  }

  getRowTotal(index: number): number {
    const product = this.products.at(index);
    const quantity = product.get('quantity')?.value || 0;
    const unitPrice = product.get('unit_price')?.value || 0;
    return quantity * unitPrice;
  }

  calculateSubtotal(): number {
    let subtotal = 0;
    for (let i = 0; i < this.products.length; i++) {
      subtotal += this.getRowTotal(i);
    }
    return subtotal;
  }

  calculateDiscount(): number {
    const subtotal = this.calculateSubtotal();
    const discountPercent = this.salesForm.get('discount_percent')?.value || 0;
    return (subtotal * discountPercent) / 100;
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateDiscount();
    return subtotal - discount;
  }

  recalculateTotal(): void {
    // Trigger change detection
    this.salesForm.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.salesForm.invalid || this.products.length === 0) {
      this.snackBar.open('Please fill all required fields and add at least one product', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.salesForm.value;
      const totalAmount = this.calculateTotal();
      let paidAmount = 0;

      if (formValue.payment_type === 'full') {
        paidAmount = totalAmount;
      } else if (formValue.payment_type === 'partial') {
        paidAmount = formValue.paid_amount;
      }

      // Insert sales transaction
      const { data: salesData, error: salesError } = await this.supabase.supabase
        .from('sales_transactions')
        .insert({
          date: formValue.date.toISOString().split('T')[0],
          invoice_number: formValue.invoice_number,
          client_id: formValue.client_id,
          total_amount: totalAmount,
          discount_percent: formValue.discount_percent || 0,
          paid_amount: paidAmount,
          payment_method: formValue.payment_method,
          remarks: formValue.remarks
        })
        .select()
        .single();

      if (salesError) throw salesError;

      // Insert sale items
      const saleItems = formValue.products.map((p: any) => ({
        sales_id: salesData.id,
        product_id: p.product_id,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_price: p.quantity * p.unit_price
      }));

      const { error: itemsError } = await this.supabase.supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      this.snackBar.open('Sales entry saved successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/walls/sales']);
    } catch (error) {
      console.error('Error saving sales entry:', error);
      this.snackBar.open('Error saving sales entry', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/walls/sales']);
  }
}
