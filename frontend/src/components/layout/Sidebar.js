import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useLocation } from '../../context/LocationContext';
import { useSidebar } from '../../context/SidebarContext';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  UserGroupIcon,
  BellIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  FireIcon,
  BuildingOffice2Icon,
  WifiIcon,
  SignalIcon,
  NoSymbolIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { notifications, connectionStatus } = useWebSocket();
  const { locationPermission, currentLocation } = useLocation();
  const { isOpen, closeSidebar, isMobile } = useSidebar();
  const location = useRouterLocation();
  // Alert panel removed from sidebar per request

  const getMenuItems = () => {
    const baseItems = [
      {
        icon: HomeIcon,
        label: 'Dashboard',
        path: user?.role === 'admin' ? '/admin-dashboard' : 
              user?.role === 'volunteer' || user?.role === 'responder' ? '/responder' : 
              '/user-dashboard',
        badge: null
      }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        {
          icon: ChartBarIcon,
          label: 'Analytics',
          path: '/admin-dashboard/analytics',
          badge: null
        },
        {
          icon: UserGroupIcon,
          label: 'Users',
          path: '/admin-dashboard/users',
          badge: null
        },
        {
          icon: ClipboardDocumentListIcon,
          label: 'Reports',
          path: '/admin-dashboard/reports',
          badge: null
        }
      ];
    } else if (user?.role === 'volunteer' || user?.role === 'responder') {
      return [
        ...baseItems,
        {
          icon: user?.specialization === 'Medical' ? HeartIcon :
                user?.specialization === 'Fire' ? FireIcon :
                user?.specialization === 'Police' ? BuildingOffice2Icon :
                ShieldCheckIcon,
          label: 'Emergency Response',
          path: '/responder',
          badge: null
        },
        {
          icon: MapPinIcon,
          label: 'Live Map',
          path: '/responder',
          badge: null
        },
        {
          icon: BellIcon,
          label: 'Notifications',
          path: '/responder',
          badge: notifications?.length > 0 ? notifications.length : null
        }
      ];
    } else {
      return [
        ...baseItems,
        {
          icon: ExclamationTriangleIcon,
          label: 'Emergency',
          path: '/emergency',
          badge: null
        },
        {
          icon: PhoneIcon,
          label: 'Emergency Contacts',
          path: '/emergency-contacts',
          badge: null
        },
        {
          icon: MapPinIcon,
          label: 'Live Map',
          path: '/live-map',
          badge: null
        }
      ];
    }
  };

  const menuItems = getMenuItems();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return {
          gradient: 'from-purple-600 via-purple-700 to-indigo-800',
          light: 'from-purple-50 to-indigo-50',
          accent: 'purple-600'
        };
      case 'volunteer':
      case 'responder':
        return {
          gradient: 'from-blue-600 via-blue-700 to-cyan-800',
          light: 'from-blue-50 to-cyan-50',
          accent: 'blue-600'
        };
      default:
        return {
          gradient: 'from-green-600 via-green-700 to-emerald-800',
          light: 'from-green-50 to-emerald-50',
          accent: 'green-600'
        };
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'volunteer':
      case 'responder':
        return { label: user?.specialization || 'Volunteer', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { label: 'Citizen', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon className="w-4 h-4 text-emerald-500" />;
      case 'connecting':
        return <SignalIcon className="w-4 h-4 text-amber-500 animate-pulse" />;
      default:
        return <NoSymbolIcon className="w-4 h-4 text-red-500" />;
    }
  };

  const roleColors = getRoleColor();
  const roleBadge = getRoleBadge();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSidebar}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{ 
          x: isOpen ? 0 : (isMobile ? -280 : 0), 
          opacity: isOpen ? 1 : (isMobile ? 0 : 1),
          width: isOpen ? (isMobile ? '288px' : '320px') : (isMobile ? '0px' : '320px')
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`${isMobile ? 'fixed' : 'relative'} ${isMobile ? 'left-0 top-0 h-screen' : 'h-screen'} ${isOpen || !isMobile ? 'w-72 md:w-80' : 'w-0'} bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-2xl border-r border-gray-200 ${isMobile ? 'z-40' : 'z-10'} flex flex-col backdrop-blur-xl ${
          !isOpen && isMobile ? 'pointer-events-none' : ''
        } ${!isOpen && !isMobile ? 'overflow-hidden' : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 50%, rgba(241,245,249,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={closeSidebar}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors z-50 md:hidden"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Brand Header with Enhanced Design */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="p-4 md:p-6 relative overflow-hidden"
        >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-95"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20 p-1"
          >
            <img src="/logo.svg" alt="SafeNow Logo" className="w-full h-full object-contain" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white drop-shadow-lg">SafeNow</h1>
            <p className="text-red-100 text-xs font-medium">Emergency Response</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Alert Notification Button */}
            {/* Alert button removed from sidebar; notifications remain available in responder views */}
            
            <div className="flex items-center space-x-1 text-xs text-white/90">
              {getConnectionIcon()}
              <MapPinIcon className={`w-3 h-3 ${locationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Profile Section */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-r ${roleColors.light} border border-gray-200 shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${roleColors.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 truncate text-lg">{user?.name || 'User'}</h3>
            <span className={`inline-block px-3 py-1 text-xs rounded-full border font-semibold ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2"
        >
          Navigation
        </motion.h4>
        
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * (index + 5), duration: 0.5 }}
              whileHover={{ x: 8 }}
            >
              <Link
                to={item.path}
                onClick={isMobile ? closeSidebar : undefined}
                className={`group flex items-center justify-between p-4 md:p-4 min-h-[56px] touch-manipulation rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? `bg-gradient-to-r ${roleColors.light} text-${roleColors.accent} shadow-lg border border-gray-200` 
                    : 'hover:bg-white/60 hover:shadow-md text-gray-700 hover:text-gray-900 active:bg-gray-100'
                }`}
                style={isActive ? {
                  boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'
                } : {}}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${roleColors.gradient} rounded-r-full`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="flex items-center space-x-3 flex-1">
                  <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? `text-${roleColors.accent}` : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="font-semibold truncate">{item.label}</span>
                </div>
                
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2.5 py-1 rounded-full min-w-[24px] text-center font-bold shadow-lg"
                    style={{
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {item.badge}
                  </motion.span>
                )}
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-xl"></div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="p-4 border-t border-gray-200 space-y-3 bg-gradient-to-t from-gray-50 to-transparent"
      >
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
          Quick Actions
        </h4>
        
        {/* Emergency Call */}
        <motion.a
          href="tel:100"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center space-x-3 p-4 min-h-[56px] touch-manipulation rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white transition-all duration-300 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl active:from-red-700 active:to-red-800"
          style={{
            boxShadow: '0 8px 25px -8px rgba(239, 68, 68, 0.4)'
          }}
        >
          <PhoneIcon className="w-5 h-5" />
          <span className="font-bold">Emergency Call 100</span>
        </motion.a>

        {/* Settings & Logout */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => alert('Settings functionality coming soon!')}
            className="flex items-center justify-center p-3 min-h-[48px] touch-manipulation rounded-xl bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 active:bg-gray-100"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="flex items-center justify-center p-3 min-h-[48px] touch-manipulation rounded-xl bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 hover:border-red-200 active:bg-red-100"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="p-4 text-center border-t border-gray-200 bg-gradient-to-t from-gray-50 to-transparent"
      >
        <div className="flex flex-col items-center space-y-2">
          <img src="/logo.svg" alt="SafeNow" className="w-8 h-8 opacity-75" />
          <div className="text-xs text-gray-500">
            <p className="font-bold text-red-600 mb-1">SafeNow</p>
            <p>Emergency Response System</p>
            <p className="mt-2 text-gray-400">v2.0.1</p>
          </div>
        </div>
      </motion.div>

      {/* Alert panel removed */}
      </motion.aside>
    </>
  );
};

export default Sidebar;