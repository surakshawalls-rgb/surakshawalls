-- ============================================================
-- FIX: ADD MISSING FIRM_CASH_LEDGER ENTRIES (DUPLICATE-SAFE)
-- Generated: February 15, 2026
-- Purpose: Add wage and purchase entries to firm_cash_ledger
-- ============================================================
-- INSTRUCTIONS:
-- Run this AFTER executing the November, December, and January SQL files
-- This script is DUPLICATE-SAFE - it will only insert entries that don't already exist
-- You can run it multiple times without creating duplicates
-- ============================================================

-- ============================================================
-- SAFETY CHECK: Count existing entries
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT FIRM CASH LEDGER STATUS ===';
    RAISE NOTICE 'Existing entries: %', (SELECT COUNT(*) FROM firm_cash_ledger);
    RAISE NOTICE 'November 2025 entries: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-11-01' AND date <= '2025-11-30');
    RAISE NOTICE 'December 2025 entries: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2025-12-01' AND date <= '2025-12-31');
    RAISE NOTICE 'January 2026 entries: %', (SELECT COUNT(*) FROM firm_cash_ledger WHERE date >= '2026-01-01' AND date <= '2026-01-31');
    RAISE NOTICE '========================================';
END $$;

-- ============================================================
-- NOVEMBER 2025 - FIRM CASH LEDGER ENTRIES
-- ============================================================

-- NOVEMBER WAGE ENTRIES (9 entries - Total: ₹17,600)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-01', 'payment', 300, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-01' AND type = 'payment' AND amount = 300 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-05', 'payment', 700, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-05' AND type = 'payment' AND amount = 700 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-10', 'payment', 200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-10' AND type = 'payment' AND amount = 200 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-14', 'payment', 2000, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-14' AND type = 'payment' AND amount = 2000 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-15', 'payment', 1200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-15' AND type = 'payment' AND amount = 1200 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-17', 'payment', 2000, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-17' AND type = 'payment' AND amount = 2000 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-23', 'payment', 4500, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-23' AND type = 'payment' AND amount = 4500 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-30', 'payment', 4200, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-30' AND type = 'payment' AND amount = 4200 AND category = 'wage'
);

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
SELECT '2025-11-30', 'payment', 2500, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep) - Second payment'
WHERE NOT EXISTS (
    SELECT 1 FROM firm_cash_ledger 
    WHERE date = '2025-11-30' AND type = 'payment' AND amount = 2500 AND category = 'wage' AND description LIKE '%Second payment%'
);

-- NOVEMBER MATERIAL PURCHASES (9 entries - Total: ₹26,100)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-01', 'payment', 1500, 'purchase', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Bhassi (Stone chips) - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-02', 'payment', 1500, 'purchase', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Bhassi (Stone chips) - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-03', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~2.22 liters @ ₹90/liter) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-05', 'payment', 11000, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General materials - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-07', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~2.22 liters @ ₹90/liter) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-09', 'payment', 3900, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-18', 'payment', 3900, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-22', 'payment', 100, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Diesel (~1.11 liters @ ₹90/liter) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-11-30', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)');

-- ============================================================
-- DECEMBER 2025 - FIRM CASH LEDGER ENTRIES
-- ============================================================

-- DECEMBER WAGE ENTRIES (9 entries - Total: ₹30,345)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-02', 'payment', 400, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-03', 'payment', 2800, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-06', 'payment', 1545, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-10', 'payment', 9200, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-13', 'payment', 8700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Labour wage - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-17', 'payment', 1800, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-19', 'payment', 4500, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-23', 'payment', 1200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-31', 'payment', 200, 'wage', 'f5863aa5-8349-4a4c-952f-cda3af6a3c1a', false, 'Labour wage - Paid by firm (Praveen)');

-- DECEMBER MATERIAL PURCHASES (5 entries - Total: ₹22,015)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-04', 'payment', 17390, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Cement (55 bags @ ₹316) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-05', 'payment', 315, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sariya (steel) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-07', 'payment', 3110, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sariya (steel) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-10', 'payment', 200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2025-12-28', 'payment', 1000, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Materials - Paid by firm (Pradeep)');

-- ============================================================
-- JANUARY 2026 - FIRM CASH LEDGER ENTRIES
-- ============================================================

-- JANUARY MATERIAL PURCHASES (Only office_cash purchases - 5 entries)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-01', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Sand (68 cuft @ ₹55.88) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-01', 'payment', 3800, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Gitti/Aggregates (68 cuft @ ₹55.88) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-01', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Full trolley - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-07', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 2200, 'purchase', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'White Sand (68 cuft @ ₹32.35) - Paid by firm (Pradeep)');

-- JANUARY WAGE ENTRIES (31 entries - Total: ₹44,466)
INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-02', 'payment', 2600, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day ₹400 + Half Day ₹200 + Outdoor ₹450) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-02', 'payment', 2700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Full Day + Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-02', 'payment', 2700, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Full Day + Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-04', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-07', 'payment', 1050, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day + Half Day + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-07', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-07', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-09', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-12', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Full Day + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-13', 'payment', 250, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Full Day) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Full Day) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-14', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Full Day) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-14', 'payment', 400, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Atul Maurya (Full Day) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 650, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Half Day + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pradeep Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-15', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Atul Maurya (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-17', 'payment', 900, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-17', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Pappu Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-17', 'payment', 2266, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-20', 'payment', 850, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Moti Maurya (Outdoor + Full Day) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-20', 'payment', 450, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'Vipin Saroj (Outdoor) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-20', 'payment', 4000, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)');

INSERT INTO firm_cash_ledger (date, type, amount, category, partner_id, deposited_to_firm, description)
VALUES ('2026-01-27', 'payment', 9000, 'wage', 'f1d5c3d4-24f5-40a5-8afc-9fa02c9fc00d', false, 'General Labour (Custom) - Paid by firm (Pradeep)');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check total firm cash ledger entries
SELECT 
    COUNT(*) as total_entries,
    SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'receipt' THEN amount ELSE -amount END) as net_balance
FROM firm_cash_ledger;

-- Check by category
SELECT 
    category,
    type,
    COUNT(*) as entry_count,
    SUM(amount) as total_amount
FROM firm_cash_ledger
GROUP BY category, type
ORDER BY category, type;

-- Check by month
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    category,
    type,
    COUNT(*) as entries,
    SUM(amount) as total
FROM firm_cash_ledger
GROUP BY TO_CHAR(date, 'YYYY-MM'), category, type
ORDER BY month, category;

-- ============================================================
-- EXPECTED RESULTS AFTER RUNNING THIS FILE:
-- ============================================================
/*
NOVEMBER 2025:
- Wages: 9 entries, ₹17,600
- Purchases: 9 entries, ₹26,100
- Operational: 3 entries, ₹900
- Total: 21 entries, ₹44,600 expenses

DECEMBER 2025:
- Wages: 9 entries, ₹30,345
- Purchases: 5 entries, ₹22,015
- Operational: 1 entry, ₹970
- Total: 15 entries, ₹53,330 expenses

JANUARY 2026:
- Wages: 31 entries, ₹44,466
- Purchases: 5 entries, ₹14,200
- Operational: 2 entries, ₹550
- Sales: 2 entries, ₹11,000 income
- Total: 40 entries, ₹48,216 net expenses

GRAND TOTAL: 76 entries, ₹135,146 net expenses, ₹11,000 income
*/
