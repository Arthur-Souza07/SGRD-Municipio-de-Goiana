import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { AuthFormBase, InputField, CheckboxField } from './AuthFormBase';
import { agentRegisterSchema, formatCPF, formatPhone } from '../../utils/validation';
import { useGeolocation } from '../../hooks/useGeolocation';

interface AgentAuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function AgentAuthForm({
  onSubmit,
  onSwitchToLogin,
  loading,
  error,
  success,
}: AgentAuthFormProps) {
  const { getCurrentPosition, latitude, longitude, accuracy, loading: gpsLoading, error: gpsError, errorMessage, hasLocation } = useGeolocation();
  const [gpsRequested, setGpsRequested] = useState(false);

  const form = useForm({
    resolver: zodResolver(agentRegisterSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      latitude: undefined,
      longitude: undefined,
    },
  });

  const cpfValue = useWatch({ control: form.control, name: 'cpf', exact: true });
  const telefoneValue = useWatch({ control: form.control, name: 'telefone', exact: true });

  // Format CPF on change
  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('cpf', formatted, { shouldValidate: true });
  };

  // Format phone on change
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    form.setValue('telefone', formatted, { shouldValidate: true });
  };

  // Auto-request GPS on mount if not already requested
  useEffect(() => {
    if (!gpsRequested && !hasLocation) {
      setGpsRequested(true);
      getCurrentPosition();
    }
  }, [gpsRequested, hasLocation, getCurrentPosition]);

  // Update form with GPS coordinates when available
  useEffect(() => {
    if (hasLocation && latitude !== null && longitude !== null) {
      form.setValue('latitude', latitude);
      form.setValue('longitude', longitude);
    }
  }, [hasLocation, latitude, longitude, form]);

  return (
    <AuthFormBase
      schema={agentRegisterSchema}
      onSubmit={onSubmit}
      loading={loading || gpsLoading}
      error={error}
      success={success}
      submitLabel="Cadastrar Agente"
      className="agent-auth-form"
    >
      {(formMethods) => (
        <>
          <h2 id="form-title" className="form-title">Cadastro de Agente de Campo</h2>
          <p className="form-subtitle">
            Preencha os dados para acessar o sistema de cadastro social em campo.
          </p>

          <InputField
            label="CPF"
            name="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            autoComplete="off"
            required
            register={formMethods.register}
            onChange={handleCpfChange}
            value={cpfValue ?? ''}
            className="cpf-field"
          />

          <InputField
            label="Nome completo"
            name="nomeCompleto"
            type="text"
            placeholder="João da Silva"
            autoComplete="name"
            required
            register={formMethods.register}
          />

          <InputField
            label="E-mail institucional"
            name="email"
            type="email"
            placeholder="agente@exemplo.gov.br"
            autoComplete="email"
            inputMode="email"
            required
            register={formMethods.register}
          />

          <InputField
            label="Telefone com DDD"
            name="telefone"
            type="tel"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            autoComplete="tel"
            required
            register={formMethods.register}
            onChange={handlePhoneChange}
            value={telefoneValue ?? ''}
            className="phone-field"
          />

          <div className="gps-section" data-testid="gps-section">
            <fieldset className="gps-fieldset">
              <legend className="gps-legend">Localização GPS <span className="required-indicator">*</span></legend>

              <div className="gps-status" role="status" aria-live="polite">
                {gpsLoading && (
                  <span className="gps-loading">
                    <span className="spinner-sm" aria-hidden="true"></span>
                    Obtendo localização…
                  </span>
                )}
                {hasLocation && (
                  <span className="gps-success" data-testid="gps-success">
                    ✓ Localização capturada ({accuracy ? `precisão: ~${Math.round(accuracy)}m` : 'precisão desconhecida'})
                  </span>
                )}
                {gpsError && (
                  <span className="gps-error" data-testid="gps-error">
                    ✗ {errorMessage}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm gps-retry"
                      onClick={() => {
                        setGpsRequested(false);
                        getCurrentPosition();
                      }}
                    >
                      Tentar novamente
                    </button>
                  </span>
                )}
                {!gpsLoading && !hasLocation && !gpsError && !gpsRequested && (
                  <span className="gps-pending">
                    Clique em "Capturar GPS" para obter sua localização
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary gps-capture-btn"
                onClick={() => {
                  setGpsRequested(false);
                  getCurrentPosition();
                }}
                disabled={gpsLoading}
                data-testid="capture-gps-btn"
              >
                {gpsLoading ? 'Capturando…' : hasLocation ? 'Recapturar GPS' : 'Capturar GPS'}
              </button>

              {hasLocation && (
                <details className="gps-coords">
                  <summary>Ver coordenadas</summary>
                  <pre>Latitude: {latitude?.toFixed(7)}\nLongitude: {longitude?.toFixed(7)}</pre>
                </details>
              )}
            </fieldset>
          </div>

          <InputField
            label="Senha"
            name="senha"
            type="password"
            placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número, 1 especial"
            autoComplete="new-password"
            required
            register={formMethods.register}
            className="password-field"
          />

          <InputField
            label="Confirmar senha"
            name="confirmarSenha"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
            register={formMethods.register}
          />

          <CheckboxField
            label="Aceito os Termos de Uso e a Política de Privacidade (LGPD)"
            name="termos"
            required
            register={formMethods.register}
          />

          <p className="switch-link">
            Já tem cadastro? <button type="button" onClick={onSwitchToLogin} className="link-button">Entrar</button>
          </p>
        </>
      )}
    </AuthFormBase>
  );
}