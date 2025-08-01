const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ;

const config = {
  // The URL for all REST API calls (documents, auth, etc.)
  documentServiceUrl: API_BASE_URL,

  // The URL for the WebSocket connection endpoint
  websocketUrl: WS_BASE_URL,
};

export default config;