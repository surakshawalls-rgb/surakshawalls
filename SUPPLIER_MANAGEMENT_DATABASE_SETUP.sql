-- ============================================================
-- SUPPLIER MANAGEMENT SYSTEM - DATABASE SETUP
-- Purpose: Track material suppliers, purchases, payments, and outstanding
-- Date: February 26, 2026
-- ============================================================

-- ============================================================
-- TABLE 1: supplier_master
-- Purpose: Store supplier information
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  gstin VARCHAR(15),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  
  -- Financial tracking
  opening_balance DECIMAL(12,2) DEFAULT 0,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  outstanding DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_supplier_master_phone ON supplier_master(phone);
CREATE INDEX IF NOT EXISTS idx_supplier_master_active ON supplier_master(active);
CREATE INDEX IF NOT EXISTS idx_supplier_master_name ON supplier_master(supplier_name);

COMMENT ON TABLE supplier_master IS 'Master database of all material suppliers';
COMMENT ON COLUMN supplier_master.opening_balance IS 'Opening balance owed to supplier (positive = we owe them)';
COMMENT ON COLUMN supplier_master.outstanding IS 'Current outstanding amount owed to supplier';

-- ============================================================
-- TABLE 2: purchase_orders
-- Purpose: Track material purchase orders
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES supplier_master(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, delivered, cancelled
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Terms
  payment_terms VARCHAR(100), -- e.g., "30 days credit", "Immediate", "50% advance"
  delivery_address TEXT,
  notes TEXT,
  
  -- Metadata
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

COMMENT ON TABLE purchase_orders IS 'Purchase orders created for suppliers';
COMMENT ON COLUMN purchase_orders.status IS 'Order status: pending, approved, delivered, cancelled';

-- ============================================================
-- TABLE 3: purchase_order_items
-- Purpose: Line items for each purchase order
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_name VARCHAR(200) NOT NULL,
  material_category VARCHAR(100), -- cement, sand, aggregate, chemical, etc.
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL, -- kg, ton, bag, liter, cubic feet
  rate_per_unit DECIMAL(10,2) NOT NULL CHECK (rate_per_unit >= 0),
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  gst_percentage DECIMAL(5,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_material ON purchase_order_items(material_name);

COMMENT ON TABLE purchase_order_items IS 'Individual items in each purchase order';

-- ============================================================
-- TABLE 4: supplier_payments
-- Purpose: Track all payments made to suppliers
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES supplier_master(id) ON DELETE CASCADE,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_mode VARCHAR(50) DEFAULT 'cash', -- cash, upi, cheque, bank_transfer, rtgs, neft
  
  -- Payment details
  cheque_number VARCHAR(100),
  transaction_id VARCHAR(100),
  bank_name VARCHAR(100),
  
  -- Who paid
  paid_by_partner_id UUID REFERENCES partner_master(id),
  paid_from_firm_cash BOOLEAN DEFAULT true,
  
  -- Additional info
  notes TEXT,
  invoice_number VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_po ON supplier_payments(po_id);

COMMENT ON TABLE supplier_payments IS 'All payments made to suppliers';
COMMENT ON COLUMN supplier_payments.paid_by_partner_id IS 'Which partner made the payment (NULL = firm cash)';
COMMENT ON COLUMN supplier_payments.po_id IS 'Links to specific purchase order (NULL for general payments)';

-- ============================================================
-- TABLE 5: supplier_invoices
-- Purpose: Track supplier invoices/bills
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES supplier_master(id) ON DELETE CASCADE,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
  
  -- Additional info
  notes TEXT,
  attachment_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_supplier_invoice UNIQUE(supplier_id, invoice_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON supplier_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_po ON supplier_invoices(po_id);

COMMENT ON TABLE supplier_invoices IS 'Invoices/bills received from suppliers';
COMMENT ON COLUMN supplier_invoices.payment_status IS 'Payment status: unpaid, partial, paid';

-- ============================================================
-- UPDATE: Link material_purchase table to suppliers (if table exists)
-- ============================================================

-- Add supplier_id to material_purchase table if table and column don't exist
DO $$ 
BEGIN
  -- Check if material_purchase table exists first
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'material_purchase'
  ) THEN
    -- Add supplier_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'material_purchase' AND column_name = 'supplier_id'
    ) THEN
      ALTER TABLE material_purchase 
      ADD COLUMN supplier_id UUID REFERENCES supplier_master(id);
      
      COMMENT ON COLUMN material_purchase.supplier_id IS 'Links to supplier master';
    END IF;
    
    -- Add invoice_number column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'material_purchase' AND column_name = 'invoice_number'
    ) THEN
      ALTER TABLE material_purchase 
      ADD COLUMN invoice_number VARCHAR(100);
      
      COMMENT ON COLUMN material_purchase.invoice_number IS 'Supplier invoice/bill number';
    END IF;
  END IF;
END $$;

-- ============================================================
-- VIEWS FOR REPORTING
-- ============================================================

