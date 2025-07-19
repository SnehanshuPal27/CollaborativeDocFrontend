import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Settings } from 'lucide-react';
import { TextEditor } from '@/components/TextEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

// Mock collaborators for demonstration
const mockCollaborators = [
  { id: '2', name: 'Alice Johnson', color: 'hsl(var(--user-1))' },
  { id: '3', name: 'Bob Smith', color: 'hsl(var(--user-2))' },
  { id: '4', name: 'Carol Davis', color: 'hsl(var(--user-3))' },
];

export default function EditorPage() {
  useEffect(() => {
    console.log("editor rendered");
  }, []);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, updateDocument } = useDocuments();
  
  const [document, setDocument] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSaved, setLastSaved] = useState<string>();
  const [collaborators] = useState(mockCollaborators);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchDocument = async () => {
      const doc = await getDocument(id);
      if (doc) {
        setDocument(doc);
        setTitle(doc.title);
        setContent(doc.content);
      } else {
        toast({
          title: 'Error',
          description: 'Document not found.',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    fetchDocument();

    // Simulate online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id, navigate, getDocument]);

  // Auto-save functionality
  useEffect(() => {
    if (!document) return;

    const autoSave = setTimeout(() => {
      updateDocument(document.id, { content, title });
      setLastSaved(new Date().toLocaleTimeString());
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [content, title, document, updateDocument]);

  const handleSave = () => {
    if (document) {
      updateDocument(document.id, { content, title });
      setLastSaved(new Date().toLocaleTimeString());
      toast({
        title: 'Document saved',
        description: 'Your changes have been saved successfully.',
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Document link has been copied to clipboard.',
    });
  };

  // if (!document) {
  //   return
  // }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="Document title"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TextEditor
          content={content}
          onChange={setContent}
          collaborators={collaborators}
          isOnline={isOnline}
          lastSaved={lastSaved}
          onSave={handleSave}
          docId={id || "default-doc"}
        />
      </div>
    </div>
  );
}