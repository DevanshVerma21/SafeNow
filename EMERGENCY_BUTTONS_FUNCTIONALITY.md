# Emergency Send Alert Buttons - Complete Functionality Guide

## 🚨 Overview

Each "Send Alert" button on the Emergency Page is now fully functional with specific actions tailored to the emergency type. The buttons send alerts, upload media, notify responders, and automatically connect to the appropriate emergency service.

---

## 📋 Emergency Button Functionality

### 1. 🩺 Medical Emergency (Red)
**Emergency Number**: `102` (Ambulance)

**When clicked**:
1. ✅ Sends alert with type: `medical`
2. ✅ Uploads captured photos and audio (if any)
3. ✅ Notifies all nearby medical responders via WebSocket
4. ✅ Shows: "🚑 Dispatching ambulance to your location!"
5. ✅ **Auto-calls 102** after 2 seconds
6. ✅ Admin dashboard shows alert in "Active Alerts"

**Use cases**:
- Heart attack
- Severe accident
- Unconscious person
- Heavy bleeding
- Breathing difficulty

**Priority**: CRITICAL (Highest)

---

### 2. 🔥 Fire Emergency (Orange)
**Emergency Number**: `101` (Fire Department)

**When clicked**:
1. ✅ Sends alert with type: `fire`
2. ✅ Uploads captured photos and audio (if any)
3. ✅ Notifies all nearby fire responders via WebSocket
4. ✅ Shows: "🚒 Fire department has been notified!"
5. ✅ **Auto-calls 101** after 2 seconds
6. ✅ Admin dashboard shows alert in "Active Alerts"

**Use cases**:
- Building fire
- Forest fire
- Gas leak
- Electrical fire
- Smoke detection

**Priority**: CRITICAL (Highest)

---

### 3. 🛡️ Security Threat (Blue)
**Emergency Number**: `100` (Police)

**When clicked**:
1. ✅ Sends alert with type: `security`
2. ✅ Uploads captured photos and audio (if any)
3. ✅ Notifies all nearby police/security responders via WebSocket
4. ✅ Shows: "🚓 Police have been alerted to your location!"
5. ✅ **Auto-calls 100** after 2.5 seconds
6. ✅ Admin dashboard shows alert in "Active Alerts"

**Use cases**:
- Theft or robbery
- Assault or threat
- Suspicious activity
- Breaking and entering
- Stalking or harassment

**Priority**: HIGH

---

### 4. ⚠️ General Emergency (Purple)
**Emergency Number**: `112` (Universal Emergency)

**When clicked**:
1. ✅ Sends alert with type: `general`
2. ✅ Uploads captured photos and audio (if any)
3. ✅ Notifies all nearby responders via WebSocket
4. ✅ Shows confirmation dialog: "Would you like to call emergency services (112) now?"
5. ✅ **Prompts user** to confirm before calling
6. ✅ Admin dashboard shows alert in "Active Alerts"

**Use cases**:
- Natural disasters (earthquake, flood)
- Lost person
- Animal attack
- Structural collapse
- Any emergency not covered above

**Priority**: MEDIUM

---

## 🔄 Complete Alert Flow

### Step 1: Media Capture (Optional)
```
User opens camera → Captures up to 3 photos → Camera auto-closes
OR
User uploads photos from device (max 3)
OR
User records audio / uploads audio file
```

### Step 2: Click Send Alert Button
```
User clicks appropriate emergency button (Medical/Fire/Security/General)
```

### Step 3: Alert Processing
```javascript
1. Validate location access ✓
2. Create alert with:
   - Emergency type (medical/fire/security/general)
   - User info (name, phone)
   - Location (GPS coordinates)
   - Timestamp
   - Urgency level
   - Description

3. Send alert via WebSocket to responders

4. Upload media to backend:
   POST /alerts/upload_media
   {
     alert_id: 12345,
     photos: [base64_photo1, base64_photo2, base64_photo3],
     audio: base64_audio
   }

5. Show success message with media count
```

### Step 4: Emergency Service Connection
```
Medical (102):
  → Wait 2 seconds
  → Show: "📞 Connecting to Ambulance Service (102)..."
  → Auto-initiate call: tel:102

Fire (101):
  → Wait 2 seconds
  → Show: "📞 Connecting to Fire Department (101)..."
  → Auto-initiate call: tel:101

Security (100):
  → Wait 2.5 seconds
  → Show: "📞 Connecting to Police (100)..."
  → Auto-initiate call: tel:100

General (112):
  → Wait 2 seconds
  → Show confirmation dialog
  → If YES: Call tel:112
  → If NO: Show "Alert sent. You can call 112 anytime if needed."
```

