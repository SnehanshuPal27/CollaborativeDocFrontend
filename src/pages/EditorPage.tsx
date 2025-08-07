// File: src/pages/EditorPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useCRDTDocument } from '@/hooks/useCRDTDocument';
import CollaborativeEditor from '@/components/CollaborativeEditor';
import { ShareDialog } from '@/components/ShareDialog';
import { Button } from '@/components/ui/button';
import { CollaboratorDisplay } from '@/components/CollaboratorDisplay';

export default function EditorPage() {
  const { id: docId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // THE FIX: Get the new isSynced state from the hook.
  const { doc, awareness, isConnected, isLoading, isSynced } = useCRDTDocument(docId || null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // THE FIX: Update the loading condition to wait for both IndexedDB and the initial sync.
  if (isLoading || !isSynced || !doc || !awareness) {
    return <div className="flex h-screen items-center justify-center">Syncing Document...</div>;
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

        {docId && (
            <ShareDialog
                documentId={docId}
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
            />
        )}
      </div>
  );
}