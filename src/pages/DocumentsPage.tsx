import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentCard } from '@/components/DocumentCard';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    documents,
    createDocument,
    deleteDocument,
    duplicateDocument,
    updateDocument
  } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDocument = () => {
    const docId = createDocument();
    navigate(`/editor/${docId}`);
  };

  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocument(documentToDelete);
      setDocumentToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleRenameDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      const newTitle = prompt('Enter new title:', doc.title);
      if (newTitle && newTitle.trim()) {
        updateDocument(id, { title: newTitle.trim() });
      }
    }
  };

  const handleDuplicateDocument = (id: string) => {
    const newDocId = duplicateDocument(id);
    if (newDocId) {
      navigate(`/editor/${newDocId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        onCreateDocument={handleCreateDocument}
        onSignOut={signOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Documents</h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and collaborate on documents in real-time
              </p>
            </div>
            <Button
              onClick={handleCreateDocument}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>

            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>

            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start by creating your first document'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateDocument}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                lastModified={doc.lastModified}
                collaborators={doc.collaborators}
                isShared={doc.isShared}
                onClick={() => {
                  console.log(`Opening document ${doc.id}`);
                  navigate(`/editor/${doc.id}`);
                }
                }
                onRename={() => handleRenameDocument(doc.id)}
                onDelete={() => handleDeleteDocument(doc.id)}
                onDuplicate={() => handleDuplicateDocument(doc.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}