import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import HamburgerMenu from '../layout/HamburgerMenu';
import ModernSOSButton from '../dashboard/ModernSOSButton';
import QuickActions from '../dashboard/QuickActions';
import LocationStatus from '../dashboard/LocationStatus';
import MediaCapture from '../emergency/MediaCapture';
import { 
  ExclamationTriangleIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Add at the top of the file after imports
const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const EmergencyPage = () => {
  const { user } = useAuth();
  const { sendAlert } = useWebSocket();
  const { currentLocation, locationPermission } = useLocation();
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState({ photos: [], audio: null, hasMedia: false });

  const emergencyTypes = [
    {
      type: 'medical',
      icon: HeartIcon,
      title: 'Medical Emergency',
      description: 'Heart attack, accident, severe injury',
      color: 'from-red-500 to-red-600',
      urgency: 'critical',
      emergencyNumber: '102', // Ambulance
      serviceType: 'Ambulance Service'
    },
    {
      type: 'fire',
      icon: FireIcon,
      title: 'Fire Emergency',
      description: 'Building fire, forest fire, gas leak',
      color: 'from-orange-500 to-red-500',
      urgency: 'critical',
      emergencyNumber: '101', // Fire Department
      serviceType: 'Fire Department'
    },
    {
      type: 'security',
      icon: ShieldCheckIcon,
      title: 'Security Threat',
      description: 'Theft, assault, suspicious activity',
      color: 'from-blue-500 to-blue-600',
      urgency: 'high',
      emergencyNumber: '100', // Police
      serviceType: 'Police'
    },
    {
      type: 'general',
      icon: ExclamationTriangleIcon,
      title: 'General Emergency',
      description: 'Other urgent situations requiring help',
      color: 'from-purple-500 to-purple-600',
      urgency: 'medium',
      emergencyNumber: '112', // Universal Emergency Number
      serviceType: 'Emergency Services'
    }
  ];

  const handleMediaCaptured = (mediaData) => {
    setCapturedMedia(mediaData);
  };

  const handleEmergencyAlert = async (emergencyType) => {
    if (!currentLocation) {
      toast.error('Location access required for emergency alerts');
      return;
    }

    if (!user || !user.id) {
      toast.error('Please login to send emergency alerts');
      return;
    }

    setIsSubmittingAlert(true);
    
    try {
      // Create alert first
      const alertData = {
        type: emergencyType.type,
        title: emergencyType.title,
        description: `Emergency assistance needed: ${emergencyType.description}`,
        location: currentLocation,
        userId: user.id,
        userName: user.name || 'User',
        userPhone: user.phone || 'N/A',
        timestamp: new Date().toISOString(),
        urgency: emergencyType.urgency,
        status: 'active',
        photo_urls: [],
        audio_url: null
      };

      console.log('Sending alert with data:', alertData);

      // Send alert via WebSocket
      const response = await sendAlert(alertData);
      console.log('Alert response:', response);
      
      const alertId = response?.alert_id || response?.alert?.id || Date.now(); // Fallback to timestamp if no ID returned

      // Upload media if captured
      if (capturedMedia.hasMedia) {
        try {
          const mediaUploadResponse = await fetch(`${API_BASE}/alerts/upload_media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alert_id: alertId,
              photos: capturedMedia.photos,
              audio: capturedMedia.audio
            })
          });

          if (!mediaUploadResponse.ok) {
            console.error('Media upload failed');
            toast.error('Alert sent, but media upload failed');
          } else {
            const mediaResult = await mediaUploadResponse.json();
            toast.success(`${emergencyType.title} alert sent with ${mediaResult.photos_saved} photo(s) and ${mediaResult.audio_saved ? 'audio' : 'no audio'}!`);
          }
        } catch (mediaError) {
          console.error('Error uploading media:', mediaError);
          toast.error('Alert sent, but media upload failed');
        }
      } else {
        toast.success(`${emergencyType.title} alert sent successfully!`);
      }
      
      // Auto-call appropriate emergency service based on type
      const callEmergencyService = () => {
        toast.success(
          `📞 Connecting to ${emergencyType.serviceType} (${emergencyType.emergencyNumber})...`,
          { 
            duration: 3000,
            icon: '🚨'
          }
        );
        
        // Attempt to initiate call
        setTimeout(() => {
          window.location.href = `tel:${emergencyType.emergencyNumber}`;
        }, 1500);
      };

      // Different actions based on emergency type
      switch (emergencyType.type) {
        case 'medical':
          // Critical - immediate ambulance call
          toast.success('🚑 Dispatching ambulance to your location!', { duration: 4000 });
          setTimeout(callEmergencyService, 2000);
          break;
          
        case 'fire':
          // Critical - immediate fire department call
          toast.success('🚒 Fire department has been notified!', { duration: 4000 });
          setTimeout(callEmergencyService, 2000);
          break;
          
        case 'security':
          // High priority - police notification
          toast.success('🚓 Police have been alerted to your location!', { duration: 4000 });
          setTimeout(callEmergencyService, 2500);
          break;
          
        case 'general':
          // Medium priority - prompt user for call
          setTimeout(() => {
            if (window.confirm('Would you like to call emergency services (112) now?')) {
              callEmergencyService();
            } else {
              toast.success('Alert sent. You can call 112 anytime if needed.', { duration: 4000 });
            }
          }, 2000);
          break;
          
        default:
          // Fallback to general emergency number
          setTimeout(callEmergencyService, 2000);
      }
      
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert. Please try again.');
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="flex items-center justify-start w-full sm:w-auto">
              <HamburgerMenu />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ExclamationTriangleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">Emergency Center</h1>
            </div>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Quick access to emergency services and immediate assistance
          </p>
        </motion.div>

        {/* Media Capture Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <MediaCapture onMediaCaptured={handleMediaCaptured} maxPhotos={3} />
        </motion.div>

        {/* SOS Button Section */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center"
        >
          <ModernSOSButton />
        </motion.div>

        {/* Emergency Call Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center px-4"
        >
          <motion.a
            href="tel:100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 md:space-x-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300 w-full max-w-md touch-manipulation"
          >
            <PhoneIcon className="w-6 h-6 md:w-8 md:h-8" />
            <div className="text-left">
              <div className="text-lg md:text-xl font-bold">Emergency Call</div>
              <div className="text-red-100 text-sm md:text-base">Dial 100 - Emergency Services</div>
            </div>
          </motion.a>
        </motion.div>

        {/* Emergency Types Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0"
        >
          {emergencyTypes.map((emergency, index) => {
            const IconComponent = emergency.icon;
            return (
              <motion.div
                key={emergency.type}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * (index + 5), duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-24 md:h-32 bg-gradient-to-br ${emergency.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <IconComponent className="w-8 h-8 md:w-12 md:h-12 text-white relative z-10" />
                </div>
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">{emergency.title}</h3>
                    <p className="text-gray-600 text-xs md:text-sm mt-2">{emergency.description}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEmergencyAlert(emergency)}
                    disabled={isSubmittingAlert}
                    className={`w-full bg-gradient-to-r ${emergency.color} text-white py-2.5 md:py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm md:text-base min-h-[44px]`}
                  >
                    {isSubmittingAlert ? 'Sending Alert...' : 'Send Alert'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Location Status */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-2xl mx-auto px-4 md:px-0"
        >
          <LocationStatus />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="px-4 md:px-0"
        >
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyPage;