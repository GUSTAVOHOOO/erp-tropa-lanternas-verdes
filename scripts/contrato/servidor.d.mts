/** Tipos do servidor falso de contrato (scripts/contrato/servidor.mjs), só para os testes. */
import type { Server } from 'node:http'

export type ServidorDeContrato = {
  server: Server
  url: string
  /** Escolhe o cenário da operação dele; as demais seguem no sucesso documentado. */
  setScenario(id: string, options?: { latencyMs?: number }): void
  /** Volta todas as operações ao sucesso documentado. */
  reset(): void
  close(): Promise<void>
}

export function createContractServer(options: { port: number; latencyMs?: number }): Promise<ServidorDeContrato>
