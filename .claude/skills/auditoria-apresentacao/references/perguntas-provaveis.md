# Perguntas prováveis da banca

Banco para montar o `ROTEIRO.md`. As respostas apontam para as regras: antes de copiar, abra a
regra em `padroes-wellington` e confira a fonte e a página. Ajuste a resposta ao código real
(arquivo e linha); se o código não segue a regra, a resposta muda ou a pergunta vira pendência.

| # | Pergunta | Resposta curta | Regras |
|---|---|---|---|
| 1 | O enunciado pede middleware. Cadê? | No Next 16 o `middleware.ts` passou a se chamar `proxy.ts` (mesma função). Está na raiz e protege `/painel`. | AUTH-01 |
| 2 | Se o proxy já protege, por que checar de novo na página e na action? | O proxy é uma checagem otimista; a doc do Next diz para não confiar só nele. Server Action é endpoint público (slide de Formulários, p. 20). | AUTH-04, AUTH-05 |
| 3 | O que impede um Lanterna de ver outro setor trocando a URL? | O filtro é decidido no servidor pela sessão, e o detalhe confere o setor e manda para `/acesso-negado`. | AUTH-07, AUTH-06 |
| 4 | Diferença entre não logado e sem permissão? | 401 vai para o login; 403 explica o bloqueio (tabela de status do slide de APIs, p. 5). | AUTH-04, AUTH-06, API-12 |
| 5 | Dá para falsificar o cookie e virar Guardião? | Não: o cookie é assinado com HMAC e `SESSION_SECRET`; alterado, a assinatura não confere. | AUTH-03 |
| 6 | Por que não um `useState` por campo do formulário? | Re-renderiza a cada tecla e espalha validação (slide de Formulários, p. 6). Usamos RHF + Zod. | FORM-01 |
| 7 | Por que validar no servidor se já valida no cliente? | Cliente é UX, servidor é segurança; o mesmo schema roda nos dois lados (Formulários, p. 8 e p. 20). | FORM-17 |
| 8 | Por que `z.coerce` nesse campo? | Input HTML sempre entrega string (Formulários, p. 5 e p. 14). | FORM-13 |
| 9 | Por que o `.refine` tem `path`? | Sem `path` o erro não aparece em campo nenhum (Formulários, p. 21). | FORM-14 |
| 10 | Por que o fetch não está num `useEffect`? | No App Router o padrão é buscar no servidor; a página chega pronta (APIs, p. 10 e p. 11). | API-05 |
| 11 | Por que checar `res.ok`? | `fetch` só rejeita em falha de rede; 404 e 500 chegam como resposta normal (APIs, p. 7). | API-02 |
| 12 | Por que validar a resposta da API com Zod? | Se a API mudar o formato, o erro aparece na camada de serviço, não na tela (APIs, p. 14). | API-04 |
| 13 | Por que não Axios? | O slide recomenda `fetch` em Server Components por causa do cache do Next (APIs, p. 9). Decisão do grupo. | DEC-01 |
| 14 | O que acontece se a API cair? | A página lança o erro, o `error.tsx` mostra mensagem humana e "Tentar de novo" (APIs, p. 21). | API-11, API-12, ROTA-21 |
| 15 | E se a lista vier vazia? | Estado vazio com explicação e ação (APIs, p. 20: os quatro estados). | API-09 |
| 16 | Por que o filtro está na URL e não num `useState`? | Sobrevive ao F5, pode ser compartilhado e o Voltar desfaz (Rotas, p. 18). | ROTA-14 |
| 17 | Por que `await params`? | `params` é uma Promise desde o Next 15 (Rotas, p. 17); no Next 16 o acesso síncrono foi removido. | ROTA-10 |
| 18 | Por que `'use client'` só em alguns arquivos? | Só o que tem estado ou evento precisa ir para o cliente; layout com `'use client'` é armadilha (Rotas, p. 13 e p. 22). | ROTA-08 |
| 19 | Por que `<Link>` e não `<a>`? | `<a>` recarrega a página e perde o estado (Rotas, p. 19). | ROTA-16 |
| 20 | Para que servem os parênteses em `(site)` e `(painel)`? | Grupos de rotas: um layout por área sem mudar a URL (Rotas, p. 15). | ROTA-04 |
| 21 | Por que depois do login não dá para voltar? | `replace` em vez de `push` (Rotas, p. 20). | ROTA-19 |
| 22 | Como vocês vão aproveitar isso na etapa de back-end? | Toda chamada HTTP está em `lib/`; troca-se `API_URL`, e só os schemas mudam se o formato mudar. | DEC-04, API-01 |
| 23 | Onde está o estado local que o enunciado pede? | {{apontar o `useState` real, ex.: menu mobile ou mostrar senha}} e o estado do formulário no RHF. | COMP-09, REQ-06 |
| 24 | Por que a `key` é o `id` e não o índice? | O slide pede key única (JSX, p. 11); com filtros, índice embaralha os itens (doc do React). | COMP-13 |
| 25 | Por que não tem `style={{}}`? | Inline é para evitar (CSS, p. 4); estilo por classes Tailwind. | CSS-02 |
| 26 | Por que o login guarda a senha em texto no `db.json`? | O json-server não tem autenticação; é limitação declarada da API fake. No back-end entra hash. | AUTH-11 |
