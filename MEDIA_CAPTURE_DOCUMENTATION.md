# 📸 Media Capture System Documentation

## Overview

The Media Capture System enables users to attach photo and audio evidence to emergency alerts. All media is automatically deleted 30 minutes after upload to ensure privacy and efficient storage management.

---

## 🎯 Features

### Photo Capture
- **Camera Access**: Real-time camera preview with environment-facing camera preference
- **Multiple Photos**: Capture up to 3 photos per emergency
- **Preview & Delete**: Review captured photos before submission
- **High Quality**: 1280x720 resolution with 90% JPEG compression
- **Instant Thumbnails**: Immediate preview of captured photos

### Audio Recording
- **Voice Messages**: Record voice descriptions of the emergency
- **Playback**: Listen to recording before submission
- **WebM Format**: High-quality audio compression
- **Recording Timer**: Real-time display of recording duration
- **Replace**: Delete and re-record if needed

### Automatic Cleanup
- **30-Minute Expiry**: All media automatically deleted after 30 minutes
- **Background Task**: Cleanup runs every 5 minutes
- **Metadata Tracking**: JSON-based tracking of file creation and expiry times
- **Space Management**: Automatic deletion of expired files to save storage

---

## 📁 System Architecture

### Backend Components

#### 1. **media_service.py** (329 lines)
Core service handling all media operations:

```python
# Key Functions:
- save_photo(photo_data, alert_id) → Saves base64 photo as JPG
- save_audio(audio_data, alert_id) → Saves base64 audio as WEBM
- cleanup_expired_media() → Deletes files older than 30 minutes
- get_media_for_alert(alert_id) → Retrieves media for specific alert
- get_all_media_stats() → Admin statistics dashboard
```

**Storage Structure:**
```
backend/
├── media/
│   ├── photos/
│   │   ├── photo_1234567890_uuid.jpg
│   │   └── photo_1234567891_uuid.jpg
│   ├── audio/
│   │   └── audio_1234567890_uuid.webm
│   └── metadata.json
```

**Metadata Format:**
```json
{
  "files": [
    {
      "filename": "photo_1234567890_uuid.jpg",
      "filepath": "/media/photos/photo_1234567890_uuid.jpg",
      "type": "photo",
      "alert_id": "alert_123",
      "created_at": "2024-01-15T10:30:00",
      "expires_at": "2024-01-15T11:00:00"
    }
  ]
}
```

#### 2. **API Endpoints** (app.py)

**Upload Media:**
```http
POST /alerts/upload_media
Content-Type: application/json

{
  "alert_id": "alert_123",
  "photos": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."],
  "audio": "data:audio/webm;base64,..."
}

Response:
{
  "alert_id": "alert_123",
  "photos_saved": 2,
  "photo_urls": ["/media/photos/photo_xxx.jpg", "/media/photos/photo_yyy.jpg"],
  "audio_saved": true,
  "audio_url": "/media/audio/audio_xxx.webm"
}
```

**Get Alert Media:**
```http
GET /alerts/{alert_id}/media

Response:
{
  "alert_id": "alert_123",
  "photos": [
    {
      "url": "/media/photos/photo_xxx.jpg",
      "created_at": "2024-01-15T10:30:00",
      "expires_at": "2024-01-15T11:00:00"
    }
  ],
  "audio": {
    "url": "/media/audio/audio_xxx.webm",
    "created_at": "2024-01-15T10:30:00",
    "expires_at": "2024-01-15T11:00:00"
  }
}
```

**Media Statistics (Admin Only):**
```http
GET /media/stats

Response:
{
  "total_files": 45,
  "total_size_mb": 123.45,
  "photos_count": 30,
  "audio_count": 15,
  "oldest_file": "2024-01-15T10:00:00",
  "newest_file": "2024-01-15T10:45:00"
}
```

#### 3. **Background Cleanup Task**
```python
async def periodic_media_cleanup():
    while True:
        await asyncio.sleep(300)  # Run every 5 minutes
        deleted_count, deleted_size = cleanup_expired_media()
        print(f"🗑️ Cleaned up {deleted_count} files ({deleted_size:.2f} MB)")
```

---

### Frontend Components

#### 1. **MediaCapture.js** (400+ lines)
React component for capturing media:

**Props:**
- `onMediaCaptured`: Callback function receiving captured media
- `maxPhotos`: Maximum number of photos allowed (default: 3)

**Features:**
- Camera initialization with getUserMedia API
- Photo capture using canvas
- Audio recording with MediaRecorder API
- Base64 conversion for upload
- Real-time preview and playback
- Delete captured media

**Usage:**
```jsx
<MediaCapture 
  onMediaCaptured={(data) => {
    // data.photos: Array of base64 photo data URLs
    // data.audio: Base64 audio data URL or null
    // data.hasMedia: Boolean indicating if any media captured
  }}
  maxPhotos={3}
/>
```

#### 2. **EmergencyPage.js Integration**

