import { useState, useCallback, useRef, useEffect } from 'react';

export type ProtectedActionType = 'delete' | 'edit';
export type ProtectedActionStage = 'idle' | 'confirm' | 'phrase' | 'reauth' | 'success' | 'error';

interface UseProtectedActionOptions {
  actionType: ProtectedActionType;
  confirmPhrase?: string;
  requireReauth?: boolean;
  onConfirm: () => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const DEFAULT_PHRASES: Record<ProtectedActionType, string> = {
  delete: 'EXCLUIR',
  edit: 'EDITAR',
};

export function useProtectedAction({
  actionType,
  confirmPhrase = DEFAULT_PHRASES[actionType],
  requireReauth = true,
  onConfirm,
  onSuccess,
  onError,
}: UseProtectedActionOptions) {
  const [stage, setStage] = useState<ProtectedActionStage>('idle');
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phraseInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const isActive = stage !== 'idle' && stage !== 'success';

  const reset = useCallback(() => {
    setStage('idle');
    setPhrase('');
    setPassword('');
    setError(null);
    setLoading(false);
    triggerRef.current?.focus();
  }, []);

  const handleTrigger = useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    setStage('confirm');
    setError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (requireReauth) {
      setStage('reauth');
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } else {
      setStage('phrase');
      setTimeout(() => phraseInputRef.current?.focus(), 100);
    }
  }, [requireReauth]);

  const handlePhraseSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (phrase !== confirmPhrase) {
      setError(`Digite "${confirmPhrase}" para confirmar`);
      return;
    }
    if (requireReauth) {
      setStage('reauth');
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } else {
      executeAction();
    }
  }, [phrase, confirmPhrase, requireReauth]);

  const handleReauthSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Digite sua senha');
      return;
    }
    executeAction();
  }, [password]);

  const executeAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStage('success');
    try {
      await onConfirm();
      onSuccess?.();
      // Brief success then reset
      setTimeout(reset, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar ação';
      setError(message);
      onError?.(message);
      setStage('error');
      setLoading(false);
    }
  }, [onConfirm, onSuccess, onError, reset]);

  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  const handleBack = useCallback(() => {
    if (stage === 'phrase') {
      setStage('confirm');
    } else if (stage === 'reauth') {
      if (requireReauth) {
        setStage('confirm');
      } else {
        setStage('phrase');
        setTimeout(() => phraseInputRef.current?.focus(), 100);
      }
    }
    setError(null);
  }, [stage, requireReauth]);

  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stage === 'idle') return;
        if (stage === 'success') {
          reset();
        } else {
          handleCancel();
        }
      }

      if (e.key === 'Tab' && isActive) {
        const modal = document.querySelector('[data-protected-modal]');
        if (modal) {
          const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stage, isActive, reset, handleCancel]);

  const getStageIcon = () => {
    switch (stage) {
      case 'confirm':
        return 'confirm';
      case 'phrase':
        return 'phrase';
      case 'reauth':
        return 'reauth';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return null;
    }
  };

  return {
    // State
    stage,
    phrase,
    setPhrase,
    password,
    setPassword,
    loading,
    error,
    isActive,
    // Refs
    phraseInputRef,
    passwordInputRef,
    triggerRef,
    // Actions
    trigger: handleTrigger,
    confirm: handleConfirm,
    handlePhraseSubmit,
    handleReauthSubmit,
    cancel: handleCancel,
    back: handleBack,
    reset,
    // Helpers
    getStageIcon,
    confirmPhrase,
  };
}

export default useProtectedAction;