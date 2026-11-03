import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import CadastroPessoa from '../components/CadastroPessoa';
import type { CadastroPessoaDados } from '../components/cadastro/campos';
import { useSessaoFamilias } from '../features/mapa/sessao-contexto';
import { converterCadastroEquipe } from '../features/mapa/lib/cadastro-equipe';
import {
  gerarIdentificador,
  type DadosFamilia,
} from '../features/mapa/lib/familias';
import { DEMONSTRACAO } from '../features/mapa/lib/configuracao';

export default function PaginaCadastroEquipe() {
  const { salvarFamilia } = useSessaoFamilias();
  const [ultimoCadastro, setUltimoCadastro] = useState<string | null>(null);
  const envio = useRef<{
    conteudo: string;
    dados: DadosFamilia;
    chave: string;
  } | null>(null);
  async function registrar(registro: CadastroPessoaDados) {
    const conteudo = JSON.stringify(registro);
    if (envio.current?.conteudo !== conteudo)
      envio.current = {
        conteudo,
        dados: converterCadastroEquipe(registro),
        chave: gerarIdentificador(),
      };
    const cadastro = await salvarFamilia(
      envio.current.dados,
      envio.current.chave,
    );
    setUltimoCadastro(cadastro.id);
  }
  return (
    <div className="pagina-cadastro-equipe">
      <nav className="cad-navegacao" aria-label="Navegação do cadastro">
        <Link to="/">
          <ArrowLeft size={17} />
          Voltar ao mapa
        </Link>
        <span>SGRD · Defesa Civil de Goiana</span>
      </nav>
      {DEMONSTRACAO && (
        <p className="cad-aviso">
          Demonstração com dados fictícios. Os cadastros ficam somente nesta aba
          e são apagados ao atualizar a página.
        </p>
      )}
      {ultimoCadastro && (
        <p className="cad-confirmacao" role="status">
          Família incluída na visualização.{' '}
          <Link to="/" state={{ familiaId: ultimoCadastro }}>
            <MapPin size={16} />
            Ver família no mapa
          </Link>
        </p>
      )}
      <CadastroPessoa aoSalvar={registrar} />
    </div>
  );
}
