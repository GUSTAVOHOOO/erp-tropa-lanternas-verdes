# Roteiro da apresentação final: Central de Oa

Roteiro para leitura e ensaio. Os slides estão no próprio app, na rota `/apresentacao` (código em `components/apresentacao/`; teclas: ← → navega, N notas do apresentador, O visão geral, F tela cheia, T cronômetro). Duração alvo: **45 min de fala + até 5 min de perguntas**, em três partes de ~15 min.

Números conferidos no repositório em 2026-11-11 (fontes ao lado de cada um). Antes de apresentar, rode os testes de novo e atualize os números que mudarem.

| Parte | Apresentador | Tempo | Slides |
|---|---|---|---|
| 1. Abertura, processo, documentação e ferramentas | Apresentador 1: _____ | 0:00–15:00 | 1–9 |
| 2. Front-end, conferido com a skill `frontend-web` | Apresentador 2: _____ | 15:00–30:00 | 10–17 |
| 3. Back-end, conferido com a skill `backend-api`, e fechamento | Apresentador 3: _____ | 30:00–45:00 | 18–25 |
| Perguntas | todos | 45:00–50:00 | — |

**Fio condutor (repetir na abertura e no fechamento):** cada requisito pedido nos trabalhos da disciplina virou uma regra escrita numa skill, e cada regra aparece no código, num teste ou num documento. O sistema foi construído e auditado contra essa lista.

---

## Parte 1: Abertura, processo e ferramentas (Apresentador 1, ~15 min)

### Slide 1: Capa (1 min)

- Central de Oa: Tropa dos Lanternas Verdes
- Disciplina Desenvolvimento Web (React e Next.js), Prof. Wellington
- Nomes do grupo

**Fala:** "Vamos mostrar um sistema completo, front e back, e principalmente como provamos que ele cumpre o que foi pedido ao longo do semestre."

### Slide 2: O produto em 1 minuto (2 min)

- Sistema web para registrar, acompanhar e atribuir **ocorrências intergalácticas**.
- Três públicos:
  - **Visitante:** conhece a Tropa, os 25 Lanternas e Oa (site público).
  - **Lanterna:** trabalha nas ocorrências **do próprio setor**.
  - **Guardião:** vê todos os setores, atribui responsáveis e gere usuários.
- Identidade visual própria (OANET): terminal cinematográfico, feito inteiro em código (HTML, CSS, SVG e Canvas).

Fonte: `PRODUCT.md`, `README.md`. Mostrar um print da home e outro do painel.

### Slide 3: Arquitetura em uma imagem (2 min)

```
Navegador ──► Next.js 16 (App Router)  ──►  API NestJS 12  ──►  SQLite (TypeORM)
              Server Components              controller → service → repository
              Server Actions                 JWT + papéis + envelope
              cookie httpOnly (JWT)
```

- O navegador **nunca** vê o token nem chama a API: só o servidor do Next fala com ela (ADR 0001).
- Contrato único entre as duas pontas: OpenAPI v1 com **30 operações e 310 cenários** de exemplo (`docs/contratos/`).

**Fala:** "Front e back foram feitos em paralelo, por pessoas diferentes, porque os dois lados obedeciam ao mesmo contrato escrito."

### Slide 4: Como trabalhamos: contrato primeiro (2 min)

Linha do tempo (de `docs/PLANO.md` e `docs/INTEGRACAO.md`):

1. **Decisões e regras:** 42 decisões registradas (`docs/backend/ESCOPO.md`) e cerca de 36 regras de negócio (`REGRAS-DE-NEGOCIO.md`).
2. **Contrato v1:** OpenAPI, exemplos e validador. O aceite G-1 fixa a versão com um hash SHA-256 para os dois lados usarem exatamente a mesma revisão.
3. **Duas frentes em paralelo:** o front contra um servidor falso do contrato, o back contra os testes do contrato.
4. **Corte 1:** a ligação real foi feita de uma vez (login, cadastro, catálogo, ocorrências e dashboard), seguida de aditivos (linha do tempo, comentários, Minha fila, gestão).
5. **Entrega:** a demonstração `json-server` foi removida e o E2E real roda contra a API.

