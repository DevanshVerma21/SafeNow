-- SOS Emergency Response Platform - PostgreSQL schema
-- Created: 2025-10-08

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user', -- user, volunteer, ngo, admin, responder
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_location GEOGRAPHY(POINT, 4326), -- PostGIS optional; if not available, use json
  metadata JSONB DEFAULT '{}' -- for device info, preferences
);

-- SOS ALERTS
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- medical/disaster/safety
  status TEXT NOT NULL DEFAULT 'open', -- open, assigned, resolved, false_positive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  location JSONB NOT NULL, -- {"lat":..., "lng":..., "accuracy":...}
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT, -- otp, admin, ai
  attachments JSONB DEFAULT '[]', -- array of {url,type}
  note TEXT,
  assigned_to UUID, -- responder id
  route_trace JSONB DEFAULT '[]' -- optional live trace for responders
);

-- RESPONDERS
CREATE TABLE responders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_name TEXT,
  responder_type TEXT, -- volunteer, ngo, police, doctor
  contact JSONB,
  status TEXT DEFAULT 'available', -- available, busy, offline
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  last_location JSONB,
  capabilities JSONB DEFAULT '[]', -- e.g., ["medical","first-aid"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- OTP VERIFICATIONS / LOGS
CREATE TABLE otp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT,
  code TEXT,
  purpose TEXT, -- login, sos_verify
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  consumed BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  ip TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ADMIN ACTIONS / ASSIGNMENTS
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  alert_id UUID REFERENCES alerts(id),
  action_type TEXT, -- assign, unassign, close, flag
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ALERT ANALYTICS / METRICS (eventual aggregation table)
CREATE TABLE alert_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  event_type TEXT, -- created, assigned, responder_arrived, resolved, false_flag
  actor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- RATE LIMITING / REQUESTS (simplified)
CREATE TABLE request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  path TEXT,
  method TEXT,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_responders_status ON responders(status);

-- Sample view: open alerts with user info
CREATE VIEW open_alerts_view AS
SELECT a.id AS alert_id, a.type, a.status, a.created_at, a.location, u.id AS user_id, u.name, u.phone
FROM alerts a
JOIN users u ON u.id = a.user_id
WHERE a.status = 'open';
