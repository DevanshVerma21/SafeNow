import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [step, setStep] = useState(0); // 0: role selection, 1: phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('citizen');
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
      await verifyOTP(phone, code, role);
      // Auth context will handle the redirect
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo and title */}
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
              boxShadow: '0 10px 40px rgba(255, 8, 68, 0.4), 0 0 0 8px rgba(255, 8, 68, 0.1)'
            }}
          >
            <span className="text-white text-2xl font-bold">SOS</span>
          </motion.div>
          
          <h2 className="text-3xl font-bold gradient-text">
            Emergency Response System
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 0 && "Select your role to continue"}
            {step === 1 && "Enter your phone number"}
            {step === 2 && "Enter the verification code"}
          </p>
        </div>

        {/* Role Selection */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {roles.map((roleOption) => {
              const Icon = roleOption.icon;
              return (
                <motion.button
                  key={roleOption.id}
                  onClick={() => handleRoleSelect(roleOption.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-6 modern-card hover:shadow-2xl transition-all duration-300 text-left ${roleOption.bgColor}`}
                  style={{ border: '2px solid transparent' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${roleOption.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {roleOption.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {roleOption.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Phone Number Input */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleRequestOTP}
            className="space-y-6"
          >
            <div className="modern-card p-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${roles.find(r => r.id === role)?.color} rounded-lg flex items-center justify-center`}>
                  {React.createElement(roles.find(r => r.id === role)?.icon, { className: "w-6 h-6 text-white" })}
                </div>
              </div>
              
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="modern-input w-full pl-12 pr-4"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="modern-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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