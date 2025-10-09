import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const AlertsDashboard = () => {
  const { alerts, markAlertAsDone } = useWebSocket();
  const { user, getAuthHeaders } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    pending: [],
    resolved: [],
    summary: { pending_count: 0, resolved_count: 0 }
  });
  const [activeTab, setActiveTab] = useState('pending');

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'recently';
    
    try {
      const date = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'recently';
      }
      
      // Check if the date is too far in the past (likely invalid)
      const now = new Date();
      const diffInYears = (now - date) / (1000 * 60 * 60 * 24 * 365);
      if (diffInYears > 1) {
        return 'recently';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return 'recently';
    }
  };

  const isResponder = user?.role === 'responder' || user?.role === 'admin';

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
      case 'done':
        return CheckCircleIcon;
      case 'cancelled':
        return XCircleIcon;
      case 'assigned':
      case 'in_progress':
        return ClockIcon;
      case 'pending':
        return ExclamationTriangleIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
      case 'done':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'assigned':
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
      case 'done':
        return 'Resolved';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getEmergencyIcon = (type) => {
    const icons = {
      'medical': '🏥',
      'fire': '🔥',
      'police': '👮‍♂️',
      'safety': '🛡️',
      'accident': '🚗',
      'disaster': '🌪️',
      'crime': '🚔',
      'other': '⚠️'
    };
    return icons[type] || '⚠️';
  };

  const handleMarkAsDone = async (alertId) => {
    try {
      const success = await markAlertAsDone(alertId);
      if (success) {
        console.log(`Alert ${alertId} marked as done`);
        // Refresh dashboard data after marking as done
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error marking alert as done:', error);
    }
  };

  // Fetch user's dashboard alerts (both pending and resolved)
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/alerts/user/dashboard`, {
        headers: getAuthHeaders()
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh when WebSocket alerts change
  useEffect(() => {
    fetchDashboardData();
  }, [alerts]);

  const renderAlertCard = (alert, index) => {
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
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize">
                {alert.type} Emergency
              </p>
              <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">
                {getStatusText(alert.status)}
              </span>
            </div>
            
            {alert.note && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {alert.note}
              </p>
            )}
            
            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
              <div className="flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" />
                {formatTimestamp(alert.created_at)}
              </div>
              
              {alert.location && (
                <div className="flex items-center">
                  <MapPinIcon className="w-3 h-3 mr-1" />
                  {alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}
                </div>
              )}

              {alert.resolved_at && activeTab === 'resolved' && (
                <div className="flex items-center">
                  <CheckCircleIcon className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    Resolved {formatTimestamp(alert.resolved_at)}
                  </span>
                </div>
              )}
            </div>

            {/* ETA Information for assigned alerts */}
            {alert.eta_seconds && alert.status === 'assigned' && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
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

            {/* Media Attachments */}
            {(alert.photo_urls?.length > 0 || alert.audio_url) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">📎 Media Evidence:</p>
                
                {/* Photo Thumbnails */}
                {alert.photo_urls?.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {alert.photo_urls.map((photoUrl, photoIndex) => (
                      <a
                        key={photoIndex}
                        href={`${API_BASE}${photoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                      >
                        <img
                          src={`${API_BASE}${photoUrl}`}
                          alt={`Evidence ${photoIndex + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100">View</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Audio Player */}
                {alert.audio_url && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <audio
                      controls
                      className="w-full h-8"
                      style={{ maxHeight: '32px' }}
                    >
                      <source src={`${API_BASE}${alert.audio_url}`} type="audio/webm" />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action buttons for pending alerts */}
          {alert.status === 'pending' && isResponder && (
            <div className="flex-shrink-0">
              <button
                onClick={() => handleMarkAsDone(alert.id)}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="Mark as Resolved"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Responder Actions for assigned/in-progress alerts */}
          {isResponder && (alert.status === 'assigned' || alert.status === 'in_progress') && (
            <div className="flex-shrink-0">
              <button
                onClick={() => handleMarkAsDone(alert.id)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors duration-200"
              >
                <CheckIcon className="w-3 h-3 mr-1" />
                Mark as Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="modern-card p-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Pending</span>
                {dashboardData.summary.pending_count > 0 && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {dashboardData.summary.pending_count}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4" />
                <span>Resolved</span>
                {dashboardData.summary.resolved_count > 0 && (
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {dashboardData.summary.resolved_count}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {activeTab === 'pending' ? 'Active Alerts' : 'Last 24 hours'}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'pending' ? (
          dashboardData.pending.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No Pending Alerts</h4>
              <p className="text-xs text-gray-500">All your alerts have been resolved</p>
            </div>
          ) : (
            dashboardData.pending.map((alert, index) => renderAlertCard(alert, index))
          )
        ) : (
          dashboardData.resolved.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No Recent Resolutions</h4>
              <p className="text-xs text-gray-500">Your resolved alerts from the last 24 hours will appear here</p>
            </div>
          ) : (
            dashboardData.resolved.map((alert, index) => renderAlertCard(alert, index))
          )
        )}
      </div>
    </div>
  );
};

export default AlertsDashboard;