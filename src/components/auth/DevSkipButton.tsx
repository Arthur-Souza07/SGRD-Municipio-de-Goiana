import { useState, useEffect, useCallback } from 'react';

export interface DevSkipButtonProps {
  onSkipToMap: () => void;
  onSkipToPeopleRegistration: () => void;
  userRole: 'agent' | 'manager';
}

/**
 * Development-only button to skip authentication and navigate to main screens.
 * Only renders when VITE_DEV_SKIP=true or activated via hidden key combo.
 * REMOVE BEFORE PRODUCTION DEPLOY.
 */
export function DevSkipButton({
  onSkipToMap,
  onSkipToPeopleRegistration,
  userRole,
}: DevSkipButtonProps) {
  const [showDevButton, setShowDevButton] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Check environment variable on mount
  useEffect(() => {
    const envEnabled = import.meta.env.VITE_DEV_SKIP === 'true';
    if (envEnabled) {
      setShowDevButton(true);
    }
  }, []);

  // Hidden activation: 5 clicks on logo within 3 seconds
  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTime > 3000) {
      setClickCount(1);
    } else {
      setClickCount((prev) => prev + 1);
    }
    setLastClickTime(now);

    if (clickCount >= 4) { // 5th click
      setShowDevButton(true);
    }
  }, [clickCount, lastClickTime]);

  // Also allow Shift+D key combo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDevButton((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showDevButton && import.meta.env.VITE_DEV_SKIP !== 'true') {
    return (
      <span
        className="dev-skip-trigger"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        aria-label="Clique 5x para ativar botão DEV"
        data-testid="dev-skip-trigger"
      >
        {/* This can be attached to a logo or hidden element */}
      </span>
    );
  }

  return (
    <div className="dev-skip-container" data-testid="dev-skip" role="region" aria-label="Atalhos de desenvolvimento">
      <div className="dev-skip-divider" aria-hidden="true"></div>
      <p className="dev-skip-label">🚧 Modo Desenvolvimento</p>
      <div className="dev-skip-buttons">
        <button
          type="button"
          className="dev-skip-button"
          onClick={userRole === 'manager' ? onSkipToMap : onSkipToPeopleRegistration}
          aria-label={`Pular para ${userRole === 'manager' ? 'Mapa' : 'Cadastro de Pessoas'} (DEV)`}
          data-testid={`dev-skip-${userRole === 'manager' ? 'map' : 'people'}`}
        >
          Ir para {userRole === 'manager' ? 'Mapa' : 'Cadastro Pessoas'}
        </button>
        {userRole === 'agent' && (
          <button
            type="button"
            className="dev-skip-button dev-skip-button-alt"
            onClick={onSkipToMap}
            aria-label="Pular para Mapa (DEV)"
            data-testid="dev-skip-map-agent"
          >
            Ir para Mapa
          </button>
        )}
      </div>
      <small className="dev-skip-note">
        Botão temporário — <strong>REMOVER ANTES DO DEPLOY</strong>
      </small>
      <button
        type="button"
        className="dev-skip-hide"
        onClick={() => setShowDevButton(false)}
        aria-label="Ocultar botões DEV"
      >
        ×
      </button>
    </div>
  );
}