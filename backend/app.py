from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List
from datetime import datetime, timedelta
import uvicorn
from backend.auth import create_access_token, verify_token, mock_send_otp, verify_otp_code
from backend.schemas import UserCreate, OTPRequest, OTPVerify, AlertCreate, AlertOut, AlertStatusUpdate
import uuid
import asyncio
from backend.db import database
from backend.utils import pick_nearest_responder, estimate_eta_seconds
from backend.redis_client import connect_redis, disconnect_redis, publish
from backend import redis_client as redis_client_module
from backend.demo_data import (
    initialize_demo_data, 
    load_alerts, 
    save_alerts, 
    load_users, 
    save_users,
    get_user_by_phone,
    is_demo_user,
    get_demo_otp,
    get_user_role,
    DEMO_USERS
)
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

# Load persistent data on startup
USERS = {}
ALERTS = {}
CONNECTED_WEBSOCKETS: List[WebSocket] = []
RESPONDERS = {}


@app.post('/auth/request_otp')
async def request_otp(req: OTPRequest):
    # Check if this is a demo user
    if is_demo_user(req.phone):
        code = get_demo_otp()
        print(f"✓ Demo user login: {req.phone} - OTP: {code}")
    else:
        # send OTP via mock function and log
        code = mock_send_otp(req.phone, purpose=req.purpose)
        print(f"→ Non-demo user login: {req.phone} - OTP: {code}")
    
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
    # Check if demo user with demo OTP
    if is_demo_user(v.phone) and v.code == get_demo_otp():
        ok = True
    else:
        ok = verify_otp_code(v.phone, v.code)
    
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    # Get user from demo data or create new
    demo_user = get_user_by_phone(v.phone)
    if demo_user:
        user_id = demo_user["id"]
        user_role = demo_user["role"]
        user_name = demo_user.get("name", "User")
        # Store in USERS dict
        USERS[v.phone] = demo_user
    else:
        # create or fetch user in DB
        select_q = "SELECT id FROM users WHERE phone = :phone"
        user = None
        try:
            user = await database.fetch_one(select_q, values={"phone": v.phone})
        except Exception:
            user = None

        if user is None:
            user_id = str(uuid.uuid4())
            user_role = "citizen"
            user_name = "User"
            insert_q = "INSERT INTO users (id, phone, is_verified, created_at, updated_at) VALUES (:id, :phone, true, now(), now())"
            try:
                await database.execute(insert_q, values={"id": user_id, "phone": v.phone})
            except Exception:
                # Fallback to in-memory
                USERS[v.phone] = {
                    "id": user_id,
                    "phone": v.phone,
                    "name": user_name,
                    "role": user_role,
                    "is_verified": True
                }
        else:
            user_id = str(user[0])
            user_role = "citizen"
            user_name = "User"

    token = create_access_token({
        "sub": user_id, 
        "phone": v.phone, 
        "role": user_role,
        "name": user_name
    })
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user_id": user_id,
        "role": user_role,
        "name": user_name
    }


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    return payload


@app.post('/alerts', response_model=AlertOut)
async def create_alert(a: AlertCreate, user=Depends(get_current_user)):
    alert_id = str(uuid.uuid4())
    alert = a.dict()
    alert.update({"id": alert_id, "user_id": user.get('sub'), "status": "pending", "created_at": None})
    
    # Always persist to DB first (with fallback to memory for demo)
    insert_q = """INSERT INTO alerts (id, user_id, type, status, created_at, updated_at, location, 
                  verified, verification_method, attachments, note, severity) 
                  VALUES (:id, :user_id, :type, :status, now(), now(), :location, false, null, :attachments, :note, :severity)"""
    try:
        await database.execute(insert_q, values={
            "id": alert_id,
            "user_id": alert['user_id'],
            "type": alert['type'],
            "status": alert['status'],
            "location": alert['location'],
            "attachments": alert.get('attachments', []),
            "note": alert.get('note'),
            "severity": alert.get('severity', 3)
        })
        print(f"✅ Alert {alert_id} successfully saved to database")
    except Exception as e:
        print(f"⚠️ Database error, using fallback memory storage: {e}")
        # fallback to in-memory store for demo
        ALERTS[alert_id] = alert
    
    # Also save to persistent storage
    ALERTS[alert_id] = alert
    save_alerts(ALERTS)

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

    if alert.get('status') not in ['open', 'active']:
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


