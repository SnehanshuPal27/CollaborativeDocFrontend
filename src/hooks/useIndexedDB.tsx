import { useEffect, useState } from 'react';
import Dexie, { Table } from 'dexie';

interface DocumentData {
  doc_id: string;
  snapshot_version: number;
  crdt_snapshot: Uint8Array;
  unsynced_deltas: Uint8Array[];
  last_synced_at: string;
  updated_at: string;
}

class CRDTDatabase extends Dexie {
  documents!: Table<DocumentData>;

  constructor() {
    super('CRDTEditor');
    this.version(1).stores({
      documents: 'doc_id, snapshot_version, last_synced_at, updated_at'
    });
  }
}

const db = new CRDTDatabase();

export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    db.open()
      .then(() => setIsReady(true))
      .catch(error => {
        console.error('Failed to open IndexedDB:', error);
      });
  }, []);

  const saveDocument = async (
    docId: string, 
    snapshot: Uint8Array, 
    version: number,
    deltas: Uint8Array[] = []
  ) => {
    if (!isReady) return;

    try {
      await db.documents.put({
        doc_id: docId,
        snapshot_version: version,
        crdt_snapshot: snapshot,
        unsynced_deltas: deltas,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save document to IndexedDB:', error);
    }
  };

  const loadDocument = async (docId: string): Promise<DocumentData | undefined> => {
    if (!isReady) return;

    try {
      return await db.documents.get(docId);
    } catch (error) {
      console.error('Failed to load document from IndexedDB:', error);
    }
  };

  const addUnsyncedDelta = async (docId: string, delta: Uint8Array) => {
    if (!isReady) return;

    try {
      const doc = await db.documents.get(docId);
      if (doc) {
        const updatedDeltas = [...doc.unsynced_deltas, delta];
        await db.documents.update(docId, {
          unsynced_deltas: updatedDeltas,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to add unsynced delta:', error);
    }
  };

  const clearUnsyncedDeltas = async (docId: string) => {
    if (!isReady) return;

    try {
      await db.documents.update(docId, {
        unsynced_deltas: [],
        last_synced_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to clear unsynced deltas:', error);
    }
  };

  const getAllDocuments = async (): Promise<DocumentData[]> => {
    if (!isReady) return [];

    try {
      return await db.documents.toArray();
    } catch (error) {
      console.error('Failed to get all documents:', error);
      return [];
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!isReady) return;

    try {
      await db.documents.delete(docId);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return {
    isReady,
    saveDocument,
    loadDocument,
    addUnsyncedDelta,
    clearUnsyncedDeltas,
    getAllDocuments,
    deleteDocument,
  };
}