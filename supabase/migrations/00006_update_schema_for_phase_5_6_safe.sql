-- =====================================================
-- Schema Updates for Phase 5 & 6 (SAFE VERSION)
-- This version checks for column existence before modifying
-- =====================================================

-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(p_table_name text, p_column_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE ANSWERS TABLE
-- =====================================================

-- Add rating_value column if it doesn't exist
DO $$
BEGIN
  IF NOT column_exists('answers', 'rating_value') THEN
    ALTER TABLE answers ADD COLUMN rating_value INTEGER;
    RAISE NOTICE 'Added rating_value column to answers';
  ELSE
    RAISE NOTICE 'rating_value column already exists in answers';
  END IF;
END $$;

-- Add text_value column if it doesn't exist
DO $$
BEGIN
  IF NOT column_exists('answers', 'text_value') THEN
    -- If answer_value exists, rename it
    IF column_exists('answers', 'answer_value') THEN
      ALTER TABLE answers RENAME COLUMN answer_value TO text_value;
      RAISE NOTICE 'Renamed answer_value to text_value in answers';
    ELSE
      -- Otherwise create new column
      ALTER TABLE answers ADD COLUMN text_value TEXT;
      RAISE NOTICE 'Added text_value column to answers';
    END IF;
  ELSE
    RAISE NOTICE 'text_value column already exists in answers';
  END IF;
END $$;

-- Add answer_type column if it doesn't exist
DO $$
BEGIN
  IF NOT column_exists('answers', 'answer_type') THEN
    -- If answered_by exists, rename it
    IF column_exists('answers', 'answered_by') THEN
      ALTER TABLE answers RENAME COLUMN answered_by TO answer_type;
      RAISE NOTICE 'Renamed answered_by to answer_type in answers';
    ELSE
      -- Otherwise create new column
      ALTER TABLE answers ADD COLUMN answer_type answer_source;
      RAISE NOTICE 'Added answer_type column to answers';
    END IF;
  ELSE
    RAISE NOTICE 'answer_type column already exists in answers';
  END IF;
END $$;

-- =====================================================
-- UPDATE NOTES TABLE
-- =====================================================

-- Add content column if it doesn't exist
DO $$
BEGIN
  IF NOT column_exists('notes', 'content') THEN
    -- If note_text exists, rename it
    IF column_exists('notes', 'note_text') THEN
      ALTER TABLE notes RENAME COLUMN note_text TO content;
      RAISE NOTICE 'Renamed note_text to content in notes';
    ELSE
      -- Otherwise create new column
      ALTER TABLE notes ADD COLUMN content TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Added content column to notes';
    END IF;
  ELSE
    RAISE NOTICE 'content column already exists in notes';
  END IF;
END $$;

-- Update note_type enum to use plural form (if not already done)
DO $$
BEGIN
  -- Check if 'developer_notes' already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'developer_notes'
    AND enumtypid = 'note_type'::regtype
  ) THEN
    -- Try to rename the value
    BEGIN
      ALTER TYPE note_type RENAME VALUE 'developer_note' TO 'developer_notes';
      RAISE NOTICE 'Renamed note_type value developer_note to developer_notes';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not rename note_type value: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'note_type value developer_notes already exists';
  END IF;
END $$;

-- =====================================================
-- UPDATE ACTION_ITEMS TABLE
-- =====================================================

-- Drop existing RLS policies that depend on assigned_to column (both old and new names)
DROP POLICY IF EXISTS "Users can view assigned action items" ON action_items;
DROP POLICY IF EXISTS "Users can update assigned action items" ON action_items;
DROP POLICY IF EXISTS "Users can create action items" ON action_items;
DROP POLICY IF EXISTS "Users can delete action items" ON action_items;
DROP POLICY IF EXISTS "Users can view action items for their 1-on-1s" ON action_items;
DROP POLICY IF EXISTS "Users can create action items for their 1-on-1s" ON action_items;
DROP POLICY IF EXISTS "Users can update action items for their 1-on-1s" ON action_items;
DROP POLICY IF EXISTS "Users can delete action items for their 1-on-1s" ON action_items;

-- Handle assigned_to column migration
DO $$
DECLARE
  assigned_to_type text;
