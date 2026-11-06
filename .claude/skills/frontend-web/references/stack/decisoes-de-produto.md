# Decisões de produto

### DEC-03: Papéis e permissões vêm da API; o front só espelha
**Fonte:** [DECISÃO] regra de negócio do produto + `backend-api` (permissões: quem é, o que pode, este recurso é seu)
**Regra:** `papel` é um `z.enum` no schema do usuário e espelha o que a API devolve. A matriz de permissões abaixo é **ilustração** de um produto com dois papéis; no seu projeto ela vem do negócio e é aplicada pela API. O front a usa para escolher o redirecionamento e esconder o que não cabe ("logado sem permissão" vai a `/acesso-negado`: AUTH-06; "não logado" vai a `/login`: AUTH-01, AUTH-04), nunca como barreira.

| Ação (ilustração) | Administrador | Operador |
|---|---|---|
| Ver lista | todas | só do próprio setor |
| Ver detalhe | qualquer uma | só do próprio setor (senão 404/403 da API) |
| Registrar | em qualquer setor | só no próprio setor |
| Atribuir responsável | sim | não (403) |

**Como verificar:** cada linha tem código no front (AUTH-05, AUTH-06, AUTH-07) e teste de ponta a ponta (PROD-11).

### DEC-04: Front de produção: API real, cliente único, contrato citado
**Fonte:** [DECISÃO] aprovada (substitui "só troca API_URL", que valia para a API fake)
**Regra:** Tudo que fala com a API passa por `lib/api.ts` (API-17), valida a resposta (API-04) e traduz erro por `lib/api-error.ts` e `lib/erros-api.ts` (API-03, API-18). Envelope, códigos e status são definidos pela `backend-api` e **citados**, não copiados: quando o contrato mudar, só esses arquivos mudam; páginas, componentes e formulários continuam iguais.
**Como verificar:** `rg -n "localhost|127\.0\.0\.1" app components lib` vazio; API-17 passa.

### DEC-05: Um único padrão de formulário: RHF chama a Server Action
**Fonte:** [DECISÃO] + [SLIDE] FORMS p. 16 (onSubmit chamando `criarConta(dados)`), p. 19 (`setError` com resposta), p. 20 (Server Action com `safeParse`)
**Regra:** Formulário cliente com RHF; no `onSubmit`, `await acao(dados)`; a action recebe `unknown`, revalida e devolve `ResultadoAcao` ou faz `redirect`. O exemplo `useActionState` + `<form action>` do slide FORMS p. 20 não é usado nos formulários com campos, para não ter dois padrões. A única `<form action={...}>` sem campos é o botão Sair (AUTH-09).
**Como verificar:** `rg -n "useActionState" app components` vazio.
**Nota de versão:** `useActionState` não está desatualizado: é a API atual do React 19. A escolha é só por simplicidade.

### DEC-12: Vitrine do design system numa rota interna
**Fonte:** [DECISÃO]
**Regra:** Uma página estática (Server Component) mostra cores, tipografia, ícones e cada componente em todos os estados (normal, foco, erro, desabilitado). Fica fora do menu principal e usa dados de exemplo constantes no próprio arquivo (não chama a API). Em produção, fica com `robots: { index: false }` (PROD-04) ou só em desenvolvimento.
**Como verificar:** `rg -n "listar|buscar" "app/(site)/design-system"` vazio (ajuste o caminho); a rota não está no `sitemap.ts`.

### DEC-13: Tema por tokens; este projeto usa um único tema escuro
**Fonte:** [DECISÃO] o tema do projeto é escuro e único; a técnica geral está em PROD-10
**Regra:** Cores vêm de tokens no `:root` de `globals.css` (CSS-09, CSS-12). Enquanto o produto tiver um só tema (escuro), não há bloco `.dark`, variante `dark:`, botão de troca nem estado de cliente para isso; `color-scheme: dark` no `html` faz os controles nativos acompanharem. Se o produto passar a ter dois temas, siga PROD-10 e troque esta decisão.
**Como verificar:** `rg -n "\.dark|dark:" app components` vazio enquanto o tema for único.
