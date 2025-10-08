import time
from typing import Optional
from . import redis_client

_CACHE = {}
_TTL = 60  # seconds

def _now():
    return int(time.time())

def get_cached(key: str) -> Optional[int]:
    item = _CACHE.get(key)
    if not item:
        return None
    val, exp = item
    if _now() > exp:
        _CACHE.pop(key, None)
        return None
    return val

def set_cached(key: str, value: int, ttl: int = _TTL):
    _CACHE[key] = (value, _now() + ttl)

async def get_cached_redis(key: str) -> Optional[int]:
    try:
        if redis_client.redis is None:
            return None
        v = await redis_client.redis.get(key)
        if not v:
            return None
        return int(v)
    except Exception:
        return None

async def set_cached_redis(key: str, value: int, ttl: int = _TTL):
    try:
        if redis_client.redis is None:
            return
        await redis_client.redis.set(key, str(value), ex=ttl)
    except Exception:
        pass
