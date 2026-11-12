import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contrato = JSON.parse(await readFile(path.join(raiz, 'docs/contratos/openapi.json'), 'utf8'));
contrato.$id = 'https://contrato.invalid/openapi.json';
const pacote = JSON.parse(await readFile(path.join(raiz, 'docs/contratos/exemplos/cenarios.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const contratoId = contrato.$id;
ajv.addSchema(contrato, contratoId);
function absolutizarRefs(value) {
  if (Array.isArray(value)) return value.map(absolutizarRefs);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === '$ref' && typeof child === 'string' && child.startsWith('#') ? `${contratoId}${child}` : absolutizarRefs(child)]));
}
const validar = (schema, valor) => ajv.compile(absolutizarRefs(schema))(valor);
const cenarios = pacote.cenarios;

function compilarRota(rota) {
  const partes = rota.split('/').map((parte) => parte.startsWith('{') ? '[^/]+' : parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${partes.join('/')}$`);
}

function erro(res, status, codigo, mensagem, pathname = '/', rota = null) {
  const codigoContrato = status === 400 ? 'DADOS_INVALIDOS' : status === 404 ? 'NAO_ENCONTRADO' : status === 500 ? 'ERRO_INTERNO' : codigo;
  const corpo = {
    sucesso: false,
    erro: { status, mensagem, codigo: codigoContrato, ...(status === 400 ? { detalhes: [] } : {}) },
    caminho: pathname,
    timestamp: new Date().toISOString(),
  };
  const schema = rota?.op.responses[String(status)]?.content?.['application/json']?.schema;
  if (schema && !validar(schema, corpo)) {
    res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ sucesso: false, erro: { status: 500, mensagem: 'Resposta de erro fora do contrato.', codigo: 'ERRO_INTERNO' }, caminho: pathname, timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(corpo));
}

export async function createContractServer({ port, latencyMs = 0 } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Informe uma porta exclusiva válida.');
  // Um cenário escolhido por operação; as demais respondem o sucesso documentado.
  const escolhidos = new Map();
  let atraso = latencyMs;
  const servidor = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const rota = Object.entries(contrato.paths).flatMap(([pathname, verbs]) => Object.entries(verbs).map(([method, op]) => ({ pathname, method: method.toUpperCase(), op }))).find((item) => item.method === req.method && compilarRota(item.pathname).test(url.pathname));
      if (!rota) return erro(res, 404, 'ROTA_DESCONHECIDA', 'Rota não prevista no contrato.', url.pathname);

      const permitido = new Set((rota.op.parameters ?? []).filter((p) => p.in === 'query').map((p) => p.name));
      for (const nome of url.searchParams.keys()) if (!permitido.has(nome)) return erro(res, 400, 'DADOS_INVALIDOS', `Parâmetro não previsto: ${nome}.`, url.pathname, rota);
      const query = Object.fromEntries([...url.searchParams.entries()].map(([name, raw]) => {
        const schema = (rota.op.parameters ?? []).find((p) => p.in === 'query' && p.name === name)?.schema;
        return [name, schema?.type === 'integer' || schema?.type === 'number' ? Number(raw) : schema?.type === 'boolean' ? raw === 'true' : raw];
      }));
      for (const parametro of rota.op.parameters ?? []) {
        if (parametro.in === 'query' && query[parametro.name] !== undefined && !validar(parametro.schema, query[parametro.name])) return erro(res, 400, 'DADOS_INVALIDOS', 'Parâmetro incompatível com o contrato.', url.pathname, rota);
        if (parametro.in === 'query' && parametro.required && query[parametro.name] === undefined) return erro(res, 400, 'DADOS_INVALIDOS', `Parâmetro obrigatório ausente: ${parametro.name}.`, url.pathname, rota);
        if (parametro.in === 'path') {
          const bruto = url.pathname.split('/')[rota.pathname.split('/').findIndex((part) => part === `{${parametro.name}}`)];
          // Parâmetro de rota chega como texto; inteiro/número é convertido antes de validar (ex.: /setores/{id}).
          const valor = (parametro.schema?.type === 'integer' || parametro.schema?.type === 'number') && /^-?\d+(\.\d+)?$/.test(bruto) ? Number(bruto) : bruto;
          if (!validar(parametro.schema, valor)) return erro(res, 400, 'DADOS_INVALIDOS', `Parâmetro de rota incompatível: ${parametro.name}.`, url.pathname, rota);
        }
      }

      let body;
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { return erro(res, 400, 'DADOS_INVALIDOS', 'O corpo deve ser JSON válido.', url.pathname, rota); }
      }
      const bodySchema = rota.op.requestBody?.content?.['application/json']?.schema;
      if (bodySchema && !validar(bodySchema, body)) return erro(res, 400, 'DADOS_INVALIDOS', 'Corpo incompatível com o contrato.', url.pathname, rota);
      if (!bodySchema && body !== undefined) return erro(res, 400, 'DADOS_INVALIDOS', 'Esta operação não aceita corpo.', url.pathname, rota);

      const idEscolhido = escolhidos.get(rota.op.operationId);
      const scenario = idEscolhido ? cenarios.find((item) => item.id === idEscolhido) : cenarios.find((item) => item.operationId === rota.op.operationId && item.tipo === 'sucesso');
      if (!scenario) return erro(res, 404, 'NAO_ENCONTRADO', 'Nenhum cenário local configurado para esta operação.', url.pathname, rota);
      const status = scenario.esperado.status;
      const nomeExemplo = `${rota.op.operationId}_${scenario.esperado.codigo ?? 'sucesso'}`;
      const resposta = scenario.esperado.corpo ?? contrato.components.examples[nomeExemplo]?.value;
      const schema = rota.op.responses[String(status)]?.content?.['application/json']?.schema;
      if (schema && !validar(schema, resposta)) return erro(res, 500, 'ERRO_INTERNO', `Cenário ${scenario.id} viola o schema de resposta.`, url.pathname, rota);
      if (atraso > 0) await new Promise((resolve) => setTimeout(resolve, atraso));
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      res.end(resposta === undefined ? '' : JSON.stringify(resposta));
    } catch (cause) {
      erro(res, 500, 'FAKE_INTERNO', cause instanceof Error ? cause.message : 'Falha no servidor falso.');
    }
  });
  await new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(port, '127.0.0.1', resolve);
  });
  return {
    server: servidor,
    url: `http://127.0.0.1:${port}`,
    setScenario(id, options = {}) {
      const cenario = cenarios.find((item) => item.id === id);
      if (!cenario) throw new Error(`Cenário desconhecido: ${id}`);
      escolhidos.set(cenario.operationId, id);
      atraso = options.latencyMs ?? latencyMs;
    },
    reset() {
      escolhidos.clear();
      atraso = latencyMs;
    },
    close: () => new Promise((resolve, reject) => servidor.close((cause) => cause ? reject(cause) : resolve())),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.CONTRATO_PORT);
  const fake = await createContractServer({ port });
  console.log(`Servidor de contrato em ${fake.url}`);
}
