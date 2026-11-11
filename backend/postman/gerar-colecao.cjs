const fs = require('node:fs')
const path = require('node:path')
const pastas = []
let pasta
let numero = 0
const agrupar = (nome) => { pasta = { name: nome, item: [] }; pastas.push(pasta) }
function chamada(nome, method, rota, status, { body, token, codigo, salvar = {}, conferir = [], antes = [], descricao = '' } = {}) {
  const scripts = [`pm.test('HTTP ${status}', function () { pm.response.to.have.status(${status}); });`]
  if (status === 204) scripts.push("pm.test('204 sem corpo', function () { pm.expect(pm.response.text()).to.eql(''); });")
  else {
    scripts.push('const resposta = pm.response.json();')
    scripts.push(`pm.test('Envelope e tipos', function () { pm.expect(resposta.sucesso).to.be.a('boolean'); pm.expect(resposta.sucesso).to.eql(${status < 400}); });`)
    if (status >= 400) {
      scripts.push(`pm.test('Código de erro', function () { pm.expect(resposta.erro.codigo).to.eql('${codigo}'); pm.expect(resposta.erro.status).to.eql(${status}); pm.expect(resposta.erro.mensagem).to.be.a('string'); pm.expect(resposta.caminho).to.be.a('string'); pm.expect(resposta.timestamp).to.be.a('string'); });`)
      if (status === 400) scripts.push("pm.test('Detalhes da validação', function () { pm.expect(resposta.erro.detalhes).to.be.an('array'); });")
    } else scripts.push("pm.test('Dados presentes', function () { pm.expect(resposta).to.have.property('dados'); });")
    for (const [variavel, acesso] of Object.entries(salvar)) scripts.push(`if (pm.response.code === ${status}) pm.environment.set('${variavel}', resposta.${acesso});`)
    for (const expressao of conferir) scripts.push(`pm.test('Conferir ${nome.replaceAll("'", '')}', function () { ${expressao} });`)
  }
  const request = {
    method,
    header: body === undefined ? [] : [{ key: 'Content-Type', value: 'application/json' }],
    auth: token ? { type: 'bearer', bearer: [{ key: 'token', value: '{{' + token + '}}', type: 'string' }] } : { type: 'noauth' },
    url: '{{baseUrl}}' + rota,
    description: `${descricao}\nResultado esperado: HTTP ${status}${codigo ? ' / ' + codigo : ''}.`.trim(),
  }
  if (body !== undefined) request.body = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } }
  const event = []
  if (antes.length) event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: antes } })
  event.push({ listen: 'test', script: { type: 'text/javascript', exec: scripts } })
  pasta.item.push({ name: `${String(++numero).padStart(2, '0')} - ${nome} [${status}]`, event, request, response: [] })
}
const g = 'tokenGuardiao'
const l = 'tokenLanterna'
const outro = 'tokenOutroSetor'
const o = '/ocorrencias/{{ocorrenciaId}}'
const f = '/lanternas/{{lanternaId}}'
const cadastro = { nome: 'Lanterna Postman', email: '{{emailLanterna}}', senha: '{{senhaTeste}}', setorId: 2814 }
const ocorrencia = { titulo: 'Resgate de nave na Terra', descricao: 'Uma nave ficou sem energia e precisa de ajuda da Tropa para resgatar a tripulação.', planeta: 'Terra', gravidade: 'alta', envolvidos: 12 }
const paginada = ["pm.expect(resposta.dados.itens).to.be.an('array'); pm.expect(resposta.dados.meta.total).to.be.a('number'); pm.expect(resposta.dados.meta.pagina).to.be.a('number');"]

