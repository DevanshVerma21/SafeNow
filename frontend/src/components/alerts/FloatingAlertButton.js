import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../context/WebSocketContext';
import AlertPanel from '../alerts/AlertPanel';
import { BellIcon } from '@heroicons/react/24/outline';

const FloatingAlertButton = () => {
  const { notifications } = useWebSocket();
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);

  return (
    <>
      {/* Floating Alert Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAlertPanelOpen(true)}
        className="fixed bottom-24 right-6 z-40 w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-red-500/50 transition-all duration-300"
        style={{
          boxShadow: '0 10px 40px rgba(239, 68, 68, 0.5)'
        }}
      >
        <BellIcon className="w-7 h-7" />
        
        {/* Notification Badge */}
        <AnimatePresence>
          {notifications && notifications.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-red-700 rounded-full flex items-center justify-center font-bold text-sm border-3 border-white shadow-lg"
            >
              {notifications.length}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation */}
        {notifications && notifications.length > 0 && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 bg-red-500 rounded-full"
          />
        )}
      </motion.button>

      {/* Alert Panel */}
      <AlertPanel 
        isOpen={isAlertPanelOpen} 
        onClose={() => setIsAlertPanelOpen(false)} 
      />
    </>
  );
};

export default FloatingAlertButton;
