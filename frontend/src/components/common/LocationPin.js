import React from 'react';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const LocationPin = ({ location, alertType = 'emergency', alertId }) => {
  // Handle location data (can be object with lat/lng or string coordinates)
  const getCoordinates = () => {
    if (typeof location === 'object' && location?.lat && location?.lng) {
      return { 
        lat: parseFloat(location.lat), 
        lng: parseFloat(location.lng),
        address: location.address || null
      };
    }
    // Parse string format "lat, lng"
    if (typeof location === 'string' && location.includes(',')) {
      const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, address: null };
      }
    }
    return null;
  };

  const coordinates = getCoordinates();
  
  // Open in Google Maps in new tab
  const openInGoogleMaps = (e) => {
    e.preventDefault();
    if (coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Get pin color based on alert type
  const getPinColor = () => {
    switch (alertType?.toLowerCase()) {
      case 'fire':
        return 'text-red-600 hover:text-red-700';
      case 'medical':
        return 'text-blue-600 hover:text-blue-700';
      case 'accident':
        return 'text-orange-600 hover:text-orange-700';
      case 'police':
        return 'text-indigo-600 hover:text-indigo-700';
      default:
        return 'text-red-600 hover:text-red-700';
    }
  };

  if (!coordinates) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <MapPinIcon className="w-5 h-5" />
        <span className="text-xs">N/A</span>
      </div>
    );
  }

  const tooltipId = `location-${alertId}`;
  const formattedCoords = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;

  return (
    <div className="flex items-center space-x-2">
      {/* Clickable Map Pin */}
      <button
        onClick={openInGoogleMaps}
        data-tooltip-id={tooltipId}
        data-tooltip-content={coordinates.address || formattedCoords}
        className={`group relative flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 ${getPinColor()}`}
        title="Click to view in Google Maps"
      >
        <MapPinIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
        <ArrowTopRightOnSquareIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Coordinates */}
        <span className="text-xs font-mono text-gray-600 hidden lg:inline">
          {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </span>
      </button>

      {/* Tooltip */}
      <Tooltip 
        id={tooltipId} 
        place="top"
        style={{ 
          backgroundColor: '#1f2937', 
          color: '#fff',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          zIndex: 9999
        }}
      />
    </div>
  );
};

export default LocationPin;
