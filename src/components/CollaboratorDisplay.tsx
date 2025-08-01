import React, { useState, useEffect } from 'react';
import * as awarenessProtocol from 'y-protocols/awareness';
import { AwarenessState } from '@/hooks/useCRDTDocument';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users } from 'lucide-react';

// THE FIX: The component now expects the awareness instance directly.
interface CollaboratorDisplayProps {
    awareness: awarenessProtocol.Awareness;
}

export function CollaboratorDisplay({ awareness }: CollaboratorDisplayProps) {
    const [collaborators, setCollaborators] = useState<Map<number, AwarenessState>>(new Map());

    useEffect(() => {
        if (!awareness) return;

        const updateHandler = () => {
            setCollaborators(new Map(awareness.getStates() as Map<number, AwarenessState>));
        };

        awareness.on('change', updateHandler);
        updateHandler();

        return () => {
            awareness.off('change', updateHandler);
        };
    }, [awareness]);

    const localId = awareness.clientID;

    const activeCollaborators = Array.from(collaborators.entries())
        .filter(([id, state]) => id !== localId && state.user?.name && state.user?.color);

    if (activeCollaborators.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
                {activeCollaborators.slice(0, 3).map(([id, state]) => (
                    <Tooltip key={id}>
                        <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
                                <AvatarFallback
                                    className="text-xs font-medium text-white"
                                    style={{ backgroundColor: state.user.color }}
                                >
                                    {state.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{state.user.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                {activeCollaborators.length > 3 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarFallback>+{activeCollaborators.length - 3}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{activeCollaborators.length - 3} more collaborators</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}