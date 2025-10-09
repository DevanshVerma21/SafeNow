# Alert System Documentation

## Overview
The Alert System is a comprehensive real-time emergency notification system integrated into the SafeNow platform. It provides instant alerts to responders with all necessary information and features to respond to emergencies effectively.

## Features

### 1. **Real-Time Alert Notifications**
- Alerts appear instantly when emergency situations are reported
- WebSocket-based real-time updates
- Visual and audio notifications
- Badge counter showing number of active alerts

### 2. **Alert Panel Sidebar**
The alert panel slides in from the right side of the screen and displays:

#### Alert Information:
- **Emergency Type**: Medical, Fire, Crime, or General emergency
- **Severity Level**: Critical, High, Medium, or Low priority
- **User Information**: Name and phone number of the person in distress
- **Location Details**: Full address with distance calculation
- **Timestamp**: When the alert was created
- **Current Status**: Pending, Accepted, or Rejected

#### Interactive Features:
- **View Location**: Opens Google Maps with the exact location pin
- **Get Directions**: Opens Google Maps with turn-by-turn directions from your current location
- **Call User**: Direct phone call link to contact the person
- **Accept Alert**: Accept the emergency and respond
- **Decline Alert**: Reject if unable to respond

### 3. **Google Maps Integration**

#### View Location:
```javascript
// Opens Google Maps with exact coordinates
https://www.google.com/maps/search/?api=1&query=LAT,LNG
```

#### Get Directions:
```javascript
// Opens Google Maps with navigation from your location to the emergency
https://www.google.com/maps/dir/?api=1&origin=YOUR_LAT,YOUR_LNG&destination=ALERT_LAT,ALERT_LNG&travelmode=driving
```

### 4. **Access Points**

#### Sidebar Bell Icon:
- Located in the sidebar header
- Shows notification badge with count
- Click to open the alert panel

#### Floating Alert Button:
- Fixed position button for quick access
- Available for responders and volunteers
- Pulse animation when new alerts arrive
- Always accessible from any page

## Component Structure

```
frontend/src/components/alerts/
├── AlertPanel.js          # Main alert panel component
└── FloatingAlertButton.js # Floating action button
```

## Usage

### For Responders/Volunteers:

1. **Check Alerts**:
   - Click the bell icon in the sidebar OR
   - Click the floating red button at the bottom-right

2. **Review Alert Details**:
   - Read emergency type and severity
   - Check user information
   - Review location and distance

3. **Navigate to Location**:
   - Click "View Location" to see on map
   - Click "Directions" to start navigation
   - Google Maps will open in a new tab

4. **Respond to Alert**:
   - Click "Accept" to respond
   - Click "Decline" if unable to help
   - Call the user if needed

### For Administrators:

- Same features as responders
- Can monitor all alerts
- Can see response patterns

## Alert Data Structure

```javascript
{
  id: "unique-id",
  type: "fire" | "medical" | "crime" | "emergency",
  severity: "critical" | "high" | "medium" | "low",
  message: "Description of emergency",
  location: {
    lat: 28.6139,
    lng: 77.2090
  },
  address: "Full address string",
  timestamp: "2025-10-09T12:30:00Z",
  userName: "John Doe",
  userPhone: "+919876543210",
  status: "pending" | "accepted" | "rejected",
  distance: "2.5 km away",
  emergencyType: "Medical Emergency"
}
```

## Customization

### Colors by Severity:
- **Critical**: Red gradient (from-red-500 to-red-700)
- **High**: Orange gradient (from-orange-500 to-orange-700)
- **Medium**: Yellow gradient (from-yellow-500 to-yellow-700)
- **Low**: Blue gradient (from-blue-500 to-blue-700)

### Icons by Type:
- **Fire**: FireIcon
- **Medical**: HeartIcon
- **Crime**: ShieldExclamationIcon
- **General**: ExclamationTriangleIcon

## Integration with WebSocket

The alert system automatically connects to the WebSocket context:

```javascript
const { notifications } = useWebSocket();
```

Alerts are received in real-time and automatically displayed in the alert panel.

## Mobile Responsiveness

- Full-screen panel on mobile devices
- Touch-optimized buttons
- Smooth animations
- Floating button always accessible

## Future Enhancements

1. **Audio Notifications**: Sound alerts for new emergencies
2. **Push Notifications**: Browser notifications when app is in background
3. **Alert Filtering**: Filter by type, severity, or distance
4. **Alert History**: View past responded alerts
5. **Multi-language Support**: Alerts in local languages
6. **Offline Mode**: Cache alerts when offline
7. **Alert Analytics**: Response time tracking
8. **Batch Actions**: Accept/decline multiple alerts

## Troubleshooting

### Alerts not appearing?
- Check WebSocket connection status in sidebar
- Verify user role is 'responder' or 'volunteer'
- Check browser console for errors

### Google Maps not opening?
- Ensure popup blocker is disabled
- Check location coordinates are valid
- Verify internet connection

### Location permissions?
- Enable location access in browser settings
- Grant permission when prompted
- Check browser location services

## API Endpoints

The alert system interacts with these backend endpoints:

- `GET /alerts?status=open` - Fetch active alerts
- `POST /alerts` - Create new alert
- `PUT /alerts/:id/status` - Update alert status
- `WebSocket /ws/alerts` - Real-time alert updates

## Security

- Alerts only visible to authorized responders
- Location data encrypted in transit
- User information protected
- HIPAA-compliant for medical emergencies

## Support

For issues or feature requests:
- Email: support@safenow.com
- GitHub: github.com/SafeNow/issues
- Documentation: docs.safenow.com

---

**Version**: 1.0.0  
**Last Updated**: October 9, 2025  
**Author**: SafeNow Development Team
