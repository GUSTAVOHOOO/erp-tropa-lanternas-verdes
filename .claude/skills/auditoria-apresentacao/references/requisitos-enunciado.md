# Requisitos do enunciado

Disciplina "Desenvolvimento Web com React & Next.js", Prof. Wellington de Souza Ferreira.
Projeto: front-end do "ERP da Tropa dos Lanternas Verdes" (controle de ocorrências intergalácticas).

## Texto literal

> Texto conforme repassado pelo grupo. Se o PDF/enunciado original estiver disponível, confira se a
> redação bate e substitua aqui pelo original.

- Homepage: ponto de entrada, com navegação clara para as demais áreas.
- Páginas públicas: pelo menos duas, acessíveis sem autenticação (listagens, institucional, detalhes...).
- Área privada: acessível só para autenticados, acesso protegido.
- Sistema de login: tela de login funcional que controla o acesso à área privada.
- Controle de acesso (middleware ou equivalente): verificar se está autenticado, permitir/bloquear rotas privadas, redirecionar não autenticados para o login.
- Texto do professor: aplicar componentização, organização/estrutura de projeto, estado local, hooks e navegação entre telas; pensar o front para ser reutilizado na próxima etapa (back-end), evitando retrabalho.

## Como auditar cada requisito

IDs de regra são da skill `padroes-wellington`. Os caminhos seguem DEC-09 e STACK-05; se o
projeto usar outros, procure pelo papel do arquivo e anote o caminho real.

### REQ-01: Homepage
- **Onde:** `app/(site)/page.tsx` (rota `/`), header em `app/(site)/layout.tsx`.
- **Evidência:** `<Link>` para `/sobre`, `/setores`, `/login` e `/painel` (na página ou no header); nenhum `<a href>` interno.
- **Regras:** DEC-09, ROTA-16, ROTA-06, COMP-12, CSS-07.
- **Comando:** `rg -n "<Link" "app/(site)/page.tsx" "app/(site)/layout.tsx" components`

### REQ-02: Páginas públicas (pelo menos duas)
- **Onde:** `/sobre` (institucional), `/setores` (listagem), `/setores/[id]` (detalhe).
- **Evidência:** ficam em `app/(site)/`; não chamam `verificarSessao`; o `matcher` do `proxy.ts` não as inclui; abrem numa janela anônima.
- **Regras:** DEC-09, ROTA-04, ROTA-07, API-05, API-09, ROTA-09, ROTA-10, ROTA-12, ROTA-21.
- **Comando:** `rg --files "app/(site)" -g page.tsx` e `rg -n "matcher" proxy.ts`

### REQ-03: Área privada com acesso protegido
- **Onde:** tudo em `app/(painel)/` (rotas `/painel/...`).
- **Evidência:** toda `page.tsx` do grupo chama `verificarSessao()` ou `exigirPapel()`; toda Server Action do grupo também; Lanterna só vê o próprio setor.
- **Regras:** ROTA-04, AUTH-04, AUTH-05, AUTH-07, DEC-03.
- **Comando:** `rg -L "verificarSessao|exigirPapel" "app/(painel)" -g page.tsx` (deve sair vazio)

### REQ-04: Sistema de login funcional
- **Onde:** `app/(site)/login/page.tsx`, `_components/FormLogin.tsx`, `actions.ts`, `lib/schemas/login.ts`, `lib/sessao.ts`, `lib/usuarios.ts`.
- **Evidência:** formulário RHF + Zod; action `entrar` com `safeParse`, cria cookie assinado e redireciona com `replace`; credencial errada mostra mensagem; botão "Sair" apaga a sessão.
- **Regras:** AUTH-08, AUTH-02, AUTH-03, AUTH-09, FORM-01 a FORM-11, FORM-17 a FORM-19, ROTA-19.
- **Teste manual:** M-05 de `checks.md`.

### REQ-05: Controle de acesso (middleware ou equivalente)
Quebre em três itens, como o enunciado:
- **(a) verificar se está autenticado:** `decodificarSessao` em `proxy.ts` (otimista) e `verificarSessao` em `lib/dal.ts` (definitivo). Regras AUTH-01, AUTH-03, AUTH-04.
- **(b) permitir/bloquear rotas privadas:** `config.matcher` do `proxy.ts`; `verificarSessao`/`exigirPapel` nas páginas e actions; `/acesso-negado` para logado sem permissão. Regras AUTH-01, AUTH-04, AUTH-05, AUTH-06.
- **(c) redirecionar não autenticados para o login:** `NextResponse.redirect(new URL('/login', ...))` no proxy e `redirect('/login')` no DAL. Regras AUTH-01, AUTH-04, ROTA-20.
- **Ponto de apresentação:** o enunciado diz "middleware"; no Next 16 o arquivo chama `proxy.ts` (nota de versão em AUTH-01). Diga isso antes que perguntem.

### REQ-06: Texto do professor
| Item | O que procurar | Regras |
|---|---|---|
| (a) componentização | componentes em `components/` e `_components/`, reutilizados com props; `CampoTexto`; páginas curtas | COMP-02, COMP-03, COMP-12, FORM-22, CSS-10 |
| (b) organização/estrutura | árvore de pastas igual a STACK-05; grupos `(site)`/`(painel)`; `lib/` por recurso | STACK-05, ROTA-01 a ROTA-04, FORM-02, API-01 |
| (c) estado local | pelo menos um `useState` legítimo (ex.: menu mobile, "mostrar senha"), além do estado do formulário no RHF | COMP-09, COMP-10, COMP-11 |
| (d) hooks | `useState`, `useForm`, `usePathname`, `useRouter`, `useSearchParams` em componentes cliente | COMP-09, FORM-01, ROTA-13, ROTA-14, ROTA-17 |
| (e) navegação entre telas | `<Link>` em menus, `router.push` no filtro, `redirect` após ações, `replace` após login | ROTA-16, ROTA-17, ROTA-19, ROTA-20 |
| (f) reuso no back-end | toda chamada HTTP em `lib/`, `API_URL` no `.env.local`, resposta validada com Zod, 401/403 já tratados | DEC-04, API-01, API-04, API-08, API-12 |

Atenção ao item (c): como filtros vão na URL (ROTA-14) e campos são do RHF (FORM-12), é fácil o
projeto ficar sem nenhum `useState`. Se a auditoria não achar nenhum uso legítimo, registre como
pendência: o enunciado pede "estado local" explicitamente.
