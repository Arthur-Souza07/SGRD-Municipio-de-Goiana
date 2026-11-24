import { createContext, useContext } from 'react';
import type { CadastroFamilia, DadosFamilia } from './lib/familias';

export interface SessaoFamiliasContexto {
  cadastrosSessao: readonly CadastroFamilia[];
  setCadastrosSessao: React.Dispatch<React.SetStateAction<CadastroFamilia[]>>;
  salvarFamilia: (
    dados: DadosFamilia,
    chave: string,
  ) => Promise<CadastroFamilia>;
  // Mobile-specific: track if user just logged in from mobile to auto-open form
  mobileJustLoggedIn: boolean;
  setMobileJustLoggedIn: (value: boolean) => void;
}
export const ContextoFamilias = createContext<SessaoFamiliasContexto | null>(
  null,
);
export function useSessaoFamilias() {
  const contexto = useContext(ContextoFamilias);
  if (!contexto)
    throw new Error('O módulo de famílias precisa do provedor de sessão.');
  return contexto;
}
