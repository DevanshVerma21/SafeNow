# Demo Users for Testing

The system has been configured with demo users for easy testing. All demo users use the OTP: **123456**

## Login Credentials

### Admin Account
- **Phone:** +1234567890
- **Name:** Admin User
- **Role:** Admin
- **OTP:** 123456

### Volunteer Accounts

#### Medical Volunteer
- **Phone:** +1234567891
- **Name:** John Doe
- **Role:** Volunteer
- **Specialization:** Medical
- **OTP:** 123456

#### Fire Department Volunteer
- **Phone:** +1234567892
- **Name:** Jane Smith
- **Role:** Volunteer
- **Specialization:** Fire
- **OTP:** 123456

#### Police Volunteer
- **Phone:** +1234567893
- **Name:** Mike Johnson
- **Role:** Volunteer
- **Specialization:** Police
- **OTP:** 123456

### Citizen Accounts
- **Phone:** +1234567894 | **Name:** Alice Brown | **OTP:** 123456
- **Phone:** +1234567895 | **Name:** Bob Wilson | **OTP:** 123456
- **Phone:** +1234567896 | **Name:** Carol Davis | **OTP:** 123456
- **Phone:** +1234567897 | **Name:** David Miller | **OTP:** 123456
- **Phone:** +1234567898 | **Name:** Emma Garcia | **OTP:** 123456

## Features Implemented

### 1. Role-Based Authentication
- Login UI no longer shows role selection
- Role is automatically determined based on phone number
- Backend returns user's role, name, and ID on successful login

### 2. Persistent Data Storage
- All alerts are saved to `backend/../data/alerts.json`
- All user data is saved to `backend/../data/users.json`
- Data is automatically loaded on server startup
- Data is automatically saved on server shutdown
- Alerts are also saved immediately when created

### 3. Demo Mode
- Server displays a formatted table of all demo users on startup
- Demo users bypass the real OTP sending mechanism
- All demo users use OTP: 123456 for easy testing

## Testing Instructions

1. **Test Citizen Login:**
   - Go to http://localhost:3000
   - Enter: +1234567894
   - OTP: 123456
   - Should see: "Welcome Alice Brown! Logged in as citizen"

2. **Test Volunteer Login:**
   - Enter: +1234567891
   - OTP: 123456
   - Should see: "Welcome John Doe! Logged in as volunteer"

3. **Test Admin Login:**
   - Enter: +1234567890
   - OTP: 123456
   - Should see: "Welcome Admin User! Logged in as admin"

4. **Test Data Persistence:**
   - Login as a citizen (e.g., +1234567894)
   - Create an emergency alert
   - Stop the backend server (Ctrl+C)
   - Restart the backend server
   - The alert should still be visible on the map

## How It Works

### Authentication Flow
1. User enters phone number
2. Backend checks if it's a demo user
3. If demo user, returns OTP: 123456
4. User enters OTP
5. Backend verifies OTP and returns user data with role
6. Frontend stores user info and redirects based on role

### Data Persistence Flow
1. On server startup: Load alerts and users from JSON files
2. When alert created: Save immediately to JSON file
3. On server shutdown: Save all alerts and users to JSON files

### File Structure
```
SOS/
├── backend/
│   ├── app.py (main FastAPI app)
│   ├── demo_data.py (demo users & persistence)
│   └── ...
└── data/ (created automatically)
    ├── alerts.json (persistent alert storage)
    └── users.json (persistent user storage)
```

## Current Status
✅ Backend running: http://localhost:8000
✅ Frontend running: http://localhost:3000
✅ Demo data loaded: 9 users (1 admin, 3 volunteers, 5 citizens)
✅ Persistent storage: Alerts saved to JSON
✅ Role-based auth: Role determined by backend
✅ UI updated: Role selection removed from login page
