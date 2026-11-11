import { jest } from '@jest/globals'
import { AuthService } from './auth.service.js'
import type { CadastroDto } from './dto/cadastro.dto.js'
import type { LoginDto } from './dto/login.dto.js'

describe('AuthService', () => {
  const setor = { id: 2814, nome: 'Setor 2814', descricao: 'Fixture' }
  const usuarioSalvo = {
    id: '7d8aa9bc-cddb-4de7-8b3b-401c2942c533',
    nome: 'Lanterna Teste',
    email: 'lanterna@example.test',
    senhaHash: 'hash-privado',
    papel: 'lanterna' as const,
    lanternaId: null,
    setorId: 2814,
    criadoEm: new Date('2026-11-10T12:00:00.000Z'),
  }
  let usuarios: {
    buscarPorEmail: jest.Mock<(email: string) => Promise<typeof usuarioSalvo | null>>
    buscarPorEmailComHash: jest.Mock<(email: string) => Promise<typeof usuarioSalvo | null>>
    salvar: jest.Mock<(dados: Record<string, unknown>) => Promise<typeof usuarioSalvo>>
  }
  let setores: { buscarPorId: jest.Mock<(id: number) => Promise<typeof setor | null>> }
  let jwt: { signAsync: jest.Mock<(payload: object, options: object) => Promise<string>> }
  let senhas: {
    hash: jest.Mock<(senha: string) => Promise<string>>
    comparar: jest.Mock<(senha: string, hash: string) => Promise<boolean>>
    compararComIsca: jest.Mock<(senha: string) => Promise<boolean>>
  }
  let service: AuthService

  beforeEach(() => {
    usuarios = {
      buscarPorEmail: jest.fn<(email: string) => Promise<typeof usuarioSalvo | null>>().mockResolvedValue(null),
      buscarPorEmailComHash: jest.fn<(email: string) => Promise<typeof usuarioSalvo | null>>().mockResolvedValue(null),
      salvar: jest.fn<(dados: Record<string, unknown>) => Promise<typeof usuarioSalvo>>().mockResolvedValue(usuarioSalvo),
    }
    setores = {
      buscarPorId: jest.fn<(id: number) => Promise<typeof setor | null>>().mockResolvedValue(setor),
    }
    jwt = {
      signAsync: jest.fn<(payload: object, options: object) => Promise<string>>().mockResolvedValue('jwt-real'),
    }
    senhas = {
      hash: jest.fn<(senha: string) => Promise<string>>().mockResolvedValue('bcrypt-hash'),
      comparar: jest.fn<(senha: string, hash: string) => Promise<boolean>>().mockResolvedValue(false),
      compararComIsca: jest.fn<(senha: string) => Promise<boolean>>().mockResolvedValue(false),
    }
    service = new AuthService(usuarios as never, setores as never, jwt as never, senhas as never)
  })

  it('cadastra sempre uma conta Lanterna sem Ficha e só devolve os campos públicos', async () => {
    const dados: CadastroDto = {
      nome: ' Lanterna Teste ',
      email: 'LANTERNA@EXAMPLE.TEST',
      senha: 'segredo-preservado',
      setorId: 2814,
    }

    const resposta = await service.cadastrar(dados)

    expect(setores.buscarPorId).toHaveBeenCalledWith(2814)
    expect(senhas.hash).toHaveBeenCalledWith(dados.senha)
    expect(usuarios.salvar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Lanterna Teste',
        email: 'lanterna@example.test',
        papel: 'lanterna',
        setorId: 2814,
        lanternaId: null,
        senhaHash: 'bcrypt-hash',
      }),
    )
    expect(resposta).toEqual({
      id: usuarioSalvo.id,
      nome: usuarioSalvo.nome,
      email: usuarioSalvo.email,
      papel: 'lanterna',
      lanternaId: null,
      setorId: 2814,
      criadoEm: usuarioSalvo.criadoEm.toISOString(),
    })
    expect(resposta).not.toHaveProperty('senhaHash')
    expect(resposta).not.toHaveProperty('token')
  })

  it('valida Setor e e-mail antes de calcular hash', async () => {
    setores.buscarPorId.mockResolvedValue(null)
    await expect(
      service.cadastrar({ nome: 'Lanterna', email: 'a@example.test', senha: '12345678', setorId: 99 }),
    ).rejects.toMatchObject({ status: 404, codigo: 'NAO_ENCONTRADO' })
    expect(senhas.hash).not.toHaveBeenCalled()

    setores.buscarPorId.mockResolvedValue(setor)
    usuarios.buscarPorEmail.mockResolvedValue(usuarioSalvo)
    await expect(
      service.cadastrar({ nome: 'Lanterna', email: 'A@example.test', senha: '12345678', setorId: 2814 }),
    ).rejects.toMatchObject({ status: 409, codigo: 'EMAIL_JA_CADASTRADO' })
    expect(senhas.hash).not.toHaveBeenCalled()
  })

  it('faz comparação com hash isca quando o e-mail não existe', async () => {
    const dados: LoginDto = { email: 'ausente@example.test', senha: 'senha-de-teste' }

    await expect(service.entrar(dados)).rejects.toMatchObject({
      status: 401,
      codigo: 'CREDENCIAIS_INVALIDAS',
      message: 'E-mail ou senha inválidos',
    })
    expect(senhas.compararComIsca).toHaveBeenCalledWith(dados.senha)
    expect(senhas.comparar).not.toHaveBeenCalled()
  })

  it('retorna token de 8 horas e claims mínimas após validar hash', async () => {
    usuarios.buscarPorEmailComHash.mockResolvedValue(usuarioSalvo)
    senhas.comparar.mockResolvedValue(true)

    const resposta = await service.entrar({ email: 'LANTERNA@example.test', senha: 'senha-correta' })

    expect(senhas.comparar).toHaveBeenCalledWith('senha-correta', 'hash-privado')
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: usuarioSalvo.id, email: usuarioSalvo.email, papel: usuarioSalvo.papel },
      { algorithm: 'HS256', expiresIn: '8h' },
    )
    expect(resposta).toMatchObject({ token: 'jwt-real', expiresIn: 28_800 })
    expect(resposta.usuario).not.toHaveProperty('senhaHash')
  })
})
