import { useState, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './useAuth';
import config from '@/config';

export interface AwarenessState {
  user: {
    name: string;
    color: string;
  };
}

export function useCRDTDocument(docId: string | null) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  const { doc, awareness } = useMemo(() => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    return { doc, awareness };
  }, []);

  useEffect(() => {
    if (!user || !docId) return;

    const persistence = new IndexeddbPersistence(docId, doc);
    const token = localStorage.getItem('jwt_token');

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(config.websocketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      setIsConnected(true);
      console.log(`%c[Frontend] STOMP connected. Subscribing to topics for docId: ${docId}`, "color: green");
      stompClient.subscribe(`/topic/document/${docId}/update`, message => {
        console.log("%c[Frontend] Received doc update from backend.", "color: blue");
        Y.applyUpdate(doc, new Uint8Array(message.binaryBody), 'backend');
      });
      stompClient.subscribe(`/topic/document/${docId}/awareness`, message => {
        console.log("%c[Frontend] Received awareness update from backend.", "color: purple");
        awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(message.binaryBody), 'backend');
      });
      awareness.setLocalStateField('user', {
        name: user.name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      });
    };

    stompClient.onDisconnect = () => setIsConnected(false);

    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'backend' && stompClient.connected){
        console.log(update)
        console.log(`%c[Frontend] Sending doc update to backend... (size: ${update.byteLength})`, "color: orange");
        stompClient.publish({
          destination: `/app/document/${docId}/update`,
          binaryBody: update,
        });
      }

    };
    doc.on('update', onDocUpdate);

    const onAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
      if (origin !== 'backend' && stompClient.connected) {
        console.log(`%c[Frontend] Sending awareness update to backend...`, "color: pink");
        const changedClients = added.concat(updated, removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        stompClient.publish({
          destination: `/app/document/${docId}/awareness`,
          binaryBody: update,
        });
      }
    };
    awareness.on('update', onAwarenessUpdate);

    stompClient.activate();

    return () => {
      stompClient.deactivate();
      doc.off('update', onDocUpdate);
      awareness.off('update', onAwarenessUpdate);
    };
  }, [docId, user, doc, awareness]);

  return { doc, awareness, isConnected };
}