agrupar('01 - Preparação e consultas públicas')
chamada('Saúde e iniciar nova rodada', 'GET', '/saude', 200, { antes: [
  "const rodada = Date.now().toString() + Math.floor(Math.random() * 1000).toString();",
  "pm.environment.set('rodada', rodada);",
  "pm.environment.set('emailLanterna', 'lanterna-' + rodada + '@postman.invalid');",
  "pm.environment.set('emailOutroSetor', 'outro-' + rodada + '@postman.invalid');",
  "pm.environment.set('lanternaId', 'postman-' + rodada);",
  "['tokenGuardiao', 'tokenLanterna', 'tokenOutroSetor', 'usuarioId', 'ocorrenciaId', 'comentarioId', 'setorTeste'].forEach(function (chave) { pm.environment.unset(chave); });",
], descricao: 'Execute primeiro. Gera e-mails e slug exclusivos para esta rodada. Precisa do ambiente ERP Local selecionado.' })
chamada('Listar setores e escolher ID livre', 'GET', '/setores', 200, { conferir: [
  "pm.expect(resposta.dados).to.be.an('array'); const usados = new Set(resposta.dados.map(function (s) { return s.id; })); let livre = 9000; while (usados.has(livre) && livre <= 9999) livre++; pm.expect(livre).to.be.at.most(9999); pm.environment.set('setorTeste', livre);",
] })
chamada('Listar lanternas com paginação', 'GET', '/lanternas?pagina=1&limite=5&ordenar=codinome&ordem=asc', 200, { conferir: paginada })
chamada('Ficha pública de Hal Jordan', 'GET', '/lanternas/hal-jordan', 200, { conferir: ["pm.expect(resposta.dados.id).to.eql('hal-jordan'); pm.expect(resposta.dados.habilidades).to.be.an('array');"] })

agrupar('02 - Cadastro, login e tokens')
chamada('Cadastrar conta Lanterna', 'POST', '/auth/cadastro', 201, { body: cadastro, salvar: { usuarioId: 'dados.id' }, conferir: ["pm.expect(resposta.dados.id).to.be.a('string'); pm.expect(resposta.dados.papel).to.eql('lanterna'); pm.expect(resposta.dados.setorId).to.eql(2814); pm.expect(resposta.dados).not.to.have.property('senhaHash');"] })
chamada('Cadastrar Lanterna de outro setor', 'POST', '/auth/cadastro', 201, { body: { ...cadastro, nome: 'Lanterna de outro setor', email: '{{emailOutroSetor}}', setorId: 674 } })
chamada('Login Guardião do seed', 'POST', '/auth/login', 200, { body: { email: '{{emailGuardiao}}', senha: '{{senhaGuardiao}}' }, salvar: { tokenGuardiao: 'dados.token' }, conferir: ["pm.expect(resposta.dados.token).to.be.a('string'); pm.expect(resposta.dados.expiresIn).to.be.a('number'); pm.expect(resposta.dados.usuario.papel).to.eql('guardiao');"], descricao: 'Credenciais locais do seed. Se usou SEED_SENHA, ajuste senhaGuardiao no ambiente Postman.' })
chamada('Login da nova Lanterna', 'POST', '/auth/login', 200, { body: { email: '{{emailLanterna}}', senha: '{{senhaTeste}}' }, salvar: { tokenLanterna: 'dados.token' }, conferir: ["pm.expect(resposta.dados.usuario.papel).to.eql('lanterna');"] })
chamada('Login de outro setor', 'POST', '/auth/login', 200, { body: { email: '{{emailOutroSetor}}', senha: '{{senhaTeste}}' }, salvar: { tokenOutroSetor: 'dados.token' } })
chamada('Consultar sessão Guardião', 'GET', '/auth/me', 200, { token: g, conferir: ["pm.expect(resposta.dados.papel).to.eql('guardiao');"] })
chamada('Consultar sessão Lanterna', 'GET', '/auth/me', 200, { token: l, conferir: ["pm.expect(resposta.dados.papel).to.eql('lanterna'); pm.expect(resposta.dados.lanternaId).to.eql(null);"] })
chamada('Sem token', 'GET', '/auth/me', 401, { codigo: 'NAO_AUTENTICADO' })
chamada('Token inválido', 'GET', '/auth/me', 401, { token: 'tokenInvalido', codigo: 'NAO_AUTENTICADO' })
chamada('Senha incorreta', 'POST', '/auth/login', 401, { body: { email: '{{emailLanterna}}', senha: 'senha-errada-exemplo' }, codigo: 'CREDENCIAIS_INVALIDAS' })
chamada('Cadastro com e-mail duplicado', 'POST', '/auth/cadastro', 409, { body: cadastro, codigo: 'EMAIL_JA_CADASTRADO' })
chamada('Cadastro não aceita escolher papel', 'POST', '/auth/cadastro', 400, { body: { ...cadastro, papel: 'guardiao' }, codigo: 'DADOS_INVALIDOS' })
chamada('Cadastro com campos obrigatórios ausentes', 'POST', '/auth/cadastro', 400, { body: { nome: 'Incompleto' }, codigo: 'DADOS_INVALIDOS' })

