import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  BellIcon,
  FilterIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const AdminAlerts = () => {
  const { user } = useAuth();
  const { notifications, sendMessage } = useWebSocket();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    severity: 'all',
    search: ''
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        // Demo data
        const demoAlerts = [
          {
            id: 1,
            type: 'Medical Emergency',
            severity: 'Critical',
            status: 'Active',
            location: {
              address: 'Marine Drive, Mumbai',
              coordinates: [18.9220, 72.8237]
            },
            user: {
              name: 'Rajesh Kumar',
              phone: '+91-9876543210',
              emergencyContacts: ['Priya Kumar: +91-9876543211']
            },
            description: 'Heart attack - immediate medical assistance required',
            timestamp: '2025-10-09T11:30:00Z',
            assignedResponder: null,
            responseTime: null,
            estimatedArrival: null
          },
          {
            id: 2,
            type: 'Fire Emergency',
            severity: 'High',
            status: 'In Progress',
            location: {
              address: 'Bandra West, Mumbai',
              coordinates: [19.0596, 72.8295]
            },
            user: {
              name: 'Suresh Patel',
              phone: '+91-9876543212',
              emergencyContacts: ['Rita Patel: +91-9876543213']
            },
            description: 'Building fire on 5th floor - smoke detected',
            timestamp: '2025-10-09T10:45:00Z',
            assignedResponder: {
              name: 'Fire Chief Suresh Reddy',
              unit: 'Fire Station 12',
              phone: '+91-9876543214'
            },
            responseTime: 3.2,
            estimatedArrival: '2025-10-09T11:50:00Z'
          },
          {
            id: 3,
            type: 'Police Emergency',
            severity: 'Medium',
            status: 'Resolved',
            location: {
              address: 'Andheri East, Mumbai',
              coordinates: [19.1136, 72.8697]
            },
            user: {
              name: 'Arun Sharma',
              phone: '+91-9876543215',
              emergencyContacts: ['Meera Sharma: +91-9876543216']
            },
            description: 'Road accident - minor injuries reported',
            timestamp: '2025-10-09T09:15:00Z',
            assignedResponder: {
              name: 'Inspector Vikram Singh',
              unit: 'Police Station Andheri',
              phone: '+91-9876543217'
            },
            responseTime: 4.8,
            estimatedArrival: null,
            resolvedAt: '2025-10-09T10:30:00Z'
          },
          {
            id: 4,
            type: 'Natural Disaster',
            severity: 'High',
            status: 'Active',
            location: {
              address: 'Colaba, Mumbai',
              coordinates: [18.9067, 72.8147]
            },
            user: {
              name: 'Priya Nair',
              phone: '+91-9876543218',
              emergencyContacts: ['Ravi Nair: +91-9876543219']
            },
            description: 'Flooding in residential area - evacuation needed',
            timestamp: '2025-10-09T08:30:00Z',
            assignedResponder: null,
            responseTime: null,
            estimatedArrival: null
          }
        ];
        setAlerts(demoAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => alert.status.toLowerCase() === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type.toLowerCase().includes(filters.type));
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity.toLowerCase() === filters.severity);
    }

    if (filters.search) {
      filtered = filtered.filter(alert =>
        alert.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        alert.location.address.toLowerCase().includes(filters.search.toLowerCase()) ||
        alert.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'red';
      case 'in progress': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const assignResponder = async (alertId) => {
    try {
      // In real app, would show responder selection modal
      alert('Responder assignment functionality would be implemented here');
    } catch (error) {
      console.error('Error assigning responder:', error);
    }
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: newStatus, resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : null }
          : alert
      ));
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
  };

  const AlertModal = ({ alert, onClose }) => (
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
          className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Alert Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">Emergency Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alert ID:</span>
                    <span className="font-medium">#{alert.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{alert.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severity:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${getSeverityColor(alert.severity)}-100 text-${getSeverityColor(alert.severity)}-800`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(alert.status)}-100 text-${getStatusColor(alert.status)}-800`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reported:</span>
                    <span className="font-medium">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700">{alert.description}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">Location</h3>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{alert.location.address}</p>
                    <p className="text-sm text-gray-600">
                      {alert.location.coordinates[0]}, {alert.location.coordinates[1]}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User & Response Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{alert.user.name}</p>
                      <p className="text-sm text-gray-600">{alert.user.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts:</p>
                    {alert.user.emergencyContacts.map((contact, index) => (
                      <p key={index} className="text-sm text-gray-600">{contact}</p>
                    ))}
                  </div>
                </div>
              </div>

              {alert.assignedResponder && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-bold text-blue-900 mb-4">Assigned Responder</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{alert.assignedResponder.name}</p>
                        <p className="text-sm text-blue-600">{alert.assignedResponder.unit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">{alert.assignedResponder.phone}</span>
                    </div>
                    {alert.responseTime && (
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">Response Time: {alert.responseTime}m</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {!alert.assignedResponder && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => assignResponder(alert.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                    >
                      Assign Responder
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`tel:${alert.user.phone}`)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                  >
                    Call User
                  </motion.button>
                  {alert.status !== 'Resolved' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateAlertStatus(alert.id, 'Resolved')}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                    >
                      Mark Resolved
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`https://maps.google.com?q=${alert.location.coordinates[0]},${alert.location.coordinates[1]}`)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                  >
                    View on Map
                  </motion.button>
                </div>
              </div>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all emergency alerts in real-time</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="medical">Medical</option>
            <option value="fire">Fire</option>
            <option value="police">Police</option>
            <option value="natural">Natural Disaster</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 font-medium">Active Alerts</p>
              <p className="text-2xl font-bold text-red-900">
                {alerts.filter(a => a.status === 'Active').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-blue-900">
                {alerts.filter(a => a.status === 'In Progress').length}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-green-900">
                {alerts.filter(a => a.status === 'Resolved').length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 font-medium">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <BellIcon className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Recent Alerts ({filteredAlerts.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedAlert(alert);
                setShowAlertModal(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-3 h-3 rounded-full bg-${getSeverityColor(alert.severity)}-500`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{alert.type}</h4>
                      <span className="text-sm text-gray-500">{getTimeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{alert.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{alert.location.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${getSeverityColor(alert.severity)}-100 text-${getSeverityColor(alert.severity)}-800`}>
                    {alert.severity}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(alert.status)}-100 text-${getStatusColor(alert.status)}-800`}>
                    {alert.status}
                  </span>
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && selectedAlert && (
        <AlertModal 
          alert={selectedAlert} 
          onClose={() => {
            setShowAlertModal(false);
            setSelectedAlert(null);
          }} 
        />
      )}
    </div>
  );
};

export default AdminAlerts;