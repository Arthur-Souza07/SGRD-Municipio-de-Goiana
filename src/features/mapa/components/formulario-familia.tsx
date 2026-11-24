import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  Fragment,
} from 'react';
import { FlaskConical, Save, Plus } from 'lucide-react';
import PainelDialogo from './painel-dialogo';
import { useIsTouchDevice } from '@/hooks/useDeviceType';
import BiometricPrompt from '@/components/auth/BiometricPrompt';
import SecaoInformacaoImovel from './SecaoInformacaoImovel';
import SecaoCaracterizacaoImovel from './SecaoCaracterizacaoImovel';
import SecaoCondicoesHabitabilidade from './SecaoCondicoesHabitabilidade';
import SecaoHistoricoOcorrencias from './SecaoHistoricoOcorrencias';
import SecaoInterdictioes from './SecaoInterdictioes';
import SecaoDesalojamentos from './SecaoDesalojamentos';
import SecaoBeneficiosAuxilios from './SecaoBeneficiosAuxilios';
import SecaoEncaminhamentoHabitacional from './SecaoEncaminhamentoHabitacional';
import SecaoVistorias from './SecaoVistorias';
import SecaoSituacaoAtual from './SecaoSituacaoAtual';
import SecaoDocumentosFotograficos from './SecaoDocumentosFotograficos';
import CamposPessoaCompleta from './CamposPessoaCompleta';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  FORMULARIO_VAZIO,
  exemploCadastro,
  formatarCpf,
  gerarIdentificador,
  prepararCadastro,
  validarCadastro,
  type CamposCadastro,
  type DadosFamilia,
  type ErrosCadastro,
  type InformacaoImovel,
  type CaracterizacaoImovel,
  type CondicoesHabitabilidade,
  type HistoricoOcorrencia,
  type Interdicao,
  type DesalojamentoDesabrigo,
  type BeneficioAuxilio,
  type EncaminhamentoHabitacional,
  type HistoricoVistorias,
  type SituacaoAtual,
  type DocumentosFotograficos,
  type ChefeFamilia,
  type Conjuge,
  type MembroFamilia,
} from '@/features/mapa/lib/familias';

interface FormularioFamiliaProps {
  aberto: boolean;
  demonstracao: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: DadosFamilia, chave: string) => Promise<void>;
  /** On mobile: keep form open after successful save (clear for next registration) */
  mobileKeepOpen?: boolean;
}

