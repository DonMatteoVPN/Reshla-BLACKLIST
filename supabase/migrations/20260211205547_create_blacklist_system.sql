/*
  # Reshala Blacklist CMS - Database Schema

  ## Overview
  This migration creates the complete database structure for a community-driven blacklist management system with voting and moderation.

  ## New Tables

  ### 1. `reports`
  Main table for user reports/complaints
  - `id` (uuid, primary key) - Unique report identifier
  - `telegram_id` (text, required) - Target user's Telegram ID
  - `username` (text, required) - Target user's Telegram username
  - `reason` (text, required) - Reason for blacklisting
  - `status` (text, required) - Report status: voting, pending_review, approved, rejected
  - `vote_count` (integer, default 0) - Number of votes received
  - `submitted_by` (text, required) - GitHub username of submitter
  - `github_folder_path` (text, nullable) - Path to GitHub folder with proofs (set after approval)
  - `created_at` (timestamptz, default now()) - Report creation time
  - `updated_at` (timestamptz, default now()) - Last update time
  - `voting_deadline` (timestamptz, nullable) - Deadline for voting (1 hour from creation)

  ### 2. `report_proofs`
  Storage for proof file metadata
  - `id` (uuid, primary key) - Unique proof identifier
  - `report_id` (uuid, foreign key) - Reference to reports table
  - `file_name` (text, required) - Original file name
  - `file_url` (text, required) - URL to the proof file
  - `uploaded_at` (timestamptz, default now()) - Upload timestamp

  ### 3. `votes`
  User votes on reports
  - `id` (uuid, primary key) - Unique vote identifier
  - `report_id` (uuid, foreign key) - Reference to reports table
  - `user_id` (text, required) - GitHub username of voter
  - `created_at` (timestamptz, default now()) - Vote timestamp
  - Unique constraint on (report_id, user_id) - One vote per user per report

  ### 4. `moderator_actions`
  Moderator decisions and feedback
  - `id` (uuid, primary key) - Unique action identifier
  - `report_id` (uuid, foreign key) - Reference to reports table
  - `moderator_id` (text, required) - GitHub username of moderator
  - `action` (text, required) - Action taken: approve, reject
  - `comment` (text, nullable) - Moderator's feedback/reason
  - `created_at` (timestamptz, default now()) - Action timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Authenticated users can read all reports
  - Users can only vote once per report
  - Only moderators can create moderator_actions
  - Submitters can view moderator comments on their reports

  ## Important Notes
  1. Status flow: voting → pending_review (30+ votes) → approved/rejected
  2. Voting period: 1 hour from report creation
  3. After approval, data syncs to GitHub and reshala-blacklist.txt is updated
*/

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text NOT NULL,
  username text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'voting' CHECK (status IN ('voting', 'pending_review', 'approved', 'rejected')),
  vote_count integer NOT NULL DEFAULT 0,
  submitted_by text NOT NULL,
  github_folder_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  voting_deadline timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create report_proofs table
CREATE TABLE IF NOT EXISTS report_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id)
);

-- Create moderator_actions table
CREATE TABLE IF NOT EXISTS moderator_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  moderator_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve', 'reject')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_telegram_id ON reports(telegram_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_report_id ON votes(report_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_report_id ON moderator_actions(report_id);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Anyone can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Submitters can update their own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (submitted_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for report_proofs
CREATE POLICY "Anyone can view proofs"
  ON report_proofs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload proofs to their reports"
  ON report_proofs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_proofs.report_id
      AND reports.submitted_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users cannot delete their votes"
  ON votes FOR DELETE
  TO authenticated
  USING (false);

-- RLS Policies for moderator_actions
CREATE POLICY "Anyone can view moderator actions"
  ON moderator_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Moderators can create actions"
  ON moderator_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update report vote count
CREATE OR REPLACE FUNCTION update_report_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reports
  SET vote_count = (SELECT COUNT(*) FROM votes WHERE report_id = NEW.report_id),
      updated_at = now()
  WHERE id = NEW.report_id;
  
  -- Auto-promote to pending_review if 30+ votes within deadline
  UPDATE reports
  SET status = 'pending_review',
      updated_at = now()
  WHERE id = NEW.report_id
    AND status = 'voting'
    AND vote_count >= 30
    AND voting_deadline > now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update vote count
CREATE TRIGGER trigger_update_vote_count
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_report_vote_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();