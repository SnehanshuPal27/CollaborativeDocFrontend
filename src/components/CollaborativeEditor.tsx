import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import './CollaborativeEditor.css';

interface CollaborativeEditorProps {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
}

const CollaborativeEditor = ({ doc, awareness }: CollaborativeEditorProps) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none h-full',
      },
    },
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        // THIS IS THE KEY FIX: The extension expects a 'provider' property
        // which is an object that contains the 'awareness' instance.
        provider: {
          awareness: awareness,
        },
        user: {
          name: awareness.getLocalState()?.user?.name || 'Anonymous',
          color: awareness.getLocalState()?.user?.color || '#000000',
        },
      }),
    ],
  });

  return (
      <div className="editor-container h-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
  );
};

export default CollaborativeEditor;