### Step 5: Admin Dashboard Update
```
Admin sees new alert in "Active Alerts" section with:
- Emergency type badge (color-coded)
- User information
- Location on map
- Timestamp
- 📎 Evidence Attached (photos + audio player)
- Status: Active
```

---

## 🎯 Button States

### Normal State
```
✅ Enabled - Green "Send Alert" button
✅ Shows emergency icon and description
✅ Clickable with hover effect
```

### Loading State
```
⏳ Disabled - Shows "Sending Alert..."
⏳ Opacity reduced
⏳ Not clickable
```

### Success State
```
✅ Toast notifications appear
✅ Button returns to normal
✅ Ready for next emergency if needed
```

### Error State
```
❌ Shows error toast
❌ Button returns to normal
❌ User can retry
```

---

## 🔐 Required Permissions

### Before Using Emergency Buttons:
1. **Location Access** (Required)
   - Browser will prompt for location permission
   - Alert cannot be sent without location
   - Error toast: "Location access required for emergency alerts"

2. **Camera Access** (Optional - for photos)
   - Only needed if capturing photos with camera
   - Can still upload photos from device without permission

3. **Microphone Access** (Optional - for audio)
   - Only needed if recording audio
   - Can still upload audio files without permission

---

## 📞 Emergency Numbers Reference

| Service | Number | Used For |
|---------|--------|----------|
| **Police** | 100 | Security threats, crimes |
| **Fire** | 101 | Fires, gas leaks |
| **Ambulance** | 102 | Medical emergencies |
| **Universal** | 112 | Any emergency (works from any phone) |

**Note**: Numbers are India-specific. For other countries:
- USA/Canada: 911
- UK: 999
- EU: 112
- Australia: 000

---

## 🧪 Testing Each Button

### Test Medical Emergency Button
1. Go to Emergency Page
2. (Optional) Capture 3 photos or record audio
3. Click **Medical Emergency** → "Send Alert"
4. ✅ Verify: Alert sent toast
5. ✅ Verify: "🚑 Dispatching ambulance to your location!"
6. ✅ Verify: "📞 Connecting to Ambulance Service (102)..."
7. ✅ Verify: Phone dialer opens with 102
8. ✅ Verify: Admin dashboard shows alert with media

### Test Fire Emergency Button
1. Go to Emergency Page
2. (Optional) Capture photos of fire/smoke
3. Click **Fire Emergency** → "Send Alert"
4. ✅ Verify: "🚒 Fire department has been notified!"
5. ✅ Verify: Phone dialer opens with 101
6. ✅ Verify: Admin dashboard shows alert

### Test Security Threat Button
1. Go to Emergency Page
2. (Optional) Capture evidence photos/audio
3. Click **Security Threat** → "Send Alert"
4. ✅ Verify: "🚓 Police have been alerted to your location!"
5. ✅ Verify: Phone dialer opens with 100
6. ✅ Verify: Admin dashboard shows alert

### Test General Emergency Button
1. Go to Emergency Page
2. (Optional) Capture relevant media
3. Click **General Emergency** → "Send Alert"
4. ✅ Verify: Confirmation dialog appears
5. ✅ Verify: If YES → Phone dialer opens with 112
6. ✅ Verify: If NO → Shows info message
7. ✅ Verify: Admin dashboard shows alert

---

## 🎨 Visual Indicators

### Color Coding
- 🔴 **Red** = Medical (Critical)
- 🟠 **Orange** = Fire (Critical)
- 🔵 **Blue** = Security (High)
- 🟣 **Purple** = General (Medium)

### Icons
- ❤️ Medical Emergency → Heart icon
- 🔥 Fire Emergency → Fire icon
- 🛡️ Security Threat → Shield icon
- ⚠️ General Emergency → Warning triangle icon

### Toast Notifications
- 🚑 Ambulance dispatching
- 🚒 Fire department notified
- 🚓 Police alerted
- 📞 Connecting to service
- ✅ Success messages
- ❌ Error messages

---

## 💾 Data Saved to Backend

