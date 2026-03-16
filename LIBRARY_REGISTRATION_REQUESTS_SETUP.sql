-- =====================================================
-- LIBRARY PUBLIC REGISTRATION REQUESTS - DATABASE SETUP
-- =====================================================
-- Purpose:
-- 1. Allow public students to submit membership requests
-- 2. Route requests to admin / librarian for approval
-- 3. Assign seat only after manual payment verification
-- =====================================================

CREATE TABLE IF NOT EXISTS public.library_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Applicant details
  name TEXT NOT NULL,
  mobile VARCHAR(10) NOT NULL,
  emergency_contact VARCHAR(10),
  emergency_contact_name TEXT,
  address TEXT NOT NULL,
  dob DATE,
  gender VARCHAR(10) DEFAULT 'Male',

  -- Requested membership details
  requested_start_date DATE NOT NULL,
  requested_end_date DATE NOT NULL,
  requested_shift_type TEXT NOT NULL,
  registration_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  seat_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,

  -- Review / approval workflow
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_seat_no INTEGER,
  approved_student_id UUID REFERENCES public.library_students(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  payment_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_reference TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT library_registration_requests_mobile_check
    CHECK (mobile ~ '^[0-9]{10}$'),
  CONSTRAINT library_registration_requests_emergency_check
    CHECK (emergency_contact IS NULL OR emergency_contact = '' OR emergency_contact ~ '^[0-9]{10}$'),
  CONSTRAINT library_registration_requests_shift_check
    CHECK (requested_shift_type IN ('full_time', 'first_half', 'second_half')),
  CONSTRAINT library_registration_requests_payment_mode_check
    CHECK (payment_mode IN ('cash', 'upi', 'card', 'other')),
  CONSTRAINT library_registration_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT library_registration_requests_reviewed_check
    CHECK (
      (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
      (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_library_registration_requests_status
  ON public.library_registration_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_library_registration_requests_created_at
  ON public.library_registration_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_library_registration_requests_mobile
  ON public.library_registration_requests(mobile);

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_registration_requests_pending_mobile
  ON public.library_registration_requests(mobile)
  WHERE status = 'pending';

COMMENT ON TABLE public.library_registration_requests IS 'Public library membership requests pending admin/librarian approval';

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_library_registration_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_library_registration_requests_updated_at ON public.library_registration_requests;

CREATE TRIGGER set_library_registration_requests_updated_at
BEFORE UPDATE ON public.library_registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_library_registration_requests_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.library_registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create library registration requests" ON public.library_registration_requests;
CREATE POLICY "Public can create library registration requests"
ON public.library_registration_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND assigned_seat_no IS NULL
  AND approved_student_id IS NULL
  AND payment_verified = FALSE
);

DROP POLICY IF EXISTS "Library managers can view library registration requests" ON public.library_registration_requests;
CREATE POLICY "Library managers can view library registration requests"
ON public.library_registration_requests
FOR SELECT
TO authenticated
USING (
  COALESCE(((auth.jwt()->'user_metadata')->>'role')::text, '') IN ('su', 'admin', 'editor', 'library_manager')
);

DROP POLICY IF EXISTS "Library managers can update library registration requests" ON public.library_registration_requests;
CREATE POLICY "Library managers can update library registration requests"
ON public.library_registration_requests
FOR UPDATE
TO authenticated
USING (
  COALESCE(((auth.jwt()->'user_metadata')->>'role')::text, '') IN ('su', 'admin', 'editor', 'library_manager')
)
WITH CHECK (
  COALESCE(((auth.jwt()->'user_metadata')->>'role')::text, '') IN ('su', 'admin', 'editor', 'library_manager')
);

DROP POLICY IF EXISTS "Library managers can delete library registration requests" ON public.library_registration_requests;
CREATE POLICY "Library managers can delete library registration requests"
ON public.library_registration_requests
FOR DELETE
TO authenticated
USING (
  COALESCE(((auth.jwt()->'user_metadata')->>'role')::text, '') IN ('su', 'admin', 'editor', 'library_manager')
);

-- =====================================================
-- APPROVAL FUNCTION (ATOMIC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_library_registration_request(
  p_request_id UUID,
  p_seat_no INTEGER,
  p_reviewed_by UUID,
  p_registration_fee_amount NUMERIC DEFAULT NULL,
  p_seat_fee_amount NUMERIC DEFAULT NULL,
  p_payment_mode TEXT DEFAULT 'cash',
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.library_registration_requests%ROWTYPE;
  v_seat public.library_seats%ROWTYPE;
  v_student_id UUID;
  v_today DATE := CURRENT_DATE;
  v_registration_fee NUMERIC(10, 2);
  v_seat_fee NUMERIC(10, 2);
  v_payment_reference TEXT := NULLIF(BTRIM(COALESCE(p_payment_reference, '')), '');
  v_student_has_seat BOOLEAN := FALSE;
  v_registration_payment_id UUID;
  v_seat_payment_id UUID;
  v_requester_id UUID := auth.uid();
  v_requester_role TEXT := COALESCE(((auth.jwt()->'user_metadata')->>'role')::text, '');
  v_effective_reviewed_by UUID;
BEGIN
  IF v_requester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  IF v_requester_role NOT IN ('su', 'admin', 'editor', 'library_manager') THEN
    RETURN jsonb_build_object('success', false, 'error', 'You do not have permission to approve library registration requests');
  END IF;

  IF p_reviewed_by IS NOT NULL AND p_reviewed_by <> v_requester_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid reviewer context');
  END IF;

  v_effective_reviewed_by := v_requester_id;

  SELECT * INTO v_request
  FROM public.library_registration_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration request not found');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration request already reviewed');
  END IF;

  IF p_payment_mode NOT IN ('cash', 'upi', 'card', 'other') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment mode');
  END IF;

  SELECT * INTO v_seat
  FROM public.library_seats
  WHERE seat_no = p_seat_no
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected seat does not exist');
  END IF;

  IF v_request.requested_shift_type = 'full_time' THEN
    IF v_seat.full_time_student_id IS NOT NULL OR v_seat.first_half_student_id IS NOT NULL OR v_seat.second_half_student_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selected seat is no longer available for full day');
    END IF;
  ELSIF v_request.requested_shift_type = 'first_half' THEN
    IF v_seat.full_time_student_id IS NOT NULL OR v_seat.first_half_student_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selected seat is no longer available for morning shift');
    END IF;
  ELSIF v_request.requested_shift_type = 'second_half' THEN
    IF v_seat.full_time_student_id IS NOT NULL OR v_seat.second_half_student_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selected seat is no longer available for evening shift');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid requested shift type');
  END IF;

  SELECT id INTO v_student_id
  FROM public.library_students
  WHERE mobile = v_request.mobile
  LIMIT 1;

  IF v_student_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.library_seats
      WHERE full_time_student_id = v_student_id
         OR first_half_student_id = v_student_id
         OR second_half_student_id = v_student_id
    ) INTO v_student_has_seat;

    IF v_student_has_seat THEN
      RETURN jsonb_build_object('success', false, 'error', 'This mobile number already has an active seat assignment');
    END IF;
  END IF;

  v_registration_fee := COALESCE(p_registration_fee_amount, v_request.registration_fee_amount, 0);
  v_seat_fee := COALESCE(p_seat_fee_amount, v_request.seat_fee_amount, 0);

  IF v_student_id IS NULL THEN
    INSERT INTO public.library_students (
      name,
      mobile,
      emergency_contact,
      emergency_contact_name,
      address,
      dob,
      gender,
      joining_date,
      registration_fee_paid,
      status,
      notes
    ) VALUES (
      v_request.name,
      v_request.mobile,
      NULLIF(BTRIM(COALESCE(v_request.emergency_contact, '')), ''),
      NULLIF(BTRIM(COALESCE(v_request.emergency_contact_name, '')), ''),
      v_request.address,
      v_request.dob,
      COALESCE(v_request.gender, 'Male'),
      v_request.requested_start_date,
      GREATEST(v_registration_fee, 0),
      'active',
      v_request.notes
    )
    RETURNING id INTO v_student_id;
  ELSE
    UPDATE public.library_students
    SET
      name = v_request.name,
      emergency_contact = NULLIF(BTRIM(COALESCE(v_request.emergency_contact, '')), ''),
      emergency_contact_name = NULLIF(BTRIM(COALESCE(v_request.emergency_contact_name, '')), ''),
      address = v_request.address,
      dob = v_request.dob,
      gender = COALESCE(v_request.gender, 'Male'),
      joining_date = v_request.requested_start_date,
      status = 'active',
      notes = v_request.notes,
      registration_fee_paid = CASE
        WHEN v_registration_fee > 0 THEN GREATEST(COALESCE(registration_fee_paid, 0), v_registration_fee)
        ELSE COALESCE(registration_fee_paid, 0)
      END,
      updated_at = NOW()
    WHERE id = v_student_id;
  END IF;

  IF v_registration_fee > 0 THEN
    INSERT INTO public.library_fee_payments (
      student_id,
      seat_no,
      shift_type,
      amount_paid,
      payment_date,
      valid_from,
      valid_until,
      payment_mode,
      transaction_reference,
      notes
    ) VALUES (
      v_student_id,
      p_seat_no,
      'registration',
      v_registration_fee,
      v_today,
      v_today,
      v_today,
      p_payment_mode,
      v_payment_reference,
      'Approved from public membership request'
    )
    RETURNING id INTO v_registration_payment_id;

    INSERT INTO public.library_cash_ledger (
      date,
      type,
      category,
      amount,
      description,
      payment_mode,
      reference_id
    ) VALUES (
      v_today,
      'income',
      'Registration Fee',
      v_registration_fee,
      'Public membership registration fee',
      p_payment_mode,
      v_registration_payment_id
    );
  END IF;

  INSERT INTO public.library_fee_payments (
    student_id,
    seat_no,
    shift_type,
    amount_paid,
    payment_date,
    valid_from,
    valid_until,
    payment_mode,
    transaction_reference,
    notes
  ) VALUES (
    v_student_id,
    p_seat_no,
    v_request.requested_shift_type,
    v_seat_fee,
    v_today,
    v_request.requested_start_date,
    v_request.requested_end_date,
    p_payment_mode,
    v_payment_reference,
    'Approved from public membership request'
  )
  RETURNING id INTO v_seat_payment_id;

  INSERT INTO public.library_cash_ledger (
    date,
    type,
    category,
    amount,
    description,
    payment_mode,
    reference_id
  ) VALUES (
    v_today,
    'income',
    'Seat Rental',
    v_seat_fee,
    'Public membership seat payment - Seat ' || p_seat_no,
    p_payment_mode,
    v_seat_payment_id
  );

  IF v_request.requested_shift_type = 'full_time' THEN
    UPDATE public.library_seats
    SET
      full_time_student_id = v_student_id,
      full_time_expiry = v_request.requested_end_date,
      first_half_student_id = NULL,
      first_half_expiry = NULL,
      second_half_student_id = NULL,
      second_half_expiry = NULL,
      updated_at = NOW()
    WHERE seat_no = p_seat_no;
  ELSIF v_request.requested_shift_type = 'first_half' THEN
    UPDATE public.library_seats
    SET
      full_time_student_id = NULL,
      full_time_expiry = NULL,
      first_half_student_id = v_student_id,
      first_half_expiry = v_request.requested_end_date,
      updated_at = NOW()
    WHERE seat_no = p_seat_no;
  ELSE
    UPDATE public.library_seats
    SET
      full_time_student_id = NULL,
      full_time_expiry = NULL,
      second_half_student_id = v_student_id,
      second_half_expiry = v_request.requested_end_date,
      updated_at = NOW()
    WHERE seat_no = p_seat_no;
  END IF;

  UPDATE public.library_registration_requests
  SET
    status = 'approved',
    assigned_seat_no = p_seat_no,
    approved_student_id = v_student_id,
    reviewed_by = v_effective_reviewed_by,
    reviewed_at = NOW(),
    rejection_reason = NULL,
    payment_verified = TRUE,
    payment_reference = v_payment_reference
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration request approved and seat assigned successfully',
    'student_id', v_student_id,
    'seat_no', p_seat_no
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_library_registration_request(
  UUID,
  INTEGER,
  UUID,
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT
) TO authenticated;
