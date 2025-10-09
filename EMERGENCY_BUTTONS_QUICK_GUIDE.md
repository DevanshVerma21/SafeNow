# 🚨 Emergency Alert Buttons - Quick Reference

## Button Actions Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMERGENCY PAGE BUTTONS                       │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  🩺 MEDICAL EMERGENCY (Red)                                           │
│  ├─ Calls: 102 (Ambulance)                                            │
│  ├─ Priority: CRITICAL                                                │
│  ├─ Auto-call: Yes (2 seconds)                                        │
│  └─ Use for: Heart attacks, accidents, severe injuries               │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  🔥 FIRE EMERGENCY (Orange)                                           │
│  ├─ Calls: 101 (Fire Department)                                      │
│  ├─ Priority: CRITICAL                                                │
│  ├─ Auto-call: Yes (2 seconds)                                        │
│  └─ Use for: Fires, gas leaks, smoke                                 │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  🛡️ SECURITY THREAT (Blue)                                            │
│  ├─ Calls: 100 (Police)                                               │
│  ├─ Priority: HIGH                                                    │
│  ├─ Auto-call: Yes (2.5 seconds)                                      │
│  └─ Use for: Theft, assault, suspicious activity                     │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  ⚠️ GENERAL EMERGENCY (Purple)                                        │
│  ├─ Calls: 112 (Universal Emergency)                                  │
│  ├─ Priority: MEDIUM                                                  │
│  ├─ Auto-call: Asks permission first                                  │
│  └─ Use for: Other urgent situations                                 │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 What Happens When You Click a Button?

```
┌──────────────────────────────────────────────────────────────────┐
│                        BUTTON CLICKED                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Alert                                             │
│  • Emergency type (medical/fire/security/general)                 │
│  • Your location (GPS)                                            │
│  • Your information                                               │
│  • Timestamp                                                      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: Send Alert via WebSocket                                │
│  • Notifies all nearby responders                                │
│  • Real-time notification                                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: Upload Media (if captured)                              │
│  • Photos (up to 3)                                               │
│  • Audio recording                                                │
│  • Saved to backend                                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4: Show Success Message                                     │
│  • "Alert sent with 3 photo(s) and audio!"                        │
│  • Specific message per emergency type                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5: Call Emergency Service                                   │
│                                                                   │
│  Medical  → "🚑 Dispatching ambulance..."   → Call 102           │
│  Fire     → "🚒 Fire department notified!" → Call 101           │
│  Security → "🚓 Police have been alerted!" → Call 100           │
│  General  → "Would you like to call 112?"  → Ask first           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  STEP 6: Admin Dashboard Update                                   │
│  • Alert appears in "Active Alerts"                               │
│  • Shows location on map                                          │
│  • Displays photos and audio                                      │
│  • Responders can view and respond                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📞 Emergency Numbers (India)

| Button | Service | Number | Auto-Call |
|--------|---------|--------|-----------|
| 🩺 Red | Ambulance | **102** | ✅ Yes (2s) |
| 🔥 Orange | Fire Dept | **101** | ✅ Yes (2s) |
| 🛡️ Blue | Police | **100** | ✅ Yes (2.5s) |
| ⚠️ Purple | Universal | **112** | ⚠️ Asks first |

---

## 🎯 Quick Usage Guide

### Before Clicking Button:
```
1. Allow location access          ← REQUIRED
2. Capture photos (optional)      ← Up to 3
3. Record audio (optional)        ← Evidence
```

### Click Button:
```
Choose emergency type → Click "Send Alert"
```

### After Clicking Button:
```
1. Alert sent ✅
2. Media uploaded ✅
3. Responders notified ✅
4. Phone dialer opens ✅
5. Talk to emergency service ✅
```

---

## 📸 Media Capture (Optional but Recommended)

```
┌─────────────────────────────────────────────────┐
│  PHOTOS                                          │
│  • Click "Open Camera"                           │
│  • Capture up to 3 photos                        │
│  • Camera auto-closes after 3rd photo ✨         │
│  • OR upload from device                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  AUDIO                                           │
│  • Click "Start Recording"                       │
│  • Speak / record evidence                       │
│  • Click "Stop Recording"                        │
│  • OR upload audio file                          │
└─────────────────────────────────────────────────┘
```

**Why capture media?**
- 📸 Visual evidence helps responders
- 🎤 Audio provides context
- 📍 Combined with location = complete picture
- ⚡ Faster, more effective response

---

## ⚡ Response Times

```
Medical Emergency (102):
└─ Alert sent → 0 seconds
└─ Media uploaded → ~2 seconds
└─ Auto-call initiated → 2 seconds
└─ Admin notified → Real-time (instant)

