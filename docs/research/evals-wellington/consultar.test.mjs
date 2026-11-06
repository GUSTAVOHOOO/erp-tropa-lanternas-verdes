import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parseReference } from '../../../.claude/skills/padroes-wellington/scripts/consultar.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const skill = path.join(root, '.claude/skills/padroes-wellington')
const reader = path.join(skill, 'scripts/consultar.mjs')

test('seções preservam fonte, exemplos e notas, sem absorver a regra seguinte', () => {
  const text = '# Introdução\n\n### FORM-01: Primeira\n**Fonte:** [SLIDE] FORMS p. 1\n```md\n### FORM-99: Dentro do exemplo\n```\n**Nota de versão:** preservar.\n\n### FORM-02: Segunda\n**Fonte:** [DECISÃO] grupo\n'
  const rules = parseReference(text, 'teste.md')
  assert.deepEqual(rules.map(r => r.id), ['FORM-01', 'FORM-02'])
  assert.equal(rules[0].line, 3)
  assert.ok(rules[0].text.includes('### FORM-99: Dentro do exemplo'))
  assert.ok(rules[0].text.includes('**Nota de versão:** preservar.'))
  assert.ok(!rules[0].text.includes('### FORM-02: Segunda'))
})

test('as 130 regras reais podem ser consultadas sem alteração de conteúdo', () => {
  // A expectativa vem do arquivo bruto, independentemente do parser testado.
  const rules = readdirSync(path.join(skill, 'references')).filter(f => f.endsWith('.md'))
    .flatMap(file => {
      const raw = readFileSync(path.join(skill, 'references', file), 'utf8')
      const headings = [...raw.matchAll(/^### ([A-Z]+-\d{2}): [^\r\n]+/gm)]
      return headings.map((heading, index) => ({
        id: heading[1], file, line: raw.slice(0, heading.index).split('\n').length,
        text: raw.slice(heading.index, headings[index + 1]?.index ?? raw.length).trimEnd(),
      }))
    })
  assert.equal(rules.length, 130)
  assert.equal(new Set(rules.map(r => r.id)).size, 130)
  for (const rule of rules) {
    const output = execFileSync(process.execPath, [reader, rule.id], { encoding: 'utf8' })
    assert.equal(output.trimEnd(), `Arquivo: references/${rule.file}:${rule.line}\n${rule.text}`)
  }
})

test('lote deduplica IDs, preserva a ordem e funciona fora do projeto', () => {
  const output = execFileSync(process.execPath, [reader, 'AUTH-05', 'FORM-17', 'AUTH-05'],
    { encoding: 'utf8', cwd: path.parse(root).root })
  assert.equal((output.match(/^### AUTH-05:/gm) || []).length, 1)
  assert.ok(output.indexOf('### AUTH-05:') < output.indexOf('### FORM-17:'))
})

test('ID desconhecido não produz um lote parcialmente válido', () => {
  const result = spawnSync(process.execPath, [reader, 'FORM-17', 'FORM-99'], { encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /FORM-99/)
})

test('índice por prefixo lista títulos sem carregar os exemplos na saída', () => {
  const output = execFileSync(process.execPath, [reader, '--listar', 'CSS'], { encoding: 'utf8' })
  assert.equal(output.trim().split('\n').length, 15)
  assert.match(output, /CSS-03/)
  assert.ok(!output.includes('**Fonte:**'))
  assert.ok(!output.includes('AUTH-01'))
})
