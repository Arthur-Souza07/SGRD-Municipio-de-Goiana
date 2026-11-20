import { AuthFormBase, InputField, CheckboxField } from './AuthFormBase';
import { agentLoginSchema } from '../../utils/validation';

interface AgentLoginFormProps {
  onSubmit: (data: any) => Promise<void>;
  onSwitchToRegister: () => void;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function AgentLoginForm({
  onSubmit,
  onSwitchToRegister,
  loading,
  error,
  success,
}: AgentLoginFormProps) {
  return (
    <AuthFormBase
      schema={agentLoginSchema}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
      success={success}
      submitLabel="Entrar"
      className="agent-login-form"
    >
      {(formMethods) => (
        <>
          <h2 id="form-title" className="form-title">Entrar como Agente</h2>
          <p className="form-subtitle">
            Acesse o sistema de cadastro social em campo.
          </p>

          <InputField
            label="CPF ou E-mail"
            name="identifier"
            type="text"
            placeholder="Digite seu CPF ou e-mail"
            autoComplete="username"
            required
            register={formMethods.register}
          />

          <InputField
            label="Senha"
            name="password"
            type="password"
            placeholder="Sua senha"
            autoComplete="current-password"
            required
            register={formMethods.register}
          />

          <CheckboxField
            label="Lembrar-me"
            name="rememberMe"
            register={formMethods.register}
          />

          <p className="switch-link">
            Não tem cadastro? <button type="button" onClick={onSwitchToRegister} className="link-button">Criar conta</button>
          </p>
        </>
      )}
    </AuthFormBase>
  );
}