"""Gera 50 famílias fictícias em áreas urbanas suscetíveis de Goiana.
Uso: python scripts/gerar-familias-demonstracao.py /caminho/base_cartografica.gpkg
Manutenção apenas: requer shapely e pyproj. Não participa do build do site.
Não usa dados de moradores nem consulta APIs durante a execução.
"""
import datetime
import collections
import hashlib
import json
import math
import random
import sqlite3
import sys
from pathlib import Path
from pyproj import Transformer
from shapely import from_wkb, transform as reprojetar
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union
from shapely.strtree import STRtree

RAIZ = Path(__file__).resolve().parents[1]
BASE = Path(sys.argv[1])
SEMENTE = 20261030
rng = random.Random(SEMENTE)
para_metros = Transformer.from_crs(4674, 31985, always_xy=True).transform
para_geo = Transformer.from_crs(31985, 4326, always_xy=True).transform
def projetar(geometria, transformacao):
    return reprojetar(geometria, transformacao, interleaved=False)
def ler_geometria(blob):
    assert blob[:2] == b'GP'
    envelope = (blob[3] >> 1) & 7
    return projetar(from_wkb(blob[8 + {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[envelope]:]), para_metros)
def salvar(nome, objeto):
    (RAIZ / 'public' / nome).write_text(json.dumps(objeto, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

conexao = sqlite3.connect(f'file:{BASE}?mode=ro', uri=True)
conexao.row_factory = sqlite3.Row
assert conexao.execute('SELECT geocodigo FROM LOC_Cidade_P').fetchone()[0] == '2606200'
limite_fonte = json.loads((RAIZ / 'src/features/mapa/data/limite-goiana.json').read_text())
assert limite_fonte['properties']['codigoIbge'] == '2606200'
limite = projetar(shape(limite_fonte['geometry']), para_metros)
# Esta demonstração concentra-se na sede, sem distribuir famílias pelo litoral.
sede = ler_geometria(conexao.execute('SELECT geom FROM LOC_Cidade_P').fetchone()[0])
urbanos = [(r['fid'], ler_geometria(r['geom'])) for r in conexao.execute('SELECT fid, geom FROM Area_Edificada_A') if r['fid'] == 1]
localidades = [(r['identificador'], ler_geometria(r['geom'])) for r in conexao.execute('SELECT identificador,geom FROM LOC_Localidades_P')]
localidades += [('Goiana', ler_geometria(r[0])) for r in conexao.execute('SELECT geom FROM LOC_Cidade_P')]
referencias = {fid: min(localidades, key=lambda lugar: lugar[1].distance(g.representative_point()))[0] for fid, g in urbanos}
rios = unary_union([ler_geometria(r['geom']).buffer(70 if r['waterway'] == 'river' else 18) for r in conexao.execute('SELECT geom,waterway FROM HID_Trecho_Drenagem_L')])
ruas = [(r['fid'], r['name'], ler_geometria(r['geom'])) for r in conexao.execute("SELECT fid,name,geom FROM TRA_Trecho_Rodoviario_L WHERE highway IN ('residential','living_street','unclassified')")]
pistas = unary_union([ler_geometria(r[0]).buffer(5) for r in conexao.execute('SELECT geom FROM TRA_Trecho_Rodoviario_L')])
geologia = json.loads((RAIZ / 'public/camadas/geologia-goiana.geojson').read_text())['features']
mangue_praia = unary_union([projetar(shape(f['geometry']), para_metros) for f in geologia if f['properties']['descricao'].startswith(('Mangue recente', 'Praia:'))])
permitido = unary_union([g for _, g in urbanos]).intersection(limite).intersection(sede.buffer(3500)).difference(rios).difference(pistas).difference(mangue_praia)
originais = json.loads((RAIZ / 'public/camadas/suscetibilidade-goiana.geojson').read_text())['features']
zonas = [(f['properties'], projetar(shape(f['geometry']), para_metros)) for f in originais if f['properties']['descricao'] in ['Alta', 'Média']]
arvore = STRtree([g for _, g in zonas])
candidatos = []
for rua_id, rua_nome, geometria in ruas:
    for linha in getattr(geometria, 'geoms', [geometria]):
        if linha.geom_type != 'LineString' or linha.length < 15:
            continue
        for passo in range(8, int(linha.length) - 5, 6):
            centro = linha.interpolate(passo)
            antes, depois = linha.interpolate(max(0, passo - 1)), linha.interpolate(min(linha.length, passo + 1))
            dx, dy = depois.x - antes.x, depois.y - antes.y
            norma = math.hypot(dx, dy)
            if not norma:
                continue
            for lado in [-1, 1]:
                afastamento = rng.uniform(9, 35)
                posicao = Point(centro.x - lado * dy / norma * afastamento, centro.y + lado * dx / norma * afastamento)
                if not permitido.contains(posicao):
                    continue
                geog = projetar(posicao, para_geo)
                longitude, latitude = round(geog.x, 6), round(geog.y, 6)
                posicao = projetar(Point(longitude, latitude), para_metros)
                if not permitido.contains(posicao):
                    continue
                correspondencias = [zonas[int(i)] for i in arvore.query(posicao) if zonas[int(i)][1].contains(posicao)]
                if not correspondencias:
                    continue
                correspondencias.sort(key=lambda a: (a[0]['descricao'] != 'Alta', a[0]['camada'] != 'inundacao'))
                area = correspondencias[0][0]
                nucleo = next(fid for fid, g in urbanos if g.contains(posicao))
                candidatos.append({'latitude': latitude, 'longitude': longitude, 'xy': [posicao.x, posicao.y], 'nucleo': nucleo, 'area': area, 'rua': rua_nome, 'ruaId': rua_id})

# Distribuição somente na sede, com prioridade para manchas altas e separação mínima de 9 m.
rng.shuffle(candidatos)
candidatos.sort(key=lambda c: c['area']['descricao'] != 'Alta')
selecionados = []
grade = collections.defaultdict(list)
def adicionar(candidato):
    x, y = candidato['xy']
    cx, cy = math.floor(x / 9), math.floor(y / 9)
    for i in range(cx - 1, cx + 2):
        for j in range(cy - 1, cy + 2):
            if any(math.hypot(x - a, y - b) < 9 for a, b in grade[(i, j)]):
                return False
    grade[(cx, cy)].append((x, y))
    selecionados.append(candidato)
    return True
print('Candidatos na sede:', dict(collections.Counter(c['area']['camada'] for c in candidatos)))
for camada, alvo in [('movimento', 5), ('inundacao', 45)]:
    contagem = 0
    for candidato in candidatos:
        if candidato['area']['camada'] == camada and adicionar(candidato):
            contagem += 1
            if contagem == alvo:
                break
if len(selecionados) < 50:
    for candidato in candidatos:
        if adicionar(candidato) and len(selecionados) == 50:
            break
assert len(selecionados) == 50, 'A base urbana não comportou o total solicitado com os critérios espaciais.'

NOMES_INICIAIS = ['Ana Clara Santos', 'José Carlos Almeida', 'Maria Lúcia Ferreira', 'Paulo Henrique Lima', 'Juliana Beatriz Costa', 'Antônio Marcos Silva', 'Cláudia Regina Souza', 'Ricardo Luís Oliveira', 'Helena Duarte Pereira', 'João Pedro Barbosa', 'Camila Azevedo Rocha', 'Francisco André Gomes', 'Patrícia Nunes Martins', 'Marcos Vinícius Araújo', 'Luciana Mendes Ribeiro', 'Carlos Eduardo Batista', 'Beatriz Melo Andrade', 'Raimundo César Dias', 'Eliane Cristina Teixeira', 'Rafael Augusto Moreira', 'Fernanda Lira Carvalho', 'Pedro Lucas Freitas', 'Márcia Gabriela Monteiro', 'Daniel Vieira Lopes', 'Sônia Raquel Campos', 'Luís Fernando Cavalcanti', 'Renata Alves Cardoso', 'Bruno Matias Correia', 'Sandra Cristina Mendes', 'Eduardo Miguel Ramos', 'Adriana Paiva Fonseca', 'Felipe Augusto Torres', 'Cristiane Leal Santana', 'Gustavo César Moura', 'Simone Pereira Barros', 'Roberto Sérgio Xavier', 'Aline Duarte Farias', 'André Luiz Cunha', 'Rosana Bezerra Melo', 'Tiago Daniel Neves', 'Vanessa Pinheiro Brito', 'Leandro José Dantas', 'Débora Cristina Maciel', 'Diego Rafael Pires', 'Lúcia Helena Nascimento', 'Marcelo Antônio Queiroz', 'Cecília Maria Tavares', 'Vinícius Rodrigues Reis', 'Isabel Cristina Soares', 'Alexandre Neto Miranda']
primeiros = ['Alice', 'Amanda', 'André', 'Beatriz', 'Bruno', 'Camila', 'Carolina', 'Daniel', 'Débora', 'Diego', 'Eduardo', 'Elaine', 'Elisa', 'Felipe', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Isabela', 'Joana', 'Júlia', 'Larissa', 'Leonardo', 'Letícia', 'Lucas', 'Luísa', 'Marcelo', 'Mariana', 'Natália', 'Paulo', 'Pedro', 'Rafael', 'Renata', 'Roberto', 'Sara', 'Simone', 'Sofia', 'Thiago', 'Valéria', 'Vinícius']
sobrenomes = ['Almeida', 'Andrade', 'Araújo', 'Barbosa', 'Batista', 'Cavalcanti', 'Costa', 'Dias', 'Duarte', 'Ferreira', 'Freitas', 'Gomes', 'Lima', 'Lopes', 'Macedo', 'Martins', 'Melo', 'Mendes', 'Monteiro', 'Moraes', 'Nascimento', 'Nunes', 'Oliveira', 'Pereira', 'Ramos', 'Ribeiro', 'Rocha', 'Santana', 'Santos', 'Silva', 'Soares', 'Souza', 'Teixeira', 'Vieira']
nomes = list(NOMES_INICIAIS)
while len(nomes) < 50:
    nome = f'{rng.choice(primeiros)} {rng.choice(sobrenomes)} {rng.choice(sobrenomes)}'
    if nome not in nomes:
        nomes.append(nome)
# A avaliação da família é inteiramente simulada e não é calculada pela classe SGB.
niveis = ['alto'] * 30 + ['medio'] * 15 + ['baixo'] * 5
rng.shuffle(niveis)

# Opções para preenchimento rico do template
USOS_IMOVEL = ['Residencial', 'Comercial', 'Misto', 'Institucional']
CONDICOES_OCUPACAO = ['proprio', 'alugado', 'cedido', 'invasao', 'outro']
TIPOS_CONSTRUCAO = ['alvenaria', 'madeira', 'mista', 'taipa', 'container', 'outro']
PADROES_ACABAMENTO = ['alto', 'medio', 'baixo', 'sem_acabamento']
TIPOS_COBERTA = ['laje', 'telha_ceramica', 'telha_metalica', 'telha_fibrocimento', 'palha', 'outro']
SANEAMENTO = ['rede_coletora', 'fossa_setica', 'fossa_rudimentar', 'valao', 'inexistente']
ABASTECIMENTO = ['rede_publica', 'poco_artesiano', 'cisterna', 'carro_pipa', 'outro']
AGUAS_PLUVIAIS = ['rede_coletora', 'valao', 'superficial', 'inexistente']
PAVIMENTACAO = ['asfalto', 'paralelepipedo', 'bloquete', 'terra', 'outro']
ESTADOS_CIVIS = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro']
IDENTIDADES_GENERO = ['masculino', 'feminino', 'transgenero', 'nao_binario', 'outro', 'prefiro_nao_dizer']
RACAS_COR = ['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada']
OCUPACOES = ['Aposentado', 'Autônomo', 'Comerciante', 'Costureira', 'Doméstica', 'Motorista', 'Pedreiro', 'Professor', 'Serviços Gerais', 'Vendedor', 'Desempregado', 'Estudante', 'Agricultor', 'Pescador', 'Outro']
BENEFICIOS_LISTA = ['Bolsa Família', 'BPC/LOAS', 'Auxílio Brasil', 'FGTS Calamidade', 'Seguro Desemprego', 'Aposentadoria', 'Pensão por Morte', 'Auxílio Doença', 'Nenhum']
PARENTESCOS = ['conjuge', 'filho', 'pai_mae', 'avo', 'neto', 'irmao', 'outro']
TIPOS_OCORRENCIA = ['inundacao', 'alagamento', 'deslizamento', 'erosao', 'outro']
TIPOS_INTERDICAO = ['total', 'parcial', 'preventiva', 'outro']
TIPOS_BENEFICIO = ['Bolsa Família', 'BPC/LOAS', 'Auxílio Brasil', 'FGTS Calamidade', 'Seguro Desemprego', 'Aposentadoria', 'Pensão por Morte', 'Auxílio Doença']

def nascimento(idade):
    return datetime.date(2026 - idade, rng.randint(1, 10), rng.randint(1, 28)).isoformat()

def telefone_aleatorio():
    return f'(81) 9{rng.randint(9000, 9999)}-{rng.randint(1000, 9999):04d}'

def cpf_aleatorio():
    # Gera CPF fictício mas formatado
    return f'{rng.randint(100,999)}.{rng.randint(100,999)}.{rng.randint(100,999)}-{rng.randint(10,99):02d}'

def rg_aleatorio():
    return f'{rng.randint(1000000,9999999)}'

def nis_aleatorio():
    return f'{rng.randint(10000000000,99999999999):011d}'

def endereco_aleatorio(rua):
    num = rng.randint(1, 999)
    complementos = ['', 'Casa', 'Apto 101', 'Apto 202', 'Fundos', 'Sobreloja', 'Bloco A', 'Bloco B']
    return f'{rua}, {num}' if rua else 'Via residencial sem nome', rng.choice(complementos)

def gerar_pessoa_completa(nome, idade, parentesco, sobrenome_familia, is_representante=False):
    pessoa = {
        'nome': nome,
        'apelidoNomeSocial': rng.choice(['', '', '', rng.choice(primeiros)]) if rng.random() < 0.1 else '',
        'telefone': telefone_aleatorio() if rng.random() < 0.7 else '',
        'cpf': cpf_aleatorio() if rng.random() < 0.9 else '',
        'rg': rg_aleatorio() if rng.random() < 0.8 else '',
        'dataNascimento': nascimento(idade),
        'idade': idade,
        'estadoCivil': rng.choice(ESTADOS_CIVIS) if idade >= 16 else 'solteiro',
        'nisPis': nis_aleatorio() if rng.random() < 0.3 else '',
        'identidadeGenero': rng.choice(IDENTIDADES_GENERO),
        'racaCor': rng.choice(RACAS_COR),
        'ocupacaoProfissional': rng.choice(OCUPACOES) if idade >= 16 and not is_representante else ('Aposentado' if idade >= 65 else rng.choice(OCUPACOES)),
        'rendaFamiliar': f'{rng.randint(0, 5) * 500 + rng.randint(0, 499):.2f}'.replace('.', ',') if rng.random() < 0.6 else '',
        'beneficiosSocioassistenciais': ', '.join(rng.sample(BENEFICIOS_LISTA, rng.randint(0, 2))) if rng.random() < 0.4 else '',
        'possuiDeficiencia': rng.choice(['sim', 'nao', 'nao_informado']) if rng.random() < 0.15 else 'nao',
        'deficienciaQual': '',
        'observacao': '',
    }
    # Adicionar deficiência se sim
    if pessoa['possuiDeficiencia'] == 'sim':
        deficiencias = ['Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla', 'Transtorno do Espectro Autista']
        pessoa['deficienciaQual'] = rng.choice(deficiencias)
        pessoa['observacao'] = f'{pessoa["deficienciaQual"]}; necessita acompanhamento'
    elif idade >= 70:
        pessoa['observacao'] = 'Mobilidade reduzida; necessita acompanhamento'
    elif idade < 12:
        pessoa['observacao'] = 'Acompanhamento de responsável'

    if parentesco != 'representante':
        pessoa['vinculoSocialParentesco'] = parentesco
        pessoa['cor'] = rng.choice(RACAS_COR)

    return pessoa

def gerar_historico_ocorrencias(area_camada, idade_rep):
    historico = []
    num_ocorrencias = rng.randint(0, 2)
    for _ in range(num_ocorrencias):
        ano = rng.randint(2015, 2025)
        historico.append({
            'jaFoiAtingido': 'sim',
            'tipoOcorrencia': area_camada == 'inundacao' and rng.choice(['inundacao', 'alagamento']) or rng.choice(['deslizamento', 'erosao']),
            'dataAnoOcorrencia': str(ano),
            'houveDanosEdificacao': rng.choice(['sim', 'nao', 'parcial', 'nao_informado']),
            'houvePerdaBens': rng.choice(['sim', 'nao', 'nao_informado']),
            'houvePerdaTotalParcialImovel': rng.choice(['sim', 'nao', 'parcial', 'total', 'nao_informado']),
            'observacao': rng.choice(['', 'Perda de móveis e eletrodomésticos', 'Danos na estrutura da casa', 'Enchente rápida', 'Deslizamento de terra no quintal'])
        })
    return historico

def gerar_interdictioes():
    interdictioes = []
    if rng.random() < 0.1:
        interdictioes.append({
            'imovelJaFoiInterditado': 'sim',
            'tipo': rng.choice(TIPOS_INTERDICAO),
            'dataInterdicao': nascimento(rng.randint(0, 10)),
            'houveEvacuacaoDesocupacao': rng.choice(['sim', 'nao', 'nao_informado']),
            'houveRecomendacaoRemocaoDefinitiva': rng.choice(['sim', 'nao', 'nao_informado']),
            'observacao': rng.choice(['', 'Interdição preventiva', 'Risco de novo deslizamento', 'Estrutura comprometida'])
        })
    return interdictioes

def gerar_desalojamentos():
    desalojamentos = []
    if rng.random() < 0.15:
        desalojamentos.append({
            'familiaJaFicouDesalojada': 'sim',
            'familiaJaFicouDesabrigada': rng.choice(['sim', 'nao']),
            'periodo': f'{rng.randint(1, 30)} dias',
            'localAcolhimento': rng.choice(['Escola municipal', 'Ginásio esportivo', 'Casa de parentes', 'Abrigo público', 'Hotel social']),
            'retornouAoImovel': rng.choice(['sim', 'nao', 'nao_informado'])
        })
    return desalojamentos

def gerar_beneficios():
    beneficios = []
    if rng.random() < 0.4:
        beneficios.append({
            'jaRecebeuBeneficioAuxilio': 'sim',
            'tipoBeneficio': rng.choice(TIPOS_BENEFICIO),
            'data': nascimento(rng.randint(0, 5)),
            'observacao': rng.choice(['', 'Pagamento único', 'Parcelas mensais', 'Saque calamidade'])
        })
    return beneficios

def gerar_encaminhamento():
    if rng.random() < 0.1:
        return {
            'jaFoiEncaminhado': 'sim',
            'data': nascimento(rng.randint(0, 3)),
            'observacao': rng.choice(['', 'Encaminhado para programa habitacional', 'Aguardando vaga', 'Documentação em análise'])
        }
    return None

def gerar_vistorias():
    vistorias = {}
    if rng.random() < 0.3:
        vistorias['jaFoiAtendidaAssistenciaSocial'] = 'sim'
        vistorias['dataUltimaVistoriaAssistencia'] = nascimento(rng.randint(0, 2))
        vistorias['assistenteSocialResponsavel'] = f'{rng.choice(primeiros)} {rng.choice(sobrenomes)}'
    else:
        vistorias['jaFoiAtendidaAssistenciaSocial'] = rng.choice(['nao', 'nao_informado'])

    if rng.random() < 0.25:
        vistorias['jaFoiRealizadaVistoriaTecnicaDefesaCivil'] = 'sim'
        vistorias['dataUltimaVistoriaDefesaCivil'] = nascimento(rng.randint(0, 2))
        vistorias['tecnicoResponsavel'] = f'{rng.choice(primeiros)} {rng.choice(sobrenomes)}'
    else:
        vistorias['jaFoiRealizadaVistoriaTecnicaDefesaCivil'] = rng.choice(['nao', 'nao_informado'])
    return vistorias

def gerar_situacao_atual():
    if rng.random() < 0.3:
        return {
            'emAcompanhamentoDefesaCivil': 'sim',
            'observacao': rng.choice(['Família em monitoramento', 'Aguardando reassentamento', 'Recebendo assistência técnica'])
        }
    return {
        'emAcompanhamentoDefesaCivil': rng.choice(['nao', 'nao_informado']),
        'observacao': ''
    }

def gerar_documentos():
    if rng.random() < 0.7:
        return {
            'possuiDocumentos': rng.choice(['sim', 'parcial']),
            'listaDocumentos': rng.sample(['RG', 'CPF', 'Comprovante de residência', 'Certidão de nascimento', 'Certidão de casamento', 'Carteira de trabalho', 'Cartão SUS', 'Título de eleitor'], rng.randint(2, 5)),
            'possuiRegistroFotografico': rng.choice(['sim', 'nao']),
            'descricaoFotos': rng.choice(['Fachada da residência', 'Interior da residência', 'Área de risco próxima', 'Danos anteriores', 'Documentos da família'])
        }
    return {
        'possuiDocumentos': 'nao',
        'listaDocumentos': [],
        'possuiRegistroFotografico': 'nao',
        'descricaoFotos': ''
    }

pontos = []
for indice, candidato in enumerate(selecionados):
    area = candidato['area']
    moradores = rng.choices([1, 2, 3, 4, 5, 6, 7], [10, 20, 22, 25, 15, 7, 1])[0]
    idade_representante = rng.randint(24, 76)

    # Gerar integrantes básicos para resumoDemonstrativo
    integrantes = [{'id': f'SIM-{indice + 1:04d}-01', 'nomeCompleto': nomes[indice], 'parentesco': 'representante', 'dataNascimento': nascimento(idade_representante), 'cpf': '00000000000', 'apoio': 'Acompanhamento para evacuação' if idade_representante >= 65 else ''}]
    sobrenome_familia = nomes[indice].split()[-1]

    for pessoa in range(1, moradores):
        parentesco = 'conjuge' if pessoa == 1 and rng.random() < .55 else 'filho' if pessoa < 4 else rng.choice(PARENTESCOS[2:])
        idade = max(18, min(85, idade_representante + rng.randint(-5, 5))) if parentesco == 'conjuge' else rng.randint(0, min(28, idade_representante - 17)) if parentesco == 'filho' else rng.randint(18, 86)
        integrantes.append({'id': f'SIM-{indice + 1:04d}-{pessoa + 1:02d}', 'nomeCompleto': f'{rng.choice(primeiros)} {rng.choice([s for s in sobrenomes if s != sobrenome_familia])} {sobrenome_familia}', 'parentesco': parentesco, 'dataNascimento': nascimento(idade), 'cpf': '00000000000', 'apoio': 'Mobilidade reduzida; necessita acompanhamento' if idade >= 70 else 'Acompanhamento de responsável' if idade < 12 else ''})

    # Gerar dados completos do template
    endereco_completo, complemento = endereco_aleatorio(candidato['rua'])
    endereco_parts = endereco_completo.split(', ')
    logradouro = endereco_parts[0] if len(endereco_parts) > 0 else (candidato['rua'] if candidato['rua'] else 'Via sem nome')
    numero = endereco_parts[1] if len(endereco_parts) > 1 else str(rng.randint(1, 999))

    # Chefe da família (representante)
    chefe = gerar_pessoa_completa(nomes[indice], idade_representante, 'representante', sobrenome_familia, is_representante=True)

    # Cônjuge (se houver)
    conjuge = None
    conjuge_integrante = next((i for i in integrantes if i['parentesco'] == 'conjuge'), None)
    if conjuge_integrante:
        idade_conjuge = int(conjuge_integrante['dataNascimento'][:4])
        idade_conjuge = 2026 - idade_conjuge
        conjuge = gerar_pessoa_completa(conjuge_integrante['nomeCompleto'], idade_conjuge, 'conjuge', sobrenome_familia)

    # Demais membros
    demais_membros = []
    for integrante in integrantes:
        if integrante['parentesco'] not in ['representante', 'conjuge']:
            idade_membro = 2026 - int(integrante['dataNascimento'][:4])
            membro = gerar_pessoa_completa(integrante['nomeCompleto'], idade_membro, integrante['parentesco'], sobrenome_familia)
            demais_membros.append(membro)

    # Dados completos
    dados_completos = {
        # Identificação básica
        'nomeRepresentante': nomes[indice],
        'cpf': chefe['cpf'].replace('.', '').replace('-', ''),
        'telefone': chefe['telefone'].replace('(', '').replace(')', '').replace('-', '').replace(' ', ''),
        'logradouro': logradouro,
        'numero': numero,
        'bairro': candidato['nucleo'].split('·')[0].strip() if '·' in candidato['nucleo'] else 'Centro',
        'complemento': complemento,
        'moradores': moradores,
        'nivelRisco': niveis[indice],
        'tipoOcorrencia': area['camada'] == 'inundacao' and 'inundacao' or 'deslizamento',
        'observacoes': rng.choice(['', 'Família em área de risco', 'Necessita acompanhamento contínuo', 'Prioridade para reassentamento']),
        'localizacao': {
            'latitude': candidato['latitude'],
            'longitude': candidato['longitude'],
            'origem': 'mapa',
            'precisaoMetros': rng.randint(5, 20)
        },
        'nascimentoRepresentante': chefe['dataNascimento'],
        'apoioRepresentante': chefe['observacao'],
        'familiares': [],  # Será preenchido via demaisMembros

        # Template Excel completo
        'informacaoImovel': {
            'municipio': 'Goiana',
            'dataCadastro': datetime.date.today().strftime('%d/%m/%Y'),
            'dataUltimaAtualizacao': datetime.date.today().strftime('%d/%m/%Y'),
            'comunidade': candidato['nucleo'],
            'endereco': logradouro,
            'numero': numero,
            'complemento': complemento,
            'bairro': candidato['nucleo'].split('·')[0].strip() if '·' in candidato['nucleo'] else 'Centro',
            'distrito': 'Sede',
            'longitude': str(candidato['longitude']),
            'latitude': str(candidato['latitude']),
            'tipoRisco': area['camada'] == 'inundacao' and 'Inundação' or 'Movimento de massa',
            'grauRisco': {'alto': 'Alto', 'medio': 'Médio', 'baixo': 'Baixo'}[niveis[indice]]
        },
        'caracterizacaoImovel': {
            'usoImovel': rng.choice(USOS_IMOVEL),
            'condicoesOcupacao': rng.choice(CONDICOES_OCUPACAO),
            'imovelVerticalizado': rng.choice(['sim', 'nao']),
            'numeroPavimentos': str(rng.randint(1, 3)) if rng.random() < 0.3 else '',
            'pavimentosOcupa': str(rng.randint(1, 3)) if rng.random() < 0.3 else '',
            'areaTerreno': f'{rng.randint(60, 300)}',
            'areaConstrucao': f'{rng.randint(40, 200)}',
            'valorAluguel': f'{rng.randint(300, 1500):.2f}'.replace('.', ',') if rng.random() < 0.2 else '',
            'nomeLocador': f'{rng.choice(primeiros)} {rng.choice(sobrenomes)}' if rng.random() < 0.2 else '',
            'comodos': [
                {'nome': 'Quarto', 'quantidade': rng.randint(1, 4)},
                {'nome': 'Sala', 'quantidade': rng.randint(1, 2)},
                {'nome': 'Cozinha', 'quantidade': 1},
                {'nome': 'Banheiro', 'quantidade': rng.randint(1, 2)},
                {'nome': 'Área de serviço', 'quantidade': rng.randint(0, 1)},
            ]
        },
        'condicoesHabitabilidade': {
            'tipoConstrucao': rng.choice(TIPOS_CONSTRUCAO),
            'padraoAcabamento': rng.choice(PADROES_ACABAMENTO),
            'tipoCoberta': rng.choice(TIPOS_COBERTA),
            'saneamentoBasico': rng.choice(SANEAMENTO),
            'abastecimentoAgua': rng.choice(ABASTECIMENTO),
            'aguasPluviais': rng.choice(AGUAS_PLUVIAIS),
            'pavimentacao': rng.choice(PAVIMENTACAO),
            'iluminacaoPublica': rng.choice(['sim', 'nao', 'parcial']),
            'coletaResiduos': rng.choice(['sim', 'nao'])
        },
        'chefeFamilia': chefe,
        'conjuge': conjuge,
        'demaisMembros': demais_membros,
        'historicoOcorrencias': gerar_historico_ocorrencias(area['camada'], idade_representante),
        'interdictioes': gerar_interdictioes(),
        'desalojamentos': gerar_desalojamentos(),
        'beneficiosAuxilios': gerar_beneficios(),
        'encaminhamentoHabitacional': gerar_encaminhamento(),
        'historicoVistorias': gerar_vistorias(),
        'situacaoAtual': gerar_situacao_atual(),
        'documentosFotograficos': gerar_documentos()
    }

    pontos.append({'id': f'exemplo-{indice + 1:04d}', 'nomeRepresentante': nomes[indice], 'latitude': candidato['latitude'], 'longitude': candidato['longitude'], 'nivelRisco': niveis[indice],
        'resumoDemonstrativo': {'moradores': moradores, 'integrantes': integrantes,
        'referenciaLocal': f"Proximidades de {candidato['rua']}" if candidato['rua'] else 'Proximidades de via residencial sem nome na base cartográfica',
        'nucleo': 'Sede de Goiana · entorno urbano do Rio Goiana',
        'areaSgb': {'id': area['id'], 'classe': area['descricao'], 'camada': area['camada']}},
        'dados': dados_completos})
salvar('dados-exemplo.json', pontos)
# Base pequena usada nos testes de localização. Não é carregada junto com o mapa.
areas = {'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {'nucleo': fid}, 'geometry': mapping(projetar(g, para_geo))} for fid, g in urbanos]}
salvar('demonstracao/areas-edificadas.geojson', areas)
contagens = collections.Counter(f"{p['area']['camada']}:{p['area']['descricao']}" for p in selecionados)
metadata = {'quantidade': 50, 'semente': SEMENTE, 'natureza': 'Famílias, nomes, datas de nascimento, parentescos, necessidades de apoio e avaliações de risco inteiramente fictícios. Todos os CPFs dos exemplos são 000.000.000-00, sem validade.',
    'fonteTerritorial': 'https://rigeo.sgb.gov.br/handle/doc/25401', 'anoPublicacao': 2025,
    'baseCartograficaSha256': hashlib.sha256(BASE.read_bytes()).hexdigest(),
    'municipioVerificado': {'nome': 'Goiana–PE', 'geocodigo': '2606200', 'limite': limite_fonte['properties']},
    'referenciasHistoricas': ['https://rigeo.sgb.gov.br/handle/doc/19968', 'https://www.goiana.pe.gov.br/portal/noticias/0/3/4800/prefeitura-de-goiana-habilita-moradores-atingidos-pelas-chuvas-para-saque-do-fgts-calamidade'],
    'criterios': ['Dentro do limite municipal IBGE 2025, código 2606200', 'Dentro de área edificada da sede na base SGB, até 3,5 km do centro', 'Dentro de classe Alta ou Média de inundação ou movimento de massa', 'Pontos aproximados de 9 a 35 m do eixo de vias locais', 'Excluídos os buffers de 70 m dos eixos de rios e 18 m dos demais cursos de água', 'Excluídos os buffers de 5 m das vias e as unidades de mangue e praia', 'Espaçamento mínimo de 9 m entre pontos'],
    'pontosPorContexto': dict(contagens), 'pontosPorNucleo': dict(collections.Counter(p['nucleo'] for p in selecionados)),
    'atribuicaoViasEHidrografia': '© OpenStreetMap contributors. Vias e hidrografia integrantes da base cartográfica distribuída pelo SGB. Dados derivados de OSM disponíveis sob ODbL: https://www.openstreetmap.org/copyright',
    'limiteDeUso': 'Localizações aproximadas para simulação em áreas urbanas suscetíveis. Não são residências, moradores ou cadastros verificados. Buffers técnicos não definem margem oficial, APP ou zona de segurança. A classe territorial não determina automaticamente o risco de uma residência.'}
salvar('demonstracao/fontes.json', metadata)
print(json.dumps({'familias': len(pontos), 'contextos': dict(contagens), 'nucleos': metadata['pontosPorNucleo']}, ensure_ascii=False))
