import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  BellIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SignalIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { connectionStatus, notifications, clearAllNotifications } = useWebSocket();
  const { locationPermission, currentLocation } = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useRouterLocation();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <SignalIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'disconnected':
      case 'error':
        return <NoSymbolIcon className="w-4 h-4 text-red-500" />;
      default:
        return <NoSymbolIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLocationIcon = () => {
    switch (locationPermission) {
      case 'granted':
        return currentLocation ? 
          <MapPinIcon className="w-4 h-4 text-green-500" /> :
          <MapPinIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'denied':
        return <NoSymbolIcon className="w-4 h-4 text-red-500" />;
      default:
        return <MapPinIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard', roles: ['citizen', 'responder', 'admin'] },
    { path: '/responder', icon: ShieldCheckIcon, label: 'Responder', roles: ['responder'] },
    { path: '/admin', icon: UserGroupIcon, label: 'Admin', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 modern-card"
      style={{ borderRadius: '0 0 20px 20px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">SOS</span>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                Emergency Response
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Status indicators */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1" title={`Connection: ${connectionStatus}`}>
                {getConnectionIcon()}
              </div>
              <div className="flex items-center space-x-1" title={`Location: ${locationPermission}`}>
                {getLocationIcon()}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                <BellIcon className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass-effect rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No new notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 bg-white/50 rounded-lg border border-white/20"
                          >
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.phone}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;