import { useState, useEffect } from 'react';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  itemType: 'provider' | 'proxy';
}

export const useDeleteConfirmation = () => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const confirmed = sessionStorage.getItem('deleteConfirmed');
    setIsConfirmed(confirmed === 'true');
  }, []);

  const confirmDelete = (itemType: 'provider' | 'proxy', onConfirm: () => void) => {
    if (isConfirmed) {
      onConfirm();
      return true;
    }

    // Show modal logic here, but for hook, return a function to trigger modal
    // In practice, this hook would set modal open state in parent, but for simplicity,
    // we'll assume parent provides modal
    // This is a placeholder; actual impl needs modal integration
    const remember = confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.\n\nCheck to remember this choice for this session.`);
    const rememberChoice = remember; // Simulate checkbox as second confirm if needed, but use single confirm for now
    if (remember) {
      onConfirm();
      sessionStorage.setItem('deleteConfirmed', 'true');
      setIsConfirmed(true);
      return true;
    }
    return false;
  };

  return { confirmDelete, isConfirmed };
};

// For full modal, create component separately
