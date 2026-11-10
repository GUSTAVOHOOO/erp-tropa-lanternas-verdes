/** Links/pastas; --ancoras também confere títulos Markdown. Não acessa sites. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const falhas = [];
const pastas = [];
const documentos = [];
const verificarAncoras = process.argv.includes('--ancoras');
const cacheAncoras = new Map();

function semBlocosDeCodigo(texto) {
  let cerca;
  return texto.split(/\r?\n/).map(linha => {
    const marcador = linha.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marcador) {
      if (!cerca) cerca = marcador[1];
      else if (marcador[1][0] === cerca[0] && marcador[1].length >= cerca.length) cerca = undefined;
      return '';
    }
    return cerca ? '' : linha;
  }).join('\n');
}

function ancoras(arquivo) {
  if (cacheAncoras.has(arquivo)) return cacheAncoras.get(arquivo);
  const texto = semBlocosDeCodigo(readFileSync(arquivo, 'utf8'));
  const ids = new Set();
  for (const item of texto.matchAll(/<(?:a|[a-z][a-z\d]*)\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi)) ids.add(item[1]);
  const repeticoes = new Map();
  for (const linha of texto.split('\n')) {
    const titulo = linha.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/)?.[1];
    if (!titulo) continue;
    const slug = titulo.toLowerCase()
      .replace(/<[^>]*>/g, '')
      .replace(/!?(?:\[([^\]]+)\])\([^)]*\)/g, '$1')
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '')
      .replace(/\s/g, '-');
    let numero = repeticoes.get(slug) ?? 0;
    let id = numero ? `${slug}-${numero}` : slug;
    while (ids.has(id)) { numero++; id = `${slug}-${numero}`; }
    repeticoes.set(slug, numero + 1);
    ids.add(id);
  }
  cacheAncoras.set(arquivo, ids);
  return ids;
}

function percorrer(pasta) {
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    if (item.name.startsWith('.') || item.name === '__pycache__') continue;
    const caminho = resolve(pasta, item.name);
    if (item.isDirectory()) {
      pastas.push(caminho);
      percorrer(caminho);
    } else if (item.name.endsWith('.md')) documentos.push(caminho);
  }
}

function* destinos(texto) {
  for (const inicio of texto.matchAll(/\]\(/g)) {
    const pos = inicio.index + 2;
    if (texto[pos] === '<') {
      const fim = texto.indexOf('>', pos + 1);
      if (fim >= 0) yield texto.slice(pos + 1, fim);
      continue;
    }
    let nivel = 1;
    let fim = pos;
    while (fim < texto.length && nivel) {
      if (texto[fim] === '\\') { fim += 2; continue; }
      if (texto[fim] === '(') nivel++;
      if (texto[fim] === ')') nivel--;
      fim++;
    }
    if (!nivel) yield texto.slice(pos, fim - 1).split(' "')[0].trim();
  }
}

percorrer(resolve(raiz, 'docs'));
documentos.push(...['README.md', 'AGENTS.md', 'CLAUDE.md'].map(nome => resolve(raiz, nome)));
let links = 0;
let totalAncoras = 0;
for (const arquivo of documentos) {
  for (const destino of destinos(semBlocosDeCodigo(readFileSync(arquivo, 'utf8')))) {
    if (!destino || /^[a-z][a-z\d+.-]*:/i.test(destino)) continue;
    const caminho = decodeURIComponent(destino.split('#')[0].split('?')[0]);
    if (!caminho && !verificarAncoras) continue;
    links++;
    const alvo = caminho ? resolve(dirname(arquivo), caminho) : arquivo;
    if (!existsSync(alvo)) {
      falhas.push(`${relative(raiz, arquivo)}: link ausente: ${destino}`);
      continue;
    }
    const fragmento = decodeURIComponent(destino.split('#').slice(1).join('#'));
    if (verificarAncoras && fragmento && alvo.endsWith('.md')) {
      totalAncoras++;
      if (!ancoras(alvo).has(fragmento)) falhas.push(`${relative(raiz, arquivo)}: âncora ausente: ${destino}`);
    }
  }
}
const indice = readFileSync(resolve(raiz, 'docs/README.md'), 'utf8');
for (const pasta of pastas) {
  const caminho = relative(raiz, pasta).replaceAll('\\', '/') + '/';
  if (!indice.includes('`' + caminho + '`')) falhas.push(`docs/README.md: pasta sem descrição: ${caminho}`);
}
for (const falha of falhas) console.error(falha);
console.log(`${documentos.length} documentos, ${links} links locais, ${pastas.length} pastas` +
  (verificarAncoras ? `, ${totalAncoras} âncoras` : '') + `; ${falhas.length} falhas.`);
process.exitCode = falhas.length ? 1 : 0;
