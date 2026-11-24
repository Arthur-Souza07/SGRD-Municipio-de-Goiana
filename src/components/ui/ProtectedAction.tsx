import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X, Shield } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useProtectedAction } from '../../hooks/useProtectedAction';
import { ReauthModal } from '../auth/ReauthModal';

export type ProtectedActionType = 'delete' | 'edit';
export type ProtectedActionStage = 'idle' | 'confirm' | 'phrase' | 'reauth' | 'success' | 'error';

interface ProtectedActionProps {
  children: (actions: {
    trigger: () => void;
    isActive: boolean;
    stage: ProtectedActionStage;
    reset: () => void;
  }) => React.ReactNode;
  onConfirm: () => Promise<void> | void;
  actionType: ProtectedActionType;
  confirmPhrase?: string; // e.g., "EXCLUIR" or "EDITAR"
  requireReauth?: boolean; // Whether to require password/biometric re-auth
  title?: string;
  description?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const DEFAULT_PHRASES: Record<ProtectedActionType, string> = {
  delete: 'EXCLUIR',
  edit: 'EDITAR',
};

const DEFAULT_TITLES: Record<ProtectedActionType, string> = {
  delete: 'Excluir registro',
  edit: 'Editar registro',
};

const DEFAULT_DESCRIPTIONS: Record<ProtectedActionType, string> = {
  delete: 'Esta ação é irreversível. Tem certeza que deseja excluir este registro?',
  edit: 'Você está prestes a modificar dados importantes. Confirme para continuar.',
};

export function ProtectedAction({
  children,
  onConfirm,
  actionType,
  confirmPhrase = DEFAULT_PHRASES[actionType],
  requireReauth = true,
  title = DEFAULT_TITLES[actionType],
  description = DEFAULT_DESCRIPTIONS[actionType],
  onSuccess,
  onError,
}: ProtectedActionProps) {
  const deviceType = useDeviceType();
  const [mounted, setMounted] = useState(false);
  const isDesktop = deviceType === 'desktop';

  // Ensure we only check deviceType after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // All hooks called unconditionally at the top level
  const [reauthModalOpen, setReauthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);

  const {
    stage,
    phrase,
    setPhrase,
    password,
    setPassword,
    loading,
    error,
    isActive,
    phraseInputRef,
    passwordInputRef,
    trigger,
    confirm,
    handleReauthSubmit,
    cancel,
    back,
    reset,
    confirmPhrase: activeConfirmPhrase,
  } = useProtectedAction({
    actionType,
    confirmPhrase,
    requireReauth: false, // We handle reauth ourselves via ReauthModal
    onConfirm: async () => {
      // This is called after phrase confirmation (if requireReauth was false)
      // or after successful reauth via ReauthModal
      if (pendingAction) {
        await pendingAction();
        setPendingAction(null);
      }
      onSuccess?.();
      setTimeout(reset, 1000);
    },
    onError: (err) => {
      onError?.(err);
      setPendingAction(null);
    },
  });

  // Handle trigger - opens confirmation dialog
  const handleTrigger = useCallback(() => {
    trigger();
  }, [trigger]);

  // Handle confirm - after first confirmation, either go to phrase or open reauth modal
  const handleConfirmAction = useCallback(() => {
    if (requireReauth) {
      // Open reauth modal instead of going to phrase stage
      setPendingAction(() => onConfirm);
      setReauthModalOpen(true);
    } else {
      // Go to phrase stage
      confirm();
    }
  }, [requireReauth, onConfirm, confirm]);

  // Handle phrase submit - after typing phrase, open reauth modal if needed
  const handlePhraseSubmitWrapper = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (phrase !== activeConfirmPhrase) {
      // The hook's handlePhraseSubmit will set error
      return;
    }
    // Phrase is correct
    if (requireReauth) {
      setPendingAction(() => onConfirm);
      setReauthModalOpen(true);
    } else {
      // Execute action directly
      await onConfirm();
      onSuccess?.();
      setTimeout(reset, 1000);
    }
  }, [phrase, activeConfirmPhrase, requireReauth, onConfirm, onSuccess, reset]);

  const handleReauthSuccess = useCallback(() => {
    setReauthModalOpen(false);
    // The useProtectedAction's onConfirm will be called via pendingAction
  }, []);

  const handleReauthError = useCallback((err: string) => {
    setReauthModalOpen(false);
    setPendingAction(null);
    onError?.(err);
  }, [onError]);

  const handleReauthClose = useCallback(() => {
    setReauthModalOpen(false);
    setPendingAction(null);
  }, []);

  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stage === 'idle') return;
        if (stage === 'success') {
          reset();
        } else {
          cancel();
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
  }, [stage, isActive, reset, cancel]);

  const getStageIconComponent = () => {
    switch (stage) {
      case 'confirm':
        return <AlertCircle size={24} strokeWidth={2} aria-hidden="true" />;
      case 'phrase':
        return <Shield size={24} strokeWidth={2} aria-hidden="true" />;
      case 'reauth':
        return <Shield size={24} strokeWidth={2} aria-hidden="true" />;
      case 'success':
        return <CheckCircle2 size={24} strokeWidth={2} aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={24} strokeWidth={2} aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getStageContent = () => {
    switch (stage) {
      case 'confirm':
        return (
          <div className="protected-stage">
            <p className="protected-description">{description}</p>
            <div className="protected-actions">
              <button
                type="button"
                className="btn btn-secondary protected-back"
                onClick={cancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger protected-confirm"
                onClick={handleConfirmAction}
              >
                Confirmar
              </button>
            </div>
          </div>
        );
      case 'phrase':
        return (
          <div className="protected-stage">
            <p className="protected-description">
              Para confirmar, digite exatamente: <strong>{activeConfirmPhrase}</strong>
            </p>
            <form onSubmit={handlePhraseSubmitWrapper} className="protected-form">
              <input
                ref={phraseInputRef}
                type="text"
                value={phrase}
                onChange={(e) => {
                  setPhrase(e.target.value.toUpperCase());
                  // Clear error via the hook
                }}
                placeholder={`Digite ${activeConfirmPhrase}`}
                className="protected-input"
                autoComplete="off"
                spellCheck={false}
                aria-describedby={error ? 'phrase-error' : undefined}
                disabled={loading}
              />
              {error && (
                <p id="phrase-error" className="protected-error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="protected-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={back}
                  disabled={loading}
                >
                  <X size={16} aria-hidden="true" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading || phrase !== activeConfirmPhrase}
                >
                  {loading ? <Loader2 size={16} className="spinning" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'reauth':
        // This stage is now handled by ReauthModal
        // But we keep it as fallback for inline password (if not using modal)
        return (
          <div className="protected-stage">
            <p className="protected-description">
              Digite sua senha para autorizar esta ação
            </p>
            <form onSubmit={handleReauthSubmit} className="protected-form">
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear error via the hook
                }}
                placeholder="Sua senha"
                className="protected-input"
                autoComplete="current-password"
                aria-describedby={error ? 'password-error' : undefined}
                disabled={loading}
              />
              {error && (
                <p id="password-error" className="protected-error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="protected-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={back}
                  disabled={loading}
                >
                  <X size={16} aria-hidden="true" />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading || !password.trim()}
                >
                  {loading ? <Loader2 size={16} className="spinning" /> : 'Autorizar'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'success':
        return (
          <div className="protected-stage success">
            <div className="protected-icon success" aria-hidden="true">
              <CheckCircle2 size={32} strokeWidth={2} />
            </div>
            <p className="protected-description">
              {actionType === 'delete' ? 'Registro excluído com sucesso' : 'Alterações autorizadas'}
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="protected-stage error">
            <div className="protected-icon error" aria-hidden="true">
              <AlertCircle size={32} strokeWidth={2} />
            </div>
            <p className="protected-description">Erro ao executar ação</p>
            {error && <p className="protected-error" role="alert">{error}</p>}
            <div className="protected-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={back}
              >
                Tentar novamente
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render simple children on mobile/tablet or during SSR (before hydration)
  // This uses conditional rendering instead of early return to maintain hook order
  const shouldSkipProtection = !mounted || !isDesktop;

  return (
    <>
      {children({
        trigger: shouldSkipProtection ? () => onConfirm() : handleTrigger,
        isActive: shouldSkipProtection ? false : isActive,
        stage: shouldSkipProtection ? 'idle' : stage,
        reset: shouldSkipProtection ? () => {} : reset,
      })}

      {!shouldSkipProtection && isActive && (
        <div
          className="protected-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="protected-title"
          data-protected-modal
        >
          <div className="protected-modal">
            <header className="protected-header">
              <div className="protected-icon-wrapper">
                {getStageIconComponent()}
              </div>
              <h2 id="protected-title" className="protected-title">{title}</h2>
              <button
                type="button"
                className="protected-close"
                onClick={cancel}
                aria-label="Fechar"
                disabled={loading || stage === 'success'}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className="protected-content">
              {getStageContent()}
            </div>
          </div>
        </div>
      )}

      {/* Reauth Modal - used for biometric/password/PIN authentication */}
      <ReauthModal
        isOpen={shouldSkipProtection ? false : reauthModalOpen}
        onClose={handleReauthClose}
        onSuccess={handleReauthSuccess}
        onError={handleReauthError}
        title={title}
        description={description}
        requireBiometric={false}
      />
    </>
  );
}

export default ProtectedAction;