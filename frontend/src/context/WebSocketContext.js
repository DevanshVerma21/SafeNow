import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

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

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

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

  const value = {
    socket,
    connectionStatus,
    alerts,
    responders,
    notifications,
    connect,
    disconnect,
    sendMessage,
    clearNotification,
    clearAllNotifications,
    setAlerts,
    setResponders
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};