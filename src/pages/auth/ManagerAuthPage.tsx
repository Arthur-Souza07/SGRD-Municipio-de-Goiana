import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BarChart3, AlertCircle } from 'lucide-react';
import {
  ManagerAuthForm,
  ManagerLoginForm,
  DevSkipButton,
} from '../../components/auth';
import { handleRegister, handleLogin } from '../../utils/auth';
import type { ManagerRegisterData, ManagerLoginData } from '../../utils/validation';
import './ManagerAuthPage.css';

interface ManagerAuthPageProps {
  onLoginSuccess: () => void;
  onSkipToMap?: () => void;
  onSkipToPeopleRegistration?: () => void;
}

export function ManagerAuthPage({
  onLoginSuccess,
  onSkipToMap,
  onSkipToPeopleRegistration,
}: ManagerAuthPageProps) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleRegisterSubmit = async (data: ManagerRegisterData) => {
    clearMessages();
    setLoading(true);
    try {
      await handleRegister(data);
      setSuccess('Cadastro realizado com sucesso! Redirecionando…');
      setTimeout(() => {
        onLoginSuccess();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (data: ManagerLoginData) => {
    clearMessages();
    setLoading(true);
    try {
      await handleLogin(data);
      setSuccess('Login realizado! Redirecionando…');
      setTimeout(() => {
        onLoginSuccess();
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('Credenciais inválidas. Verifique CPF/e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = useCallback(() => {
    clearMessages();
    setScreen('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearMessages]);

  const goToLogin = useCallback(() => {
    clearMessages();
    setScreen('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearMessages]);

  return (
    <div className="auth-page manager-auth-page">
      <header className="auth-header" role="banner">
        <div className="auth-brand">
          <div className="brand-icon" aria-hidden="true">
            <ShieldCheck size={32} strokeWidth={2} />
          </div>
          <div className="brand-text">
            <strong>Prefeitura de Goiana</strong>
            <span>Defesa Civil</span>
          </div>
        </div>
        <p className="auth-tagline">Painel Administrativo — Monitoramento e Gestão de Riscos</p>
      </header>

      <main className="auth-main" role="main">
        <div className="auth-card">
          <div className="auth-icon" aria-hidden="true">
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>

          {screen === 'register' ? (
            <ManagerAuthForm
              onSubmit={handleRegisterSubmit}
              onSwitchToLogin={goToLogin}
              loading={loading}
              error={error}
              success={success}
            />
          ) : (
            <ManagerLoginForm
              onSubmit={handleLoginSubmit}
              onSwitchToRegister={goToRegister}
              loading={loading}
              error={error}
              success={success}
            />
          )}

          <DevSkipButton
            onSkipToMap={onSkipToMap ?? (() => { onLoginSuccess(); navigate('/'); })}
            onSkipToPeopleRegistration={onSkipToPeopleRegistration ?? (() => { onLoginSuccess(); navigate('/cadastro-pessoas'); })}
            userRole="manager"
          />
        </div>

        <footer className="auth-footer" role="contentinfo">
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
            <span aria-hidden="true">·</span>
            <a href="#" target="_blank" rel="noopener noreferrer">Política de Privacidade (LGPD)</a>
            <span aria-hidden="true">·</span>
            <a href="#" target="_blank" rel="noopener noreferrer">Acessibilidade</a>
          </div>
          <p className="footer-copyright">
            Prefeitura de Goiana — Pernambuco · Defesa Civil
          </p>
        </footer>
      </main>

      {error && (
        <div
          className="global-error-toast"
          role="alert"
          aria-live="assertive"
          data-testid="global-error"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={clearMessages}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ManagerAuthPage;