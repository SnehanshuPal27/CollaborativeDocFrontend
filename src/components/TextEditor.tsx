import { useRef, useEffect, useState } from "react";
import { Bold, Italic, Underline, Save, Users, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import protobuf from "protobufjs";
import config from "@/config";

// --- Protobuf setup ---
let CursorPositionProto: any = null;
let SelectionRangeProto: any = null;

// Helper to generate random color
function randomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  collaborators: Collaborator[];
  isOnline: boolean;
  lastSaved?: string;
  onSave: () => void;
  docId?: string; // Add docId for websocket
}

function useWebSocketCollab(docId: string, localUserId: string, editorRef: React.RefObject<HTMLTextAreaElement>, setRemoteCollaborators: (collabs: Collaborator[]) => void) {
  const stompClientRef = useRef<Client | null>(null);
  const colorMapRef = useRef<{ [userId: string]: string }>({});

  useEffect(() => {
    // Load protobuf definitions
    protobuf.load("/cursor_websocket.proto", (err, root) => {
      if (!err && root) {
        CursorPositionProto = root.lookupType("com.example.cursorWebsocket.CursorWebsocket.CursorPosition");
        SelectionRangeProto = root.lookupType("com.example.cursorWebsocket.CursorWebsocket.SelectionRange");
      }
    });
  }, []);

  useEffect(() => {
    if (!docId) return;
    const sock = new SockJS(config.cursorTrackingWebsocketUrl);
    const client = new Client({
      webSocketFactory: () => sock,
      debug: () => {},
      reconnectDelay: 5000,
    });
    stompClientRef.current = client;

    let remoteCollabs: { [id: string]: Collaborator } = {};

    client.onConnect = () => {
      client.subscribe(`/topic/document/${docId}/cursor`, (msg: IMessage) => {
        if (!CursorPositionProto) return;
        const data = CursorPositionProto.decode(new Uint8Array(msg.binaryBody));
        if (data.userId !== localUserId) {
          if (!colorMapRef.current[data.userId]) {
            colorMapRef.current[data.userId] = randomColor();
          }
          remoteCollabs[data.userId] = {
            id: data.userId,
            name: `User ${data.userId}`,
            color: colorMapRef.current[data.userId],
            cursor: { line: data.line, column: data.column },
          };
          setRemoteCollaborators(Object.values(remoteCollabs));
        }
      });
      client.subscribe(`/topic/document/${docId}/selection`, (msg: IMessage) => {
        if (!SelectionRangeProto) return;
        const data = SelectionRangeProto.decode(new Uint8Array(msg.binaryBody));
        if (data.userId !== localUserId) {
          if (!colorMapRef.current[data.userId]) {
            colorMapRef.current[data.userId] = randomColor();
          }
          remoteCollabs[data.userId] = {
            ...remoteCollabs[data.userId],
            id: data.userId,
            name: `User ${data.userId}`,
            color: colorMapRef.current[data.userId],
            selection: {
              startLine: data.startLine,
              startColumn: data.startColumn,
              endLine: data.endLine,
              endColumn: data.endColumn,
            },
          };
          setRemoteCollaborators(Object.values(remoteCollabs));
        }
      });
    };
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [docId, localUserId, setRemoteCollaborators]);

  // Send cursor/selection to server
  const sendCursor = (line: number, column: number) => {
    if (stompClientRef.current && stompClientRef.current.connected && CursorPositionProto) {
      const payload = CursorPositionProto.encode({ userId: localUserId, line, column }).finish();
      stompClientRef.current.publish({
        destination: `/app/document/${docId}/cursor`,
        binaryBody: payload,
      });
    }
  };
  const sendSelection = (startLine: number, startColumn: number, endLine: number, endColumn: number) => {
    if (stompClientRef.current && stompClientRef.current.connected && SelectionRangeProto) {
      const payload = SelectionRangeProto.encode({
        userId: localUserId,
        startLine,
        startColumn,
        endLine,
        endColumn,
      }).finish();
      stompClientRef.current.publish({
        destination: `/app/document/${docId}/selection`,
        binaryBody: payload,
      });
    }
  };

  return { sendCursor, sendSelection };
}

// --- Selection/cursor tracking ---
function useSelectionTracking(editorRef: React.RefObject<HTMLTextAreaElement>, sendCursor: (line: number, column: number) => void, sendSelection: (startLine: number, startColumn: number, endLine: number, endColumn: number) => void) {
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    // Calculate line/column from offset
    const text = target.value;
    const getLineCol = (offset: number) => {
      const lines = text.slice(0, offset).split('\n');
      return { line: lines.length - 1, column: lines[lines.length - 1].length };
    };
    const startPos = getLineCol(start);
    const endPos = getLineCol(end);

    if (start === end) {
      sendCursor(startPos.line, startPos.column);
      console.log({
        cursorPosition: { offset: start, line: startPos.line, column: startPos.column },
        selection: null,
      });
    } else {
      sendSelection(startPos.line, startPos.column, endPos.line, endPos.column);
      console.log({
        cursorPosition: null,
        selection: {
          startOffset: start,
          endOffset: end,
          startLine: startPos.line,
          startColumn: startPos.column,
          endLine: endPos.line,
          endColumn: endPos.column,
        },
      });
    }
  };

  return { handleSelectionChange };
}

