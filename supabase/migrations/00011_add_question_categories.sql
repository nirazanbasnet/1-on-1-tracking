-- Add category column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;

-- Create enum type for question categories
DO $$ BEGIN
    CREATE TYPE question_category AS ENUM (
        'research',
        'strategy',
        'core_qualities',
        'leadership',
        'technical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update column to use enum
ALTER TABLE questions ALTER COLUMN category TYPE question_category USING category::question_category;
ALTER TABLE questions ALTER COLUMN category SET DEFAULT 'core_qualities'::question_category;

-- Delete existing questions to replace with categorized ones
DELETE FROM questions;

-- Insert categorized questions

-- RESEARCH CATEGORY (10 questions)
INSERT INTO questions (question_text, question_type, scope, category, sort_order) VALUES
('How effectively do you gather and analyze technical requirements?', 'rating_1_5', 'company', 'research', 1),
('Describe a time when thorough research prevented a technical problem.', 'text', 'company', 'research', 2),
('How do you approach investigating and debugging complex issues?', 'rating_1_5', 'company', 'research', 3),
('Share an example of how you researched a new technology before adopting it.', 'text', 'company', 'research', 4),
('How well do you analyze data to inform technical decisions?', 'rating_1_5', 'company', 'research', 5),
('Describe your process for understanding existing codebases.', 'text', 'company', 'research', 6),
('How do you investigate performance bottlenecks?', 'rating_1_5', 'company', 'research', 7),
('Share how you research best practices for new features or projects.', 'text', 'company', 'research', 8),
('How effectively do you document your technical findings?', 'rating_1_5', 'company', 'research', 9),
('Describe your approach to evaluating third-party libraries or tools.', 'text', 'company', 'research', 10);

-- STRATEGY CATEGORY (10 questions)
INSERT INTO questions (question_text, question_type, scope, category, sort_order) VALUES
('How do you align technical decisions with business goals?', 'rating_1_5', 'company', 'strategy', 11),
('Describe how you prioritize features and technical tasks.', 'text', 'company', 'strategy', 12),
('How effectively do you plan and architect solutions?', 'rating_1_5', 'company', 'strategy', 13),
('Share an example of balancing technical debt with new features.', 'text', 'company', 'strategy', 14),
('How do you contribute to technical roadmap planning?', 'rating_1_5', 'company', 'strategy', 15),
('Describe your approach to measuring the impact of your work.', 'text', 'company', 'strategy', 16),
('How well do you estimate and plan your work?', 'rating_1_5', 'company', 'strategy', 17),
('Share how you handle changing requirements or priorities.', 'text', 'company', 'strategy', 18),
('How do you make trade-offs between speed and quality?', 'rating_1_5', 'company', 'strategy', 19),
('Describe how you stay updated with industry trends and best practices.', 'text', 'company', 'strategy', 20);

-- CORE QUALITIES CATEGORY (10 questions)
INSERT INTO questions (question_text, question_type, scope, category, sort_order) VALUES
('How do you demonstrate attention to detail in your code?', 'rating_1_5', 'company', 'core_qualities', 21),
('Describe a situation where you had to adapt to significant technical changes.', 'text', 'company', 'core_qualities', 22),
('How do you approach problem-solving in complex technical challenges?', 'rating_1_5', 'company', 'core_qualities', 23),
('What methods do you use to stay organized and manage your workload?', 'text', 'company', 'core_qualities', 24),
('How do you handle constructive criticism and code review feedback?', 'rating_1_5', 'company', 'core_qualities', 25),
('Describe your communication style when working with cross-functional teams.', 'text', 'company', 'core_qualities', 26),
('How well do you understand and consider user impact in your work?', 'rating_1_5', 'company', 'core_qualities', 27),
('What drives your passion for engineering and continuous learning?', 'text', 'company', 'core_qualities', 28),
('How do you balance code quality with practical deadlines?', 'rating_1_5', 'company', 'core_qualities', 29),
('Describe how you collaborate and build relationships with teammates.', 'text', 'company', 'core_qualities', 30);

-- LEADERSHIP CATEGORY (8 questions)
INSERT INTO questions (question_text, question_type, scope, category, sort_order) VALUES
('How do you mentor and support junior engineers?', 'rating_1_5', 'company', 'leadership', 31),
('Describe a time when you led a technical initiative or project.', 'text', 'company', 'leadership', 32),
('How do you influence technical decisions and gain buy-in from stakeholders?', 'rating_1_5', 'company', 'leadership', 33),
('What is your approach to giving and receiving technical feedback?', 'text', 'company', 'leadership', 34),
('How do you foster a culture of engineering excellence within your team?', 'rating_1_5', 'company', 'leadership', 35),
('Describe how you handle conflicts or disagreements in technical discussions.', 'text', 'company', 'leadership', 36),
('How do you contribute to the growth and development of your team?', 'rating_1_5', 'company', 'leadership', 37),
('What leadership qualities do you want to develop further?', 'text', 'company', 'leadership', 38);

-- TECHNICAL CATEGORY (10 questions)
INSERT INTO questions (question_text, question_type, scope, category, sort_order) VALUES
('How proficient are you with your primary programming languages and frameworks?', 'rating_1_5', 'company', 'technical', 39),
('Describe how you stay current with new technologies and tools.', 'text', 'company', 'technical', 40),
('How well do you write clean, maintainable, and testable code?', 'rating_1_5', 'company', 'technical', 41),
('Share your approach to code reviews and quality assurance.', 'text', 'company', 'technical', 42),
('How comfortable are you with testing (unit, integration, e2e)?', 'rating_1_5', 'company', 'technical', 43),
('Describe your experience with deployment and DevOps practices.', 'text', 'company', 'technical', 44),
('How effectively do you optimize code for performance?', 'rating_1_5', 'company', 'technical', 45),
('Share a technical challenge you overcame and how you solved it.', 'text', 'company', 'technical', 46),
('How well do you understand system architecture and design patterns?', 'rating_1_5', 'company', 'technical', 47),
('Describe your experience with version control and collaboration workflows.', 'text', 'company', 'technical', 48);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Update updated_at trigger to include questions table if not already present
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
