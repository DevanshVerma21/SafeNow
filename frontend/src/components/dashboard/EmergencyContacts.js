import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  PhoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'personal', priority: 10 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch contacts from API on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        toast.error('Please login to view emergency contacts');
        return;
      }
      
      console.log('Fetching from:', `${API_BASE}/emergency-contacts`);
      console.log('Token:', token.substring(0, 20) + '...');
      
      const response = await axios.get(`${API_BASE}/emergency-contacts`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Emergency contacts response:', response.data);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('Emergency contacts endpoint not found');
      } else {
        toast.error('Failed to load emergency contacts');
      }
      
      // Fallback to default contacts on error
      setContacts([
        { id: 'default-1', name: 'Emergency Services (Police)', phone: '100', relationship: 'emergency', priority: 1, is_default: true },
        { id: 'default-2', name: 'Ambulance / Medical Emergency', phone: '102', relationship: 'medical', priority: 2, is_default: true },
        { id: 'default-3', name: 'Fire Department', phone: '101', relationship: 'fire', priority: 3, is_default: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const relationshipTypes = [
    { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-50 text-red-700' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'bg-blue-50 text-blue-700' },
    { id: 'work', label: 'Work', icon: '🏢', color: 'bg-green-50 text-green-700' },
    { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-purple-50 text-purple-700' },
    { id: 'medical', label: 'Medical', icon: '🏥', color: 'bg-pink-50 text-pink-700' },
    { id: 'fire', label: 'Fire', icon: '🚒', color: 'bg-orange-50 text-orange-700' },
    { id: 'helpline', label: 'Helpline', icon: '📞', color: 'bg-indigo-50 text-indigo-700' }
  ];

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
    toast.success(`Calling ${phone}`);
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/emergency-contacts`,
        {
          name: newContact.name.trim(),
          phone: newContact.phone.trim(),
          relationship: newContact.relationship,
          priority: newContact.priority
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setContacts([...contacts, response.data]);
      setNewContact({ name: '', phone: '', relationship: 'personal', priority: 10 });
      setShowAddForm(false);
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error(error.response?.data?.detail || 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id, isDefault) => {
    if (isDefault) {
      toast.error('Cannot delete default emergency contacts');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/emergency-contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Contact removed');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete contact');
    }
  };

  const getRelationshipInfo = (relationship) => {
    return relationshipTypes.find(t => t.id === relationship) || relationshipTypes[3];
  };

  return (
    <div className="modern-card p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <UserGroupIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Emergency Contacts
          </h3>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2.5 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          title="Add new contact"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm"
        >
          <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-blue-600">+</span> Add New Contact
          </h4>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact name (e.g., John Doe)"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            
            <input
              type="tel"
              placeholder="Phone number (e.g., +91-98765-43210)"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            
            <select
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            >
              {relationshipTypes.filter(t => !['emergency', 'medical', 'fire', 'helpline'].includes(t.id)).map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddContact}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {isSubmitting ? 'Adding...' : '✓ Add Contact'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewContact({ name: '', phone: '', relationship: 'personal', priority: 10 });
                }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="text-gray-700 text-base mt-5 font-semibold">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <UserGroupIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-800 text-lg font-bold mb-2">No emergency contacts yet</p>
            <p className="text-gray-600 text-sm mb-6">Add your first contact to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Add Contact
            </button>
          </div>
        ) : (
          contacts.map((contact, index) => {
            const relationshipInfo = getRelationshipInfo(contact.relationship);
            
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-2xl hover:shadow-xl transition-all duration-200 border-2 overflow-hidden ${
                  contact.is_default 
                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 hover:border-blue-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-md'
                }`}
              >
                {/* Contact Info Section */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${relationshipInfo.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                      {relationshipInfo.icon}
                    </div>
                    
                    {/* Contact Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-lg font-bold text-gray-900 truncate">{contact.name}</h4>
                        {contact.is_default && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-base text-gray-800 font-semibold mb-2">{contact.phone}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${relationshipInfo.color} shadow-sm border border-current border-opacity-20`}>
                        {relationshipInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleCall(contact.phone)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 font-semibold"
                      title="Call this contact"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      <span>Call</span>
                    </button>
                    
                    {!contact.is_default ? (
                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.is_default)}
                        className="p-3 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                        title="Delete contact"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        className="p-3 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed opacity-60"
                        title="Cannot delete default contacts"
                        disabled
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick Call Button */}
      <div className="mt-8 p-6 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-2 border-red-300 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🚨</span>
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">Emergency Quick Dial</h4>
            <p className="text-xs text-gray-600">Instant emergency response</p>
          </div>
        </div>
        <button
          onClick={() => handleCall('100')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white rounded-xl hover:from-red-700 hover:via-red-800 hover:to-red-700 shadow-xl hover:shadow-2xl transition-all duration-300 font-extrabold text-lg transform hover:scale-[1.03] active:scale-95 border-2 border-red-800"
        >
          <PhoneIcon className="w-7 h-7 animate-pulse" />
          <span>Call 100 Now</span>
        </button>
      </div>
    </div>
  );
};

export default EmergencyContacts;