import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  UserGroupIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const AdminDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [activeResponders, setActiveResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    activeAlerts: true,
    activeResponders: true,
    recentAlerts: true
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [alertsRes, respondersRes, recentRes] = await Promise.all([
        axios.get(`${API_BASE}/alerts/open`, { headers }),
        axios.get(`${API_BASE}/responders/active`, { headers }),
        axios.get(`${API_BASE}/alerts/recent`, { headers })
      ]);

      setActiveAlerts(alertsRes.data || []);
      setActiveResponders(respondersRes.data || []);
      setRecentAlerts(recentRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAlertTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'fire':
        return <FireIcon className="w-5 h-5 text-red-500" />;
      case 'medical':
        return <ShieldCheckIcon className="w-5 h-5 text-blue-500" />;
      case 'accident':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Updates</span>
            </div>
          </div>
          <p className="text-gray-600">Real-time emergency response system monitoring</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modern-card p-6 bg-gradient-to-br from-red-50 to-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600">{activeAlerts.length}</p>
              </div>
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="modern-card p-6 bg-gradient-to-br from-blue-50 to-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Responders</p>
                <p className="text-3xl font-bold text-blue-600">{activeResponders.length}</p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="modern-card p-6 bg-gradient-to-br from-green-50 to-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600">{recentAlerts.length}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Active Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="modern-card overflow-hidden">
            <button
              onClick={() => toggleSection('activeAlerts')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-all"
            >
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Active Alerts</h2>
                <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
                  {activeAlerts.length}
                </span>
              </div>
              {expandedSections.activeAlerts ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.activeAlerts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    {activeAlerts.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No active alerts at the moment</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised By</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {activeAlerts.map((alert) => (
                              <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                  {alert.id.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    {getAlertTypeIcon(alert.type)}
                                    <span className="text-sm font-medium">{alert.type}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                  {typeof alert.location === 'object' 
                                    ? (alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`) 
                                    : (alert.location || 'Unknown')}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{alert.user_name || 'Unknown'}</div>
                                    <div className="text-gray-500">{alert.user_phone}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {formatTime(alert.created_at)}
                                </td>
                                <td className="px-4 py-4">
                                  {getStatusBadge(alert.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Active Responders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="modern-card overflow-hidden">
            <button
              onClick={() => toggleSection('activeResponders')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Active Responders</h2>
                <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
                  {activeResponders.length}
                </span>
              </div>
              {expandedSections.activeResponders ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.activeResponders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    {activeResponders.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No active responders online</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeResponders.map((responder) => (
                          <div
                            key={responder.id}
                            className="glass-effect p-4 rounded-lg hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {responder.name?.charAt(0) || 'R'}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{responder.name || 'Responder'}</h3>
                                  <p className="text-xs text-gray-500 capitalize">{responder.specialization || responder.role || 'Volunteer'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600">Online</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-gray-600">
                                <PhoneIcon className="w-4 h-4 mr-2" />
                                {responder.phone || 'N/A'}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPinIcon className="w-4 h-4 mr-2" />
                                {typeof responder.location === 'object'
                                  ? (responder.location?.address || `${responder.location?.lat?.toFixed(4)}, ${responder.location?.lng?.toFixed(4)}`)
                                  : (responder.location || 'Location not available')}
                              </div>
                              {responder.assigned_alerts_count > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <span className="text-xs font-medium text-orange-600">
                                    Assigned: {responder.assigned_alerts_count} alert(s)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Alerts History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="modern-card overflow-hidden">
            <button
              onClick={() => toggleSection('recentAlerts')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <div className="flex items-center space-x-3">
                <ClockIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">Recent Alerts History</h2>
                <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
                  {recentAlerts.length}
                </span>
              </div>
              {expandedSections.recentAlerts ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.recentAlerts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    {recentAlerts.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No resolved alerts yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentAlerts.map((alert) => (
                              <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                  {alert.id.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    {getAlertTypeIcon(alert.type)}
                                    <span className="text-sm font-medium">{alert.type}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                  {typeof alert.location === 'object'
                                    ? (alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`)
                                    : (alert.location || 'Unknown')}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{alert.user_name || 'Unknown'}</div>
                                    <div className="text-gray-500">{alert.user_phone}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {formatTime(alert.marked_done_at || alert.updated_at)}
                                </td>
                                <td className="px-4 py-4">
                                  {getStatusBadge(alert.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;