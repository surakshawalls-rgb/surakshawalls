// src/app/services/supplier.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Supplier {
  id: string;
  supplier_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  opening_balance: number;
  total_purchases: number;
  total_paid: number;
  outstanding: number;
  active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface SupplierFormData {
  supplier_name: string;
  company_name?: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  opening_balance?: number;
  active?: boolean;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_terms: string | null;
  delivery_address: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  material_name: string;
  material_category: string | null;
  quantity: number;
  unit: string;
  rate_per_unit: number;
  amount: number;
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
  supplier_name?: string;
}

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  po_id: string | null;
  payment_date: string;
  amount_paid: number;
  payment_mode: string;
  cheque_number: string | null;
  transaction_id: string | null;
  bank_name: string | null;
  paid_by_partner_id: string | null;
  paid_from_firm_cash: boolean;
  notes: string | null;
  invoice_number: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SupplierInvoice {
  id: string;
  supplier_id: string;
  po_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SupplierLedgerEntry {
  transaction_date: string;
  transaction_type: string;
  reference_number: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {

  constructor(private supabase: SupabaseService) {}

  // ============================================================
  // SUPPLIER MASTER OPERATIONS
  // ============================================================

  /**
   * Get all suppliers
   */
  async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_master')
      .select('*')
      .order('supplier_name');

    if (error) {
      console.error('[SupplierService] getAllSuppliers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get active suppliers
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_master')
      .select('*')
      .eq('active', true)
      .order('supplier_name');

    if (error) {
      console.error('[SupplierService] getActiveSuppliers error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(supplierId: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_master')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      console.error('[SupplierService] getSupplierById error:', error);
      return null;
    }

    return data;
  }

  /**
   * Add new supplier
   */
  async addSupplier(supplierData: SupplierFormData): Promise<{success: boolean, supplier?: Supplier, error?: string}> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('supplier_master')
        .insert({
          ...supplierData,
          opening_balance: supplierData.opening_balance || 0,
          active: supplierData.active !== undefined ? supplierData.active : true
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, supplier: data };

    } catch (error: any) {
      console.error('[SupplierService] addSupplier error:', error);
      
      // Check for duplicate phone
      if (error.code === '23505') {
        return { success: false, error: 'A supplier with this phone number already exists' };
      }
      
      return { success: false, error: error.message || 'Failed to add supplier' };
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(supplierId: string, updates: Partial<SupplierFormData>): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('supplier_master')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplierId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[SupplierService] updateSupplier error:', error);
      return { success: false, error: error.message || 'Failed to update supplier' };
    }
  }

  /**
   * Delete supplier (Admin only)
   */
  async deleteSupplier(supplierId: string): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('supplier_master')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[SupplierService] deleteSupplier error:', error);
      return { success: false, error: error.message || 'Failed to delete supplier' };
    }
  }

  /**
   * Get suppliers with outstanding balance
   */
  async getSuppliersWithOutstanding(): Promise<Supplier[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_master')
      .select('*')
      .eq('active', true)
      .gt('outstanding', 0)
      .order('outstanding', { ascending: false });

    if (error) {
      console.error('[SupplierService] getSuppliersWithOutstanding error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get suppliers summary
   */
  async getSuppliersSummary() {
    const suppliers = await this.getAllSuppliers();

    return {
      total_suppliers: suppliers.length,
      active_suppliers: suppliers.filter(s => s.active).length,
      total_outstanding: suppliers.reduce((sum, s) => sum + s.outstanding, 0),
      total_purchases: suppliers.reduce((sum, s) => sum + s.total_purchases, 0),
      total_paid: suppliers.reduce((sum, s) => sum + s.total_paid, 0),
      suppliers_with_outstanding: suppliers.filter(s => s.outstanding > 0).length
    };
  }

  // ============================================================
  // PURCHASE ORDER OPERATIONS
  // ============================================================

  /**
   * Generate next PO number
   */
  async generatePONumber(): Promise<string> {
    const { data } = await this.supabase.supabase
      .from('purchase_orders')
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastPO = data[0].po_number;
      const matches = lastPO.match(/PO\/(\d{4})\/(\d+)/);
      if (matches) {
        const year = new Date().getFullYear();
        const currentYear = parseInt(matches[1]);
        const lastNumber = parseInt(matches[2]);
        
        if (year === currentYear) {
          return `PO/${year}/${String(lastNumber + 1).padStart(3, '0')}`;
        }
      }
    }

    // First PO of the year
    const year = new Date().getFullYear();
    return `PO/${year}/001`;
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(
    poData: {
      supplier_id: string;
      order_date: string;
      expected_delivery_date?: string;
      payment_terms?: string;
      delivery_address?: string;
      notes?: string;
    },
    items: {
      material_name: string;
      material_category?: string;
      quantity: number;
      unit: string;
      rate_per_unit: number;
      gst_percentage: number;
      notes?: string;
    }[]
  ): Promise<{success: boolean, po?: PurchaseOrderWithItems, error?: string}> {
    try {
      // Generate PO number
      const po_number = await this.generatePONumber();

      // Calculate totals
      let subtotal = 0;
      let gst_amount = 0;
      
      const processedItems = items.map(item => {
        const amount = item.quantity * item.rate_per_unit;
        const itemGst = (amount * item.gst_percentage) / 100;
        const itemTotal = amount + itemGst;
        
        subtotal += amount;
        gst_amount += itemGst;
        
        return {
          ...item,
          amount,
          gst_amount: itemGst,
          total_amount: itemTotal
        };
      });

      const total_amount = subtotal + gst_amount;

      // Insert purchase order
      const { data: poData_result, error: poError } = await this.supabase.supabase
        .from('purchase_orders')
        .insert({
          po_number,
          ...poData,
          subtotal,
          gst_amount,
          total_amount,
          status: 'pending'
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert items
      const itemsToInsert = processedItems.map(item => ({
        po_id: poData_result.id,
        ...item
      }));

      const { data: itemsData, error: itemsError } = await this.supabase.supabase
        .from('purchase_order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) throw itemsError;

      return {
        success: true,
        po: {
          ...poData_result,
          items: itemsData || []
        }
      };

    } catch (error: any) {
      console.error('[SupplierService] createPurchaseOrder error:', error);
      return { success: false, error: error.message || 'Failed to create purchase order' };
    }
  }

  /**
   * Get all purchase orders
   */
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase.supabase
      .from('purchase_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[SupplierService] getAllPurchaseOrders error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get purchase order by ID with items
   */
  async getPurchaseOrderById(poId: string): Promise<PurchaseOrderWithItems | null> {
    const { data: po, error: poError } = await this.supabase.supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', poId)
      .single();

    if (poError) {
      console.error('[SupplierService] getPurchaseOrderById error:', poError);
      return null;
    }

    const { data: items, error: itemsError } = await this.supabase.supabase
      .from('purchase_order_items')
      .select('*')
      .eq('po_id', poId);

    if (itemsError) {
      console.error('[SupplierService] getPO items error:', itemsError);
    }

    return {
      ...po,
      items: items || []
    };
  }

  /**
   * Get purchase orders by supplier
   */
  async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase.supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[SupplierService] getPurchaseOrdersBySupplier error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update PO status
   */
  async updatePOStatus(poId: string, status: 'pending' | 'approved' | 'delivered' | 'cancelled'): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('purchase_orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', poId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('[SupplierService] updatePOStatus error:', error);
      return { success: false, error: error.message || 'Failed to update PO status' };
    }
  }

  /**
   * Get pending/approved purchase orders
   */
  async getPendingPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await this.supabase.supabase
      .from('purchase_orders')
      .select('*')
      .in('status', ['pending', 'approved'])
      .order('expected_delivery_date');

    if (error) {
      console.error('[SupplierService] getPendingPurchaseOrders error:', error);
      throw error;
    }

    return data || [];
  }

  // ============================================================
  // PAYMENT OPERATIONS
  // ============================================================

  /**
   * Record supplier payment
   */
  async recordPayment(paymentData: {
    supplier_id: string;
    po_id?: string;
    payment_date: string;
    amount_paid: number;
    payment_mode: string;
    cheque_number?: string;
    transaction_id?: string;
    bank_name?: string;
    paid_by_partner_id?: string;
    paid_from_firm_cash?: boolean;
    notes?: string;
    invoice_number?: string;
  }): Promise<{success: boolean, payment?: SupplierPayment, error?: string}> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('supplier_payments')
        .insert({
          ...paymentData,
          paid_from_firm_cash: paymentData.paid_from_firm_cash !== undefined ? paymentData.paid_from_firm_cash : true
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, payment: data };

    } catch (error: any) {
      console.error('[SupplierService] recordPayment error:', error);
      return { success: false, error: error.message || 'Failed to record payment' };
    }
  }

  /**
   * Get payments by supplier
   */
  async getPaymentsBySupplier(supplierId: string): Promise<SupplierPayment[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_payments')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('[SupplierService] getPaymentsBySupplier error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all payments
   */
  async getAllPayments(): Promise<SupplierPayment[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('[SupplierService] getAllPayments error:', error);
      throw error;
    }

    return data || [];
  }

  // ============================================================
  // INVOICE OPERATIONS
  // ============================================================

  /**
   * Create supplier invoice
   */
  async createInvoice(invoiceData: {
    supplier_id: string;
    po_id?: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    subtotal: number;
    gst_amount: number;
    total_amount: number;
    notes?: string;
    attachment_url?: string;
  }): Promise<{success: boolean, invoice?: SupplierInvoice, error?: string}> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('supplier_invoices')
        .insert({
          ...invoiceData,
          payment_status: 'unpaid',
          paid_amount: 0,
          outstanding_amount: invoiceData.total_amount
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, invoice: data };

    } catch (error: any) {
      console.error('[SupplierService] createInvoice error:', error);
      
      // Check for duplicate invoice
      if (error.code === '23505') {
        return { success: false, error: 'An invoice with this number already exists for this supplier' };
      }
      
      return { success: false, error: error.message || 'Failed to create invoice' };
    }
  }

  /**
   * Get invoices by supplier
   */
  async getInvoicesBySupplier(supplierId: string): Promise<SupplierInvoice[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_invoices')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('[SupplierService] getInvoicesBySupplier error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices(): Promise<SupplierInvoice[]> {
    const { data, error } = await this.supabase.supabase
      .from('supplier_invoices')
      .select('*')
      .in('payment_status', ['unpaid', 'partial'])
      .order('invoice_date');

    if (error) {
      console.error('[SupplierService] getUnpaidInvoices error:', error);
      throw error;
    }

    return data || [];
  }

  // ============================================================
  // LEDGER & REPORTING
  // ============================================================

  /**
   * Get supplier ledger
   */
  async getSupplierLedger(supplierId: string): Promise<SupplierLedgerEntry[]> {
    const { data, error } = await this.supabase.supabase
      .rpc('get_supplier_ledger', { p_supplier_id: supplierId });

    if (error) {
      console.error('[SupplierService] getSupplierLedger error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get supplier outstanding summary (from view)
   */
  async getSupplierOutstandingSummary() {
    const { data, error } = await this.supabase.supabase
      .from('supplier_outstanding_summary')
      .select('*')
      .order('current_outstanding', { ascending: false });

    if (error) {
      console.error('[SupplierService] getSupplierOutstandingSummary error:', error);
      throw error;
    }

    return data || [];
  }
}
