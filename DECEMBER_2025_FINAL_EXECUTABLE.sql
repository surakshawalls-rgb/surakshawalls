-- ============================================================
-- DECEMBER 2025 DATA INSERTION - FINAL EXECUTABLE SQL
-- Generated: February 15, 2026
-- Status: PRODUCTION READY - EXECUTABLE
-- ============================================================
-- INSTRUCTIONS:
-- This file uses EXISTING worker and partner UUIDs from database
-- Simply run all statements - no UUID replacement needed!
-- ============================================================

-- ============================================================
-- EXISTING UUIDs (Pre-filled from database):
-- ============================================================
/*
WORKER UUID:
- General Labour: 7e03710c-8306-4bde-82b6-52e2c38bb966

PARTNER UUIDs (Valid):
- Pradeep Vishwakarma: f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d
- Praveen Pandey: f5863aa5-8349-4a4c-952f-cda3af6a3c1a
*/

-- ============================================================
-- VERIFICATION: Check if worker exists
-- ============================================================
SELECT id, name, joined_date FROM workers_master 
WHERE id = '7e03710c-8306-4bde-82b6-52e2c38bb966';

-- ============================================================
-- MAIN DATA INSERTION - DECEMBER 2025
-- All UUIDs are pre-filled, ready to execute
-- ============================================================

-- ============================================================
-- PHASE 1: WORKER WAGES (9 entries - Total: ₹30,345)
-- ============================================================

-- 05-Dec-2025: General Labour wage ₹1,700
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-05', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 1700, 1700, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 09-Dec-2025: General Labour wage ₹6,500
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-09', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 6500, 6500, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 10-Dec-2025: General Labour wage ₹500
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-10', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 500, 500, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 12-Dec-2025: General Labour wage ₹9,845
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-12', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 9845, 9845, 'cash', 'Labour wage - Paid by firm (Pradeep)');

-- 20-Dec-2025: General Labour wage ₹2,600
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-20', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 2600, 2600, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 27-Dec-2025: General Labour wage ₹3,200
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-27', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 3200, 3200, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 28-Dec-2025: General Labour wage ₹2,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-28', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 2000, 2000, 'cash', 'Labour wage - Paid by firm (Praveen)');

-- 28-Dec-2025: General Labour wage ₹1,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-28', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 1000, 1000, 'cash', 'Labour wage - Paid by firm (Pradeep)');

-- 31-Dec-2025: General Labour wage ₹3,000
INSERT INTO wage_entries (date, worker_id, attendance_type, wage_earned, paid_today, payment_mode, notes)
VALUES ('2025-12-31', '7e03710c-8306-4bde-82b6-52e2c38bb966', 'Custom', 3000, 3000, 'cash', 'Labour wage - Paid by firm (Pradeep)');

-- ============================================================
-- PHASE 2: MATERIAL PURCHASES (5 entries)
-- ============================================================

-- 10-Dec-2025: Cement purchase (25 bags @ ₹327 = ₹8,175)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2025-12-10', 'Cement', 25, 327, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', '25 bori Cement - Paid by firm (Pradeep)');

-- 10-Dec-2025: Sariya (Steel) purchase - Paid by Praveen (Estimated ₹1,500)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2025-12-10', 'Sariya', 1, 1500, NULL, 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', 'office_cash', 'Sariya (Steel) purchase - Paid by firm (Praveen)');

-- 10-Dec-2025: Sariya (Steel) purchase - Paid by Pradeep (Estimated ₹1,500)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2025-12-10', 'Sariya', 1, 1500, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'Sariya (Steel) purchase - Paid by firm (Pradeep)');

-- 13-Dec-2025: General Materials purchase (Estimated ₹1,000)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2025-12-13', 'Materials', 1, 1000, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', 'General materials - Paid by firm (Pradeep)');

-- 21-Dec-2025: Cement purchase (30 bags @ ₹328 = ₹9,840)
INSERT INTO raw_materials_purchase (date, material_name, quantity, unit_cost, vendor_name, partner_id, paid_from, notes)
VALUES ('2025-12-21', 'Cement', 30, 328, NULL, 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', 'office_cash', '30 bori Cement - Paid by firm (Pradeep)');

-- ============================================================
-- PHASE 3: OPERATIONAL EXPENSES (1 entry)
-- ============================================================

-- 12-Dec-2025: Operational expenses ₹970 (Vehicle rent + petrol + snacks)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-12', 'payment', 970, 'operational', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Gadi bhada + petrol + Labour snacks - Paid by Praveen');

-- ============================================================
-- PHASE 4: VERIFICATION QUERIES
-- Run these to verify data insertion
-- ============================================================

-- Verify worker wages for December 2025
SELECT date, wage_earned, paid_today, notes 
FROM wage_entries 
WHERE date BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY date;

-- Check total wages paid in December
SELECT COUNT(*) as total_entries, SUM(wage_earned) as total_wages, SUM(paid_today) as total_paid
FROM wage_entries
WHERE date BETWEEN '2025-12-01' AND '2025-12-31';

-- Verify material purchases for December 2025
SELECT date, material_name, quantity, unit_cost, (quantity * unit_cost) as total_cost, notes
FROM raw_materials_purchase
WHERE date BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY date;

-- Check total material costs in December
SELECT material_name, SUM(quantity) as total_quantity, SUM(quantity * unit_cost) as total_spent
FROM raw_materials_purchase
WHERE date BETWEEN '2025-12-01' AND '2025-12-31'
GROUP BY material_name
ORDER BY total_spent DESC;

-- Verify firm cash ledger for December 2025
SELECT date, type, amount, category, description
FROM firm_cash_ledger
WHERE date BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY date;

-- Summary by category
SELECT type, category, COUNT(*) as entries, SUM(amount) as total_amount
FROM firm_cash_ledger
WHERE date BETWEEN '2025-12-01' AND '2025-12-31'
GROUP BY type, category 
ORDER BY type, category;

-- ============================================================
-- DECEMBER 2025 SUMMARY
-- ============================================================
/*
WAGES:
- 9 wage entries
- Total wages: ₹30,345
- All paid to General Labour worker

MATERIAL PURCHASES:
- Cement: 55 bags (25 + 30) @ ₹327-328 per bag
- Sariya: 2 units @ ₹1,500 each (estimated)
- General Materials: 1 unit @ ₹1,000 (estimated)
- Total material cost: ~₹22,015

OPERATIONAL EXPENSES:
- Vehicle + petrol + snacks: ₹970

TOTAL DECEMBER EXPENSES: ~₹53,330
*/

-- ============================================================
-- END OF SQL FILE
-- ============================================================
