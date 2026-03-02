-- ============================================================
-- FIX: ADD MISSING FIRM_CASH_LEDGER ENTRIES (100% DUPLICATE-SAFE)
-- Generated: February 15, 2026
-- Purpose: Add wage and purchase entries to firm_cash_ledger
-- ============================================================
-- INSTRUCTIONS:
-- 1. Run this AFTER executing the November, December, and January SQL files
-- 2. This script is 100% DUPLICATE-SAFE - it checks before inserting
-- 3. You can run it multiple times without creating duplicates
-- 4. The script will show you before/after counts
-- ============================================================

-- ============================================================
-- BEFORE STATUS
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '==== BEFORE INSERTING NEW ENTRIES ====';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total existing entries: %', (SELECT COUNT(*) FROM firm_cash_ledger);
    RAISE NOTICE 'November 2025: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-11-01' AND date <= '2025-11-30');
    RAISE NOTICE 'December 2025: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-12-01' AND date <= '2025-12-31');
    RAISE NOTICE 'January 2026: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2026-01-01' AND date <= '2026-01-31');
    RAISE NOTICE '========================================';
END $$;

-- ============================================================
-- NOVEMBER 2025 - WAGE ENTRIES (9 entries - Total: ₹17,600)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-01', 'payment', 300, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-01' AND type = 'payment' AND amount = 300 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-05', 'payment', 700, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-05' AND type = 'payment' AND amount = 700 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-10', 'payment', 200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-10' AND type = 'payment' AND amount = 200 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-14', 'payment', 2000, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-14' AND type = 'payment' AND amount = 2000 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-15', 'payment', 1200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-15' AND type = 'payment' AND amount = 1200 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-17', 'payment', 2000, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-17' AND type = 'payment' AND amount = 2000 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-23', 'payment', 4500, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-23' AND type = 'payment' AND amount = 4500 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-30', 'payment', 4200, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-30' AND type = 'payment' AND amount = 4200 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-30', 'payment', 2500, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep) - Second payment'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-30' AND type = 'payment' AND amount = 2500 AND category = 'wage' AND description LIKE '%Second payment%');

-- ============================================================
-- NOVEMBER 2025 - MATERIAL PURCHASES (9 entries - Total: ₹26,100)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-01', 'payment', 1500, 'purchase', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Bhassi (Stone chips) - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-01' AND type = 'payment' AND amount = 1500 AND category = 'purchase' AND description LIKE '%Bhassi%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-02', 'payment', 1500, 'purchase', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Bhassi (Stone chips) - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-02' AND type = 'payment' AND amount = 1500 AND category = 'purchase' AND description LIKE '%Bhassi%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-03', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~2.22 liters @ ₹90/liter) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-03' AND type = 'payment' AND amount = 200 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-05', 'payment', 11000, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-05' AND type = 'payment' AND amount = 11000 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-07', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~2.22 liters @ ₹90/liter) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-07' AND type = 'payment' AND amount = 200 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-09', 'payment', 3900, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-09' AND type = 'payment' AND amount = 3900 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-18', 'payment', 3900, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-18' AND type = 'payment' AND amount = 3900 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-22', 'payment', 100, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~1.11 liters @ ₹90/liter) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-22' AND type = 'payment' AND amount = 100 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-30', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-11-30' AND type = 'payment' AND amount = 3800 AND category = 'purchase');

-- ============================================================
-- DECEMBER 2025 - WAGE ENTRIES (9 entries - Total: ₹30,345)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-02', 'payment', 400, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-02' AND type = 'payment' AND amount = 400 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-03', 'payment', 2800, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-03' AND type = 'payment' AND amount = 2800 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-06', 'payment', 1545, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-06' AND type = 'payment' AND amount = 1545 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-10', 'payment', 9200, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-10' AND type = 'payment' AND amount = 9200 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-13', 'payment', 8700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-13' AND type = 'payment' AND amount = 8700 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-17', 'payment', 1800, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-17' AND type = 'payment' AND amount = 1800 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-19', 'payment', 4500, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-19' AND type = 'payment' AND amount = 4500 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-23', 'payment', 1200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-23' AND type = 'payment' AND amount = 1200 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-31', 'payment', 200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-31' AND type = 'payment' AND amount = 200 AND category = 'wage');

-- ============================================================
-- DECEMBER 2025 - MATERIAL PURCHASES (5 entries - Total: ₹22,015)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-04', 'payment', 17390, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Cement (55 bags @ ₹316) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-04' AND type = 'payment' AND amount = 17390 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-05', 'payment', 315, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sariya (steel) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-05' AND type = 'payment' AND amount = 315 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-07', 'payment', 3110, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sariya (steel) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-07' AND type = 'payment' AND amount = 3110 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-10', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-10' AND type = 'payment' AND amount = 200 AND category = 'purchase');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-12-28', 'payment', 1000, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2025-12-28' AND type = 'payment' AND amount = 1000 AND category = 'purchase');