export function TextEditor({
  content,
  onChange,
  collaborators,
  isOnline,
  lastSaved,
  onSave,
  docId = "default-doc",
}: TextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [remoteCollaborators, setRemoteCollaborators] = useState<Collaborator[]>([]);

  // Generate localUserId as a random number based on time
  const [localUserId] = useState(() => `${Math.floor(Date.now() % 1000000)}`);

  const { sendCursor, sendSelection } = useWebSocketCollab(docId, localUserId, editorRef, setRemoteCollaborators);
  const { handleSelectionChange } = useSelectionTracking(editorRef, sendCursor, sendSelection);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      // Preserve cursor position when content updates
      const cursorPosition = editor.selectionStart;
      if (content !== editor.value) {
        editor.value = content;
        editor.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  // Merge local and remote collaborators for display
  const allCollaborators = [
    ...collaborators.filter(c => c.id !== localUserId),
    ...remoteCollaborators.filter(c => c.id !== localUserId),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-editor-border bg-background px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Formatting Tools */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-accent" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Last Saved */}
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden lg:inline">
                Last saved: {lastSaved}
              </span>
            )}

            {/* Collaborators */}
            <div className="flex items-center gap-2">
              {collaborators.length > 0 && (
                <>
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {collaborators.slice(0, 5).map((collaborator) => (
                      <Avatar
                        key={collaborator.id}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarFallback
                          className="text-xs font-medium text-white"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {collaborators.length > 5 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        +{collaborators.length - 5}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          placeholder="Start typing your document..."
          className={`
            w-full h-full resize-none border-0 bg-editor-bg p-6 text-foreground
            placeholder:text-muted-foreground focus:outline-none
            font-mono text-sm leading-relaxed
            ${isFocused ? 'ring-2 ring-primary/20' : ''}
          `}
          spellCheck="true"
        />

        {/* Collaborative Cursors Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {allCollaborators.map((collaborator) =>
            collaborator.cursor ? (
              <div
                key={`cursor-${collaborator.id}`}
                className="absolute w-0.5 h-5 animate-pulse"
                style={{
                  backgroundColor: collaborator.color,
                  top: `${collaborator.cursor.line * 1.5}rem`,
                  left: `${collaborator.cursor.column * 0.6}rem`,
                }}
              >
                <div
                  className="absolute -top-6 -left-1 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                  style={{ backgroundColor: collaborator.color }}
                >
                  {collaborator.name}
                </div>
              </div>
            ) : null
          )}
          {/* Selection overlays can be added similarly using collaborator.selection */}
        </div>
      </div>
    </div>
  );
}