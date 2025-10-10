import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import ModernSOSButton from './ModernSOSButton';
import QuickActions from './QuickActions';
import EmergencyContacts from './EmergencyContacts';
import AlertsDashboard from './AlertsDashboard';
import LocationStatus from './LocationStatus';
import LiveMap from './LiveMap';
import SafetyTips from './SafetyTips';
import GlassCard from '../common/GlassCard';
import ModernCard from '../common/ModernCard';
import StatusBadge from '../common/StatusBadge';
import HamburgerMenu from '../layout/HamburgerMenu';
import { 
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const ModernDashboard = () => {
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
      color: 'text-emergency-600',
      bgColor: 'bg-gradient-to-br from-emergency-50 to-emergency-100',
      iconBg: 'bg-emergency-500'
    },
    {
      icon: UserGroupIcon,
      label: 'Available Responders',
      value: stats.activeResponders,
      color: 'text-safe-600',
      bgColor: 'bg-gradient-to-br from-safe-50 to-safe-100',
      iconBg: 'bg-safe-500'
    },
    {
      icon: ClockIcon,
      label: 'Avg Response Time',
      value: stats.responseTime,
      color: 'text-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      iconBg: 'bg-primary-500'
    },
    {
      icon: MapPinIcon,
      label: 'Nearby Help',
      value: stats.nearbyHelp,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen py-4 md:py-6 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 md:mb-8"
        >
          <GlassCard className="p-4 md:p-8 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-400 to-primary-600"></div>
            </div>
            
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <HamburgerMenu />
                <div>
                  <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl md:text-3xl font-bold gradient-text font-display"
                  >
                    Welcome back, {user?.name || 'User'}!
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-neutral-600 mt-1 md:mt-2 text-base md:text-lg"
                  >
                    Stay safe and connected with emergency services
                  </motion.p>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 sm:mt-0 flex flex-wrap items-center gap-2 md:gap-3"
              >
                <StatusBadge 
                  status={connectionStatus === 'connected' ? 'online' : 'offline'}
                  size="md"
                >
                  {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                </StatusBadge>
                
                {locationPermission === 'granted' && (
                  <StatusBadge variant="success" size="md">
                    <MapPinIcon className="w-4 h-4" />
                    Location Active
                  </StatusBadge>
                )}
              </motion.div>
            </div>

            {/* Location Status */}
            {currentLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 pt-4 border-t border-white/20"
              >
                <div className="flex items-center text-sm text-neutral-600">
                  <MapPinIcon className="w-4 h-4 mr-2 text-primary-500" />
                  <span>Current Location: </span>
                  <span className="font-medium ml-1 font-mono">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </span>
                  <StatusBadge variant="success" size="sm" className="ml-3">
                    Active
                  </StatusBadge>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <ModernCard className={`p-6 ${stat.bgColor} border-0`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-2xl ${stat.iconBg} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  </div>
                </ModernCard>
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
              <GlassCard className="p-8 text-center">
                <motion.h2 
                  className="text-2xl font-bold gradient-text mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Emergency Assistance
                </motion.h2>
                <motion.p 
                  className="text-neutral-600 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Tap the SOS button below to instantly alert emergency services to your location
                </motion.p>
                <ModernSOSButton />
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <QuickActions />
            </motion.div>

            {/* Live Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <LiveMap />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Location Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <LocationStatus />
            </motion.div>

            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <EmergencyContacts />
            </motion.div>

            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <AlertsDashboard />
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <SafetyTips />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;