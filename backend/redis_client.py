import os
try:
    import redis.asyncio as aioredis
except Exception:
    aioredis = None

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
redis = None

async def connect_redis():
    global redis
    if aioredis is None:
        return
    redis = aioredis.from_url(REDIS_URL)
    return redis

async def disconnect_redis():
    global redis
    if redis is None:
        return
    try:
        await redis.close()
    except Exception:
        pass

async def publish(channel: str, message: str):
    if redis is None:
        return
    try:
        await redis.publish(channel, message)
    except Exception:
        pass