@app.get('/alerts/user/recent')
async def get_user_recent_alerts(user=Depends(get_current_user)):
    """Get user's own resolved alerts from the last 24 hours."""
    try:
        user_id = user.get('sub')
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        query = """SELECT a.*, u.phone as user_phone, u.name as user_name
                   FROM alerts a
                   LEFT JOIN users u ON a.user_id = u.id
                   WHERE a.user_id = :user_id
                     AND a.status IN ('resolved', 'done')
                     AND (a.resolved_at >= :cutoff_time OR a.marked_done_at >= :cutoff_time)
                   ORDER BY COALESCE(a.resolved_at, a.marked_done_at) DESC
                   LIMIT 20"""
        
        rows = await database.fetch_all(query, values={
            "user_id": user_id,
            "cutoff_time": cutoff_time
        })
        alerts = [dict(row) for row in rows]
        
        # Convert datetime objects to ISO strings
        for alert in alerts:
            for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at']:
                if alert.get(field):
                    alert[field] = alert[field].isoformat()
        
        print(f"✅ Retrieved {len(alerts)} recent resolved alerts for user {user_id}")
        return alerts
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        user_id = user.get('sub')
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        recent_alerts = []
        for alert in ALERTS.values():
            if alert.get('user_id') == user_id and alert.get('status') in ['resolved', 'done']:
                resolved_at = alert.get('resolved_at') or alert.get('marked_done_at')
                if resolved_at:
                    try:
                        resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                        if resolved_dt >= cutoff_time:
                            recent_alerts.append(alert)
                    except:
                        recent_alerts.append(alert)
        return recent_alerts


@app.get('/alerts/user/dashboard')
async def get_user_dashboard_alerts(user=Depends(get_current_user)):
    """Get user's alerts organized by status for dashboard display."""
    try:
        user_id = user.get('sub')
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Get pending/active alerts (not time limited)
        pending_query = """SELECT a.*, u.phone as user_phone, u.name as user_name
                          FROM alerts a
                          LEFT JOIN users u ON a.user_id = u.id
                          WHERE a.user_id = :user_id
                            AND a.status IN ('pending', 'assigned', 'in_progress')
                          ORDER BY a.created_at DESC
                          LIMIT 10"""
        
        # Get resolved alerts (last 24 hours)
        resolved_query = """SELECT a.*, u.phone as user_phone, u.name as user_name
                           FROM alerts a
                           LEFT JOIN users u ON a.user_id = u.id
                           WHERE a.user_id = :user_id
                             AND a.status IN ('resolved', 'done')
                             AND (a.resolved_at >= :cutoff_time OR a.marked_done_at >= :cutoff_time)
                           ORDER BY COALESCE(a.resolved_at, a.marked_done_at) DESC
                           LIMIT 10"""
        
        pending_rows = await database.fetch_all(pending_query, values={"user_id": user_id})
        resolved_rows = await database.fetch_all(resolved_query, values={
            "user_id": user_id,
            "cutoff_time": cutoff_time
        })
        
        pending_alerts = [dict(row) for row in pending_rows]
        resolved_alerts = [dict(row) for row in resolved_rows]
        
        # Convert datetime objects to ISO strings
        for alerts_list in [pending_alerts, resolved_alerts]:
            for alert in alerts_list:
                for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at']:
                    if alert.get(field):
                        alert[field] = alert[field].isoformat()
        
        result = {
            "pending": pending_alerts,
            "resolved": resolved_alerts,
            "summary": {
                "pending_count": len(pending_alerts),
                "resolved_count": len(resolved_alerts)
            }
        }
        
        print(f"✅ Retrieved dashboard alerts for user {user_id}: {len(pending_alerts)} pending, {len(resolved_alerts)} resolved")
        return result
        
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        user_id = user.get('sub')
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        pending_alerts = []
        resolved_alerts = []
        
        for alert in ALERTS.values():
            if alert.get('user_id') == user_id:
                if alert.get('status') in ['pending', 'assigned', 'in_progress']:
                    pending_alerts.append(alert)
                elif alert.get('status') in ['resolved', 'done']:
                    resolved_at = alert.get('resolved_at') or alert.get('marked_done_at')
                    if resolved_at:
                        try:
                            resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                            if resolved_dt >= cutoff_time:
                                resolved_alerts.append(alert)
                        except Exception as parse_error:
                            # If date parsing fails, include the alert anyway
                            resolved_alerts.append(alert)
        
        return {
            "pending": pending_alerts[:10],
            "resolved": resolved_alerts[:10],
            "summary": {
                "pending_count": len(pending_alerts),
                "resolved_count": len(resolved_alerts)
            }
        }


