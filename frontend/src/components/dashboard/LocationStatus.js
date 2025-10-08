import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from '../../context/LocationContext';
import { 
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const LocationStatus = () => {
  const { currentLocation, locationPermission, isTracking, requestLocationPermission } = useLocation();

  const getLocationStatus = () => {
    if (locationPermission === 'denied') {
      return {
        status: 'error',
        title: 'Location Access Denied',
        message: 'Please enable location access in browser settings',
        icon: XCircleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (!currentLocation) {
      return {
        status: 'warning',
        title: 'Location Unknown',
        message: 'Tap to get your current location',
        icon: ExclamationCircleIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    return {
      status: 'success',
      title: 'Location Available',
      message: isTracking ? 'Location tracking active' : 'Location obtained',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const locationStatus = getLocationStatus();
  const StatusIcon = locationStatus.icon;

  return (
    <div className="modern-card p-6">
      <div className="flex items-center mb-6">
        <MapPinIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-bold gradient-text">Location Status</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-4 rounded-lg border ${locationStatus.borderColor} ${locationStatus.bgColor}`}
      >
        <div className="flex items-start space-x-3">
          <StatusIcon className={`w-6 h-6 ${locationStatus.color} mt-0.5`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{locationStatus.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{locationStatus.message}</p>
            
            {currentLocation && (
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
                <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
                <p>Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
                <p>Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>

        {locationStatus.status !== 'success' && (
          <button
            onClick={requestLocationPermission}
            className="mt-3 w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Get Location</span>
          </button>
        )}
      </motion.div>

      {/* Tracking Status */}
      {currentLocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Location Tracking
            </span>
            <div className={`flex items-center space-x-1 ${
              isTracking ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs font-medium">
                {isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationStatus;