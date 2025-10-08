import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-8"
        >
          <div 
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
              boxShadow: '0 15px 60px rgba(255, 8, 68, 0.5), 0 0 0 12px rgba(255, 8, 68, 0.1)'
            }}
          >
            <span className="text-white text-4xl font-bold">SOS</span>
          </div>
        </motion.div>

        {/* Loading animation */}
        <div className="flex justify-center mb-6">
          <div className="loading-dots">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-3 h-3 bg-blue-500 rounded-full absolute left-0"
            />
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 bg-purple-500 rounded-full absolute left-6"
            />
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 bg-pink-500 rounded-full absolute left-12"
            />
          </div>
        </div>

        {/* Loading text */}
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl font-semibold text-gray-700 mb-2"
        >
          {message}
        </motion.h2>
        
        <p className="text-gray-500">
          Initializing emergency response system...
        </p>

        {/* Progress bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-1/3"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;