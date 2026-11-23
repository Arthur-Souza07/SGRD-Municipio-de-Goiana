import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  ChevronDown,
  User,
  IdCard,
  AlertTriangle,
  Phone,
  Calendar,
  ChevronRight,
  Users,
  Home,
  Building2,
  FileText,
  Shield,
  Clock,
  Camera,
  MapPin as MapPinIcon,
  ArrowRight,
} from 'lucide-react';
import type { DadosFamilia, NivelRisco, MembroFamilia } from '../lib/familias';
import './VisualizacaoFamilia.css';

interface VisualizacaoFamiliaProps {
  familia: DadosFamilia | null;
  aoExportar?: () => void;
  aoFechar?: () => void;
}

const RISCO_CORES: Record<NivelRisco, string> = {
  alto: 'var(--risco-alto, #dc2626)',
  medio: 'var(--risco-medio, #f59e0b)',
  baixo: 'var(--risco-baixo, #10b981)',
  nao_informado: 'var(--risco-nao-informado, #6b7280)',
};

const RISCO_LABELS: Record<NivelRisco, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
  nao_informado: 'Não informado',
};

function formatarCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

function formatarTelefone(tel: string): string {
  const clean = tel.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return tel;
}

function SimNao(valor?: string): string {
  if (!valor) return 'Não informado';
  if (valor === 'sim') return 'Sim';
  if (valor === 'nao') return 'Não';
  if (valor === 'parcial') return 'Parcial';
  return valor;
}

function renderCampo(label: string, valor: string | number | undefined | null, icone?: React.ReactNode) {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <div className="campo-item">
      {icone && <span className="campo-icone">{icone}</span>}
      <span className="campo-label">{label}</span>
      <span className="campo-valor">{String(valor)}</span>
    </div>
  );
}

function renderSecao(titulo: string, icone: React.ReactNode, campos: (React.ReactNode | null)[]) {
  const validos = campos.filter(Boolean);
  if (validos.length === 0) return null;
  return (
    <div className="secao-expandida">
      <h4 className="secao-titulo">
        {icone}
        <span>{titulo}</span>
      </h4>
      <div className="secao-campos">
        {validos}
      </div>
    </div>
  );
}

function MembroCard({ membro, titulo }: { membro: MembroFamilia | DadosFamilia['chefeFamilia'] | DadosFamilia['conjuge']; titulo: string }) {
  if (!membro) return null;
  return (
    <div className="membro-card">
      <h5 className="membro-titulo">{titulo}</h5>
      <div className="membro-campos">
        {renderCampo('Nome completo', membro.nome, <User size={14} />)}
        {renderCampo('Nome social/Apelido', membro.apelidoNomeSocial, <User size={14} />)}
        {renderCampo('CPF', formatarCPF(membro.cpf || ''), <IdCard size={14} />)}
        {renderCampo('RG', membro.rg, <IdCard size={14} />)}
        {renderCampo('Data de nascimento', membro.dataNascimento, <Calendar size={14} />)}
        {renderCampo('Idade', `${membro.idade || 0} anos`, <Calendar size={14} />)}
        {renderCampo('Telefone', formatarTelefone(membro.telefone || ''), <Phone size={14} />)}
        {renderCampo('Estado civil', membro.estadoCivil, <User size={14} />)}
        {renderCampo('NIS/PIS', membro.nisPis, <IdCard size={14} />)}
        {renderCampo('Identidade de gênero', membro.identidadeGenero, <User size={14} />)}
        {renderCampo('Cor/Raça', 'cor' in membro ? (membro as MembroFamilia).cor || membro.racaCor : membro.racaCor, <User size={14} />)}
        {renderCampo('Ocupação', membro.ocupacaoProfissional, <Building2 size={14} />)}
        {renderCampo('Renda familiar (R$)', membro.rendaFamiliar, <FileText size={14} />)}
        {renderCampo('Benefícios socioassistenciais', membro.beneficiosSocioassistenciais, <FileText size={14} />)}
        {renderCampo('Possui deficiência', SimNao(membro.possuiDeficiencia), <Shield size={14} />)}
        {renderCampo('Qual deficiência', membro.deficienciaQual, <Shield size={14} />)}
        {renderCampo('Observação', membro.observacao, <FileText size={14} />)}
      </div>
    </div>
  );
}

function ComodoItem({ comodo }: { comodo: { nome: string; quantidade: number } }) {
  return (
    <div className="comodo-item">
      <span>{comodo.nome}</span>
      <span className="comodo-qtd">{comodo.quantidade}</span>
    </div>
  );
}

