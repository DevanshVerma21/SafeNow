import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Import modern components
import ModernLoginPage from './components/auth/ModernLoginPage';
import ModernDashboard from './components/dashboard/ModernDashboard';
import ResponderDashboard from './components/responder/ResponderDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Sidebar from './components/layout/Sidebar';
import LoadingScreen from './components/common/LoadingScreen';

// Import page components
import EmergencyPage from './components/pages/EmergencyPage';
import EmergencyContactsPage from './components/pages/EmergencyContactsPage';
import LiveMapPage from './components/pages/LiveMapPage';

// Import admin components
import Analytics from './components/admin/Analytics';
import Users from './components/admin/Users';
import Reports from './components/admin/Reports';

// Import utilities
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { LocationProvider } from './context/LocationContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';

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
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'volunteer' || user.role === 'responder') {
      return <Navigate to="/responder" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
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
    
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'volunteer' || user.role === 'responder') return '/responder';
    return '/user-dashboard';
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
      
      {isAuthenticated && <Sidebar />}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={isAuthenticated ? `transition-all duration-300 ml-80 min-h-screen bg-gray-50/50 p-6` : "min-h-screen"}
      >
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to={getDefaultDashboard()} replace /> : 
                <ModernLoginPage />
            } 
          />
          
          {/* User Dashboard - Regular citizens */}
          <Route 
            path="/user-dashboard" 
            element={
              <ProtectedRoute>
                <ModernDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* User-specific pages */}
          <Route 
            path="/emergency" 
            element={
              <ProtectedRoute>
                <EmergencyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/emergency-contacts" 
            element={
              <ProtectedRoute>
                <EmergencyContactsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/live-map" 
            element={
              <ProtectedRoute>
                <LiveMapPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy route redirect */}
          <Route 
            path="/dashboard" 
            element={<Navigate to="/user-dashboard" replace />} 
          />
          
          {/* Responder Dashboard */}
          <Route 
            path="/responder" 
            element={
              <ProtectedRoute requiredRole="responder">
                <ResponderDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Dashboard - Complete management interface */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin specific routes */}
          <Route 
            path="/admin-dashboard/analytics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Analytics />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin-dashboard/users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Users />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin-dashboard/reports" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy admin route redirect */}
          <Route 
            path="/admin" 
            element={<Navigate to="/admin-dashboard" replace />} 
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
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </WebSocketProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
