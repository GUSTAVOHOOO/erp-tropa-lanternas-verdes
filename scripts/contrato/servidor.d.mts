/** Tipos do servidor falso de contrato (scripts/contrato/servidor.mjs), só para os testes. */
import type { Server } from 'node:http'

export type ServidorDeContrato = {
  server: Server
  url: string
  setScenario(id: string, options?: { latencyMs?: number }): void
  close(): Promise<void>
}

export function createContractServer(options: { port: number; latencyMs?: number }): Promise<ServidorDeContrato>
