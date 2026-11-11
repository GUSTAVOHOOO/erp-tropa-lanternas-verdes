# Testar a API no Postman

Importe `ERP-Backend.postman_collection.json` e `ERP-Local.postman_environment.json`. A coleção tem 65 chamadas em ordem, exemplos JSON preenchidos e scripts que verificam status HTTP, envelope, tipos e regras. Ela inclui exemplos das 30 operações da API.

## Preparar a API

No terminal, dentro de `backend/`, com o `.env` configurado:

```powershell
npm run build
npm run migration:run
npm run seed -- --etapa completa
npm start
```

Mantenha esse terminal aberto. A URL padrão é `http://localhost:3001`. O Postman chama a API NestJS diretamente; não é necessário iniciar o frontend. Se o json-server antigo estiver usando a porta 3001, encerre-o antes de iniciar a API.

A coleção cria duas contas e uma Ficha por rodada. Ela apaga somente o Setor temporário e, logicamente, a Ocorrência e o Comentário que criou. Contas, Ficha e histórico permanecem. Use um banco local de desenvolvimento.

## Importar e executar

1. No Postman desktop, use **Import** e selecione os dois arquivos JSON desta pasta.
2. Selecione o ambiente **ERP Local** no seletor de ambientes.
3. Confira `baseUrl`, `emailGuardiao` e `senhaGuardiao`. O seed usa `ganthet@oa.tropa` / `guardiao123`; se você definiu `SEED_SENHA`, use esse valor em `senhaGuardiao`.
4. Abra a coleção **ERP Tropa - Backend local**. Execute as chamadas de cima para baixo com **Send**, começando em **01 - Saúde e iniciar nova rodada**, ou use **Run collection** com **1 iteração** e todas as chamadas selecionadas.
5. Confira os resultados em **Test Results** ou nos resultados do Runner. Um HTTP 400/401/403/404/409/422 pode ser o resultado correto: o nome da chamada indica o status esperado.

O Runner executa as requisições na ordem da coleção e usa o ambiente selecionado. Veja a [documentação oficial do Collection Runner](https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs).

Execute a primeira chamada uma vez por rodada. Ela gera e-mails e slug exclusivos e limpa os tokens/IDs anteriores. As chamadas seguintes dependem dos resultados anteriores; por exemplo, o cadastro salva `usuarioId`, o login salva o token e o POST de Ocorrência salva `ocorrenciaId`.

## Autenticação e papéis

O cadastro público cria uma conta com `papel: "lanterna"`. Não envie `papel` no cadastro. O Guardião de demonstração é criado pelo seed. A coleção promove e retorna a conta de teste a Lanterna para mostrar que o mesmo token passa a refletir o papel atual no banco.

Em **POST /auth/login**, use **Body → raw → JSON**:

```json
{
  "email": "ganthet@oa.tropa",
  "senha": "guardiao123"
}
```

O token vem em `dados.token`. As chamadas de login já o salvam automaticamente em `tokenGuardiao`, `tokenLanterna` ou `tokenOutroSetor`. Em cada chamada protegida, **Authorization → Bearer Token** usa a variável correspondente, por exemplo `{{tokenGuardiao}}`. Isso envia o cabeçalho `Authorization: Bearer <token>`.

As variáveis `{{emailLanterna}}`, `{{usuarioId}}`, `{{lanternaId}}` e `{{ocorrenciaId}}` são preenchidas durante a sequência. Se aparecer uma variável sem valor, execute a chamada anterior que a produz. Evite compartilhar o ambiente exportado após os testes, pois ele passa a conter tokens e credenciais locais.

## Exemplos de POST

Cadastro público, sem Authorization (troque o e-mail se repetir manualmente):

```http
POST http://localhost:3001/auth/cadastro
Content-Type: application/json
```

```json
{
  "nome": "Lanterna de Teste",
  "email": "teste-manual@exemplo.invalid",
  "senha": "TesteSeguro123!",
  "setorId": 2814
}
```

Criar Ocorrência como Lanterna, usando seu token:

```http
POST http://localhost:3001/ocorrencias
Content-Type: application/json
Authorization: Bearer <token da Lanterna>
```

```json
{
  "titulo": "Resgate de nave na Terra",
  "descricao": "Uma nave ficou sem energia e precisa de ajuda para resgatar a tripulação.",
  "planeta": "Terra",
  "gravidade": "alta",
  "envolvidos": 12
}
```

Para Lanterna, o Setor vem da conta e o corpo não aceita `setorId`. Para criar como Guardião, adicione `"setorId": 2814` ao mesmo JSON e use seu token. `gravidade` aceita `baixa`, `media`, `alta` ou `critica`; `envolvidos` é um inteiro positivo. Envie números sem aspas, listas como arrays e booleanos como `true`/`false`.

Criar Comentário, usando o ID real de uma Ocorrência visível e um token:

```http
POST http://localhost:3001/ocorrencias/<id>/comentarios
Content-Type: application/json
Authorization: Bearer <token>
```

```json
{
  "texto": "Equipe enviada ao local. Iniciamos o resgate."
}
```

## O que conferir

| Pasta | Casos |
|---|---|
| 01 | Saúde, consultas públicas, paginação e Ficha |
| 02 | Cadastro, login, armazenamento do JWT, sessão, 400, 401 e e-mail duplicado |
| 03 | Listagem administrativa, 403 para Lanterna, promoção e retorno ao papel Lanterna |
| 04 | Criar/consultar/editar Setor, duplicidade 409, campo extra 400 |
| 05 | Criar/editar Ficha, mentor inválido 422, status e vínculo com usuário |
| 06 | Criar/editar Ocorrência, escopo de Setor, enum inválido, atribuição e Minha fila |
| 07 | Criar/listar/apagar Comentários, Eventos e corpo vazio em 204 |
| 08 | Resolução, conflito 409, Dashboard, exclusão e GET posterior 404 |

Os erros vêm em `erro.codigo` e `erro.mensagem`. Em 400 há também `erro.detalhes`, com o campo e as mensagens de validação. Sucessos com corpo usam `{ "sucesso": true, "dados": ... }`. DELETE bem sucedido retorna 204 sem JSON.

## Teste manual adicional de 429

A sequência normal faz quatro logins e funciona com o limite padrão de cinco tentativas por minuto. Para testar 429, termine a sequência, envie repetidamente a chamada **Senha incorreta** até a API responder `429 / MUITAS_TENTATIVAS` e aguarde a janela de 60 segundos antes de testar login novamente. Nesse teste adicional, o script da chamada, que espera 401, ficará vermelho quando chegar a 429; isso é esperado. Uma nova execução imediata da coleção inteira também pode atingir o limite por IP. Os valores podem ser alterados por `LOGIN_LIMITE` e `LOGIN_JANELA_SEGUNDOS` no `.env`.

## Manutenção e verificação

Para regenerar os dois JSONs, execute `node postman/gerar-colecao.cjs` dentro de `backend/`. Isso restaura os valores de exemplo dos arquivos; não modifica o ambiente já importado no Postman.

A sequência foi conferida por um cliente HTTP local contra a API real em SQLite temporário com migrations e seed completo: 65 chamadas, 222 asserções e exemplos das 30 operações do OpenAPI passaram. Os scripts foram executados em um adaptador local das funções `pm` usadas pela coleção; a interface do Postman não foi automatizada. O limite padrão de cinco logins por minuto permaneceu ativo nessa verificação.
