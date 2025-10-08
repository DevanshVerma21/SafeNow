# SOS Emergency Response — System Architecture

Overview

This prototype uses a hybrid architecture designed for realtime alerts, secure role-based access, and easy extension to ML services for verification and analytics.

High-level components
- Frontend: React (Next.js) web app for login, SOS flow, dashboards and maps. Uses Google Maps JS SDK and WebSocket client for realtime feed.
- Backend API: FastAPI (Python) exposing REST endpoints + WebSocket endpoints for realtime alerts and responder updates. Uses JWT for auth.
- Database: PostgreSQL for relational data (users, alerts, assignments, analytics). Redis for pub/sub (realtime presence), caching, and rate-limiting.
- Auth/OTP: Firebase Auth (phone OTP) or Twilio Verify for SMS OTP in production. For demo, backend provides mock OTP and logs.
- Real-time: WebSockets (FastAPI + WebSocket) or Pusher/Ably for managed realtime. Redis pub/sub for scaling multiple backend instances.
- Maps/Routing: Google Maps JS API for maps and Directions API. OpenRouteService or Mapbox are alternatives.
- Storage: S3-compatible store (AWS S3 or MinIO) for attachments (photos, voice) with signed URLs.
- ML/Anomaly detection: Optional microservice (Python) that consumes alert streams and scores for anomaly/fraud.

Data flow (happy path)
1. User loads app -> immediate token-based session check. If not logged, shows OTP login.
2. User logs in with phone/email; receives OTP -> verify -> JWT issued.
3. User clicks SOS -> frontend collects high-accuracy geolocation, optional media, request OTP re-verify -> posts to /alerts.
4. Backend validates user, persists alert, publishes to Redis channel and sends WebSocket messages to nearby responders and admins.
5. Admin can view and assign responders via UI; if not assigned within 30s, auto-assigner runs nearest-responder algorithm using geolocation and responder availability.
6. Responder accepts task -> backend updates status; notification sent to user and admin.

Scaling & Security
- Use HTTPS everywhere, JWT tokens with short TTL and refresh tokens.
- Encrypt sensitive fields (PII, location traces) at rest using database-level encryption or application-level field encryption.
- Rate-limit OTP requests and alert creations per user/IP to prevent spam.
- Use Redis for ephemeral session and presence tracking to enable quick responder location updates.

Deployment
- Containerize backend and frontend. Use docker-compose for local dev (backend, db, redis, minio).
- Production: run backend in a K8s cluster (EKS/GKE/AKS) or managed containers (AWS ECS). PostgreSQL via RDS or Cloud SQL. Use managed SSL and secrets (AWS Secrets Manager).

Key APIs
- REST: /auth/otp, /auth/verify, /users/me, /alerts (CRUD), /responders, /admin/actions, /analytics
- WebSocket: /ws/alerts (realtime feed), /ws/responders (responder location updates)

Auto-assign algorithm (30s fallback)
1. Query available responders with recent heartbeat (<60s) within radius R.
2. Compute ETA using straight-line distance or Directions API for accurate ETA.
3. Score responders by ETA, capacity, role suitability (medical vs safety), and past reliability.
4. Assign top scorer and notify. If declines within X seconds, iterate to next.

Privacy notes
- Store only minimal traces. For sensitive traces, store encrypted per-alert keys and expiry (e.g., 7 days) then purge.
- Provide user ability to opt-in/opt-out of route sharing and data retention.
