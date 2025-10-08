import math
from typing import Dict, Any, Optional
import os
import requests
from .eta_cache import get_cached, set_cached, get_cached_redis, set_cached_redis

GOOGLE_DIRECTIONS_KEY = os.environ.get('GOOGLE_DIRECTIONS_KEY')


def haversine_distance(lat1, lon1, lat2, lon2):
    # returns distance in meters
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def pick_nearest_responder(alert_loc: Dict[str, float], responders: list) -> Optional[Dict[str, Any]]:
    best = None
    best_dist = None
    for r in responders:
        loc = r.get('last_location') or {}
        try:
            rlat = float(loc.get('lat'))
            rlng = float(loc.get('lng'))
        except Exception:
            continue
        dist = haversine_distance(alert_loc['lat'], alert_loc['lng'], rlat, rlng)
        if best is None or dist < best_dist:
            best = r
            best_dist = dist
    return best


def estimate_eta_seconds(origin: Dict[str,float], dest: Dict[str,float]) -> Optional[int]:
    """
    Estimate ETA in seconds between origin and dest.
    If GOOGLE_DIRECTIONS_KEY is set, use Directions API. Otherwise fallback to simple speed-based estimate.
    origin/dest: {'lat':..,'lng':..}
    """
    try:
        key = f"eta:{origin['lat']},{origin['lng']}:{dest['lat']},{dest['lng']}"
        # check in-memory cache
        cached = get_cached(key)
        if cached is not None:
            return cached
        # check redis cache async (best-effort)
        try:
            r_cached = None
            import asyncio
            loop = asyncio.get_event_loop()
            r_cached = loop.run_until_complete(get_cached_redis(key))
            if r_cached:
                set_cached(key, r_cached)
                return r_cached
        except Exception:
            pass

        if GOOGLE_DIRECTIONS_KEY:
            url = 'https://maps.googleapis.com/maps/api/directions/json'
            params = {'origin': f"{origin['lat']},{origin['lng']}", 'destination': f"{dest['lat']},{dest['lng']}", 'key': GOOGLE_DIRECTIONS_KEY}
            resp = requests.get(url, params=params, timeout=5)
            data = resp.json()
            if data.get('routes'):
                sec = data['routes'][0]['legs'][0]['duration']['value']
                set_cached(key, int(sec))
                try:
                    loop.run_until_complete(set_cached_redis(key, int(sec)))
                except Exception:
                    pass
                return int(sec)
        # fallback: assume average speed 40 km/h -> ~11.11 m/s
        dist = haversine_distance(origin['lat'], origin['lng'], dest['lat'], dest['lng'])
        speed_m_s = 11.11
        eta = int(dist / speed_m_s)
        set_cached(key, eta)
        try:
            loop.run_until_complete(set_cached_redis(key, eta))
        except Exception:
            pass
        return eta
    except Exception:
        return None
