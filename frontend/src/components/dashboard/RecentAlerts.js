import React from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const RecentAlerts = () => {
  const { alerts } = useWebSocket();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return CheckCircleIcon;
      case 'cancelled':
        return XCircleIcon;
      case 'assigned':
        return ClockIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'assigned':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getEmergencyIcon = (type) => {
    const icons = {
      'medical': '🏥',
      'fire': '🔥',
      'police': '👮‍♂️',
      'safety': '🛡️',
      'accident': '🚗',
      'other': '⚠️'
    };
    return icons[type] || '⚠️';
  };

  const recentAlerts = alerts.slice(0, 5); // Show latest 5 alerts

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-xl font-bold gradient-text">Recent Alerts</h3>
        </div>
        
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      {recentAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">No Recent Alerts</h4>
          <p className="text-xs text-gray-500">Emergency alerts will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentAlerts.map((alert, index) => {
            const StatusIcon = getStatusIcon(alert.status);
            const statusColors = getStatusColor(alert.status);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${statusColors} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start space-x-3">
                  {/* Emergency Type Icon */}
                  <div className="text-2xl">
                    {getEmergencyIcon(alert.type)}
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {alert.type} Emergency
                      </h4>
                      <StatusIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {alert.note || 'Emergency assistance requested'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {alert.location && (
                          <div className="flex items-center space-x-1">
                            <MapPinIcon className="w-3 h-3" />
                            <span>
                              {alert.location.lat.toFixed(3)}, {alert.location.lng.toFixed(3)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(alert.created_at || Date.now()), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors}`}>
                        {alert.status}
                      </span>
                    </div>

                    {/* ETA Information */}
                    {alert.eta_seconds && alert.status === 'assigned' && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Estimated arrival:</span>
                          <span className="font-medium text-blue-600">
                            {Math.round(alert.eta_seconds / 60)} minutes
                          </span>
                        </div>
                        {alert.assigned_responder && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-600">Responder:</span>
                            <span className="font-medium text-gray-900">
                              {alert.assigned_responder}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View All Button */}
      {alerts.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Alerts ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;