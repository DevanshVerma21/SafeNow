import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const MapMarker = ({ location, alertType = 'emergency', compact = false }) => {
  const [showInfo, setShowInfo] = useState(false);
  
  // Handle location data (can be object with lat/lng or string coordinates)
  const getCoordinates = () => {
    if (typeof location === 'object' && location.lat && location.lng) {
      return { lat: parseFloat(location.lat), lng: parseFloat(location.lng) };
    }
    // Parse string format "lat, lng"
    if (typeof location === 'string' && location.includes(',')) {
      const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    // Default coordinates (center of India)
    return { lat: 20.5937, lng: 78.9629 };
  };

  const coordinates = getCoordinates();
  
  // Open in Google Maps in new tab
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
  };

  // Container style for the map
  const mapContainerStyle = compact 
    ? { width: '200px', height: '120px', borderRadius: '8px' }
    : { width: '100%', height: '300px', borderRadius: '12px' };

  const mapOptions = {
    disableDefaultUI: compact,
    zoomControl: !compact,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoom: compact ? 13 : 15,
    gestureHandling: compact ? 'none' : 'greedy',
  };

  // Google Maps API Key - You'll need to add this to your .env file
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  if (!coordinates.lat || !coordinates.lng || isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <MapPinIcon className="w-4 h-4" />
        <span>Location unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={coordinates}
          zoom={mapOptions.zoom}
          options={mapOptions}
        >
          <Marker
            position={coordinates}
            animation={window.google?.maps?.Animation?.DROP}
            onClick={() => setShowInfo(true)}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              scale: 8,
              fillColor: alertType === 'fire' ? '#ef4444' : 
                        alertType === 'medical' ? '#3b82f6' : 
                        alertType === 'accident' ? '#f59e0b' : '#dc2626',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
          
          {showInfo && (
            <InfoWindow
              position={coordinates}
              onCloseClick={() => setShowInfo(false)}
            >
              <div className="p-2">
                <p className="text-sm font-semibold text-gray-900 mb-1">Emergency Location</p>
                <p className="text-xs text-gray-600">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
                <button
                  onClick={openInGoogleMaps}
                  className="mt-2 flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <span>View in Google Maps</span>
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* View on Map Button - Shows on hover for compact view */}
      {compact && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={openInGoogleMaps}
            className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center space-x-1"
          >
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            <span>View on Map</span>
          </button>
        </div>
      )}

      {/* Coordinates below map in compact view */}
      {compact && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default MapMarker;
