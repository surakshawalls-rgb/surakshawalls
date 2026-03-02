-- =============================================================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- =============================================================================
-- This file contains database triggers that automatically create notifications
-- when important operations happen (INSERT, UPDATE, DELETE)
-- Execute these in Supabase SQL Editor
--
-- TRIGGERS INCLUDED (12 total):
-- 1. client_ledger - Client master + payment/invoice tracking
-- 2. workers_master - Worker management
-- 3. library_students - Student enrollment
-- 4. wage_entries - Wage transactions
-- 5. sales_transactions - Product sales
-- 6. library_expenses - Library operational expenses
-- 7. library_fee_payments - Student fee payments
-- 8. library_attendance - Student check-in/check-out
-- 9. library_seats - Seat allocation changes
-- 10. library_cash_ledger - Library income/expense tracking
-- 11. production_entries - Production tracking
-- 12. raw_materials_master - Low stock alerts
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTION: Create notification for all users
-- =============================================================================
CREATE OR REPLACE FUNCTION create_notification_for_all_users(
  p_title TEXT,
  p_content TEXT,
  p_type TEXT DEFAULT 'info',
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, content, type, data)
  SELECT id, p_title, p_content, p_type, p_data
  FROM auth.users;
END;
$$;

-- =============================================================================
-- HELPER FUNCTION: Create notification for specific user
-- =============================================================================
CREATE OR REPLACE FUNCTION create_notification_for_user(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_type TEXT DEFAULT 'info',
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, content, type, data)
  VALUES (p_user_id, p_title, p_content, p_type, p_data);
END;
$$;

