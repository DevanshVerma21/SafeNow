import React from 'react';
import { motion } from 'framer-motion';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <UserGroupIcon className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold gradient-text mb-4">
            Administrator Dashboard
          </h1>
          
          <p className="text-gray-600 mb-8">
            Coming soon! Comprehensive admin interface for system management and analytics.
          </p>
          
          <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features in Development</h3>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• User management and role assignment</li>
              <li>• System analytics and reporting</li>
              <li>• Emergency response monitoring</li>
              <li>• Configuration and settings</li>
              <li>• Performance dashboards</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;