-- ============================================================
-- JANUARY 2026 - MATERIAL PURCHASES (5 entries - Total: ₹14,200)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-01', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sand (68 cuft @ ₹55.88) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-01' AND type = 'payment' AND amount = 3800 AND category = 'purchase' AND description LIKE '%Sand%' AND description NOT LIKE '%White%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-01', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Gitti/Aggregates (68 cuft @ ₹55.88) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-01' AND type = 'payment' AND amount = 3800 AND category = 'purchase' AND description LIKE '%Gitti%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-01', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Full trolley - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-01' AND type = 'payment' AND amount = 2200 AND category = 'purchase' AND description LIKE '%White Sand%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-07', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-07' AND type = 'payment' AND amount = 2200 AND category = 'purchase' AND description LIKE '%White Sand%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 2200 AND category = 'purchase' AND description LIKE '%White Sand%');

-- ============================================================
-- JANUARY 2026 - WAGE ENTRIES (31 entries - Total: ₹44,466)
-- ============================================================

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-02', 'payment', 2600, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day ₹400 + Half Day ₹200 + Outdoor ₹450) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-02' AND type = 'payment' AND amount = 2600 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-02', 'payment', 2700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Full Day + Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-02' AND type = 'payment' AND amount = 2700 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-02', 'payment', 2700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Full Day + Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-02' AND type = 'payment' AND amount = 2700 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-04' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Moti%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-04' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-04' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-07', 'payment', 1050, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day + Half Day + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-07' AND type = 'payment' AND amount = 1050 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-07', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-07' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-07', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-07' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-09' AND type = 'payment' AND amount = 900 AND category = 'wage' AND description LIKE '%Moti%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-09' AND type = 'payment' AND amount = 900 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-09' AND type = 'payment' AND amount = 900 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-12', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Full Day + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-12' AND type = 'payment' AND amount = 900 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-13', 'payment', 250, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-13' AND type = 'payment' AND amount = 250 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-14' AND type = 'payment' AND amount = 400 AND category = 'wage' AND description LIKE '%Moti%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Full Day) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-14' AND type = 'payment' AND amount = 400 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-14', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-14' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Full Day) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-14' AND type = 'payment' AND amount = 400 AND category = 'wage' AND description LIKE '%Pradeep Saroj%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Atul Maurya (Full Day) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-14' AND type = 'payment' AND amount = 400 AND category = 'wage' AND description LIKE '%Atul%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 650, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Half Day + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 650 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Pradeep Saroj%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Atul Maurya (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-15' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Atul%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-17', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-17' AND type = 'payment' AND amount = 900 AND category = 'wage' AND description LIKE '%Moti%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-17', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-17' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Pappu%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-17', 'payment', 2266, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-17' AND type = 'payment' AND amount = 2266 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-20', 'payment', 850, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Full Day) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-20' AND type = 'payment' AND amount = 850 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-20', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-20' AND type = 'payment' AND amount = 450 AND category = 'wage' AND description LIKE '%Vipin%');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-20', 'payment', 4000, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-20' AND type = 'payment' AND amount = 4000 AND category = 'wage');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2026-01-27', 'payment', 9000, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)'
WHERE NOT EXISTS (SELECT 1 FROM firm_cash_ledger WHERE date = '2026-01-27' AND type = 'payment' AND amount = 9000 AND category = 'wage');

-- ============================================================
-- AFTER STATUS & VERIFICATION
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '==== AFTER INSERTING NEW ENTRIES ====';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total entries now: %', (SELECT COUNT(*) FROM firm_cash_ledger);
    RAISE NOTICE 'November 2025: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-11-01' AND date <= '2025-11-30');
    RAISE NOTICE 'December 2025: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-12-01' AND date <= '2025-12-31');
    RAISE NOTICE 'January 2026: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2026-01-01' AND date <= '2026-01-31');
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Expected counts if all entries added:';
    RAISE NOTICE '- November 2025: 21 entries (9 wages + 9 purchases + 3 operational)';
    RAISE NOTICE '- December 2025: 15 entries (9 wages + 5 purchases + 1 operational)';
    RAISE NOTICE '- January 2026: 40 entries (31 wages + 5 purchases + 2 operational + 2 sales)';
    RAISE NOTICE '========================================';
END $$;

-- Detailed verification query
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    category,
    type,
    COUNT(*) as entries,
    SUM(amount) as total
FROM firm_cash_ledger
GROUP BY TO_CHAR(date, 'YYYY-MM'), category, type
ORDER BY month, category, type;
