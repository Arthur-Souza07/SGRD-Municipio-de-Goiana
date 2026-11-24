import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authenticateWithBiometric, authenticateWithPIN, getBiometricErrorMessage } from '../../utils/biometricAuth';

export interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: 'biometric' | 'password' | 'pin') => void;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
  requireBiometric?: boolean;
}

export function ReauthModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  title = 'Autenticação necessária',
  description = 'Digite sua senha ou use a biometria para autorizar esta ação.',
  requireBiometric = false,
}: ReauthModalProps) {
  const [stage, setStage] = useState<'biometric' | 'password' | 'pin' | 'success' | 'error'>('biometric');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setStage(requireBiometric ? 'biometric' : 'password');
      setError(null);
      setPassword('');
      setPin('');
      setPinError(null);
      setShowPassword(false);
      // Trigger biometric auth automatically on open if required
      if (requireBiometric) {
        setTimeout(() => {
          handleBiometricAuth();
        }, 100);
      } else {
        setTimeout(() => passwordInputRef.current?.focus(), 100);
      }
    } else {
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }
  }, [isOpen, requireBiometric]);

  const handleBiometricAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await authenticateWithBiometric();

    setLoading(false);

    if (result.success) {
      setStage('success');
      // Brief success animation then close
      setTimeout(() => {
        onSuccess('biometric');
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
      } else if (!requireBiometric) {
        // Allow fallback to password
        setTimeout(() => {
          setStage('password');
          setError(null);
          setTimeout(() => passwordInputRef.current?.focus(), 100);
        }, 1500);
      } else {
        setStage('error');
        onError?.(message);
      }
    }
  }, [onSuccess, onClose, onError, requireBiometric]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Digite sua senha');
      return;
    }

    setLoading(true);
    setError(null);

    // Mock password validation - in real app, this would validate against stored credentials
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo, accept any non-empty password
    if (password.length >= 4) {
      setLoading(false);
      setStage('success');
      setTimeout(() => {
        onSuccess('password');
        onClose();
      }, 500);
    } else {
      setLoading(false);
      setError('Senha incorreta. Tente novamente.');
    }
  }, [password, onSuccess, onClose]);

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
        onSuccess('pin');
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

  const handleBackToPassword = useCallback(() => {
    setStage('password');
    setPassword('');
    setError(null);
    setTimeout(() => passwordInputRef.current?.focus(), 100);
  }, []);

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

  const getStageContent = () => {
    switch (stage) {
      case 'biometric':
        return (
          <div className="reauth-stage">
            <div className="reauth-icon" aria-hidden="true">
              {loading ? (
                <Loader2 size={48} className="spinning" />
              ) : (
                <Lock size={48} strokeWidth={1.5} />
              )}
            </div>
            <p className="reauth-description">{description}</p>
            {loading && <p className="reauth-status">Aguardando autenticação...</p>}
            {error && (
              <div className="reauth-error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {!loading && error && (
              <div className="reauth-fallback-actions">
                {requireBiometric ? (
                  <button
                    type="button"
                    className="reauth-btn"
                    onClick={() => setStage('pin')}
                  >
                    Usar PIN do dispositivo
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="reauth-btn"
                      onClick={() => setStage('password')}
                    >
                      Usar senha
                    </button>
                    <button
                      type="button"
                      className="reauth-btn secondary"
                      onClick={handleRetryBiometric}
                    >
                      Tentar biometria novamente
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      case 'password':
        return (
          <div className="reauth-stage">
            <div className="reauth-icon" aria-hidden="true">
              <Lock size={48} strokeWidth={1.5} />
            </div>
            <p className="reauth-description">
              Digite sua senha para autorizar esta ação
            </p>
            <form onSubmit={handlePasswordSubmit} className="reauth-form">
              <div className="password-input-wrapper">
                <label htmlFor="reauth-password" className="sr-only">Senha</label>
                <input
                  ref={passwordInputRef}
                  id="reauth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Sua senha"
                  className="reauth-input"
                  autoComplete="current-password"
                  aria-describedby={error ? 'password-error' : undefined}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && (
                <p id="password-error" className="reauth-error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="reauth-form-actions">
                {requireBiometric && (
                  <button
                    type="button"
                    className="reauth-btn secondary"
                    onClick={handleBackToBiometric}
                    disabled={loading}
                  >
                    <Lock size={16} aria-hidden="true" />
                    Voltar para biometria
                  </button>
                )}
                <button
                  type="submit"
                  className="reauth-btn primary"
                  disabled={loading || !password.trim()}
                >
                  {loading ? <Loader2 size={16} className="spinning" /> : 'Autorizar'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'pin':
        return (
          <div className="reauth-stage pin-stage">
            <div className="reauth-icon" aria-hidden="true">
              <Lock size={48} strokeWidth={1.5} />
            </div>
            <p className="reauth-description">
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
        );
      case 'success':
        return (
          <div className="reauth-stage success-stage">
            <div className="reauth-icon success" aria-hidden="true">
              <CheckCircle2 size={48} strokeWidth={2} />
            </div>
            <p className="reauth-description">Autenticação confirmada com sucesso!</p>
          </div>
        );
      case 'error':
        return (
          <div className="reauth-stage error-stage">
            <div className="reauth-icon error" aria-hidden="true">
              <AlertCircle size={48} strokeWidth={2} />
            </div>
            <p className="reauth-description">Não foi possível autenticar.</p>
            {error && <p className="reauth-error" role="alert">{error}</p>}
            <div className="error-actions">
              <button type="button" className="reauth-btn" onClick={handleRetryBiometric}>
                Tentar biometria novamente
              </button>
              <button type="button" className="reauth-btn secondary" onClick={() => setStage('pin')}>
                Usar PIN
              </button>
              {!requireBiometric && (
                <button type="button" className="reauth-btn secondary" onClick={handleBackToPassword}>
                  Usar senha
                </button>
              )}
              <button type="button" className="reauth-btn danger" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="reauth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reauth-title">
      <div className="reauth-modal">
        <header className="reauth-header">
          <h2 id="reauth-title" className="reauth-title">{title}</h2>
          <button
            type="button"
            className="reauth-close"
            onClick={onClose}
            aria-label="Fechar"
            disabled={loading || stage === 'success'}
          >
            ×
          </button>
        </header>
        <div className="reauth-content">
          {getStageContent()}
        </div>
      </div>
    </div>
  );
}

export default ReauthModal;