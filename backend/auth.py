from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Dict
import random
import os

SECRET_KEY = os.environ.get('SOS_SECRET', 'dev-secret-for-demo')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# In-memory mock OTP store: phone -> code
_OTP_STORE: Dict[str, str] = {}


def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise Exception('Invalid token')


def mock_send_otp(phone: str, purpose: str = 'login') -> str:
    code = f"{random.randint(100000,999999)}"
    _OTP_STORE[phone] = code
    # In production, send via SMS provider. Here we log and return for demo.
    print(f"[MOCK OTP] phone={phone} code={code} purpose={purpose}")
    return code


def verify_otp_code(phone: str, code: str) -> bool:
    expected = _OTP_STORE.get(phone)
    if expected and expected == code:
        _OTP_STORE.pop(phone, None)
        return True
    return False
