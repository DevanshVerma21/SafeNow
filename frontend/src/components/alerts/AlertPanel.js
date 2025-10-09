import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import {
  BellIcon,
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FireIcon,
  HeartIcon,
  ShieldExclamationIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const AlertPanel = ({ isOpen, onClose }) => {
  const { notifications } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    // Transform notifications into alerts
    if (notifications && notifications.length > 0) {
      const formattedAlerts = notifications.map((notif, index) => ({
        id: notif.id || index,
        type: notif.type || 'emergency',
        severity: notif.severity || 'high',
        message: notif.message || 'Emergency Alert',
        location: notif.location || { lat: 0, lng: 0 },
        address: notif.address || 'Unknown Location',
        timestamp: notif.timestamp || new Date().toISOString(),
        userName: notif.userName || 'Anonymous User',
        userPhone: notif.userPhone || 'Not Available',
        status: notif.status || 'pending',
        distance: notif.distance || 'Calculating...',
        emergencyType: notif.emergencyType || 'General'
      }));
      setAlerts(formattedAlerts);
    }
  }, [notifications]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'fire':
        return <FireIcon className="w-6 h-6" />;
      case 'medical':
        return <HeartIcon className="w-6 h-6" />;
      case 'crime':
        return <ShieldExclamationIcon className="w-6 h-6" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'from-red-500 to-red-700';
      case 'high':
        return 'from-orange-500 to-orange-700';
      case 'medium':
        return 'from-yellow-500 to-yellow-700';
      case 'low':
        return 'from-blue-500 to-blue-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const openInGoogleMaps = (location, address) => {
    if (location && location.lat && location.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
      window.open(url, '_blank');
    } else if (address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = (location) => {
    if (location && location.lat && location.lng) {
      // Get current location and create directions URL
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${position.coords.latitude},${position.coords.longitude}&destination=${location.lat},${location.lng}&travelmode=driving`;
            window.open(url, '_blank');
          },
          (error) => {
            // If location not available, just open destination
            const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=driving`;
            window.open(url, '_blank');
          }
        );
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleAcceptAlert = (alert) => {
    // TODO: Implement accept logic
    console.log('Accepting alert:', alert);
    setAlerts(alerts.map(a => 
      a.id === alert.id ? { ...a, status: 'accepted' } : a
    ));
  };

  const handleRejectAlert = (alert) => {
    // TODO: Implement reject logic
    console.log('Rejecting alert:', alert);
    setAlerts(alerts.map(a => 
      a.id === alert.id ? { ...a, status: 'rejected' } : a
    ));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Alert Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BellIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Emergency Alerts</h2>
                    <p className="text-red-100 text-sm">Real-time notifications</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Stats */}
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">{alerts.length} Active</span>
                </div>
                <div className="text-sm text-red-100">
                  {alerts.filter(a => a.status === 'pending').length} Pending
                </div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <BellIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No Active Alerts</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Alert Header */}
                      <div className={`bg-gradient-to-r ${getSeverityColor(alert.severity)} p-4 text-white`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                              {getAlertIcon(alert.type)}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{alert.emergencyType}</h3>
                              <p className="text-sm opacity-90">{alert.severity.toUpperCase()} Priority</p>
                            </div>
                          </div>
                          {alert.status === 'accepted' && (
                            <CheckCircleIcon className="w-6 h-6 text-green-300" />
                          )}
                        </div>
                      </div>

                      {/* Alert Body */}
                      <div className="p-4 space-y-3">
                        {/* Message */}
                        <p className="text-gray-700 font-medium">{alert.message}</p>

                        {/* User Info */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserIcon className="w-4 h-4" />
                            <span className="font-semibold">{alert.userName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            <a href={`tel:${alert.userPhone}`} className="hover:text-blue-600 font-medium">
                              {alert.userPhone}
                            </a>
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="bg-blue-50 p-3 rounded-xl space-y-2">
                          <div className="flex items-start space-x-2 text-sm">
                            <MapPinIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{alert.address}</span>
                          </div>
                          {alert.distance && (
                            <div className="text-xs text-blue-600 font-semibold">
                              📍 {alert.distance}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTimestamp(alert.timestamp)}</span>
                        </div>

                        {/* Media Attachments */}
                        {(alert.photo_urls?.length > 0 || alert.audio_url) && (
                          <div className="bg-purple-50 p-3 rounded-xl space-y-2">
                            <p className="text-xs font-semibold text-purple-700">📎 Media Evidence:</p>
                            
                            {/* Photo Thumbnails */}
                            {alert.photo_urls?.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {alert.photo_urls.map((photoUrl, photoIndex) => (
                                  <a
                                    key={photoIndex}
                                    href={`http://localhost:8000${photoUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative"
                                  >
                                    <img
                                      src={`http://localhost:8000${photoUrl}`}
                                      alt={`Evidence ${photoIndex + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border-2 border-purple-300 group-hover:border-purple-500 transition-all shadow-sm"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">View</span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Audio Player */}
                            {alert.audio_url && (
                              <div className="bg-white rounded-lg p-2 border border-purple-200">
                                <audio
                                  controls
                                  className="w-full h-8"
                                  style={{ maxHeight: '32px' }}
                                >
                                  <source src={`http://localhost:8000${alert.audio_url}`} type="audio/webm" />
                                  Your browser does not support audio playback.
                                </audio>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Map Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openInGoogleMaps(alert.location, alert.address)}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <MapPinIcon className="w-4 h-4" />
                            <span>View Location</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => getDirections(alert.location)}
                            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            <span>Directions</span>
                          </motion.button>
                        </div>

                        {/* Action Buttons */}
                        {alert.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAcceptAlert(alert)}
                              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                            >
                              Accept
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleRejectAlert(alert)}
                              className="px-4 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                            >
                              Decline
                            </motion.button>
                          </div>
                        )}

                        {alert.status === 'accepted' && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-green-700 font-bold">✓ Alert Accepted</p>
                            <p className="text-sm text-green-600 mt-1">You're responding to this emergency</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-100 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500">
                <p className="font-semibold">Emergency Response System</p>
                <p className="mt-1">Stay alert • Save lives</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AlertPanel;
