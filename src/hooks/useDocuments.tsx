import { useState, useEffect, useCallback } from 'react';
import config from '@/config';

// Defines the full document structure expected by the frontend
export interface Document {
  id: string;
  title: string;
  ownerId: string;
  isShared: boolean;
  collaboratorIds: string[];
  createdAt: string;
  lastModified: string;
}

// Helper function to get default headers with the authentication token
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    // In a real application, you might want to redirect to login here
    // or handle the error more gracefully.
    console.error("Authentication token not found.");
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetches all documents for the current authenticated user
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Handle auth errors, e.g., by logging the user out
        }
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Creates a new document
  const createDocument = async (title: string = 'Untitled Document') => {
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create document');
      const newDoc = await response.json();
      console.log(newDoc)
      // Optimistic UI update: add the new doc to the top of the list
      setDocuments(prevDocs => [newDoc, ...prevDocs]);
      return newDoc.id;
    } catch (error) {
      console.error('Create document error:', error);
    }
  };

  // Retrieves a single document's metadata
  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${id}/metadata`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Updates a document (e.g., for renaming)
  const updateDocument = async (id: string, updates: Partial<Omit<Document, 'id'>>) => {
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${id}`, { // Assumes a PUT endpoint
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update document');
      const updatedDoc = await response.json();
      // Optimistic UI update: find and replace the updated doc in the list
      setDocuments(docs => docs.map(doc => (doc.id === id ? updatedDoc : doc)));
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  // Deletes a document
  const deleteDocument = async (id: string) => {
    try {
      await fetch(`${config.documentServiceUrl}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      // Optimistic UI update: filter out the deleted document
      setDocuments(docs => docs.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  // Duplicates a document
  const duplicateDocument = async (id: string) => {
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${id}/duplicate`, { // Assumes a POST endpoint
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to duplicate document');
      const newDoc = await response.json();
      // Optimistic UI update: add the new doc to the top
      setDocuments(prevDocs => [newDoc, ...prevDocs]);
      return newDoc.id;
    } catch(error) {
      console.error('Failed to duplicate document:', error);
    }
  };

  /**
   * NEW: Adds a collaborator to a document by their email address.
   */
  const addCollaborator = async (docId: string, collaboratorEmail: string) => {
    try {
      const response = await fetch(`${config.documentServiceUrl}/documents/${docId}/collaborators`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: collaboratorEmail }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add collaborator');
      }
      const updatedDoc = await response.json();
      // Optimistically update the local state
      setDocuments(docs => docs.map(doc => (doc.id === docId ? updatedDoc : doc)));
      return updatedDoc;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      throw error; // Re-throw to be caught by the component
    }
  };

  return {
    documents,
    isLoading,
    fetchDocuments,
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    duplicateDocument,
    addCollaborator
  };
}