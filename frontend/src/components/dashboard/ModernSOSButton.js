import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  MicrophoneIcon,
  CameraIcon,
  StopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../common/GlassCard';
import ModernButton from '../common/ModernButton';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const ModernSOSButton = () => {
  const { getAuthHeaders } = useAuth();
  const { getCurrentLocation, currentLocation } = useLocation();
  const [isEmergency, setIsEmergency] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyType, setEmergencyType] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const emergencyTypes = [
    { 
      id: 'medical', 
      label: 'Medical Emergency', 
      icon: '🏥', 
      color: 'from-red-500 to-red-600',
      description: 'Health emergency, injury, or medical assistance needed'
    },
    { 
      id: 'fire', 
      label: 'Fire Emergency', 
      icon: '🔥', 
      color: 'from-orange-500 to-red-600',
      description: 'Fire, smoke, or burning hazard'
    },
    { 
      id: 'police', 
      label: 'Police Emergency', 
      icon: '👮‍♂️', 
      color: 'from-blue-500 to-blue-600',
      description: 'Crime, violence, or law enforcement needed'
    },
    { 
      id: 'safety', 
      label: 'Personal Safety', 
      icon: '🛡️', 
      color: 'from-purple-500 to-purple-600',
      description: 'Personal threat or safety concern'
    },
    { 
      id: 'accident', 
      label: 'Accident', 
      icon: '🚗', 
      color: 'from-yellow-500 to-orange-600',
      description: 'Vehicle accident or collision'
    },
    { 
      id: 'other', 
      label: 'Other Emergency', 
      icon: '⚠️', 
      color: 'from-gray-500 to-gray-600',
      description: 'Other urgent emergency situation'
    }
  ];

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            sendEmergencyAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSOSPress = () => {
    if (isEmergency) {
      // Cancel emergency
      setIsEmergency(false);
      setCountdown(0);
      setShowOptions(false);
      setIsPressed(false);
      toast.success('Emergency cancelled', {
        icon: '✅',
        style: {
          borderRadius: '16px',
          background: '#10b981',
          color: '#fff',
        },
      });
      return;
    }

    setShowOptions(true);
    setIsPressed(true);
  };

  const startEmergency = (type) => {
    setEmergencyType(type);
    setIsEmergency(true);
    setShowOptions(false);
    setCountdown(5); // 5 second countdown
    
    toast.error(`${emergencyTypes.find(t => t.id === type)?.label} initiated! Tap SOS again to cancel`, {
      duration: 5000,
      icon: '🚨',
      style: {
        borderRadius: '16px',
        background: '#ef4444',
        color: '#fff',
      },
    });
  };

  const sendEmergencyAlert = async () => {
    try {
      // Get current location
      let location = currentLocation;
      if (!location) {
        try {
          location = await getCurrentLocation();
        } catch (error) {
          toast.error('Could not get location. Sending without location data.');
        }
      }

      // Prepare alert data
      const alertData = {
        type: emergencyType,
        note: `Emergency alert from mobile app - ${emergencyTypes.find(t => t.id === emergencyType)?.label}`,
        location: location ? {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy
        } : null,
        priority: 'high',
        source: 'mobile_app'
      };

      const response = await axios.post(`${API_BASE}/alerts`, alertData, {
        headers: getAuthHeaders()
      });

      if (response.data) {
        toast.success('Emergency alert sent successfully! Help is on the way.', {
          duration: 10000,
          icon: '🚨',
          style: {
            borderRadius: '16px',
            background: '#10b981',
            color: '#fff',
          },
        });
        setIsEmergency(false);
        setIsPressed(false);
      }
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      toast.error('Failed to send emergency alert. Please try again or call emergency services directly.', {
        duration: 10000,
        style: {
          borderRadius: '16px',
          background: '#ef4444',
          color: '#fff',
        },
      });
      setIsEmergency(false);
      setIsPressed(false);
    }
  };

  return (
    <div className="relative">
      {/* Main SOS Button */}
      <motion.div className="flex flex-col items-center">
        <motion.button
          className={`relative w-32 h-32 rounded-full font-bold text-2xl text-white border-4 border-white/90 ${
            isEmergency 
              ? 'sos-button sos-pulse bg-gradient-to-br from-red-500 via-red-600 to-red-700' 
              : 'sos-button bg-gradient-to-br from-red-500 via-red-600 to-red-700'
          }`}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setTimeout(() => setIsPressed(false), 100)}
          onMouseLeave={() => setIsPressed(false)}
          onClick={handleSOSPress}
          whileHover={{ 
            scale: 1.05, 
            rotate: isEmergency ? [0, -5, 5, 0] : 0 
          }}
          whileTap={{ scale: 0.95 }}
          animate={isEmergency ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 15px 35px rgba(255, 8, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12), 0 0 0 0 rgba(255, 8, 68, 0.7)',
              '0 15px 35px rgba(255, 8, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12), 0 0 0 40px rgba(255, 8, 68, 0)',
              '0 15px 35px rgba(255, 8, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12), 0 0 0 0 rgba(255, 8, 68, 0.7)'
            ]
          } : {}}
          transition={{ duration: isEmergency ? 2 : 0.3, repeat: isEmergency ? Infinity : 0 }}
        >
          <motion.span
            animate={isEmergency ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: isEmergency ? Infinity : 0 }}
          >
            SOS
          </motion.span>
          
          {/* Countdown overlay */}
          {countdown > 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="text-6xl font-bold text-white"
                animate={{ scale: [1.2, 1] }}
                transition={{ duration: 0.5 }}
                key={countdown}
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}
        </motion.button>

        {/* Status text */}
        <motion.p 
          className="mt-4 text-center text-neutral-600 font-medium"
          animate={{ opacity: isEmergency ? [1, 0.5, 1] : 1 }}
          transition={{ duration: 1, repeat: isEmergency ? Infinity : 0 }}
        >
          {isEmergency 
            ? `Sending ${emergencyTypes.find(t => t.id === emergencyType)?.label || 'Emergency'} alert...`
            : 'Tap for emergency assistance'
          }
        </motion.p>
      </motion.div>

      {/* Emergency Type Selection Modal */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOptions(false)}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold gradient-text">Select Emergency Type</h3>
                  <button
                    onClick={() => setShowOptions(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {emergencyTypes.map((type, index) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => startEmergency(type.id)}
                      className={`group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r ${type.color} text-white text-left transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{type.label}</div>
                          <div className="text-sm opacity-90">{type.description}</div>
                        </div>
                        <ExclamationTriangleIcon className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-sm text-neutral-600 text-center">
                    Select the type that best describes your emergency. 
                    <br />
                    <span className="font-semibold">Emergency services will be notified immediately.</span>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernSOSButton;