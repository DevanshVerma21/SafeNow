import requests

# Test the dashboard endpoint with admin token
url = "http://127.0.0.1:8000/alerts/user/dashboard"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0wMDEiLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzU5MjIxMzA5fQ.xyqE4gHRcUfj4QJbH1vCqnlZ8z0XgvKbnfPjggI8n0Y"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")