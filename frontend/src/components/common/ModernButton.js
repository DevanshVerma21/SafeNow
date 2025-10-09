import React from 'react';
import { motion } from 'framer-motion';

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'modern-button relative overflow-hidden transition-all duration-300';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white border-2 border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50',
    emergency: 'bg-gradient-to-r from-emergency-500 to-emergency-600 text-white shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-safe-500 to-safe-600 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-3">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
      
      {/* Shine effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
};

export default ModernButton;