-- Library Complaints System
-- Allows students to lodge complaints about disturbances

CREATE TABLE IF NOT EXISTS library_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_against_seat_no INTEGER NOT NULL,
  complaint_type VARCHAR(100) NOT NULL, -- 'Noise', 'Phone Call', 'Disturbing Others', 'Other'
  description TEXT,
  lodged_by_name VARCHAR(255), -- Optional: student who lodged complaint
  lodged_by_seat_no INTEGER, -- Optional: seat of complainer
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX idx_complaints_seat_no ON library_complaints(complaint_against_seat_no);
CREATE INDEX idx_complaints_status ON library_complaints(status);
CREATE INDEX idx_complaints_created_at ON library_complaints(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE library_complaints ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert complaints (anonymous complaints allowed)
CREATE POLICY "Anyone can lodge complaints"
  ON library_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only admins can view complaints
CREATE POLICY "Only admins can view complaints"
  ON library_complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can update complaints (resolve/dismiss)
CREATE POLICY "Only admins can update complaints"
  ON library_complaints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add some sample complaint types for reference
COMMENT ON COLUMN library_complaints.complaint_type IS 'Types: Making Noise, Talking on Phone, Disturbing Others, Not Following Rules, Other';

-- Create a view for admin dashboard with student details
CREATE OR REPLACE VIEW library_complaints_with_details AS
SELECT 
  c.*,
  s.name as student_name,
  s.mobile as student_phone,
  s.gender as student_gender
FROM library_complaints c
LEFT JOIN library_seats ls ON ls.seat_no = c.complaint_against_seat_no
LEFT JOIN library_students s ON (
  (ls.full_time_student_id = s.id) OR
  (ls.first_half_student_id = s.id) OR
  (ls.second_half_student_id = s.id)
)
ORDER BY c.created_at DESC;

COMMENT ON VIEW library_complaints_with_details IS 'Admin view showing complaints with student details';