```javascript
const [capturedMedia, setCapturedMedia] = useState({
  photos: [],
  audio: null,
  hasMedia: false
});

// After creating alert
if (capturedMedia.hasMedia) {
  await fetch('http://localhost:8000/alerts/upload_media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_id: alertId,
      photos: capturedMedia.photos,
      audio: capturedMedia.audio
    })
  });
}
```

#### 3. **Admin Display Components**

**AlertsDashboard.js:**
- Photo thumbnails (16x16 size) with hover effect
- Click to open full-size in new tab
- Inline audio player with controls
- Displays expiry information

**AlertPanel.js:**
- Larger photo thumbnails (20x20 size)
- Purple-themed media section
- Audio playback controls
- "View" overlay on photo hover

---

## 🚀 User Workflow

### For Emergency Users:

1. **Open Emergency Page**
   - Navigate to emergency center

2. **Capture Photos** (Optional)
   - Click "Open Camera"
   - Camera preview appears
   - Click circular button to capture (max 3 photos)
   - Review thumbnails below camera
   - Delete unwanted photos with X button

3. **Record Audio** (Optional)
   - Click "Record" button
   - Speak voice message
   - Recording timer shows duration
   - Click "Stop" when finished
   - Audio player appears for playback
   - Delete and re-record if needed

4. **Send Alert**
   - Click emergency type button (Medical, Fire, Security, General)
   - Alert sent with media automatically
   - Success message confirms upload

### For Responders/Admins:

1. **View Alerts**
   - Open AlertPanel (bell icon) or AlertsDashboard

2. **Review Media Evidence**
   - See photo thumbnails in alert card
   - Click photo to open full-size in new tab
   - Play audio recording directly in alert
   - Download media if needed

3. **Media Expiry**
   - Media automatically deleted after 30 minutes
   - No action required from responders

---

## 🔧 Technical Details

### Camera Permissions
```javascript
navigator.mediaDevices.getUserMedia({
  video: { 
    facingMode: 'environment',  // Back camera preferred
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
})
```

### Photo Capture Process
1. Video stream rendered to `<video>` element
2. Canvas captures current frame
3. Canvas converts to Blob (JPEG, 90% quality)
4. FileReader converts Blob to base64 data URL
5. Data URL stored in state

### Audio Recording Process
1. MediaRecorder captures audio stream
2. Data chunks collected in array
3. On stop, chunks combined into Blob
4. Blob converted to base64 data URL
5. Data URL stored in state

### File Naming Convention
```
photo_[timestamp]_[uuid].jpg
audio_[timestamp]_[uuid].webm
```

### Expiry Calculation
```python
expires_at = datetime.now() + timedelta(minutes=30)
```

---

## 📊 Data Flow

```
User Captures Media
    ↓
MediaCapture Component
    ↓ (Base64 data)
EmergencyPage State
    ↓ (Alert created)
POST /alerts/upload_media
    ↓
media_service.save_photo/save_audio
    ↓
File System + metadata.json
    ↓
Static File Serving (/media/*)
    ↓
Admin Views (AlertPanel, AlertsDashboard)
    ↓ (After 30 minutes)
Background Cleanup Task
    ↓
Files Deleted
```

---

## 🛡️ Security & Privacy

### Privacy Protection
- **Automatic Deletion**: All media deleted after 30 minutes
- **No Persistent Storage**: Files only kept temporarily
- **Local Storage**: Files stored on server, not cloud

### Access Control
- **Upload**: Only authenticated users can upload
- **View**: Only responders/admins can view media
- **Stats**: Only admins can access statistics

### File Validation
- **Size Limits**: Enforced by browser (typically 5-10MB per file)
- **Format Validation**: Only JPEG photos and WEBM audio
- **Unique Filenames**: UUID prevents file overwrites

---

## 📱 Browser Compatibility

### Camera Access
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari (iOS 14.3+): Full support
- ⚠️ Safari (older): Limited support

### Audio Recording
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ⚠️ Safari: Limited codec support

### Required Permissions
- 📷 Camera: Required for photo capture
- 🎤 Microphone: Required for audio recording
- 📍 Location: Required for emergency alerts

---

## 🔍 Troubleshooting

### Camera Won't Open
**Issue**: "Cannot access camera" error

**Solutions**:
1. Check browser permissions (Settings → Privacy → Camera)
2. Ensure HTTPS or localhost (camera requires secure context)
3. Close other apps using camera
4. Try different browser

### Audio Recording Fails
**Issue**: "Cannot access microphone" error

**Solutions**:
1. Check microphone permissions
2. Ensure no other app is using microphone
3. Try different browser
4. Check system audio settings

### Media Upload Fails
**Issue**: Alert sent but media not uploaded

**Solutions**:
1. Check backend is running (localhost:8000)
2. Verify network connection
3. Check browser console for errors
4. Ensure file sizes are reasonable (<10MB)

### Photos Too Large
**Issue**: Upload takes too long

**Solutions**:
1. Reduce number of photos (max 3)
2. Check camera resolution settings
3. Ensure good network connection

---

## 🧪 Testing Guide

### Manual Testing

