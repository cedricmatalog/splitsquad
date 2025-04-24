'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  Spinner: React.ComponentType<{ className?: string }>;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  Spinner,
}: DeletePaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Confirm Delete Payment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this payment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner className="mr-2" /> Deleting...
              </>
            ) : (
              'Delete Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
