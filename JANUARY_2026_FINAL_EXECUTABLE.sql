-- ============================================================
-- JANUARY 2026 DATA INSERTION - FINAL EXECUTABLE SQL
-- Generated: February 13, 2026
-- Status: PRODUCTION READY
-- ============================================================
-- INSTRUCTIONS:
-- 1. Run SECTION 1 first (Create new workers & client)
-- 2. Copy the UUIDs from the SELECT results  
-- 3. Run SECTION 2 with the UUIDs filled in
-- ============================================================

-- ============================================================
-- SECTION 1: CREATE NEW RECORDS
-- RUN THIS FIRST TO CREATE GENERAL LABOUR WORKER & CASH SALES CLIENT
-- ============================================================

-- Step 1A: Create "General Labour" worker
INSERT INTO workers_master (name, phone, cumulative_balance, total_days_worked, total_earned, total_paid, active, joined_date, notes)
VALUES 
('General Labour', NULL, 0, 0, 0, 0, true, '2026-01-01', 'Generic worker for unspecified labour entries')
RETURNING id, name;
-- ⚠️ IMPORTANT: Copy the UUID returned above and replace 7e03710c-8306-4bde-82b6-52e2c38bb966 in SECTION 2

-- Step 1B: Create "Cash Sales" client
INSERT INTO client_ledger (client_name, phone, address, total_billed, total_paid, active)
VALUES 
('Cash Sales', NULL, 'N/A', 0, 0, true)
RETURNING id, client_name;
-- Note: Client UUID not needed since sales_transactions is commented out

-- Step 1C: Verify all worker UUIDs are available
SELECT id, name FROM workers_master 
WHERE name IN ('Moti Maurya', 'Pappu Saroj', 'Vipin Saroj', 'Pradeep Saroj', 'Atul Maurya', 'General Labour') 
ORDER BY name;

-- ============================================================
-- EXISTING WORKER UUIDs (Pre-filled from database):
-- ============================================================
/*
EXISTING WORKERS:
- Moti Maurya: 832c51d7-7b23-4e92-96ef-b6e46a606f75
- Pappu Saroj: 738ff936-cdd7-4b3a-b042-ab2ae65dbcc8
- Vipin Saroj: 25c521b7-93d6-493c-8dcb-182612ae725e
- Pradeep Saroj: 30afc70a-3415-4237-991c-dc2b1344453f
- Atul Maurya: a210a2b7-08d5-404e-afd7-c8dac686dc79

NEW WORKER (created in SECTION 1):
- General Labour: 7e03710c-8306-4bde-82b6-52e2c38bb966

PARTNER UUIDs:
- Pradeep Vishwakarma: f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d
- Praveen Pandey: f5863aa5-8349-4a4c-952f-cda3af6a3c1a
*/

-- ============================================================
-- SECTION 2: MAIN DATA INSERTION
-- ⚠️ BEFORE RUNNING: Replace 7e03710c-8306-4bde-82b6-52e2c38bb966 with UUID from SECTION 1
-- All other worker UUIDs are pre-filled from database
-- ============================================================

-- ============================================================
-- PHASE 1: MATERIAL PURCHASES (9 entries)
-- ============================================================

-- 01-Jan-2026: Sand purchase (68 cuft @ ₹55.88 = ₹3,800)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-01', 'Sand', 68, 55.88, 'Balu', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Paid by firm (Pradeep)');

-- 01-Jan-2026: Gitti purchase (68 cuft @ ₹55.88 = ₹3,800)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-01', 'Gitti (Aggregates)', 68, 55.88, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Paid by firm (Pradeep)');

-- 01-Jan-2026: White Sand purchase (68 cuft @ ₹32.35 = ₹2,200)
-- Note: White sand is cheaper than regular sand
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-01', 'White Sand', 68, 32.35, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Paid by firm (Pradeep) - Full trolley');

-- 04-Jan-2026: Cement purchase (50 bags @ ₹316 = ₹15,800)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-04', 'Cement', 50, 316, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'partner_pocket', 'Paid by Pradeep (personal money)');

-- 19-Jan-2026: Sand purchase (68 cuft @ ₹55.88 = ₹3,800)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-19', 'Sand', 68, 55.88, 'Balu', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Paid by firm (Pradeep)');

-- 24-Jan-2026: Gitti purchase (68 cuft @ ₹55.88 = ₹3,800)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-24', 'Gitti (Aggregates)', 68, 55.88, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Paid by firm (Pradeep)');

-- 27-Jan-2026: Mobile (Lubricant) purchase (~1.07 liters @ ₹150/liter = ₹160)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-27', 'Mobile (Lubricant)', 1.07, 150, NULL, 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', 'office_cash', 'Paid by firm (Praveen)');

-- 27-Jan-2026: Diesel purchase (~2.22 liters @ ₹90/liter = ₹200)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-27', 'Diesel', 2.22, 90, NULL, 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', 'office_cash', 'Paid by firm (Praveen)');

-- 31-Jan-2026: Mobile (Lubricant) purchase (1 liter @ ₹150 = ₹150)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2026-01-31', 'Mobile (Lubricant)', 1, 150, NULL, 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', 'office_cash', 'Paid by firm (Praveen)');

