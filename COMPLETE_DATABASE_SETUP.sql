-- COMPLETE DATABASE SETUP FOR LIBRARY MANAGEMENT
-- This includes students AND their seat assignments with expiry dates
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Clear existing data
-- =====================================================
DELETE FROM library_attendance;
DELETE FROM library_fee_payments;
UPDATE library_seats SET 
    full_time_student_id = NULL,
    full_time_expiry = NULL,
    first_half_student_id = NULL,
    first_half_expiry = NULL,
    second_half_student_id = NULL,
    second_half_expiry = NULL;
DELETE FROM library_students;

-- =====================================================
-- STEP 2: Insert all students
-- =====================================================
INSERT INTO library_students (name, mobile, emergency_contact, emergency_contact_name, address, dob, gender, joining_date, registration_fee_paid, status, notes) VALUES
('Richa Pandey', '+917355281233', '7355281233', NULL, 'Mahjuda', NULL, 'Female', '2026-02-08', 0, 'active', NULL),
('Nisha pandey', '7355281233', '7355281233', NULL, 'Mahjuda', NULL, 'Female', '2026-02-10', 0, 'active', NULL),
('Anjali mishra', '7388955314', '7388955314', NULL, 'Shukulpur', NULL, 'Female', '2026-02-06', 0, 'active', 'Fee will be taken by Praveen'),
('Nidhi pal', '9797626278', '9797626278', NULL, 'Pakarikala', NULL, 'Female', '2026-02-09', 0, 'active', NULL),
('Pooja tiwari', '9137503536', '8090272727', NULL, 'Mahjuda', NULL, 'Female', '2026-01-03', 0, 'active', NULL),
('Mo. Sahil', '9839169192', '9839169192', NULL, 'Pakarikala', NULL, 'Male', '2026-01-27', 0, 'active', NULL),
('Nishchay pandey', '9569985811', '9569985811', NULL, 'Bhori', NULL, 'Male', '2026-01-13', 0, 'active', NULL),
('Satyam saroj', '9307991422', '9307991422', NULL, 'Bhikharirampur', NULL, 'Male', '2026-01-12', 0, 'active', '2 month fee pending'),
('Mithilesh kumar', '8090272727', '8090272727', NULL, 'Mahjuda', NULL, 'Female', '2026-01-05', 0, 'active', NULL),
('Bajarangi', '9670129325', '9670129325', NULL, 'Vishnupur', NULL, 'Male', '2026-01-03', 0, 'active', NULL),
('Suraj kumar', '7355698990', '7355698990', NULL, 'Bhori mahjuda', NULL, 'Male', '2026-01-31', 0, 'active', NULL),
('Nageshwar Saroj', '6392978653', '8090272727', NULL, 'Bhikharirampur', NULL, 'Male', '2026-02-11', 0, 'active', NULL),
('Vijay Saroj', '9208340542', '8090272727', NULL, 'Bhikharirampur', NULL, 'Male', '2026-01-12', 0, 'active', '2nd month fee pending'),
('Himanshu Vishwakarma', '6386413634', '8090272727', NULL, 'Vari', NULL, 'Male', '2026-02-11', 100, 'active', NULL),
('Himanshu Yadav', '9621607311', '8090272727', NULL, 'Vari', NULL, 'Male', '2026-02-11', 0, 'active', '2nd month fee pending'),
('Pawan Vishwakarma', '7571941721', '8090272727', NULL, 'Bhakharirampur', NULL, 'Male', '2026-02-11', 0, 'active', '2nd month fee pending'),
('Prince Tiwari', '6393937306', '8090272727', NULL, 'Mahjuda', NULL, 'Male', '2026-02-11', 0, 'active', '2 month payment dn'),
('Hari om Shukla', '8052682719', '8090272727', NULL, 'Shukulpur', NULL, 'Male', '2026-02-11', 0, 'active', 'his payment is taken by praveen'),
('vijay saini', '9235405018', '8090272727', NULL, 'Bhori', NULL, 'Male', '2026-02-11', 0, 'active', NULL),
('Shubham Kannnaujiya', '6386520940', '8090272727', NULL, 'Mahjuda', NULL, 'Male', '2026-02-11', 0, 'active', '2nd month fee pending'),
('Yancy Pal', '6370046536', '8090272727', NULL, 'Mahjuda Bajar', NULL, 'Female', '2026-02-11', 0, 'active', 'fee paid'),
('Sivani Jaishwar', '9519170987', '8090272727', NULL, 'Shukulpur Baharaichi', NULL, 'Female', '2026-02-06', 0, 'active', 'fee is pending'),
('Akshi Singh', '9277287699', '8090272727', NULL, 'Mahjuda Bajar', NULL, 'Female', '2026-02-11', 0, 'active', 'Fee is Pending'),
('Nikita pandey', '9336850097', '8090272727', 'Bharat pandey', 'Bhori mahjuda', '2003-07-16', 'Female', '2026-01-01', 100, 'active', 'Manager');

-- =====================================================
-- STEP 3: Update seat assignments based on spreadsheet
-- =====================================================

-- Seat 36 - Richa Pandey (Morning)
UPDATE library_seats 
SET first_half_student_id = (SELECT id FROM library_students WHERE name = 'Richa Pandey' AND mobile = '7355281233'),
    first_half_expiry = '2026-03-07'
WHERE seat_no = 36;

