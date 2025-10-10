import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin-dashboard';
    if (user?.role === 'responder') return '/responder';
    return '/user-dashboard';
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-40 modern-card"
      style={{ borderRadius: '0 0 20px 20px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          <div className="flex items-center">
            <Link to={getDashboardPath()} className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 flex items-center justify-center"
              >
                <img src="/logo.svg" alt="SafeNow Logo" className="w-full h-full object-contain" />
              </motion.div>
              <span className="text-2xl font-bold gradient-text">
                SafeNow
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
