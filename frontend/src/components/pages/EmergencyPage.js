import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import ModernSOSButton from '../dashboard/ModernSOSButton';
import QuickActions from '../dashboard/QuickActions';
import LocationStatus from '../dashboard/LocationStatus';
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

const EmergencyPage = () => {
  const { user } = useAuth();
  const { sendAlert } = useWebSocket();
  const { currentLocation, locationPermission } = useLocation();
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);

  const emergencyTypes = [
    {
      type: 'medical',
      icon: HeartIcon,
      title: 'Medical Emergency',
      description: 'Heart attack, accident, severe injury',
      color: 'from-red-500 to-red-600',
      urgency: 'critical'
    },
    {
      type: 'fire',
      icon: FireIcon,
      title: 'Fire Emergency',
      description: 'Building fire, forest fire, gas leak',
      color: 'from-orange-500 to-red-500',
      urgency: 'critical'
    },
    {
      type: 'security',
      icon: ShieldCheckIcon,
      title: 'Security Threat',
      description: 'Theft, assault, suspicious activity',
      color: 'from-blue-500 to-blue-600',
      urgency: 'high'
    },
    {
      type: 'general',
      icon: ExclamationTriangleIcon,
      title: 'General Emergency',
      description: 'Other urgent situations requiring help',
      color: 'from-purple-500 to-purple-600',
      urgency: 'medium'
    }
  ];

  const handleEmergencyAlert = async (emergencyType) => {
    if (!currentLocation) {
      toast.error('Location access required for emergency alerts');
      return;
    }

    setIsSubmittingAlert(true);
    
    try {
      const alertData = {
        type: emergencyType.type,
        title: emergencyType.title,
        description: `Emergency assistance needed: ${emergencyType.description}`,
        location: currentLocation,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        timestamp: new Date().toISOString(),
        urgency: emergencyType.urgency,
        status: 'active'
      };

      await sendAlert(alertData);
      toast.success(`${emergencyType.title} alert sent successfully!`);
      
      // Auto-call emergency services for critical emergencies
      if (emergencyType.urgency === 'critical') {
        setTimeout(() => {
          toast.success('Connecting to emergency services (100)...');
          window.location.href = 'tel:100';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert. Please try again.');
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Emergency Center</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Quick access to emergency services and immediate assistance
          </p>
        </motion.div>

        {/* SOS Button Section */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center"
        >
          <ModernSOSButton />
        </motion.div>

        {/* Emergency Call Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center"
        >
          <motion.a
            href="tel:100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
          >
            <PhoneIcon className="w-8 h-8" />
            <div className="text-left">
              <div className="text-xl font-bold">Emergency Call</div>
              <div className="text-red-100">Dial 100 - Emergency Services</div>
            </div>
          </motion.a>
        </motion.div>

        {/* Emergency Types Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                <div className={`h-32 bg-gradient-to-br ${emergency.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <IconComponent className="w-12 h-12 text-white relative z-10" />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{emergency.title}</h3>
                    <p className="text-gray-600 text-sm mt-2">{emergency.description}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEmergencyAlert(emergency)}
                    disabled={isSubmittingAlert}
                    className={`w-full bg-gradient-to-r ${emergency.color} text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
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
          className="max-w-2xl mx-auto"
        >
          <LocationStatus />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyPage;