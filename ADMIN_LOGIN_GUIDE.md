# 🔐 Admin Login Guide

## Step-by-Step Instructions

### ✅ Servers Status
- **Backend:** Running on http://localhost:8000
- **Frontend:** Running on http://localhost:3000

---

## 🎯 Login as Admin

### Step 1: Open the Application
Navigate to: **http://localhost:3000**

### Step 2: Enter Admin Phone Number
```
Phone Number: +1234567890
```
**Enter exactly:** `+1234567890`

Then click **"Continue"** or **"Send OTP"** button

### Step 3: Enter OTP
```
OTP Code: 123456
```
**Enter exactly:** `123456`

Then click **"Verify"** or **"Login"** button

---

## ✨ What to Expect

After successful login, you should see:
- ✅ Success message: **"Welcome Admin User! Logged in as admin"**
- 🎛️ Redirected to **Admin Dashboard**
- 👤 User info showing: **Admin User** (role: admin)

---

## 📋 Quick Reference - All Demo Users

| Role | Phone Number | Name | OTP |
|------|-------------|------|-----|
| 🔴 **Admin** | **+1234567890** | **Admin User** | **123456** |
| 🟢 Volunteer | +1234567891 | John Doe (Medical) | 123456 |
| 🟢 Volunteer | +1234567892 | Jane Smith (Fire) | 123456 |
| 🟢 Volunteer | +1234567893 | Mike Johnson (Police) | 123456 |
| 🔵 Citizen | +1234567894 | Alice Brown | 123456 |
| 🔵 Citizen | +1234567895 | Bob Wilson | 123456 |
| 🔵 Citizen | +1234567896 | Carol Davis | 123456 |
| 🔵 Citizen | +1234567897 | David Miller | 123456 |
| 🔵 Citizen | +1234567898 | Emma Garcia | 123456 |

---

## 🎬 Visual Walkthrough

```
┌─────────────────────────────────────┐
│   Emergency Response System         │
│              [SOS]                  │
│                                     │
│  Enter your phone number            │
│  ┌─────────────────────────────┐   │
│  │ +1234567890                 │   │ ← Type this
│  └─────────────────────────────┘   │
│                                     │
│         [Continue] ←─────────────── Click here
└─────────────────────────────────────┘

                  ↓ Wait for OTP screen ↓

┌─────────────────────────────────────┐
│   Emergency Response System         │
│              [SOS]                  │
│                                     │
│  Enter the verification code        │
│  ┌─────────────────────────────┐   │
│  │ 123456                      │   │ ← Type this
│  └─────────────────────────────┘   │
│                                     │
│         [Verify] ←──────────────── Click here
└─────────────────────────────────────┘

                  ↓ Success! ↓

┌─────────────────────────────────────┐
│  ✅ Welcome Admin User!             │
│     Logged in as admin              │
│                                     │
│     → Redirecting to Dashboard...   │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### If you see "Invalid OTP":
- Make sure you typed `123456` exactly (6 digits)
- Try copying: `123456` and pasting it

### If you see "Network Error":
- Check backend is running: http://localhost:8000/docs
- Check frontend is running: http://localhost:3000

### If login works but shows wrong role:
- The system automatically detects role from phone number
- +1234567890 should always show as **admin**

---

## 🎯 Ready to Test!

**Just copy these two values:**

1️⃣ Phone: `+1234567890`
2️⃣ OTP: `123456`

**Open:** http://localhost:3000

**Paste and login!** 🚀
