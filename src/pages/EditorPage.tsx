import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useCRDTDocument } from '@/hooks/useCRDTDocument';
import { useDocuments } from '@/hooks/useDocuments';
import CollaborativeEditor from '@/components/CollaborativeEditor';
import { ShareDialog } from '@/components/ShareDialog';
import { Button } from '@/components/ui/button';
import { CollaboratorDisplay } from '@/components/CollaboratorDisplay';
import config from '@/config';

export default function EditorPage() {
  const { id: docId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { doc, awareness, isConnected } = useCRDTDocument(docId || null);
  const { getDocument } = useDocuments();

  const [isLoading, setIsLoading] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    if (!docId || !doc) return;

    const initializeDocument = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${config.documentServiceUrl}/documents/${docId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Could not fetch document snapshot.');
        }

        const snapshot = await response.arrayBuffer();

        if (snapshot.byteLength > 0) {
          Y.applyUpdate(doc, new Uint8Array(snapshot));
        }

      } catch (error) {
        console.error("Failed to initialize document:", error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDocument();
  }, [docId, doc, navigate]);

  if (isLoading || !doc || !awareness) {
    return <div className="flex h-screen items-center justify-center">Loading Document...</div>;
  }

  return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <CollaboratorDisplay awareness={awareness} />
            <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor doc={doc} awareness={awareness} />
        </div>

        <ShareDialog
            documentId={docId}
            open={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
        />
      </div>
  );
}