-- View: Supplier Outstanding Summary
CREATE OR REPLACE VIEW supplier_outstanding_summary AS
SELECT 
  s.id as supplier_id,
  s.supplier_name,
  s.company_name,
  s.phone,
  s.opening_balance,
  COALESCE(SUM(si.total_amount), 0) as total_invoiced,
  COALESCE(SUM(sp.amount_paid), 0) as total_paid,
  (s.opening_balance + COALESCE(SUM(si.total_amount), 0) - COALESCE(SUM(sp.amount_paid), 0)) as current_outstanding,
  COUNT(DISTINCT si.id) as total_invoices,
  COUNT(DISTINCT CASE WHEN si.payment_status = 'unpaid' THEN si.id END) as unpaid_invoices,
  MAX(si.invoice_date) as last_invoice_date,
  MAX(sp.payment_date) as last_payment_date
FROM supplier_master s
LEFT JOIN supplier_invoices si ON s.id = si.supplier_id
LEFT JOIN supplier_payments sp ON s.id = sp.supplier_id
WHERE s.active = true
GROUP BY s.id, s.supplier_name, s.company_name, s.phone, s.opening_balance
ORDER BY current_outstanding DESC;

COMMENT ON VIEW supplier_outstanding_summary IS 'Overview of supplier balances and outstanding amounts';

-- View: Purchase Order Summary
CREATE OR REPLACE VIEW purchase_order_summary AS
SELECT 
  po.id as po_id,
  po.po_number,
  po.order_date,
  po.expected_delivery_date,
  po.status,
  s.supplier_name,
  s.phone as supplier_phone,
  po.total_amount,
  COUNT(poi.id) as item_count,
  po.payment_terms,
  po.created_at
FROM purchase_orders po
JOIN supplier_master s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
GROUP BY po.id, po.po_number, po.order_date, po.expected_delivery_date, 
         po.status, s.supplier_name, s.phone, po.total_amount, 
         po.payment_terms, po.created_at
ORDER BY po.order_date DESC, po.po_number DESC;

COMMENT ON VIEW purchase_order_summary IS 'Summary view of all purchase orders';

-- View: Pending Purchase Orders
CREATE OR REPLACE VIEW pending_purchase_orders AS
SELECT 
  po.po_number,
  s.supplier_name,
  s.phone,
  po.order_date,
  po.expected_delivery_date,
  CASE 
    WHEN po.expected_delivery_date < CURRENT_DATE THEN 'Overdue'
    WHEN po.expected_delivery_date = CURRENT_DATE THEN 'Due Today'
    ELSE 'Upcoming'
  END as delivery_status,
  po.total_amount,
  po.status
FROM purchase_orders po
JOIN supplier_master s ON po.supplier_id = s.id
WHERE po.status IN ('pending', 'approved')
ORDER BY po.expected_delivery_date;

COMMENT ON VIEW pending_purchase_orders IS 'All pending and approved purchase orders';

-- ============================================================
-- TRIGGERS FOR AUTO-CALCULATION
-- ============================================================

-- Trigger: Update supplier outstanding on invoice insert/update
CREATE OR REPLACE FUNCTION update_supplier_outstanding()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate supplier outstanding
  UPDATE supplier_master
  SET 
    total_purchases = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM supplier_invoices
      WHERE supplier_id = NEW.supplier_id
    ),
    total_paid = (
      SELECT COALESCE(SUM(amount_paid), 0)
      FROM supplier_payments
      WHERE supplier_id = NEW.supplier_id
    )
  WHERE id = NEW.supplier_id;
  
  -- Calculate outstanding
  UPDATE supplier_master
  SET outstanding = opening_balance + total_purchases - total_paid
  WHERE id = NEW.supplier_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to supplier_invoices
DROP TRIGGER IF EXISTS trigger_supplier_invoice_outstanding ON supplier_invoices;
CREATE TRIGGER trigger_supplier_invoice_outstanding
AFTER INSERT OR UPDATE ON supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION update_supplier_outstanding();

-- Apply trigger to supplier_payments
DROP TRIGGER IF EXISTS trigger_supplier_payment_outstanding ON supplier_payments;
CREATE TRIGGER trigger_supplier_payment_outstanding
AFTER INSERT OR UPDATE ON supplier_payments
FOR EACH ROW
EXECUTE FUNCTION update_supplier_outstanding();

-- Trigger: Update invoice payment status
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate paid amount for this invoice
  UPDATE supplier_invoices si
  SET 
    paid_amount = COALESCE((
      SELECT SUM(amount_paid)
      FROM supplier_payments
      WHERE po_id = si.po_id OR invoice_number = si.invoice_number
    ), 0),
    outstanding_amount = total_amount - COALESCE((
      SELECT SUM(amount_paid)
      FROM supplier_payments
      WHERE po_id = si.po_id OR invoice_number = si.invoice_number
    ), 0)
  WHERE id = (
    SELECT id FROM supplier_invoices
    WHERE po_id = NEW.po_id OR invoice_number = NEW.invoice_number
    LIMIT 1
  );
  
  -- Update payment status
  UPDATE supplier_invoices
  SET payment_status = CASE
    WHEN paid_amount = 0 THEN 'unpaid'
    WHEN paid_amount >= total_amount THEN 'paid'
    ELSE 'partial'
  END
  WHERE po_id = NEW.po_id OR invoice_number = NEW.invoice_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_status ON supplier_payments;
