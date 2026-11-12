import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContractServer } from './servidor.mjs';

const fixtures = JSON.parse(readFileSync(new URL('../../docs/contratos/exemplos/cenarios.json', import.meta.url), 'utf8'));
const openapi = JSON.parse(readFileSync(new URL('../../docs/contratos/openapi.json', import.meta.url), 'utf8'));
const porta = 32000 + Math.floor(Math.random() * 20000);
let fake;
before(async () => { fake = await createContractServer({ port: porta }); });
after(async () => { await fake?.close(); });

function pedidoDoCenario(cenario) {
  const rota = Object.entries(openapi.paths).find(([, operacoes]) => Object.values(operacoes).some((op) => op.operationId === cenario.operationId));
  const [path, operacoes] = rota;
  const [metodo] = Object.entries(operacoes).find(([, op]) => op.operationId === cenario.operationId);
  const pathname = path.replace(/\{([^}]+)\}/g, (_match, nome) => cenario.request?.path?.[nome] ?? '1');
  const url = new URL(pathname, fake.url);
  for (const [nome, valor] of Object.entries(cenario.request?.query ?? {})) url.searchParams.set(nome, String(valor));
  const body = cenario.request?.body;
  return fetch(url, {
    method: metodo.toUpperCase(),
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('responde cenário documentado e valida resposta do OpenAPI', async () => {
  fake.setScenario('consultarSaude.200');
  const response = await fetch(`${fake.url}/saude`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { sucesso: true, dados: { status: 'ok' } });
});

test('rejeita rota fora do contrato', async () => {
  const response = await fetch(`${fake.url}/rota-fora-do-contrato`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).erro.codigo, 'NAO_ENCONTRADO');
});

test('rejeita campo de query fora do contrato', async () => {
  const response = await fetch(`${fake.url}/setores?campoInventado=1`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).erro.codigo, 'DADOS_INVALIDOS');
});

test('seleciona rejeição documentada pelo controle local do teste', async () => {
  fake.setScenario('entrar.401.CREDENCIAIS_INVALIDAS.email-inexistente');
  const response = await fetch(`${fake.url}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'x@example.invalid', senha: 'invalida' }) });
  assert.equal(response.status, 401);
});

test('simula rejeições HTTP documentadas e latência sem parâmetros de produto', async () => {
  for (const status of [401, 403, 404, 409, 422, 429, 500]) {
    const cenario = fixtures.cenarios.find((item) => item.esperado.status === status);
    fake.setScenario(cenario.id);
    const response = await pedidoDoCenario(cenario);
    assert.equal(response.status, status, cenario.id);
    await response.body?.cancel();
  }
  fake.setScenario('consultarSaude.200', { latencyMs: 40 });
  const inicio = performance.now();
  const response = await fetch(`${fake.url}/saude`);
  assert.ok(performance.now() - inicio >= 35);
  assert.equal(response.status, 200);
});

test('recusa campo de corpo incompatível com o schema', async () => {
  const response = await fetch(`${fake.url}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'x@example.invalid', senha: '12345678', campoInventado: true }) });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).erro.codigo, 'DADOS_INVALIDOS');
});