agrupar('03 - Usuários e autorização por papel')
chamada('Listar usuários como Guardião', 'GET', '/usuarios?pagina=1&limite=10', 200, { token: g, conferir: paginada })
chamada('Lanterna não lista usuários', 'GET', '/usuarios', 403, { token: l, codigo: 'SEM_PERMISSAO' })
chamada('Promover conta criada a Guardião', 'PATCH', '/usuarios/{{usuarioId}}/papel', 200, { token: g, body: { papel: 'guardiao' } })
chamada('Mesmo token reflete promoção', 'GET', '/auth/me', 200, { token: l, conferir: ["pm.expect(resposta.dados.papel).to.eql('guardiao');"] })
chamada('Retornar conta criada a Lanterna', 'PATCH', '/usuarios/{{usuarioId}}/papel', 200, { token: g, body: { papel: 'lanterna', setorId: 2814 } })
chamada('Mesmo token reflete papel Lanterna', 'GET', '/auth/me', 200, { token: l, conferir: ["pm.expect(resposta.dados.papel).to.eql('lanterna');"] })

agrupar('04 - Setores')
const setor = '{\n  "id": {{setorTeste}},\n  "nome": "Setor Postman",\n  "descricao": "Setor temporário criado pela coleção do Postman."\n}'
chamada('Criar setor', 'POST', '/setores', 201, { token: g, body: setor, conferir: ["pm.expect(resposta.dados.id).to.be.a('number'); pm.expect(resposta.dados.nome).to.be.a('string');"] })
chamada('Consultar setor criado', 'GET', '/setores/{{setorTeste}}', 200)
chamada('Editar setor', 'PATCH', '/setores/{{setorTeste}}', 200, { token: g, body: { nome: 'Setor Postman editado' } })
chamada('Setor duplicado', 'POST', '/setores', 409, { token: g, body: setor, codigo: 'SETOR_JA_CADASTRADO' })
chamada('Lanterna não cria setor', 'POST', '/setores', 403, { token: l, body: setor, codigo: 'SEM_PERMISSAO' })
chamada('Campo extra é rejeitado', 'PATCH', '/setores/{{setorTeste}}', 400, { token: g, body: { nome: 'Teste inválido', extra: true }, codigo: 'DADOS_INVALIDOS' })