- 126 commits, PRs #1 a #19 no GitHub, todos revisados antes do merge.

### Slide 5: Documentação como parte do sistema (2 min)

- `docs/README.md` é o índice, com uma fonte canônica para cada assunto:
  - **O que foi decidido:** ESCOPO e ADRs.
  - **Qual regra vale:** REGRAS-DE-NEGOCIO.
  - **Formato HTTP:** OpenAPI, API.md e DTOS.md.
  - **Dados:** MODELO-DE-DADOS e SEED.
  - **Telas:** frontend/TELAS e UI.md.
- `GLOSSARY.md`: a linguagem do domínio (Setor, Ficha, Guardião, Ocorrência).
- Verificações automáticas da própria documentação:
  - `node docs/agents/validar-documentacao.mjs --ancoras` confere os links e as âncoras.
  - `python docs/contratos/validar.py` confere o contrato, os exemplos e o hash.

**Fala:** "A documentação não foi escrita no fim. Ela veio antes do código e é verificada por script."

### Slide 6: As duas skills, que são o coração da apresentação (2 min)

- **`frontend-web`:** cerca de 150 regras com ID (COMP, JS, ROTA, API, AUTH, FORM, CSS, PROD, STACK, DEC). Cada regra informa a origem:
  - `[SLIDE]`: os 7 decks da disciplina (JS/DOM, CSS/Tailwind, JSX, Props/State, Rotas, Formulários RHF+Zod, Consumo de APIs).
  - `[DOCS]`: a documentação do Next instalado.
  - `[DECISÃO]`: uma escolha do grupo.
- **`backend-api`:** as regras das aulas de API REST e da atividade da Biblioteca (camadas, contrato HTTP, entrada, erros e envelope, dados, autenticação).
- Cada skill tem uma tabela "Errado × Certo" e uma tabela **"Prove"** com os cenários que precisam ser testados.
- O código carrega **marcadores** das regras: há mais de 400 ocorrências, como `// [AUTH-05]` e `// [FORM-17]`, em 111 arquivos do front.

**Fala:** "Transformamos os requisitos do professor numa lista que qualquer pessoa, ou agente, consegue conferir."

### Slide 7: Ferramentas: desenvolvimento assistido por agentes (2 min)

| Ferramenta | Para que usamos |
|---|---|
| **Claude Code** | Coordenação, revisão e o código sensível (schemas, serviços, Server Actions, permissões) |
| **Orca** | Orquestração de vários agentes em paralelo: worktrees isoladas, terminais, navegador integrado para conferir as telas em 1536, 820 e 375 px |
| **Codex** | Coordenou a DOC-03 (contrato e planos) e o laboratório visual OANET |
| **Gemini (Antigravity) e Claude Haiku** | Workers do Orca: UI e testes com especificação fechada (Gemini) e documentação e tarefas mecânicas (Haiku) |
| **Git e GitHub** | Uma branch por tarefa, PRs empilhados, merge só depois da revisão |

Fonte: `docs/agents/HANDOFF-FE-PREPARACAO.md` §8 e `HANDOFF-FRONT.md`.

### Slide 8: Como o Orca organizou o trabalho (2 min)

- **Regra de ouro:** cada arquivo tem um único dono por tarefa (`docs/agents/TAREFA.md`), o que evita dois agentes editarem o mesmo arquivo.
- Especificação padrão por worker: **POSSE** (quais arquivos), **CONTRATO**, **IMPLEMENTAR**, **TESTES MÍNIMOS** e **aceite com comandos**.
- O coordenador escreve os testes antes, revisa cada diff e é o único que roda o build e o navegador (a máquina tinha pouca memória livre).
- Lições aprendidas (ser honesto rende pontos):
  - um worker gravou arquivos com a codificação errada, então passamos a conferir UTF-8 depois de cada entrega;
  - código de segurança não é delegado.
- **Auditoria com agentes:** 5 agentes em paralelo auditaram o front e o back contra o contrato (`docs/relatorios/auditoria-2026-11-11/`). Encontraram 13 defeitos no back, todos corrigidos e cobertos por 23 testes de regressão.

