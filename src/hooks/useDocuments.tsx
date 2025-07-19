import { useState, useEffect, useCallback } from 'react';
import config from '@/config';

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  collaborators: number;
  isShared: boolean;
  createdAt: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = async (title: string = 'Untitled Document') => {
    const response = await fetch(`${config.documentServiceUrl}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: '' }),
    });
    const newDoc = await response.json();
    setDocuments(prevDocs => [newDoc, ...prevDocs]);
    return newDoc.id;
  };

  const updateDocument = async (id: string, updates: Partial<Omit<Document, 'id'>>) => {
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update document');
      const updatedDoc = await response.json();
      setDocuments(docs => docs.map(doc => (doc.id === id ? updatedDoc : doc)));
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  const deleteDocument = async (id: string) => {
    await fetch(`${config.documentServiceUrl}/documents/${id}`, { method: 'DELETE' });
    setDocuments(docs => docs.filter(doc => doc.id !== id));
  };

  const duplicateDocument = async (id: string) => {
    const response = await fetch(`${config.documentServiceUrl}/documents/${id}/duplicate`, { method: 'POST' });
    const newDoc = await response.json();
    setDocuments(prevDocs => [newDoc, ...documents]);
    return newDoc.id;
  };

  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${id}`);
      if (!response.ok) {
        return null;
      }
      const doc = await response.json();
      return doc;
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    documents,
    isLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    getDocument,
  };
}