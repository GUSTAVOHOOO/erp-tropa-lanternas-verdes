export interface Ambiente {
  PORT: number
  DATABASE_PATH: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: '8h'
  CORS_ORIGIN: string
  LOGIN_LIMITE: number
  LOGIN_JANELA_SEGUNDOS: number
}

function inteiroPositivo(valor: string | undefined, nome: string): number {
  if (!valor || !/^\d+$/.test(valor)) {
    throw new Error(`${nome} deve ser um inteiro positivo`)
  }

  const numero = Number(valor)
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new Error(`${nome} deve ser um inteiro positivo`)
  }
  return numero
}

function origemValida(valor: string | undefined): string {
  if (!valor) throw new Error('CORS_ORIGIN é obrigatória')
  let origem: URL
  try {
    origem = new URL(valor)
  } catch {
    throw new Error('CORS_ORIGIN deve ser uma origem HTTP ou HTTPS válida')
  }
  if (!['http:', 'https:'].includes(origem.protocol) || origem.origin !== valor) {
    throw new Error('CORS_ORIGIN deve conter somente a origem HTTP ou HTTPS')
  }
  return origem.origin
}

export function validarAmbiente(env: Record<string, unknown>): Ambiente {
  const porta = inteiroPositivo(String(env.PORT ?? ''), 'PORT')
  if (porta > 65_535) throw new Error('PORT deve estar entre 1 e 65535')

  const databasePath = String(env.DATABASE_PATH ?? '').trim()
  if (!databasePath) throw new Error('DATABASE_PATH é obrigatória')

  const jwtSecret = String(env.JWT_SECRET ?? '')
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET deve conter pelo menos 32 bytes')
  }

  if (env.JWT_EXPIRES_IN !== '8h') {
    throw new Error('JWT_EXPIRES_IN deve ser 8h')
  }

  return {
    PORT: porta,
    DATABASE_PATH: databasePath,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: '8h',
    CORS_ORIGIN: origemValida(String(env.CORS_ORIGIN ?? '')),
    LOGIN_LIMITE: inteiroPositivo(String(env.LOGIN_LIMITE ?? ''), 'LOGIN_LIMITE'),
    LOGIN_JANELA_SEGUNDOS: inteiroPositivo(
      String(env.LOGIN_JANELA_SEGUNDOS ?? ''),
      'LOGIN_JANELA_SEGUNDOS',
    ),
  }
}
