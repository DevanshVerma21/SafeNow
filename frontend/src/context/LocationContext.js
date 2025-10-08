import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);

  useEffect(() => {
    checkLocationPermission();
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      permission.addEventListener('change', () => {
        setLocationPermission(permission.state);
      });
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  const getCurrentLocation = (options = {}) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp)
          };
          
          setCurrentLocation(location);
          addToHistory(location);
          resolve(location);
        },
        (error) => {
          let message = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              setLocationPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'Unknown location error';
          }
          
          toast.error(message);
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  };

  const startTracking = (options = {}) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    if (isTracking) {
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // 5 seconds for tracking
      ...options
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp)
        };
        
        setCurrentLocation(location);
        addToHistory(location);
      },
      (error) => {
        console.error('Location tracking error:', error);
        toast.error('Location tracking failed');
        stopTracking();
      },
      defaultOptions
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.success('Location tracking stopped');
  };

  const addToHistory = (location) => {
    setLocationHistory(prev => {
      const newHistory = [location, ...prev.slice(0, 99)]; // Keep last 100 locations
      return newHistory;
    });
  };

  const requestLocationPermission = async () => {
    try {
      await getCurrentLocation();
      setLocationPermission('granted');
      return true;
    } catch (error) {
      setLocationPermission('denied');
      return false;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const getNearbyLocations = (locations, radius = 5) => {
    if (!currentLocation) return [];
    
    return locations.filter(location => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        location.lat,
        location.lng
      );
      return distance <= radius;
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Use a free geocoding service or implement your own
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const value = {
    currentLocation,
    locationPermission,
    isTracking,
    locationHistory,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestLocationPermission,
    calculateDistance,
    getNearbyLocations,
    reverseGeocode
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};