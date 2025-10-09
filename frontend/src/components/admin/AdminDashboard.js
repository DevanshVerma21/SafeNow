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
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import MapMarker from '../common/MapMarker';
import LocationPin from '../common/LocationPin';

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
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats for metrics cards
  const [stats, setStats] = useState({
    totalActiveAlerts: 0,
    totalRespondersOnline: 0,
    averageResponseTime: '0 min',
    resolvedToday: 0
  });

  // Fetch data from API
  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const headers = getAuthHeaders();
      
      const [alertsRes, respondersRes, recentRes] = await Promise.all([
        axios.get(`${API_BASE}/alerts/open`, { headers }),
        axios.get(`${API_BASE}/responders/active`, { headers }),
        axios.get(`${API_BASE}/alerts/recent`, { headers })
      ]);

      const openAlerts = alertsRes.data || [];
      const responders = respondersRes.data || [];
      const recent = recentRes.data || [];

      setActiveAlerts(openAlerts);
      setActiveResponders(responders);
      setRecentAlerts(recent);
      
      // Calculate stats
      const resolvedToday = recent.filter(alert => {
        if (!alert.marked_done_at && !alert.updated_at) return false;
        const doneDate = new Date(alert.marked_done_at || alert.updated_at);
        const today = new Date();
        return doneDate.toDateString() === today.toDateString();
      }).length;

      // Calculate average response time from recent alerts
      const responseTimes = recent
        .filter(alert => alert.created_at && alert.marked_done_at)
        .map(alert => {
          const start = new Date(alert.created_at);
          const end = new Date(alert.marked_done_at);
          return (end - start) / 1000 / 60; // minutes
        });
      
      const avgTime = responseTimes.length > 0
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
        : '0';

      setStats({
        totalActiveAlerts: openAlerts.length,
        totalRespondersOnline: responders.length,
        averageResponseTime: `${avgTime} min`,
        resolvedToday: resolvedToday
      });
      
      setLoading(false);
      if (showToast) {
        toast.success('Dashboard refreshed');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mark alert as resolved
  const markAsResolved = async (alertId) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_BASE}/alerts/${alertId}/mark-done`, {}, { headers });
      
      toast.success('Alert marked as resolved');
      
      // Update state immediately - move from active to recent
      const resolvedAlert = activeAlerts.find(a => a.id === alertId);
      if (resolvedAlert) {
        setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
        setRecentAlerts(prev => [{ ...resolvedAlert, status: 'done', marked_done_at: new Date().toISOString() }, ...prev]);
        setStats(prev => ({
          ...prev,
          totalActiveAlerts: prev.totalActiveAlerts - 1,
          resolvedToday: prev.resolvedToday + 1
        }));
      }
    } catch (error) {
      console.error('Error marking alert as resolved:', error);
      toast.error('Failed to mark alert as resolved');
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchData(true);
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

  // Calculate time since resolved (e.g., "10 mins ago", "2 hours ago")
  const getTimeSinceResolved = (resolvedAt) => {
    if (!resolvedAt) return '';
    
    try {
      const resolved = new Date(resolvedAt);
      const now = new Date();
      const diffMs = now - resolved;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return '';
    }
  };

  // Filter and search logic
  const filterAlerts = (alerts) => {
    return alerts.filter(alert => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        alert.id?.toLowerCase().includes(searchLower) ||
        alert.type?.toLowerCase().includes(searchLower) ||
        alert.user_name?.toLowerCase().includes(searchLower) ||
        alert.user_phone?.includes(searchQuery) ||
        (typeof alert.location === 'string' && alert.location.toLowerCase().includes(searchLower)) ||
        (typeof alert.location === 'object' && alert.location?.address?.toLowerCase().includes(searchLower));
      
      // Type filter
      const matchesType = filterType === 'all' || alert.type?.toLowerCase() === filterType.toLowerCase();
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || alert.status?.toLowerCase() === filterStatus.toLowerCase();
      
      return matchesSearch && matchesType && matchesStatus;
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
        {/* Header with Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Emergency Response Management & Monitoring</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800 font-medium">Live</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="modern-card p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by ID, type, user, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Type Filter */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="fire">Fire</option>
                      <option value="medical">Medical</option>
                      <option value="accident">Accident</option>
                      <option value="crime">Crime</option>
                      <option value="other">Other</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modern-card p-6 bg-gradient-to-br from-red-50 to-white border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Active Alerts</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalActiveAlerts}</p>
                <p className="text-xs text-red-500 mt-1">Requires immediate attention</p>
              </div>
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="modern-card p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Responders Online</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRespondersOnline}</p>
                <p className="text-xs text-blue-500 mt-1">Active and available</p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="modern-card p-6 bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averageResponseTime}</p>
                <p className="text-xs text-purple-500 mt-1">Based on recent alerts</p>
              </div>
              <ClockIcon className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="modern-card p-6 bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolvedToday}</p>
                <p className="text-xs text-green-500 mt-1">Successfully handled</p>
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
                    {filterAlerts(activeAlerts).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                          ? 'No alerts match your filters' 
                          : 'No active alerts at the moment'}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responder</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filterAlerts(activeAlerts).map((alert) => (
                              <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                  <div className="font-medium">{alert.id.substring(0, 8)}...</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{alert.user_name || 'Unknown'}</div>
                                    <div className="text-gray-500">{alert.user_phone}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    {getAlertTypeIcon(alert.type)}
                                    <span className="text-sm font-medium capitalize">{alert.type}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <LocationPin 
                                    location={alert.location} 
                                    alertType={alert.type}
                                    alertId={alert.id}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  {getStatusBadge(alert.status)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                  {alert.assigned_responder_id ? (
                                    <span className="text-blue-600">Assigned</span>
                                  ) : (
                                    <span className="text-gray-400">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {formatTime(alert.created_at)}
                                </td>
                                <td className="px-4 py-4">
                                  <button
                                    onClick={() => markAsResolved(alert.id)}
                                    className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    <span>Resolve</span>
                                  </button>
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
                <div>
                  <h2 className="text-xl font-bold">Recent Alerts History</h2>
                  <p className="text-xs text-white/80 mt-0.5">(Last 24 hours)</p>
                </div>
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
                    {filterAlerts(recentAlerts).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        {searchQuery || filterType !== 'all' 
                          ? 'No alerts match your filters' 
                          : 'No resolved alerts yet'}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Ago</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filterAlerts(recentAlerts).map((alert) => (
                              <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                  <div className="font-medium">{alert.id.substring(0, 8)}...</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{alert.user_name || 'Unknown'}</div>
                                    <div className="text-gray-500">{alert.user_phone}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    {getAlertTypeIcon(alert.type)}
                                    <span className="text-sm font-medium capitalize">{alert.type}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <LocationPin 
                                    location={alert.location} 
                                    alertType={alert.type}
                                    alertId={alert.id}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  {getStatusBadge(alert.status)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {formatTime(alert.resolved_at || alert.marked_done_at || alert.updated_at)}
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm text-green-600 font-medium">
                                    {getTimeSinceResolved(alert.resolved_at || alert.marked_done_at)}
                                  </span>
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