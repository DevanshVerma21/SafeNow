"""Simulate an alert and a responder heartbeat to test auto-assign.
Run with: python tools/simulate_auto_assign.py
"""
import time
import requests
import websocket
import threading

API = 'http://localhost:8000'

def listen_ws():
    # get token to include in ws connection
    # for demo, reuse the same auth flow
    try:
        otp_req = requests.post(f'{API}/auth/request_otp', json={'phone': 'ws_listener', 'purpose': 'login'})
        code = otp_req.json().get('otp_sample')
        verify = requests.post(f'{API}/auth/verify_otp', json={'phone': 'ws_listener', 'code': code})
        token = verify.json().get('access_token')
    except Exception:
        token = None
    url = 'ws://localhost:8000/ws/alerts'
    if token:
        url += f'?token={token}'
    ws = websocket.create_connection(url)
    while True:
        msg = ws.recv()
        print('WS:', msg)

def main():
    # start WS listener
    t = threading.Thread(target=listen_ws, daemon=True)
    t.start()

    # create a responder
    r = requests.post(f'{API}/responders/heartbeat', json={'user_id':'r1','responder_type':'volunteer','status':'available','location':{'lat':12.9716,'lng':77.5946}})
    print('responder:', r.json())

    # get an OTP for a phone and verify to obtain token
    phone = 'sim_phone'
    otp_req = requests.post(f'{API}/auth/request_otp', json={'phone': phone, 'purpose': 'login'})
    print('otp req:', otp_req.json())
    code = otp_req.json().get('otp_sample')
    verify = requests.post(f'{API}/auth/verify_otp', json={'phone': phone, 'code': code})
    token = verify.json().get('access_token')
    print('got token', token)

    # send an alert nearby using token
    headers = {'Authorization': f'Bearer {token}'}
    alert = requests.post(f'{API}/alerts', json={'type':'safety','note':'test','location':{'lat':12.9717,'lng':77.5947}}, headers=headers)
    print('alert:', alert.json())

    # wait to see assignment
    time.sleep(40)

if __name__ == '__main__':
    main()
