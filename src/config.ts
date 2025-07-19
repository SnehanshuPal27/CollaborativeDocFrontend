const config = {
  cursorTrackingWebsocketUrl: import.meta.env.VITE_CURSOR_TRACKING_WEBSOCKET_URL || 'http://localhost:8080/ws',
  documentServiceUrl: import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:8080/api',
};

export default config;

