// File: src/hooks/useCRDTDocument.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { useAuth } from './useAuth';
import config from '@/config';

// Protocol definition:
const MESSAGE_SYNC = 0; // Sent from Server -> Client for initial state (framed)
const MESSAGE_AWARENESS = 1; // Sent both ways
const MESSAGE_SYNC_UPDATE = 2; // Sent from Client -> Server for live updates (raw)

export interface AwarenessState {
  user: { name: string; color: string; };
}

export function useCRDTDocument(docId: string | null) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<Uint8Array[]>([]);

  const { doc, awareness } = useMemo(() => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    return { doc, awareness };
  }, []);

  useEffect(() => {
    if (!docId || !user) {
      setIsLoading(false);
      return;
    }
    if (wsRef.current) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isPersistenceSynced = false;
    const persistence = new IndexeddbPersistence(docId, doc);

    const processMessage = (data: Uint8Array) => {
      try {
        const messageType = data[0];
        const content = data.slice(1);

        switch (messageType) {
          case MESSAGE_SYNC: {
            if (content.length === 0) {
              setIsSynced(true);
              return;
            }
            let buffer = content;
            while (buffer.length > 0) {
              const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
              const updateLength = dataView.getInt32(0);
              if (buffer.length < 4 + updateLength) break;
              const update = buffer.slice(4, 4 + updateLength);
              Y.applyUpdate(doc, update, 'server');
              buffer = buffer.slice(4 + updateLength);
            }
            setIsSynced(true);
            break;
          }

          case MESSAGE_SYNC_UPDATE: {
            // THE FIX: The relayed message from another user is just a single update.
            // The backend doesn't frame it, so we apply it directly.
            Y.applyUpdate(doc, content, 'server');
            break;
          }

          case MESSAGE_AWARENESS:
            awarenessProtocol.applyAwarenessUpdate(awareness, content, 'server');
            break;
        }
      } catch (error) {
        console.error('[ERROR] Failed to process incoming message:', error);
      }
    };

    persistence.whenSynced.then(() => {
      isPersistenceSynced = true;
      setIsLoading(false);
      messageQueueRef.current.forEach(processMessage);
      messageQueueRef.current = [];
    });

    const wsUrl = `${config.websocketUrl}/ws/${docId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event: MessageEvent) => {
      const messageData = new Uint8Array(event.data);
      if (!isPersistenceSynced) {
        messageQueueRef.current.push(messageData);
        return;
      }
      processMessage(messageData);
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (error) => console.error('WebSocket error:', error);

    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'server' && ws.readyState === WebSocket.OPEN) {
        // Send live updates with the new, specific message type.
        const message = new Uint8Array([MESSAGE_SYNC_UPDATE, ...update]);
        ws.send(message);
      }
    };
    doc.on('update', onDocUpdate);

    const onAwarenessUpdate = (changes: any, origin: any) => {
      if (origin === 'local' && ws.readyState === WebSocket.OPEN) {
        const changedClients = changes.added.concat(changes.updated, changes.removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        const message = new Uint8Array([MESSAGE_AWARENESS, ...update]);
        ws.send(message);
      }
    };
    awareness.on('update', onAwarenessUpdate);

    awareness.setLocalStateField('user', {
      name: user.name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    });

    return () => {
      ws.close();
      doc.off('update', onDocUpdate);
      awareness.off('update', onAwarenessUpdate);
      persistence.destroy();
      wsRef.current = null;
    };
  }, [docId, user, doc, awareness]);

  return { doc, awareness, isConnected, isLoading, isSynced };
}