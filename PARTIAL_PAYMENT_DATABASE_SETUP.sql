-- ============================================================
-- PARTIAL PAYMENT SYSTEM - DATABASE SETUP
-- For: Labor Payments & Client Payments
-- Date: February 16, 2026
-- ============================================================

-- ============================================================
-- TABLE 1: wage_payments
-- Purpose: Track all subsequent payments to workers after initial wage entry
-- ============================================================

CREATE TABLE IF NOT EXISTS wage_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wage_entry_id UUID REFERENCES wage_entries(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers_master(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
  paid_by_partner_id UUID REFERENCES partner_master(id),
  payment_mode VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_wage_payments_worker ON wage_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_wage_payments_date ON wage_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_wage_payments_wage_entry ON wage_payments(wage_entry_id);

COMMENT ON TABLE wage_payments IS 'Tracks subsequent payments to workers after initial wage entry';
COMMENT ON COLUMN wage_payments.wage_entry_id IS 'Links to the original wage entry this payment is for';
COMMENT ON COLUMN wage_payments.amount_paid IS 'Amount paid in this payment transaction';
COMMENT ON COLUMN wage_payments.paid_by_partner_id IS 'Which partner paid this amount (NULL = firm cash)';

-- ============================================================
-- TABLE 2: client_payments
-- Purpose: Track all payments received from clients
-- ============================================================

CREATE TABLE IF NOT EXISTS client_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES client_ledger(id) ON DELETE CASCADE,
  sales_transaction_id UUID REFERENCES sales_transactions(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
  payment_mode VARCHAR(50) DEFAULT 'cash', -- cash, upi, cheque, bank_transfer
  cheque_number VARCHAR(100),
  upi_transaction_id VARCHAR(100),
  collected_by_partner_id UUID REFERENCES partner_master(id),
  deposited_to_firm BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_payments_client ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_date ON client_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_client_payments_sales ON client_payments(sales_transaction_id);

COMMENT ON TABLE client_payments IS 'Tracks all payments received from clients (initial and subsequent)';
COMMENT ON COLUMN client_payments.sales_transaction_id IS 'Links to sales transaction (NULL for general payments)';
COMMENT ON COLUMN client_payments.collected_by_partner_id IS 'Which partner collected this payment';
COMMENT ON COLUMN client_payments.deposited_to_firm IS 'Whether payment was deposited to firm or held by partner';

-- ============================================================
-- UPDATE EXISTING TABLES
-- ============================================================

-- Add paid_by_partner_id to wage_entries if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wage_entries' AND column_name = 'paid_by_partner_id'
  ) THEN
    ALTER TABLE wage_entries 
    ADD COLUMN paid_by_partner_id UUID REFERENCES partner_master(id);
    
    COMMENT ON COLUMN wage_entries.paid_by_partner_id IS 'Which partner paid the initial payment (NULL = firm cash or unpaid)';
  END IF;
END $$;

-- ============================================================
-- HELPER VIEWS FOR REPORTING
-- ============================================================

-- View: Worker Outstanding Balance
CREATE OR REPLACE VIEW worker_outstanding_view AS
SELECT 
  w.id as worker_id,
  w.name as worker_name,
  w.phone,
  w.cumulative_balance as system_balance,
  COALESCE(SUM(we.wage_earned), 0) as total_earned,
  COALESCE(SUM(we.paid_today), 0) as total_paid_initially,
  COALESCE(SUM(wp.amount_paid), 0) as total_paid_later,
  (COALESCE(SUM(we.wage_earned), 0) - 
   COALESCE(SUM(we.paid_today), 0) - 
   COALESCE(SUM(wp.amount_paid), 0)) as actual_outstanding
FROM workers_master w
LEFT JOIN wage_entries we ON w.id = we.worker_id
LEFT JOIN wage_payments wp ON w.id = wp.worker_id
WHERE w.active = true
GROUP BY w.id, w.name, w.phone, w.cumulative_balance
HAVING (COALESCE(SUM(we.wage_earned), 0) - 
        COALESCE(SUM(we.paid_today), 0) - 
        COALESCE(SUM(wp.amount_paid), 0)) > 0
ORDER BY actual_outstanding DESC;

COMMENT ON VIEW worker_outstanding_view IS 'Shows workers with outstanding wage balances';

-- View: Client Outstanding Balance
CREATE OR REPLACE VIEW client_outstanding_view AS
SELECT 
  c.id as client_id,
  c.client_name,
  c.phone,
  c.outstanding as system_outstanding,
  COALESCE(SUM(st.total_amount), 0) as total_sales,
  COALESCE(SUM(st.paid_amount), 0) as paid_at_sale,
  COALESCE(SUM(cp.amount_paid), 0) as paid_later,
  (COALESCE(SUM(st.total_amount), 0) - 
   COALESCE(SUM(st.paid_amount), 0) - 
   COALESCE(SUM(cp.amount_paid), 0)) as actual_outstanding
FROM client_ledger c
LEFT JOIN sales_transactions st ON c.id = st.client_id
LEFT JOIN client_payments cp ON c.id = cp.client_id
WHERE c.active = true
GROUP BY c.id, c.client_name, c.phone, c.outstanding
HAVING (COALESCE(SUM(st.total_amount), 0) - 
        COALESCE(SUM(st.paid_amount), 0) - 
        COALESCE(SUM(cp.amount_paid), 0)) > 0
ORDER BY actual_outstanding DESC;

COMMENT ON VIEW client_outstanding_view IS 'Shows clients with outstanding payment balances';

-- ============================================================
-- SAMPLE DATA - TESTING PARTIAL PAYMENTS
-- ============================================================

-- Example: 3 workers worked on Feb 16, 2026
-- Worker 1: Vipin - Earned ₹400, Paid ₹300 initially, Owes ₹100
-- Worker 2: Moti - Earned ₹400, Paid ₹100 initially, Owes ₹300
-- Worker 3: Raju - Earned ₹400, Paid ₹0 initially, Owes ₹400

-- Note: These are example entries. Replace UUIDs with actual values from your database.

/*
-- Day 1: Initial wage entries (Feb 16, 2026)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES 
  ('2026-02-16', 'worker-uuid-1', 'Full Day', 400, 300, 'cash', 'Partial payment'),
  ('2026-02-16', 'worker-uuid-2', 'Full Day', 400, 100, 'cash', 'Partial payment'),
  ('2026-02-16', 'worker-uuid-3', 'Full Day', 400, 0, 'unpaid', 'Will pay later');

-- Day 5: Subsequent payments (Feb 20, 2026)
INSERT INTO wage_payments (wage_entry_id, worker_id, payment_date, amount_paid, paid_by_partner_id, notes)
VALUES
  ('wage-entry-uuid-2', 'worker-uuid-2', '2026-02-20', 100, 'partner-pradeep-uuid', 'Partial payment by Pradeep'),
  ('wage-entry-uuid-3', 'worker-uuid-3', '2026-02-20', 200, 'partner-praveen-uuid', 'Partial payment by Praveen');

-- Day 10: Final clearance (Feb 24, 2026)
INSERT INTO wage_payments (wage_entry_id, worker_id, payment_date, amount_paid, paid_by_partner_id, notes)
VALUES
  ('wage-entry-uuid-1', 'worker-uuid-1', '2026-02-24', 100, NULL, 'Final clearance by firm cash'),
  ('wage-entry-uuid-2', 'worker-uuid-2', '2026-02-24', 200, 'partner-pradeep-uuid', 'Final clearance'),
  ('wage-entry-uuid-3', 'worker-uuid-3', '2026-02-24', 200, NULL, 'Final clearance by firm cash');
*/

-- ============================================================
-- QUERY EXAMPLES
-- ============================================================

-- Get worker payment history
/*
SELECT 
  w.name,
  we.date as work_date,
  we.wage_earned,
  we.paid_today as initial_payment,
  wp.payment_date as subsequent_payment_date,
  wp.amount_paid as subsequent_amount,
  p.name as paid_by,
  (we.wage_earned - we.paid_today - COALESCE(SUM(wp.amount_paid) OVER (PARTITION BY we.id), 0)) as remaining_balance
FROM wage_entries we
JOIN workers_master w ON we.worker_id = w.id
LEFT JOIN wage_payments wp ON we.id = wp.wage_entry_id
LEFT JOIN partner_master p ON wp.paid_by_partner_id = p.id
WHERE w.id = 'worker-uuid'
ORDER BY we.date DESC, wp.payment_date;
*/

-- Get client payment history
/*
SELECT 
  c.client_name,
  st.date as sale_date,
  st.total_amount,
  st.paid_amount as initial_payment,
  cp.payment_date as subsequent_payment_date,
  cp.amount_paid as subsequent_amount,
  cp.payment_mode,
  p.name as collected_by,
  (st.total_amount - st.paid_amount - COALESCE(SUM(cp.amount_paid) OVER (PARTITION BY st.id), 0)) as remaining_balance
FROM sales_transactions st
JOIN client_ledger c ON st.client_id = c.id
LEFT JOIN client_payments cp ON st.id = cp.sales_transaction_id
LEFT JOIN partner_master p ON cp.collected_by_partner_id = p.id
WHERE c.id = 'client-uuid'
ORDER BY st.date DESC, cp.payment_date;
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wage_payments', 'client_payments')
ORDER BY table_name;

-- Check table structures
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'wage_payments'
ORDER BY ordinal_position;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'client_payments'
ORDER BY ordinal_position;

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('worker_outstanding_view', 'client_outstanding_view');
