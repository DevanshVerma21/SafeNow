"""
Test script to verify Live Emergency Map functionality
This script will test the backend endpoints and WebSocket connection
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_map_functionality():
    print("=" * 60)
    print("TESTING LIVE EMERGENCY MAP FUNCTIONALITY")
    print("=" * 60)
    
    # Step 1: Request OTP
    print("\n1. Testing OTP Request...")
    try:
        response = requests.post(f"{BASE_URL}/auth/request_otp", json={
            "phone": "+1234567890",
            "purpose": "login"
        })
        print(f"   ✓ OTP Request: {response.status_code}")
        if response.status_code == 200:
            otp_data = response.json()
            print(f"   OTP Sample: {otp_data.get('otp_sample')}")
            otp_code = otp_data.get('otp_sample')
        else:
            print(f"   ✗ Failed: {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Step 2: Verify OTP and get token
    print("\n2. Testing OTP Verification...")
    try:
        response = requests.post(f"{BASE_URL}/auth/verify_otp", json={
            "phone": "+1234567890",
            "code": otp_code
        })
        print(f"   ✓ OTP Verify: {response.status_code}")
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get('access_token')
            user_id = auth_data.get('user_id')
            print(f"   Token: {token[:20]}...")
            print(f"   User ID: {user_id}")
        else:
            print(f"   ✗ Failed: {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 3: Create test alerts
    print("\n3. Creating Test Alerts...")
    test_alerts = [
        {
            "type": "medical",
            "location": {"lat": 28.6139, "lng": 77.2090, "accuracy": 10.0},  # New Delhi
            "note": "Medical emergency - chest pain"
        },
        {
            "type": "disaster",
            "location": {"lat": 28.6200, "lng": 77.2100, "accuracy": 15.0},  # Nearby location
            "note": "Fire in building"
        },
        {
            "type": "safety",
            "location": {"lat": 28.6100, "lng": 77.2000, "accuracy": 20.0},  # Another nearby location
            "note": "Suspicious activity"
        }
    ]
    
    created_alerts = []
    for alert_data in test_alerts:
        try:
            response = requests.post(
                f"{BASE_URL}/alerts",
                json=alert_data,
                headers=headers
            )
            if response.status_code == 200:
                alert = response.json()
                created_alerts.append(alert)
                print(f"   ✓ Created {alert_data['type']} alert at ({alert_data['location']['lat']}, {alert_data['location']['lng']})")
                print(f"     Alert ID: {alert['id'][:8]}...")
            else:
                print(f"   ✗ Failed to create {alert_data['type']} alert: {response.text}")
        except Exception as e:
            print(f"   ✗ Error creating alert: {e}")
    
    # Step 4: Test responder endpoints
    print("\n4. Testing Responder Registration...")
    try:
        # Register as responder
        response = requests.post(f"{BASE_URL}/auth/request_otp", json={
            "phone": "+9876543210",
            "purpose": "login"
        })
        if response.status_code == 200:
            resp_otp = response.json().get('otp_sample')
            
            response = requests.post(f"{BASE_URL}/auth/verify_otp", json={
                "phone": "+9876543210",
                "code": resp_otp
            })
            
            if response.status_code == 200:
                resp_token = response.json().get('access_token')
                resp_headers = {"Authorization": f"Bearer {resp_token}"}
                
                # Send responder heartbeat
                response = requests.post(
                    f"{BASE_URL}/responder/heartbeat",
                    json={
                        "location": {"lat": 28.6150, "lng": 77.2050},
                        "status": "available"
                    },
                    headers=resp_headers
                )
                if response.status_code == 200:
                    print(f"   ✓ Responder registered and active")
                    print(f"     Location: (28.6150, 77.2050)")
                else:
                    print(f"   ✗ Failed to register responder: {response.text}")
            else:
                print(f"   ✗ Failed responder OTP verification")
    except Exception as e:
        print(f"   ✗ Error with responder: {e}")
    
    # Step 5: Get all alerts
    print("\n5. Testing Alert Retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/alerts", headers=headers)
        if response.status_code == 200:
            alerts = response.json()
            print(f"   ✓ Retrieved {len(alerts)} alerts")
            for alert in alerts[:3]:  # Show first 3
                print(f"     - {alert.get('type')} at ({alert.get('location', {}).get('lat')}, {alert.get('location', {}).get('lng')})")
        else:
            print(f"   ✗ Failed to retrieve alerts: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Step 6: WebSocket connection info
    print("\n6. WebSocket Connection Info...")
    print(f"   WebSocket URL: ws://localhost:8000/ws/alerts?token={token[:20]}...")
    print(f"   ✓ Connect from frontend using this token")
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"✓ Backend is running at: {BASE_URL}")
    print(f"✓ Created {len(created_alerts)} test alerts")
    print(f"✓ Alerts should be visible on map at:")
    for i, alert in enumerate(created_alerts, 1):
        loc = alert.get('location', {})
        print(f"   {i}. {alert.get('type')} - Lat: {loc.get('lat')}, Lng: {loc.get('lng')}")
    print(f"\n✓ Frontend should be running at: http://localhost:3000")
    print(f"✓ Login with phone: +1234567890")
    print(f"✓ Use OTP: {otp_code}")
    print("\nMap Features to Test:")
    print("  - Markers should appear at the specified locations")
    print("  - Click markers to see alert details")
    print("  - Toggle 'Alerts' and 'Responders' buttons")
    print("  - Map should center on your location (if permission granted)")
    print("  - Legend should show marker types")
    print("  - Stats overlay should show counts")
    print("=" * 60)

if __name__ == "__main__":
    test_map_functionality()
