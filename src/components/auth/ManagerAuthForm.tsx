import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormBase, InputField, SelectField, CheckboxField } from './AuthFormBase';
import { managerRegisterSchema, formatCPF } from '../../utils/validation';

interface ManagerAuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

const CARGO_OPTIONS = [
  { value: 'coordenador' as const, label: 'Coordenador' },
  { value: 'analista' as const, label: 'Analista' },
  { value: 'supervisor' as const, label: 'Supervisor' },
  { value: 'administrador' as const, label: 'Administrador' },
];

const SETOR_OPTIONS = [
  { value: 'defesa-civil' as const, label: 'Defesa Civil' },
  { value: 'planejamento' as const, label: 'Planejamento' },
  { value: 'operacoes' as const, label: 'Operações' },
  { value: 'tecnologia' as const, label: 'Tecnologia da Informação' },
  { value: 'administracao' as const, label: 'Administração' },
  { value: 'outro' as const, label: 'Outro' },
];

export function ManagerAuthForm({
  onSubmit,
  onSwitchToLogin,
  loading,
  error,
  success,
}: ManagerAuthFormProps) {
  const form = useForm({
    resolver: zodResolver(managerRegisterSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const cpfValue = useWatch({ control: form.control, name: 'cpf', exact: true });

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('cpf', formatted, { shouldValidate: true });
  };

  return (
    <AuthFormBase
      schema={managerRegisterSchema}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
      success={success}
      submitLabel="Cadastrar Gestor"
      className="manager-auth-form"
    >
      {(formMethods) => (
        <>
          <h2 id="form-title" className="form-title">Cadastro de Gestor</h2>
          <p className="form-subtitle">
            Acesso ao painel administrativo de monitoramento e gestão de riscos.
          </p>

          <div className="two-column-grid">
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
              label="Matrícula funcional"
              name="matricula"
              type="text"
              placeholder="Opcional"
              autoComplete="off"
              register={formMethods.register}
            />
          </div>

          <InputField
            label="Nome completo"
            name="nomeCompleto"
            type="text"
            placeholder="Maria Santos"
            autoComplete="name"
            required
            register={formMethods.register}
          />

          <InputField
            label="E-mail institucional"
            name="email"
            type="email"
            placeholder="gestor@goiana.pe.gov.br"
            autoComplete="email"
            inputMode="email"
            required
            register={formMethods.register}
          />

          <div className="two-column-grid">
            <SelectField
              label="Cargo/Função"
              name="cargo"
              placeholder="Selecione o cargo"
              options={CARGO_OPTIONS}
              required
              register={formMethods.register}
            />

            <SelectField
              label="Setor/Departamento"
              name="setor"
              placeholder="Selecione o setor"
              options={SETOR_OPTIONS}
              required
              register={formMethods.register}
            />
          </div>

          <InputField
            label="Senha"
            name="senha"
            type="password"
            placeholder="Mín. 12 caracteres, maiúscula, minúscula, número, especial"
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
            label="Aceito os Termos de Uso, Política de Privacidade (LGPD) e confirmo o nível de acesso solicitado"
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