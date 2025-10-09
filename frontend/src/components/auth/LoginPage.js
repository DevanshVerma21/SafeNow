import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  PhoneIcon, 
  KeyIcon, 
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP (removed role selection)
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('citizen'); // default role, will be determined by backend
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'citizen',
      name: 'Citizen',
      description: 'Request emergency assistance and stay safe',
      icon: UserIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'responder',
      name: 'Emergency Responder',
      description: 'Respond to emergency calls and help citizens',
      icon: ShieldCheckIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Manage system, users, and emergency operations',
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(1);
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-red-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
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
            animate={{ 
              scale: [1, 1.05, 1],
              rotateY: [0, 10, 0],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, #ff0844 0%, #ff6b6b 50%, #ffb199 100%)',
              boxShadow: '0 15px 35px rgba(255, 8, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12), 0 0 0 8px rgba(255, 8, 68, 0.1)'
            }}
          >
            <motion.span 
              className="text-white text-3xl font-bold"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              SOS
            </motion.span>
            
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold gradient-text mb-2"
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

        {/* Phone Number Input */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onSubmit={handleRequestOTP}
            className="space-y-6"
          >
            <motion.div 
              className="glass-effect p-8"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
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
                  onChange={(e) => {
                    console.log('Input changed:', e.target.value);
                    setPhone(e.target.value);
                  }}
                  className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium"
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                  autoFocus
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full mt-6 modern-button py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  'Send Verification Code'
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        )}
                  style={{ pointerEvents: 'auto', userSelect: 'text' }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* OTP Verification */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleVerifyOTP}
            className="space-y-6"
          >
            <div className="glass-effect rounded-lg p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Verification code sent to
                </p>
                <p className="font-semibold text-gray-900">{phone}</p>
              </div>
              
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => handleRequestOTP({ preventDefault: () => {} })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Demo info */}
        <div className="text-center">
          <div className="glass-effect rounded-lg p-4">
            <p className="text-xs text-gray-500">
              <strong>Demo Mode:</strong> Use any phone number. OTP will be displayed in notifications.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;