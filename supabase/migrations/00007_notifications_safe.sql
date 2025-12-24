-- =====================================================
-- Notifications System (SAFE VERSION)
-- This version checks for existing objects before creating
-- =====================================================

-- Create notification_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'one_on_one_submitted',
      'one_on_one_reviewed',
      'one_on_one_completed',
      'action_item_assigned',
      'action_item_due_soon',
      'action_item_overdue',
      'one_on_one_reminder'
    );
    RAISE NOTICE 'Created notification_type enum';
  ELSE
    RAISE NOTICE 'notification_type enum already exists';
  END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_emailed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user') THEN
    CREATE INDEX idx_notifications_user ON notifications(user_id);
    RAISE NOTICE 'Created index idx_notifications_user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created') THEN
    CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
    RAISE NOTICE 'Created index idx_notifications_created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_unread') THEN
    CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
    RAISE NOTICE 'Created index idx_notifications_unread';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_related') THEN
    CREATE INDEX idx_notifications_related ON notifications(related_id, related_type);
    RAISE NOTICE 'Created index idx_notifications_related';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    related_id,
    related_type
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_id,
    p_related_type
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id
    AND id = ANY(p_notification_ids)
    AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_one_on_one_status ON one_on_ones;

-- Trigger function for 1-on-1 status changes
CREATE OR REPLACE FUNCTION notify_one_on_one_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_developer_name TEXT;
  v_manager_name TEXT;
  v_month_display TEXT;
BEGIN
  -- Get user names
  SELECT COALESCE(full_name, email) INTO v_developer_name
  FROM app_users WHERE id = NEW.developer_id;

  SELECT COALESCE(full_name, email) INTO v_manager_name
  FROM app_users WHERE id = NEW.manager_id;

  -- Format month for display
  v_month_display := TO_CHAR(TO_DATE(NEW.month_year || '-01', 'YYYY-MM-DD'), 'Month YYYY');

  -- Notify based on status change
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
    -- Notify manager when developer submits
    PERFORM create_notification(
      NEW.manager_id,
      'one_on_one_submitted',
      '1-on-1 Submitted for Review',
      v_developer_name || ' has submitted their ' || v_month_display || ' 1-on-1 for your review.',
      NEW.id,
      'one_on_one'
    );

  ELSIF NEW.status = 'reviewed' AND OLD.status = 'submitted' THEN
    -- Notify developer when manager reviews
    PERFORM create_notification(
      NEW.developer_id,
      'one_on_one_reviewed',
      '1-on-1 Reviewed',
      v_manager_name || ' has reviewed your ' || v_month_display || ' 1-on-1.',
      NEW.id,
      'one_on_one'
    );

  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Notify both when completed
    PERFORM create_notification(
      NEW.developer_id,
      'one_on_one_completed',
      '1-on-1 Completed',
      'Your ' || v_month_display || ' 1-on-1 with ' || v_manager_name || ' has been completed.',
      NEW.id,
      'one_on_one'
    );

    PERFORM create_notification(
      NEW.manager_id,
      'one_on_one_completed',
      '1-on-1 Completed',
      'Your ' || v_month_display || ' 1-on-1 with ' || v_developer_name || ' has been completed.',
      NEW.id,
      'one_on_one'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for 1-on-1 status changes
CREATE TRIGGER trigger_notify_one_on_one_status
  AFTER UPDATE OF status ON one_on_ones
  FOR EACH ROW
  EXECUTE FUNCTION notify_one_on_one_status_change();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_action_item_created ON action_items;

-- Trigger function for action item assignments
CREATE OR REPLACE FUNCTION notify_action_item_created()
RETURNS TRIGGER AS $$
DECLARE
  v_assignee_id UUID;
  v_one_on_one RECORD;
BEGIN
  -- Get the 1-on-1 details
  SELECT * INTO v_one_on_one
  FROM one_on_ones
  WHERE id = NEW.one_on_one_id;

  -- Determine assignee based on role
  IF NEW.assigned_to = 'developer' THEN
    v_assignee_id := v_one_on_one.developer_id;
  ELSE
    v_assignee_id := v_one_on_one.manager_id;
  END IF;

  -- Create notification
  PERFORM create_notification(
    v_assignee_id,
    'action_item_assigned',
    'New Action Item Assigned',
    'A new action item has been assigned to you: ' || NEW.description,
    NEW.id,
    'action_item'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for action item creation
CREATE TRIGGER trigger_notify_action_item_created
  AFTER INSERT ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_action_item_created();

-- Done!
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications migration completed successfully!';
END $$;
