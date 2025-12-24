-- =====================================================
-- 1-on-1 Tracking Platform - Initial Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'developer');
CREATE TYPE one_on_one_status AS ENUM ('draft', 'completed');
CREATE TYPE question_type AS ENUM ('rating_1_5', 'rating_1_10', 'text', 'yes_no');
CREATE TYPE question_scope AS ENUM ('company', 'team');
CREATE TYPE answer_source AS ENUM ('developer', 'manager');
CREATE TYPE note_type AS ENUM ('developer_note', 'manager_feedback');
CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'completed');

-- =====================================================
-- TABLES
-- =====================================================

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    manager_id UUID, -- Will be set after app_users is created
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App users table (extends auth.users)
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'developer',
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key from teams to app_users for manager
ALTER TABLE teams
    ADD CONSTRAINT fk_teams_manager
    FOREIGN KEY (manager_id)
    REFERENCES app_users(id)
    ON DELETE SET NULL;

-- One-on-ones table
CREATE TABLE one_on_ones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    status one_on_one_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Ensure one 1-on-1 per developer per month
    UNIQUE(developer_id, month)
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'text',
    scope question_scope NOT NULL DEFAULT 'company',
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Team-specific questions must have a team_id
    CONSTRAINT check_team_scope CHECK (
        (scope = 'team' AND team_id IS NOT NULL) OR
        (scope = 'company' AND team_id IS NULL)
    )
);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    one_on_one_id UUID NOT NULL REFERENCES one_on_ones(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_value TEXT, -- Stores both text and numeric values as text
    answered_by answer_source NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One answer per question per source per 1-on-1
    UNIQUE(one_on_one_id, question_id, answered_by)
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    one_on_one_id UUID NOT NULL REFERENCES one_on_ones(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    note_type note_type NOT NULL,
    created_by UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Action items table
CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    one_on_one_id UUID NOT NULL REFERENCES one_on_ones(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status action_status NOT NULL DEFAULT 'pending',
    assigned_to UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Metrics snapshots table
CREATE TABLE metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    one_on_one_id UUID NOT NULL REFERENCES one_on_ones(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    average_score DECIMAL(3,2), -- e.g., 4.25
    metric_data JSONB, -- Flexible storage for additional metrics
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One snapshot per 1-on-1
    UNIQUE(one_on_one_id)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_app_users_team ON app_users(team_id);
CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_one_on_ones_developer ON one_on_ones(developer_id);
CREATE INDEX idx_one_on_ones_manager ON one_on_ones(manager_id);
CREATE INDEX idx_one_on_ones_team ON one_on_ones(team_id);
CREATE INDEX idx_one_on_ones_month ON one_on_ones(month);
CREATE INDEX idx_one_on_ones_status ON one_on_ones(status);
CREATE INDEX idx_questions_team ON questions(team_id);
CREATE INDEX idx_questions_scope ON questions(scope);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_answers_one_on_one ON answers(one_on_one_id);
CREATE INDEX idx_notes_one_on_one ON notes(one_on_one_id);
CREATE INDEX idx_action_items_one_on_one ON action_items(one_on_one_id);
CREATE INDEX idx_action_items_assigned ON action_items(assigned_to);
CREATE INDEX idx_metrics_developer ON metrics_snapshots(developer_id);
CREATE INDEX idx_metrics_team ON metrics_snapshots(team_id);
CREATE INDEX idx_metrics_month ON metrics_snapshots(month);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_one_on_ones_updated_at BEFORE UPDATE ON one_on_ones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get current app user
CREATE OR REPLACE FUNCTION get_current_app_user()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM app_users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's team_id
CREATE OR REPLACE FUNCTION get_user_team_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT team_id FROM app_users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM app_users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'manager' FROM app_users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user manages a team
CREATE OR REPLACE FUNCTION manages_team(user_id UUID, team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams
        WHERE id = team_id AND manager_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