CREATE TRIGGER trigger_update_invoice_status
AFTER INSERT OR UPDATE ON supplier_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_payment_status();

-- ============================================================
-- RPC FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================

-- Function: Get supplier ledger with all transactions
CREATE OR REPLACE FUNCTION get_supplier_ledger(p_supplier_id UUID)
RETURNS TABLE (
  transaction_date DATE,
  transaction_type VARCHAR,
  reference_number VARCHAR,
  description TEXT,
  debit_amount DECIMAL,
  credit_amount DECIMAL,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH transactions AS (
    -- Opening balance
    SELECT 
      '2000-01-01'::DATE as trans_date,
      'Opening Balance' as trans_type,
      '' as ref_num,
      'Opening Balance' as trans_desc,
      CASE WHEN opening_balance > 0 THEN opening_balance ELSE 0 END as debit,
      CASE WHEN opening_balance < 0 THEN ABS(opening_balance) ELSE 0 END as credit
    FROM supplier_master
    WHERE id = p_supplier_id
    
    UNION ALL
    
    -- Invoices (debit - we owe them)
    SELECT 
      invoice_date,
      'Invoice',
      invoice_number,
      'Invoice #' || invoice_number,
      total_amount,
      0
    FROM supplier_invoices
    WHERE supplier_id = p_supplier_id
    
    UNION ALL
    
    -- Payments (credit - we paid them)
    SELECT 
      payment_date,
      'Payment',
      COALESCE(transaction_id, cheque_number, 'CASH'),
      'Payment - ' || payment_mode,
      0,
      amount_paid
    FROM supplier_payments
    WHERE supplier_id = p_supplier_id
  )
  SELECT 
    trans_date as transaction_date,
    trans_type as transaction_type,
    ref_num as reference_number,
    trans_desc as description,
    debit as debit_amount,
    credit as credit_amount,
    SUM(debit - credit) OVER (ORDER BY trans_date, trans_type) as balance
  FROM transactions
  ORDER BY trans_date, trans_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_supplier_ledger IS 'Returns complete ledger for a supplier with running balance';

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================

-- Insert sample suppliers
/*
INSERT INTO supplier_master (supplier_name, company_name, phone, address, city, opening_balance)
VALUES 
  ('Rajesh Traders', 'Rajesh Building Materials Pvt Ltd', '9876543210', 'Industrial Area, Sector 5', 'Ghaziabad', 5000),
  ('Modern Cement Store', 'Modern Enterprises', '9876543211', 'Main Road', 'Delhi', 0),
  ('Shree Chemical Suppliers', 'Shree Chemicals', '9876543212', 'Chemical Market', 'Noida', 2500);

-- Insert sample purchase order
INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, subtotal, gst_amount, total_amount, payment_terms, status)
VALUES (
  'PO/2026/001',
  (SELECT id FROM supplier_master WHERE phone = '9876543210'),
  '2026-02-20',
  '2026-02-25',
  50000,
  9000,
  59000,
  '30 days credit',
  'delivered'
);

-- Insert purchase order items
INSERT INTO purchase_order_items (po_id, material_name, material_category, quantity, unit, rate_per_unit, amount, gst_percentage, gst_amount, total_amount)
VALUES 
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO/2026/001'), 'Portland Cement', 'Cement', 100, 'bags', 400, 40000, 18, 7200, 47200),
  ((SELECT id FROM purchase_orders WHERE po_number = 'PO/2026/001'), 'River Sand', 'Sand', 10, 'ton', 1000, 10000, 18, 1800, 11800);

-- Insert invoice
INSERT INTO supplier_invoices (supplier_id, po_id, invoice_number, invoice_date, due_date, subtotal, gst_amount, total_amount, payment_status)
VALUES (
  (SELECT id FROM supplier_master WHERE phone = '9876543210'),
  (SELECT id FROM purchase_orders WHERE po_number = 'PO/2026/001'),
  'INV/2026/001',
  '2026-02-25',
  '2026-03-27',
  50000,
  9000,
  59000,
  'partial'
);

-- Insert payment
INSERT INTO supplier_payments (supplier_id, po_id, payment_date, amount_paid, payment_mode, notes)
VALUES (
  (SELECT id FROM supplier_master WHERE phone = '9876543210'),
  (SELECT id FROM purchase_orders WHERE po_number = 'PO/2026/001'),
  '2026-02-26',
  30000,
  'bank_transfer',
  'Partial payment for PO/2026/001'
);
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('supplier_master', 'purchase_orders', 'purchase_order_items', 'supplier_payments', 'supplier_invoices')
ORDER BY table_name;

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'supplier%' OR table_name LIKE 'purchase%'
ORDER BY table_name;

-- Count records (will be 0 until you insert data)
SELECT 
  'supplier_master' as table_name, COUNT(*) as record_count FROM supplier_master
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'supplier_payments', COUNT(*) FROM supplier_payments
UNION ALL
SELECT 'supplier_invoices', COUNT(*) FROM supplier_invoices;
