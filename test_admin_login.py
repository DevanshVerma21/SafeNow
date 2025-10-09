import requests
import json

API_BASE = "http://localhost:8000"

print("=" * 60)
print("TESTING ADMIN LOGIN")
print("=" * 60)

# Test 1: Request OTP for admin
print("\n1. Requesting OTP for admin (+919876543210)...")
try:
    response = requests.post(f"{API_BASE}/auth/request_otp", json={
        "phone": "+919876543210",
        "purpose": "login"
    })
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Verify OTP and check role
print("\n2. Verifying OTP (123456) and checking role...")
try:
    response = requests.post(f"{API_BASE}/auth/verify_otp", json={
        "phone": "+919876543210",
        "code": "123456"
    })
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    
    # Check if role is admin
    if data.get('role') == 'admin':
        print("\n   ✅ SUCCESS! Role is correctly set to 'admin'")
    else:
        print(f"\n   ❌ ERROR! Expected role 'admin', but got '{data.get('role')}'")
        
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

# Test other roles
print("\n\nTesting other demo users:")
print("-" * 60)

test_users = [
    ("+1234567891", "volunteer", "John Doe"),
    ("+1234567894", "citizen", "Alice Brown"),
]

for phone, expected_role, expected_name in test_users:
    print(f"\nTesting {phone} (expected: {expected_role})...")
    try:
        # Request OTP
        requests.post(f"{API_BASE}/auth/request_otp", json={
            "phone": phone,
            "purpose": "login"
        })
        
        # Verify OTP
        response = requests.post(f"{API_BASE}/auth/verify_otp", json={
            "phone": phone,
            "code": "123456"
        })
        
        data = response.json()
        actual_role = data.get('role')
        actual_name = data.get('name')
        
        role_match = "✅" if actual_role == expected_role else "❌"
        name_match = "✅" if actual_name == expected_name else "❌"
        
        print(f"   {role_match} Role: {actual_role} (expected: {expected_role})")
        print(f"   {name_match} Name: {actual_name} (expected: {expected_name})")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
