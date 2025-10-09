import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import AlertsDashboard from '../dashboard/AlertsDashboard';
import RecentAlerts from '../dashboard/RecentAlerts';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  HeartIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AlertsPage = () => {
  const { user } = useAuth();
  const { alerts, responders, sendAlert, connectionStatus } = useWebSocket();
  const { currentLocation, locationPermission } = useLocation();
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    pending: 0
  });

  useEffect(() => {
    updateAlertStats();
  }, [alerts]);

  const updateAlertStats = () => {
    const stats = alerts.reduce((acc, alert) => {
      acc.total++;
      if (alert.status === 'active') acc.active++;
      else if (alert.status === 'resolved') acc.resolved++;
      else if (alert.status === 'pending') acc.pending++;
      return acc;
    }, { total: 0, active: 0, resolved: 0, pending: 0 });

    setAlertStats(stats);
  };

  const getFilteredAlerts = () => {
    let filtered = alerts;
    
    if (selectedTab === 'active') {
      filtered = alerts.filter(alert => alert.status === 'active');
    } else if (selectedTab === 'resolved') {
      filtered = alerts.filter(alert => alert.status === 'resolved');
    } else if (selectedTab === 'my-alerts') {
      filtered = alerts.filter(alert => alert.userId === user.id);
    } else if (selectedTab === 'nearby') {
      filtered = alerts.filter(alert => {
        if (!currentLocation || !alert.location) return false;
        const distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          alert.location.lat, alert.location.lng
        );
        return distance <= 10; // Within 10km
      });
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'medical':
        return HeartIcon;
      case 'fire':
        return FireIcon;
      case 'security':
        return ShieldCheckIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getAlertColor = (type, status) => {
    if (status === 'resolved') return 'from-green-500 to-green-600';
    
    switch (type) {
      case 'medical':
        return 'from-red-500 to-red-600';
      case 'fire':
        return 'from-orange-500 to-red-500';
      case 'security':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-purple-500 to-purple-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return CheckCircleIcon;
      case 'active':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'active':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-amber-600 bg-amber-100';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleCreateQuickAlert = async (type) => {
    if (!currentLocation) {
      toast.error('Location access required for emergency alerts');
      return;
    }

    try {
      const alertData = {
        type: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Emergency`,
        description: `Quick ${type} alert created by ${user.name}`,
        location: currentLocation,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        timestamp: new Date().toISOString(),
        urgency: 'high',
        status: 'active'
      };

      await sendAlert(alertData);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} alert sent successfully!`);
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert. Please try again.');
    }
  };

  const tabOptions = [
    {
      key: 'active',
      label: 'Active Alerts',
      icon: ExclamationTriangleIcon,
      color: 'from-red-500 to-red-600',
      count: alertStats.active
    },
    {
      key: 'resolved',
      label: 'Resolved',
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      count: alertStats.resolved
    },
    {
      key: 'my-alerts',
      label: 'My Alerts',
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      count: alerts.filter(a => a.userId === user.id).length
    },
    {
      key: 'nearby',
      label: 'Nearby',
      icon: MapPinIcon,
      color: 'from-purple-500 to-purple-600',
      count: alerts.filter(a => {
        if (!currentLocation || !a.location) return false;
        const distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          a.location.lat, a.location.lng
        );
        return distance <= 10;
      }).length
    }
  ];

  const quickAlertTypes = [
    { type: 'medical', label: 'Medical', icon: HeartIcon, color: 'from-red-500 to-red-600' },
    { type: 'fire', label: 'Fire', icon: FireIcon, color: 'from-orange-500 to-red-500' },
    { type: 'security', label: 'Security', icon: ShieldCheckIcon, color: 'from-blue-500 to-blue-600' },
    { type: 'general', label: 'General', icon: ExclamationTriangleIcon, color: 'from-purple-500 to-purple-600' }
  ];

  const statsCards = [
    {
      icon: BellIcon,
      label: 'Total Alerts',
      value: alertStats.total,
      color: 'text-gray-600',
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
      iconBg: 'bg-gray-500'
    },
    {
      icon: ExclamationTriangleIcon,
      label: 'Active Alerts',
      value: alertStats.active,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      iconBg: 'bg-red-500'
    },
    {
      icon: CheckCircleIcon,
      label: 'Resolved',
      value: alertStats.resolved,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-500'
    },
    {
      icon: ClockIcon,
      label: 'Pending',
      value: alertStats.pending,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500'
    }
  ];

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
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Emergency Alerts</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Monitor and manage emergency alerts in your area
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * (index + 3), duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Alert Creation */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-800">Quick Alert Creation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAlertTypes.map((alertType, index) => {
              const IconComponent = alertType.icon;
              return (
                <motion.button
                  key={alertType.type}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 7), duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCreateQuickAlert(alertType.type)}
                  className={`p-4 bg-gradient-to-r ${alertType.color} text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <IconComponent className="w-5 h-5" />
                    <span className="font-semibold">{alertType.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Alert Tabs */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap gap-4">
            {tabOptions.map((tab, index) => {
              const IconComponent = tab.icon;
              const isSelected = selectedTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 11), duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                    isSelected 
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Alert List */}
          <div className="space-y-4">
            {getFilteredAlerts().length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">No alerts found</p>
                <p className="text-gray-500">
                  {selectedTab === 'active' ? 'No active alerts in your area' :
                   selectedTab === 'resolved' ? 'No resolved alerts to display' :
                   selectedTab === 'my-alerts' ? 'You haven\'t created any alerts yet' :
                   'No nearby alerts found'}
                </p>
              </div>
            ) : (
              getFilteredAlerts().map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type);
                const StatusIcon = getStatusIcon(alert.status);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getAlertColor(alert.type, alert.status)} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <AlertIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-800 truncate">{alert.title}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {alert.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{getTimeAgo(alert.timestamp)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPinIcon className="w-4 h-4" />
                                <span>
                                  {alert.location && currentLocation ? 
                                    `${calculateDistance(
                                      currentLocation.lat, currentLocation.lng,
                                      alert.location.lat, alert.location.lng
                                    ).toFixed(1)} km away` : 
                                    'Location unavailable'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <UserGroupIcon className="w-4 h-4" />
                                <span>{alert.userName || 'Anonymous'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Legacy Components */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-8"
        >
          <AlertsDashboard />
          <RecentAlerts />
        </motion.div>
      </div>
    </div>
  );
};

export default AlertsPage;