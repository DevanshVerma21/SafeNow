import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

const API_BASE_URL = 'http://localhost:8000';

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [alerts, setAlerts] = useState([]);
  const [responders, setResponders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  // Load persistent alerts from database on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAlertsFromDatabase();
      connect();
      
      // Set up polling as fallback for real-time updates
      const pollInterval = setInterval(() => {
        if (isAuthenticated) {
          loadAlertsFromDatabase();
        }
      }, 10000); // Poll every 10 seconds
      
      return () => {
        clearInterval(pollInterval);
        disconnect();
      };
    } else {
      disconnect();
      setAlerts([]);
    }
  }, [isAuthenticated]);

  const loadAlertsFromDatabase = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/alerts?status=open`, { headers });
      
      // Only update if alerts have changed to prevent unnecessary re-renders
      const newAlerts = response.data || [];
      setAlerts(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newAlerts)) {
          console.log(`✅ Loaded ${newAlerts.length} persistent alerts from database`);
          return newAlerts;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to load alerts from database:', error);
      // Don't show error toast for polling failures to avoid spam
      if (alerts.length === 0) {
        toast.error('Failed to load recent alerts');
      }
    }
  };

  const markAlertAsDone = async (alertId) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.put(`${API_BASE_URL}/alerts/${alertId}/mark-done`, {}, { headers });
      
      if (response.data.success) {
        // Update local state immediately for responsive UI
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, status: 'done', marked_done_at: new Date().toISOString() }
              : alert
          )
        );
        
        toast.success('Alert marked as done!', { icon: '✅' });
        
        // Remove from UI after 3 seconds (before auto-delete from server)
        setTimeout(() => {
          setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        }, 3000);
        
        // Refresh from database to ensure consistency
        setTimeout(() => {
          loadAlertsFromDatabase();
        }, 1000);
        
        return true;
      }
    } catch (error) {
      console.error('Failed to mark alert as done:', error);
      toast.error('Failed to update alert status');
      
      // Refresh from database on error to restore correct state
      await loadAlertsFromDatabase();
      return false;
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.delete(`${API_BASE_URL}/alerts/${alertId}`, { headers });
      
      if (response.data.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.success('Alert deleted!', { icon: '🗑️' });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast.error('Failed to delete alert');
      return false;
    }
  };

  const connect = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setConnectionStatus('connecting');
      
      const wsUrl = `ws://localhost:8000/ws/alerts?token=${token}`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setSocket(newSocket);
        reconnectAttempts.current = 0;
        toast.success('Connected to live updates', { duration: 2000 });
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setSocket(null);
        
        // Auto-reconnect if not a manual disconnect
        if (event.code !== 1000 && isAuthenticated) {
          scheduleReconnect();
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        toast.error('Connection error - attempting to reconnect');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setSocket(null);
    setConnectionStatus('disconnected');
  };

  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      toast.error('Max reconnection attempts reached');
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
      connect();
    }, delay);
  };

  const handleMessage = (data) => {
    console.log('WebSocket message received:', data);

    switch (data.type) {
      case 'new_alert':
        setAlerts(prev => {
          const exists = prev.find(alert => alert.id === data.alert.id);
          if (exists) return prev;
          
          toast.success('New emergency alert received!', {
            duration: 5000,
            icon: '🚨',
          });
          
          return [data.alert, ...prev];
        });
        
        addNotification({
          id: Date.now(),
          type: 'alert',
          title: 'New Emergency Alert',
          message: `${data.alert.type} emergency at ${data.alert.location?.address || 'Unknown location'}`,
          timestamp: new Date(),
          data: data.alert
        });
        break;

      case 'alert_assigned':
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === data.alert.id 
              ? { ...alert, status: 'assigned', assigned_responder: data.alert.assigned_responder }
              : alert
          )
        );
        
        toast.success('Alert assigned to responder', {
          duration: 3000,
          icon: '👮‍♂️',
        });
        break;

      case 'alert_status_changed':
        // Handle comprehensive alert status changes
        if (data.action === 'marked_done') {
          setAlerts(prev => {
            const updatedAlerts = prev.map(alert => 
              alert.id === data.alert_id 
                ? { ...alert, status: 'done', marked_done_at: data.marked_done_at }
                : alert
            );
            
            // Schedule removal from UI after 3 seconds to show completion
            setTimeout(() => {
              setAlerts(current => current.filter(alert => alert.id !== data.alert_id));
            }, 3000);
            
            return updatedAlerts;
          });
          
          toast.success('Alert marked as done!', {
            duration: 3000,
            icon: '✅',
          });
        }
        break;

      case 'alert_deleted':
        // Handle alert deletion (immediate removal)
        setAlerts(prev => prev.filter(alert => alert.id !== data.alert_id));
        
        if (data.action === 'auto_deleted') {
          toast.success('Completed alert automatically removed', {
            duration: 2000,
            icon: '🧹',
          });
        }
        break;

      case 'alert_resolved':
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === data.alert.id 
              ? { ...alert, status: 'resolved', resolved_at: data.alert.resolved_at }
              : alert
          )
        );
        
        toast.success('Alert resolved!', {
          duration: 3000,
          icon: '✅',
        });
        break;

      case 'responder_update':
        setResponders(prev => {
          const existing = prev.findIndex(r => r.id === data.responder.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], ...data.responder };
            return updated;
          }
          return [...prev, data.responder];
        });
        break;

      // Legacy support for older message types
      case 'marked_done':
      case 'deleted':
      case 'auto_deleted':
        // These are handled by the new alert_status_changed and alert_deleted types
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const sendMessage = (message) => {
    if (socket && connectionStatus === 'connected') {
      socket.send(JSON.stringify(message));
    } else {
      toast.error('Not connected to server');
    }
  };

  const sendAlert = async (alertData) => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(`${API_BASE_URL}/alerts`, alertData, { headers });
      
      if (response.data.success) {
        // Add to local state immediately for responsive UI
        const newAlert = response.data.alert;
        setAlerts(prev => [newAlert, ...prev]);
        
        // Send via WebSocket for real-time updates to other users
        if (socket && connectionStatus === 'connected') {
          sendMessage({
            type: 'new_alert',
            data: newAlert
          });
        }
        
        // Refresh from database to ensure consistency
        setTimeout(() => {
          loadAlertsFromDatabase();
        }, 1000);
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      throw error;
    }
  };

  const value = {
    socket,
    connectionStatus,
    alerts,
    responders,
    notifications,
    connect,
    disconnect,
    sendMessage,
    sendAlert,
    clearNotification,
    clearAllNotifications,
    setAlerts,
    setResponders,
    // New database-backed functions
    loadAlertsFromDatabase,
    markAlertAsDone,
    deleteAlert
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};