BEGIN
  -- Check the current type of assigned_to
  SELECT data_type INTO assigned_to_type
  FROM information_schema.columns
  WHERE table_name = 'action_items'
    AND column_name = 'assigned_to';

  -- If assigned_to is UUID (old schema)
  IF assigned_to_type = 'uuid' THEN
    RAISE NOTICE 'Converting assigned_to from UUID to answer_source';

    -- Add temporary column
    ALTER TABLE action_items ADD COLUMN assigned_role answer_source;

    -- Migrate data
    UPDATE action_items ai
    SET assigned_role = CASE
      WHEN ai.assigned_to = (SELECT developer_id FROM one_on_ones WHERE id = ai.one_on_one_id)
      THEN 'developer'::answer_source
      ELSE 'manager'::answer_source
    END;

    -- Make NOT NULL
    ALTER TABLE action_items ALTER COLUMN assigned_role SET NOT NULL;

    -- Drop old column and rename
    ALTER TABLE action_items DROP COLUMN assigned_to;
    ALTER TABLE action_items RENAME COLUMN assigned_role TO assigned_to;

    RAISE NOTICE 'Successfully migrated assigned_to column';
  ELSIF assigned_to_type = 'USER-DEFINED' THEN
    RAISE NOTICE 'assigned_to column already uses answer_source type';
  ELSE
    RAISE NOTICE 'assigned_to has unexpected type: %', assigned_to_type;
  END IF;
END $$;

-- Recreate RLS policies with updated logic
CREATE POLICY "Users can view action items for their 1-on-1s"
  ON action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM one_on_ones
      WHERE one_on_ones.id = action_items.one_on_one_id
      AND (one_on_ones.developer_id = auth.uid() OR one_on_ones.manager_id = auth.uid())
    )
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can create action items for their 1-on-1s"
  ON action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM one_on_ones
      WHERE one_on_ones.id = action_items.one_on_one_id
      AND (one_on_ones.developer_id = auth.uid() OR one_on_ones.manager_id = auth.uid())
    )
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can update action items for their 1-on-1s"
  ON action_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM one_on_ones
      WHERE one_on_ones.id = action_items.one_on_one_id
      AND (one_on_ones.developer_id = auth.uid() OR one_on_ones.manager_id = auth.uid())
    )
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can delete action items for their 1-on-1s"
  ON action_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM one_on_ones
      WHERE one_on_ones.id = action_items.one_on_one_id
      AND (one_on_ones.developer_id = auth.uid() OR one_on_ones.manager_id = auth.uid())
    )
    OR is_admin(auth.uid())
  );

-- =====================================================
-- UPDATE ONE_ON_ONES TABLE
-- =====================================================

-- Add new status values if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'submitted'
    AND enumtypid = 'one_on_one_status'::regtype
  ) THEN
    ALTER TYPE one_on_one_status ADD VALUE 'submitted';
    RAISE NOTICE 'Added submitted status to one_on_one_status';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'reviewed'
    AND enumtypid = 'one_on_one_status'::regtype
  ) THEN
    ALTER TYPE one_on_one_status ADD VALUE 'reviewed';
    RAISE NOTICE 'Added reviewed status to one_on_one_status';
  END IF;
END $$;

-- Add timestamp columns if they don't exist
DO $$
BEGIN
  IF NOT column_exists('one_on_ones', 'developer_submitted_at') THEN
    ALTER TABLE one_on_ones ADD COLUMN developer_submitted_at TIMESTAMPTZ;
    RAISE NOTICE 'Added developer_submitted_at to one_on_ones';
  END IF;

  IF NOT column_exists('one_on_ones', 'manager_reviewed_at') THEN
    ALTER TABLE one_on_ones ADD COLUMN manager_reviewed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added manager_reviewed_at to one_on_ones';
  END IF;
END $$;

-- Rename month to month_year if needed
DO $$
BEGIN
  IF column_exists('one_on_ones', 'month') AND NOT column_exists('one_on_ones', 'month_year') THEN
    ALTER TABLE one_on_ones RENAME COLUMN month TO month_year;
    RAISE NOTICE 'Renamed month to month_year in one_on_ones';

    -- Update the unique constraint
    ALTER TABLE one_on_ones DROP CONSTRAINT IF EXISTS one_on_ones_developer_id_month_key;
    ALTER TABLE one_on_ones ADD CONSTRAINT one_on_ones_developer_id_month_year_key
      UNIQUE(developer_id, month_year);
  ELSIF column_exists('one_on_ones', 'month_year') THEN
    RAISE NOTICE 'month_year column already exists in one_on_ones';
  END IF;
END $$;

-- =====================================================
-- UPDATE METRICS_SNAPSHOTS TABLE
-- =====================================================

-- Rename month to month_year if needed
DO $$
BEGIN
  IF column_exists('metrics_snapshots', 'month') AND NOT column_exists('metrics_snapshots', 'month_year') THEN
    ALTER TABLE metrics_snapshots RENAME COLUMN month TO month_year;
    RAISE NOTICE 'Renamed month to month_year in metrics_snapshots';
  ELSIF column_exists('metrics_snapshots', 'month_year') THEN
    RAISE NOTICE 'month_year column already exists in metrics_snapshots';
  END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS column_exists(text, text);

-- Done!
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
END $$;
