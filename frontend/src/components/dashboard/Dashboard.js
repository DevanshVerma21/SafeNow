import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import SOSButton from './SOSButton';
import QuickActions from './QuickActions';
import EmergencyContacts from './EmergencyContacts';
import RecentAlerts from './RecentAlerts';
import LocationStatus from './LocationStatus';
import LiveMap from './LiveMap';
import SafetyTips from './SafetyTips';
import { 
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { alerts, responders, connectionStatus } = useWebSocket();
  const { currentLocation, locationPermission } = useLocation();
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeResponders: 0,
    responseTime: '5.2 min',
    nearbyHelp: 0
  });

  useEffect(() => {
    // Update stats based on real data
    setStats(prev => ({
      ...prev,
      totalAlerts: alerts.length,
      activeResponders: responders.filter(r => r.status === 'available').length,
      nearbyHelp: responders.filter(r => {
        if (!currentLocation || !r.location) return false;
        const distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          r.location.lat, r.location.lng
        );
        return distance <= 5; // Within 5km
      }).length
    }));
  }, [alerts, responders, currentLocation]);

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

  const statsCards = [
    {
      icon: ExclamationTriangleIcon,
      label: 'Active Alerts',
      value: stats.totalAlerts,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: UserGroupIcon,
      label: 'Available Responders',
      value: stats.activeResponders,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: ClockIcon,
      label: 'Avg Response Time',
      value: stats.responseTime,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: MapPinIcon,
      label: 'Nearby Help',
      value: stats.nearbyHelp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen py-6 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="modern-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back!
                </h1>
                <p className="text-gray-600 mt-1">
                  Stay safe and connected with emergency services
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`modern-card p-6 border-l-4 ${stat.borderColor} card-hover`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* SOS Button Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SOSButton />
            </motion.div>

            {/* Live Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <LiveMap />
            </motion.div>

            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <RecentAlerts />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Location Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <LocationStatus />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <QuickActions />
            </motion.div>

            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <EmergencyContacts />
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <SafetyTips />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;