agrupar('05 - Fichas e vínculo')
chamada('Fila sem ficha vinculada', 'GET', '/ocorrencias/minha-fila', 409, { token: l, codigo: 'CONTA_SEM_LANTERNA' })
chamada('Criar ficha', 'POST', '/lanternas', 201, { token: g, body: { id: '{{lanternaId}}', codinome: 'Lanterna Postman', identidadeCivil: 'Pessoa de Teste', especie: 'Humana', planetaNatal: 'Terra', setorId: 2814, habilidades: ['Resgate', 'Construções de energia'], biografia: 'Ficha de demonstração para testar os endpoints HTTP.' } })
chamada('Consultar ficha criada', 'GET', f, 200, { conferir: ["pm.expect(resposta.dados.id).to.eql(pm.environment.get('lanternaId'));"] })
chamada('Editar ficha', 'PATCH', f, 200, { token: g, body: { biografia: 'Biografia editada durante os testes com o Postman.' } })
chamada('Mentor próprio é inválido', 'PATCH', f, 422, { token: g, body: { mentorId: '{{lanternaId}}' }, codigo: 'MENTOR_INVALIDO' })
chamada('Afastar ficha sem missões', 'PATCH', f + '/status', 200, { token: g, body: { status: 'afastado' } })
chamada('Reativar ficha', 'PATCH', f + '/status', 200, { token: g, body: { status: 'ativo' } })
chamada('Vincular conta à ficha', 'PATCH', '/usuarios/{{usuarioId}}/lanterna', 200, { token: g, body: { lanternaId: '{{lanternaId}}' } })
chamada('Fila inicialmente vazia', 'GET', '/ocorrencias/minha-fila', 200, { token: l, conferir: [...paginada, 'pm.expect(resposta.dados.itens.length).to.eql(0);'] })

agrupar('06 - Ocorrências e ciclo de vida')
chamada('Criar ocorrência como Lanterna', 'POST', '/ocorrencias', 201, { token: l, body: ocorrencia, salvar: { ocorrenciaId: 'dados.id' }, conferir: ["pm.expect(resposta.dados.status).to.eql('aberta'); pm.expect(resposta.dados.setorId).to.eql(2814); pm.expect(resposta.dados.envolvidos).to.be.a('number'); pm.expect(resposta.dados.vencida).to.be.a('boolean');"] })
chamada('Listar ocorrências do setor', 'GET', '/ocorrencias?pagina=1&limite=10&gravidade=alta', 200, { token: l, conferir: paginada })
chamada('Consultar ocorrência criada', 'GET', o, 200, { token: l })
chamada('Outro setor não vê a ocorrência', 'GET', o, 404, { token: outro, codigo: 'NAO_ENCONTRADO' })
chamada('Lanterna não escolhe setor no POST', 'POST', '/ocorrencias', 400, { token: l, body: { ...ocorrencia, setorId: 674 }, codigo: 'DADOS_INVALIDOS' })
chamada('Gravidade fora do enum', 'POST', '/ocorrencias', 400, { token: l, body: { ...ocorrencia, gravidade: 'urgente' }, codigo: 'DADOS_INVALIDOS' })
chamada('Editar ocorrência própria', 'PATCH', o, 200, { token: l, body: { titulo: 'Resgate da nave acompanhado pelo Postman' } })
chamada('Iniciar sem responsável', 'PATCH', o + '/status', 422, { token: l, body: { status: 'em_andamento' }, codigo: 'SEM_RESPONSAVEL' })
chamada('Guardião atribui responsável', 'PATCH', o + '/responsavel', 200, { token: g, body: { responsavelId: '{{lanternaId}}' } })
chamada('Minha fila contém a ocorrência', 'GET', '/ocorrencias/minha-fila', 200, { token: l, conferir: ["pm.expect(resposta.dados.itens.some(function (item) { return item.id === pm.environment.get('ocorrenciaId'); })).to.eql(true);"] })
chamada('Afastamento com carga é recusado', 'PATCH', f + '/status', 409, { token: g, body: { status: 'afastado' }, codigo: 'LANTERNA_EM_MISSAO' })
chamada('Iniciar atendimento', 'PATCH', o + '/status', 200, { token: l, body: { status: 'em_andamento' }, conferir: ["pm.expect(resposta.dados.status).to.eql('em_andamento');"] })