-- Seat 35 - Nisha pandey (Morning)
UPDATE library_seats 
SET first_half_student_id = (SELECT id FROM library_students WHERE name = 'Nisha pandey' AND mobile = '7355281233'),
    first_half_expiry = '2026-03-15'
WHERE seat_no = 35;

-- Seat 34 - Anjali mishra (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Anjali mishra'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 34;

-- Seat 33 - Nidhi pal (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Nidhi pal'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 33;

-- Seat 29 - Pooja tiwari (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Pooja tiwari'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 29;

-- Seat 28 - Mo. Sahil (Evening)
UPDATE library_seats 
SET second_half_student_id = (SELECT id FROM library_students WHERE name = 'Mo. Sahil'),
    second_half_expiry = '2026-03-15'
WHERE seat_no = 28;

-- Seat 26 - Nishchay pandey (Evening)
UPDATE library_seats 
SET second_half_student_id = (SELECT id FROM library_students WHERE name = 'Nishchay pandey'),
    second_half_expiry = '2026-03-15'
WHERE seat_no = 26;

-- Seat 22 - Satyam saroj (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Satyam saroj'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 22;

-- Seat 21 - Mithilesh kumar (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Mithilesh kumar'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 21;

-- Seat 16 - Bajarangi (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Bajarangi'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 16;

-- Seat 8 - Suraj kumar (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Suraj kumar'),
    full_time_expiry = '2026-03-15'
WHERE seat_no = 8;

-- Seat 20 - Nageshwar Saroj (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Nageshwar Saroj'),
    full_time_expiry = '2026-03-12'
WHERE seat_no = 20;

-- Seat 19 - Vijay Saroj (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Vijay Saroj'),
    full_time_expiry = '2026-03-12'
WHERE seat_no = 19;

-- Seat 18 - Himanshu Vishwakarma (Evening)
UPDATE library_seats 
SET second_half_student_id = (SELECT id FROM library_students WHERE name = 'Himanshu Vishwakarma'),
    second_half_expiry = '2026-03-03'
WHERE seat_no = 18;

-- Seat 13 - Himanshu Yadav (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Himanshu Yadav'),
    full_time_expiry = '2026-03-04'
WHERE seat_no = 13;

-- Seat 14 - Pawan Vishwakarma (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Pawan Vishwakarma'),
    full_time_expiry = '2026-03-05'
WHERE seat_no = 14;

-- Seat 11 - Prince Tiwari (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Prince Tiwari'),
    full_time_expiry = '2026-03-04'
WHERE seat_no = 11;

-- Seat 7 - Hari om Shukla (Evening)
UPDATE library_seats 
SET second_half_student_id = (SELECT id FROM library_students WHERE name = 'Hari om Shukla'),
    second_half_expiry = '2026-03-06'
WHERE seat_no = 7;

-- Seat 5 - vijay saini (Evening)
UPDATE library_seats 
SET second_half_student_id = (SELECT id FROM library_students WHERE name = 'vijay saini'),
    second_half_expiry = '2026-02-14'
WHERE seat_no = 5;

-- Seat 4 - Shubham Kannnaujiya (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Shubham Kannnaujiya'),
    full_time_expiry = '2026-03-13'
WHERE seat_no = 4;

-- Seat 3 - Yancy Pal (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Yancy Pal'),
    full_time_expiry = '2026-03-13'
WHERE seat_no = 3;

-- Seat 2 - Sivani Jaishwar (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Sivani Jaishwar'),
    full_time_expiry = '2026-03-13'
WHERE seat_no = 2;

-- Seat 1 - Akshi Singh (Morning)
UPDATE library_seats 
SET first_half_student_id = (SELECT id FROM library_students WHERE name = 'Akshi Singh'),
    first_half_expiry = '2026-03-13'
WHERE seat_no = 1;

-- Seat 32 - Nikita pandey (Full Time)
UPDATE library_seats 
SET full_time_student_id = (SELECT id FROM library_students WHERE name = 'Nikita pandey'),
    full_time_expiry = '2026-03-12'
WHERE seat_no = 32;

-- =====================================================
-- STEP 4: Verify the data
-- =====================================================
SELECT COUNT(*) as total_students FROM library_students;
SELECT COUNT(*) as occupied_seats FROM library_seats 
WHERE full_time_student_id IS NOT NULL 
   OR first_half_student_id IS NOT NULL 
   OR second_half_student_id IS NOT NULL;

-- Show all assigned seats
SELECT 
    s.seat_no,
    CASE 
        WHEN s.full_time_student_id IS NOT NULL THEN st1.name || ' (Full Time)'
        WHEN s.first_half_student_id IS NOT NULL THEN st2.name || ' (Morning)'
        WHEN s.second_half_student_id IS NOT NULL THEN st3.name || ' (Evening)'
    END as student_info,
    COALESCE(s.full_time_expiry, s.first_half_expiry, s.second_half_expiry) as expiry_date
FROM library_seats s
LEFT JOIN library_students st1 ON s.full_time_student_id = st1.id
LEFT JOIN library_students st2 ON s.first_half_student_id = st2.id
LEFT JOIN library_students st3 ON s.second_half_student_id = st3.id
WHERE s.full_time_student_id IS NOT NULL 
   OR s.first_half_student_id IS NOT NULL 
   OR s.second_half_student_id IS NOT NULL
ORDER BY s.seat_no;
