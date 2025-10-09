import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '../../context/LocationContext';
import { useWebSocket } from '../../context/WebSocketContext';
import GlassCard from '../common/GlassCard';
import ModernButton from '../common/ModernButton';
import StatusBadge from '../common/StatusBadge';
import {
  MapPinIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';

const ModernMapView = () => {
  const { currentLocation, locationPermission, getCurrentLocation } = useLocation();
  const { alerts, responders } = useWebSocket();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAlertsLayer, setShowAlertsLayer] = useState(true);
  const [showRespondersLayer, setShowRespondersLayer] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLocationRequest = async () => {
    try {
      const location = await getCurrentLocation();
      setMapCenter(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const nearbyAlerts = alerts.filter(alert => {
    if (!currentLocation || !alert.location) return false;
    const distance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      alert.location.lat, alert.location.lng
    );
    return distance <= 10; // Within 10km
  });

  const nearbyResponders = responders.filter(responder => {
    if (!currentLocation || !responder.location) return false;
    const distance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      responder.location.lat, responder.location.lng
    );
    return distance <= 10; // Within 10km
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const MarkerInfo = ({ marker, type }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute bottom-4 left-4 right-4 z-20"
    >
      <GlassCard className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {type === 'alert' ? (
                <ExclamationTriangleIcon className="w-5 h-5 text-emergency-500" />
              ) : (
                <ShieldCheckIcon className="w-5 h-5 text-safe-500" />
              )}
              <h3 className="font-semibold text-neutral-800">
                {type === 'alert' ? 'Emergency Alert' : 'Emergency Responder'}
              </h3>
              <StatusBadge 
                variant={type === 'alert' ? 'emergency' : 'success'} 
                size="sm"
              >
                {type === 'alert' ? marker.priority || 'High' : marker.status || 'Available'}
              </StatusBadge>
            </div>
            
            <p className="text-neutral-600 text-sm mb-2">
              {type === 'alert' ? marker.note || 'Emergency assistance needed' : `${marker.name || 'Responder'} - ${marker.type || 'Emergency Service'}`}
            </p>
            
            <div className="text-xs text-neutral-500">
              {marker.location && (
                <span>📍 {marker.location.lat.toFixed(4)}, {marker.location.lng.toFixed(4)}</span>
              )}
              {marker.timestamp && (
                <span className="ml-3">⏰ {new Date(marker.timestamp).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMarker(null)}
            className="ml-2"
          >
            ✕
          </ModernButton>
        </div>
      </GlassCard>
    </motion.div>
  );

  return (
    <GlassCard className="relative h-96 lg:h-[500px] overflow-hidden">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-800">Live Emergency Map</h3>
            <p className="text-sm text-neutral-600">Real-time alerts and emergency services</p>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={locationPermission === 'granted' ? 'online' : 'offline'}
              size="sm"
            >
              {locationPermission === 'granted' ? 'Location Active' : 'Location Disabled'}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-20 right-4 z-10 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
            className="w-full mb-1"
          >
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}
            className="w-full mb-1"
          >
            <MagnifyingGlassMinusIcon className="w-4 h-4" />
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => {/* Fullscreen logic */}}
            className="w-full"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </ModernButton>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-20 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showAlertsLayer}
              onChange={(e) => setShowAlertsLayer(e.target.checked)}
              className="rounded text-emergency-500"
            />
            <ExclamationTriangleIcon className="w-4 h-4 text-emergency-500" />
            <span>Alerts ({nearbyAlerts.length})</span>
          </label>
          
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showRespondersLayer}
              onChange={(e) => setShowRespondersLayer(e.target.checked)}
              className="rounded text-safe-500"
            />
            <ShieldCheckIcon className="w-4 h-4 text-safe-500" />
            <span>Responders ({nearbyResponders.length})</span>
          </label>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 relative">
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full"
            />
          </div>
        ) : (
          <>
            {/* Simulated Map Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-white"></div>
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>

            {/* Current Location Marker */}
            {currentLocation && (
              <motion.div
                className="absolute w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg z-10"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
              </motion.div>
            )}

            {/* Alert Markers */}
            {showAlertsLayer && nearbyAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className="absolute w-6 h-6 cursor-pointer z-10"
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedMarker({ ...alert, type: 'alert' })}
                whileHover={{ scale: 1.2 }}
              >
                <div className="w-full h-full bg-emergency-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                </div>
                <div className="absolute inset-0 bg-emergency-500 rounded-full animate-ping opacity-75"></div>
              </motion.div>
            ))}

            {/* Responder Markers */}
            {showRespondersLayer && nearbyResponders.map((responder, index) => (
              <motion.div
                key={responder.id}
                className="absolute w-6 h-6 cursor-pointer z-10"
                style={{
                  left: `${60 + index * 12}%`,
                  top: `${40 + index * 8}%`
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                onClick={() => setSelectedMarker({ ...responder, type: 'responder' })}
                whileHover={{ scale: 1.2 }}
              >
                <div className="w-full h-full bg-safe-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-3 h-3 text-white" />
                </div>
              </motion.div>
            ))}

            {/* No Location Permission */}
            {locationPermission !== 'granted' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <GlassCard className="p-6 text-center max-w-sm">
                  <MapPinIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Location Access Needed</h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    Enable location access to see your position and nearby emergency services on the map.
                  </p>
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={handleLocationRequest}
                  >
                    Enable Location
                  </ModernButton>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Marker Info */}
      <AnimatePresence>
        {selectedMarker && (
          <MarkerInfo 
            marker={selectedMarker} 
            type={selectedMarker.type}
          />
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default ModernMapView;