### Slide 9: Ferramentas de qualidade, e passagem para o front (1 min)

- **Vitest e Testing Library:** testes unitários e de componentes do front.
- **Playwright:** E2E contra o servidor falso do contrato e, separadamente, contra a API real (`npm run test:e2e:real`).
- **Jest e Supertest:** testes unitários e E2E do back, cada um com o próprio SQLite temporário.
- **ESLint, TypeScript estrito e `next build`.**

**Fala de passagem:** "Agora o [nome] mostra o front, regra por regra."

---

## Parte 2: Front-end conferido com a skill `frontend-web` (Apresentador 2, ~15 min)

Estrutura de cada slide: **requisito da skill → onde está no código → como provamos**.

### Slide 10: Stack e organização (1,5 min)

- Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind 4, React Hook Form e Zod 4, shadcn/Base UI.
- Rotas por grupo: `app/(site)` (público) e `app/(painel)` (privado). `lib/` contém os serviços, `components/` a apresentação e `components/oanet/` a identidade visual.
- `'use client'` só nas folhas interativas, nunca em layout ou página (ROTA-08).

### Slide 11: Dados e API, o requisito do deck "Consumo de APIs" (2,5 min)

| Requisito (ID) | No código |
|---|---|
| Um cliente HTTP único (API-17) | `lib/api.ts`: nenhuma página chama `fetch` diretamente |
| Um serviço por recurso (API-01) | `lib/ocorrencias.ts`, `lib/lanternas.ts`, `lib/dashboard.ts`... |
| Resposta validada com schema, sem `as Tipo` (API-04) | `requisitarApi(caminho, schema, ...)` faz o parse com Zod (`lib/schemas/`) |
| Erro com status e código estável (API-02, API-03, API-18) | `lib/api-error.ts`: `ApiError` com `codigo` e mensagens em português |
| Cache explícito (API-06) | O tipo `CacheApi` obriga escolher `no-store` ou `revalidate` em cada chamada |
| Busca no servidor, sem `useEffect` + `fetch` (API-05) | Server Components |
| Ambiente validado, sem `NEXT_PUBLIC_API_URL` (API-08) | `lib/env.ts`: o app não sobe sem `API_URL` e `SITE_URL` válidas |

**Mostrar:** `lib/api.ts` (cerca de 20 linhas de `requisitarApi`).

### Slide 12: Os quatro estados de cada tela (1,5 min)

- Loading, vazio, erro e sucesso em todas as telas com dados (API-09 a API-11 e ROTA-21).
- Cada rota do painel tem `loading.tsx` e `error.tsx`, com o botão "Tentar de novo" que funciona.
- Componentes reutilizados: `EsqueletoLista`, `EstadoVazio`, `TelaDeErro`, `Paginacao`.
- Paginação e filtros ficam **na URL**, não em `useState` (ROTA-14, API-19). `?pagina=abc` cai no padrão em vez de quebrar.

**Demo rápida:** filtrar ocorrências, copiar a URL e abrir em outra aba.

### Slide 13: Sessão e permissões, a regra mais importante (3 min)

> "A página decide o que mostrar, a API decide o que é permitido. O navegador nunca vê o token."

| Requisito (ID) | No código |
|---|---|
| JWT em cookie `httpOnly` gravado pelo servidor (AUTH-02, AUTH-12) | `lib/auth.ts` e `lib/cookie.ts`. ADR 0001 explica a escolha |
| O `proxy.ts` é só a checagem otimista (AUTH-01) | `proxy.ts`: confere se o cookie existe, não se é válido |
| `verificarSessao()` em toda página privada (AUTH-04) | `lib/dal.ts`: pergunta à API quem é o usuário |
| 401 apaga o cookie (AUTH-13) | `app/sessao-expirada/route.ts` redireciona para `/login?expirou=1` |
| 403 vai para a tela própria (AUTH-06) | `exigirPapel()` redireciona para `/acesso-negado` |
| Server Action confere a sessão na primeira linha (AUTH-05) | É o marcador mais citado no código (24 vezes) |
| Escopo pelo usuário da sessão, nunca pela URL (AUTH-07) | `lib/escopo.ts` |
| Mutação só por Server Action (AUTH-14) | Os `actions.ts` de cada rota |

