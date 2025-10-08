# Security & Privacy Notes (Prototype)

Core principles
- Encrypt data in transit: use HTTPS and WSS.
- Encrypt sensitive data at rest: use database encryption or application-level field encryption for PII and location traces.
- Role-based access control: use JWTs and middleware to restrict endpoints.
- Rate-limiting and anti-abuse: throttle OTP sends and alert creations per user/IP.

Verification & filtering
- OTP verification for login and critical SOS confirmation.
- Simple heuristics: block repeated alerts from same device within short windows; require re-OTP for frequent SOS.
- AI-based anomaly detection (future): ingest features like time-of-day, mobility patterns, duplicate geolocated alerts, message text similarity and model a fraud risk score.
- Admin flagging and appeals: admins can mark alerts as false; repeated false alerts lead to throttling/account suspension.

Privacy
- Location traces are time-limited (default retention 7 days) and encrypted.
- Only assigned responders and admin roles can access full trace; others see coarse location.
- Data minimization: store only required fields and use hashed identifiers when possible.
