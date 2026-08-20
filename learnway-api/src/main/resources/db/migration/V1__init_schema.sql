-- =====================================================================
-- LearnWay — initial schema
-- PostgreSQL (Neon). gen_random_uuid() is built into PG 13+.
-- =====================================================================

-- ─── USERS ───────────────────────────────────────────────────────────
CREATE TABLE users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              VARCHAR(255) UNIQUE NOT NULL,
    username           VARCHAR(100) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    avatar_url         VARCHAR(500),
    xp_total           INTEGER NOT NULL DEFAULT 0,
    streak_days        INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    daily_goal_minutes INTEGER NOT NULL DEFAULT 20,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STUDY SESSIONS ──────────────────────────────────────────────────
CREATE TABLE study_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at       TIMESTAMPTZ NOT NULL,
    ended_at         TIMESTAMPTZ,
    duration_minutes INTEGER,
    session_date     DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX idx_study_sessions_user_date ON study_sessions (user_id, session_date);

-- ─── TOPICS (trails) ─────────────────────────────────────────────────
CREATE TABLE topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    color_hex   VARCHAR(7),
    order_index INTEGER NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── SUBTOPICS ───────────────────────────────────────────────────────
CREATE TABLE subtopics (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id                 UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    slug                     VARCHAR(100) NOT NULL,
    title                    VARCHAR(200) NOT NULL,
    description              TEXT,
    order_index              INTEGER NOT NULL,
    prerequisite_subtopic_id UUID REFERENCES subtopics(id),
    UNIQUE (topic_id, slug)
);
CREATE INDEX idx_subtopics_topic ON subtopics (topic_id);

-- ─── LESSONS ─────────────────────────────────────────────────────────
CREATE TABLE lessons (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtopic_id       UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    title             VARCHAR(300) NOT NULL,
    theory_content    TEXT NOT NULL,
    xp_reward         INTEGER NOT NULL DEFAULT 10,
    difficulty_level  SMALLINT CHECK (difficulty_level BETWEEN 1 AND 5),
    order_index       INTEGER NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 15
);
CREATE INDEX idx_lessons_subtopic ON lessons (subtopic_id);

-- ─── LESSON QUESTIONS ────────────────────────────────────────────────
CREATE TABLE lesson_questions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_type    VARCHAR(50) NOT NULL,  -- MULTIPLE_CHOICE | DESCRIPTIVE | CODE_CHALLENGE
    question_text    TEXT NOT NULL,
    theory_hint      TEXT,
    order_index      INTEGER NOT NULL,
    xp_reward        INTEGER NOT NULL DEFAULT 5,
    difficulty_level SMALLINT CHECK (difficulty_level BETWEEN 1 AND 5)
);
CREATE INDEX idx_questions_lesson ON lesson_questions (lesson_id);

-- ─── QUESTION OPTIONS (multiple choice) ──────────────────────────────
CREATE TABLE question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_options_question ON question_options (question_id);

-- ─── CODE CHALLENGES ─────────────────────────────────────────────────
CREATE TABLE code_challenges (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id       UUID NOT NULL UNIQUE REFERENCES lesson_questions(id) ON DELETE CASCADE,
    initial_code      TEXT,
    solution_code     TEXT,
    test_cases        JSONB,
    language          VARCHAR(50) NOT NULL DEFAULT 'java',
    validation_prompt TEXT
);

-- ─── DESCRIPTIVE ANSWERS (reference key for AI) ──────────────────────
CREATE TABLE descriptive_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL UNIQUE REFERENCES lesson_questions(id) ON DELETE CASCADE,
    reference_answer    TEXT NOT NULL,
    evaluation_criteria TEXT
);

-- ─── USER LESSON PROGRESS ────────────────────────────────────────────
CREATE TABLE user_lesson_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status           VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED | IN_PROGRESS | COMPLETED
    score_percentage DECIMAL(5,2),
    completed_at     TIMESTAMPTZ,
    attempts         INTEGER NOT NULL DEFAULT 0,
    xp_earned        INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_progress_user ON user_lesson_progress (user_id);

-- ─── REVIEW SCHEDULES (SM-2 spaced repetition) ───────────────────────
CREATE TABLE review_schedules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    next_review_at   TIMESTAMPTZ NOT NULL,
    interval_days    INTEGER NOT NULL DEFAULT 1,
    ease_factor      DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    urgency_level    VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- OVERDUE | DUE_TODAY | NORMAL
    UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_reviews_user_due ON review_schedules (user_id, next_review_at);

-- ─── ACHIEVEMENTS ────────────────────────────────────────────────────
CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    xp_bonus    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_achievements (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ─── QUESTION ATTEMPTS (answer log: accuracy, speed, achievements) ───
CREATE TABLE question_attempts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES lesson_questions(id) ON DELETE CASCADE,
    lesson_id          UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_type      VARCHAR(50) NOT NULL,
    is_correct         BOOLEAN NOT NULL,
    score              INTEGER,             -- 0..100 (AI-graded); MC is 0 or 100
    xp_earned          INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempts_user ON question_attempts (user_id);
CREATE INDEX idx_attempts_user_question ON question_attempts (user_id, question_id);

-- ─── XP LEDGER (for weekly leaderboard + history charts) ─────────────
CREATE TABLE xp_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL,
    source      VARCHAR(50) NOT NULL,  -- LESSON | QUESTION | REVIEW | ACHIEVEMENT
    reference_id UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_xp_events_user_created ON xp_events (user_id, created_at);
