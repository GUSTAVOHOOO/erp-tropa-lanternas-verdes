# Traduzindo os conceitos para outras stacks

Leia só a seção da sua stack. Em frameworks que juntam modelo e dados, mantenha a responsabilidade (consulta e regra fora do controller) sem criar repositórios só para copiar a estrutura.

## Express

- **Rotas:** `express.Router()`, um arquivo por assunto.
- **Validação:** middleware com Zod, Joi ou express-validator. Remova campos desconhecidos (`.strict()` no Zod).
- **Middleware e guards:** funções `(req, res, next)`; autenticação e papel são middlewares aplicados à rota ou ao router.
- **Erro central:** middleware de 4 argumentos `(err, req, res, next)`, registrado por último. No Express 5, rejeições de handlers assíncronos chegam nele sozinhas; no 4, é preciso repassar com `next(err)`.
- **Injeção de dependência:** sem container nativo. Monte as peças em um ponto de composição e passe pelo construtor.
- **Dados:** Prisma, Drizzle, Knex ou TypeORM.
- **Atenção:** nada vem por padrão. Sem `helmet`, limitador e tratador de erros, a API fica exposta.

## Fastify

- **Rotas:** plugins por assunto, com `fastify.register`.
- **Validação:** JSON Schema nativo na rota, com `additionalProperties: false`.
- **Middleware:** hooks `onRequest`, `preHandler`, `onSend`, `onResponse`.
- **Guards:** hook `preHandler`, com `@fastify/jwt`.
- **Erro central:** `setErrorHandler`.
- **Formato de resposta:** hook `onSend` ou schema de resposta. O schema também remove campos não declarados, o que evita vazamentos.

## Spring Boot

- **Rotas:** `@RestController`, `@GetMapping`, `@PostMapping`.
- **Validação:** `@Valid` com Bean Validation (`@NotBlank`, `@Positive`). Recuse campos desconhecidos com `FAIL_ON_UNKNOWN_PROPERTIES`.
- **Middleware:** `Filter` do servlet e `HandlerInterceptor`.
- **Guards:** Spring Security com `SecurityFilterChain` e `@PreAuthorize`. Negue por padrão com `anyRequest().authenticated()`.
- **Erro central:** `@RestControllerAdvice` com `@ExceptionHandler`.
- **Formato de resposta:** `ResponseBodyAdvice`.
- **Dados:** Spring Data JPA.
- **Transações:** `@Transactional`, que só funciona em chamada vinda de outro bean.
- **Concorrência:** `@Version` para otimista, `@Lock(PESSIMISTIC_WRITE)` para pessimista.
- **N+1:** `@EntityGraph` ou `JOIN FETCH`.
- **Hash:** `BCryptPasswordEncoder`.

## Laravel

- **Rotas:** `routes/api.php`, com `Route::apiResource`.
- **Validação:** Form Requests. Use `$request->validated()`, nunca `$request->all()`.
- **Middleware e guards:** middleware `auth:sanctum`.
- **Autorização:** Policies e Gates, que também cuidam do dono do recurso.
- **Erro central:** configuração de exceções em `bootstrap/app.php` nas versões recentes; `App\Exceptions\Handler` nas antigas.
- **Formato de resposta:** API Resources.
- **Dados:** Eloquent. O modelo já é a camada de dados: use query scopes em vez de repositórios, salvo se o projeto já os usa.
- **Transações:** `DB::transaction()`, com `lockForUpdate()`.
- **N+1:** `with()` e `Model::preventLazyLoading()`.
- **Soft delete:** trait `SoftDeletes`.
- **Mass assignment:** `$fillable`.

## FastAPI

- **Rotas:** `APIRouter`, um arquivo por assunto.
- **Validação:** modelos Pydantic, com `extra='forbid'` para recusar campos desconhecidos.
- **Middleware:** `@app.middleware('http')`.
- **Guards e injeção de dependência:** `Depends(...)`. Aplique em `dependencies=[...]` no router para proteger tudo.
- **Erro central:** `@app.exception_handler`.
- **Formato de resposta:** `response_model`, que também filtra campos.
- **Dados:** SQLAlchemy.
- **Transações:** `async with session.begin()`, com `with_for_update()` para lock.
- **N+1:** `selectinload` e `joinedload`.
- **Migrations:** Alembic.
- **Hash:** bcrypt ou Argon2 (argon2-cffi).

## Django REST Framework

- **Rotas:** `ViewSet` com `router`.
- **Validação:** `Serializer`. Campos que não devem ser enviados ficam em `read_only_fields`.
- **Middleware:** `MIDDLEWARE` em settings.
- **Guards:** `permission_classes`. Defina `DEFAULT_PERMISSION_CLASSES` como `IsAuthenticated` para negar por padrão; regras de dono ficam em `has_object_permission`.
- **Erro central:** `EXCEPTION_HANDLER` em settings.
- **Formato de resposta:** `Renderer` customizado.
- **Dados:** Django ORM. Regras ficam em uma camada de serviços ou no modelo, nunca na view.
- **Transações:** `transaction.atomic()`, com `select_for_update()` e `F('saldo') - qtd` para atualização atômica.
- **N+1:** `select_related` e `prefetch_related`.
- **Paginação:** `DEFAULT_PAGINATION_CLASS`, com `max_page_size`.

