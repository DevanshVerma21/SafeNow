# Deployment Guide (Prototype -> Minimal Live)

1) Containerization
- Backend: Dockerfile provided in `backend/`. Frontend: build static files (`npm run build`) and serve via CDN or simple static host (Vercel/Netlify) or a small Nginx container.
- Compose (local): `docker-compose.yml` includes Postgres and Redis for local development.

2) Database
- Use managed Postgres (AWS RDS, Google Cloud SQL, ElephantSQL). Run `db/schema.sql` to create schema.

3) Secrets & env
- Store secrets in environment variables / secrets manager. Required envs: SOS_SECRET, DATABASE_URL, REDIS_URL, GOOGLE_MAPS_API_KEY, SMS_PROVIDER credentials.
- Optional: `GOOGLE_DIRECTIONS_KEY` - if provided the backend will call the Directions API to compute ETA for auto-assign; otherwise a distance/speed fallback is used.

4) Real-time
- Use Redis pub/sub for multi-instance WebSocket coordination. Consider Pusher, Ably, or Firebase Realtime for managed realtime.

5) Google Maps & Directions
- Obtain API key, enable Maps JavaScript API and Directions API. Add key to frontend env: REACT_APP_GOOGLE_MAPS_API_KEY.

6) OTP/SMS
- For production, use Twilio Verify or Firebase Phone Authentication. For small NGO deployments, consider local SMS gateways.

7) HTTPS
- Use a reverse proxy with TLS (Let's Encrypt) or a managed load balancer (AWS ALB) to terminate TLS.

8) Monitoring & CI/CD
- Add health checks, basic Prometheus metrics and logs via ELK/CloudWatch.
- For CI, GitHub Actions or GitLab CI to build images, run tests, and push to registry.