-- =============================================================================
-- CLIENT LEDGER TRIGGERS (Client Master + Payments)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_client_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '🏢 New Client Added',
      'Client "' || NEW.client_name || '" has been added to the system',
      'success',
      jsonb_build_object('route', '/client-ledger', 'client_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if payment received (total_paid increased)
    IF OLD.total_paid IS NOT NULL AND NEW.total_paid > OLD.total_paid THEN
      PERFORM create_notification_for_all_users(
        '💰 Payment Received',
        '₹' || (NEW.total_paid - OLD.total_paid) || ' received from ' || NEW.client_name,
        'success',
        jsonb_build_object('route', '/client-ledger', 'client_id', NEW.id)
      );
    -- Check if billed amount increased
    ELSIF OLD.total_billed IS NOT NULL AND NEW.total_billed > OLD.total_billed THEN
      PERFORM create_notification_for_all_users(
        '📝 New Invoice',
        '₹' || (NEW.total_billed - OLD.total_billed) || ' invoiced to ' || NEW.client_name,
        'info',
        jsonb_build_object('route', '/client-ledger', 'client_id', NEW.id)
      );
    -- General update (name, phone, etc)
    ELSIF OLD.client_name != NEW.client_name OR OLD.phone IS DISTINCT FROM NEW.phone THEN
      PERFORM create_notification_for_all_users(
        '✏️ Client Updated',
        'Client "' || NEW.client_name || '" details have been modified',
        'info',
        jsonb_build_object('route', '/client-ledger', 'client_id', NEW.id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '🗑️ Client Deleted',
      'Client "' || OLD.client_name || '" has been removed',
      'warning',
      jsonb_build_object('route', '/client-ledger')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_client_changes ON client_ledger;
CREATE TRIGGER trigger_notify_client_changes
  AFTER INSERT OR UPDATE OR DELETE ON client_ledger
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_changes();

-- =============================================================================
-- WORKERS MASTER TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_worker_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '👷 New Worker Added',
      'Worker "' || NEW.name || '" has been added',
      'success',
      jsonb_build_object('route', '/labour', 'worker_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_notification_for_all_users(
      '✏️ Worker Updated',
      'Worker "' || NEW.name || '" details modified',
      'info',
      jsonb_build_object('route', '/labour', 'worker_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '🗑️ Worker Deleted',
      'Worker "' || OLD.name || '" has been removed',
      'warning',
      jsonb_build_object('route', '/labour')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_worker_changes ON workers_master;
CREATE TRIGGER trigger_notify_worker_changes
  AFTER INSERT OR UPDATE OR DELETE ON workers_master
  FOR EACH ROW
  EXECUTE FUNCTION notify_worker_changes();

-- =============================================================================
-- LIBRARY STUDENTS TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_student_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '👨‍🎓 New Student Enrolled',
      'Student "' || NEW.name || '" has been enrolled in the library',
      'success',
      jsonb_build_object('route', '/library-students', 'student_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_notification_for_all_users(
      '✏️ Student Updated',
      'Student "' || NEW.name || '" details have been modified',
      'info',
      jsonb_build_object('route', '/library-students', 'student_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '🗑️ Student Removed',
      'Student "' || OLD.name || '" has been removed from library',
      'warning',
      jsonb_build_object('route', '/library-students')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_student_changes ON library_students;
CREATE TRIGGER trigger_notify_student_changes
  AFTER INSERT OR UPDATE OR DELETE ON library_students
  FOR EACH ROW
  EXECUTE FUNCTION notify_student_changes();

-- =============================================================================
-- WAGE ENTRIES TRIGGERS (High-value transactions)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_wage_entry_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  worker_name TEXT;
BEGIN
  -- Get worker name if exists
  SELECT name INTO worker_name 
  FROM workers_master 
  WHERE id = COALESCE(NEW.worker_id, OLD.worker_id);
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '💰 New Wage Entry',
      '₹' || NEW.wage_earned || ' wage entry added' || 
      CASE WHEN worker_name IS NOT NULL THEN ' for ' || worker_name ELSE '' END,
      'success',
      jsonb_build_object('route', '/labour-ledger', 'entry_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.wage_earned != NEW.wage_earned THEN
    PERFORM create_notification_for_all_users(
      '✏️ Wage Entry Updated',
      'Wage entry modified from ₹' || OLD.wage_earned || ' to ₹' || NEW.wage_earned,
      'info',
      jsonb_build_object('route', '/labour-ledger', 'entry_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '🗑️ Wage Entry Deleted',
      '₹' || OLD.wage_earned || ' wage entry has been removed',
      'warning',
      jsonb_build_object('route', '/labour-ledger')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_wage_entry_changes ON wage_entries;
CREATE TRIGGER trigger_notify_wage_entry_changes
  AFTER INSERT OR UPDATE OR DELETE ON wage_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_wage_entry_changes();

-- =============================================================================
-- SALES TRANSACTIONS TRIGGERS (Product sales with inventory)
-- Note: If you need notifications for 'orders' table (construction orders),
-- create a separate trigger following the same pattern
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_sales_transaction_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name TEXT;
BEGIN
  -- Get client name
  SELECT client_ledger.client_name INTO client_name 
  FROM client_ledger 
  WHERE client_ledger.id = COALESCE(NEW.client_id, OLD.client_id);
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '🛒 New Sale',
      'Sale of ' || NEW.quantity || ' ' || NEW.product_name || ' to ' || 
      COALESCE(client_name, 'Unknown') || ' - ₹' || COALESCE(NEW.total_amount, 0),
      'success',
      jsonb_build_object('route', '/sales-entry', 'sale_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.delivery_status != NEW.delivery_status THEN
    PERFORM create_notification_for_all_users(
      '📦 Delivery Status Updated',
      'Sale #' || NEW.id || ' status: ' || NEW.delivery_status,
      'info',
      jsonb_build_object('route', '/sales-entry', 'sale_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '❌ Sale Cancelled',
      'Sale of ' || OLD.product_name || ' has been cancelled',
      'error',
      jsonb_build_object('route', '/sales-entry')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_sales_transaction_changes ON sales_transactions;
CREATE TRIGGER trigger_notify_sales_transaction_changes
  AFTER INSERT OR UPDATE OR DELETE ON sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_sales_transaction_changes();

-- =============================================================================
-- NOTE: client_bill table doesn't exist in your database
-- Client payment/billing tracking is done via client_ledger.total_billed 
-- and client_ledger.total_paid columns (see trigger above)
-- =============================================================================

-- =============================================================================
-- LIBRARY EXPENSES TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_library_expense_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '💸 Library Expense Added',
      '₹' || NEW.amount || ' - ' || NEW.description,
      'warning',
      jsonb_build_object('route', '/library-expenses', 'expense_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.amount != NEW.amount THEN
    PERFORM create_notification_for_all_users(
      '✏️ Expense Modified',
      'Expense updated: ' || NEW.description || ' - ₹' || NEW.amount,
      'info',
      jsonb_build_object('route', '/library-expenses', 'expense_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_notification_for_all_users(
      '🗑️ Expense Deleted',
      'Expense removed: ' || OLD.description || ' - ₹' || OLD.amount,
      'warning',
      jsonb_build_object('route', '/library-expenses')
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_library_expense_changes ON library_expenses;
CREATE TRIGGER trigger_notify_library_expense_changes
  AFTER INSERT OR UPDATE OR DELETE ON library_expenses
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_expense_changes();

-- =============================================================================
-- LIBRARY FEE PAYMENTS TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_library_fee_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_name TEXT;
BEGIN
  -- Get student name
  SELECT name INTO student_name 
  FROM library_students 
  WHERE id = NEW.student_id;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '💳 Library Fee Payment',
      '₹' || NEW.amount_paid || ' received from ' || COALESCE(student_name, 'Student') || 
      ' (' || NEW.shift_type || ') - Seat #' || COALESCE(NEW.seat_no::text, 'N/A'),
      'success',
      jsonb_build_object('route', '/library-students', 'payment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_library_fee_payment_changes ON library_fee_payments;
CREATE TRIGGER trigger_notify_library_fee_payment_changes
  AFTER INSERT ON library_fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_fee_payment_changes();

-- =============================================================================
-- LIBRARY ATTENDANCE TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_library_attendance_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_name TEXT;
BEGIN
  -- Get student name
  SELECT name INTO student_name 
  FROM library_students 
  WHERE id = NEW.student_id;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '✅ Student Check-In',
      COALESCE(student_name, 'Student') || ' checked in at ' || NEW.check_in_time,
      'info',
      jsonb_build_object('route', '/library-attendance', 'attendance_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN
    PERFORM create_notification_for_all_users(
      '👋 Student Check-Out',
      COALESCE(student_name, 'Student') || ' checked out at ' || NEW.check_out_time,
      'info',
      jsonb_build_object('route', '/library-attendance', 'attendance_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_library_attendance_changes ON library_attendance;
CREATE TRIGGER trigger_notify_library_attendance_changes
  AFTER INSERT OR UPDATE ON library_attendance
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_attendance_changes();

-- =============================================================================
-- LIBRARY SEAT ALLOCATION TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_library_seat_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Check if full-time seat assigned
    IF OLD.full_time_student_id IS NULL AND NEW.full_time_student_id IS NOT NULL THEN
      SELECT name INTO student_name FROM library_students WHERE id = NEW.full_time_student_id;
      PERFORM create_notification_for_all_users(
        '🪑 Seat Allocated',
        'Seat #' || NEW.seat_no || ' assigned to ' || COALESCE(student_name, 'Student') || ' (Full Time)',
        'success',
        jsonb_build_object('route', '/library-seats', 'seat_no', NEW.seat_no)
      );
    END IF;
    
    -- Check if first-half seat assigned
    IF OLD.first_half_student_id IS NULL AND NEW.first_half_student_id IS NOT NULL THEN
      SELECT name INTO student_name FROM library_students WHERE id = NEW.first_half_student_id;
      PERFORM create_notification_for_all_users(
        '🪑 Seat Allocated',
        'Seat #' || NEW.seat_no || ' assigned to ' || COALESCE(student_name, 'Student') || ' (First Half)',
        'success',
        jsonb_build_object('route', '/library-seats', 'seat_no', NEW.seat_no)
      );
    END IF;
    
    -- Check if second-half seat assigned
    IF OLD.second_half_student_id IS NULL AND NEW.second_half_student_id IS NOT NULL THEN
      SELECT name INTO student_name FROM library_students WHERE id = NEW.second_half_student_id;
      PERFORM create_notification_for_all_users(
        '🪑 Seat Allocated',
        'Seat #' || NEW.seat_no || ' assigned to ' || COALESCE(student_name, 'Student') || ' (Second Half)',
        'success',
        jsonb_build_object('route', '/library-seats', 'seat_no', NEW.seat_no)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_library_seat_changes ON library_seats;
CREATE TRIGGER trigger_notify_library_seat_changes
  AFTER UPDATE ON library_seats
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_seat_changes();

-- =============================================================================
-- LIBRARY CASH LEDGER TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_library_cash_ledger_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      PERFORM create_notification_for_all_users(
        '💰 Library Income',
        '₹' || NEW.amount || ' - ' || NEW.category || ': ' || COALESCE(NEW.description, ''),
        'success',
        jsonb_build_object('route', '/library-dashboard', 'entry_id', NEW.id)
      );
    ELSIF NEW.type = 'expense' THEN
      PERFORM create_notification_for_all_users(
        '💸 Library Expense',
        '₹' || NEW.amount || ' - ' || NEW.category || ': ' || COALESCE(NEW.description, ''),
        'warning',
        jsonb_build_object('route', '/library-dashboard', 'entry_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_library_cash_ledger_changes ON library_cash_ledger;
CREATE TRIGGER trigger_notify_library_cash_ledger_changes
  AFTER INSERT ON library_cash_ledger
  FOR EACH ROW
  EXECUTE FUNCTION notify_library_cash_ledger_changes();

-- =============================================================================
-- PRODUCTION ENTRIES TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_production_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification_for_all_users(
      '🏭 New Production Entry',
      'Production completed: ' || NEW.success_quantity || ' ' || NEW.product_name || 
      CASE WHEN NEW.product_variant IS NOT NULL THEN ' (' || NEW.product_variant || ')' ELSE '' END,
      'success',
      jsonb_build_object('route', '/production-entry', 'production_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_notification_for_all_users(
      '✏️ Production Updated',
      'Production entry for ' || NEW.product_name || ' has been modified',
      'info',
      jsonb_build_object('route', '/production-entry', 'production_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_production_changes ON production_entries;
CREATE TRIGGER trigger_notify_production_changes
  AFTER INSERT OR UPDATE ON production_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_production_changes();

--=============================================================================
-- RAW MATERIALS TRIGGERS (Low stock alerts)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if stock went below reorder level
  IF NEW.current_stock < COALESCE(NEW.low_stock_alert, 100) AND 
     (OLD.current_stock IS NULL OR OLD.current_stock >= COALESCE(OLD.low_stock_alert, 100)) THEN
    
    PERFORM create_notification_for_all_users(
      '⚠️ Low Stock Alert',
      'Material "' || NEW.material_name || '" is running low: ' || NEW.current_stock || ' ' || NEW.unit,
      'warning',
      jsonb_build_object('route', '/raw-materials', 'material_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_low_stock ON raw_materials_master;
CREATE TRIGGER trigger_notify_low_stock
  AFTER INSERT OR UPDATE ON raw_materials_master
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify triggers are created:

-- List all triggers
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_notify%'
ORDER BY event_object_table, trigger_name;

-- List all notification functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%notify%'
ORDER BY routine_name;

-- =============================================================================
-- TESTING
-- =============================================================================
-- Test by inserting a test record:
/*
-- Test client notification
INSERT INTO client_ledger (client_name, phone, address)
VALUES ('Test Client XYZ', '9999999999', 'Mumbai, Maharashtra');

-- Test worker notification
INSERT INTO workers_master (name, phone)
VALUES ('Test Worker', '8888888888');

-- Test student notification
INSERT INTO library_students (name, mobile, emergency_contact, address)
VALUES ('Test Student', '7777777777', '9999999999', 'Test Address');

-- Test library fee payment (requires existing student)
INSERT INTO library_fee_payments (student_id, shift_type, amount_paid, valid_from, valid_until)
VALUES (
  (SELECT id FROM library_students WHERE name = 'Test Student' LIMIT 1),
  'full_time', 1500, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'
);

-- Test library expense
INSERT INTO library_expenses (category, amount, description)
VALUES ('electricity', 2500, 'Monthly electricity bill');

-- Test production entry (requires product_name and success_quantity)
INSERT INTO production_entries (date, product_name, product_variant, success_quantity, rejected_quantity, cement_used, aggregates_used, sariya_used)
VALUES (CURRENT_DATE, 'Fencing Pole', '6ft', 50, 2, 10, 100, 50);

-- Check notifications created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
*/

-- =============================================================================
-- DISABLE/ENABLE ALL TRIGGERS (for maintenance)
-- =============================================================================
/*
-- Disable all notification triggers
ALTER TABLE client_ledger DISABLE TRIGGER trigger_notify_client_changes;
ALTER TABLE workers_master DISABLE TRIGGER trigger_notify_worker_changes;
ALTER TABLE library_students DISABLE TRIGGER trigger_notify_student_changes;
ALTER TABLE wage_entries DISABLE TRIGGER trigger_notify_wage_entry_changes;
ALTER TABLE sales_transactions DISABLE TRIGGER trigger_notify_sales_transaction_changes;
ALTER TABLE library_expenses DISABLE TRIGGER trigger_notify_library_expense_changes;
ALTER TABLE library_fee_payments DISABLE TRIGGER trigger_notify_library_fee_payment_changes;
ALTER TABLE library_attendance DISABLE TRIGGER trigger_notify_library_attendance_changes;
ALTER TABLE library_seats DISABLE TRIGGER trigger_notify_library_seat_changes;
ALTER TABLE library_cash_ledger DISABLE TRIGGER trigger_notify_library_cash_ledger_changes;
ALTER TABLE production_entries DISABLE TRIGGER trigger_notify_production_changes;
ALTER TABLE raw_materials_master DISABLE TRIGGER trigger_notify_low_stock;

-- Enable all notification triggers
ALTER TABLE client_ledger ENABLE TRIGGER trigger_notify_client_changes;
ALTER TABLE workers_master ENABLE TRIGGER trigger_notify_worker_changes;
ALTER TABLE library_students ENABLE TRIGGER trigger_notify_student_changes;
ALTER TABLE wage_entries ENABLE TRIGGER trigger_notify_wage_entry_changes;
ALTER TABLE sales_transactions ENABLE TRIGGER trigger_notify_sales_transaction_changes;
ALTER TABLE library_expenses ENABLE TRIGGER trigger_notify_library_expense_changes;
ALTER TABLE library_fee_payments ENABLE TRIGGER trigger_notify_library_fee_payment_changes;
ALTER TABLE library_attendance ENABLE TRIGGER trigger_notify_library_attendance_changes;
ALTER TABLE library_seats ENABLE TRIGGER trigger_notify_library_seat_changes;
ALTER TABLE library_cash_ledger ENABLE TRIGGER trigger_notify_library_cash_ledger_changes;
ALTER TABLE production_entries ENABLE TRIGGER trigger_notify_production_changes;
ALTER TABLE raw_materials_master ENABLE TRIGGER trigger_notify_low_stock;
*/
