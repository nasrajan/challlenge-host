-- Create Enums
CREATE TYPE challenge_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE participation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE aggregation_method AS ENUM ('SUM', 'AVERAGE', 'MAX', 'MIN');
CREATE TYPE role_name AS ENUM ('ROLE_USER', 'ROLE_ORGANIZER', 'ROLE_ADMIN');

-- Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- User Roles Mapping
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Challenges Table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    organizer_id INTEGER REFERENCES users(id),
    public_entry BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    approval_required BOOLEAN DEFAULT FALSE,
    leaderboard_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Challenge Metrics Table
CREATE TABLE challenge_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    aggregation_method VARCHAR(20) NOT NULL,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE
);

-- Scoring Brackets Table
CREATE TABLE scoring_brackets (
    id SERIAL PRIMARY KEY,
    min_value DOUBLE PRECISION NOT NULL,
    max_value DOUBLE PRECISION NOT NULL,
    points INTEGER NOT NULL,
    metric_id INTEGER REFERENCES challenge_metrics(id) ON DELETE CASCADE
);

-- Challenge Participants Table
CREATE TABLE challenge_participants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    challenge_id INTEGER REFERENCES challenges(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    joined_at TIMESTAMP NOT NULL,
    status_changed_at TIMESTAMP,
    status_changed_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, challenge_id)
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES challenge_participants(id) ON DELETE CASCADE,
    metric_id INTEGER REFERENCES challenge_metrics(id),
    value DOUBLE PRECISION NOT NULL,
    log_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Score Snapshots Table
CREATE TABLE score_snapshots (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES challenge_participants(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    snapshot_date TIMESTAMP NOT NULL
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_id BIGINT,
    performed_by INTEGER REFERENCES users(id),
    details TEXT,
    timestamp TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_participant_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_activity_log_participant ON activity_logs(participant_id);
CREATE INDEX idx_score_snapshot_date ON score_snapshots(snapshot_date);
