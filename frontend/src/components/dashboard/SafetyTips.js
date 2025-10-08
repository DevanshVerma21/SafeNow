import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LightBulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const SafetyTips = () => {
  const [currentTip, setCurrentTip] = useState(0);

  const safetyTips = [
    {
      category: 'Personal Safety',
      icon: '🛡️',
      tip: 'Always trust your instincts. If a situation feels unsafe, remove yourself immediately.',
      action: 'Share your location with trusted contacts when going out alone.'
    },
    {
      category: 'Emergency Preparedness',
      icon: '🎒',
      tip: 'Keep an emergency kit with water, flashlight, first aid supplies, and important documents.',
      action: 'Review and update your emergency plan with family members regularly.'
    },
    {
      category: 'Digital Safety',
      icon: '📱',
      tip: 'Keep your phone charged and enable location services for emergency apps.',
      action: 'Set up emergency contacts and medical ID on your phone.'
    },
    {
      category: 'Home Security',
      icon: '🏠',
      tip: 'Install smoke detectors and check batteries twice a year.',
      action: 'Create a fire escape plan and practice it with all household members.'
    },
    {
      category: 'Travel Safety',
      icon: '✈️',
      tip: 'Research your destination and share your itinerary with someone you trust.',
      action: 'Keep copies of important documents in separate locations.'
    },
    {
      category: 'Medical Emergency',
      icon: '🏥',
      tip: 'Learn basic first aid and CPR. Know the signs of heart attack and stroke.',
      action: 'Keep a list of medications and allergies in your wallet or phone.'
    },
    {
      category: 'Weather Safety',
      icon: '🌩️',
      tip: 'Stay informed about weather conditions and have a plan for severe weather.',
      action: 'Know the safest places in your home for different weather emergencies.'
    },
    {
      category: 'Cyber Security',
      icon: '🔒',
      tip: 'Use strong, unique passwords and enable two-factor authentication.',
      action: 'Be cautious about sharing personal information online or over the phone.'
    }
  ];

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % safetyTips.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + safetyTips.length) % safetyTips.length);
  };

  const currentTipData = safetyTips[currentTip];

  return (
    <div className="modern-card p-6">
      <div className="flex items-center mb-6">
        <LightBulbIcon className="w-6 h-6 text-yellow-600 mr-2" />
        <h3 className="text-xl font-bold gradient-text">Safety Tips</h3>
      </div>

      <motion.div
        key={currentTip}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-5 border border-yellow-200"
      >
        {/* Category Header */}
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-2">{currentTipData.icon}</span>
          <h4 className="text-sm font-semibold text-gray-900">
            {currentTipData.category}
          </h4>
        </div>

        {/* Tip Content */}
        <div className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Tip:</strong> {currentTipData.tip}
          </p>
          
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>Action:</strong> {currentTipData.action}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={prevTip}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <div className="flex space-x-1">
            {safetyTips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTip(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentTip ? 'bg-yellow-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextTip}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tip Counter */}
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500">
            {currentTip + 1} of {safetyTips.length}
          </span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 text-sm font-medium">
          📚 More Safety Tips
        </button>
        <button className="p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-200 text-sm font-medium">
          🎓 Take Safety Course
        </button>
      </div>
    </div>
  );
};

export default SafetyTips;