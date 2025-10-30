import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: 'provider' | 'proxy';
  itemName?: string;
  rememberChoice: boolean;
  onRememberChange: (checked: boolean) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName = itemType,
  rememberChoice,
  onRememberChange,
}) => {
  if (!isOpen) return null;

  const message = itemType === 'proxy'
    ? `Are you sure you want to delete this ${itemType}? This is irreversible.`
    : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <CardTitle>Confirm Delete</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-foreground mb-4">{message}</p>
            {itemName && <p className="text-sm font-medium mb-4">Item: {itemName}</p>}
            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => onRememberChange(e.target.checked)}
                className="rounded"
              />
              <span>Remember this choice for this session (don't ask again)</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};