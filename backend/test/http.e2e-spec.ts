import 'reflect-metadata'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  type INestApplication,
  Post,
  Logger,
  Module,
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { jest } from '@jest/globals'
import request from 'supertest'
import { IsString, MinLength } from 'class-validator'
import { configurarHttp } from '../src/comum/configurar-http.js'
import { validarAmbiente } from '../src/config/ambiente.js'
import { Publica } from '../src/comum/publica.decorator.js'
import { SaudeController } from '../src/saude/saude.controller.js'

class EntradaProbe {
  @IsString()
  @MinLength(3)
  nome!: string
}

@Controller('__teste')
@Publica()
class ControllerProbe {
  @Post('validacao')
  validar(@Body() entrada: EntradaProbe) {
    return entrada
  }

  @Get('erro')
  falhar(): never {
    throw new Error('falha SQL privada de teste')
  }

  @Delete('sem-corpo')
  @HttpCode(204)
  semCorpo(): void {}
}

@Module({ controllers: [ControllerProbe, SaudeController] })
class ModuloProbe {}

describe('esteira HTTP inicial', () => {
  let servidor: INestApplication
  const registros: string[] = []
  let logSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance

  beforeAll(async () => {
    process.env.PORT = '3001'
    process.env.DATABASE_PATH = ':memory:'
    process.env.JWT_SECRET = 'chave-de-teste-com-mais-de-32-bytes!!'
    process.env.JWT_EXPIRES_IN = '8h'
    process.env.CORS_ORIGIN = 'http://localhost:3000'
    process.env.LOGIN_LIMITE = '5'
    process.env.LOGIN_JANELA_SEGUNDOS = '60'

    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation((message) => {
      registros.push(String(message))
    })
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation((message) => {
      registros.push(String(message))
    })

    servidor = await NestFactory.create(ModuloProbe, { logger: false })
    configurarHttp(servidor, validarAmbiente(process.env))
    await servidor.init()
  })

  afterAll(async () => {
    if (servidor) await servidor.close()
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('responde à saúde pública no envelope contratado', async () => {
    await request(servidor.getHttpServer())
      .get('/saude')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ sucesso: true, dados: { status: 'ok' } })
      })
  })

  it('mantém respostas 204 sem envelope nem corpo', async () => {
    await request(servidor.getHttpServer())
      .delete('/__teste/sem-corpo')
      .expect(204)
      .expect('')
  })

  it('rejeita campo desconhecido com detalhe de validação', async () => {
    await request(servidor.getHttpServer())
      .post('/__teste/validacao')
      .send({ nome: 'Lanterna', senha: 'segredo-do-corpo' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.sucesso).toBe(false)
        expect(body.erro.codigo).toBe('DADOS_INVALIDOS')
        expect(body.erro.detalhes).toEqual(
          expect.arrayContaining([expect.objectContaining({ campo: 'senha' })]),
        )
      })
  })

  it('oculta stack e detalhes internos da resposta e não registra credenciais ou corpo', async () => {
    await request(servidor.getHttpServer())
      .get('/__teste/erro')
      .set('Authorization', 'Bearer token-privado')
      .expect(500)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          sucesso: false,
          erro: { status: 500, codigo: 'ERRO_INTERNO', mensagem: 'Erro interno' },
          caminho: '/__teste/erro',
        })
        expect(JSON.stringify(body)).not.toContain('falha SQL privada')
        expect(JSON.stringify(body)).not.toContain('token-privado')
      })

    const log = registros.join('\n')
    expect(log).not.toContain('token-privado')
    expect(log).not.toContain('segredo-do-corpo')
    expect(log).not.toContain('Authorization')
  })

  it('recusa configurações ausentes ou inválidas', () => {
    expect(() => validarAmbiente({ ...process.env, JWT_SECRET: '' })).toThrow(
      'JWT_SECRET deve conter pelo menos 32 bytes',
    )
    expect(() => validarAmbiente({ ...process.env, CORS_ORIGIN: '*' })).toThrow(
      'CORS_ORIGIN deve ser uma origem HTTP ou HTTPS válida',
    )
  })
})
