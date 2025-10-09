import React from 'react';
import { motion } from 'framer-motion';

const ModernCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      className={`modern-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { 
        scale: 1.02, 
        transition: { duration: 0.2 } 
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ModernCard;