// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000';

export const config = {
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ''), // Remove trailing slash
  WS_BASE_URL: WS_BASE_URL.replace(/\/$/, ''),
  
  // API Endpoints
  endpoints: {
    auth: {
      requestOtp: `${API_BASE_URL}/auth/request_otp`,
      verifyOtp: `${API_BASE_URL}/auth/verify_otp`
    },
    alerts: {
      create: `${API_BASE_URL}/alerts`,
      list: `${API_BASE_URL}/alerts`,
      uploadMedia: `${API_BASE_URL}/alerts/upload_media`,
      userDashboard: `${API_BASE_URL}/alerts/user/dashboard`,
      userRecent: `${API_BASE_URL}/alerts/user/recent`
    },
    emergencyContacts: {
      list: `${API_BASE_URL}/emergency-contacts`,
      create: `${API_BASE_URL}/emergency-contacts`,
      delete: (id) => `${API_BASE_URL}/emergency-contacts/${id}`
    },
    websocket: `${WS_BASE_URL}/ws/alerts`
  }
};

export default config;