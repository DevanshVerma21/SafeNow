# SOS Emergency Response — Prototype

This repository contains a prototype for a live SOS emergency detection and coordination platform.

Structure
- backend/: FastAPI backend (JWT mock, OTP demo, WebSocket alerts)
- frontend/: React (CRA) demo app with OTP login and SOS button
- db/: SQL schema for PostgreSQL
- docs/: research, architecture, security notes
- docker-compose.yml: local dev orchestration (Postgres, Redis, backend)

Quickstart (recommended: Docker Compose)

1) From PowerShell in project root:

```powershell
docker-compose up --build
```

2) Backend will be available at http://localhost:8000
3) Frontend: open `frontend` and run `npm install` then `npm start` or serve static build. (You can also use `serve -s build` after `npm run build`.)

Native Python (optional)

1) Create venv and install:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend/requirements.txt
```

2) Run backend:

```powershell
python -m backend.app
```

Notes
- The OTP and SMS are mocked for demo: OTP codes are returned in API response.
- The DB schema is in `db/schema.sql`. Use it to create tables in Postgres.

Testing auto-assign locally

1) Ensure backend is running (see `docker-compose up --build` or native run).
2) Start the frontend (`npm install` then `npm start`) and open the dashboard in your browser.
3) Use the Responder Panel on the dashboard to register a responder by entering lat/lng and clicking "Register Heartbeat".
4) Use the login flow to obtain a demo token, click SOS to send an alert near the responder coordinates.
5) Wait ~30 seconds for the backend auto-assigner to assign the nearest available responder; the map/list should update with assignment.

Automated simulation

Run the simulate test script to create a responder and an alert and observe assignment via WebSocket:

```powershell
python .\tools\simulate_auto_assign.py
```

