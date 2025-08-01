import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const shareSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});

type ShareFormValues = z.infer<typeof shareSchema>;

interface ShareDialogProps {
    documentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ documentId, open, onOpenChange }: ShareDialogProps) {
    const { addCollaborator } = useDocuments();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ShareFormValues>({
        resolver: zodResolver(shareSchema),
    });

    const onSubmit = async (data: ShareFormValues) => {
        try {
            await addCollaborator(documentId, data.email);
            toast.success("Collaborator Added!", {
                description: `${data.email} has been invited to the document.`,
            });
            reset(); // Clear the form
        } catch (error: any) {
            toast.error("Failed to Add Collaborator", {
                description: error.message || "Please check the email and try again.",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share Document</DialogTitle>
                    <DialogDescription>
                        Enter the email of the user you want to invite to collaborate.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="sr-only">Email</Label>
                        <Input id="email" placeholder="name@example.com" {...register("email")} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Inviting..." : "Add Collaborator"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}