1. **Photo Capture Test**
   ```
   - Open camera
   - Capture 3 photos
   - Verify thumbnails appear
   - Delete one photo
   - Verify only 2 remain
   - Send alert
   - Verify photos in admin panel
   ```

2. **Audio Recording Test**
   ```
   - Click record
   - Speak for 10 seconds
   - Stop recording
   - Play back audio
   - Verify playback works
   - Send alert
   - Verify audio in admin panel
   ```

3. **Expiry Test**
   ```
   - Upload media with alert
   - Note alert ID
   - Wait 30 minutes
   - Refresh admin panel
   - Verify media no longer accessible
   - Check backend logs for cleanup message
   ```

### API Testing

```bash
# Upload test media
curl -X POST http://localhost:8000/alerts/upload_media \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": "test_123",
    "photos": ["data:image/jpeg;base64,..."],
    "audio": "data:audio/webm;base64,..."
  }'

# Get alert media
curl http://localhost:8000/alerts/test_123/media

# Get statistics (admin only)
curl http://localhost:8000/media/stats
```

---

## 📈 Performance Considerations

### Optimization Tips

1. **Photo Compression**
   - Current: 90% JPEG quality
   - Adjust in MediaCapture.js if needed

2. **Upload Timing**
   - Media uploaded AFTER alert created
   - Non-blocking for emergency response

3. **Cleanup Frequency**
   - Currently every 5 minutes
   - Adjust if needed in app.py

4. **File Size Limits**
   - No hard limit set
   - Browser typically limits to 5-10MB
   - Consider adding explicit limits

### Storage Estimates

**Per Emergency:**
- 3 photos × 500KB = 1.5MB
- 1 audio × 200KB = 0.2MB
- **Total: ~1.7MB per emergency**

**With 100 concurrent emergencies:**
- 100 × 1.7MB = 170MB
- All deleted within 30 minutes

---

## 🔄 Future Enhancements

### Potential Features

1. **Video Recording**
   - Short video clips (10-15 seconds)
   - Higher bandwidth requirement

2. **Cloud Storage**
   - S3/Azure Blob integration
   - Better scalability

3. **Image Compression**
   - Client-side compression before upload
   - Reduce bandwidth usage

4. **Media Retention Options**
   - Configurable expiry (15/30/60 minutes)
   - Admin override to preserve evidence

5. **Media Analytics**
   - Track media usage patterns
   - Storage optimization insights

---

## 📝 Configuration

### Backend Configuration (app.py)

```python
# Cleanup interval (seconds)
CLEANUP_INTERVAL = 300  # 5 minutes

# Media expiry (minutes)
MEDIA_EXPIRY_MINUTES = 30

# Storage directories
MEDIA_DIR = "media"
PHOTOS_DIR = "media/photos"
AUDIO_DIR = "media/audio"
```

### Frontend Configuration (MediaCapture.js)

```javascript
// Maximum photos per alert
maxPhotos = 3

// Photo quality (0.0 - 1.0)
const PHOTO_QUALITY = 0.9

// Camera resolution
const CAMERA_WIDTH = 1280
const CAMERA_HEIGHT = 720

// Audio MIME type
const AUDIO_MIME = 'audio/webm'
```

---

## 📞 Support & Maintenance

### Log Locations

**Backend Cleanup Logs:**
```
🗑️ Running media cleanup...
🗑️ Deleted 5 files (2.35 MB)
```

**Upload Success:**
```
Saved photo: photo_1234567890_uuid.jpg for alert alert_123
Saved audio: audio_1234567890_uuid.webm for alert alert_123
```

### Monitoring

Check media stats regularly:
```bash
curl http://localhost:8000/media/stats
```

Expected output:
```json
{
  "total_files": 25,
  "total_size_mb": 42.5,
  "photos_count": 18,
  "audio_count": 7
}
```

---

## ✅ Checklist for Deployment

- [ ] Backend running on production server
- [ ] Media directories created with write permissions
- [ ] Static file serving configured
- [ ] HTTPS enabled for camera/microphone access
- [ ] Cleanup task running in background
- [ ] CORS configured for production domain
- [ ] Browser permissions tested on target devices
- [ ] Storage monitoring set up
- [ ] Backup strategy for metadata.json
- [ ] Error logging configured

---

## 📚 Related Documentation

- [Alert System Documentation](./ALERT_SYSTEM_DOCUMENTATION.md)
- [Alert System Summary](./ALERT_SYSTEM_SUMMARY.md)
- [Alert System Quick Start](./ALERT_SYSTEM_QUICK_START.md)

---

## 🎉 Summary

The Media Capture System provides a complete solution for attaching photo and audio evidence to emergency alerts with automatic privacy protection through 30-minute expiry. The system is fully integrated with the existing alert infrastructure and provides seamless media management for both users and responders.

**Key Benefits:**
- ✅ Enhanced situational awareness for responders
- ✅ Privacy-first design with automatic deletion
- ✅ Easy-to-use interface with real-time preview
- ✅ Efficient storage management
- ✅ No manual cleanup required

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
