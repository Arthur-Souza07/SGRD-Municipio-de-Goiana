import { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

// Interface com Bairro e Endereço/Rua devidamente separados
interface CadastroFamiliaRisco {
  id: string;
  representante: string;
  cpf: string;
  cidade: string;
  bairro: string;
  endereco: string;
  integrantes: number;
  tipoMoradia: string;
  exposicaoInundacao: string; // Sim / Não
  grauRisco: string;          // Crítico, Atenção
  statusCadastro: string;     // Em campo, Em análise, Concluído
  dataCadastro: string;
}

export default function App() {
  // PALETA OFICIAL DO FIGMA (UI KIT - DEFESA CIVIL DE GOIANA)
  const CORES = {
    primaria: '#0B5ECD',       // Azul Primário
    secundaria: '#3882F6',     // Azul Secundário
    sucesso: '#10B981',        // Verde Sucesso (Botão Excel)
    fundoTela: '#EFF6FF',      // Fundo suave da página
    textoPrincipal: '#0F172A', // Texto principal
    textoSecundario: '#64748B',// Texto de apoio
    borda: '#E2E8F0',          // Cor das bordas
    critico: '#EF4444',        // Vermelho para Risco Crítico
    atencao: '#F59E0B',        // Amarelo para Atenção
  };

  const [bairroSelecionado, setBairroSelecionado] = useState<string>('Todos');

  // Dados de exemplo adaptados para o DRP com bairros e ruas separados
  const [familias] = useState<CadastroFamiliaRisco[]>([
    { id: 'FAM-0101', representante: 'Maria Helena Santos', cpf: '***.456.789-**', cidade: 'Goiana', bairro: 'Centro', endereco: 'Rua das Flores, 42', integrantes: 5, tipoMoradia: 'Alvenaria', exposicaoInundacao: 'Sim', grauRisco: 'Crítico', statusCadastro: 'Em campo', dataCadastro: '05/10/2026' },
    { id: 'FAM-0102', representante: 'José Carlos Silva', cpf: '***.123.890-**', cidade: 'Goiana', bairro: 'Flexeira', endereco: 'Rua São Pedro, 78', integrantes: 3, tipoMoradia: 'Madeira/Taipa', exposicaoInundacao: 'Sim', grauRisco: 'Crítico', statusCadastro: 'Em análise', dataCadastro: '06/10/2026' },
    { id: 'FAM-0103', representante: 'Ana Paula Lemos', cpf: '***.987.654-**', cidade: 'Goiana', bairro: 'Barro Vermelho', endereco: 'Av. Beira Rio, 105', integrantes: 4, tipoMoradia: 'Alvenaria', exposicaoInundacao: 'Não', grauRisco: 'Atenção', statusCadastro: 'Concluído', dataCadastro: '07/10/2026' },
    { id: 'FAM-0104', representante: 'Pedro Souza', cpf: '***.555.444-**', cidade: 'Goiana', bairro: 'Impoeira', endereco: 'Travessa da Paz, 12', integrantes: 2, tipoMoradia: 'Mista', exposicaoInundacao: 'Sim', grauRisco: 'Crítico', statusCadastro: 'Em campo', dataCadastro: '08/10/2026' },
  ]);

  // Lista de Bairros de Goiana
  const bairrosGoiana = [
    'Centro', 'Impoeira', 'Curtume', 'Bom Tempo', 'Bom Jesus', 
    'Cidade Nova', 'Barro Vermelho', 'Substação', 'Sitio dos Bragas', 
    'Portelinha', 'Nova Goiana', 'Multirão', 'Paraíso', 
    'Vila Castelo Branco', 'Flexeira', 'Bela Vista', 'Boa Vista', 
    'Tanquinho', 'Northville', 'Núcleo Industrial', 'Matadouro', 
    'Vista Plena', 'Novo Horizonte', 'Distrito Industrial', 'Portal Goiana'
  ];

  // Filtro por Bairro
  const familiasFiltradas = familias.filter((item) => {
    if (bairroSelecionado === 'Todos') return true;
    return item.bairro === bairroSelecionado;
  });

  // Função de Exportação para Excel [RF07]
  const handleExportarExcel = () => {
    const dadosFormatados = familiasFiltradas.map((item) => ({
      'Cód. Família': item.id,
      'Representante da Família': item.representante,
      'CPF': item.cpf,
      'Município': item.cidade,
      'Bairro': item.bairro,
      'Endereço / Rua': item.endereco,
      'Nº Integrantes': item.integrantes,
      'Tipo de Moradia': item.tipoMoradia,
      'Exposição à Inundação': item.exposicaoInundacao,
      'Grau de Risco': item.grauRisco,
      'Status do Cadastro': item.statusCadastro,
      'Data do Cadastro': item.dataCadastro,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cadastro Social Famílias');

    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const sufixoBairro = bairroSelecionado === 'Todos' ? 'Geral' : bairroSelecionado.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `DefesaCivil_Goiana_CadastroSocial_${sufixoBairro}_${dataAtual}.xlsx`);
  };

  return (
    <div style={{ backgroundColor: CORES.fundoTela, minHeight: '100vh', padding: '30px', fontFamily: 'Inter, sans-serif', color: CORES.textoPrincipal }}>
      
      {/* CABEÇALHO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: CORES.primaria, fontSize: '24px', fontWeight: 'bold' }}>
            Sistema de Monitoramento Social
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: CORES.textoSecundario }}>
            DRP - Cadastro social familiar em campo | Defesa Civil de Goiana
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Seletor dinâmico com Mapeamento de Bairros para evitar erros de sintaxe */}
          <select
            value={bairroSelecionado}
            onChange={(e) => setBairroSelecionado(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${CORES.borda}`,
              backgroundColor: '#FFFFFF',
              color: CORES.textoPrincipal,
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Todos">Todos os Bairros</option>
            {bairrosGoiana.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro}
              </option>
            ))}
          </select>

          {/* Botão de Exportação Excel */}
          <button
            onClick={handleExportarExcel}
            style={{
              backgroundColor: CORES.sucesso,
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            📊 Exportar Relatório Famílias (.xlsx)
          </button>
        </div>
      </header>

      {/* TABELA COM COLUNA DE BAIRRO E ENDEREÇO SEPARADAS */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: `1px solid ${CORES.borda}`, overflow: 'hidden', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: `2px solid ${CORES.borda}` }}>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Cód. Família</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Representante</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Bairro</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Endereço / Rua</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Integrantes</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Inundação?</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Grau de Risco</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Status</th>
              <th style={{ padding: '14px 16px', color: CORES.textoSecundario, fontWeight: '600' }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {familiasFiltradas.map((item) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${CORES.borda}` }}>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: CORES.primaria }}>{item.id}</td>
                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.representante}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{item.bairro}</td>
                <td style={{ padding: '14px 16px' }}>{item.endereco}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>{item.integrantes}</td>
                <td style={{ padding: '14px 16px' }}>{item.exposicaoInundacao}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: item.grauRisco === 'Crítico' ? '#FEE2E2' : '#FEF3C7',
                    color: item.grauRisco === 'Crítico' ? CORES.critico : CORES.atencao,
                  }}>
                    {item.grauRisco}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>{item.statusCadastro}</td>
                <td style={{ padding: '14px 16px', color: CORES.textoSecundario }}>{item.dataCadastro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