**Demo:** entrar como Hal (Lanterna), tentar abrir `/painel/usuarios` e ver o acesso negado. Depois entrar como Ganthet (Guardião).

### Slide 14: Formulários, requisito do deck "Formulários RHF + Zod" (2 min)

- RHF com `zodResolver` e coerção na entrada (FORM-01, FORM-06, FORM-13).
- **O mesmo schema** valida no cliente e de novo na Server Action com `safeParse` (FORM-17, FORM-18).
- O erro da API volta para o campo certo com `setError`, e o erro geral vai para `root` (FORM-19). Exemplo: e-mail já cadastrado no cadastro.
- Acessibilidade: label, `aria-invalid`, `aria-describedby` e botão desabilitado contra envio duplo (FORM-08 a FORM-10).

**Mostrar:** `lib/schemas/cadastro.ts` e o formulário de nova ocorrência com um erro de campo.

### Slide 15: Estilo, acessibilidade e produção (2 min)

- Tailwind pela escala, sem `style={{}}` e com componentes para o que se repete (CSS-01, 02, 04 e 10).
- Mobile-first: as telas foram conferidas em 375 px (CSS-03), a cor nunca é o único sinal (os badges de status e gravidade têm ícone e texto, CSS-12) e o foco é sempre visível (CSS-14).
- Segurança HTTP em `next.config.ts`: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e **CSP em modo relatório** antes de impor (PROD-02, PROD-03).
- SEO: `metadata` com template, `app/robots.ts` e `app/sitemap.ts`, e o painel fora do índice (PROD-04).
- Identidade OANET: as 12 rotas migradas para a UI oficial (decisão D28), com tokens e animações que respeitam `prefers-reduced-motion`.

### Slide 16: Prova: a tabela "Prove" da skill (2 min)

| Cenário da skill | Resultado no nosso front |
|---|---|
| Sem cookie em rota privada | `/login` |
| API responde 401 | `/sessao-expirada`, cookie apagado, depois `/login` |
| 403 | `/acesso-negado` |
| 404 | `notFound()` |
| 409 ou 422 com código | mensagem no campo, em português |
| 429 no login | mensagem pedindo para aguardar, sem nova tentativa automática |
| API fora do ar | `error.tsx` com "Tentar de novo" |
| Variável de ambiente ausente | a aplicação não sobe |

Números (registro do Corte 1 em `docs/INTEGRACAO.md`):

- **529 testes unitários** em 71 arquivos;
- **40 cenários E2E** contra a API real;
- lint e `tsc` sem erros.

**Fala de passagem:** "Tudo isso só funciona porque do outro lado há uma API que segue as mesmas regras. [nome], é contigo."

### Slide 17: Reserva para demonstração ao vivo (0,5 min, ou pule)

Roteiro curto, se der tempo:

1. Login.
2. Dashboard.
3. Nova ocorrência.
4. Atribuir (como Guardião).
5. Comentar.
6. Linha do tempo.

---

## Parte 3: Back-end conferido com a skill `backend-api` (Apresentador 3, ~15 min)

### Slide 18: Stack e mapa dos módulos (1,5 min)

- NestJS 12, TypeORM, SQLite (better-sqlite3), class-validator, `@nestjs/jwt`, bcrypt, Helmet e `@nestjs/throttler`.
- Um módulo por assunto, com controller, service e repository: `auth`, `usuarios`, `setores`, `lanternas`, `ocorrencias`, `eventos`, `comentarios`, `dashboard` e `saude`. O que é comum fica em `src/comum/`.
- **30 operações** do contrato implementadas (9 controllers).

**Fala:** "É a mesma arquitetura pedida na atividade da Biblioteca, aplicada a um domínio maior e com login."

### Slide 19: Camadas: "o controller traduz, o service decide, o repository guarda" (2 min)

