import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

interface CRDTDocumentHook {
  content: string;
  isConnected: boolean;
  collaborators: Array<{ id: string; name: string; color: string }>;
  updateContent: (newContent: string) => void;
  sync: () => Promise<void>;
}

export function useCRDTDocument(docId: string): CRDTDocumentHook {
  const [content, setContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  
  const ydocRef = useRef<Y.Doc>();
  const providerRef = useRef<WebsocketProvider>();
  const persistenceRef = useRef<IndexeddbPersistence>();

  useEffect(() => {
    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Initialize IndexedDB persistence
    const persistence = new IndexeddbPersistence(docId, ydoc);
    persistenceRef.current = persistence;

    // Initialize WebSocket provider (mock URL - would be real in production)
    const provider = new WebsocketProvider('ws://localhost:1234', docId, ydoc);
    providerRef.current = provider;

    // Get shared text type
    const ytext = ydoc.getText('content');

    // Listen for text changes
    const updateHandler = () => {
      setContent(ytext.toString());
    };
    
    ytext.observe(updateHandler);

    // Connection status
    provider.on('status', (event: { status: string }) => {
      setIsConnected(event.status === 'connected');
    });

    // Clean up
    return () => {
      ytext.unobserve(updateHandler);
      provider.destroy();
      persistence.destroy();
      ydoc.destroy();
    };
  }, [docId]);

  const updateContent = (newContent: string) => {
    if (ydocRef.current) {
      const ytext = ydocRef.current.getText('content');
      // Simple implementation - in production would use proper diff
      ytext.delete(0, ytext.length);
      ytext.insert(0, newContent);
    }
  };

  const sync = async () => {
    // Trigger manual sync if needed
    if (providerRef.current) {
      // Implementation would sync with backend
    }
  };

  return {
    content,
    isConnected,
    collaborators,
    updateContent,
    sync,
  };
}