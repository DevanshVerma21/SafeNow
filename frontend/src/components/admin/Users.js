import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
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
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

const Users = () => {
  const { user, getAuthHeaders } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    specialization: '',
    location: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        handleRealtimeUpdate(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const handleRealtimeUpdate = (message) => {
    switch (message.type) {
      case 'user_created':
        setUsers(prev => [message.data, ...prev]);
        toast.success(`New user ${message.data.name} has been added`);
        break;
      case 'user_updated':
        setUsers(prev => prev.map(u => 
          u.id === message.data.id ? message.data : u
        ));
        toast.success(`User ${message.data.name} has been updated`);
        break;
      case 'user_deleted':
        setUsers(prev => prev.filter(u => u.id !== message.data.id));
        toast.success('User has been deleted');
        break;
      default:
        break;
    }
  };

  const fetchUsers = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_BASE}/admin/users`, { headers });
      
      if (response.data) {
        setUsers(response.data);
      }
      
      setLoading(false);
      if (showToast) {
        toast.success('Users refreshed');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Fallback to demo data if API fails
      const demoUsers = [
        {
          id: 1,
          name: 'Rajesh Kumar',
          email: 'rajesh@email.com',
          phone: '+91-9876543210',
          role: 'user',
          location: 'Mumbai, Maharashtra',
          status: 'active',
          created_at: '2025-09-15T10:00:00Z',
          updated_at: '2025-10-09T10:30:00Z',
          is_verified: true
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
          created_at: '2025-08-22T08:00:00Z',
          updated_at: '2025-10-09T11:15:00Z',
          is_verified: true
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
          created_at: '2025-07-10T09:00:00Z',
          updated_at: '2025-10-09T11:45:00Z',
          is_verified: true
        },
        {
          id: 4,
          name: 'Arun Patel',
          email: 'arun@email.com',
          phone: '+91-9876543213',
          role: 'user',
          location: 'Chennai, Tamil Nadu',
          status: 'inactive',
          created_at: '2025-06-05T14:00:00Z',
          updated_at: '2025-09-20T16:00:00Z',
          is_verified: true
        },
        {
          id: 5,
          name: 'Captain Meera Joshi',
          email: 'meera@firestation.gov.in',
          phone: '+91-9876543214',
          role: 'responder',
          specialization: 'Fire',
          location: 'Pune, Maharashtra',
          status: 'active',
          created_at: '2025-05-18T11:00:00Z',
          updated_at: '2025-10-09T12:00:00Z',
          is_verified: true
        },
        {
          id: 6,
          name: 'Sunita Verma',
          email: 'sunita@email.com',
          phone: '+91-9876543215',
          role: 'user',
          location: 'Hyderabad, Telangana',
          status: 'active',
          created_at: '2025-04-12T13:00:00Z',
          updated_at: '2025-10-08T15:30:00Z',
          is_verified: true
        },
        {
          id: 7,
          name: 'Dr. Ramesh Gupta',
          email: 'ramesh@emergency.com',
          phone: '+91-9876543216',
          role: 'responder',
          specialization: 'Medical',
          location: 'Kolkata, West Bengal',
          status: 'off-duty',
          created_at: '2025-03-25T10:00:00Z',
          updated_at: '2025-10-07T18:00:00Z',
          is_verified: true
        },
        {
          id: 8,
          name: 'Admin User',
          email: 'admin@safenow.com',
          phone: '+91-9876543217',
          role: 'admin',
          location: 'New Delhi',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-10-09T12:30:00Z',
          is_verified: true
        }
      ];
      
      setUsers(demoUsers);
      setLoading(false);
      if (showToast) {
        toast.error('Failed to fetch users from server, using demo data');
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchUsers(true);
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

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const userToAdd = {
      id: Math.max(...users.map(u => u.id)) + 1,
      ...newUser,
      joinDate: new Date().toISOString().split('T')[0],
      lastSeen: new Date().toISOString(),
      emergencyContacts: newUser.role === 'user' ? 0 : undefined,
      responseCount: newUser.role === 'responder' ? 0 : undefined,
      adminLevel: newUser.role === 'admin' ? 'Admin' : undefined
    };

    setUsers([...users, userToAdd]);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      specialization: '',
      location: '',
      status: 'active'
    });
    setShowAddModal(false);
  };

  const AddUserModal = () => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowAddModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value, specialization: '' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="user">Citizen</option>
                <option value="responder">Responder</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {newUser.role === 'responder' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={newUser.specialization}
                  onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select specialization</option>
                  <option value="Medical">Medical</option>
                  <option value="Fire">Fire</option>
                  <option value="Police">Police</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newUser.location}
                onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                {newUser.role === 'responder' && <option value="on-duty">On Duty</option>}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              Add User
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-6">
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
        <div className="p-8 border-b border-gray-200">
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

      {/* Add User Modal */}
      {showAddModal && <AddUserModal />}
    </div>
  );
};

export default Users;