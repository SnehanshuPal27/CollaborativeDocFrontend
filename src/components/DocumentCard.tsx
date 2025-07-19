import { FileText, MoreVertical, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
  id: string;
  title: string;
  lastModified: string;
  collaborators: number;
  isShared: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function DocumentCard({
  title,
  lastModified,
  collaborators,
  isShared,
  onClick,
  onRename,
  onDelete,
  onDuplicate,
}: DocumentCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] bg-gradient-secondary border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3" onClick={onClick}>
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{lastModified}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isShared && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {collaborators} collaborator{collaborators !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex -space-x-2">
            {[...Array(Math.min(collaborators, 3))].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white`}
                style={{
                  backgroundColor: `hsl(var(--user-${(i % 5) + 1}))`,
                }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            {collaborators > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{collaborators - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}