# 🔍 OTP Issue Troubleshooting Guide

## Current Status

✅ **Backend Server**: Running on http://localhost:8000  
✅ **Frontend Server**: Running on http://localhost:3000  
✅ **Demo Users**: 9 users loaded (1 admin, 3 volunteers, 5 citizens)  
✅ **Demo OTP**: `123456` for all demo users

## 📋 Manual Testing Steps

### Step 1: Open the Application
Navigate to: **http://localhost:3000**

### Step 2: Test Admin Login

1. **Enter phone number**: `+1234567890`
2. **Click** "Send OTP" or "Continue"
3. **Check for any error messages**

### Expected Behavior:
- ✅ No error message
- ✅ Button should work
- ✅ You should move to OTP input screen
- ✅ Backend console should show: `✓ Demo user login: +1234567890 - OTP: 123456`

### Step 3: Enter OTP

1. **Enter OTP**: `123456`
2. **Click** "Verify" or "Login"

### Expected Result:
- ✅ Success message: "Welcome Admin User! Logged in as admin"
- ✅ Redirect to: `/admin`
- ✅ Admin Dashboard displayed

## 🐛 If OTP Request Fails

### Check 1: Backend Running?
Open: http://localhost:8000/docs  
- ✅ Should show FastAPI Swagger documentation
- ❌ If not loading, backend is not running

### Check 2: Browser Console
Press `F12` → Go to **Console** tab
- Look for any red error messages
- Common errors:
  - `Network Error` → Backend not running
  - `CORS Error` → Backend CORS configuration issue
  - `404 Not Found` → Wrong API endpoint

### Check 3: Network Tab
Press `F12` → Go to **Network** tab
1. Try to send OTP
2. Look for the request to `/auth/request_otp`
3. Click on it to see:
   - **Status Code**: Should be `200`
   - **Response**: Should contain `{"status": "ok", ...}`

## 🔧 Quick Fixes

### Fix 1: Restart Backend
```powershell
# Stop current backend (in backend terminal, press Ctrl+C)
# Then restart:
cd D:\SOS\backend
python app.py
```

### Fix 2: Restart Frontend
```powershell
# Stop current frontend (in frontend terminal, press Ctrl+C)
# Then restart:
cd D:\SOS\frontend
npm start
```

### Fix 3: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload page (`Ctrl + R`)

### Fix 4: Check if using correct URL
Make sure you're accessing: **http://localhost:3000** (not https, not different port)

## 📱 Test All Demo Users

Once admin works, test these:

| Phone | Expected Role | OTP |
|-------|--------------|-----|
| +1234567890 | admin | 123456 |
| +1234567891 | volunteer | 123456 |
| +1234567892 | volunteer | 123456 |
| +1234567893 | volunteer | 123456 |
| +1234567894 | citizen | 123456 |

## 🔍 Backend Logs to Check

When you try to send OTP, the backend console should show:

```
✓ Demo user login: +1234567890 - OTP: 123456
INFO:     127.0.0.1:XXXXX - "POST /auth/request_otp HTTP/1.1" 200 OK
```

If you see:
```
→ Non-demo user login: +1234567890 - OTP: XXXXXX
```
This means the demo user check is failing (wrong phone format?).

## ❌ Common Issues & Solutions

### Issue 1: "Invalid OTP" Error
**Cause**: Using wrong OTP or OTP expired  
**Solution**: Always use `123456` for demo users

### Issue 2: "Network Error" or "Failed to fetch"
**Cause**: Backend not running or CORS issue  
**Solution**: 
- Check backend is running on port 8000
- Restart backend server

### Issue 3: Button doesn't do anything
**Cause**: JavaScript error or React not compiled  
**Solution**:
- Check browser console for errors
- Restart frontend (Ctrl+C then `npm start`)

### Issue 4: Phone number doesn't match
**Cause**: Extra spaces or wrong format  
**Solution**: Copy-paste exactly: `+1234567890`

## 🧪 Quick Backend API Test

Open a new PowerShell window and run:

```powershell
# Test 1: Check if backend is alive
Invoke-RestMethod -Uri "http://localhost:8000/docs" -Method GET

# Test 2: Request OTP for admin
$body = @{
    phone = "+1234567890"
    purpose = "login"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/auth/request_otp" -Method POST -Body $body -ContentType "application/json"
```

Expected output:
```json
{
  "status": "ok",
  "phone": "+1234567890",
  "otp_sample": "123456"
}
```

## 📞 What to Report if Still Failing

If OTP sending still fails, please provide:

1. **Exact error message** from the browser (screenshot preferred)
2. **Browser console output** (press F12, copy any red errors)
3. **Backend console output** (what shows when you try to send OTP)
4. **Network tab details**:
   - Request URL
   - Status code
   - Response data

## ✅ Success Indicators

You'll know OTP is working when:

1. ✅ No error toast/message appears
2. ✅ Screen changes to OTP input field
3. ✅ Backend console shows: `✓ Demo user login: +1234567890 - OTP: 123456`
4. ✅ Network tab shows 200 status code for `/auth/request_otp`

---

## 🚀 Quick Start (If Nothing Works)

1. **Stop everything**:
   - Close all terminals (Ctrl+C)
   - Close browser tabs

2. **Start backend**:
   ```powershell
   cd D:\SOS\backend
   python app.py
   ```
   Wait for: "✓ Demo data initialized successfully"

3. **Start frontend** (new terminal):
   ```powershell
   cd D:\SOS\frontend
   npm start
   ```
   Wait for browser to open automatically

4. **Test**:
   - Phone: `+1234567890`
   - OTP: `123456`

---

**The backend is currently running and ready for testing!**  
Try logging in now at: http://localhost:3000
