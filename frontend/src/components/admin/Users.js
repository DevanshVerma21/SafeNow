import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // Fallback to demo data
        const demoUsers = [
          {
            id: 1,
            name: 'Rajesh Kumar',
            email: 'rajesh@email.com',
            phone: '+91-9876543210',
            role: 'user',
            location: 'Mumbai, Maharashtra',
            status: 'active',
            joinDate: '2025-09-15',
            lastSeen: '2025-10-09T10:30:00Z',
            emergencyContacts: 3
          },
          {
            id: 2,
            name: 'Dr. Priya Sharma',
            email: 'priya.sharma@hospital.com',
            phone: '+91-9876543211',
            role: 'responder',
            specialization: 'Medical',
            location: 'Delhi NCR',
            status: 'active',
            joinDate: '2025-08-22',
            lastSeen: '2025-10-09T11:15:00Z',
            responseCount: 45
          },
          {
            id: 3,
            name: 'Inspector Vikram Singh',
            email: 'vikram@police.gov.in',
            phone: '+91-9876543212',
            role: 'responder',
            specialization: 'Police',
            location: 'Bangalore, Karnataka',
            status: 'on-duty',
            joinDate: '2025-07-10',
            lastSeen: '2025-10-09T11:45:00Z',
            responseCount: 78
          },
          {
            id: 4,
            name: 'Arun Patel',
            email: 'arun@email.com',
            phone: '+91-9876543213',
            role: 'user',
            location: 'Chennai, Tamil Nadu',
            status: 'inactive',
            joinDate: '2025-06-05',
            lastSeen: '2025-10-07T14:20:00Z',
            emergencyContacts: 2
          },
          {
            id: 5,
            name: 'Fire Chief Suresh Reddy',
            email: 'suresh@fire.gov.in',
            phone: '+91-9876543214',
            role: 'responder',
            specialization: 'Fire',
            location: 'Hyderabad, Telangana',
            status: 'active',
            joinDate: '2025-05-18',
            lastSeen: '2025-10-09T09:30:00Z',
            responseCount: 92
          }
        ];
        setUsers(demoUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set demo data on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const getRoleIcon = (role, specialization) => {
    if (role === 'admin') return ShieldCheckIcon;
    if (role === 'responder') {
      switch (specialization) {
        case 'Medical': return '🏥';
        case 'Fire': return '🚒';
        case 'Police': return '👮';
        default: return ShieldCheckIcon;
      }
    }
    return UserIcon;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'responder': return 'blue';
      default: return 'green';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'on-duty': return 'blue';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const formatLastSeen = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const UserModal = ({ user, onClose }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-br from-${getRoleColor(user.role)}-500 to-${getRoleColor(user.role)}-600 rounded-2xl flex items-center justify-center`}>
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-800 mt-2`}>
                  {user.role} {user.specialization && `- ${user.specialization}`}
                </span>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <PhoneIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Phone</span>
                </div>
                <p className="text-gray-900">{user.phone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPinIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Location</span>
                </div>
                <p className="text-gray-900">{user.location}</p>
              </div>
            </div>

            {/* Status & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 bg-${getStatusColor(user.status)}-500 rounded-full`}></div>
                  <span className="font-medium text-gray-700">Status</span>
                </div>
                <p className="text-gray-900 capitalize">{user.status}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="font-medium text-gray-700 block mb-2">Joined</span>
                <p className="text-gray-900">{new Date(user.joinDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="font-medium text-gray-700 block mb-2">Last Seen</span>
                <p className="text-gray-900">{formatLastSeen(user.lastSeen)}</p>
              </div>
            </div>

            {/* Role-specific Info */}
            {user.role === 'responder' && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-bold text-blue-900 mb-2">Responder Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-blue-600">Specialization</span>
                    <p className="font-semibold text-blue-900">{user.specialization}</p>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600">Responses</span>
                    <p className="font-semibold text-blue-900">{user.responseCount}</p>
                  </div>
                </div>
              </div>
            )}

            {user.role === 'user' && (
              <div className="bg-green-50 p-4 rounded-xl">
                <h4 className="font-bold text-green-900 mb-2">User Stats</h4>
                <div>
                  <span className="text-sm text-green-600">Emergency Contacts</span>
                  <p className="font-semibold text-green-900">{user.emergencyContacts} contacts configured</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Edit User
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Send Message
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all system users, responders, and administrators</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add User</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Citizens</option>
              <option value="responder">Responders</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Users ({filteredUsers.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br from-${getRoleColor(user.role)}-500 to-${getRoleColor(user.role)}-600 rounded-xl flex items-center justify-center`}>
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-800`}>
                      {user.role} {user.specialization && `- ${user.specialization}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 bg-${getStatusColor(user.status)}-500 rounded-full`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{formatLastSeen(user.lastSeen)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && selectedUser && (
        <UserModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }} 
        />
      )}
    </div>
  );
};

export default Users;