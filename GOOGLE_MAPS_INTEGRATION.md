# Google Maps Integration - Setup Guide

## Overview
The Active Alerts dashboard now displays interactive Google Maps showing the exact location of emergency alerts with markers. Responders can click on markers to see coordinates and open the location in Google Maps for navigation.

## Features Implemented ✅

### 1. **Interactive Map Display**
- Replaces static coordinates with live Google Maps
- Shows in both Active Alerts and Recent Alerts tables
- Compact view (200x120px) with hover effects

### 2. **Location Markers**
- Color-coded markers based on alert type:
  - 🔴 Red: Fire emergencies
  - 🔵 Blue: Medical emergencies  
  - 🟠 Orange: Accidents
  - ⚠️ Red (default): Other emergencies
- Animated drop effect on load
- Click marker to show info window

### 3. **View on Map Functionality**
- Hover over map to see "View on Map" button
- Clicking opens location in Google Maps (new tab)
- Info window also has "View in Google Maps" link
- Direct navigation URL: `https://www.google.com/maps/search/?api=1&query=lat,lng`

### 4. **Smart Location Handling**
- Supports object format: `{ lat: 28.5456, lng: 77.3344 }`
- Supports string format: `"28.5456, 77.3344"`
- Graceful fallback for invalid locations
- Shows coordinates below map in compact view

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Maps JavaScript API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Step 2: Secure Your API Key (Recommended)

1. Click on your API key in the credentials page
2. Under **API restrictions**, select "Restrict key"
3. Choose **Maps JavaScript API**
4. Under **Application restrictions**, select "HTTP referrers"
5. Add your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)

### Step 3: Configure Environment Variables

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your API key:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   REACT_APP_API=http://localhost:8000
   ```

4. **Important**: Add `.env` to `.gitignore` to avoid exposing your API key:
   ```bash
   echo ".env" >> .gitignore
   ```

### Step 4: Restart Development Server

```bash
npm start
```

## Component Usage

### MapMarker Component

The `MapMarker` component is reusable and can be integrated anywhere in the app:

```javascript
import MapMarker from '../common/MapMarker';

// Basic usage
<MapMarker 
  location={{ lat: 28.5456, lng: 77.3344 }}
  alertType="fire"
  compact={true}
/>

// With string coordinates
<MapMarker 
  location="28.5456, 77.3344"
  alertType="medical"
  compact={false}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `location` | `object \| string` | Required | Location coordinates `{ lat, lng }` or `"lat, lng"` |
| `alertType` | `string` | `"emergency"` | Alert type for marker color (`fire`, `medical`, `accident`, etc.) |
| `compact` | `boolean` | `false` | Compact view (200x120px) vs full view (300px) |

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── MapMarker.js          # Reusable map component
│   │   └── admin/
│   │       └── AdminDashboard.js      # Updated with map integration
│   └── ...
├── .env.example                       # Environment template
└── .env                               # Your actual API key (not committed)
```

## Troubleshooting

### Map Not Loading

1. **Check API Key**: Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `.env`
2. **Restart Server**: Environment variables require server restart
3. **Check Console**: Look for Google Maps errors in browser console
4. **Verify API**: Ensure Maps JavaScript API is enabled in Google Cloud Console

### "This page can't load Google Maps correctly"

1. API key is invalid or not configured
2. Maps JavaScript API not enabled
3. API key restrictions blocking your domain
4. Billing not enabled (Google Maps requires billing account)

### Map Shows Default Location

- Invalid coordinates in alert data
- Location data missing from backend
- Coordinates are `null`, `undefined`, or `NaN`

### Network Errors

- Check if Google Maps servers are accessible
- Verify API key quota (free tier has limits)
- Check API key billing status

## API Key Quotas

**Free Tier Limits** (as of 2024):
- **Maps Static API**: $200/month free credit
- **Maps JavaScript API**: $200/month free credit
- **Dynamic Maps**: 28,000 loads/month free
- **Static Maps**: 28,000 loads/month free

**Monitor Usage**:
1. Go to Google Cloud Console
2. Navigation → APIs & Services → Dashboard
3. View usage statistics and set quotas

## Security Best Practices

✅ **DO**:
- Store API key in `.env` file
- Add `.env` to `.gitignore`
- Use application restrictions (HTTP referrers)
- Enable only required APIs
- Monitor API usage regularly

❌ **DON'T**:
- Commit API key to version control
- Share API key publicly
- Use unrestricted API keys in production
- Hardcode API key in components

## Production Deployment

For production environments:

1. **Use Environment Variables in Hosting Platform**:
   - Netlify: Site Settings → Environment Variables
   - Vercel: Project Settings → Environment Variables
   - AWS: Use AWS Secrets Manager
   - Heroku: Config Vars

2. **Update HTTP Referrer Restrictions**:
   - Add production domain to API key restrictions
   - Example: `yourdomain.com/*`, `*.yourdomain.com/*`

3. **Monitor Costs**:
   - Set up billing alerts in Google Cloud
   - Monitor daily usage
   - Consider caching strategies

## Alternative: Without Google Maps API Key

If you don't want to use Google Maps API:

1. The component will show "Location unavailable" message
2. Coordinates are still displayed below the map area
3. "View on Map" link still works (opens google.com/maps in browser)
4. Consider alternatives: OpenStreetMap (Leaflet), Mapbox

## Support

For issues:
1. Check browser console for errors
2. Verify `.env` file configuration
3. Test with example coordinates: `{ lat: 28.7041, lng: 77.1025 }` (Delhi)
4. Review Google Maps API documentation: https://developers.google.com/maps/documentation

---

**Last Updated**: January 2025  
**Status**: ✅ Production Ready
