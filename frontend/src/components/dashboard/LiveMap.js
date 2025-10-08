import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import { MapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LiveMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const { alerts, responders } = useWebSocket();
  const { currentLocation } = useLocation();
  const [showResponders, setShowResponders] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Delay initialization to ensure container has proper dimensions
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      // Check if container has dimensions
      const container = mapRef.current;
      if (!container.offsetWidth || !container.offsetHeight) {
        console.warn('Container has no dimensions yet, retrying...');
        setTimeout(initializeMap, 100);
        return;
      }

      console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);

      // Default center - will update when user location is available
      const defaultCenter = [28.6139, 77.2090]; // New Delhi, India
      
      try {
        const map = L.map(container, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          dragging: true,
          preferCanvas: false,
        });

        // Add tile layer with error handling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 3,
          tileSize: 256,
          keepBuffer: 2,
        }).addTo(map);

        mapInstanceRef.current = map;
        
        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true);
            setMapReady(true);
            console.log('Map initialized and sized correctly');
          }
        }, 200);

        // Handle window resize
        const handleResize = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        };
        window.addEventListener('resize', handleResize);

        // Store cleanup function
        container._cleanupResize = handleResize;

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    // Start initialization with a small delay
    setTimeout(initializeMap, 100);

    return () => {
      const container = mapRef.current;
      if (container && container._cleanupResize) {
        window.removeEventListener('resize', container._cleanupResize);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMapReady(false);
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  // Update map center when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !currentLocation) return;
    
    try {
      // Smoothly pan to user location
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 14, {
        animate: true,
        duration: 1
      });
      
      // Add or update user location marker
      if (markersRef.current.userLocation) {
        markersRef.current.userLocation.setLatLng([currentLocation.lat, currentLocation.lng]);
      } else {
        // Create pulsing blue marker for user location
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="position: relative; width: 20px; height: 20px;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                          width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; 
                          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                          width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; 
                          opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(mapInstanceRef.current);

        const popupContent = `
          <div style="padding: 8px; min-width: 150px;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">📍 Your Location</h4>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Lat: ${currentLocation.lat.toFixed(6)}<br/>
              Lng: ${currentLocation.lng.toFixed(6)}
            </p>
            ${currentLocation.accuracy ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">Accuracy: ${currentLocation.accuracy.toFixed(0)}m</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.userLocation = marker;
        
        console.log('User location marker added:', currentLocation);
      }
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }, [currentLocation, mapReady]);

  // Update alert markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    try {
      // Clear existing alert markers
      Object.keys(markersRef.current).forEach(key => {
        if (key.startsWith('alert_')) {
          try {
            mapInstanceRef.current.removeLayer(markersRef.current[key]);
            delete markersRef.current[key];
          } catch (err) {
            console.error('Error removing alert marker:', err);
          }
        }
      });

      if (!showAlerts || !Array.isArray(alerts)) return;

      // Add new alert markers
      alerts.forEach(alert => {
        if (!alert?.location?.lat || !alert?.location?.lng) {
          console.warn('Alert missing location data:', alert);
          return;
        }

        try {
          const alertIcon = L.divIcon({
            className: 'alert-marker',
            html: `
              <div style="position: relative; width: 36px; height: 36px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            width: 32px; height: 32px; background: #ef4444; border-radius: 50%; 
                            border: 3px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
                            display: flex; align-items: center; justify-content: center;
                            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
                  <span style="color: white; font-size: 18px; font-weight: bold; line-height: 1;">⚠</span>
                </div>
                ${alert.status === 'assigned' || alert.status === 'accepted' ? `
                  <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; 
                              background: #22c55e; border-radius: 50%; border: 2px solid white;"></div>
                ` : ''}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker([alert.location.lat, alert.location.lng], {
            icon: alertIcon,
            zIndexOffset: 500
          }).addTo(mapInstanceRef.current);

          // Create detailed popup content
          const statusColors = {
            'pending': '#eab308',
            'open': '#eab308',
            'assigned': '#3b82f6',
            'accepted': '#3b82f6',
            'resolved': '#22c55e',
            'cancelled': '#6b7280'
          };
          
          const statusColor = statusColors[alert.status] || '#6b7280';

          const popupContent = `
            <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
              <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1f2937; text-transform: capitalize;">
                🚨 ${alert.type || 'Emergency'} Alert
              </h4>
              ${alert.note ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;">${alert.note}</p>` : ''}
              <div style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Status:</span>
                  <span style="font-weight: 600; color: ${statusColor}; text-transform: capitalize;">${alert.status || 'pending'}</span>
                </div>
                ${alert.eta_seconds ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>ETA:</span>
                    <span style="font-weight: 600; color: #3b82f6;">${Math.round(alert.eta_seconds / 60)} min</span>
                  </div>
                ` : ''}
                ${alert.assigned_responder ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span>Responder:</span>
                    <span style="font-weight: 600;">ID ${alert.assigned_responder}</span>
                  </div>
                ` : ''}
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
                  Alert ID: ${alert.id?.substring(0, 8)}...
                </div>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 300 });
          markersRef.current[`alert_${alert.id}`] = marker;
        } catch (error) {
          console.error('Error creating alert marker:', error, alert);
        }
      });

      console.log(`Updated ${alerts.length} alert markers on map`);
    } catch (error) {
      console.error('Error in alert markers effect:', error);
    }
  }, [alerts, showAlerts, mapReady]);

  // Update responder markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    try {
      // Clear existing responder markers
      Object.keys(markersRef.current).forEach(key => {
        if (key.startsWith('responder_')) {
          try {
            mapInstanceRef.current.removeLayer(markersRef.current[key]);
            delete markersRef.current[key];
          } catch (err) {
            console.error('Error removing responder marker:', err);
          }
        }
      });

      if (!showResponders || !Array.isArray(responders)) return;

      // Add new responder markers
      responders.forEach(responder => {
        if (!responder?.location?.lat || !responder?.location?.lng) {
          console.warn('Responder missing location data:', responder);
          return;
        }

        try {
          const isAvailable = responder.status === 'available';
          const isBusy = responder.status === 'busy' || responder.status === 'responding';
          const bgColor = isAvailable ? '#22c55e' : isBusy ? '#f59e0b' : '#6b7280';
          
          const responderIcon = L.divIcon({
            className: 'responder-marker',
            html: `
              <div style="position: relative; width: 28px; height: 28px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            width: 24px; height: 24px; background: ${bgColor}; border-radius: 50%; 
                            border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 12px; font-weight: bold; line-height: 1;">🚑</span>
                </div>
                ${!isAvailable ? `
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                              width: 24px; height: 24px; border-radius: 50%; 
                              background: ${bgColor}; opacity: 0.3;
                              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                ` : ''}
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([responder.location.lat, responder.location.lng], {
            icon: responderIcon,
            zIndexOffset: 400
          }).addTo(mapInstanceRef.current);

          const statusColors = {
            'available': '#22c55e',
            'busy': '#f59e0b',
            'responding': '#f59e0b',
            'offline': '#6b7280'
          };

          const statusColor = statusColors[responder.status] || '#6b7280';
          const lastSeen = responder.last_seen ? new Date(responder.last_seen) : new Date();

          const popupContent = `
            <div style="padding: 12px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
              <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px; color: #1f2937;">
                🚑 Emergency Responder
              </h4>
              <div style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>ID:</span>
                  <span style="font-weight: 600; font-family: monospace;">${responder.id?.substring(0, 8) || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Status:</span>
                  <span style="font-weight: 600; color: ${statusColor}; text-transform: capitalize;">${responder.status || 'unknown'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Last Seen:</span>
                  <span style="font-weight: 600;">${lastSeen.toLocaleTimeString()}</span>
                </div>
                ${responder.name ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <span style="font-weight: 600;">Name: </span>${responder.name}
                  </div>
                ` : ''}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 250 });
          markersRef.current[`responder_${responder.id}`] = marker;
        } catch (error) {
          console.error('Error creating responder marker:', error, responder);
        }
      });

      console.log(`Updated ${responders.length} responder markers on map`);
    } catch (error) {
      console.error('Error in responder markers effect:', error);
    }
  }, [responders, showResponders, mapReady]);

  return (
    <div className="modern-card overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Live Emergency Map</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                showAlerts 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {showAlerts ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              <span>Alerts</span>
            </button>
            
            <button
              onClick={() => setShowResponders(!showResponders)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                showResponders 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {showResponders ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              <span>Responders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[600px] w-full overflow-hidden">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        
        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Your Location</span>
            </div>
            {showAlerts && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Emergency Alert</span>
              </div>
            )}
            {showResponders && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Available Responder</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs text-gray-600">
              Active Alerts: <span className="font-semibold text-red-600">{alerts.length}</span>
            </div>
            <div className="text-xs text-gray-600">
              Available Responders: <span className="font-semibold text-green-600">
                {responders.filter(r => r.status === 'available').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;