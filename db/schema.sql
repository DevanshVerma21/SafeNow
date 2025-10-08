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
  type TEXT NOT NULL, -- medical/disaster/safety/fire/accident/crime
  status TEXT NOT NULL DEFAULT 'open', -- open, assigned, in_progress, done, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  location JSONB NOT NULL, -- {"lat":..., "lng":..., "accuracy":..., "address":...}
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT, -- otp, admin, ai
  attachments JSONB DEFAULT '[]', -- array of {url,type}
  note TEXT,
  assigned_to UUID, -- responder id
  route_trace JSONB DEFAULT '[]', -- optional live trace for responders
  severity INTEGER DEFAULT 3, -- 1-5 scale
  eta_minutes INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE,
  marked_done_at TIMESTAMP WITH TIME ZONE, -- When marked as done by responder
  auto_delete_at TIMESTAMP WITH TIME ZONE -- Scheduled deletion time (done + delay)
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

-- EMERGENCY CONTACTS
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT, -- family, friend, doctor, etc.
  priority INTEGER DEFAULT 1, -- 1=primary, 2=secondary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ALERT CATEGORIES & SEVERITY
CREATE TABLE alert_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  severity_level INTEGER NOT NULL, -- 1-5 scale
  response_time_target INTEGER, -- minutes
  auto_escalate_after INTEGER, -- minutes
  required_responder_types JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RESPONDER AVAILABILITY SCHEDULES
CREATE TABLE responder_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  responder_id UUID REFERENCES responders(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- REAL-TIME CHAT/COMMUNICATION
CREATE TABLE alert_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message_type TEXT DEFAULT 'text', -- text, image, location, audio
  content TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_by JSONB DEFAULT '[]' -- array of user_ids who read the message
);

-- USER SESSIONS & DEVICE MANAGEMENT
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  device_info JSONB,
  access_token_hash TEXT,
  refresh_token_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- COMPREHENSIVE AUDIT LOG
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT, -- users, alerts, responders
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RESPONSE TIME TRACKING
CREATE TABLE response_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES responders(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  en_route_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER,
  distance_km DECIMAL(10,3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Validation Constraints
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'volunteer', 'ngo', 'admin', 'responder'));
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT check_phone_format CHECK (phone ~* '^\+?[1-9]\d{1,14}$');

ALTER TABLE alerts ADD CONSTRAINT check_alert_type CHECK (type IN ('medical', 'disaster', 'safety', 'fire', 'accident', 'crime'));
ALTER TABLE alerts ADD CONSTRAINT check_alert_status CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'false_positive', 'cancelled'));
ALTER TABLE alerts ADD CONSTRAINT check_location_format CHECK (
  location ? 'lat' AND location ? 'lng' AND 
  (location->>'lat')::numeric BETWEEN -90 AND 90 AND
  (location->>'lng')::numeric BETWEEN -180 AND 180
);

ALTER TABLE responders ADD CONSTRAINT check_responder_type CHECK (responder_type IN ('volunteer', 'ngo', 'police', 'doctor', 'firefighter', 'paramedic', 'ambulance'));
ALTER TABLE responders ADD CONSTRAINT check_responder_status CHECK (status IN ('available', 'busy', 'offline', 'on_duty', 'off_duty'));

ALTER TABLE otp_logs ADD CONSTRAINT check_otp_purpose CHECK (purpose IN ('login', 'sos_verify', 'register', 'password_reset'));
ALTER TABLE admin_actions ADD CONSTRAINT check_action_type CHECK (action_type IN ('assign', 'unassign', 'close', 'flag', 'escalate', 'resolve'));
ALTER TABLE alert_events ADD CONSTRAINT check_event_type CHECK (event_type IN ('created', 'assigned', 'acknowledged', 'en_route', 'arrived', 'resolved', 'cancelled', 'escalated'));

-- Add Missing Foreign Key Constraints
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_assigned_to FOREIGN KEY (assigned_to) REFERENCES responders(id);
ALTER TABLE alerts ADD COLUMN category_id UUID REFERENCES alert_categories(id);
ALTER TABLE alerts ADD COLUMN severity INTEGER DEFAULT 3;
ALTER TABLE alerts ADD COLUMN eta_minutes INTEGER;
ALTER TABLE alerts ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;

-- Add Soft Delete Support
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE alerts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE responders ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Geographic Indexes and Enhanced Location Management
CREATE INDEX idx_users_location_gist ON users USING GIST(last_location);
CREATE INDEX idx_alerts_location_gin ON alerts USING GIN(location);
CREATE INDEX idx_responders_location_gin ON responders USING GIN(last_location);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_responders_status ON responders(status);

