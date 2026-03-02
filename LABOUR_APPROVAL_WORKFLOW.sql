-- =====================================================
-- LABOUR STAFF APPROVAL WORKFLOW - DATABASE SETUP
-- =====================================================
-- This creates a pending approval system where labour staff
-- submissions require admin approval before entering main tables
-- =====================================================

-- Create pending_daily_entries table
CREATE TABLE IF NOT EXISTS public.pending_daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Submission Details
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_name TEXT NOT NULL, -- Store submitter name for easy display
  entry_date DATE NOT NULL,
  
  -- Entry Data (stored as JSONB)
  production_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  labor_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  
  -- Approval Workflow
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: 'pending' | 'approved' | 'rejected'
  
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT reviewed_fields_check CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_entries_status ON public.pending_daily_entries(status);
CREATE INDEX IF NOT EXISTS idx_pending_entries_submitted_by ON public.pending_daily_entries(submitted_by);
CREATE INDEX IF NOT EXISTS idx_pending_entries_entry_date ON public.pending_daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_pending_entries_created_at ON public.pending_daily_entries(created_at DESC);

-- Add comment
COMMENT ON TABLE public.pending_daily_entries IS 'Labour staff daily entries pending admin approval';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.pending_daily_entries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Labour staff can view their own submissions
CREATE POLICY "Labour staff can view own submissions"
ON public.pending_daily_entries
FOR SELECT
USING (
  auth.uid() = submitted_by OR
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('su', 'admin')
);

-- Policy 2: Labour staff can insert their own entries
CREATE POLICY "Labour staff can create entries"
ON public.pending_daily_entries
FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'labour_staff'
);

-- Policy 3: Admin can update status (approve/reject)
CREATE POLICY "Admin can review entries"
ON public.pending_daily_entries
FOR UPDATE
USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('su', 'admin')
)
WITH CHECK (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('su', 'admin')
);

-- Policy 4: Admin can delete entries
CREATE POLICY "Admin can delete entries"
ON public.pending_daily_entries
FOR DELETE
USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('su', 'admin')
);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_pending_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pending_entries_updated_at
BEFORE UPDATE ON public.pending_daily_entries
FOR EACH ROW
EXECUTE FUNCTION update_pending_entries_updated_at();

-- =====================================================
-- STORED PROCEDURE: Approve Entry
-- =====================================================
-- This function handles the approval logic atomically

CREATE OR REPLACE FUNCTION approve_pending_entry(
  p_entry_id UUID,
  p_reviewed_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_entry RECORD;
  v_production_item JSONB;
  v_labor_item JSONB;
  v_prod_id UUID;
  v_labor_id UUID;
  v_result JSONB;
BEGIN
  -- Get the pending entry
  SELECT * INTO v_entry
  FROM public.pending_daily_entries
  WHERE id = p_entry_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found or already processed');
  END IF;
  
  -- Insert production data
  FOR v_production_item IN SELECT * FROM jsonb_array_elements(v_entry.production_data)
  LOOP
    INSERT INTO public.daily_production (
      date, product_name, quantity, unit, 
      cement_used, sand_used, aggregate_10mm_used, aggregate_20mm_used,
      total_cost, total_cost_with_labor, created_by
    ) VALUES (
      v_entry.entry_date,
      v_production_item->>'product_name',
      (v_production_item->>'quantity')::INTEGER,
      v_production_item->>'unit',
      (v_production_item->>'cement_used')::NUMERIC,
      (v_production_item->>'sand_used')::NUMERIC,
      (v_production_item->>'aggregate_10mm_used')::NUMERIC,
      (v_production_item->>'aggregate_20mm_used')::NUMERIC,
      (v_production_item->>'total_cost')::NUMERIC,
      (v_production_item->>'total_cost_with_labor')::NUMERIC,
      p_reviewed_by
    ) RETURNING id INTO v_prod_id;
  END LOOP;
  
  -- Insert labor data
  FOR v_labor_item IN SELECT * FROM jsonb_array_elements(v_entry.labor_data)
  LOOP
    INSERT INTO public.daily_labour (
      date, worker_name, task_description, amount, payment_status, created_by
    ) VALUES (
      v_entry.entry_date,
      v_labor_item->>'worker_name',
      v_labor_item->>'task_description',
      (v_labor_item->>'amount')::NUMERIC,
      COALESCE(v_labor_item->>'payment_status', 'pending'),
      p_reviewed_by
    ) RETURNING id INTO v_labor_id;
  END LOOP;
  
  -- Update pending entry status
  UPDATE public.pending_daily_entries
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW()
  WHERE id = p_entry_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Entry approved and inserted successfully',
    'entry_date', v_entry.entry_date
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORED PROCEDURE: Reject Entry
-- =====================================================

CREATE OR REPLACE FUNCTION reject_pending_entry(
  p_entry_id UUID,
  p_reviewed_by UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- Update pending entry status
  UPDATE public.pending_daily_entries
  SET 
    status = 'rejected',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_entry_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found or already processed');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Entry rejected successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'pending_daily_entries';

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'pending_daily_entries';

-- Count pending entries by status
SELECT status, COUNT(*) as count
FROM public.pending_daily_entries
GROUP BY status;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.pending_daily_entries TO authenticated;
GRANT UPDATE, DELETE ON public.pending_daily_entries TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION approve_pending_entry(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pending_entry(UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update Angular app: daily-entry.ts to use pending_daily_entries for labour_staff
-- 3. Create pending-approvals page for admins
-- =====================================================

-- =====================================================
-- MIGRATION: Add submitted_by_name column (if already created)
-- =====================================================
-- Run this if you already created the table without submitted_by_name

ALTER TABLE public.pending_daily_entries 
ADD COLUMN IF NOT EXISTS submitted_by_name TEXT;

-- Update existing entries (if any) with submitter names
UPDATE public.pending_daily_entries
SET submitted_by_name = (
  SELECT raw_user_meta_data->>'full_name'
  FROM auth.users
  WHERE id = pending_daily_entries.submitted_by
)
WHERE submitted_by_name IS NULL;

-- Make column NOT NULL after populating
ALTER TABLE public.pending_daily_entries 
ALTER COLUMN submitted_by_name SET NOT NULL;

-- =====================================================