agrupar('07 - Comentários e eventos')
chamada('Criar comentário', 'POST', o + '/comentarios', 201, { token: l, body: { texto: 'Equipe enviada ao local. Iniciamos o resgate da tripulação.' }, salvar: { comentarioId: 'dados.id' }, conferir: ["pm.expect(resposta.dados.texto).to.be.a('string'); pm.expect(resposta.dados.autor.nome).to.be.a('string');"] })
chamada('Listar comentários', 'GET', o + '/comentarios?pagina=1&limite=20', 200, { token: l, conferir: paginada })
chamada('Listar eventos', 'GET', o + '/eventos?pagina=1&limite=20', 200, { token: g, conferir: paginada })
chamada('Outro setor não comenta', 'POST', o + '/comentarios', 404, { token: outro, body: { texto: 'Comentário fora do setor.' }, codigo: 'NAO_ENCONTRADO' })
chamada('Apagar comentário pelo autor', 'DELETE', '/comentarios/{{comentarioId}}', 204, { token: l })
chamada('Comentário apagado não aparece', 'GET', o + '/comentarios', 200, { token: l, conferir: ["pm.expect(resposta.dados.itens.some(function (item) { return item.id === pm.environment.get('comentarioId'); })).to.eql(false);"] })

agrupar('08 - Resolução, dashboard e exclusão')
chamada('Resolver com justificativa', 'PATCH', o + '/status', 200, { token: l, body: { status: 'resolvida', resolucao: 'Todos os tripulantes foram resgatados e a nave foi rebocada com segurança.' }, conferir: ["pm.expect(resposta.dados.status).to.eql('resolvida'); pm.expect(resposta.dados.resolvidaEm).to.be.a('string');"] })
chamada('Resolvida não pode ser editada', 'PATCH', o, 409, { token: l, body: { titulo: 'Tentativa de editar resolvida' }, codigo: 'OCORRENCIA_RESOLVIDA' })
chamada('Dashboard Guardião', 'GET', '/dashboard?dias=7', 200, { token: g })
chamada('Dashboard Lanterna', 'GET', '/dashboard?dias=7', 200, { token: l })
chamada('Dashboard com período inválido', 'GET', '/dashboard?dias=3', 400, { token: g, codigo: 'DADOS_INVALIDOS' })
chamada('Excluir ocorrência criada', 'DELETE', o, 204, { token: g, descricao: 'Exclusão lógica somente da ocorrência desta rodada.' })
chamada('Ocorrência excluída retorna 404', 'GET', o, 404, { token: g, codigo: 'NAO_ENCONTRADO' })
chamada('Excluir setor temporário vazio', 'DELETE', '/setores/{{setorTeste}}', 204, { token: g })
chamada('Setor excluído retorna 404', 'GET', '/setores/{{setorTeste}}', 404, { codigo: 'NAO_ENCONTRADO' })

const colecao = {
  info: { name: 'ERP Tropa - Backend local', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Roteiro sequencial com autenticação, 30 operações, exemplos JSON e erros esperados. Leia backend/postman/README.md. Requer seed completo. Tokens e IDs são preenchidos no ambiente ERP Local. A coleção cria dados de teste; não use banco com dados que precisem ser preservados.' },
  item: pastas,
}
const variaveis = { baseUrl: 'http://localhost:3001', emailGuardiao: 'ganthet@oa.tropa', senhaGuardiao: 'guardiao123', senhaTeste: 'PostmanTeste123!', tokenInvalido: 'jwt-invalido-para-teste', rodada: '', emailLanterna: '', emailOutroSetor: '', tokenGuardiao: '', tokenLanterna: '', tokenOutroSetor: '', usuarioId: '', lanternaId: '', setorTeste: '', ocorrenciaId: '', comentarioId: '' }
const ambiente = { name: 'ERP Local', values: Object.entries(variaveis).map(([key, value]) => ({ key, value, type: /senha|token/i.test(key) ? 'secret' : 'default', enabled: true })), _postman_variable_scope: 'environment' }
fs.writeFileSync(path.join(__dirname, 'ERP-Backend.postman_collection.json'), JSON.stringify(colecao, null, 2) + '\n')
fs.writeFileSync(path.join(__dirname, 'ERP-Local.postman_environment.json'), JSON.stringify(ambiente, null, 2) + '\n')
console.log(`${numero} chamadas geradas em ${pastas.length} pastas.`)
