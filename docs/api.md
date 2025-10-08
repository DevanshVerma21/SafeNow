# API Endpoints (Prototype)

Auth
- POST /auth/request_otp {phone, purpose} -> {status, otp_sample}
- POST /auth/verify_otp {phone, code} -> {access_token, user_id}

Alerts
- POST /alerts (auth) {type, note, location, attachments} -> create alert and broadcast
- GET /alerts -> list alerts

Realtime
- WebSocket /ws/alerts -> push new alert events to connected clients

Admin (future)
- GET /admin/alerts
- POST /admin/alerts/{id}/assign {responder_id}
- GET /analytics/alerts

Responders
- GET /responders/nearby?lat=&lng=&radius=
- POST /responders/{id}/status {status, location}
 
Heartbeat & testing examples
- POST /responders/heartbeat
	- body: {"user_id":"uuid","responder_type":"volunteer","status":"available","location":{"lat":12.3,"lng":45.6}}
	- returns: {"id":"responder-id"}

Auto-assign test flow
1) Create an authenticated user and send an alert via POST /alerts.
2) Start one or more responders by POSTing to /responders/heartbeat with their `location` close to the alert.
3) If an admin doesn't assign within 30s, the backend auto-assigner will pick the nearest available responder and update alert to status `assigned`. WebSocket clients will receive a `new_alert` event with assigned info.

WebSocket payloads
- `new_alert` messages: { type: 'new_alert', alert: { id, user_id, type, status, location, assigned_to, eta_seconds?, nearest_responder_eta?, nearest_responder_id? } }

WebSocket connection
- Connect with a JWT as a query param: `ws://host/ws/alerts?token=<JWT>`. The server validates the token and closes the connection if invalid.

Notes
- All protected endpoints should require Bearer JWT token.
- WebSocket connections optionally accept a token param for auth (not in demo).
