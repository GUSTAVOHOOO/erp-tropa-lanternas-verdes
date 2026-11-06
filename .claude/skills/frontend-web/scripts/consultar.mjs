import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// O catálogo é lido dos arquivos canônicos; não há cópia resumida das regras.
export function parseReference(text, file) {
  const lines = text.split('\n')
  const rules = []
  let fence = null
  let current = null

  function finish(end) {
    if (current) rules.push({ ...current, text: lines.slice(current.line - 1, end).join('\n').trimEnd() })
  }

  for (let index = 0; index < lines.length; index++) {
    const delimiter = lines[index].match(/^ {0,3}(`{3,}|~{3,})/)
    if (delimiter) {
      const marker = delimiter[1]
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length && lines[index].trim() === marker) fence = null
      continue
    }
    if (fence) continue
    const heading = lines[index].match(/^### ([A-Z]+-\d{2}): (.+?)\r?$/)
    if (heading) {
      finish(index)
      current = { id: heading[1], title: heading[2], file, line: index + 1 }
    }
  }
  finish(lines.length)
  return rules
}

function listarArquivos(directory) {
  // Percorre references/ em todas as pastas; os README.md são índices, sem regras.
  return readdirSync(directory, { recursive: true })
    .map(f => f.split(path.sep).join('/'))
    .filter(f => f.endsWith('.md') && path.basename(f) !== 'README.md')
    .sort()
}

function loadCatalog() {
  const directory = fileURLToPath(new URL('../references/', import.meta.url))
  const catalog = new Map()
  for (const file of listarArquivos(directory)) {
    for (const rule of parseReference(readFileSync(path.join(directory, file), 'utf8'), file)) {
      if (catalog.has(rule.id)) throw new Error(`ID duplicado: ${rule.id} (${catalog.get(rule.id).file} e ${file})`)
      catalog.set(rule.id, rule)
    }
  }
  return catalog
}

function main(args) {
  if (args.length === 0 || args[0] === '--help') {
    console.log('Uso: node consultar.mjs ID [ID ...]\n     node consultar.mjs --listar [PREFIXO ...]\nExemplos: FORM-17 FORM-18 AUTH-05 | --listar CSS | --listar PROD API')
    return
  }
  const catalog = loadCatalog()
  if (args[0] === '--listar') {
    const prefixes = new Set(args.slice(1))
    const available = new Set([...catalog.keys()].map(id => id.split('-')[0]))
    for (const prefix of prefixes) {
      if (!available.has(prefix)) throw new Error(`Prefixo desconhecido: ${prefix}`)
    }
    console.log([...catalog.values()].filter(r => !prefixes.size || prefixes.has(r.id.split('-')[0]))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(r => `${r.id}: ${r.title} (references/${r.file}:${r.line})`).join('\n'))
    return
  }
  const ids = [...new Set(args)]
  const missing = ids.filter(id => !catalog.has(id))
  if (missing.length) throw new Error(`ID desconhecido: ${missing.join(', ')}. Consulte --listar PREFIXO.`)
  console.log(ids.map(id => {
    const rule = catalog.get(id)
    return `Arquivo: references/${rule.file}:${rule.line}\n${rule.text}`
  }).join('\n\n'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
