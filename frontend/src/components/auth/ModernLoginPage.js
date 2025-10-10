import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  PhoneIcon, 
  KeyIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../common/GlassCard';
import ModernButton from '../common/ModernButton';

const ModernLoginPage = () => {
  const { requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('citizen');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Phone number validation function
  const validatePhoneNumber = (phoneNumber) => {
    // Remove all spaces, dashes, parentheses, and plus signs
    const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, message: 'Phone number should contain only digits' };
    }
    
    // Check length (Indian numbers: 10 digits, International with country code: 10-15 digits)
    if (cleaned.length < 10) {
      return { valid: false, message: 'Phone number must be at least 10 digits' };
    }
    
    if (cleaned.length > 15) {
      return { valid: false, message: 'Phone number cannot exceed 15 digits' };
    }
    
    // For Indian numbers (10 digits), check if it starts with valid digits (6-9)
    if (cleaned.length === 10 && !/^[6-9]/.test(cleaned)) {
      return { valid: false, message: 'Indian mobile numbers should start with 6, 7, 8, or 9' };
    }
    
    return { valid: true, message: '' };
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
    
    // Live validation feedback (only show if user has typed enough)
    if (value.length >= 10) {
      const validation = validatePhoneNumber(value);
      if (!validation.valid) {
        setPhoneError(validation.message);
      }
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number');
      return;
    }
    
    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      setPhoneError(validation.message);
      return;
    }
    
    setLoading(true);
    setPhoneError('');
    try {
      await requestOTP(phone, 'login');
      setStep(2);
    } catch (error) {
      console.error('OTP request failed:', error);
      setPhoneError(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const userData = await verifyOTP(phone, code, role);
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'volunteer' || userData.role === 'responder') {
        navigate('/responder');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep(1);
    setCode('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-red-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute top-3/4 left-1/2 w-48 h-48 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Logo and title */}
        <div className="text-center">
          <motion.div
            className="mx-auto w-32 h-32 flex items-center justify-center mb-6 relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1,
              rotate: 0,
            }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
          >
            {/* Logo image */}
            <motion.img 
              src="/logo.svg" 
              alt="SafeNow Logo" 
              className="w-full h-full object-contain"
              animate={{ 
                filter: [
                  'drop-shadow(0 0 8px rgba(79, 195, 247, 0.4))', 
                  'drop-shadow(0 0 16px rgba(79, 195, 247, 0.7))', 
                  'drop-shadow(0 0 8px rgba(79, 195, 247, 0.4))'
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            
            {/* Animated pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500/30"
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.6, 0, 0.6] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/20"
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.4, 0, 0.4] 
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold gradient-text mb-2 font-display"
          >
            SafeNow
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-neutral-600 font-medium"
          >
            Emergency Response System
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-neutral-500"
          >
            {step === 1 && "Enter your phone number to get started"}
            {step === 2 && "Enter the verification code sent to your phone"}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {/* Phone Number Input */}
          {step === 1 && (
            <motion.form
              key="phone-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleRequestOTP}
              className="space-y-6"
            >
              <GlassCard className="p-8" hover={false}>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">
                  Phone Number
                </label>
                <div className="relative group">
                  <motion.div
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      phoneError ? 'text-red-500' : 'text-neutral-400 group-focus-within:text-primary-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </motion.div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`modern-input w-full pl-12 pr-16 py-4 transition-all duration-200 ${
                      phoneError 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : phone.length >= 10 && !phoneError
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                        : ''
                    }`}
                    placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                    autoComplete="tel"
                    autoFocus
                  />
                  {/* Valid checkmark */}
                  {phone.length >= 10 && !phoneError && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                  {phoneError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-6 left-0 text-sm text-red-600 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {phoneError}
                    </motion.p>
                  )}
                </div>
                
                <div className="mt-8">
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading || !phone.trim() || phoneError}
                    loading={loading}
                    className="w-full"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </ModernButton>
                </div>

                {/* Helpful hints */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">Valid Phone Formats:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Indian: 9876543210 (10 digits starting with 6-9)</li>
                        <li>• With country code: +919876543210</li>
                        <li>• International: +1234567890 (with +)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.form>
          )}

          {/* OTP Verification */}
          {step === 2 && (
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleVerifyOTP}
              className="space-y-6"
            >
              <GlassCard className="p-8" hover={false}>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <KeyIcon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-neutral-800 mb-2">Verify Your Phone</h3>
                  <p className="text-neutral-600">
                    We sent a code to <span className="font-semibold text-neutral-800">{phone}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      Verification Code
                    </label>
                    <div className="relative group">
                      <motion.div
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                      >
                        <KeyIcon className="w-5 h-5" />
                      </motion.div>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="modern-input w-full pl-12 pr-4 py-4 text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        maxLength="6"
                        autoComplete="one-time-code"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ModernButton
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handleBackToPhone}
                      className="flex-1"
                    >
                      Back
                    </ModernButton>
                    <ModernButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading || !code.trim()}
                      loading={loading}
                      className="flex-1"
                    >
                      {loading ? 'Verifying...' : 'Sign In'}
                    </ModernButton>
                  </div>
                </div>
              </GlassCard>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-neutral-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ModernLoginPage;