export default function VisualizacaoFamilia({
  familia,
  aoExportar,
  aoFechar,
}: VisualizacaoFamiliaProps) {
  const [expandido, setExpandido] = useState(false);
  const [alturaConteudo, setAlturaConteudo] = useState(0);
  const conteudoRef = useRef<HTMLDivElement>(null);

  // Calcular altura do conteúdo expandido para animação suave
  useEffect(() => {
    if (expandido && conteudoRef.current) {
      const altura = conteudoRef.current.scrollHeight;
      setAlturaConteudo(altura);
    } else {
      setAlturaConteudo(0);
    }
  }, [expandido, familia]);

  if (!familia) {
    return (
      <div className="visualizacao-familia vazia">
        <div className="estado-vazio">
          <Users size={48} />
          <p>Nenhuma família selecionada</p>
        </div>
      </div>
    );
  }

  const riscoCor = RISCO_CORES[familia.nivelRisco] || RISCO_CORES.nao_informado;
  const riscoLabel = RISCO_LABELS[familia.nivelRisco] || 'Não informado';

  // Seções expandidas
  const secoesExpandidas = useMemo(() => [
    renderSecao(
      'Informação do Imóvel',
      <Home size={18} />,
      [
        renderCampo('Município', familia.informacaoImovel?.municipio, <MapPinIcon size={14} />),
        renderCampo('Data de cadastro', familia.informacaoImovel?.dataCadastro, <Calendar size={14} />),
        renderCampo('Última atualização', familia.informacaoImovel?.dataUltimaAtualizacao, <Calendar size={14} />),
        renderCampo('Comunidade', familia.informacaoImovel?.comunidade, <Users size={14} />),
        renderCampo('Endereço', familia.informacaoImovel?.endereco, <MapPinIcon size={14} />),
        renderCampo('Número', familia.informacaoImovel?.numero, <MapPinIcon size={14} />),
        renderCampo('Complemento', familia.informacaoImovel?.complemento, <MapPinIcon size={14} />),
        renderCampo('Bairro', familia.informacaoImovel?.bairro, <MapPinIcon size={14} />),
        renderCampo('Distrito', familia.informacaoImovel?.distrito, <MapPinIcon size={14} />),
        renderCampo('Longitude', familia.informacaoImovel?.longitude, <MapPinIcon size={14} />),
        renderCampo('Latitude', familia.informacaoImovel?.latitude, <MapPinIcon size={14} />),
        renderCampo('Tipo de risco', familia.informacaoImovel?.tipoRisco, <AlertTriangle size={14} />),
        renderCampo('Grau de risco', familia.informacaoImovel?.grauRisco, <AlertTriangle size={14} />),
      ]
    ),
    renderSecao(
      'Caracterização do Imóvel',
      <Building2 size={18} />,
      [
        renderCampo('Uso do imóvel', familia.caracterizacaoImovel?.usoImovel, <Home size={14} />),
        renderCampo('Condição de ocupação', familia.caracterizacaoImovel?.condicoesOcupacao, <Shield size={14} />),
        renderCampo('Valor do aluguel (R$)', familia.caracterizacaoImovel?.valorAluguel, <FileText size={14} />),
        renderCampo('Nome do locador', familia.caracterizacaoImovel?.nomeLocador, <User size={14} />),
        renderCampo('Imóvel verticalizado', SimNao(familia.caracterizacaoImovel?.imovelVerticalizado), <Building2 size={14} />),
        renderCampo('Nº de pavimentos', familia.caracterizacaoImovel?.numeroPavimentos, <Building2 size={14} />),
        renderCampo('Pavimentos que ocupa', familia.caracterizacaoImovel?.pavimentosOcupa, <Building2 size={14} />),
        renderCampo('Área do terreno (m²)', familia.caracterizacaoImovel?.areaTerreno, <MapPinIcon size={14} />),
        renderCampo('Área construída (m²)', familia.caracterizacaoImovel?.areaConstrucao, <MapPinIcon size={14} />),
        familia.caracterizacaoImovel?.comodos?.length && (
          <div className="secao-sub-lista">
            <h5>Cômodos</h5>
            <div className="comodos-grid">
              {familia.caracterizacaoImovel.comodos.map((c, i) => (
                <ComodoItem key={i} comodo={c} />
              ))}
            </div>
          </div>
        ),
      ]
    ),
    renderSecao(
      'Condições de Habitabilidade',
      <Shield size={18} />,
      [
        renderCampo('Tipo de construção', familia.condicoesHabitabilidade?.tipoConstrucao, <Building2 size={14} />),
        renderCampo('Padrão de acabamento', familia.condicoesHabitabilidade?.padraoAcabamento, <Building2 size={14} />),
        renderCampo('Tipo de cobertura', familia.condicoesHabitabilidade?.tipoCoberta, <Home size={14} />),
        renderCampo('Saneamento básico', familia.condicoesHabitabilidade?.saneamentoBasico, <Shield size={14} />),
        renderCampo('Abastecimento de água', familia.condicoesHabitabilidade?.abastecimentoAgua, <MapPinIcon size={14} />),
        renderCampo('Águas pluviais', familia.condicoesHabitabilidade?.aguasPluviais, <MapPinIcon size={14} />),
        renderCampo('Pavimentação', familia.condicoesHabitabilidade?.pavimentacao, <MapPinIcon size={14} />),
        renderCampo('Iluminação pública', SimNao(familia.condicoesHabitabilidade?.iluminacaoPublica), <Shield size={14} />),
        renderCampo('Coleta de resíduos', SimNao(familia.condicoesHabitabilidade?.coletaResiduos), <Shield size={14} />),
      ]
    ),
    renderSecao(
      'Chefe da Família',
      <User size={18} />,
      [
        renderCampo('Nome completo', familia.chefeFamilia?.nome, <User size={14} />),
        renderCampo('Nome social/Apelido', familia.chefeFamilia?.apelidoNomeSocial, <User size={14} />),
        renderCampo('CPF', formatarCPF(familia.chefeFamilia?.cpf || ''), <IdCard size={14} />),
        renderCampo('RG', familia.chefeFamilia?.rg, <IdCard size={14} />),
        renderCampo('Data de nascimento', familia.chefeFamilia?.dataNascimento, <Calendar size={14} />),
        renderCampo('Idade', `${familia.chefeFamilia?.idade || 0} anos`, <Calendar size={14} />),
        renderCampo('Telefone', formatarTelefone(familia.chefeFamilia?.telefone || ''), <Phone size={14} />),
        renderCampo('Estado civil', familia.chefeFamilia?.estadoCivil, <User size={14} />),
        renderCampo('NIS/PIS', familia.chefeFamilia?.nisPis, <IdCard size={14} />),
        renderCampo('Identidade de gênero', familia.chefeFamilia?.identidadeGenero, <User size={14} />),
        renderCampo('Cor/Raça', familia.chefeFamilia?.racaCor, <User size={14} />),
        renderCampo('Ocupação', familia.chefeFamilia?.ocupacaoProfissional, <Building2 size={14} />),
        renderCampo('Renda familiar (R$)', familia.chefeFamilia?.rendaFamiliar, <FileText size={14} />),
        renderCampo('Benefícios socioassistenciais', familia.chefeFamilia?.beneficiosSocioassistenciais, <FileText size={14} />),
        renderCampo('Possui deficiência', SimNao(familia.chefeFamilia?.possuiDeficiencia), <Shield size={14} />),
        renderCampo('Qual deficiência', familia.chefeFamilia?.deficienciaQual, <Shield size={14} />),
        renderCampo('Observação/Apoio', familia.chefeFamilia?.observacao, <FileText size={14} />),
      ]
    ),
    familia.conjuge && renderSecao(
      'Cônjuge/Companheiro(a)',
      <Users size={18} />,
      [
        renderCampo('Nome completo', familia.conjuge?.nome, <User size={14} />),
        renderCampo('Nome social/Apelido', familia.conjuge?.apelidoNomeSocial, <User size={14} />),
        renderCampo('CPF', formatarCPF(familia.conjuge?.cpf || ''), <IdCard size={14} />),
        renderCampo('RG', familia.conjuge?.rg, <IdCard size={14} />),
        renderCampo('Data de nascimento', familia.conjuge?.dataNascimento, <Calendar size={14} />),
        renderCampo('Idade', `${familia.conjuge?.idade || 0} anos`, <Calendar size={14} />),
        renderCampo('Telefone', formatarTelefone(familia.conjuge?.telefone || ''), <Phone size={14} />),
        renderCampo('Estado civil', familia.conjuge?.estadoCivil, <User size={14} />),
        renderCampo('NIS/PIS', familia.conjuge?.nisPis, <IdCard size={14} />),
        renderCampo('Identidade de gênero', familia.conjuge?.identidadeGenero, <User size={14} />),
        renderCampo('Cor/Raça', familia.conjuge?.racaCor, <User size={14} />),
        renderCampo('Ocupação', familia.conjuge?.ocupacaoProfissional, <Building2 size={14} />),
        renderCampo('Renda familiar (R$)', familia.conjuge?.rendaFamiliar, <FileText size={14} />),
        renderCampo('Benefícios socioassistenciais', familia.conjuge?.beneficiosSocioassistenciais, <FileText size={14} />),
        renderCampo('Possui deficiência', SimNao(familia.conjuge?.possuiDeficiencia), <Shield size={14} />),
        renderCampo('Qual deficiência', familia.conjuge?.deficienciaQual, <Shield size={14} />),
        renderCampo('Observação', familia.conjuge?.observacao, <FileText size={14} />),
      ]
    ),
    familia.demaisMembros?.length && renderSecao(
      'Demais Membros da Família',
      <Users size={18} />,
      familia.demaisMembros.map((membro, i) => (
        <MembroCard key={i} membro={membro} titulo={`${membro.vinculoSocialParentesco?.charAt(0).toUpperCase() + membro.vinculoSocialParentesco?.slice(1).replace('_', ' ')} ${i + 1}`} />
      ))
    ),
    familia.historicoOcorrencias?.length && renderSecao(
      'Histórico de Ocorrências',
      <AlertTriangle size={18} />,
      familia.historicoOcorrencias.map((ocorr, i) => (
        <div key={i} className="ocorrencia-item">
          <h5>Ocorrência {i + 1}</h5>
          <div className="ocorrencia-campos">
            {renderCampo('Já foi atingido', SimNao(ocorr.jaFoiAtingido))}
            {renderCampo('Tipo de ocorrência', ocorr.tipoOcorrencia)}
            {renderCampo('Ano da ocorrência', ocorr.dataAnoOcorrencia)}
            {renderCampo('Houve danos à edificação', ocorr.houveDanosEdificacao)}
            {renderCampo('Houve perda de bens', ocorr.houvePerdaBens)}
            {renderCampo('Houve perda total/parcial do imóvel', ocorr.houvePerdaTotalParcialImovel)}
            {renderCampo('Observação', ocorr.observacao)}
          </div>
        </div>
      ))
    ),
    familia.interdictioes?.length && renderSecao(
      'Interdições',
      <Shield size={18} />,
      familia.interdictioes.map((int, i) => (
        <div key={i} className="ocorrencia-item">
          <h5>Interdição {i + 1}</h5>
          <div className="ocorrencia-campos">
            {renderCampo('Imóvel já foi interditado', SimNao(int.imovelJaFoiInterditado))}
            {renderCampo('Tipo', int.tipo)}
            {renderCampo('Data da interdição', int.dataInterdicao)}
            {renderCampo('Houve evacuação/desocupação', SimNao(int.houveEvacuacaoDesocupacao))}
            {renderCampo('Houve recomendação de remoção definitiva', SimNao(int.houveRecomendacaoRemocaoDefinitiva))}
            {renderCampo('Observação', int.observacao)}
          </div>
        </div>
      ))
    ),
    familia.desalojamentos?.length && renderSecao(
      'Desalojamentos/Desabrigados',
      <Home size={18} />,
      familia.desalojamentos.map((des, i) => (
        <div key={i} className="ocorrencia-item">
          <h5>Episódio {i + 1}</h5>
          <div className="ocorrencia-campos">
            {renderCampo('Família já ficou desalojada', SimNao(des.familiaJaFicouDesalojada))}
            {renderCampo('Família já ficou desabrigada', SimNao(des.familiaJaFicouDesabrigada))}
            {renderCampo('Período', des.periodo)}
            {renderCampo('Local de acolhimento', des.localAcolhimento)}
            {renderCampo('Retornou ao imóvel', SimNao(des.retornouAoImovel))}
          </div>
        </div>
      ))
    ),
    familia.beneficiosAuxilios?.length && renderSecao(
      'Benefícios e Auxílios Recebidos',
      <FileText size={18} />,
      familia.beneficiosAuxilios.map((ben, i) => (
        <div key={i} className="ocorrencia-item">
          <h5>Benefício {i + 1}</h5>
          <div className="ocorrencia-campos">
            {renderCampo('Já recebeu benefício/auxílio', SimNao(ben.jaRecebeuBeneficioAuxilio))}
            {renderCampo('Tipo de benefício', ben.tipoBeneficio)}
            {renderCampo('Data', ben.data)}
            {renderCampo('Observação', ben.observacao)}
          </div>
        </div>
      ))
    ),
    familia.encaminhamentoHabitacional && renderSecao(
      'Encaminhamento Habitacional',
      <ArrowRight size={18} />,
      [
        renderCampo('Já foi encaminhado', SimNao(familia.encaminhamentoHabitacional.jaFoiEncaminhado)),
        renderCampo('Data', familia.encaminhamentoHabitacional.data),
        renderCampo('Observação', familia.encaminhamentoHabitacional.observacao),
      ]
    ),
    familia.historicoVistorias && renderSecao(
      'Histórico de Vistorias',
      <Clock size={18} />,
      [
        renderCampo('Atendida pela Assistência Social', SimNao(familia.historicoVistorias.jaFoiAtendidaAssistenciaSocial)),
        renderCampo('Última vistoria Assistência Social', familia.historicoVistorias.dataUltimaVistoriaAssistencia),
        renderCampo('Assistente social responsável', familia.historicoVistorias.assistenteSocialResponsavel),
        renderCampo('Vistoria técnica Defesa Civil', SimNao(familia.historicoVistorias.jaFoiRealizadaVistoriaTecnicaDefesaCivil)),
        renderCampo('Última vistoria Defesa Civil', familia.historicoVistorias.dataUltimaVistoriaDefesaCivil),
        renderCampo('Técnico responsável', familia.historicoVistorias.tecnicoResponsavel),
      ]
    ),
    familia.situacaoAtual && renderSecao(
      'Situação Atual',
      <MapPinIcon size={18} />,
      [
        renderCampo('Em acompanhamento Defesa Civil', SimNao(familia.situacaoAtual.emAcompanhamentoDefesaCivil)),
        renderCampo('Observação', familia.situacaoAtual.observacao),
      ]
    ),
    familia.documentosFotograficos && renderSecao(
      'Documentos e Registros Fotográficos',
      <Camera size={18} />,
      [
        renderCampo('Possui documentos', SimNao(familia.documentosFotograficos.possuiDocumentos)),
        familia.documentosFotograficos.listaDocumentos?.length && (
          <div className="campo-item lista-documentos">
            <span className="campo-label">Documentos</span>
            <ul>
              {familia.documentosFotograficos.listaDocumentos.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        ),
        renderCampo('Possui registro fotográfico', SimNao(familia.documentosFotograficos.possuiRegistroFotografico)),
        renderCampo('Descrição das fotos', familia.documentosFotograficos.descricaoFotos),
      ]
    ),
  ].filter(Boolean), [familia]);

  const handleToggle = () => {
    setExpandido(!expandido);
  };

  const handleExportar = (e: React.MouseEvent) => {
    e.stopPropagation();
    aoExportar?.();
  };

  const handleFechar = (e: React.MouseEvent) => {
    e.stopPropagation();
    aoFechar?.();
  };

  return (
    <div className="visualizacao-familia" role="region" aria-label={`Cadastro de ${familia.nomeRepresentante}`}>
      {/* Card colapsado - informações vitais */}
      <button
        className={`card-colapsado ${expandido ? 'expandido' : ''}`}
        onClick={handleToggle}
        aria-expanded={expandido}
        aria-controls="conteudo-expandido"
        type="button"
      >
        <div className="card-cabecalho">
          <div className="info-principal">
            <div className="nome-risco">
              <h3 className="nome-representante">{familia.nomeRepresentante}</h3>
              <span
                className="badge-risco"
                style={{ backgroundColor: riscoCor }}
              >
                {riscoLabel}
              </span>
            </div>
            <div className="info-linha">
              <span className="info-item">
                <IdCard size={14} />
                <span>CPF: {formatarCPF(familia.cpf)}</span>
              </span>
              <span className="info-item">
                <MapPinIcon size={14} />
                <span>Cadastro: {familia.logradouro}, {familia.numero} - {familia.bairro}</span>
              </span>
              <span className="info-item">
                <Phone size={14} />
                <span>{formatarTelefone(familia.telefone)}</span>
              </span>
            </div>
          </div>
          <div className="card-acoes">
            {aoExportar && (
              <button
                className="botao-acao primario"
                onClick={handleExportar}
                aria-label="Exportar para Excel"
              >
                <ArrowRight size={16} />
                <span>Exportar</span>
              </button>
            )}
            {aoFechar && (
              <button
                className="botao-acao fechar"
                onClick={handleFechar}
                aria-label="Fechar visualização"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
        <ChevronDown
          className={`chevron-expandir ${expandido ? 'rotacionado' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Conteúdo expandido - todas as 15 seções */}
      <div
        id="conteudo-expandido"
        className="conteudo-expandido-wrapper"
        style={{ maxHeight: expandido ? alturaConteudo : 0 }}
        aria-hidden={!expandido}
      >
        <div ref={conteudoRef} className="conteudo-expandido">
          {secoesExpandidas}
        </div>
      </div>
    </div>
  );
}