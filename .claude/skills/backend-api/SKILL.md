---
name: backend-api
description: Regras e armadilhas verificadas de back-end e APIs REST para qualquer stack, cobrindo camadas, contrato HTTP, validação, erros, banco, transações, concorrência, autenticação e permissões. Usar ao criar, alterar, revisar ou depurar endpoints, regras de servidor, acesso a banco, login ou permissões, em NestJS, Express, Fastify, Spring, Laravel, FastAPI, Django ou outro framework. Fora de escopo são UI e recursos próprios do Supabase.
---

# Back-end e APIs

O controller traduz, o service decide, o repository guarda.

## Antes de começar

**Escolha o modo:**

- **Código existente (alterar ou revisar):** o **contrato público** (URLs, métodos, formato de entrada e resposta, status de sucesso) fica como está. Mude o contrato só para corrigir um defeito, e liste cada mudança com o impacto no cliente. Melhoria de estilo no contrato, inclusive a tabela "Contrato HTTP" abaixo, vira sugestão separada. Reorganizar arquivos internos é livre. Guard, pipe e filtro novos entram no controller ou módulo em questão; registro global vira sugestão, porque muda rotas de fora do pedido.
- **Código novo:** siga o padrão do projeto; aplique as regras abaixo onde ele não tiver padrão.

Falha de segurança ou integridade prevalece sobre convenção: corrija, ou avise se estiver fora do pedido.

**Versões:** leia `package.json` ou o lockfile. Consulte documentação só para uma API que você não lembra com segurança.

**Escopo:** entregue o pedido. Extras fora dele viram uma linha de sugestão.

Nomes como `Recurso` e `sucesso` são ilustrações, e os trechos de código das referências mostram a técnica, não o contrato a copiar.

## Regras

### Camadas

| Errado | Certo |
|---|---|
| `if`, `for` ou cálculo no controller | regra no service; controller fino, só HTTP |
| Consulta no controller ou router | no repository (ou modelo, em Laravel, Django, Rails) |
| Requisição, resposta ou cabeçalho no service | service recebe dados e devolve dados ou lança erro |
| Repository lançando 404 ou decidindo regra | repository devolve nulo; service decide |
| Service mexendo nos dados de outro assunto | pedir ao service dono do assunto |
| `new` de colaborador | injeção pelo construtor; é o que permite testar com falso |
| Pastas `controllers/` e `services/` | pastas por assunto, com o módulo junto |
| Validar formato no service | formato no DTO (dá para checar só com o JSON); regra no service (precisa do sistema) |

Camada é responsabilidade, não arquivo: um health check não precisa de três.

### Contrato HTTP

| Errado | Certo |
|---|---|
| `/criarRecurso`, `/deletar/42` | `POST /recursos`, `DELETE /recursos/42`: substantivo plural, o método diz a ação |
| `/recursos/grupo-a` como filtro | `?grupo=a`: route param identifica, query filtra, body carrega dados |
| `GET` que altera dados | `POST`, `PATCH` ou `DELETE`; `PUT` substitui inteiro, `PATCH` altera parte |
| `200` com `{ "erro": true }` | status real |
| Rota fixa depois de `:id` | rota fixa antes |
| Em API nova, `POST` que não cria (login) respondendo 201 | 200 |

**Status:** 200 ok · 201 criou · 204 sem corpo · 400 formato inválido · 401 não autenticado · 403 sem permissão · 404 não existe · 409 conflito com o estado atual (duplicado, sem saldo, ainda referenciado) · 422 regra violada por dado válido · 429 limite de tentativas · 500 falha nossa.

### Entrada

| Errado | Certo |
|---|---|
| Salvar o body direto | validação que recusa campo desconhecido (mass assignment) |
| Query e route param tratados como número | converter antes de validar: chegam como texto |
| Array ou item aninhado sem validar | validar cada item e limitar o tamanho |
| `if (campo)` em update parcial | comparar com `undefined`: `0` e `""` são valores |

### Erros e esteira

Ordem: middleware → guard → interceptor → validação → controller e service → interceptor → filtro de exceção. Middleware cuida de log, CORS e cabeçalhos; lembre de chamar `next()`.

| Errado | Certo |
|---|---|
| `try/catch` nos controllers, cada rota com um formato | tratador central e um envelope só |
| `Error` genérico para erro esperado (vira 500) | exceção nomeada com código estável, como `SEM_SALDO` |
| Filtro que usa só a mensagem da exceção | preservar `codigo` e `detalhes` |
| Stack ou erro do banco na resposta | "Erro interno" ao cliente; detalhe só no log |
| Violação de unicidade ou FK virando 500 | traduzir para 409 |
| Log com senha, `Authorization` ou query sensível | registrar método, caminho, status e tempo |