@app.get('/alerts')
async def list_alerts(status: str = "pending"):
    """Get all alerts with optional status filter. Defaults to pending alerts only."""
    try:
        # Always fetch from database for single source of truth
        if status == "pending":
            query = "SELECT * FROM alerts WHERE status IN ('pending', 'assigned', 'in_progress') ORDER BY created_at DESC"
        else:
            query = "SELECT * FROM alerts ORDER BY created_at DESC"
        
        rows = await database.fetch_all(query)
        alerts = [dict(row) for row in rows]
        print(f"✅ Retrieved {len(alerts)} alerts from database (status filter: {status})")
        
        # Convert datetime objects to ISO strings for JSON serialization
        for alert in alerts:
            for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at', 'auto_delete_at']:
                if alert.get(field):
                    alert[field] = alert[field].isoformat()
        
        return alerts
    except Exception as e:
        print(f"⚠️ Database error, using fallback memory storage: {e}")
        # Fallback to in-memory storage
        if status == "pending":
            return [alert for alert in ALERTS.values() if alert.get('status') in ['pending', 'assigned', 'in_progress']]
        return list(ALERTS.values())


@app.get('/alerts/open')
async def get_open_alerts(user=Depends(get_current_user)):
    """Get all pending/active alerts for admin dashboard."""
    try:
        query = """SELECT a.*, u.phone as user_phone, u.name as user_name
                   FROM alerts a
                   LEFT JOIN users u ON a.user_id = u.id
                   WHERE a.status IN ('pending', 'assigned', 'in_progress')
                   ORDER BY a.created_at DESC"""
        
        rows = await database.fetch_all(query)
        alerts = [dict(row) for row in rows]
        
        # Convert datetime objects to ISO strings
        for alert in alerts:
            for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at']:
                if alert.get(field):
                    alert[field] = alert[field].isoformat()
        
        print(f"✅ Retrieved {len(alerts)} active alerts for admin")
        return alerts
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        return [alert for alert in ALERTS.values() if alert.get('status') in ['pending', 'assigned', 'in_progress']]


@app.get('/alerts/recent')
async def get_recent_alerts(user=Depends(get_current_user)):
    """Get recently resolved alerts from the last 24 hours for admin dashboard."""
    try:
        # Calculate cutoff time (24 hours ago)
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        query = """SELECT a.*, u.phone as user_phone, u.name as user_name
                   FROM alerts a
                   LEFT JOIN users u ON a.user_id = u.id
                   WHERE a.status IN ('resolved', 'done')
                     AND (a.resolved_at >= :cutoff_time OR a.marked_done_at >= :cutoff_time)
                   ORDER BY COALESCE(a.resolved_at, a.marked_done_at) DESC
                   LIMIT 100"""
        
        rows = await database.fetch_all(query, values={"cutoff_time": cutoff_time})
        alerts = [dict(row) for row in rows]
        
        # Convert datetime objects to ISO strings
        for alert in alerts:
            for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at']:
                if alert.get(field):
                    alert[field] = alert[field].isoformat()
        
        print(f"✅ Retrieved {len(alerts)} recent resolved alerts (last 24 hours) for admin")
        return alerts
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        recent_alerts = []
        for alert in ALERTS.values():
            if alert.get('status') in ['resolved', 'done']:
                resolved_at = alert.get('resolved_at') or alert.get('marked_done_at')
                if resolved_at:
                    try:
                        resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                        if resolved_dt >= cutoff_time:
                            recent_alerts.append(alert)
                    except:
                        recent_alerts.append(alert)
        return recent_alerts


