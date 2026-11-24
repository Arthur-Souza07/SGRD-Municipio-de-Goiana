import { useState, useEffect, useCallback, useRef } from 'react';
import { Fingerprint, Eye, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authenticateWithBiometric, authenticateWithPIN, getBiometricErrorMessage } from '../../utils/biometricAuth';

export interface BiometricPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
}

export function BiometricPrompt({
  isOpen,
  onClose,
  onSuccess,
  onError,
  title = 'Confirmar cadastro',
  description = 'Para segurança, autentique-se com sua digital ou face ID antes de salvar o cadastro.',
}: BiometricPromptProps) {
  const [stage, setStage] = useState<'biometric' | 'pin' | 'success' | 'error'>('biometric');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setStage('biometric');
      setError(null);
      setPin('');
      setPinError(null);
      // Focus trap will be handled by the dialog
      setTimeout(() => {
        // Trigger biometric auth automatically on open
        handleBiometricAuth();
      }, 100);
    } else {
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  const handleBiometricAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await authenticateWithBiometric();

    setLoading(false);

    if (result.success) {
      setStage('success');
      // Brief success animation then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } else {
      const errorCode = result.errorCode || 'UNKNOWN';
      const message = getBiometricErrorMessage(errorCode);
      setError(message);

      // If biometric failed due to no credential or not allowed, offer PIN fallback
      if (errorCode === 'INVALID_STATE' || errorCode === 'NOT_ALLOWED' || errorCode === 'NO_AUTHENTICATOR') {
        setTimeout(() => {
          setStage('pin');
          setError(null);
          // Focus PIN input
          setTimeout(() => pinInputRef.current?.focus(), 100);
        }, 1500);
      } else {
        setStage('error');
        onError?.(message);
      }
    }
  }, [onSuccess, onClose, onError]);

  const handlePinSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError('Digite o PIN');
      return;
    }

    setLoading(true);
    setPinError(null);

    const result = await authenticateWithPIN(pin);

    setLoading(false);

    if (result.success) {
      setStage('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } else {
      setPinError(getBiometricErrorMessage(result.errorCode || 'UNKNOWN'));
    }
  }, [pin, onSuccess, onClose]);

  const handleRetryBiometric = useCallback(() => {
    setStage('biometric');
    setError(null);
    handleBiometricAuth();
  }, [handleBiometricAuth]);

  const handleBackToBiometric = useCallback(() => {
    setStage('biometric');
    setPin('');
    setPinError(null);
    handleBiometricAuth();
  }, [handleBiometricAuth]);

  if (!isOpen) return null;

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll<HTMLElement>(
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

      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="biometric-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="biometric-title">
      <div className="biometric-prompt">
        <header className="biometric-header">
          <h2 id="biometric-title" className="biometric-title">{title}</h2>
          <button
            type="button"
            className="biometric-close"
            onClick={onClose}
            aria-label="Fechar"
            disabled={loading || stage === 'success'}
          >
            ×
          </button>
        </header>

        <div className="biometric-content">
          {stage === 'biometric' && (
            <div className="biometric-stage">
              <div className="biometric-icon" aria-hidden="true">
                {loading ? (
                  <Loader2 size={48} className="spinning" />
                ) : (
                  <Fingerprint size={48} strokeWidth={1.5} />
                )}
              </div>
              <p className="biometric-description">{description}</p>
              {loading && <p className="biometric-status">Aguardando autenticação...</p>}
              {error && (
                <div className="biometric-error" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
              {!loading && error && (
                <button
                  type="button"
                  className="biometric-retry-btn"
                  onClick={handleRetryBiometric}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}

          {stage === 'pin' && (
            <div className="biometric-stage pin-stage">
              <div className="biometric-icon" aria-hidden="true">
                <Lock size={48} strokeWidth={1.5} />
              </div>
              <p className="biometric-description">
                Autenticação biométrica não disponível. Digite o PIN do dispositivo para confirmar.
              </p>
              <form onSubmit={handlePinSubmit} className="pin-form">
                <div className="pin-input-wrapper">
                  <label htmlFor="pin-input" className="sr-only">PIN do dispositivo</label>
                  <input
                    ref={pinInputRef}
                    id="pin-input"
                    type="password"
                    inputMode="numeric"
                    placeholder="PIN do dispositivo"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit(e)}
                    autoComplete="off"
                    disabled={loading}
                    className="pin-input"
                    aria-describedby={pinError ? 'pin-error' : undefined}
                  />
                </div>
                {pinError && (
                  <p id="pin-error" className="pin-error" role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    {pinError}
                  </p>
                )}
                <button
                  type="submit"
                  className="pin-submit-btn"
                  disabled={loading || !pin.trim()}
                >
                  {loading ? <Loader2 size={18} className="spinning" /> : 'Confirmar com PIN'}
                </button>
                <button
                  type="button"
                  className="pin-back-btn"
                  onClick={handleBackToBiometric}
                  disabled={loading}
                >
                  <Eye size={16} aria-hidden="true" />
                  Voltar para biometria
                </button>
              </form>
            </div>
          )}

          {stage === 'success' && (
            <div className="biometric-stage success-stage">
              <div className="biometric-icon success" aria-hidden="true">
                <CheckCircle2 size={48} strokeWidth={2} />
              </div>
              <p className="biometric-description">Autenticação confirmada com sucesso!</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="biometric-stage error-stage">
              <div className="biometric-icon error" aria-hidden="true">
                <AlertCircle size={48} strokeWidth={2} />
              </div>
              <p className="biometric-description">Não foi possível autenticar.</p>
              {error && <p className="biometric-error" role="alert">{error}</p>}
              <div className="error-actions">
                <button type="button" className="biometric-retry-btn" onClick={handleRetryBiometric}>
                  Tentar biometria novamente
                </button>
                <button type="button" className="biometric-retry-btn secondary" onClick={() => setStage('pin')}>
                  Usar PIN
                </button>
                <button type="button" className="biometric-cancel-btn" onClick={onClose}>
                  Cancelar cadastro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BiometricPrompt;