import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const ResponderDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6">
            <ShieldCheckIcon className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold gradient-text mb-4">
            Emergency Responder Dashboard
          </h1>
          
          <p className="text-gray-600 mb-8">
            Coming soon! Advanced responder interface with alert queue, navigation, and real-time updates.
          </p>
          
          <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features in Development</h3>
            <ul className="text-left space-y-2 text-gray-600">
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