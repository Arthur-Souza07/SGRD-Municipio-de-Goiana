import { createContext, useContext } from 'react';
import type { CadastroFamilia, DadosFamilia } from './lib/familias';

export interface SessaoFamiliasContexto {
  cadastrosSessao: readonly CadastroFamilia[];
  salvarFamilia: (
    dados: DadosFamilia,
    chave: string,
  ) => Promise<CadastroFamilia>;
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