Fire Emergency (101):
└─ Same as above

Security Threat (100):
└─ Alert sent → 0 seconds
└─ Media uploaded → ~2 seconds
└─ Auto-call initiated → 2.5 seconds
└─ Admin notified → Real-time (instant)

General Emergency (112):
└─ Alert sent → 0 seconds
└─ Media uploaded → ~2 seconds
└─ Confirmation dialog → 2 seconds
└─ Call if confirmed → Immediate
```

---

## 🔐 Privacy & Safety

```
✅ Location shared only during emergency
✅ Photos auto-delete after 30 minutes
✅ Audio auto-delete after 30 minutes
✅ Only admins can view your alerts
✅ Encrypted transmission (HTTPS/WSS)
```

---

## 🎨 Button Colors Meaning

| Color | Priority | Response |
|-------|----------|----------|
| 🔴 Red | CRITICAL | Immediate dispatch |
| 🟠 Orange | CRITICAL | Immediate dispatch |
| 🔵 Blue | HIGH | Rapid response |
| 🟣 Purple | MEDIUM | Standard response |

---

## ✅ Success Indicators

After clicking a button, you should see:

```
✅ Toast: "Alert sent with X photo(s) and audio!"
✅ Toast: "🚑/🚒/🚓 [Service] has been notified!"
✅ Toast: "📞 Connecting to [Service] ([Number])..."
✅ Phone dialer opens automatically
✅ Button returns to normal state
```

---

## ❌ Troubleshooting

**Button doesn't work?**
- ✅ Check location permission is enabled
- ✅ Ensure internet connection
- ✅ Verify backend is running

**Phone doesn't dial?**
- ✅ Works best on mobile devices
- ✅ Desktop may not support tel: links
- ✅ Manually dial the number if needed

**Media not uploading?**
- ✅ Check backend is running (localhost:8000)
- ✅ Verify media was actually captured
- ✅ Check browser console for errors

---

## 📱 Best Experience

```
✅ Use on mobile phone (not desktop)
✅ Allow all permissions when asked
✅ Keep GPS enabled
✅ Ensure phone has charge
✅ Have clear view for photos
✅ Speak clearly for audio
```

---

## 🎓 When to Use Each Button

```
🩺 MEDICAL
   → Someone is unconscious
   → Heart attack symptoms
   → Severe bleeding
   → Can't breathe
   → Severe pain

🔥 FIRE
   → See flames
   → Smell gas leak
   → Lots of smoke
   → Burning building
   → Can't escape

🛡️ SECURITY
   → Being robbed
   → Someone attacked you
   → See a crime
   → Feel threatened
   → Stalker following

⚠️ GENERAL
   → Natural disaster
   → Lost/trapped
   → Other emergency
   → Not sure which type
   → Need help but not critical
```

---

## 💡 Pro Tips

```
1. Test your location permission BEFORE emergency
2. Practice capturing media (don't click Send)
3. Save emergency numbers in phone contacts
4. Tell family/friends about this feature
5. Don't use for non-emergencies (penalty may apply)
```

---

## 📊 System Status

```
✅ All 4 buttons working
✅ Media upload working
✅ Location tracking working
✅ Auto-call working
✅ Admin notifications working
✅ 30-minute auto-deletion working
```

**All systems operational!** 🎉

---

## 🆘 Remember

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  In a real emergency:                                │
│                                                      │
│  1. Stay calm                                        │
│  2. Ensure your safety first                         │
│  3. Click appropriate button                         │
│  4. Let responders come to you                       │
│  5. Stay on the phone with emergency services        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Your safety is our priority!** 🚨
