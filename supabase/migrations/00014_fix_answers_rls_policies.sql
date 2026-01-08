-- =====================================================
-- Fix RLS Policies for Answers Table
-- Update policies to use 'answer_type' instead of 'answered_by'
-- =====================================================

-- Drop existing policies that reference answered_by
DROP POLICY IF EXISTS "Developers can manage own answers" ON answers;
DROP POLICY IF EXISTS "Managers can manage own answers" ON answers;

-- Recreate policies with correct column name (answer_type)

-- Developers can insert/update their own answers
CREATE POLICY "Developers can manage own answers"
  ON answers FOR ALL
  USING (
    answer_type = 'developer' AND
    one_on_one_id IN (
      SELECT id FROM one_on_ones
      WHERE developer_id = auth.uid()
    )
  )
  WITH CHECK (
    answer_type = 'developer' AND
    one_on_one_id IN (
      SELECT id FROM one_on_ones
      WHERE developer_id = auth.uid()
    )
  );

-- Managers can insert/update their answers
CREATE POLICY "Managers can manage own answers"
  ON answers FOR ALL
  USING (
    answer_type = 'manager' AND
    one_on_one_id IN (
      SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
    )
  )
  WITH CHECK (
    answer_type = 'manager' AND
    one_on_one_id IN (
      SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
    )
  );

-- Done!
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed RLS policies for answers table to use answer_type column';
END $$;
