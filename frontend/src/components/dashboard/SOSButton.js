import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  StopIcon
} from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const SOSButton = () => {
  const { getAuthHeaders } = useAuth();
  const { getCurrentLocation, currentLocation } = useLocation();
  const [isEmergency, setIsEmergency] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyType, setEmergencyType] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
    { id: 'fire', label: 'Fire Emergency', icon: '🔥', color: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' },
    { id: 'police', label: 'Police Emergency', icon: '👮‍♂️', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'safety', label: 'Personal Safety', icon: '🛡️', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'accident', label: 'Accident', icon: '🚗', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'other', label: 'Other Emergency', icon: '⚠️', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
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
      toast.success('Emergency cancelled');
      return;
    }

    setShowOptions(true);
  };

  const startEmergency = (type) => {
    setEmergencyType(type);
    setIsEmergency(true);
    setShowOptions(false);
    setCountdown(5); // 5 second countdown
    toast.error('Emergency initiated! Tap again to cancel', {
      duration: 5000,
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
        media: audioBlob ? 'audio_recording_available' : null,
        priority: 'high',
        source: 'mobile_app'
      };

      // Send alert to backend
      const response = await axios.post(
        `${API_BASE}/alerts`,
        alertData,
        { headers: getAuthHeaders() }
      );

      setIsEmergency(false);
      setEmergencyType('');
      
      toast.success('🚨 Emergency alert sent! Help is on the way!', {
        duration: 10000,
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });

      // If we have audio, upload it
      if (audioBlob && response.data.id) {
        uploadAudio(response.data.id);
      }

    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      toast.error('Failed to send alert. Please try again or call emergency services directly.');
      setIsEmergency(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
      toast.success('Recording saved');
    }
  };

  const uploadAudio = async (alertId) => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'emergency_audio.wav');
    formData.append('alert_id', alertId);

    try {
      await axios.post(
        `${API_BASE}/alerts/${alertId}/media`,
        formData,
        { 
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success('Audio recording uploaded');
    } catch (error) {
      console.error('Failed to upload audio:', error);
    }
  };

  return (
    <div className="modern-card p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-2">Emergency SOS</h2>
        <p className="text-gray-600 mb-8">
          {isEmergency 
            ? `Sending ${emergencyTypes.find(t => t.id === emergencyType)?.label} alert in ${countdown}s...`
            : 'Press and hold to send emergency alert'
          }
        </p>

        {/* Main SOS Button */}
        <div className="flex justify-center mb-8">
          <motion.button
            onClick={handleSOSPress}
            whileHover={{ scale: isEmergency ? 1 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-56 h-56 rounded-full transition-all duration-300 ${
              isEmergency ? 'sos-pulse' : 'sos-button sos-pulse'
            }`}
            style={isEmergency ? {
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              boxShadow: '0 10px 40px rgba(107, 114, 128, 0.4)'
            } : {}}
          >
            <div className="flex flex-col items-center justify-center h-full text-white">
              {isEmergency ? (
                <>
                  <StopIcon className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">CANCEL</span>
                  <span className="text-6xl font-bold">{countdown}</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-16 h-16 mb-2" />
                  <span className="text-3xl font-bold">SOS</span>
                </>
              )}
            </div>

            {/* Countdown ring */}
            {isEmergency && (
              <motion.div
                initial={{ strokeDasharray: "0 628" }}
                animate={{ strokeDasharray: `${628 * (5 - countdown) / 5} 628` }}
                transition={{ duration: 1, ease: "linear" }}
                className="absolute inset-0"
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="100"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="628"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        </div>

        {/* Emergency Type Selection */}
        {showOptions && !isEmergency && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Emergency Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {emergencyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => startEmergency(type.id)}
                  className={`p-4 rounded-lg border-2 border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 transition-all duration-200 text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowOptions(false)}
              className="mt-4 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Quick Actions */}
        {!isEmergency && !showOptions && (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => getCurrentLocation()}
              className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
            >
              <MapPinIcon className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Update Location</span>
            </button>

            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex flex-col items-center p-4 rounded-lg transition-colors duration-200 ${
                recording 
                  ? 'bg-red-50 hover:bg-red-100' 
                  : 'bg-green-50 hover:bg-green-100'
              }`}
            >
              <MicrophoneIcon className={`w-8 h-8 mb-2 ${
                recording ? 'text-red-600' : 'text-green-600'
              }`} />
              <span className={`text-sm font-medium ${
                recording ? 'text-red-900' : 'text-green-900'
              }`}>
                {recording ? 'Stop Recording' : 'Record Audio'}
              </span>
            </button>

            <button
              onClick={() => window.open('tel:911')}
              className="flex flex-col items-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors duration-200"
            >
              <PhoneIcon className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Call 911</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSButton;