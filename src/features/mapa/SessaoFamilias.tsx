import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ContextoFamilias } from './sessao-contexto';
import { API_FAMILIAS, DEMONSTRACAO } from './lib/configuracao';
import {
  criarCadastroDemonstrativo,
  enviarCadastro,
  type CadastroFamilia,
  type DadosFamilia,
} from './lib/familias';
import {
  documentosDaFamilia,
  possuiDocumentoCadastrado,
} from './lib/gestao-familias';

/** A sessão sobrevive à navegação; nenhum dado pessoal é gravado no navegador. */
export default function SessaoFamilias({ children }: { children: ReactNode }) {
  const [cadastrosSessao, setCadastrosSessao] = useState<CadastroFamilia[]>([]);
  const atuais = useRef<CadastroFamilia[]>([]);
  const documentosEmEnvio = useRef(new Set<string>());
  const salvarFamilia = useCallback(
    async (dados: DadosFamilia, chave: string) => {
      const documentos = documentosDaFamilia(dados);
      if (
        possuiDocumentoCadastrado(atuais.current, dados) ||
        documentos.some((cpf) => documentosEmEnvio.current.has(cpf))
      ) {
        throw new Error(
          'Um dos CPFs desta família já está cadastrado ou em envio nesta sessão. Consulte os registros antes de repetir.',
        );
      }
      documentos.forEach((cpf) => documentosEmEnvio.current.add(cpf));
      try {
        let cadastro: CadastroFamilia;
        if (DEMONSTRACAO) cadastro = criarCadastroDemonstrativo(dados);
        else {
          if (!API_FAMILIAS)
            throw new Error(
              'Esta origem permite apenas consulta. Configure a API de famílias para cadastrar.',
            );
          const controlador = new AbortController();
          const tempo = setTimeout(() => controlador.abort(), 20000);
          try {
            cadastro = await enviarCadastro(
              API_FAMILIAS,
              dados,
              chave,
              controlador.signal,
            );
          } catch (erro) {
            if (erro instanceof Error && erro.name === 'AbortError')
              throw new Error(
                'O servidor demorou para confirmar. Confira a lista antes de repetir o envio.',
              );
            if (erro instanceof TypeError)
              throw new Error(
                'Sem conexão com o servidor. Os dados continuam no formulário.',
              );
            throw erro;
          } finally {
            clearTimeout(tempo);
          }
        }
        atuais.current = [
          ...atuais.current.filter((c) => c.id !== cadastro.id),
          cadastro,
        ];
        setCadastrosSessao(atuais.current);
        return cadastro;
      } finally {
        documentos.forEach((cpf) => documentosEmEnvio.current.delete(cpf));
      }
    },
    [],
  );
  const contexto = useMemo(
    () => ({ cadastrosSessao, salvarFamilia }),
    [cadastrosSessao, salvarFamilia],
  );
  return (
    <ContextoFamilias.Provider value={contexto}>
      {children}
    </ContextoFamilias.Provider>
  );
}
