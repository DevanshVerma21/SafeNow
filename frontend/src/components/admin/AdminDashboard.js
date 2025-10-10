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
import HamburgerMenu from '../layout/HamburgerMenu';

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

  const formatLocation = (location) => {
    if (!location) return 'Location unknown';
    // location might be an object { lat, lng, address } or a string
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    if (location.lat && location.lng) return `${location.lat.toFixed ? location.lat.toFixed(5) : location.lat}, ${location.lng.toFixed ? location.lng.toFixed(5) : location.lng}`;
    return 'Location unavailable';
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
    } catch (error) {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'open': 'bg-red-100 text-red-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'done': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  // Filter function
  const filterAlerts = (alerts) => {
    return alerts.filter(alert => {
      const matchesSearch = !searchQuery || 
        alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.user_name && alert.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (alert.user_phone && alert.user_phone.includes(searchQuery));
      
      const matchesType = filterType === 'all' || alert.type === filterType;
      const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center gap-3">
          <HamburgerMenu />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Emergency Response Management & Monitoring</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-800 font-medium">Live</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 touch-manipulation"
          >
            <ArrowPathIcon className={`w-4 h-4 md:w-5 md:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 touch-manipulation ${
              showFilters
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4 md:w-5 md:h-5" />
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base touch-manipulation"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 touch-manipulation"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base touch-manipulation"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base touch-manipulation"
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ExclamationTriangleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Active Alerts</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalActiveAlerts}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-2 md:mt-3">Requires immediate attention</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Responders Online</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalRespondersOnline}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-2 md:mt-3">Active and available</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.averageResponseTime}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-500 mt-2 md:mt-3">Based on recent alerts</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-green-500 mt-2 md:mt-3">Successfully handled</p>
        </motion.div>
      </div>

      {/* Alert Status Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Active Alerts Section */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200"
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                <h3 className="text-base md:text-lg font-bold text-gray-900">Active Alerts</h3>
                <span className="bg-red-100 text-red-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                  {activeAlerts.length}
                </span>
              </div>
              <button
                onClick={() => toggleSection('activeAlerts')}
                className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                {expandedSections.activeAlerts ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2 md:mb-3">{activeAlerts.length}</div>
            <p className="text-xs md:text-sm text-gray-600">Requiring immediate attention</p>

            <AnimatePresence>
              {expandedSections.activeAlerts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-6"
                >
                  {filterAlerts(activeAlerts).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                        ? 'No alerts match your filters' 
                        : 'No active alerts at the moment'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filterAlerts(activeAlerts).slice(0, 5).map((alert) => (
                        <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getAlertTypeIcon(alert.type)}
                              <div>
                                <p className="font-medium text-gray-900">{alert.user_name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500 capitalize">{alert.type}</p>
                                {/* Location display added */}
                                <div className="flex items-center space-x-2 mt-1">
                                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                                  <p className="text-xs text-gray-400 truncate">{formatLocation(alert.location)}</p>
                                  {/* Open in maps link when lat/lng available */}
                                  {alert.location && alert.location.lat && alert.location.lng && (
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${alert.location.lat},${alert.location.lng}`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-blue-600 hover:underline ml-2"
                                    >
                                      Open in maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => markAsResolved(alert.id)}
                              className="inline-flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Resolve</span>
                            </button>
                          </div>

                          {/* Media Attachments Section */}
                          {(alert.photo_urls?.length > 0 || alert.audio_url) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">📎 Evidence Attached:</p>
                              
                              {/* Photo Gallery */}
                              {alert.photo_urls?.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex gap-2 flex-wrap">
                                    {alert.photo_urls.map((photoUrl, index) => (
                                      <a
                                        key={index}
                                        href={`http://localhost:8000${photoUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative"
                                        title="Click to view full size"
                                      >
                                        <img
                                          src={`http://localhost:8000${photoUrl}`}
                                          alt={`Evidence ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-all shadow-sm"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100">View</span>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Audio Player */}
                              {alert.audio_url && (
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600 mb-1">🎤 Voice Message:</p>
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
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Active Responders Section */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900">Active Responders</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {activeResponders.length}
                </span>
              </div>
              <button
                onClick={() => toggleSection('activeResponders')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {expandedSections.activeResponders ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-4xl font-bold text-blue-600 mb-3">{activeResponders.length}</div>
            <p className="text-sm text-gray-600">Currently on duty</p>

            <AnimatePresence>
              {expandedSections.activeResponders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-6"
                >
                  {activeResponders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No active responders online</p>
                  ) : (
                    <div className="space-y-3">
                      {activeResponders.slice(0, 4).map((responder) => (
                        <div
                          key={responder.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {responder.name?.charAt(0)?.toUpperCase() || 'R'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{responder.name || 'Unknown'}</h4>
                              <p className="text-sm text-gray-500">{responder.specialization || 'General'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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