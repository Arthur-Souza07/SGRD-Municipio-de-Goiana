import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
} from './lib/gestao-familias';

/** A sessão sobrevive à navegação; nenhum dado pessoal é gravado no navegador. */
export default function SessaoFamilias({ children }: { children: ReactNode }) {
  const [cadastrosSessao, setCadastrosSessao] = useState<CadastroFamilia[]>([]);
  const atuais = useRef<CadastroFamilia[]>([]);
  const documentosEmEnvio = useRef(new Set<string>());

  // Clean up in-flight documents on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      documentosEmEnvio.current.clear();
    };
  }, []);

  const salvarFamilia = useCallback(
    async (dados: DadosFamilia, chave: string) => {
      const documentos = documentosDaFamilia(dados);

      // Atomic check-and-add: do both in one synchronous operation without any await
      // This prevents race conditions where two concurrent calls both pass the check
      let alreadyInFlight = false;
      for (const cpf of documentos) {
        if (documentosEmEnvio.current.has(cpf)) {
          alreadyInFlight = true;
          break;
        }
      }
      if (alreadyInFlight) {
        throw new Error(
          'Um dos CPFs desta família já está em envio. Aguarde a conclusão.',
        );
      }
      // Add all CPFs atomically (still synchronous, no await between check and add)
      for (const cpf of documentos) {
        documentosEmEnvio.current.add(cpf);
      }

      try {
        let cadastro: CadastroFamilia;
        if (DEMONSTRACAO) {
          cadastro = criarCadastroDemonstrativo(dados);
        } else {
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

        // Functional state update to avoid race condition; update ref synchronously
        setCadastrosSessao((prev) => {
          const updated = [
            ...prev.filter((c) => c.id !== cadastro.id),
            cadastro,
          ];
          atuais.current = updated;
          return updated;
        });
        return cadastro;
      } finally {
        // Always clean up in-flight markers
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