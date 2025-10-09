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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    setLoading(true);
    try {
      await requestOTP(phone, 'login');
      setStep(2);
    } catch (error) {
      console.error('OTP request failed:', error);
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
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, #ff0844 0%, #ff6b6b 50%, #ffb199 100%)',
              boxShadow: '0 15px 35px rgba(255, 8, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12), 0 0 0 8px rgba(255, 8, 68, 0.1)'
            }}
            animate={{ 
              scale: [1, 1.05, 1],
              rotateY: [0, 10, 0],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.span 
              className="text-white text-3xl font-bold font-display"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              SOS
            </motion.span>
            
            {/* Animated pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.7, 0, 0.7] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/20"
              animate={{ 
                scale: [1, 1.4, 1], 
                opacity: [0.5, 0, 0.5] 
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
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
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </motion.div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="modern-input w-full pl-12 pr-4 py-4"
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                
                <div className="mt-6">
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading || !phone.trim()}
                    loading={loading}
                    className="w-full"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </ModernButton>
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