-- ============================================================
-- PHASE 2: WORKER WAGES (16 entries)
-- ⚠️ Replace 7e03710c-8306-4bde-82b6-52e2c38bb966 with UUID from SECTION 1 result
-- ============================================================

-- 03-Jan-2026: General Labour wage ₹1,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-03', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 1000, 1000, 'cash', 'Labour wages - Paid by firm (Praveen)');

-- 04-Jan-2026: Vipin Saroj wage ₹500 (Half Day)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-04', '25c521b7-93d6-493c-8dcb-182612ae725e', 'Half Day', 500, 500, 'cash', 'Vipin Saroj wage - Paid by firm (Praveen)');

-- 05-Jan-2026: General Labour wage ₹550 (Half Day equivalent)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-05', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 550, 550, 'cash', 'Labour half day - Paid by firm (Praveen)');

-- 06-Jan-2026: General Labour wage ₹1,500
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-06', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 1500, 1500, 'cash', 'Labour expenses - Paid by firm (Praveen)');

-- 07-Jan-2026: General Labour wage ₹900 (balance settlement)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-07', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 900, 900, 'cash', 'Wages + balance - Paid by Praveen');

-- 11-Jan-2026: Atul Maurya wage ₹850 (includes brother's work)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-11', 'a210a2b7-08d5-404e-afd7-c8dac686dc79', 'Custom', 850, 850, 'cash', 'Atul + brother wages (₹850 total, includes brother work) - Paid by firm (Pradeep)');

-- 11-Jan-2026: General Labour wage ₹1,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-11', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 1000, 1000, 'cash', 'Other labour wages - Paid by Praveen');

-- 13-Jan-2026: Moti Maurya wage settlement ₹2,300 (₹6,900 ÷ 3)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-13', '832c51d7-7b23-4e92-96ef-b6e46a606f75', 'Custom', 2300, 2300, 'cash', 'Wage settlement - Moti share - Paid by Praveen');

-- 13-Jan-2026: Pappu Saroj wage settlement ₹2,300 (₹6,900 ÷ 3)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-13', '738ff936-cdd7-4b3a-b042-ab2ae65dbcc8', 'Custom', 2300, 2300, 'cash', 'Wage settlement - Pappu share - Paid by Praveen');

-- 13-Jan-2026: Vipin Saroj wage settlement ₹2,300 (₹6,900 ÷ 3)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-13', '25c521b7-93d6-493c-8dcb-182612ae725e', 'Custom', 2300, 2300, 'cash', 'Vipin Saroj wage settlement - Paid by Praveen');

-- 19-Jan-2026: General Labour wage ₹4,100 (10 labours combined)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-19', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 4100, 4100, 'cash', 'Labour (10 labours @ ₹410 avg) - Paid by Praveen');

-- 22-Jan-2026: Atul Maurya wage ₹1,150
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-22', 'a210a2b7-08d5-404e-afd7-c8dac686dc79', 'Custom', 1150, 1150, 'cash', 'Atul Maurya wage - Paid by firm (Praveen)');

-- 23-Jan-2026: Vipin Saroj wage ₹500 (Half Day)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-23', '25c521b7-93d6-493c-8dcb-182612ae725e', 'Half Day', 500, 500, 'cash', 'Vipin Saroj wage - Paid by Praveen');

-- 25-Jan-2026: Moti Maurya wage ₹2,500 (₹5,000 ÷ 2)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-25', '832c51d7-7b23-4e92-96ef-b6e46a606f75', 'Custom', 2500, 2500, 'cash', 'Moti + Pappu wage (Moti share) - Paid by Praveen');

-- 25-Jan-2026: Pappu Saroj wage ₹2,500 (₹5,000 ÷ 2)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-25', '738ff936-cdd7-4b3a-b042-ab2ae65dbcc8', 'Custom', 2500, 2500, 'cash', 'Moti + Pappu wage (Pappu share) - Paid by Praveen');

-- 31-Jan-2026: Vipin Saroj wage ₹1,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-31', '25c521b7-93d6-493c-8dcb-182612ae725e', 'Custom', 1000, 1000, 'cash', 'Vipin Saroj wage - Paid by Praveen');

-- 31-Jan-2026: Vipin Saroj adjustment ₹216 (wage correction)
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2026-01-31', '25c521b7-93d6-493c-8dcb-182612ae725e', 'Custom', 216, 216, 'cash', 'Vipin Saroj wage adjustment - Correction - Paid by firm (Pradeep)');

-- ============================================================
-- PHASE 3: SALES TRANSACTION (1 entry)
-- ⚠️ WARNING: HISTORICAL DATA - STOCK IMPACT ISSUE!
-- ⚠️ REPLACE [UUID_CASH_SALES_CLIENT] WITH ACTUAL UUID
-- ============================================================

