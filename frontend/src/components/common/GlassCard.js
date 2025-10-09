import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = '', 
  blur = 'lg',
  opacity = 95,
  hover = true,
  ...props 
}) => {
  const blurLevels = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  const cardClasses = `
    glass-effect
    ${blurLevels[blur]}
    ${className}
  `.trim();

  return (
    <motion.div
      className={cardClasses}
      style={{ backgroundColor: `rgba(255, 255, 255, 0.${opacity})` }}
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

export default GlassCard;