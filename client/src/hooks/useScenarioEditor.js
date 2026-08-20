import { useState, useCallback } from 'react';

export const useScenarioEditor = (initialScenario = null, onSave) => {
  const [editingScenario, setEditingScenario] = useState(initialScenario);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openEditor = useCallback((scenario) => {
    setEditingScenario(scenario);
    setIsOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingScenario(null);
    setIsOpen(false);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setEditingScenario((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const saveScenario = useCallback(async () => {
    if (!editingScenario) return;
    setLoading(true);
    try {
      if (onSave) {
        await onSave(editingScenario);
      }
      closeEditor();
    } finally {
      setLoading(false);
    }
  }, [editingScenario, onSave, closeEditor]);

  return {
    editingScenario,
    isOpen,
    loading,
    openEditor,
    closeEditor,
    handleFieldChange,
    saveScenario,
  };
};

export default useScenarioEditor;
