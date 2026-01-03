// Database types matching the schema

export type UserRole = 'admin' | 'manager' | 'developer';
export type OneOnOneStatus = 'draft' | 'submitted' | 'reviewed' | 'completed';
export type QuestionType = 'rating_1_5' | 'rating_1_10' | 'text' | 'yes_no';
export type QuestionScope = 'company' | 'team';
export type QuestionCategory = 'research' | 'strategy' | 'core_qualities' | 'leadership' | 'technical';
export type AnswerSource = 'developer' | 'manager';
export type NoteType = 'developer_notes' | 'manager_feedback';
export type ActionStatus = 'pending' | 'in_progress' | 'completed';
export type NotificationType =
  | 'one_on_one_submitted'
  | 'one_on_one_reviewed'
  | 'one_on_one_completed'
  | 'action_item_assigned'
  | 'action_item_due_soon'
  | 'action_item_overdue'
  | 'one_on_one_reminder';

export interface Team {
  id: string;
  name: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OneOnOne {
  id: string;
  developer_id: string;
  manager_id: string;
  team_id: string;
  month_year: string; // Format: YYYY-MM
  session_number: number;
  title: string | null;
  status: OneOnOneStatus;
  created_at: string;
  updated_at: string;
  developer_submitted_at: string | null;
  manager_reviewed_at: string | null;
  completed_at: string | null;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  scope: QuestionScope;
  category: QuestionCategory | null;
  team_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  one_on_one_id: string;
  question_id: string;
  text_value: string | null;
  rating_value: number | null;
  answer_type: AnswerSource;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  one_on_one_id: string;
  content: string;
  note_type: NoteType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  one_on_one_id: string;
  description: string;
  status: ActionStatus;
  assigned_to: AnswerSource;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface MetricsSnapshot {
  id: string;
  one_on_one_id: string;
  developer_id: string;
  team_id: string;
  month_year: string;
  average_score: number | null;
  metric_data: Record<string, any> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  is_emailed: boolean;
  created_at: string;
  read_at: string | null;
}

// Extended types with relationships
export interface AppUserWithTeam extends AppUser {
  team?: Team;
}

export interface OneOnOneWithDetails extends OneOnOne {
  developer?: AppUser;
  manager?: AppUser;
  team?: Team;
  answers?: Answer[];
  notes?: Note[];
  action_items?: ActionItem[];
}
