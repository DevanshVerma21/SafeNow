from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List
import uvicorn
from .auth import create_access_token, verify_token, mock_send_otp, verify_otp_code
from .schemas import UserCreate, OTPRequest, OTPVerify, AlertCreate, AlertOut
import uuid
import asyncio
from .db import database
from .utils import pick_nearest_responder, estimate_eta_seconds
from .redis_client import connect_redis, disconnect_redis, publish
from . import redis_client as redis_client_module
import json


app = FastAPI(title="SOS Backend Prototype")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# In-memory stores for demo
USERS = {}
ALERTS = {}
CONNECTED_WEBSOCKETS: List[WebSocket] = []
RESPONDERS = {}


@app.post('/auth/request_otp')
async def request_otp(req: OTPRequest):
    # send OTP via mock function and log
    code = mock_send_otp(req.phone, purpose=req.purpose)
    # log OTP in db
    query = "INSERT INTO otp_logs (phone, code, purpose, created_at, expires_at, consumed, attempts) VALUES (:phone, :code, :purpose, now(), now() + interval '5 minutes', false, 0)"
    try:
        await database.execute(query, values={"phone": req.phone, "code": code, "purpose": req.purpose})
    except Exception:
        # DB may not be available in demo; ignore
        pass
    return {"status": "ok", "phone": req.phone, "otp_sample": code}


@app.post('/auth/verify_otp')
async def verify_otp(v: OTPVerify):
    ok = verify_otp_code(v.phone, v.code)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    # create or fetch user in DB
    select_q = "SELECT id FROM users WHERE phone = :phone"
    user = None
    try:
        user = await database.fetch_one(select_q, values={"phone": v.phone})
    except Exception:
        user = None

    if user is None:
        user_id = str(uuid.uuid4())
        insert_q = "INSERT INTO users (id, phone, is_verified, created_at, updated_at) VALUES (:id, :phone, true, now(), now())"
        try:
            await database.execute(insert_q, values={"id": user_id, "phone": v.phone})
        except Exception:
            # Fallback to in-memory
            USERS[v.phone] = user_id
    else:
        user_id = str(user[0])

    token = create_access_token({"sub": user_id, "phone": v.phone})
    return {"access_token": token, "token_type": "bearer", "user_id": user_id}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return payload


@app.post('/alerts', response_model=AlertOut)
async def create_alert(a: AlertCreate, user=Depends(get_current_user)):
    alert_id = str(uuid.uuid4())
    alert = a.dict()
    alert.update({"id": alert_id, "user_id": user.get('sub'), "status": "open", "created_at": None})
    # persist to DB
    insert_q = "INSERT INTO alerts (id, user_id, type, status, created_at, updated_at, location, verified, verification_method, attachments, note) VALUES (:id, :user_id, :type, :status, now(), now(), :location, false, null, :attachments, :note)"
    try:
        await database.execute(insert_q, values={
            "id": alert_id,
            "user_id": alert['user_id'],
            "type": alert['type'],
            "status": alert['status'],
            "location": alert['location'],
            "attachments": alert.get('attachments', []),
            "note": alert.get('note')
        })
    except Exception:
        # fallback to in-memory store
        ALERTS[alert_id] = alert

    # broadcast to connected websockets
    await broadcast_alert(alert)
    # schedule auto-assign after 30s in background
    asyncio.create_task(schedule_auto_assign(alert_id))
    return alert


