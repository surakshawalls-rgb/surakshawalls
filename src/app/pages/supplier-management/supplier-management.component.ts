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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { 
  SupplierService, 
  Supplier, 
  SupplierFormData,
  PurchaseOrder,
  PurchaseOrderItem,
  SupplierPayment,
  SupplierInvoice 
} from '../../services/supplier.service';
import { PartnerService } from '../../services/partner.service';
import { formatDateToDDMMYYYY } from '../../services/date-formatter';

@Component({
  selector: 'app-supplier-management',
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
    MatDialogModule,
    BreadcrumbComponent
  ],
  templateUrl: './supplier-management.component.html',
  styleUrls: ['./supplier-management.component.css']
})
export class SupplierManagementComponent implements OnInit {

  formatDateToDDMMYYYY = formatDateToDDMMYYYY;

  // Data arrays
  suppliers: Supplier[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  partners: any[] = [];
  
  // Active tab
  activeTab = 0;
  
  // Supplier form
  showSupplierForm = false;
  supplierForm: SupplierFormData = this.getEmptySupplierForm();
  editingSupplierId: string | null = null;
  
  // Purchase Order form
  showPOForm = false;
  poForm: any = {
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    payment_terms: '',
    delivery_address: '',
    notes: '',
    items: []
  };
  currentPOItem: any = {
    material_name: '',
    material_category: '',
    quantity: 0,
    unit: 'kg',
    rate_per_unit: 0,
    gst_percentage: 18
  };
  
  // Payment form
  showPaymentForm = false;
  paymentForm: any = {
    supplier_id: '',
    po_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: 0,
    payment_mode: 'cash',
    cheque_number: '',
    transaction_id: '',
    bank_name: '',
    paid_by_partner_id: '',
    paid_from_firm_cash: true,
    notes: '',
    invoice_number: ''
  };
  
  // Invoice form
  showInvoiceForm = false;
  invoiceForm: any = {
    supplier_id: '',
    po_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: 0,
    gst_amount: 0,
    total_amount: 0,
    notes: ''
  };
  
  // Ledger
  selectedSupplierForLedger: string | null = null;
  supplierLedger: any[] = [];
  
  // Summary
  supplierSummary: any = null;
  
  loading = false;

  constructor(
    private supplierService: SupplierService,
    private partnerService: PartnerService,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.loadSuppliers(),
      this.loadPurchaseOrders(),
      this.loadPartners(),
      this.loadSummary()
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

  // ============================================================
  // SUPPLIER OPERATIONS
  // ============================================================

  async loadSuppliers() {
    try {
      this.suppliers = await this.supplierService.getAllSuppliers();
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }

  async loadPartners() {
    try {
      this.partners = await this.partnerService.getAllPartners();
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  }

  async loadSummary() {
    try {
      this.supplierSummary = await this.supplierService.getSuppliersSummary();
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }

  getEmptySupplierForm(): SupplierFormData {
    return {
      supplier_name: '',
      company_name: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      opening_balance: 0,
      active: true
    };
  }

  openSupplierForm() {
    this.supplierForm = this.getEmptySupplierForm();
    this.editingSupplierId = null;
    this.showSupplierForm = true;
  }

  editSupplier(supplier: Supplier) {
    this.supplierForm = {
      supplier_name: supplier.supplier_name,
      company_name: supplier.company_name || '',
      phone: supplier.phone,
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      opening_balance: supplier.opening_balance,
      active: supplier.active
    };
    this.editingSupplierId = supplier.id;
    this.showSupplierForm = true;
  }

  async saveSupplier() {
    if (!this.supplierForm.supplier_name || !this.supplierForm.phone) {
      alert('Please enter supplier name and phone');
      return;
    }

    this.startLoading();

    try {
      if (this.editingSupplierId) {
        const result = await this.supplierService.updateSupplier(this.editingSupplierId, this.supplierForm);
        if (result.success) {
          alert('✅ Supplier updated successfully');
          this.showSupplierForm = false;
          await this.loadSuppliers();
        } else {
          alert('❌ ' + result.error);
        }
      } else {
        const result = await this.supplierService.addSupplier(this.supplierForm);
        if (result.success) {
          alert('✅ Supplier added successfully');
          this.showSupplierForm = false;
          await this.loadSuppliers();
        } else {
          alert('❌ ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('❌ Error saving supplier');
    } finally {
      this.stopLoading();
    }
  }

  cancelSupplierForm() {
    this.showSupplierForm = false;
    this.supplierForm = this.getEmptySupplierForm();
    this.editingSupplierId = null;
  }

  async deleteSupplier(supplierId: string) {
    if (!confirm('Are you sure you want to delete this supplier? This will also delete all related purchase orders and payments.')) {
      return;
    }

    this.startLoading();

    try {
      const result = await this.supplierService.deleteSupplier(supplierId);
      if (result.success) {
        alert('✅ Supplier deleted successfully');
        await this.loadSuppliers();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('❌ Error deleting supplier');
    } finally {
      this.stopLoading();
    }
  }

  // ============================================================
  // PURCHASE ORDER OPERATIONS
  // ============================================================

  async loadPurchaseOrders() {
    try {
      this.purchaseOrders = await this.supplierService.getAllPurchaseOrders();
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  }

  openPOForm() {
    this.poForm = {
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      payment_terms: '',
      delivery_address: '',
      notes: '',
      items: []
    };
    this.showPOForm = true;
  }

  addPOItem() {
    if (!this.currentPOItem.material_name || this.currentPOItem.quantity <= 0) {
      alert('Please enter material name and quantity');
      return;
    }

    this.poForm.items.push({
      ...this.currentPOItem
    });

    // Reset current item
    this.currentPOItem = {
      material_name: '',
      material_category: '',
      quantity: 0,
      unit: 'kg',
      rate_per_unit: 0,
      gst_percentage: 18
    };
  }

  removePOItem(index: number) {
    this.poForm.items.splice(index, 1);
  }

  calculatePOTotal(): number {
    return this.poForm.items.reduce((total: number, item: any) => {
      const amount = item.quantity * item.rate_per_unit;
      const gst = (amount * item.gst_percentage) / 100;
      return total + amount + gst;
    }, 0);
  }

  async savePurchaseOrder() {
    if (!this.poForm.supplier_id || this.poForm.items.length === 0) {
      alert('Please select supplier and add at least one item');
      return;
    }

    this.startLoading();

    try {
      const result = await this.supplierService.createPurchaseOrder(
        {
          supplier_id: this.poForm.supplier_id,
          order_date: this.poForm.order_date,
          expected_delivery_date: this.poForm.expected_delivery_date || undefined,
          payment_terms: this.poForm.payment_terms || undefined,
          delivery_address: this.poForm.delivery_address || undefined,
          notes: this.poForm.notes || undefined
        },
        this.poForm.items
      );

      if (result.success) {
        alert('✅ Purchase Order created successfully!\nPO Number: ' + result.po?.po_number);
        this.showPOForm = false;
        await this.loadPurchaseOrders();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('❌ Error creating purchase order');
    } finally {
      this.stopLoading();
    }
  }

  cancelPOForm() {
    this.showPOForm = false;
  }

  async updatePOStatus(poId: string, status: 'pending' | 'approved' | 'delivered' | 'cancelled') {
    this.startLoading();

    try {
      const result = await this.supplierService.updatePOStatus(poId, status);
      if (result.success) {
        alert('✅ PO status updated to ' + status);
        await this.loadPurchaseOrders();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error updating PO status:', error);
      alert('❌ Error updating status');
    } finally {
      this.stopLoading();
    }
  }

  // ============================================================
  // PAYMENT OPERATIONS
  // ============================================================

  openPaymentForm() {
    this.paymentForm = {
      supplier_id: '',
      po_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: 0,
      payment_mode: 'cash',
      cheque_number: '',
      transaction_id: '',
      bank_name: '',
      paid_by_partner_id: '',
      paid_from_firm_cash: true,
      notes: '',
      invoice_number: ''
    };
    this.showPaymentForm = true;
  }

  async savePayment() {
    if (!this.paymentForm.supplier_id || this.paymentForm.amount_paid <= 0) {
      alert('Please select supplier and enter amount');
      return;
    }

    this.startLoading();

    try {
      const result = await this.supplierService.recordPayment({
        supplier_id: this.paymentForm.supplier_id,
        po_id: this.paymentForm.po_id || undefined,
        payment_date: this.paymentForm.payment_date,
        amount_paid: this.paymentForm.amount_paid,
        payment_mode: this.paymentForm.payment_mode,
        cheque_number: this.paymentForm.cheque_number || undefined,
        transaction_id: this.paymentForm.transaction_id || undefined,
        bank_name: this.paymentForm.bank_name || undefined,
        paid_by_partner_id: this.paymentForm.paid_by_partner_id || undefined,
        paid_from_firm_cash: this.paymentForm.paid_from_firm_cash,
        notes: this.paymentForm.notes || undefined,
        invoice_number: this.paymentForm.invoice_number || undefined
      });

      if (result.success) {
        alert('✅ Payment recorded successfully');
        this.showPaymentForm = false;
        await Promise.all([this.loadSuppliers(), this.loadSummary()]);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('❌ Error recording payment');
    } finally {
      this.stopLoading();
    }
  }

  cancelPaymentForm() {
    this.showPaymentForm = false;
  }

  // ============================================================
  // INVOICE OPERATIONS
  // ============================================================

  openInvoiceForm() {
    this.invoiceForm = {
      supplier_id: '',
      po_id: '',
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      subtotal: 0,
      gst_amount: 0,
      total_amount: 0,
      notes: ''
    };
    this.showInvoiceForm = true;
  }

  calculateInvoiceTotal() {
    this.invoiceForm.gst_amount = (this.invoiceForm.subtotal * 18) / 100;
    this.invoiceForm.total_amount = this.invoiceForm.subtotal + this.invoiceForm.gst_amount;
  }

  async saveInvoice() {
    if (!this.invoiceForm.supplier_id || !this.invoiceForm.invoice_number || this.invoiceForm.total_amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    this.startLoading();

    try {
      const result = await this.supplierService.createInvoice({
        supplier_id: this.invoiceForm.supplier_id,
        po_id: this.invoiceForm.po_id || undefined,
        invoice_number: this.invoiceForm.invoice_number,
        invoice_date: this.invoiceForm.invoice_date,
        due_date: this.invoiceForm.due_date || undefined,
        subtotal: this.invoiceForm.subtotal,
        gst_amount: this.invoiceForm.gst_amount,
        total_amount: this.invoiceForm.total_amount,
        notes: this.invoiceForm.notes || undefined
      });

      if (result.success) {
        alert('✅ Invoice created successfully');
        this.showInvoiceForm = false;
        await Promise.all([this.loadSuppliers(), this.loadSummary()]);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('❌ Error creating invoice');
    } finally {
      this.stopLoading();
    }
  }

  cancelInvoiceForm() {
    this.showInvoiceForm = false;
  }

  // ============================================================
  // LEDGER OPERATIONS
  // ============================================================

  async loadSupplierLedger(supplierId: string) {
    this.selectedSupplierForLedger = supplierId;
    this.startLoading();

    try {
      this.supplierLedger = await this.supplierService.getSupplierLedger(supplierId);
    } catch (error) {
      console.error('Error loading ledger:', error);
      this.supplierLedger = [];
    } finally {
      this.stopLoading();
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  getStatusColor(status: string): string {
    const colors: any = {
      'pending': 'accent',
      'approved': 'primary',
      'delivered': '',
      'cancelled': 'warn',
      'unpaid': 'warn',
      'partial': 'accent',
      'paid': 'primary'
    };
    return colors[status] || '';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'pending': 'schedule',
      'approved': 'check_circle',
      'delivered': 'local_shipping',
      'cancelled': 'cancel',
      'unpaid': 'warning',
      'partial': 'hourglass_empty',
      'paid': 'check_circle'
    };
    return icons[status] || 'info';
  }

  // Helper methods for template expressions (Angular doesn't support arrow functions in templates)
  getSupplierName(supplierId: string): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier?.supplier_name || 'N/A';
  }

  getPartnerName(partnerId: string): string {
    const partner = this.partners.find(p => p.id === partnerId);
    return partner?.name || 'N/A';
  }

  getPOSupplier(poId: string): any {
    const po = this.purchaseOrders.find(p => p.id === poId);
    if (!po) return null;
    return this.suppliers.find(s => s.id === po.supplier_id);
  }

  getPaymentSupplier(supplierId: string): any {
    return this.suppliers.find(s => s.id === supplierId);
  }

  getLedgerSupplierName(): string {
    if (!this.selectedSupplierForLedger) return '';
    const supplier = this.suppliers.find(s => s.id === this.selectedSupplierForLedger);
    return supplier?.supplier_name || '';
  }

  // Navigation helpers
  viewSupplierLedger(supplierId: string) {
    this.loadSupplierLedger(supplierId);
    this.activeTab = 4;
  }

  openPaymentFormForSupplier(supplier: any) {
    this.paymentForm.supplier_id = supplier.id;
    this.paymentForm.amount_paid = supplier.outstanding;
    this.openPaymentForm();
  }
}
