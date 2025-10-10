import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import HamburgerMenu from '../layout/HamburgerMenu';
import EmergencyContacts from '../dashboard/EmergencyContacts';
import { 
  PhoneIcon,
  UserGroupIcon,
  PlusIcon,
  HeartIcon,
  FireIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  TruckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmergencyContactsPage = () => {
  const { user } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    type: 'personal'
  });

  // Emergency service contacts (always available)
  const emergencyServices = [
    {
      id: 'police',
      name: 'Police Emergency',
      phone: '100',
      type: 'Police',
      icon: ShieldCheckIcon,
      color: 'from-blue-500 to-blue-600',
      available: '24/7'
    },
    {
      id: 'fire',
      name: 'Fire Department',
      phone: '101',
      type: 'Fire',
      icon: FireIcon,
      color: 'from-red-500 to-red-600',
      available: '24/7'
    },
    {
      id: 'medical',
      name: 'Medical Emergency',
      phone: '102',
      type: 'Medical',
      icon: HeartIcon,
      color: 'from-green-500 to-green-600',
      available: '24/7'
    },
    {
      id: 'disaster',
      name: 'Disaster Management',
      phone: '108',
      type: 'Disaster',
      icon: TruckIcon,
      color: 'from-purple-500 to-purple-600',
      available: '24/7'
    },
    {
      id: 'women',
      name: 'Women Helpline',
      phone: '1091',
      type: 'Women Safety',
      icon: ShieldCheckIcon,
      color: 'from-pink-500 to-pink-600',
      available: '24/7'
    },
    {
      id: 'child',
      name: 'Child Helpline',
      phone: '1098',
      type: 'Child Safety',
      icon: HeartIcon,
      color: 'from-orange-500 to-orange-600',
      available: '24/7'
    }
  ];

  useEffect(() => {
    loadEmergencyContacts();
  }, [user]);

  const loadEmergencyContacts = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from backend
      // For now, we'll use localStorage or demo data
      const contacts = JSON.parse(localStorage.getItem(`emergency_contacts_${user.id}`)) || [];
      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and phone number are required');
      return;
    }

    try {
      const contact = {
        id: Date.now().toString(),
        ...newContact,
        phone: newContact.phone.startsWith('+91') ? newContact.phone : `+91${newContact.phone}`,
        createdAt: new Date().toISOString()
      };

      const updatedContacts = [...emergencyContacts, contact];
      setEmergencyContacts(updatedContacts);
      
      // Save to localStorage (in real app, this would be API call)
      localStorage.setItem(`emergency_contacts_${user.id}`, JSON.stringify(updatedContacts));
      
      toast.success('Emergency contact added successfully');
      setShowAddForm(false);
      setNewContact({ name: '', phone: '', relationship: '', type: 'personal' });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add emergency contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const updatedContacts = emergencyContacts.filter(contact => contact.id !== contactId);
      setEmergencyContacts(updatedContacts);
      localStorage.setItem(`emergency_contacts_${user.id}`, JSON.stringify(updatedContacts));
      toast.success('Contact removed successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to remove contact');
    }
  };

  const makeCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="flex items-center justify-start w-full sm:w-auto">
              <HamburgerMenu />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">Emergency Contacts</h1>
            </div>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Quick access to emergency services and your personal emergency contacts
          </p>
        </motion.div>

        {/* Emergency Services Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4 md:space-y-6"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center space-x-2 px-4 md:px-0">
            <BuildingOffice2Icon className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            <span>Emergency Services</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0">
            {emergencyServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 3), duration: 0.5 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`h-16 md:h-20 bg-gradient-to-r ${service.color} flex items-center justify-center relative`}>
                    <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs text-white font-medium">{service.available}</span>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm md:text-base">{service.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600">{service.type}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => makeCall(service.phone)}
                      className={`w-full bg-gradient-to-r ${service.color} text-white py-2.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base`}
                    >
                      <PhoneIcon className="w-4 h-4" />
                      <span>Call {service.phone}</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Personal Contacts Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4 md:space-y-6 px-4 md:px-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              <span>Personal Emergency Contacts</span>
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Add Contact</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6"
            >
              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      className="w-full px-4 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                      placeholder="Contact name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      className="w-full px-4 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                      className="w-full px-4 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                      placeholder="e.g., Family, Friend, Doctor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={newContact.type}
                      onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                      className="w-full px-4 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    >
                      <option value="personal">Personal</option>
                      <option value="medical">Medical</option>
                      <option value="work">Work</option>
                      <option value="neighbor">Neighbor</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 min-h-[48px] touch-manipulation rounded-xl font-semibold transition-all duration-300 hover:shadow-lg text-sm md:text-base"
                  >
                    Add Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 min-h-[48px] touch-manipulation rounded-xl font-semibold transition-all duration-300 hover:bg-gray-300 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Contacts List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-sm md:text-base">Loading contacts...</p>
            </div>
          ) : emergencyContacts.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
              <UserGroupIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg md:text-xl text-gray-600 mb-2">No personal contacts added yet</p>
              <p className="text-gray-500 text-sm md:text-base px-4">Add your emergency contacts for quick access during emergencies</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-base md:text-lg">{contact.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600">{contact.relationship}</p>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                        {contact.type}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => makeCall(contact.phone)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <span>Call</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteContact(contact.id)}
                        className="bg-red-500 text-white px-3 md:px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:bg-red-600 touch-manipulation min-h-[44px] min-w-[44px]"
                      >
                        ×
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Legacy Component for Additional Features */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="px-4 md:px-0"
        >
          <EmergencyContacts />
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyContactsPage;