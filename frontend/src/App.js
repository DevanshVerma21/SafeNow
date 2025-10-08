import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Import components (we'll create these)
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import ResponderDashboard from './components/responder/ResponderDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Header from './components/layout/Header';
import LoadingScreen from './components/common/LoadingScreen';

// Import utilities
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { LocationProvider } from './context/LocationContext';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to user's appropriate dashboard based on their role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'volunteer' || user.role === 'responder') {
      return <Navigate to="/responder" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isAppReady || loading) {
    return <LoadingScreen />;
  }
  
  // Helper function to get default dashboard based on role
  const getDefaultDashboard = () => {
    if (!isAuthenticated || !user) return '/login';
    
    if (user.role === 'admin') return '/admin';
    if (user.role === 'volunteer' || user.role === 'responder') return '/responder';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            padding: '16px',
          },
        }}
      />
      
      {isAuthenticated && <Header />}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={isAuthenticated ? "pt-16" : ""}
      >
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/responder" 
            element={
              <ProtectedRoute requiredRole="responder">
                <ResponderDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/" 
            element={
              <Navigate 
                to={getDefaultDashboard()} 
                replace 
              />
            } 
          />
        </Routes>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <WebSocketProvider>
            <AppContent />
          </WebSocketProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