@app.get('/responders/active')
async def get_active_responders(user=Depends(get_current_user)):
    """Get all active responders for admin dashboard."""
    try:
        query = """SELECT r.*, u.name as name, u.phone, u.email,
                   COUNT(a.id) as assigned_alerts_count,
                   MAX(a.id) as current_alert_id
                   FROM responders r
                   LEFT JOIN users u ON r.user_id = u.id
                   LEFT JOIN alerts a ON a.assigned_responder_id = r.id 
                        AND a.status IN ('assigned', 'in_progress')
                   WHERE r.status = 'active'
                   GROUP BY r.id, u.name, u.phone, u.email
                   ORDER BY r.updated_at DESC"""
        
        rows = await database.fetch_all(query)
        responders = [dict(row) for row in rows]
        
        # Convert datetime objects to ISO strings
        for responder in responders:
            for field in ['created_at', 'updated_at']:
                if responder.get(field):
                    responder[field] = responder[field].isoformat()
        
        print(f"✅ Retrieved {len(responders)} active responders for admin")
        return responders
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        return [resp for resp in RESPONDERS.values() if resp.get('status') == 'active']


@app.put('/alerts/{alert_id}/mark-done')
async def mark_alert_done(alert_id: str, user=Depends(get_current_user)):
    """Mark an alert as resolved by a responder."""
    try:
        # First, get the current alert details
        alert_query = "SELECT * FROM alerts WHERE id = :alert_id"
        alert_row = await database.fetch_one(alert_query, values={"alert_id": alert_id})
        
        if not alert_row:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Update in database - Change status to 'resolved' and set resolvedAt timestamp
        resolved_time = datetime.utcnow()
        
        update_query = """UPDATE alerts 
                         SET status = 'resolved', 
                             resolved_at = :resolved_time,
                             marked_done_at = :resolved_time,
                             updated_at = now()
                         WHERE id = :alert_id"""
        
        result = await database.execute(update_query, values={
            "alert_id": alert_id,
            "resolved_time": resolved_time
        })
        
        if result:
            print(f"✅ Alert {alert_id} marked as resolved by user {user.get('sub', 'unknown')} - Will auto-delete after 24 hours")
            
            # Get updated alert data for broadcasting
            updated_alert = dict(alert_row)
            updated_alert.update({
                "status": "resolved",
                "resolved_at": resolved_time.isoformat(),
                "marked_done_at": resolved_time.isoformat()
            })
            
            # Broadcast comprehensive update to all connected clients
            broadcast_data = {
                "type": "alert_status_changed",
                "action": "marked_resolved",
                "alert": updated_alert,
                "alert_id": alert_id,
                "status": "resolved",
                "resolved_at": resolved_time.isoformat(),
                "marked_done_at": resolved_time.isoformat(),
                "marked_by": user.get('sub', 'unknown')
            }
            await broadcast_alert(broadcast_data)
            
            return {
                "success": True, 
                "message": "Alert marked as resolved and moved to history (will be deleted after 24 hours)", 
                "alert_id": alert_id,
                "status": "resolved",
                "resolved_at": resolved_time.isoformat(),
                "marked_done_at": resolved_time.isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Alert not found or already processed")
            
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        if alert_id in ALERTS:
            resolved_time = datetime.utcnow()
            ALERTS[alert_id]['status'] = 'resolved'
            ALERTS[alert_id]['resolved_at'] = resolved_time.isoformat()
            ALERTS[alert_id]['marked_done_at'] = resolved_time.isoformat()
            
            # Broadcast fallback update
            broadcast_data = {
                "type": "alert_status_changed",
                "action": "marked_resolved",
                "alert_id": alert_id,
                "status": "resolved",
                "resolved_at": ALERTS[alert_id]['resolved_at'],
                "marked_done_at": ALERTS[alert_id]['marked_done_at']
            }
            await broadcast_alert(broadcast_data)
            
            return {"success": True, "message": "Alert marked as resolved (memory)", "alert_id": alert_id}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")


@app.put('/alerts/{alert_id}/status')
async def update_alert_status(alert_id: str, status_update: AlertStatusUpdate, user=Depends(get_current_user)):
    """Update alert status with proper transitions."""
    try:
        # Get current alert to validate transition
        alert_query = "SELECT * FROM alerts WHERE id = :alert_id"
        alert_row = await database.fetch_one(alert_query, values={"alert_id": alert_id})
        
        if not alert_row:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        current_status = alert_row['status']
        new_status = status_update.status
        
        # Validate status transitions
        valid_transitions = {
            'pending': ['assigned', 'in_progress', 'resolved', 'cancelled'],
            'assigned': ['in_progress', 'resolved', 'cancelled'],
            'in_progress': ['resolved', 'cancelled'],
            'resolved': [],  # Cannot change from resolved
            'cancelled': []  # Cannot change from cancelled
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from '{current_status}' to '{new_status}'"
            )
        
        # Update in database
        update_fields = ["status = :status", "updated_at = now()"]
        update_values = {"alert_id": alert_id, "status": new_status}
        
        # Set resolved_at if marking as resolved
        if new_status == 'resolved':
            resolved_time = datetime.utcnow()
            update_fields.append("resolved_at = :resolved_time")
            update_fields.append("marked_done_at = :resolved_time")
            update_values["resolved_time"] = resolved_time
        
        update_query = f"UPDATE alerts SET {', '.join(update_fields)} WHERE id = :alert_id"
        
        result = await database.execute(update_query, values=update_values)
        
        if result:
            # Get updated alert data
            updated_alert_row = await database.fetch_one(alert_query, values={"alert_id": alert_id})
            updated_alert = dict(updated_alert_row)
            
            # Convert datetime objects to ISO strings
            for field in ['created_at', 'updated_at', 'resolved_at', 'marked_done_at']:
                if updated_alert.get(field):
                    updated_alert[field] = updated_alert[field].isoformat()
            
            # Broadcast update to all connected clients
            broadcast_data = {
                "type": "alert_status_changed",
                "action": "status_updated",
                "alert": updated_alert,
                "alert_id": alert_id,
                "old_status": current_status,
                "new_status": new_status,
                "note": status_update.note
            }
            await broadcast_alert(broadcast_data)
            
            print(f"✅ Alert {alert_id} status updated from '{current_status}' to '{new_status}'")
            return {
                "success": True, 
                "message": f"Alert status updated to {new_status}",
                "alert": updated_alert
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to update alert status")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        if alert_id in ALERTS:
            current_status = ALERTS[alert_id].get('status')
            
            # Apply same validation
            valid_transitions = {
                'pending': ['assigned', 'in_progress', 'resolved', 'cancelled'],
                'assigned': ['in_progress', 'resolved', 'cancelled'],
                'in_progress': ['resolved', 'cancelled'],
                'resolved': [],
                'cancelled': []
            }
            
            if status_update.status not in valid_transitions.get(current_status, []):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid status transition from '{current_status}' to '{status_update.status}'"
                )
            
            # Update in memory
            ALERTS[alert_id]['status'] = status_update.status
            if status_update.status == 'resolved':
                resolved_time = datetime.utcnow().isoformat()
                ALERTS[alert_id]['resolved_at'] = resolved_time
                ALERTS[alert_id]['marked_done_at'] = resolved_time
            
            # Broadcast update
            broadcast_data = {
                "type": "alert_status_changed",
                "action": "status_updated",
                "alert_id": alert_id,
                "old_status": current_status,
                "new_status": status_update.status,
                "note": status_update.note
            }
            await broadcast_alert(broadcast_data)
            
            return {
                "success": True, 
                "message": f"Alert status updated to {status_update.status} (memory)",
                "alert": ALERTS[alert_id]
            }
        else:
            raise HTTPException(status_code=404, detail="Alert not found")


@app.delete('/alerts/{alert_id}')
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    """Manually delete an alert."""
    try:
        # Delete from database
        delete_query = "DELETE FROM alerts WHERE id = :alert_id"
        result = await database.execute(delete_query, values={"alert_id": alert_id})
        
        if result:
            print(f"✅ Alert {alert_id} deleted from database")
            
            # Broadcast deletion to all clients
            alert_update = {
                "id": alert_id,
                "action": "deleted"
            }
            await broadcast_alert(alert_update)
            
            return {"success": True, "message": "Alert deleted", "alert_id": alert_id}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
            
    except Exception as e:
        print(f"⚠️ Database error: {e}")
        # Fallback to in-memory
        if alert_id in ALERTS:
            del ALERTS[alert_id]
            return {"success": True, "message": "Alert deleted (memory)", "alert_id": alert_id}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")


async def auto_delete_alert(alert_id: str, delay_seconds: int = 10):
    """Auto-delete alert after specified delay."""
    await asyncio.sleep(delay_seconds)
    try:
        delete_query = "DELETE FROM alerts WHERE id = :alert_id AND status = 'done'"
        result = await database.execute(delete_query, values={"alert_id": alert_id})
        if result:
            print(f"🗑️ Auto-deleted alert {alert_id} from database")
            
            # Broadcast deletion to all clients for real-time sync
            broadcast_data = {
                "type": "alert_deleted",
                "action": "auto_deleted",
                "alert_id": alert_id,
                "deleted_at": datetime.utcnow().isoformat()
            }
            await broadcast_alert(broadcast_data)
    except Exception as e:
        print(f"⚠️ Auto-delete error: {e}")


async def auto_delete_alert_memory(alert_id: str, delay_seconds: int = 10):
    """Auto-delete alert from memory after specified delay."""
    await asyncio.sleep(delay_seconds)
    if alert_id in ALERTS and ALERTS[alert_id].get('status') == 'done':
        del ALERTS[alert_id]
        print(f"🗑️ Auto-deleted alert {alert_id} from memory")


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
    global USERS, ALERTS
    
    # Initialize demo data and load persistent storage
    USERS, ALERTS = initialize_demo_data()
    
    try:
        await database.connect()
        print("✅ Database connected")
    except Exception as e:
        print(f'⚠️ Database connection failed: {e}')
        print('🔄 Continuing in demo mode with in-memory storage')
    
    # connect redis
    try:
        await connect_redis()
        print("✅ Redis connected")
        # start redis subscriber task
        asyncio.create_task(_redis_subscriber())
    except Exception as e:
        print(f'⚠️ Redis connection failed: {e}')
        print('Running single-instance mode')
    
    # Start background cleanup task
    asyncio.create_task(periodic_cleanup())
    print("🧹 Started periodic cleanup task")


@app.on_event('shutdown')
async def shutdown():
    global ALERTS, USERS
    
    # Save data before shutdown
    print("💾 Saving data before shutdown...")
    save_alerts(ALERTS)
    save_users(USERS)
    print("✅ Data saved successfully")
    
    try:
        await database.disconnect()
        print("✅ Database disconnected")
    except Exception:
        pass
    
    try:
        await disconnect_redis()
        print("✅ Redis disconnected")
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


async def cleanup_old_resolved_alerts():
    """Delete resolved alerts older than 24 hours."""
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Delete from database
        delete_query = """DELETE FROM alerts 
                         WHERE status IN ('resolved', 'done')
                         AND (resolved_at < :cutoff_time OR marked_done_at < :cutoff_time)"""
        
        result = await database.execute(delete_query, values={"cutoff_time": cutoff_time})
        
        if result > 0:
            print(f"🧹 Deleted {result} resolved alerts older than 24 hours")
        
        # Also clean up in-memory storage
        alerts_to_delete = []
        for alert_id, alert in ALERTS.items():
            if alert.get('status') in ['resolved', 'done']:
                resolved_at = alert.get('resolved_at') or alert.get('marked_done_at')
                if resolved_at:
                    try:
                        resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                        if resolved_dt < cutoff_time:
                            alerts_to_delete.append(alert_id)
                    except:
                        pass
        
        for alert_id in alerts_to_delete:
            del ALERTS[alert_id]
        
        if alerts_to_delete:
            save_alerts(ALERTS)
            print(f"🧹 Cleaned up {len(alerts_to_delete)} old resolved alerts from memory")
            
    except Exception as e:
        print(f"⚠️ Error during cleanup: {e}")


async def periodic_cleanup():
    """Background task to clean up alerts scheduled for deletion and old resolved alerts."""
    while True:
        try:
            # Run cleanup every hour
            await asyncio.sleep(3600)  # 3600 seconds = 1 hour
            
            print("🧹 Running hourly cleanup of old resolved alerts...")
            await cleanup_old_resolved_alerts()
                
        except Exception as e:
            print(f"⚠️ Cleanup task error: {e}")
            await asyncio.sleep(3600)  # Wait an hour on error before retrying


# Duplicate startup/shutdown removed - using the ones above with demo data initialization


if __name__ == '__main__':
    uvicorn.run('backend.app:app', host='0.0.0.0', port=8000, reload=True)
