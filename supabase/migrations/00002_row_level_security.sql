-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_ones ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TEAMS POLICIES
-- =====================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to teams"
    ON teams FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Managers can view their own team
CREATE POLICY "Managers can view their team"
    ON teams FOR SELECT
    USING (manager_id = auth.uid() OR is_admin(auth.uid()));

-- Developers can view their own team
CREATE POLICY "Developers can view their team"
    ON teams FOR SELECT
    USING (
        id IN (SELECT team_id FROM app_users WHERE id = auth.uid())
    );

-- =====================================================
-- APP_USERS POLICIES
-- =====================================================

-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
    ON app_users FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON app_users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM app_users WHERE id = auth.uid()));

-- Managers can view their team members
CREATE POLICY "Managers can view team members"
    ON app_users FOR SELECT
    USING (
        team_id IN (
            SELECT id FROM teams WHERE manager_id = auth.uid()
        )
    );

-- Admins can view and manage all users
CREATE POLICY "Admins have full access to users"
    ON app_users FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- ONE_ON_ONES POLICIES
-- =====================================================

-- Developers can view their own 1-on-1s
CREATE POLICY "Developers can view own 1-on-1s"
    ON one_on_ones FOR SELECT
    USING (developer_id = auth.uid());

-- Developers can update their own draft 1-on-1s
CREATE POLICY "Developers can update own draft 1-on-1s"
    ON one_on_ones FOR UPDATE
    USING (developer_id = auth.uid() AND status = 'draft')
    WITH CHECK (developer_id = auth.uid());

-- Managers can view their team's 1-on-1s
CREATE POLICY "Managers can view team 1-on-1s"
    ON one_on_ones FOR SELECT
    USING (
        manager_id = auth.uid() OR
        team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    );

-- Managers can update 1-on-1s they manage
CREATE POLICY "Managers can update managed 1-on-1s"
    ON one_on_ones FOR UPDATE
    USING (manager_id = auth.uid())
    WITH CHECK (manager_id = auth.uid());

-- Managers can insert 1-on-1s for their team
CREATE POLICY "Managers can create team 1-on-1s"
    ON one_on_ones FOR INSERT
    WITH CHECK (
        manages_team(auth.uid(), team_id) AND
        manager_id = auth.uid()
    );

-- Admins have full access
CREATE POLICY "Admins have full access to 1-on-1s"
    ON one_on_ones FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- QUESTIONS POLICIES
-- =====================================================

-- Everyone can view active questions for their scope
CREATE POLICY "Users can view active questions"
    ON questions FOR SELECT
    USING (
        is_active = true AND (
            scope = 'company' OR
            (scope = 'team' AND team_id IN (
                SELECT team_id FROM app_users WHERE id = auth.uid()
            ))
        )
    );

-- Admins can manage company-wide questions
CREATE POLICY "Admins can manage company questions"
    ON questions FOR ALL
    USING (is_admin(auth.uid()) AND scope = 'company')
    WITH CHECK (is_admin(auth.uid()) AND scope = 'company');

-- Managers can manage their team questions
CREATE POLICY "Managers can manage team questions"
    ON questions FOR ALL
    USING (
        scope = 'team' AND
        team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    )
    WITH CHECK (
        scope = 'team' AND
        team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    );

-- =====================================================
-- ANSWERS POLICIES
-- =====================================================

-- Developers can view answers for their 1-on-1s
CREATE POLICY "Developers can view own answers"
    ON answers FOR SELECT
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE developer_id = auth.uid()
        )
    );

-- Developers can insert/update their own answers
CREATE POLICY "Developers can manage own answers"
    ON answers FOR ALL
    USING (
        answered_by = 'developer' AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() AND status = 'draft'
        )
    )
    WITH CHECK (
        answered_by = 'developer' AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() AND status = 'draft'
        )
    );

-- Managers can view answers for their team's 1-on-1s
CREATE POLICY "Managers can view team answers"
    ON answers FOR SELECT
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Managers can insert/update their answers
CREATE POLICY "Managers can manage own answers"
    ON answers FOR ALL
    USING (
        answered_by = 'manager' AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    )
    WITH CHECK (
        answered_by = 'manager' AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Admins have full access
CREATE POLICY "Admins have full access to answers"
    ON answers FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- NOTES POLICIES
-- =====================================================

-- Developers can view notes on their 1-on-1s
CREATE POLICY "Developers can view own notes"
    ON notes FOR SELECT
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE developer_id = auth.uid()
        )
    );

-- Developers can create/update their own notes
CREATE POLICY "Developers can manage own notes"
    ON notes FOR ALL
    USING (
        note_type = 'developer_note' AND
        created_by = auth.uid() AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE developer_id = auth.uid()
        )
    )
    WITH CHECK (
        note_type = 'developer_note' AND
        created_by = auth.uid() AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE developer_id = auth.uid()
        )
    );

-- Managers can view all notes for their team's 1-on-1s
CREATE POLICY "Managers can view team notes"
    ON notes FOR SELECT
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Managers can create/update manager feedback notes
CREATE POLICY "Managers can manage feedback notes"
    ON notes FOR ALL
    USING (
        note_type = 'manager_feedback' AND
        created_by = auth.uid() AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    )
    WITH CHECK (
        note_type = 'manager_feedback' AND
        created_by = auth.uid() AND
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Admins have full access
CREATE POLICY "Admins have full access to notes"
    ON notes FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- ACTION_ITEMS POLICIES
-- =====================================================

-- Users can view action items assigned to them
CREATE POLICY "Users can view assigned action items"
    ON action_items FOR SELECT
    USING (
        assigned_to = auth.uid() OR
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() OR manager_id = auth.uid()
        )
    );

-- Users can update action items assigned to them
CREATE POLICY "Users can update assigned action items"
    ON action_items FOR UPDATE
    USING (assigned_to = auth.uid())
    WITH CHECK (assigned_to = auth.uid());

-- Managers can create action items for their team's 1-on-1s
CREATE POLICY "Managers can create action items"
    ON action_items FOR INSERT
    WITH CHECK (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Managers can update action items for their team
CREATE POLICY "Managers can update team action items"
    ON action_items FOR UPDATE
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    )
    WITH CHECK (
        one_on_one_id IN (
            SELECT id FROM one_on_ones WHERE manager_id = auth.uid()
        )
    );

-- Admins have full access
CREATE POLICY "Admins have full access to action items"
    ON action_items FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- METRICS_SNAPSHOTS POLICIES
-- =====================================================

-- Developers can view their own metrics
CREATE POLICY "Developers can view own metrics"
    ON metrics_snapshots FOR SELECT
    USING (developer_id = auth.uid());

-- Managers can view their team's metrics
CREATE POLICY "Managers can view team metrics"
    ON metrics_snapshots FOR SELECT
    USING (
        team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    );

-- System can insert metrics (via service role or admin)
CREATE POLICY "Admins can manage metrics"
    ON metrics_snapshots FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
