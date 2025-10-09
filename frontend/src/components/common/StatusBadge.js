import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ 
  status, 
  children, 
  variant = 'default',
  size = 'md',
  animate = true,
  className = '' 
}) => {
  const variants = {
    online: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
    offline: 'bg-gradient-to-r from-neutral-400 to-neutral-500 text-white',
    busy: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
    emergency: 'bg-gradient-to-r from-red-400 to-red-500 text-white',
    success: 'bg-gradient-to-r from-green-400 to-green-500 text-white',
    warning: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white',
    info: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
    default: 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const statusColor = variants[status] || variants[variant];
  
  const badgeClasses = `
    inline-flex items-center gap-2 font-semibold rounded-2xl shadow-lg
    ${statusColor}
    ${sizes[size]}
    ${className}
  `.trim();

  const StatusIndicator = () => {
    if (!status) return null;
    
    const indicatorClass = status === 'online' ? 'status-online' : 
                          status === 'busy' ? 'status-busy' : 
                          status === 'offline' ? 'status-offline' : '';
    
    return <div className={indicatorClass}></div>;
  };

  return (
    <motion.div
      className={badgeClasses}
      initial={animate ? { opacity: 0, scale: 0.8 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
      whileHover={{ scale: 1.05 }}
    >
      <StatusIndicator />
      {children}
    </motion.div>
  );
};

export default StatusBadge;