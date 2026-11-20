import { useState } from 'react';
import { ShieldCheck, Users, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../pages/auth/AgentAuthPage.css'; // Reuse auth styles for consistency

/**
 * Placeholder page for People Registration (post-login for agents)
 * This will be replaced by the actual implementation from the cadastro-social repository
 */
export default function CadastroPessoas() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');

  const mockFamilies = [
    { id: '1', nome: 'Maria Silva', cpf: '123.456.789-00', membros: 4, risco: 'alto', endereco: 'Rua das Flores, 123 - Centro' },
    { id: '2', nome: 'José Santos', cpf: '987.654.321-00', membros: 3, risco: 'medio', endereco: 'Av. Principal, 456 - Bairro Novo' },
    { id: '3', nome: 'Ana Oliveira', cpf: '456.789.123-00', membros: 5, risco: 'baixo', endereco: 'Travessa da Paz, 789 - Vila Verde' },
  ];

  const getRiskColor = (risco: string) => {
    switch (risco) {
      case 'alto': return 'var(--color-error)';
      case 'medio': return 'var(--color-warning)';
      case 'baixo': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="cadastro-pessoas-page">
      <header className="page-header">
        <button
          className="btn btn-secondary btn-back"
          onClick={() => navigate('/')}
          aria-label="Voltar ao mapa"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Voltar ao Mapa</span>
        </button>
        <div className="header-content">
          <div className="header-icon" aria-hidden="true">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h1>Cadastro Social em Campo</h1>
            <p className="header-subtitle">Gerencie famílias cadastradas na área de risco</p>
          </div>
        </div>
      </header>

      <main className="page-main">
        <div className="tabs" role="tablist" aria-label="Abas do cadastro">
          <button
            role="tab"
            aria-selected={activeTab === 'list'}
            aria-controls="tabpanel-list"
            id="tab-list"
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <span>Famílias Cadastradas</span>
            <span className="tab-count">{mockFamilies.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'new'}
            aria-controls="tabpanel-new"
            id="tab-new"
            className={`tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Nova Família</span>
          </button>
        </div>

        <div role="tabpanel" id="tabpanel-list" aria-labelledby="tab-list" hidden={activeTab !== 'list'}>
          <div className="family-list" data-testid="family-list">
            {mockFamilies.map((family) => (
              <article key={family.id} className="family-card">
                <div className="family-info">
                  <div className="family-name-row">
                    <h3>{family.nome}</h3>
                    <span
                      className="risk-badge"
                      style={{ backgroundColor: `${getRiskColor(family.risco)}20`, color: getRiskColor(family.risco) }}
                    >
                      Risco {family.risco}
                    </span>
                  </div>
                  <p className="family-cpf">CPF: {family.cpf}</p>
                  <p className="family-address">{family.endereco}</p>
                  <div className="family-meta">
                    <span><Users size={14} aria-hidden="true" /> {family.membros} membros</span>
                    <span className="family-actions">
                      <button className="btn btn-sm btn-secondary" aria-label={`Ver detalhes de ${family.nome}`}>Ver</button>
                      <button className="btn btn-sm btn-secondary" aria-label={`Editar ${family.nome}`}>Editar</button>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div role="tabpanel" id="tabpanel-new" aria-labelledby="tab-new" hidden={activeTab !== 'new'}>
          <div className="placeholder-form">
            <div className="placeholder-icon" aria-hidden="true">
              <Plus size={64} strokeWidth={1} color="var(--color-text-muted)" />
            </div>
            <h2>Formulário de Nova Família</h2>
            <p>Em desenvolvimento — esta tela será integrada com o repositório de cadastro social.</p>
            <ul className="placeholder-features">
              <li>Dados do representante (CPF, nome, contato)</li>
              <li>Composição familiar (membros, idades, vínculos)</li>
              <li>Endereço com seleção no mapa</li>
              <li>Classificação de risco e vulnerabilidade</li>
              <li>Fotos e documentos (LGPD)</li>
              <li>Sincronização offline-first</li>
            </ul>
            <div className="placeholder-note">
              <ShieldCheck size={20} aria-hidden="true" />
              <span>Integração futura via API compartilhada</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}