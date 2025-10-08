import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  PhoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: 'Emergency Services',
      phone: '911',
      type: 'emergency',
      priority: 1
    },
    {
      id: 2,
      name: 'Family Contact',
      phone: '+1-555-0123',
      type: 'family',
      priority: 2
    },
    {
      id: 3,
      name: 'Work Security',
      phone: '+1-555-0456',
      type: 'work',
      priority: 3
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', type: 'personal' });

  const contactTypes = [
    { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-50 text-red-700' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'bg-blue-50 text-blue-700' },
    { id: 'work', label: 'Work', icon: '🏢', color: 'bg-green-50 text-green-700' },
    { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-purple-50 text-purple-700' }
  ];

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
    toast.success(`Calling ${phone}`);
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const contact = {
      id: Date.now(),
      ...newContact,
      priority: contacts.length + 1
    };

    setContacts([...contacts, contact]);
    setNewContact({ name: '', phone: '', type: 'personal' });
    setShowAddForm(false);
    toast.success('Contact added successfully');
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
    toast.success('Contact removed');
  };

  const getContactTypeInfo = (type) => {
    return contactTypes.find(t => t.id === type) || contactTypes[3];
  };

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UserGroupIcon className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-bold gradient-text">Emergency Contacts</h3>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
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
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Contact</h4>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            
            <input
              type="tel"
              placeholder="Phone number"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            
            <select
              value={newContact.type}
              onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {contactTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddContact}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                Add Contact
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.map((contact, index) => {
          const typeInfo = getContactTypeInfo(contact.type);
          
          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${typeInfo.color} flex items-center justify-center text-lg`}>
                  {typeInfo.icon}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{contact.name}</h4>
                  <p className="text-xs text-gray-600">{contact.phone}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCall(contact.phone)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                >
                  <PhoneIcon className="w-4 h-4" />
                </button>
                
                {contact.type !== 'emergency' && (
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Call Button */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <button
          onClick={() => handleCall('911')}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
        >
          <PhoneIcon className="w-5 h-5" />
          <span>Emergency Call 911</span>
        </button>
      </div>
    </div>
  );
};

export default EmergencyContacts;