-- ⚠️⚠️⚠️ CRITICAL NOTICE ⚠️⚠️⚠️
-- This is HISTORICAL data from January 2026
-- Sales service will auto-deduct 40 FENCING_POLE from current finished_goods_inventory
-- This will INCORRECTLY reduce your current stock!
-- 
-- SOLUTION OPTIONS:
-- Option A: SKIP this insert, only record income in firm_cash_ledger (see alternative below)
-- Option B: Run this insert, then MANUALLY ADD 40 to finished_goods_inventory to compensate
-- Option C: Temporarily disable the increment_finished_goods trigger before running
--
-- RECOMMENDED: Option A - Skip sales_transactions, use firm_cash_ledger only
-- ============================================================

-- 19-Jan-2026: 40 FENCING_POLE @ ₹250 = ₹10,000 (Cash sale, full payment)
-- ⚠️ COMMENT OUT THIS INSERT IF USING OPTION A (RECOMMENDED)
/*
INSERT INTO sales_transactions (
    date, 
    client_id, 
    product_name, 
    product_variant, 
    quantity, 
    rate_per_unit, 
    payment_type, 
    paid_amount, 
    collected_by_partner_id, 
    deposited_to_firm, 
    delivery_status, 
    notes
)
VALUES (
    '2026-01-19',
    '[UUID_CASH_SALES_CLIENT]',
    'FENCING_POLE',
    NULL,
    40,
    250,
    'full',
    10000,
    'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d',
    true,
    'delivered',
    'Historical: 40 Fencing Poles @ ₹250 - Collected by Pradeep - January 2026'
);
*/

-- ============================================================
-- ALTERNATIVE FOR OPTION A (RECOMMENDED):
-- Record sales income directly in firm_cash_ledger without stock impact
-- ============================================================
-- UNCOMMENT THIS IF SKIPPING THE SALES_TRANSACTIONS INSERT ABOVE
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-19', 'receipt', 10000, 'sales', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', true, 'Historical sales: 40 Fencing Poles @ ₹250 = ₹10,000 - Received by Pradeep - January 2026');
-- ============================================================

-- ============================================================
-- PHASE 4: FIRM CASH LEDGER ENTRIES (3 manual entries)
-- Note: Material purchases and wages auto-create entries
-- ============================================================

-- 09-Jan-2026: PAN application (operational expense)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-09', 'payment', 300, 'operational', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'PAN application - Paid by Praveen');

-- 11-Jan-2026: Fencing wire binding (miscellaneous income)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-11', 'receipt', 1000, 'sales', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', true, 'Fencing wire binding income - Received by Pradeep');

-- 27-Jan-2026: Medicine for Pappu (operational expense)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-27', 'payment', 250, 'operational', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Medicine (Pappu) - Paid by Praveen');

-- ============================================================
-- VERIFICATION QUERIES (Run after insertion)
-- ============================================================

-- Check material purchases
SELECT material_name, COUNT(*) as purchases, SUM(quantity) as total_qty, SUM(total_amount) as total_cost
FROM raw_materials_purchase
WHERE date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY material_name ORDER BY material_name;

-- Check worker wages
SELECT w.name, COUNT(*) as entries, SUM(we.wage_earned) as earned, SUM(we.paid_today) as paid
FROM wage_entries we
JOIN workers_master w ON w.id = we.worker_id
WHERE we.date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY w.name ORDER BY w.name;

-- Check sales (Will be 0 if you used Option A - firm_cash_ledger only)
SELECT COUNT(*) as sales_count, SUM(total_amount) as total_sales, SUM(paid_amount) as received
FROM sales_transactions
WHERE date BETWEEN '2026-01-01' AND '2026-01-31';

-- Check current stock (verify no incorrect deduction)
SELECT product_name, current_stock
FROM finished_goods_inventory
WHERE product_name = 'FENCING_POLE';

-- Check firm cash ledger
SELECT type, category, COUNT(*) as entries, SUM(amount) as total
FROM firm_cash_ledger
WHERE date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY type, category ORDER BY type, category;

-- ============================================================
-- EXPECTED TOTALS AFTER INSERTION:
-- ============================================================
/*
Material Purchases: 9 entries = ₹33,310
- Sand: ₹7,600 (2 × ₹3,800)
- Gitti: ₹7,600 (2 × ₹3,800) 
- White Sand: ₹2,200 (68 cuft @ ₹32.35/cuft)
- Cement: ₹15,800 (50 bags @ ₹316/bag)
- Mobile: ₹310 (2.07 liters total)
- Diesel: ₹200 (2.22 liters)

Worker Wages: 16 entries = ₹23,116
- General Labour: ₹9,550 (6 entries)
- Vipin Saroj: ₹4,516 (5 entries)
- Moti Maurya: ₹4,800 (2 entries)
- Pappu Saroj: ₹4,800 (2 entries)
- Atul Maurya: ₹2,000 (2 entries - includes brother's work on Jan 11)

Sales: 1 entry = ₹10,000
Operational: 2 entries = ₹550
Misc Income: 1 entry = ₹1,000

TOTAL INCOME: ₹11,000
TOTAL EXPENSES: ₹56,976
NET: -₹45,976 (operational month with material purchases)
*/

-- ============================================================
-- END OF SQL FILE
-- ============================================================
