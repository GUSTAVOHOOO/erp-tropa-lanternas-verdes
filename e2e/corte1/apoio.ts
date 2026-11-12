import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'

// Apoio comum do E2E do Corte 1. Os dados vêm do manifesto que a fixture de integração grava
// (scripts/corte1/api.mjs); a senha é a local de teste, nunca um segredo real.
export const SENHA = process.env.CORTE1_SENHA ?? 'senha-local-corte1'
export const API = 'http://127.0.0.1:32134'

type Conta = { caso: string, id: string, email: string, papel: 'guardiao' | 'lanterna', setorId: number | null, lanternaId: string | null }
type Manifesto = {
  instanteReferencia: string
  contas: Conta[]
  setores: unknown[]
  fichas: unknown[]
  vinculos: unknown[]
  ocorrencias: Array<Record<string, unknown> & { id: string }>
  eventos: unknown[]
  comentarios: Array<Record<string, unknown> & { id: string }>
  contagens: Record<string, number>
}

export function lerManifesto(): Manifesto {
  return JSON.parse(readFileSync(join(process.cwd(), '.corte1', 'manifesto.json'), 'utf8'))
}

export function conta(caso: 'G' | 'G2' | 'L2814' | 'L674' | 'L-sem-ficha'): Conta {
  const encontrada = lerManifesto().contas.find((item) => item.caso === caso)
  if (!encontrada) throw new Error(`Conta ${caso} ausente do manifesto`)
  return encontrada
}

/** Autentica pelo formulário real de login (sem sessão fabricada) e espera o painel. */
export async function entrar(page: Page, caso: Parameters<typeof conta>[0]) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail' }).fill(conta(caso).email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(SENHA)
  await page.getByRole('button', { name: /entrar/i }).click()
  await expect(page).toHaveURL(/\/painel/)
}
