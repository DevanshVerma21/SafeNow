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

    // Default center (can be updated when user location is available)
    const defaultCenter = [37.7749, -122.4194]; // San Francisco
    
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 13);
      
      // Add or update user location marker
      if (markersRef.current.userLocation) {
        markersRef.current.userLocation.setLatLng([currentLocation.lat, currentLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping-slow"></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        markersRef.current.userLocation = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: userIcon
        })
        .addTo(mapInstanceRef.current)
        .bindPopup('Your current location');
      }
    }
  }, [currentLocation]);

  // Update alert markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing alert markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('alert_')) {
        mapInstanceRef.current.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    if (!showAlerts) return;

    // Add new alert markers
    alerts.forEach(alert => {
      if (!alert.location) return;

      const alertIcon = L.divIcon({
        className: 'alert-marker',
        html: `
          <div class="relative">
            <div class="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
              <span class="text-white text-xs font-bold">!</span>
            </div>
            ${alert.status === 'assigned' ? `
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([alert.location.lat, alert.location.lng], {
        icon: alertIcon
      }).addTo(mapInstanceRef.current);

      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h4 class="font-semibold text-gray-900 capitalize">${alert.type} Emergency</h4>
          <p class="text-sm text-gray-600 mt-1">${alert.note || 'Emergency assistance requested'}</p>
          <div class="mt-2 text-xs text-gray-500">
            <p>Status: <span class="capitalize font-medium ${
              alert.status === 'pending' ? 'text-yellow-600' :
              alert.status === 'assigned' ? 'text-blue-600' :
              alert.status === 'resolved' ? 'text-green-600' : 'text-gray-600'
            }">${alert.status}</span></p>
            ${alert.eta_seconds ? `<p>ETA: ${Math.round(alert.eta_seconds / 60)} minutes</p>` : ''}
            ${alert.assigned_responder ? `<p>Responder: ${alert.assigned_responder}</p>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current[`alert_${alert.id}`] = marker;
    });
  }, [alerts, showAlerts, mapReady]);

  // Update responder markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing responder markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('responder_')) {
        mapInstanceRef.current.removeLayer(markersRef.current[key]);
        delete markersRef.current[key];
      }
    });

    if (!showResponders) return;

    // Add new responder markers
    responders.forEach(responder => {
      if (!responder.location) return;

      const isAvailable = responder.status === 'available';
      const responderIcon = L.divIcon({
        className: 'responder-marker',
        html: `
          <div class="w-6 h-6 ${isAvailable ? 'bg-green-500' : 'bg-yellow-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span class="text-white text-xs font-bold">R</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([responder.location.lat, responder.location.lng], {
        icon: responderIcon
      }).addTo(mapInstanceRef.current);

      const popupContent = `
        <div class="p-2">
          <h4 class="font-semibold text-gray-900">Emergency Responder</h4>
          <p class="text-sm text-gray-600 mt-1">ID: ${responder.id}</p>
          <div class="mt-2 text-xs text-gray-500">
            <p>Status: <span class="capitalize font-medium ${
              isAvailable ? 'text-green-600' : 'text-yellow-600'
            }">${responder.status}</span></p>
            <p>Last update: ${new Date(responder.last_seen || Date.now()).toLocaleTimeString()}</p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current[`responder_${responder.id}`] = marker;
    });
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
      <div className="relative">
        <div ref={mapRef} className="h-96 w-full" />
        
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