| Requisito (skill e atividade) | No código |
|---|---|
| Controller fino, sem `if` de regra | os `*.controller.ts` fazem uma chamada ao service por método |
| Regra no service, sem `@Req`/`@Res` | ex.: `ocorrencias/ciclo-vida.service.ts` (transições de status) |
| Só o repository fala com o banco e devolve nulo, sem lançar 404 | os `*.repository.ts` |
| Injeção pelo construtor, sem `new` | os módulos exportam os services (permite testar com objetos falsos) |
| Formato no DTO, regra no service | os DTOs com class-validator e as regras de negócio (RN) nos services |

### Slide 20: Contrato HTTP e entrada (2 min)

- Substantivos no plural, o método diz a ação, filtros vão na query e o status é o real (200, 201, 204, 400, 401, 403, 404, 409, 422, 429).
- `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`: um campo extra dá 400 (contra mass assignment).
- **Sem conversão implícita de tipo no corpo.** Isso veio de um defeito real da auditoria: `"2814"` era aceito como número. Query e path são convertidos de forma explícita.
- Interceptor global recusa **parâmetro de query desconhecido**.
- Texto só com espaços é recusado (`@Aparar()` antes da validação).

Fonte: `backend/src/comum/configurar-http.ts`.

### Slide 21: Erros e envelope, Parte 4 da atividade (2 min)

| Atividade e skill | No código |
|---|---|
| Middleware de log (método, rota, status, ms, sem dado sensível) | `comum/log.middleware.ts` |
| Exceção própria com `codigo` estável | `comum/erro-dominio.ts` (`CREDENCIAIS_INVALIDAS`, `TRANSICAO_INVALIDA`...) |
| Filtro global com envelope de erro e 500 genérico | `comum/filtro-excecoes.ts` |
| Interceptor global com envelope de sucesso | `comum/interceptor-envelope.ts` |
| Nenhum `try/catch` nos controllers | conferível com grep |

Mostrar lado a lado:

```json
{ "sucesso": true, "dados": { ... } }
{ "sucesso": false, "erro": { "status": 409, "codigo": "...", "mensagem": "...", "detalhes": [...] }, "caminho": "...", "timestamp": "..." }
```

**Ponto-chave:** o front valida exatamente esse envelope com Zod (`lib/api.ts`). As duas skills se encaixam.

### Slide 22: Dados e persistência, Parte 5 da atividade (2 min)

- SQLite via TypeORM com **migrations versionadas** (`src/database/migrations/`), sem sincronização automática de esquema.
- **Seed** com os 25 Lanternas pesquisados (`docs/backend/SEED.md`), executado de forma idempotente.
- **Transações curtas** onde há escritas dependentes (lanternas, comentários).
- **Concorrência:** `UPDATE ... WHERE` com conferência de `affected === 1` na transição de status, então só uma de duas requisições simultâneas vence.
- **Soft delete** em ocorrências e comentários (`@DeleteDateColumn`), porque o histórico continua citando esses registros.
- Paginação com máximo validado e ordenação por lista permitida; `?pagina=` gigante responde 400, não 500.
- O ambiente é validado ao subir (`config/ambiente.ts`): sem `JWT_SECRET` ou `CORS_ORIGIN` a API não sobe.

### Slide 23: Autenticação e permissões (2,5 min)

Ordem da skill: **quem é você (401) → o que pode (403) → este recurso é seu (404).**

| Requisito | No código |
|---|---|
| Guard global e rota pública explícita | `APP_GUARD` com `JwtGuard` e `PapeisGuard`, decorator `@Publica()` |
| Senha com bcrypt | `auth/senha.service.ts` |
| Login sem revelar se a conta existe | 401 único `CREDENCIAIS_INVALIDAS` e comparação com **hash isca** quando o e-mail não existe |
| Limite de tentativas | `ThrottlerGuard` no login, que responde 429 |
| Algoritmo fixo e expiração | `HS256` na verificação, `exp` obrigatório, 8 h |
| Papel fora do DTO e dono vindo do token | `@UsuarioAtual()`; o Lanterna só enxerga o próprio setor |
| CORS só para a origem do front, mais Helmet | `configurar-http.ts` |

