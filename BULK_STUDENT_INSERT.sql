-- Bulk Student Insert for Library Management System
-- This script will insert all students from the spreadsheet
-- Make sure to backup your data before running this script

-- Clear existing students (OPTIONAL - Remove comment if you want to delete all first)
-- DELETE FROM library_students;

-- Insert all students
INSERT INTO library_students (name, mobile, emergency_contact, emergency_contact_name, address, dob, gender, joining_date, registration_fee_paid, status, notes) VALUES
('Richa Pandey', '7355281233', NULL, NULL, 'Mahjuda', NULL, 'Female', '2026-02-08', 0, 'active', NULL),
('Nisha pandey', '7355281233', NULL, NULL, 'Mahjuda', NULL, 'Female', '2026-02-10', 0, 'active', NULL),
('Anjali mishra', '7388955314', NULL, NULL, 'Shukulpur', NULL, 'Female', '2026-02-06', 0, 'active', 'Fee will be taken by Praveen'),
('Nidhi pal', '9797626278', NULL, NULL, 'Pakarikala', NULL, 'Female', '2026-02-09', 0, 'active', NULL),
('Pooja tiwari', '9137503536', '8090272727', NULL, 'Mahjuda', NULL, 'Female', '2026-01-03', 0, 'active', NULL),
('Mo. Sahil', '9839169192', NULL, NULL, 'Pakarikala', NULL, 'Male', '2026-01-27', 0, 'active', NULL),
('Nishchay pandey', '9569985811', NULL, NULL, 'Bhori', NULL, 'Male', '2026-01-13', 0, 'active', NULL),
('Satyam saroj', '9307991422', NULL, NULL, 'Bhikharirampur', NULL, 'Male', '2026-01-12', 0, 'active', '2 month fee pending'),
('Mithilesh kumar', '8090272727', NULL, NULL, 'Mahjuda', NULL, 'Female', '2026-01-05', 0, 'active', NULL),
('Bajarangi', '9670129325', NULL, NULL, 'Vishnupur', NULL, 'Male', '2026-01-03', 0, 'active', NULL),
('Suraj kumar', '7355698990', NULL, NULL, 'Bhori mahjuda', NULL, 'Male', '2026-01-31', 0, 'active', NULL),
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

-- Verify the insert
SELECT COUNT(*) as total_students FROM library_students;
SELECT * FROM library_students ORDER BY joining_date DESC;
