import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWebSocket } from './context/WebSocketContext';
import toast from 'react-hot-toast';
import HamburgerMenu from './components/layout/HamburgerMenu';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

export default function ResponderPanel({ onResponderRegistered }) {
  const [status, setStatus] = useState('available');
  const [responderId, setResponderId] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const { alerts, markAlertAsDone, loadAlertsFromDatabase } = useWebSocket();

  // Refresh alerts when component mounts and periodically
  useEffect(() => {
    loadAlertsFromDatabase();
    
    const interval = setInterval(() => {
      loadAlertsFromDatabase();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  async function register() {
    try {
      const payload = {
        user_id: 'demo_responder',
        responder_type: 'volunteer',
        status,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) }
      };
      const res = await axios.post(`${API_BASE}/responders/heartbeat`, payload);
      setResponderId(res.data.id);
      if (onResponderRegistered) onResponderRegistered(res.data.id);
      toast.success('Responder registered successfully!');
    } catch (error) {
      console.error('Failed to register responder:', error);
      toast.error('Failed to register responder');
    }
  }

  async function accept(alert_id) {
    if (!responderId) {
      toast.error('Please register first');
      return;
    }
    try {
      await axios.post(`${API_BASE}/responders/${responderId}/accept`, { alert_id });
      toast.success('Alert accepted!');
      // Refresh alerts to get updated status
      loadAlertsFromDatabase();
    } catch (error) {
      console.error('Failed to accept alert:', error);
      toast.error('Failed to accept alert');
    }
  }

  async function decline(alert_id) {
    if (!responderId) {
      toast.error('Please register first');
      return;
    }
    try {
      await axios.post(`${API_BASE}/responders/${responderId}/decline`, { alert_id });
      toast.success('Alert declined');
      // Refresh alerts to get updated status
      loadAlertsFromDatabase();
    } catch (error) {
      console.error('Failed to decline alert:', error);
      toast.error('Failed to decline alert');
    }
  }

  const handleMarkAsDone = async (alertId) => {
    const success = await markAlertAsDone(alertId);
    if (success) {
      // Force refresh to ensure consistency
      setTimeout(() => loadAlertsFromDatabase(), 1000);
    }
  };

  // Filter alerts to show all open alerts (not just assigned ones)
  const openAlerts = alerts.filter(a => ['open', 'assigned', 'in_progress'].includes(a.status));
  const assigned = openAlerts.filter(a => a.assigned_to && a.assigned_to === responderId);

  return (
    <div className="border border-gray-300 p-4 md:p-5 mt-3 rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <HamburgerMenu />
        <h4 className="text-lg md:text-xl font-bold text-gray-800">Emergency Responder Panel</h4>
      </div>
      
      {/* Registration Section */}
      <div className="mb-5 p-4 bg-gray-50 rounded-lg">
        <h5 className="mb-3 text-base font-semibold text-gray-700">Responder Registration</h5>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm font-medium text-gray-600">Lat:</span>
            <input 
              value={lat} 
              onChange={e => setLat(e.target.value)}
              placeholder="Latitude"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
            />
          </label>
          <label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm font-medium text-gray-600">Lng:</span>
            <input 
              value={lng} 
              onChange={e => setLng(e.target.value)}
              placeholder="Longitude"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
            />
          </label>
          <label>
            Status:
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginLeft: 5, padding: 4 }}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <button 
            onClick={register}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Register/Update
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: '14px' }}>
          <strong>Responder ID:</strong> {responderId || 'Not registered'}
        </div>
      </div>

      {/* All Open Alerts Section */}
      <div style={{ marginBottom: 20 }}>
        <h5 style={{ marginBottom: 10, color: '#dc3545' }}>
          All Open Emergency Alerts ({openAlerts.length})
        </h5>
        {openAlerts.length === 0 ? (
          <div style={{ padding: 15, backgroundColor: '#e8f5e8', borderRadius: 6, color: '#2d5a2d' }}>
            ✅ No active emergency alerts
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {openAlerts.map(alert => (
              <div 
                key={alert.id} 
                style={{ 
                  padding: 12, 
                  margin: '8px 0', 
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  backgroundColor: alert.assigned_to === responderId ? '#e7f3ff' : '#fff5f5'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#dc3545' }}>
                      {alert.type?.toUpperCase()} EMERGENCY
                    </strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      Location: {alert.location?.lat?.toFixed(4)}, {alert.location?.lng?.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Status: <strong>{alert.status}</strong>
                    </div>
                    {alert.note && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                        Note: {alert.note}
                      </div>
                    )}
                    {alert.assigned_to === responderId && (
                      <div style={{ fontSize: '12px', color: '#0066cc', marginTop: 4 }}>
                        ✅ Assigned to you
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!alert.assigned_to && (
                      <button 
                        onClick={() => accept(alert.id)}
                        disabled={!responderId}
                        style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: '12px',
                          cursor: responderId ? 'pointer' : 'not-allowed',
                          opacity: responderId ? 1 : 0.5
                        }}
                      >
                        Accept
                      </button>
                    )}
                    
                    {alert.assigned_to === responderId && (
                      <>
                        <button 
                          onClick={() => decline(alert.id)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => handleMarkAsDone(alert.id)}
                          style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Alerts Summary */}
      <div style={{ padding: 15, backgroundColor: '#f0f8ff', borderRadius: 6 }}>
        <h5 style={{ marginBottom: 10 }}>My Assigned Alerts</h5>
        {assigned.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#666' }}>No alerts assigned to you</div>
        ) : (
          <div style={{ fontSize: '14px' }}>
            You have <strong>{assigned.length}</strong> alert(s) assigned to you
          </div>
        )}
      </div>
    </div>
  );
}