### Slide 24: Prova: a tabela "Prove" da skill no back (2 min)

| Cenário | Esperado | Onde é testado |
|---|---|---|
| Entrada válida | 200 / 201 / 204 | e2e de cada módulo |
| Campo extra ou formato inválido | 400 com `detalhes` | `http.e2e-spec.ts` |
| Sem token ou token adulterado | 401 | `auth.e2e-spec.ts` |
| Sem o papel; recurso de outro setor | 403; 404 | `usuarios`, `ocorrencias` |
| Duplicado ou transição inválida | 409 / 422 | `ocorrencias.e2e-spec.ts` |
| Contrato inteiro | resposta bate com o OpenAPI | `contrato.e2e-spec.ts` |

- 17 suítes E2E em `backend/test/`, cada uma sobe a API numa porta livre com SQLite temporário, mais testes unitários de services e guards.
- A auditoria encontrou **13 defeitos**; todos foram corrigidos e cobertos pelos **23 casos** de `correcoes-auditoria.e2e-spec.ts`, dos quais 20 falhavam antes da correção.

---

## Fechamento (Apresentador 3, ou os três juntos, ~2 min)

### Slide 25: Conclusão (2 min)

- Os requisitos da disciplina viraram **duas skills com regras identificadas**.
- As regras viraram **código com marcadores**, **testes** e **documentos verificados por script**.
- Front e back foram construídos em paralelo sobre **um contrato com hash**, e a ligação real foi feita de uma vez.
- Agentes (Orca, Claude Code, Codex, Gemini, Haiku) aceleraram o trabalho, **sempre com revisão humana e teste antes do merge**.
- A Tropa reunida: os 25 Lanternas acendem em onda no rodapé do slide.

### Slide 26: Encerramento, o nascimento de uma galáxia (~25 s)

- Sem texto para ler: a galáxia nasce em tela cheia (teia cósmica, colapso, primeiras estrelas, braços espirais, núcleo), o juramento entra em dois tempos e "Perguntas?" aparece quando ela amadurece.
- Agradecimentos e abertura para perguntas.

---

## Checklist antes do dia

- [ ] Preencher os nomes dos apresentadores e redistribuir os slides se alguém quiser outra parte.
- [ ] Rodar de novo e atualizar os números:
  - na raiz: `npm run test:run`, `npm run lint` e `npm run test:e2e:real`;
  - em `backend/`: `npm test` e `npm run test:e2e`.
- [ ] Banco limpo com o seed completo para a demo (`npm run seed -- --etapa completa`) e contas Ganthet, Hal e Kilowog testadas.
- [ ] Prints: home, catálogo, painel, nova ocorrência com erro de campo, acesso negado e a tela em 375 px.
- [ ] Ensaiar com cronômetro: cada parte com no máximo 15 min.

## Perguntas prováveis (preparar resposta)

- **Por que o token não fica no navegador?** O ADR 0001: com o cookie `httpOnly`, o JavaScript da página não consegue ler o token (protege contra XSS), e só o servidor do Next fala com a API.
- **E se o agente errar?** Cada arquivo tem um dono, o coordenador revisa cada diff, os testes vêm antes e o código de segurança não é delegado.
- **O `proxy.ts` não basta para proteger as rotas?** Não. Ele só olha se o cookie existe. A validação real é `verificarSessao()` mais a API (AUTH-01, AUTH-04).
- **Por que SQLite?** A atividade permite PostgreSQL ou SQLite. As migrations do TypeORM deixam a troca para Postgres localizada.
- **O que ainda falta?** O aceite G9 depende da execução final registrada em `docs/INTEGRACAO.md`. A CSP segue em modo relatório, porque a PROD-03 manda observar antes de impor. Alguns riscos foram aceitos conscientemente e estão na auditoria com o motivo; exemplo: o login com corpo inválido consome a cota do throttler.
- **Como sabem que front e back falam a mesma língua?** Pelo contrato OpenAPI com hash (G-1), pelo `contrato.e2e-spec.ts` no back, pelos schemas Zod no front e pelos 40 cenários E2E contra a API real.