export default function FormularioFamilia({
  aberto,
  demonstracao,
  aoFechar,
  aoSalvar,
  mobileKeepOpen = false,
}: FormularioFamiliaProps) {
  const [campos, setCampos] = useState<CamposCadastro>({ ...FORMULARIO_VAZIO });
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [consentimentoDemo, setConsentimentoDemo] = useState(false);
  const [biometricPromptAberto, setBiometricPromptAberto] = useState(false);
  const [etapaAtiva, setEtapaAtiva] = useState(0);
  const etapas = [
    'Imóvel',
    'Caracterização',
    'Habitabilidade',
    'Família',
    'Histórico',
    'Documentos',
  ];
  const enviandoRef = useRef(false);
  const chave = useRef('');
  const formulario = useRef<HTMLFormElement>(null);
  const isTouchDevice = useIsTouchDevice();
  useEffect(
    () => () => {
      // Cleanup: do NOT increment gpsTentativa here.
      // Only increment when STARTING a new GPS request (in capturarGps).
    },
    [],
  );
  useEffect(() => {
    if (!aberto) {
      // Dialog closed: just stop GPS indicator, don't cancel in-flight request
    }
  }, [aberto]);
  const alterar = <K extends keyof CamposCadastro>(
    campo: K,
    valor: CamposCadastro[K],
  ) => {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
    setErros((anterior) => ({
      ...anterior,
      [campo]: undefined,
      ...(campo === 'familiares' || campo === 'cpf'
        ? { moradores: undefined }
        : {}),
    }));
    setErroEnvio('');
    chave.current = '';
  };

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviandoRef.current) return;
    const validacao = validarCadastro(campos);
    setErros(validacao);
    setErroEnvio('');
    if (Object.keys(validacao).length) {
      requestAnimationFrame(() =>
        formulario.current
          ?.querySelector<HTMLElement>(
            'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"], #localizacao-cadastro[aria-invalid="true"]',
          )
          ?.focus(),
      );
      return;
    }
    if (demonstracao && !consentimentoDemo) {
      setErroEnvio(
        'Confirme que os dados são fictícios para testar o cadastro.',
      );
      return;
    }

    // On mobile/tablet, require biometric authentication before saving
    if (isTouchDevice && !demonstracao) {
      setBiometricPromptAberto(true);
      return;
    }

    await executarSalvamento();
  }

  async function executarSalvamento() {
    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (!chave.current) chave.current = gerarIdentificador();
      await aoSalvar(prepararCadastro(campos), chave.current);
      setCampos({ ...FORMULARIO_VAZIO });
      setConsentimentoDemo(false);
      chave.current = '';
      setEtapaAtiva(0);
      // On mobile with mobileKeepOpen, keep form open for next registration
      if (!mobileKeepOpen) {
        aoFechar();
      }
    } catch (erro) {
      setErroEnvio(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível confirmar o cadastro. Confira a conexão e tente novamente.',
      );
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  const aoBiometriaSucesso = useCallback(() => {
    executarSalvamento();
  }, []);

  const aoBiometriaErro = useCallback((erro: string) => {
    setErroEnvio(erro);
    setBiometricPromptAberto(false);
  }, []);

  const aoBiometriaFechar = useCallback(() => {
    setBiometricPromptAberto(false);
  }, []);
  const ajuda = (campo: keyof CamposCadastro) =>
    erros[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {erros[campo]}
      </span>
    ) : null;
  const propsCampo = (campo: keyof CamposCadastro) => ({
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
  });

  // Handlers para as novas seções
  const alterarInformacaoImovel = useCallback((dados: InformacaoImovel) => {
    alterar('informacaoImovel', dados);
    if (dados.grauRisco === 'Alto') alterar('nivelRisco', 'alto');
    if (dados.grauRisco === 'Médio') alterar('nivelRisco', 'medio');
    if (dados.grauRisco === 'Baixo') alterar('nivelRisco', 'baixo');
  }, []);

  const alterarCaracterizacaoImovel = useCallback((dados: CaracterizacaoImovel) => {
    alterar('caracterizacaoImovel', dados);
  }, []);

  const alterarCondicoesHabitabilidade = useCallback((dados: CondicoesHabitabilidade) => {
    alterar('condicoesHabitabilidade', dados);
  }, []);

  const alterarChefeFamilia = useCallback((dados: ChefeFamilia) => {
    alterar('chefeFamilia', dados);
  }, []);

  const alterarConjuge = useCallback((dados: Conjuge) => {
    alterar('conjuge', dados);
  }, []);

  const alterarDemaisMembros = useCallback((dados: MembroFamilia[]) => {
    alterar('demaisMembros', dados);
  }, []);

  const alterarHistoricoOcorrencias = useCallback((dados: HistoricoOcorrencia[]) => {
    alterar('historicoOcorrencias', dados);
  }, []);

  const alterarInterdictioes = useCallback((dados: Interdicao[]) => {
    alterar('interdictioes', dados);
  }, []);

  const alterarDesalojamentos = useCallback((dados: DesalojamentoDesabrigo[]) => {
    alterar('desalojamentos', dados);
  }, []);

  const alterarBeneficiosAuxilios = useCallback((dados: BeneficioAuxilio[]) => {
    alterar('beneficiosAuxilios', dados);
  }, []);

  const alterarEncaminhamentoHabitacional = useCallback((dados: EncaminhamentoHabitacional) => {
    alterar('encaminhamentoHabitacional', dados);
  }, []);

  const alterarHistoricoVistorias = useCallback((dados: HistoricoVistorias) => {
    alterar('historicoVistorias', dados);
  }, []);

  const alterarSituacaoAtual = useCallback((dados: SituacaoAtual) => {
    alterar('situacaoAtual', dados);
  }, []);

  const alterarDocumentosFotograficos = useCallback((dados: DocumentosFotograficos) => {
    alterar('documentosFotograficos', dados);
  }, []);

  // Handlers para Chefe, Cônjuge e Demais Membros
  const handleChefeChange = useCallback((dados: ChefeFamilia) => {
    alterarChefeFamilia(dados);
    // Sync basic fields for backward compatibility
    if (dados.nome) alterar('nomeRepresentante', dados.nome);
    if (dados.cpf) alterar('cpf', formatarCpf(dados.cpf));
    if (dados.telefone) alterar('telefone', dados.telefone);
    if (dados.dataNascimento) alterar('nascimentoRepresentante', dados.dataNascimento);
    if (dados.observacao) alterar('apoioRepresentante', dados.observacao);
  }, [alterarChefeFamilia, alterar]);

  const handleConjugeChange = useCallback((dados: Conjuge) => {
    alterarConjuge(dados);
  }, [alterarConjuge]);

  const handleDemaisMembrosChange = useCallback((dados: MembroFamilia[]) => {
    alterarDemaisMembros(dados);
    // Also update the old familiares array for backward compatibility
    const familiares = dados.map((m) => ({
      id: m.id || gerarIdentificador(),
      nomeCompleto: m.nome,
      parentesco: m.vinculoSocialParentesco,
      dataNascimento: m.dataNascimento || '',
      cpf: m.cpf || '',
      apoio: m.observacao || '',
    }));
    alterar('familiares', familiares);
  }, [alterarDemaisMembros, alterar]);

  return (
    <Fragment>
      <PainelDialogo
        id="cadastro"
        aberto={aberto}
        aoFechar={aoFechar}
        titulo="Cadastrar família"
        subtitulo="Identifique a família, seus integrantes e a residência. Preencha todas as seções conforme o modelo oficial."
        ocupado={enviando}
        mostrarFechar={!mobileKeepOpen}
        acoesCabecalho={mobileKeepOpen ? (
          <div className="theme-toggle-mobile">
            <ThemeToggle />
          </div>
        ) : undefined}
        rodape={(fechar) => (
        <>
          <span className="nota-rodape">
            {demonstracao
              ? 'Teste nesta aba · Dados apagados ao atualizar a página'
              : 'Envio para a API da equipe'}
          </span>
          <div>
            <div className="navegacao-etapas-rodape">
              <button
                type="button"
                disabled={etapaAtiva === 0 || enviando}
                onClick={() => setEtapaAtiva((etapa) => Math.max(0, etapa - 1))}
              >
                Anterior
              </button>
              {etapaAtiva < etapas.length - 1 && (
                <button
                  type="button"
                  className="botao-primario"
                  disabled={enviando}
                  onClick={() => {
                    setEtapaAtiva((etapa) => Math.min(etapas.length - 1, etapa + 1));
                    document
                      .querySelector('.corpo-dialogo')
                      ?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Próxima etapa
                </button>
              )}
            </div>
            {!mobileKeepOpen && (
              <button type="button" onClick={fechar} disabled={enviando}>
                Voltar ao mapa
              </button>
            )}
            <button
              className="botao-primario botao-adicionar-demonstracao"
              type="submit"
              form="formulario-familia"
              disabled={enviando}
            >
              {enviando ? <span className="spinner" /> : <Save size={16} />}{' '}
              {enviando
                ? 'Enviando cadastro…'
                : demonstracao
                  ? 'Adicionar à demonstração'
                  : 'Salvar cadastro'}
            </button>
          </div>
        </>
      )}
    >
      <form
        id="formulario-familia"
        ref={formulario}
        onSubmit={enviar}
        noValidate
        aria-busy={enviando}
      >
        {demonstracao && (
          <div className="aviso-formulario">
            <FlaskConical size={19} />
            <div>
              <strong>Você está em uma demonstração</strong>
              <p>
                Use apenas informações fictícias. Este teste fica nesta aba, sem
                envio de dados pessoais a um servidor.
              </p>
              <button
                type="button"
                disabled={enviando}
                onClick={() => {
                  const exemplo = exemploCadastro();
                  setCampos(exemplo);
                  setErros({});
                  setErroEnvio('');
                  setConsentimentoDemo(true);
                  chave.current = '';
                }}
              >
                Preencher com exemplo fictício
              </button>
            </div>
          </div>
        )}
        {Object.values(erros).some(Boolean) && (
          <p className="foco-erro" role="alert">
            Revise os campos sinalizados abaixo. O cadastro ainda não foi
            enviado.
          </p>
        )}

        <nav className="etapas-cadastro" aria-label="Etapas do cadastro">
          {etapas.map((etapa, indice) => (
            <button
              key={etapa}
              type="button"
              className={indice === etapaAtiva ? 'etapa-ativa' : ''}
              aria-current={indice === etapaAtiva ? 'step' : undefined}
              onClick={() => setEtapaAtiva(indice)}
            >
              <span>{indice + 1}</span>
              {etapa}
            </button>
          ))}
        </nav>

        <div className="conteudo-etapa" data-etapa={etapaAtiva}>
        {etapaAtiva === 0 ? (
        <SecaoInformacaoImovel
          dados={campos.informacaoImovel}
          aoAlterar={alterarInformacaoImovel}
          erros={erros.informacaoImovel as any}
          apenasLeitura={enviando}
        />
        ) : null}

        {etapaAtiva === 1 ? (
        <SecaoCaracterizacaoImovel
          dados={campos.caracterizacaoImovel}
          aoAlterar={alterarCaracterizacaoImovel}
          erros={erros.caracterizacaoImovel as any}
          apenasLeitura={enviando}
        />
        ) : null}

        {etapaAtiva === 2 ? (
        <SecaoCondicoesHabitabilidade
          dados={campos.condicoesHabitabilidade}
          aoAlterar={alterarCondicoesHabitabilidade}
          erros={erros.condicoesHabitabilidade as any}
          apenasLeitura={enviando}
        />
        ) : null}

        {etapaAtiva === 3 ? (
        <fieldset disabled={enviando}>
          <legend>
            <span>4</span>Responsável pelo Imóvel e Composição Familiar
          </legend>
          <p className="ajuda-secao">
            Dados completos do chefe da família, cônjuge e demais membros.
          </p>

          {/* Chefe da Família (Representante) */}
          <CamposPessoaCompleta
            titulo="Chefe da Família (Representante)"
            pessoa={campos.chefeFamilia}
            aoAlterar={handleChefeChange}
            erros={erros.chefeFamilia as any}
            apenasLeitura={enviando}
          />

          {/* Cônjuge */}
          <CamposPessoaCompleta
            titulo="Cônjuge / Companheiro(a)"
            pessoa={campos.conjuge}
            aoAlterar={handleConjugeChange}
            erros={erros.conjuge as any}
            apenasLeitura={enviando}
          />

          {/* Demais Membros */}
          <div className="secao-demais-membros">
            <h4>Demais Membros da Composição Familiar</h4>
            <p className="ajuda-secao">
              Inclua filhos, pais, avós, netos, irmãos ou outros que residem no imóvel.
              Máximo de 8 membros adicionais.
            </p>
            {campos.demaisMembros?.map((membro, idx) => (
              <CamposPessoaCompleta
                key={membro.id || idx}
                titulo="Membro"
                indice={idx}
                pessoa={membro}
                aoAlterar={(dados) => {
                  const novos = [...(campos.demaisMembros || [])];
                  novos[idx] = dados as MembroFamilia;
                  handleDemaisMembrosChange(novos);
                }}
                erros={erros.demaisMembros as any}
                mostrarVinculo={true}
                aoRemover={() => {
                  const novos = (campos.demaisMembros || []).filter((_, i) => i !== idx);
                  handleDemaisMembrosChange(novos);
                }}
                apenasLeitura={enviando}
              />
            ))}
            {(campos.demaisMembros?.length || 0) < 8 && !enviando && (
              <button
                type="button"
                className="adicionar-familiar"
                onClick={() => {
                  const novoMembro: MembroFamilia = {
                    id: gerarIdentificador(),
                    nome: '',
                    apelidoNomeSocial: '',
                    telefone: '',
                    cpf: '',
                    rg: '',
                    dataNascimento: '',
                    idade: undefined,
                    estadoCivil: 'solteiro',
                    nisPis: '',
                    identidadeGenero: 'prefiro_nao_dizer',
                    racaCor: 'nao_declarada',
                    ocupacaoProfissional: '',
                    rendaFamiliar: '',
                    beneficiosSocioassistenciais: '',
                    possuiDeficiencia: 'nao_informado',
                    deficienciaQual: '',
                    observacao: '',
                    vinculoSocialParentesco: 'filho',
                    cor: '',
                  };
                  handleDemaisMembrosChange([...(campos.demaisMembros || []), novoMembro]);
                }}
              >
                <Plus size={16} />
                Adicionar membro
              </button>
            )}
          </div>
        </fieldset>
        ) : null}

        {etapaAtiva === 4 ? (
        <Fragment>
        <SecaoHistoricoOcorrencias
          dados={campos.historicoOcorrencias}
          aoAlterar={alterarHistoricoOcorrencias}
          erros={erros.historicoOcorrencias as any}
          apenasLeitura={enviando}
        />

        <SecaoInterdictioes
          dados={campos.interdictioes}
          aoAlterar={alterarInterdictioes}
          erros={erros.interdictioes as any}
          apenasLeitura={enviando}
        />

        <SecaoDesalojamentos
          dados={campos.desalojamentos}
          aoAlterar={alterarDesalojamentos}
          erros={erros.desalojamentos as any}
          apenasLeitura={enviando}
        />

        <SecaoBeneficiosAuxilios
          dados={campos.beneficiosAuxilios}
          aoAlterar={alterarBeneficiosAuxilios}
          erros={erros.beneficiosAuxilios as any}
          apenasLeitura={enviando}
        />

        <SecaoEncaminhamentoHabitacional
          dados={campos.encaminhamentoHabitacional}
          aoAlterar={alterarEncaminhamentoHabitacional}
          erros={erros.encaminhamentoHabitacional as any}
          apenasLeitura={enviando}
        />

        <SecaoVistorias
          dados={campos.historicoVistorias}
          aoAlterar={alterarHistoricoVistorias}
          erros={erros.historicoVistorias as any}
          apenasLeitura={enviando}
        />

        <SecaoSituacaoAtual
          dados={campos.situacaoAtual}
          aoAlterar={alterarSituacaoAtual}
          erros={erros.situacaoAtual as any}
          apenasLeitura={enviando}
        />
        </Fragment>
        ) : null}

        {etapaAtiva === 5 ? (
        <Fragment>
          <SecaoDocumentosFotograficos
            dados={campos.documentosFotograficos}
            aoAlterar={alterarDocumentosFotograficos}
            erros={erros.documentosFotograficos as any}
            apenasLeitura={enviando}
          />
          <fieldset disabled={enviando}>
            <legend>
              Observações gerais
            </legend>
            <label className="campo">
              Observações gerais <span className="opcional">(opcional)</span>
              <textarea
                name="observacoes"
                rows={3}
                maxLength={1000}
                placeholder="Informações úteis para a próxima visita."
                value={campos.observacoes}
                onChange={(e) => alterar('observacoes', e.target.value)}
                {...propsCampo('observacoes')}
              />
              <small>{campos.observacoes.length}/1.000 caracteres</small>
              {ajuda('observacoes')}
            </label>
          </fieldset>

        {demonstracao && (
          <label className="confirmacao-demo">
            <input
              type="checkbox"
              checked={consentimentoDemo}
              onChange={(e) => setConsentimentoDemo(e.target.checked)}
              disabled={enviando}
            />{' '}
            Estou usando apenas dados fictícios nesta demonstração.
          </label>
        )}
        {erroEnvio && (
          <p className="aviso-dados erro-dados erro-envio" role="alert">
            {erroEnvio}
          </p>
        )}
        </Fragment>
        ) : null}
        </div>

      </form>
    </PainelDialogo>

    {/* Biometric Authentication Prompt - Only on mobile/tablet */}
    <BiometricPrompt
      isOpen={biometricPromptAberto}
      onClose={aoBiometriaFechar}
      onSuccess={aoBiometriaSucesso}
      onError={aoBiometriaErro}
      title="Confirmar cadastro"
      description="Para segurança, autentique-se com sua digital ou face ID antes de salvar o cadastro."
    />
  </Fragment>
  );
}