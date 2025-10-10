import React from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSidebar } from '../../context/SidebarContext';

const HamburgerMenu = ({ className = '' }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <motion.button
      onClick={toggleSidebar}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors touch-manipulation ${className}`}
      aria-label="Toggle sidebar menu"
    >
      <Bars3Icon className="w-6 h-6 text-gray-600" />
    </motion.button>
  );
};

export default HamburgerMenu;