async def schedule_auto_assign(alert_id: str, delay: int = 30):
    await asyncio.sleep(delay)
    # fetch alert from DB or memory
    alert = ALERTS.get(alert_id)
    if not alert:
        try:
            row = await database.fetch_one('SELECT id, location, status FROM alerts WHERE id = :id', values={'id': alert_id})
            if not row:
                return
            alert = dict(row)
            alert['location'] = alert.get('location')
        except Exception:
            return

    if alert.get('status') != 'open':
        return

    # gather available responders (simple: RESPONDERS in-memory or DB responders with status available)
    candidates = []
    # try DB first
    try:
        rows = await database.fetch_all("SELECT id, user_id, responder_type, status, last_location FROM responders WHERE status = 'available'")
        for r in rows:
            candidates.append(dict(r))
    except Exception:
        # fallback to in-memory
        for r in RESPONDERS.values():
            if r.get('status') == 'available':
                candidates.append(r)

    if not candidates:
        return

    # pick by ETA
    loc = alert.get('location')
    candidate = None
    best_eta = None
    from .utils import estimate_eta_seconds
    try:
        for c in candidates:
            rloc = c.get('last_location') or {}
            if not rloc.get('lat'):
                continue
            eta = estimate_eta_seconds({'lat': rloc.get('lat'), 'lng': rloc.get('lng')}, {'lat': loc.get('lat'), 'lng': loc.get('lng')})
            if eta is None:
                # fallback to haversine via pick_nearest_responder
                continue
            if best_eta is None or eta < best_eta:
                best_eta = eta
                candidate = c
    except Exception:
        candidate = pick_nearest_responder(loc, candidates)

    if not candidate:
        return

    responder_id = candidate.get('id')
    # assign in DB
    try:
        await database.execute('UPDATE alerts SET status = :status, assigned_to = :responder WHERE id = :id', values={'status': 'assigned', 'responder': responder_id, 'id': alert_id})
        # fetch full alert
        row = await database.fetch_one('SELECT id, user_id, type, status, location, assigned_to FROM alerts WHERE id = :id', values={'id': alert_id})
        to_broadcast = dict(row)
    except Exception:
        # fallback
        alert['status'] = 'assigned'
        alert['assigned_to'] = responder_id
        to_broadcast = alert

    # notify via websocket with full alert
    await broadcast_alert(to_broadcast)



@app.get('/alerts')
async def list_alerts():
    return list(ALERTS.values())


@app.websocket('/ws/alerts')
async def websocket_alerts(ws: WebSocket):
    # secure ws: expect token query param
    token = ws.query_params.get('token')
    if not token:
        await ws.close(code=4001)
        return
    try:
        verify_token(token)
    except Exception:
        await ws.close(code=4002)
        return
    await ws.accept()
    CONNECTED_WEBSOCKETS.append(ws)
    try:
        while True:
            data = await ws.receive_text()
            # For demo, echo back
            await ws.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        CONNECTED_WEBSOCKETS.remove(ws)


async def _redis_subscriber():
    """Subscribe to redis channel and rebroadcast messages locally."""
    if redis_client_module.redis is None:
        return
    try:
        sub = redis_client_module.redis.pubsub()
        await sub.subscribe('alerts')
        async for message in sub.listen():
            if message is None:
                continue
            if message['type'] != 'message':
                continue
            payload = message['data']
            if isinstance(payload, bytes):
                payload = payload.decode('utf-8')
            try:
                obj = json.loads(payload)
                # rebroadcast to local websockets
                for ws in list(CONNECTED_WEBSOCKETS):
                    try:
                        await ws.send_json(obj)
                    except Exception:
                        pass
            except Exception:
                pass
    except Exception:
        pass


@app.post('/responders/heartbeat')
async def responder_heartbeat(payload: dict):
    # payload: {id (optional), user_id, status, location}
    rid = payload.get('id') or str(uuid.uuid4())
    RESPONDERS[rid] = payload
    RESPONDERS[rid]['id'] = rid
    RESPONDERS[rid]['last_heartbeat'] = None
    # persist responder if DB available
    try:
        # upsert logic (simplified)
        await database.execute("INSERT INTO responders (id, user_id, responder_type, status, last_location, created_at, updated_at) VALUES (:id, :user_id, :responder_type, :status, :last_location, now(), now()) ON CONFLICT (id) DO UPDATE SET status = :status, last_location = :last_location, updated_at = now()", values={'id': rid, 'user_id': payload.get('user_id'), 'responder_type': payload.get('responder_type', 'volunteer'), 'status': payload.get('status','available'), 'last_location': payload.get('location')})
    except Exception:
        pass
    return {'id': rid}


@app.post('/responders/{responder_id}/accept')
async def responder_accept(responder_id: str, body: dict):
    # body: {alert_id}
    alert_id = body.get('alert_id')
    # verify alert exists and assigned to this responder
    try:
        row = await database.fetch_one('SELECT id, assigned_to, status FROM alerts WHERE id = :id', values={'id': alert_id})
        if not row:
            raise HTTPException(status_code=404, detail='Alert not found')
        if str(row['assigned_to']) != responder_id:
            raise HTTPException(status_code=403, detail='Not assigned to this responder')
        await database.execute('UPDATE alerts SET status = :status WHERE id = :id', values={'status': 'accepted', 'id': alert_id})
    except HTTPException:
        raise
    except Exception:
        # fallback to memory
        if ALERTS.get(alert_id) and ALERTS[alert_id].get('assigned_to') == responder_id:
            ALERTS[alert_id]['status'] = 'accepted'
        else:
            raise HTTPException(status_code=500, detail='DB error')

    await broadcast_alert({'id': alert_id, 'status': 'accepted', 'responder': responder_id})
    return {'status': 'accepted'}


