import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import HamburgerMenu from '../layout/HamburgerMenu';

const ResponderDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header with Hamburger Menu */}
        <div className="flex items-center justify-start mb-6 md:hidden">
          <HamburgerMenu />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Desktop Header with Hamburger Menu */}
          <div className="hidden md:flex items-center justify-start mb-6">
            <HamburgerMenu />
          </div>

          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 md:mb-6">
            <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
          </div>
          
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-4 px-4">
            Emergency Responder Dashboard
          </h1>
          
          <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base px-4">
            Coming soon! Advanced responder interface with alert queue, navigation, and real-time updates.
          </p>
          
          <div className="glass-effect rounded-xl p-6 md:p-8 max-w-md mx-auto">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Features in Development</h3>
            <ul className="text-left space-y-2 text-gray-600 text-sm md:text-base">
              <li>• Alert queue and priority management</li>
              <li>• GPS navigation to emergency locations</li>
              <li>• Real-time communication with dispatch</li>
              <li>• Status updates and availability control</li>
              <li>• Performance metrics and reporting</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResponderDashboard;