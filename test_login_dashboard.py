import requests

# Step 1: Login to get a fresh token
login_url = "http://127.0.0.1:8000/auth/verify_otp"
login_data = {
    "phone": "+1234567890",
    "code": "123456"
}

try:
    login_response = requests.post(login_url, json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        token = token_data.get("access_token")
        print(f"Got token: {token}")
        
        # Step 2: Test dashboard with fresh token
        dashboard_url = "http://127.0.0.1:8000/alerts/user/dashboard"
        headers = {"Authorization": f"Bearer {token}"}
        
        dashboard_response = requests.get(dashboard_url, headers=headers)
        print(f"Dashboard Status: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            print(f"Dashboard Response: {dashboard_response.json()}")
        else:
            print(f"Dashboard Error: {dashboard_response.text}")
    else:
        print(f"Login Error: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")