Each alert saves:
```json
{
  "alert_id": 12345,
  "type": "medical",
  "title": "Medical Emergency",
  "description": "Emergency assistance needed: Heart attack, accident, severe injury",
  "location": {
    "latitude": 28.7041,
    "longitude": 77.1025
  },
  "userId": "user123",
  "userName": "John Doe",
  "userPhone": "+919876543210",
  "timestamp": "2025-10-09T10:30:00.000Z",
  "urgency": "critical",
  "status": "active",
  "photo_urls": [
    "/media/photos/alert_12345_photo_1.jpg",
    "/media/photos/alert_12345_photo_2.jpg",
    "/media/photos/alert_12345_photo_3.jpg"
  ],
  "audio_url": "/media/audio/alert_12345_audio.webm"
}
```

---

## 🛠️ Technical Implementation

### Frontend (EmergencyPage.js)
```javascript
// Emergency type definitions
const emergencyTypes = [
  {
    type: 'medical',
    emergencyNumber: '102',
    serviceType: 'Ambulance Service',
    urgency: 'critical',
    // ... other properties
  },
  // ... other types
];

// Handle emergency alert
const handleEmergencyAlert = async (emergencyType) => {
  // 1. Validate location
  // 2. Create alert
  // 3. Send via WebSocket
  // 4. Upload media
  // 5. Call emergency service
};
```

### Backend (app.py)
```python
# Upload media endpoint
@app.post("/alerts/upload_media")
async def upload_media(data: dict):
    # Save photos
    # Save audio
    # Return URLs
    
# Auto-cleanup after 30 minutes
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_media_cleanup())
```

---

## ✅ Success Criteria

All buttons working correctly when:
- ✅ Alert is created and sent via WebSocket
- ✅ Media (photos + audio) uploads successfully
- ✅ Appropriate emergency service is contacted
- ✅ Admin dashboard displays the alert
- ✅ Location is included in alert
- ✅ Toast notifications appear correctly
- ✅ Button states update properly
- ✅ Media auto-deletes after 30 minutes

---

## 🐛 Troubleshooting

### Button doesn't work
- ✅ Check location permission is granted
- ✅ Verify backend is running (localhost:8000)
- ✅ Check browser console for errors
- ✅ Ensure WebSocket is connected

### Phone dialer doesn't open
- ✅ Check browser allows tel: links
- ✅ Test on mobile device (works better than desktop)
- ✅ Verify emergency number is correct for your region

### Media not uploading
- ✅ Check backend is running
- ✅ Verify photos/audio were captured
- ✅ Check Network tab for failed requests
- ✅ Ensure media directory exists

### Alert not showing in admin dashboard
- ✅ Check WebSocket connection
- ✅ Refresh admin dashboard
- ✅ Check backend logs
- ✅ Verify alert was created in data/alerts.json

---

## 📱 Mobile vs Desktop Experience

### Mobile (Recommended)
- ✅ Camera works natively
- ✅ Phone dialer opens automatically
- ✅ Location access more accurate
- ✅ Touch-optimized buttons

### Desktop
- ✅ Camera works (if webcam available)
- ✅ Phone dialer may not work (use mobile phone separately)
- ✅ Location access via browser
- ✅ Mouse-optimized hover effects

---

## 🔒 Privacy & Security

### Data Retention
- 📸 Photos: Deleted after 30 minutes
- 🎤 Audio: Deleted after 30 minutes
- 📍 Location: Stored with alert (not deleted)
- 👤 User info: Stored with alert

### Access Control
- Only authenticated users can send alerts
- Only admins can view all alerts
- Responders see only active alerts
- Media URLs are public (for quick access)

---

## 🎓 User Guidelines

### Best Practices
1. **Always allow location access** - Critical for responder dispatch
2. **Capture evidence when safe** - Photos/audio help responders
3. **Choose correct emergency type** - Ensures right service responds
4. **Don't test with real emergency numbers** - Use in genuine emergencies only
5. **Keep phone charged** - Emergency calls need battery

### When to Use Each Button
- **Medical** → Life-threatening health issues
- **Fire** → Active fires, smoke, gas leaks
- **Security** → Crimes in progress, immediate threats
- **General** → Other urgent situations

---

## 📊 Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Medical button | ✅ Working | Calls 102 (Ambulance) |
| Fire button | ✅ Working | Calls 101 (Fire Dept) |
| Security button | ✅ Working | Calls 100 (Police) |
| General button | ✅ Working | Calls 112 (Universal) |
| Media upload | ✅ Working | Photos + audio |
| Location sharing | ✅ Working | GPS coordinates |
| Admin notification | ✅ Working | Real-time alerts |
| Auto-deletion | ✅ Working | 30-minute cleanup |

**All emergency buttons are fully functional!** 🎉