### Dados

| Errado | Certo |
|---|---|
| Lista sem limite | paginação com máximo validado e ordenação com campo único |
| Filtrar em memória; consulta dentro de laço (N+1) | filtrar e ordenar no banco; JOIN em uma consulta |
| Escritas dependentes soltas | transação curta, tudo pela conexão dela, sem chamada externa dentro |
| Ler, checar e gravar, mesmo em transação | `UPDATE ... WHERE saldo >= :qtd` e conferir linhas afetadas; lock ou versão se a regra não couber; `CHECK` no banco |
| `float` para dinheiro | decimal no banco; contas em centavos |
| 204 para id inexistente | conferir e responder 404 |
| Apagar dado que registros antigos citam | soft delete; valores históricos copiados no próprio registro |
| Sincronização automática de esquema em produção | migrations versionadas |
| Credencial no código ou com valor padrão | variável de ambiente; a API falha ao subir sem ela |
| Texto do usuário concatenado em SQL | parâmetros; ordenação só por lista permitida |
| Esquecer `await` em chamada ao banco | aguardar: uma Promise nunca é falsa, e o 404 some |

### Autenticação e permissões

Pergunte nesta ordem: quem é você (401), o que pode (403), este recurso é seu (404).

| Errado | Certo |
|---|---|
| Rota nova aberta por padrão | guard global e abertura explícita |
| Papel ou dono vindo do body | papel fora do DTO; dono vem do token |
| Conferir dono só no front ou no guard | no service; recurso alheio responde 404 e listas filtram pelo dono |
| Senha em texto, MD5 ou SHA | bcrypt ou Argon2id; bcrypt só usa 72 bytes, então limite o tamanho |
| Hash na resposta, no token ou no log | resposta com campos explícitos; payload com id, e-mail e papel |
| Login que revela se a conta existe | mensagem genérica, 401 único, comparar com hash isca |
| Login sem limite | limitar tentativas: 429 |
| Segredo fraco, token longo, algoritmo livre | segredo forte no ambiente, expiração curta, algoritmo fixo na verificação |
| CORS aberto, sem cabeçalhos de proteção | só a origem do front; Helmet ou equivalente |

## Prove

Teste o erro tanto quanto o sucesso, e relate o que foi realmente executado.

| Cenário | Esperado |
|---|---|
| Entrada válida | 200 / 201 / 204 |
| Formato inválido, campo extra | 400 com detalhes |
| Sem token, token adulterado | 401 |
| Sem o papel; recurso de outra pessoa | 403; 404 |
| Id ou referência inexistente | 404 |
| Duplicado ou estado conflitante | 409 |
| Falha no meio de várias escritas | erro, banco intacto |
| Duas requisições pelo último recurso | só uma vence (em banco real) |

## Antes de entregar

- **Contrato:** em código existente, compare cada rota com a original: método, URL, status de sucesso e formato. Toda diferença cita o defeito que corrige; sem defeito, restaure o original e registre como sugestão.
- **Lista da revisão:** cada correção feita no código tem um item, com o problema e o porquê.
- **Segurança:** item das tabelas "Erros e esteira" e "Autenticação" ausente é defeito. Aplique mesmo que exija pacote novo, e liste o pacote.

## Referências

As regras acima bastam para a maioria das tarefas. Abra **no máximo duas** referências, as da sua maior dúvida:

| Dúvida | Arquivo |
|---|---|
| NestJS ou TypeORM | [nestjs-typeorm.md](references/nestjs-typeorm.md) |
| Onde fica cada peça em outra stack | a seção dela em [outras-stacks.md](references/outras-stacks.md) |
| Refatorar camadas, módulos, testes de regra | [arquitetura.md](references/arquitetura.md) |
| Desenhar rotas, envelope, exceções, middleware | [http-erros.md](references/http-erros.md) |
| Modelar dados, paginar, transação, concorrência, soft delete | [dados-crud.md](references/dados-crud.md) |
| Criar login, JWT, papéis, cookie | [auth-seguranca.md](references/auth-seguranca.md) |
| Criar API NestJS do zero, sem padrão existente | [assets/nestjs-referencia/](assets/nestjs-referencia/) |

Para migrations, refresh token, documentação de API e deploy, siga a documentação oficial da versão instalada e avise quem pediu.
