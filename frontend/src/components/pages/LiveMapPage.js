import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import HamburgerMenu from '../layout/HamburgerMenu';
import LiveMap from '../dashboard/LiveMap';
import LocationStatus from '../dashboard/LocationStatus';
import { 
  MapPinIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  HeartIcon,
  FireIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

const LiveMapPage = () => {
  const { user } = useAuth();
  const { alerts, responders, connectionStatus } = useWebSocket();
  const { currentLocation, locationPermission } = useLocation();
  const [mapStats, setMapStats] = useState({
    activeAlerts: 0,
    nearbyResponders: 0,
    coverage: '95%',
    lastUpdate: new Date()
  });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedResponderType, setSelectedResponderType] = useState('all');

  useEffect(() => {
    updateMapStats();
  }, [alerts, responders, currentLocation]);

  const updateMapStats = () => {
    const activeAlerts = alerts.filter(alert => alert.status === 'active').length;
    
    const nearbyResponders = responders.filter(responder => {
      if (!currentLocation || !responder.location) return false;
      const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        responder.location.lat, responder.location.lng
      );
      return distance <= 10; // Within 10km
    }).length;

    setMapStats({
      activeAlerts,
      nearbyResponders,
      coverage: `${Math.min(95 + Math.random() * 5, 100).toFixed(0)}%`,
      lastUpdate: new Date()
    });
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

  const getFilteredAlerts = () => {
    let filtered = alerts;
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(alert => {
        if (selectedFilter === 'active') return alert.status === 'active';
        if (selectedFilter === 'resolved') return alert.status === 'resolved';
        if (selectedFilter === 'nearby') {
          if (!currentLocation || !alert.location) return false;
          const distance = calculateDistance(
            currentLocation.lat, currentLocation.lng,
            alert.location.lat, alert.location.lng
          );
          return distance <= 5;
        }
        return true;
      });
    }
    
    return filtered;
  };

  const getFilteredResponders = () => {
    let filtered = responders;
    
    if (selectedResponderType !== 'all') {
      filtered = filtered.filter(responder => {
        if (selectedResponderType === 'medical') return responder.specialization === 'Medical';
        if (selectedResponderType === 'fire') return responder.specialization === 'Fire';
        if (selectedResponderType === 'police') return responder.specialization === 'Police';
        if (selectedResponderType === 'available') return responder.status === 'available';
        return true;
      });
    }
    
    return filtered;
  };

  const mapControls = [
    {
      key: 'all',
      label: 'All Alerts',
      icon: ExclamationTriangleIcon,
      color: 'from-gray-500 to-gray-600',
      count: alerts.length
    },
    {
      key: 'active',
      label: 'Active',
      icon: ExclamationTriangleIcon,
      color: 'from-red-500 to-red-600',
      count: alerts.filter(a => a.status === 'active').length
    },
    {
      key: 'nearby',
      label: 'Nearby',
      icon: MapPinIcon,
      color: 'from-blue-500 to-blue-600',
      count: alerts.filter(a => {
        if (!currentLocation || !a.location) return false;
        const distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          a.location.lat, a.location.lng
        );
        return distance <= 5;
      }).length
    },
    {
      key: 'resolved',
      label: 'Resolved',
      icon: ShieldCheckIcon,
      color: 'from-green-500 to-green-600',
      count: alerts.filter(a => a.status === 'resolved').length
    }
  ];

  const responderControls = [
    {
      key: 'all',
      label: 'All Responders',
      icon: UserGroupIcon,
      color: 'from-gray-500 to-gray-600',
      count: responders.length
    },
    {
      key: 'available',
      label: 'Available',
      icon: UserGroupIcon,
      color: 'from-green-500 to-green-600',
      count: responders.filter(r => r.status === 'available').length
    },
    {
      key: 'medical',
      label: 'Medical',
      icon: HeartIcon,
      color: 'from-red-500 to-pink-600',
      count: responders.filter(r => r.specialization === 'Medical').length
    },
    {
      key: 'fire',
      label: 'Fire',
      icon: FireIcon,
      color: 'from-orange-500 to-red-600',
      count: responders.filter(r => r.specialization === 'Fire').length
    },
    {
      key: 'police',
      label: 'Police',
      icon: BuildingOffice2Icon,
      color: 'from-blue-500 to-blue-600',
      count: responders.filter(r => r.specialization === 'Police').length
    }
  ];

  const statsCards = [
    {
      icon: ExclamationTriangleIcon,
      label: 'Active Alerts',
      value: mapStats.activeAlerts,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      iconBg: 'bg-red-500'
    },
    {
      icon: UserGroupIcon,
      label: 'Nearby Responders',
      value: mapStats.nearbyResponders,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500'
    },
    {
      icon: EyeIcon,
      label: 'Coverage Area',
      value: mapStats.coverage,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-500'
    },
    {
      icon: ClockIcon,
      label: 'Last Updated',
      value: mapStats.lastUpdate.toLocaleTimeString(),
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="flex items-center justify-start w-full sm:w-auto">
              <HamburgerMenu />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPinIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">Live Emergency Map</h1>
            </div>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Real-time view of emergency alerts and responder locations in your area
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
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
                className={`${stat.bgColor} rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-lg md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Map Controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4 md:space-y-6"
        >
          {/* Alert Filters */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-bold text-gray-800 px-4 md:px-0">Alert Filters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
              {mapControls.map((control, index) => {
                const IconComponent = control.icon;
                const isSelected = selectedFilter === control.key;
                return (
                  <motion.button
                    key={control.key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * (index + 5), duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFilter(control.key)}
                    className={`p-3 md:p-4 rounded-2xl transition-all duration-300 min-h-[80px] touch-manipulation ${
                      isSelected 
                        ? `bg-gradient-to-r ${control.color} text-white shadow-lg` 
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between h-full">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-semibold text-xs md:text-sm lg:text-base">{control.label}</span>
                      </div>
                      <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                        isSelected ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {control.count}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Responder Filters */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-bold text-gray-800 px-4 md:px-0">Responder Filters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 px-4 md:px-0">
              {responderControls.map((control, index) => {
                const IconComponent = control.icon;
                const isSelected = selectedResponderType === control.key;
                return (
                  <motion.button
                    key={control.key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * (index + 9), duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedResponderType(control.key)}
                    className={`p-3 md:p-4 rounded-2xl transition-all duration-300 min-h-[80px] touch-manipulation ${
                      isSelected 
                        ? `bg-gradient-to-r ${control.color} text-white shadow-lg` 
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between h-full">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-semibold text-xs md:text-sm">{control.label}</span>
                      </div>
                      <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                        isSelected ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {control.count}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Live Map Component */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mx-4 md:mx-0"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Real-Time Emergency Map</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <span className="text-sm text-gray-600">
                  {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <LiveMap 
              alerts={getFilteredAlerts()} 
              responders={getFilteredResponders()}
              height="400px"
              className="w-full h-full"
            />
          </div>
        </motion.div>

        {/* Location Status */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-2xl mx-auto px-4 md:px-0"
        >
          <LocationStatus />
        </motion.div>
      </div>
    </div>
  );
};

export default LiveMapPage;