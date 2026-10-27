function Campos({ campos, dados, alterar }: { campos: Campo[]; dados: Registro; alterar: (id: string, valor: string) => void }) {
  return <div className="cad-grid">{campos.map(c => <label className="cad-field" key={c.id}><span>{c.titulo}{(c.id === 'nome' || c.id === 'cpf') && ' *'}</span>{c.tipo === 'textarea' ? <textarea value={dados[c.id] ?? ''} onChange={e => alterar(c.id,e.target.value)} rows={3}/> : c.tipo === 'select' ? <select value={dados[c.id] ?? ''} onChange={e => alterar(c.id,e.target.value)}><option value="">Selecione</option>{c.opcoes?.map(o => <option key={o}>{o}</option>)}</select> : <input type={c.tipo || 'text'} value={dados[c.id] ?? ''} onChange={e => alterar(c.id,e.target.value)} required={c.id === 'nome' || c.id === 'cpf'} />}</label>)}</div>;
}
export default function CadastroPessoa() {
  const [dados,setDados] = useState<Registro>({ municipio:'Goiana / PE', dataCadastro: new Date().toLocaleDateString('en-CA') });
  const [familia,setFamilia] = useState<Registro[]>([]);
  const [ocorrencias,setOcorrencias] = useState<Registro[]>([]);
  const [gps,setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsMensagem,setGpsMensagem] = useState('Aguardando autorização para localização.');
  const [gpsCarregando,setGpsCarregando] = useState(false);
  const [enviando,setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const [mensagem,setMensagem] = useState('');
  const [arquivos,setArquivos] = useState<File[]>([]);
  const alterar = (id: string, valor: string) => setDados(prev => ({...prev,[id]:valor}));
  const atualizarLista = (tipo: 'familia'|'ocorrencias', indice: number, id: string, valor: string) => {
    const setter = tipo === 'familia' ? setFamilia : setOcorrencias;
    setter(prev => prev.map((item,i) => i === indice ? {...item,[id]:valor} : item));
  };
  const capturarGPS = () => {
    if (!navigator.geolocation) { setGpsMensagem('Seu navegador não oferece geolocalização.'); return; }
    setGpsCarregando(true);
    setGps(null);
    setGpsMensagem('Capturando coordenadas...');
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({latitude:pos.coords.latitude,longitude:pos.coords.longitude}); setGpsMensagem('Localização capturada com sucesso.'); setGpsCarregando(false); },
      erro => { setGpsMensagem(erro.code === 1 ? 'Permissão negada. Habilite a localização e tente novamente.' : 'Não foi possível obter a localização. Tente novamente.'); setGpsCarregando(false); },
      {enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  };
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setMensagem('');
    if (!cpfValido(dados.cpf ?? '')) { setMensagem('CPF do responsável inválido.'); return; }
    const cpfMembroInvalido = familia.some(p => p.cpf?.trim() && !cpfValido(p.cpf));
    if (cpfMembroInvalido) { setMensagem('Confira o CPF dos demais membros da família.'); return; }
    if (!gps) { setMensagem('É obrigatório capturar o GPS antes de enviar.'); return; }
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const cadastro = { ...dados, ...gps, familia, ocorrencias, anexos:arquivos.map(a => ({nome:a.name,tamanho:a.size})) };
      // Integração futura: substituir a simulação pela API do grupo, com autenticação e HTTPS.
      // Não registrar CPFs e dados pessoais no console em produção.
      void cadastro;
      await new Promise(resolve => setTimeout(resolve,1000));
      setMensagem('Validação concluída. Envio simulado: nenhum dado foi salvo no servidor.');
    } catch { setMensagem('Erro ao enviar o cadastro.'); }
    finally { enviandoRef.current = false; setEnviando(false); }
  }
  const selecionarArquivos = (e: ChangeEvent<HTMLInputElement>) => setArquivos(Array.from(e.target.files ?? []));
  return <main className="cad-page"><header className="cad-header"><span className="cad-emblema">✚</span><div><small>DEFESA CIVIL · GOIANA/PE</small><h1>Cadastro social familiar</h1><p>Ficha cadastral da família e caracterização do imóvel em área de risco</p></div></header>
    <form onSubmit={enviar}>
      {secoes.map((secao,indice) => <div key={secao.titulo}>
        <section className="cad-card"><h2><span>{String(indice+1).padStart(2,'0')}</span> {secao.titulo}</h2><Campos campos={secao.campos} dados={dados} alterar={alterar}/>
          {indice === 0 && <div className="cad-gps"><h3>Coordenadas GPS</h3><p>É necessário autorizar a localização para concluir o cadastro.</p><button type="button" className="cad-outline" onClick={capturarGPS} disabled={gpsCarregando}>{gpsCarregando ? 'Obtendo GPS...' : '⌖ Capturar GPS'}</button><p role="status">{gpsMensagem}</p><div className="cad-coords"><div>Latitude: <strong>{gps?.latitude ?? '—'}</strong></div><div>Longitude: <strong>{gps?.longitude ?? '—'}</strong></div></div></div>}
        </section>
        {indice === 3 && <section className="cad-card"><h2>Rede familiar ou de apoio — cônjuge e demais membros</h2><p>Adicione um registro para cada pessoa da composição familiar.</p>{familia.map((p,i) => <div className="cad-repeat" key={i}><div className="cad-repeat-head"><h3>Membro {i+1}</h3><button type="button" className="cad-danger" onClick={() => setFamilia(v => v.filter((_,j) => j !== i))}>Remover</button></div><Campos campos={pessoaCampos} dados={p} alterar={(id,valor) => atualizarLista('familia',i,id,valor)}/></div>)}<button type="button" className="cad-outline" onClick={() => setFamilia(v => [...v,{}])}>+ Adicionar membro</button></section>}
        {indice === 4 && <section className="cad-card"><h2>Histórico de ocorrências</h2>{ocorrencias.map((o,i) => <div className="cad-repeat" key={i}><div className="cad-repeat-head"><h3>Ocorrência {i+1}</h3><button type="button" className="cad-danger" onClick={() => setOcorrencias(v => v.filter((_,j) => j !== i))}>Remover</button></div><Campos campos={ocorrenciaCampos} dados={o} alterar={(id,valor) => atualizarLista('ocorrencias',i,id,valor)}/></div>)}<button type="button" className="cad-outline" onClick={() => setOcorrencias(v => [...v,{}])}>+ Adicionar ocorrência</button></section>}
      </div>)}
      <section className="cad-card"><h2>Documentos e registro fotográfico</h2><label className="cad-field"><span>Fotos e documentos</span><input type="file" accept="image/*,.pdf" multiple onChange={selecionarArquivos}/></label><p>Arquivos selecionados: {arquivos.length}. O envio de anexos dependerá da API do projeto.</p></section>
      <div className="cad-actions"><p>Confira o CPF e capture o GPS antes de finalizar.</p><button className="cad-primary" type="submit" disabled={enviando}>{enviando ? <><span className="cad-spinner"/> Enviando...</> : 'Enviar cadastro'}</button></div>
      {mensagem && <p className="cad-feedback" role="status">{mensagem}</p>}
    </form><footer className="cad-footer">Protótipo acadêmico. Não utilize dados pessoais reais até a implementação do backend e das medidas de segurança.</footer></main>;
}
