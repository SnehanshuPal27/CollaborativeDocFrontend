// VITE_API_BASE_URL should be like: http://localhost:8080
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Convert http:// to ws:// or https:// to wss:// for the WebSocket connection
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

const config = {
  // The URL for all REST API calls
  documentServiceUrl: `${API_BASE_URL}/api`,

  // The base URL for the direct WebSocket connection.
  // The full path will be constructed in the hook.
  websocketUrl: WS_BASE_URL,
};

export default config;
