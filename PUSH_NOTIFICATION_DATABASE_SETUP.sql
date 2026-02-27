-- ============================================================
-- PUSH NOTIFICATION DATABASE SETUP
-- ============================================================
-- This script creates:
-- 1. Table to store user FCM tokens
-- 2. Database triggers to send push notifications
-- 3. Functions to handle push notification logic
-- ============================================================

-- ============================================================
-- STEP 1: CREATE USER PUSH TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'android', -- 'android' or 'ios'
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = true;

-- ============================================================
-- STEP 2: CREATE PUSH NOTIFICATION QUEUE TABLE
-- ============================================================
-- This table stores pending push notifications before they're sent
CREATE TABLE IF NOT EXISTS push_notification_queue (
  id BIGSERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  target_users TEXT[], -- Array of user IDs to send to (empty = all users)
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_queue_status ON push_notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_push_queue_created ON push_notification_queue(created_at);

-- ============================================================
-- STEP 3: CREATE FUNCTION TO QUEUE PUSH NOTIFICATIONS
-- ============================================================
CREATE OR REPLACE FUNCTION queue_push_notification(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_target_users TEXT[] DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  notification_id BIGINT;
BEGIN
  INSERT INTO push_notification_queue (
    notification_type,
    title,
    body,
    data,
    target_users
  ) VALUES (
    p_type,
    p_title,
    p_body,
    p_data,
    p_target_users
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 4: CREATE TRIGGERS FOR DATABASE CHANGES
-- ============================================================

-- Trigger Function for Wage Entries
CREATE OR REPLACE FUNCTION notify_wage_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM queue_push_notification(
      'wage_entry',
      '💰 New Wage Entry',
      '₹' || NEW.paid_today || ' paid to worker',
      jsonb_build_object(
        'entry_id', NEW.id,
        'amount', NEW.paid_today,
        'type', 'wage_entry'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wage_entries
DROP TRIGGER IF EXISTS wage_entry_push_trigger ON wage_entries;
CREATE TRIGGER wage_entry_push_trigger
  AFTER INSERT ON wage_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_wage_entry();

-- Trigger Function for Firm Cash Ledger
CREATE OR REPLACE FUNCTION notify_firm_cash()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'receipt' THEN
      notification_title := '💵 Income Received';
      notification_body := '₹' || NEW.amount || ' - ' || COALESCE(NEW.description, 'Cash Receipt');
    ELSE
      notification_title := '💸 Expense Recorded';
      notification_body := '₹' || NEW.amount || ' - ' || COALESCE(NEW.description, 'Cash Payment');
    END IF;
    
    PERFORM queue_push_notification(
      'firm_cash',
      notification_title,
      notification_body,
      jsonb_build_object(
        'entry_id', NEW.id,
        'amount', NEW.amount,
        'type', NEW.type,
        'category', NEW.category
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for firm_cash_ledger
DROP TRIGGER IF EXISTS firm_cash_push_trigger ON firm_cash_ledger;
CREATE TRIGGER firm_cash_push_trigger
  AFTER INSERT ON firm_cash_ledger
  FOR EACH ROW
  EXECUTE FUNCTION notify_firm_cash();

-- Trigger Function for Material Purchase
CREATE OR REPLACE FUNCTION notify_material_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM queue_push_notification(
      'material_purchase',
      '🛒 Material Purchase',
      NEW.material_name || ' - ₹' || (NEW.quantity * NEW.unit_cost),
      jsonb_build_object(
        'entry_id', NEW.id,
        'material_name', NEW.material_name,
        'quantity', NEW.quantity,
        'amount', (NEW.quantity * NEW.unit_cost)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for raw_materials_purchase
DROP TRIGGER IF EXISTS material_purchase_push_trigger ON raw_materials_purchase;
CREATE TRIGGER material_purchase_push_trigger
  AFTER INSERT ON raw_materials_purchase
  FOR EACH ROW
  EXECUTE FUNCTION notify_material_purchase();

-- Trigger Function for Client Payment
CREATE OR REPLACE FUNCTION notify_client_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.paid_amount > 0 THEN
    PERFORM queue_push_notification(
      'client_payment',
      '💰 Client Payment',
      '₹' || NEW.paid_amount || ' received from client',
      jsonb_build_object(
        'entry_id', NEW.id,
        'amount', NEW.paid_amount,
        'client_id', NEW.client_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sales_transactions
DROP TRIGGER IF EXISTS client_payment_push_trigger ON sales_transactions;
CREATE TRIGGER client_payment_push_trigger
  AFTER INSERT ON sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_payment();

-- Trigger Function for Partner Master
CREATE OR REPLACE FUNCTION notify_partner_contribution()
RETURNS TRIGGER AS $$
DECLARE
  contribution_diff NUMERIC;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    contribution_diff := NEW.contribution - OLD.contribution;
    
    IF contribution_diff != 0 THEN
      IF contribution_diff > 0 THEN
        notification_title := '🤝 Partner Contribution';
        notification_body := NEW.name || ' contributed ₹' || contribution_diff;
      ELSE
        notification_title := '🤝 Partner Withdrawal';
        notification_body := NEW.name || ' withdrew ₹' || ABS(contribution_diff);
      END IF;
      
      PERFORM queue_push_notification(
        'partner_contribution',
        notification_title,
        notification_body,
        jsonb_build_object(
          'partner_id', NEW.id,
          'partner_name', NEW.name,
          'amount', ABS(contribution_diff),
          'type', CASE WHEN contribution_diff > 0 THEN 'contribution' ELSE 'withdrawal' END
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for partner_master
DROP TRIGGER IF EXISTS partner_contribution_push_trigger ON partner_master;
CREATE TRIGGER partner_contribution_push_trigger
  AFTER UPDATE ON partner_master
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_contribution();

-- ============================================================
-- STEP 5: LIBRARY TRIGGERS
-- ============================================================

-- Trigger Function for Library Student Enrollment
CREATE OR REPLACE FUNCTION notify_library_student()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM queue_push_notification(
      'library_student',
      '👨‍🎓 New Student Enrolled',
      NEW.name || ' has been enrolled',
      jsonb_build_object(
        'student_id', NEW.id,
        'student_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for library_students
DROP TRIGGER IF EXISTS library_student_push_trigger ON library_students;
CREATE TRIGGER library_student_push_trigger
  AFTER INSERT ON library_students
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_student();

-- Trigger Function for Library Fee Payment
CREATE OR REPLACE FUNCTION notify_library_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM queue_push_notification(
      'library_payment',
      '💰 Library Fee Payment',
      '₹' || NEW.amount_paid || ' received',
      jsonb_build_object(
        'payment_id', NEW.id,
        'amount', NEW.amount_paid
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for library_fee_payments
DROP TRIGGER IF EXISTS library_payment_push_trigger ON library_fee_payments;
CREATE TRIGGER library_payment_push_trigger
  AFTER INSERT ON library_fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_payment();

-- ============================================================
-- STEP 6: VERIFY SETUP
-- ============================================================

-- Check all triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%push_trigger'
ORDER BY event_object_table;

-- ============================================================
-- SUCCESS CRITERIA
-- ============================================================
-- ✅ You should see 7 triggers created:
--    - wage_entry_push_trigger
--    - firm_cash_push_trigger
--    - material_purchase_push_trigger
--    - client_payment_push_trigger
--    - partner_contribution_push_trigger
--    - library_student_push_trigger
--    - library_payment_push_trigger
-- 
-- ✅ Tables created:
--    - user_push_tokens
--    - push_notification_queue
-- 
-- Next Steps:
-- 1. Deploy Supabase Edge Function to process queue
-- 2. Configure Firebase Cloud Messaging
-- 3. Build Android app with Capacitor
-- ============================================================