@app.post('/responders/{responder_id}/decline')
async def responder_decline(responder_id: str, body: dict):
    alert_id = body.get('alert_id')
    try:
        row = await database.fetch_one('SELECT id, assigned_to FROM alerts WHERE id = :id', values={'id': alert_id})
        if not row:
            raise HTTPException(status_code=404, detail='Alert not found')
        if str(row['assigned_to']) != responder_id:
            raise HTTPException(status_code=403, detail='Not assigned to this responder')
        await database.execute('UPDATE alerts SET status = :status, assigned_to = NULL WHERE id = :id', values={'status': 'open', 'id': alert_id})
    except Exception:
        # fallback: mark open
        if ALERTS.get(alert_id):
            ALERTS[alert_id]['status'] = 'open'
            ALERTS[alert_id]['assigned_to'] = None
    # trigger another auto-assign
    asyncio.create_task(schedule_auto_assign(alert_id, delay=1))
    await broadcast_alert({'id': alert_id, 'status': 'open', 'assigned_to': None})
    return {'status': 'declined'}


@app.on_event('startup')
async def startup():
    try:
        await database.connect()
    except Exception:
        print('Could not connect to DB on startup; continuing in demo mode')
    # connect redis
    try:
        await connect_redis()
        # start redis subscriber task
        asyncio.create_task(_redis_subscriber())
    except Exception:
        print('Redis not available; running single-instance mode')


@app.on_event('shutdown')
async def shutdown():
    try:
        await database.disconnect()
    except Exception:
        pass
    try:
        await disconnect_redis()
    except Exception:
        pass


async def broadcast_alert(alert: dict):
    living = []
    # enrich alert with ETA where possible
    alert_out = dict(alert) if isinstance(alert, dict) else alert
    try:
        # If alert has an assigned responder, compute ETA from responder -> alert
        assigned = alert_out.get('assigned_to')
        if assigned:
            responder = None
            try:
                row = await database.fetch_one('SELECT id, last_location FROM responders WHERE id = :id', values={'id': assigned})
                if row:
                    responder = dict(row)
            except Exception:
                responder = None
            if not responder:
                responder = RESPONDERS.get(assigned)
            if responder and responder.get('last_location') and alert_out.get('location'):
                rloc = responder['last_location']
                eta = estimate_eta_seconds({'lat': rloc.get('lat'), 'lng': rloc.get('lng')}, {'lat': alert_out['location'].get('lat'), 'lng': alert_out['location'].get('lng')})
                if eta is not None:
                    alert_out['eta_seconds'] = eta
        else:
            # If unassigned, compute nearest available responder ETA (best-effort)
            candidates = []
            try:
                rows = await database.fetch_all("SELECT id, last_location FROM responders WHERE status = 'available' LIMIT 20")
                candidates = [dict(r) for r in rows]
            except Exception:
                candidates = [r for r in RESPONDERS.values() if r.get('status') == 'available']
            best_eta = None
            best_id = None
            for c in candidates:
                loc = c.get('last_location') or {}
                if not loc.get('lat'):
                    continue
                eta = estimate_eta_seconds({'lat': loc.get('lat'), 'lng': loc.get('lng')}, {'lat': alert_out.get('location', {}).get('lat'), 'lng': alert_out.get('location', {}).get('lng')})
                if eta is None:
                    continue
                if best_eta is None or eta < best_eta:
                    best_eta = eta
                    best_id = c.get('id')
            if best_eta is not None:
                alert_out['nearest_responder_eta'] = best_eta
                alert_out['nearest_responder_id'] = best_id
    except Exception:
        # best-effort: ignore ETA errors
        pass

    for ws in CONNECTED_WEBSOCKETS:
        try:
            await ws.send_json({"type": "new_alert", "alert": alert_out})
            living.append(ws)
        except Exception:
            pass
    # cleanup
    CONNECTED_WEBSOCKETS[:] = living
    # publish to redis channel for other instances
    try:
        await publish('alerts', json.dumps({"type": "new_alert", "alert": alert_out}))
    except Exception:
        pass


if __name__ == '__main__':
    uvicorn.run('backend.app:app', host='0.0.0.0', port=8000, reload=True)
