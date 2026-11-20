import { useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ReactNode, Ref } from 'react';
import { useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * Base props for auth forms
 */
export interface AuthFormBaseProps<T extends z.ZodTypeAny> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  children: (form: UseFormReturn<FieldValues, any, FieldValues>) => ReactNode;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  className?: string;
}

/**
 * Form methods exposed via ref
 */
export interface AuthFormMethods {
  reset: () => void;
  setError: (name: string, error: { message: string }) => void;
  trigger: (name?: string) => Promise<boolean>;
  getValues: () => FieldValues;
}

/**
 * Reusable form wrapper with React Hook Form + Zod validation.
 * Handles loading, error, success states and accessibility.
 */
const AuthFormBaseComponent = function AuthFormBase(
  { schema, onSubmit, children, submitLabel = 'Continuar', loading = false, error, success, className = '' }: AuthFormBaseProps<any>,
  ref: Ref<HTMLFormElement | AuthFormMethods>
) {
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Expose form methods to parent if needed
  useImperativeHandle(ref, () => ({
    reset: form.reset,
    setError: form.setError,
    trigger: form.trigger,
    getValues: form.getValues,
  } satisfies AuthFormMethods));

  const handleSubmit = form.handleSubmit(async (data: FieldValues) => {
    try {
      await onSubmit(data as any);
    } catch (err) {
      console.error('Submit error:', err);
    }
  });

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`auth-form ${className}`}
      noValidate
      aria-label="Formulário de autenticação"
    >
      <div className="form-fields" role="group" aria-labelledby="form-title">
        {children(form)}
      </div>

      {error && (
        <div
          className="form-message form-error"
          role="alert"
          aria-live="assertive"
          data-testid="form-error"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="form-message form-success"
          role="status"
          aria-live="polite"
          data-testid="form-success"
        >
          {success}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-submit"
        disabled={loading}
        data-testid="submit-button"
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            <span className="btn-text">Processando…</span>
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
};

export const AuthFormBase = forwardRef<HTMLFormElement | AuthFormMethods, AuthFormBaseProps<any>>(AuthFormBaseComponent);
AuthFormBase.displayName = 'AuthFormBase';

/**
 * Input field component with label, error, and accessibility.
 */
export interface InputFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  register: UseFormReturn<any, any, undefined>['register'];
  className?: string;
}

export function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  required = false,
  disabled = false,
  error,
  register,
  className = '',
}: InputFieldProps) {
  const inputId = `input-${name}`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div className={`form-field ${className} ${error ? 'has-error' : ''}`}>
      <label htmlFor={inputId} className="field-label">
        {label}
        {required && <span className="required-indicator" aria-hidden="true">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        aria-required={required}
        className="field-input"
        {...register(name as any)}
      />
      {error && (
        <span id={errorId} className="field-error" role="alert" data-testid={`error-${name}`}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Select field component with label, error, and accessibility.
 */
export interface SelectFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  register: UseFormReturn<any, any, undefined>['register'];
  className?: string;
}

export function SelectField({
  label,
  name,
  placeholder,
  options,
  required = false,
  disabled = false,
  error,
  register,
  className = '',
}: SelectFieldProps) {
  const selectId = `select-${name}`;
  const errorId = `${selectId}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div className={`form-field ${className} ${error ? 'has-error' : ''}`}>
      <label htmlFor={selectId} className="field-label">
        {label}
        {required && <span className="required-indicator" aria-hidden="true">*</span>}
      </label>
      <select
        id={selectId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        aria-required={required}
        className="field-select"
        {...register(name as any)}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="field-error" role="alert" data-testid={`error-${name}`}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Checkbox field component with label and accessibility.
 */
export interface CheckboxFieldProps {
  label: ReactNode;
  name: string;
  required?: boolean;
  error?: string;
  register: UseFormReturn<any, any, undefined>['register'];
  className?: string;
}

export function CheckboxField({
  label,
  name,
  required = false,
  error,
  register,
  className = '',
}: CheckboxFieldProps) {
  const checkboxId = `checkbox-${name}`;
  const errorId = `${checkboxId}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div className={`form-field checkbox-field ${className} ${error ? 'has-error' : ''}`}>
      <label className="checkbox-label" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          className="checkbox-input"
          {...register(name as any)}
        />
        <span className="checkbox-custom" aria-hidden="true"></span>
        <span className="checkbox-text">{label}</span>
      </label>
      {error && (
        <span id={errorId} className="field-error" role="alert" data-testid={`error-${name}`}>
          {error}
        </span>
      )}
    </div>
  );
}