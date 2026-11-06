# NestJS + TypeORM

Armadilhas reproduzidas em código real, com NestJS 12.4, TypeORM 1.1 e PostgreSQL, e os trechos que resolvem cada uma. Os trechos mostram a técnica: mantenha as rotas e o formato de resposta do projeto.

Conteúdo: armadilhas, baixa atômica, configuração assíncrona, filtro de erros, registro da esteira, DTO de query, hash e unicidade, testes.

## Armadilhas

| Código comum | O que acontece | Faça assim |
|---|---|---|
| Ler saldo, checar e `decrement` em `transaction` | 10 concorrentes passaram com saldo 5; saldo foi a **-5** | [UPDATE condicional](#baixa-atômica) |
| `JwtModule.register({ secret: process.env.X })` em módulo filho | O `.env` ainda não foi lido: `secretOrPrivateKey must have a value` | [`registerAsync`](#configuração-assíncrona) |
| Filtro com `erro.message` | Vira `"Excecao Dominio"` ou `"Bad Request Exception"`; `codigo` e `detalhes` somem | [`getResponse()`](#filtro-de-erros) |
| `where: { nome: cond ? valor : undefined }` | TypeORM 1.x **lança erro**. Na 0.3 ignora o filtro, e `findOneBy({ id: undefined })` pode devolver a primeira linha | `...(cond && { nome })` |
| Entidades que se importam, tipadas `grupo: Grupo`, em ESM | `Cannot access 'A' before initialization` | `grupo: Relation<Grupo>` com `import type` |
| `@IsInt()` em DTO de query sem `@Type` | Até `?pagina=2` dá 400 | `@Type(() => Number)` antes de `@IsInt()` |
| Em API nova, `POST /login` sem `@HttpCode` | Responde 201 | `@HttpCode(200)` |
| `select: false` no hash, com `find` no login | `senhaHash` vem `undefined`, e nenhum login passa | `addSelect('u.senhaHash')` |
| Confiar em `select: false` após `save()` | O objeto do `save` **contém o hash** | responder com campos explícitos |
| Coluna `decimal` tipada como `number` | Vem **string** (`"24.90"`) | tipar `string`; contas em centavos |
| Só checar duplicado no service | Concorrência vira 500 | [capturar `23505`](#violação-de-unicidade) |
| `useGlobalFilters(new X())` em `main.ts` | Sem injeção, e testes que não rodam `main.ts` ficam sem ele | [`APP_*`](#registro-da-esteira) |

`softDelete` com `affected === 0` detecta exclusão repetida (retorna 1, depois 0). `forFeature` é o que permite injetar `Repository`. Em ESM, use sufixo `.js` em imports relativos e `import type` para tipos em assinaturas decoradas. `forRoutes('*path')` é o curinga do Express 5.

Pacotes: `class-validator`, `class-transformer`, `@nestjs/mapped-types`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/throttler`, `helmet`, `bcrypt`.

## Baixa atômica

```ts
async baixarDisponivel(id: number, qtd: number, manager: EntityManager) {
  const r = await manager
    .createQueryBuilder()
    .update(Recurso)
    .set({ disponivel: () => 'disponivel - :qtd' })
    .where('id = :id AND disponivel >= :qtd', { id, qtd })
    .execute()
  return r.affected === 1
}
```

Em teste com 20 requisições para saldo 5, exatamente 5 passaram. Para regra que não cabe no `WHERE`:

```ts
await manager.findOne(Recurso, { where: { id }, lock: { mode: 'pessimistic_write' } })
```

## Configuração assíncrona

```ts
JwtModule.registerAsync({
  global: true,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1h', algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'] },
  }),
})
```

## Filtro de erros

```ts
private traduzir(erro: unknown): CorpoErro {
  if (!(erro instanceof HttpException)) return { status: 500, mensagem: 'Erro interno' }
  const status = erro.getStatus()
  const r = erro.getResponse()
  if (typeof r === 'string') return { status, mensagem: r }
  const o = r as { message?: string | string[]; mensagem?: string; codigo?: string }
  if (Array.isArray(o.message)) return { status, mensagem: 'Dados inválidos', detalhes: o.message }
  return { status, mensagem: o.mensagem ?? o.message ?? erro.message, codigo: o.codigo }
}
```

## Registro da esteira

Em API nova, `APP_*` dá injeção à esteira e a faz valer nos testes. Guards rodam na ordem declarada. `APP_*` vale para a aplicação inteira, mesmo declarado em um módulo; em código existente, prefira `@UseGuards` e `@UseFilters` no controller.

```ts
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useClass: AuthGuard },
  { provide: APP_GUARD, useClass: PapeisGuard },
  { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) },
  { provide: APP_INTERCEPTOR, useClass: RespostaInterceptor },
  { provide: APP_FILTER, useClass: TodosErrosFilter },
]
```

Rotas abertas usam um decorator `@Publico()` lido pelo `AuthGuard` com `Reflector`, e papéis usam `@Papeis('admin')`.

## DTO de query

```ts
export class PaginacaoDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina: number = 1

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limite: number = 20
}
```

Arrays aninhados usam `@ValidateNested({ each: true })`, `@Type(() => ItemDto)` e `@ArrayMaxSize`. Update usa `PartialType` de `@nestjs/mapped-types`.

## Hash e unicidade

```ts
buscarComSenha(email: string) {
  return this.orm.createQueryBuilder('u').addSelect('u.senhaHash').where('u.email = :email', { email }).getOne()
}
```

### Violação de unicidade

```ts
const codigo = (e as QueryFailedError & { driverError?: { code?: string } }).driverError?.code
if (e instanceof QueryFailedError && codigo === '23505') throw new ConflictException('E-mail já cadastrado')
throw e
```

## Testes

```ts
it('não exclui o que não existe', async () => {
  const excluir = jest.fn()
  const service = new RecursosService({ buscarPorId: async () => null, excluir } as never, {} as never)

  await expect(service.remover(1)).rejects.toThrow(NotFoundException)
  expect(excluir).not.toHaveBeenCalled()
})
```

Para rollback e concorrência, suba o `AppModule` com `supertest` em PostgreSQL real, em container ou com `embedded-postgres`.
