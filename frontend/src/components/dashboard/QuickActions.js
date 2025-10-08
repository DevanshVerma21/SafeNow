import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from '../../context/LocationContext';
import { 
  MapPinIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PhoneIcon,
  InformationCircleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QuickActions = () => {
  const { getCurrentLocation, startTracking, stopTracking, isTracking } = useLocation();

  const actions = [
    {
      id: 'location',
      title: 'Share Location',
      description: 'Share your current location with emergency contacts',
      icon: MapPinIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      action: async () => {
        try {
          const location = await getCurrentLocation();
          if (navigator.share) {
            await navigator.share({
              title: 'My Current Location',
              text: `I'm at: ${location.lat}, ${location.lng}`,
              url: `https://maps.google.com/?q=${location.lat},${location.lng}`
            });
          } else {
            // Fallback for browsers without native sharing
            navigator.clipboard.writeText(
              `https://maps.google.com/?q=${location.lat},${location.lng}`
            );
            toast.success('Location link copied to clipboard');
          }
        } catch (error) {
          toast.error('Failed to get location');
        }
      }
    },
    {
      id: 'tracking',
      title: isTracking ? 'Stop Tracking' : 'Start Tracking',
      description: 'Enable continuous location tracking for safety',
      icon: MapPinIcon,
      color: isTracking ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      bgColor: isTracking ? 'bg-red-50' : 'bg-green-50',
      action: () => {
        if (isTracking) {
          stopTracking();
        } else {
          startTracking();
        }
      }
    },
    {
      id: 'contacts',
      title: 'Emergency Contacts',
      description: 'Quick access to emergency contacts',
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      action: () => {
        // TODO: Open emergency contacts modal
        toast.success('Emergency contacts feature coming soon');
      }
    },
    {
      id: 'safe-mode',
      title: 'Safe Mode',
      description: 'Activate discrete safety monitoring',
      icon: ShieldCheckIcon,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      action: () => {
        // TODO: Implement safe mode
        toast.success('Safe mode feature coming soon');
      }
    },
    {
      id: 'hotline',
      title: 'Crisis Hotline',
      description: 'Connect with crisis support services',
      icon: PhoneIcon,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      action: () => {
        // Open crisis hotline numbers
        const phoneNumber = '988'; // National Suicide Prevention Lifeline
        window.open(`tel:${phoneNumber}`);
      }
    },
    {
      id: 'health',
      title: 'Health Check',
      description: 'Quick health status check-in',
      icon: HeartIcon,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      action: () => {
        // TODO: Implement health check feature
        toast.success('Health check feature coming soon');
      }
    }
  ];

  return (
    <div className="modern-card p-6">
      <div className="flex items-center mb-6">
        <InformationCircleIcon className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-bold gradient-text">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={action.action}
              className={`w-full p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 text-left ${action.bgColor}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Safety Tips */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Safety Tip</h4>
            <p className="text-xs text-yellow-800 mt-1">
              Keep your phone charged and location services enabled for the best emergency response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;