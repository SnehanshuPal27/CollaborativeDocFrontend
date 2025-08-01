import { useState, useEffect, useMemo, useRef } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { useAuth } from './useAuth';
import config from '@/config';

// --- Yjs Message Types ---
// This is our simple, custom protocol. We prepend a single byte to each message
// to tell the receiver if it's a sync update or an awareness update.
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export interface AwarenessState {
  user: {
    name: string;
    color: string;
  };
}

export function useCRDTDocument(docId: string | null) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Memoize the Y.Doc and awareness instances to ensure they are stable.
  const { doc, awareness } = useMemo(() => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    return { doc, awareness };
  }, []);

  useEffect(() => {
    if (!docId || !user) {
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error("Authentication token not found, WebSocket connection aborted.");
      return;
    }

    const persistence = new IndexeddbPersistence(docId, doc);

    const wsUrl = `${config.websocketUrl}/ws/${docId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log(`%c[Connection] WebSocket established.`, 'color: green');

      // 1. Send our current document state to get any missing updates
      const stateVector = Y.encodeStateVector(doc);
      const syncMessage = new Uint8Array([MESSAGE_SYNC, ...stateVector]);
      ws.send(syncMessage);

      // 2. Send our initial awareness state
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID]);
      const awarenessMessage = new Uint8Array([MESSAGE_AWARENESS, ...awarenessUpdate]);
      ws.send(awarenessMessage);
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = new Uint8Array(event.data);
      const messageType = data[0];
      const messageContent = data.slice(1);

      // This is where the CRDT logic lives on the frontend.
      // We check the message type and apply the update accordingly.
      switch (messageType) {
        case MESSAGE_SYNC:
          console.log('%c[PROCESS] Applying Sync message.', 'color: teal');
          // Y.applyUpdate is the core CRDT function that merges changes.
          Y.applyUpdate(doc, messageContent, 'server');
          break;
        case MESSAGE_AWARENESS:
          console.log('%c[PROCESS] Applying Awareness message.', 'color: purple');
          // This merges cursor/selection data from other users.
          awarenessProtocol.applyAwarenessUpdate(awareness, messageContent, 'server');
          break;
        default:
          console.warn(`[PROCESS] Received unknown message type: ${messageType}`);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (error) => console.error('WebSocket error:', error);

    // --- Local Change Handlers ---
    // When the local document changes, we send the update to the server.
    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'server' && ws.readyState === WebSocket.OPEN) {
        const message = new Uint8Array([MESSAGE_SYNC, ...update]);
        ws.send(message);
      }
    };
    doc.on('update', onDocUpdate);

    // When the local awareness state changes, we send the update to the server.
    const onAwarenessUpdate = (changes: any, origin: any) => {
      if (origin === 'local' && ws.readyState === WebSocket.OPEN) {
        const changedClients = changes.added.concat(changes.updated, changes.removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        const message = new Uint8Array([MESSAGE_AWARENESS, ...update]);
        ws.send(message);
      }
    };
    awareness.on('update', onAwarenessUpdate);

    // Set initial user details for others to see.
    awareness.setLocalStateField('user', {
      name: user.name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    });

    // Cleanup function to close the connection and remove listeners.
    return () => {
      ws.close();
      doc.off('update', onDocUpdate);
      awareness.off('update', onAwarenessUpdate);
      persistence.destroy();
    };
  }, [docId, user, doc, awareness]);

  return { doc, awareness, isConnected };
}