-- Additional Performance Indexes
CREATE INDEX idx_alerts_user_id_status ON alerts(user_id, status);
CREATE INDEX idx_alerts_type_created_at ON alerts(type, created_at);
CREATE INDEX idx_alerts_assigned_to ON alerts(assigned_to);
CREATE INDEX idx_alerts_category_severity ON alerts(category_id, severity);
CREATE INDEX idx_responders_type_status ON responders(responder_type, status);
CREATE INDEX idx_responders_user_id ON responders(user_id);
CREATE INDEX idx_alert_events_alert_id_type ON alert_events(alert_id, event_type);
CREATE INDEX idx_otp_logs_phone_purpose ON otp_logs(phone, purpose) WHERE NOT consumed;
CREATE INDEX idx_emergency_contacts_user_priority ON emergency_contacts(user_id, priority);
CREATE INDEX idx_responder_schedules_responder_day ON responder_schedules(responder_id, day_of_week);
CREATE INDEX idx_alert_messages_alert_created ON alert_messages(alert_id, created_at);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_response_metrics_alert_id ON response_metrics(alert_id);

-- Composite indexes for common queries
CREATE INDEX idx_alerts_location_status_type ON alerts USING GIN(location, status, type);
CREATE INDEX idx_responders_location_status_type ON responders USING GIN(last_location, status, responder_type);

-- Sample view: open alerts with user info
CREATE VIEW open_alerts_view AS
SELECT a.id AS alert_id, a.type, a.status, a.created_at, a.location, u.id AS user_id, u.name, u.phone
FROM alerts a
JOIN users u ON u.id = a.user_id
WHERE a.status = 'open';

-- Enhanced Views for Better Performance

-- Active responders with location view
CREATE VIEW active_responders_view AS
SELECT r.*, u.name, u.phone, u.email
FROM responders r
JOIN users u ON u.id = r.user_id
WHERE r.status IN ('available', 'on_duty') 
  AND r.last_heartbeat > now() - INTERVAL '10 minutes'
  AND u.deleted_at IS NULL
  AND r.deleted_at IS NULL;

-- Emergency dashboard view
CREATE VIEW emergency_dashboard_view AS
SELECT 
  a.id, a.type, a.status, a.severity, a.created_at,
  a.location, u.name as user_name, u.phone as user_phone,
  r.id as responder_id, ru.name as responder_name,
  EXTRACT(EPOCH FROM (now() - a.created_at))/60 as age_minutes,
  ac.name as category_name, ac.severity_level,
  ac.response_time_target
FROM alerts a
JOIN users u ON u.id = a.user_id
LEFT JOIN responders r ON r.id = a.assigned_to
LEFT JOIN users ru ON ru.id = r.user_id
LEFT JOIN alert_categories ac ON ac.id = a.category_id
WHERE a.status NOT IN ('resolved', 'false_positive')
  AND a.deleted_at IS NULL;

-- Response performance view
CREATE VIEW response_performance_view AS
SELECT 
  rm.alert_id,
  rm.responder_id,
  a.type as alert_type,
  a.severity,
  rm.response_time_seconds,
  rm.distance_km,
  CASE 
    WHEN rm.response_time_seconds <= (ac.response_time_target * 60) THEN 'on_time'
    ELSE 'delayed'
  END as performance_status
FROM response_metrics rm
JOIN alerts a ON a.id = rm.alert_id
LEFT JOIN alert_categories ac ON ac.id = a.category_id
WHERE rm.completed_at IS NOT NULL;

-- Sample Alert Categories Data
INSERT INTO alert_categories (name, severity_level, response_time_target, auto_escalate_after, required_responder_types) VALUES
('Life Threatening Emergency', 5, 5, 10, '["paramedic", "doctor", "ambulance"]'),
('Medical Emergency', 4, 10, 20, '["paramedic", "doctor"]'),
('Fire Emergency', 5, 8, 15, '["firefighter"]'),
('Crime in Progress', 4, 12, 25, '["police"]'),
('Natural Disaster', 5, 15, 30, '["volunteer", "ngo", "police"]'),
('Traffic Accident', 3, 15, 30, '["police", "paramedic"]'),
('Safety Concern', 2, 30, 60, '["volunteer", "police"]'),
('General Emergency', 3, 20, 40, '["volunteer", "ngo"]');
