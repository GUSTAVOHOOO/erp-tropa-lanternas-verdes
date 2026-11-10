# HTTP, esteira e erros

## Rotas

`GET https://api.exemplo.com/recursos/42?moeda=BRL`: método, URL base, rota, query string. **Endpoint** é método + rota, então `GET /recursos` e `POST /recursos` são endpoints diferentes. REST é convenção, e o servidor é stateless: cada requisição leva tudo de que precisa.

| Método | Endpoint | Ação | Sucesso |
|---|---|---|---|
| GET | `/recursos` | lista | 200 |
| GET | `/recursos/42` | busca um | 200 |
| POST | `/recursos` | cria | 201 |
| PUT | `/recursos/42` | substitui inteiro | 200 |
| PATCH | `/recursos/42` | altera parte | 200 |
| DELETE | `/recursos/42` | remove | 204 |

Use minúsculas e hífen: `/itens-reserva`. Escolha um critério para 409 e 422: 409 quando o problema é o estado atual, que pode mudar; 422 quando a regra rejeita aquele dado em si.

## Onde colocar cada peça

| Peça | Pergunta | Quando usar |
|---|---|---|
| Middleware | o que fazer com toda requisição? | log, id de rastreio, CORS, cabeçalhos; não sabe qual rota vai rodar |
| Guard | pode entrar? | autenticação e papel |
| Validação | o formato está certo? | conversão e rejeição de campos |
| Interceptor | como embrulhar a resposta? | precisa ver o retorno do handler |
| Filtro de exceção | o que responder se der erro? | envelope de erro, log do detalhe |

Middleware roda na ordem de registro, e o status e a duração só existem no evento de fim da resposta. Com erro, o interceptor de sucesso não roda; com sucesso, o filtro não roda.

## Envelope

Se o projeto já tem formato, ou segue algo como RFC 9457, mantenha-o. Em API nova, sem padrão:

```jsonc
// sucesso · 200
{ "sucesso": true, "dados": { "id": 42 } }

// erro · 404
{ "sucesso": false, "erro": { "status": 404, "mensagem": "Recurso não encontrado" },
  "caminho": "/recursos/999", "timestamp": "2026-10-15T21:47:00Z" }

// validação · 400
{ "sucesso": false, "erro": { "status": 400, "mensagem": "Dados inválidos", "detalhes": ["..."] } }

// regra · 409
{ "sucesso": false, "erro": { "status": 409, "mensagem": "Item 3 sem saldo", "codigo": "SEM_SALDO" } }
```

O filtro monta o erro, o interceptor monta o sucesso, e o controller devolve só os dados. `mensagem` vai para pessoas e `codigo` é para o front tratar sem comparar textos.

## Exceções

Erro esperado é parte da regra: lance exceção com status e mensagem. Erro inesperado é bug ou falha externa: deixe subir até o filtro, que responde 500 genérico e registra tudo.

```
class SemSaldoException extends ExcecaoHttp(409):
    codigo = 'SEM_SALDO'
    mensagem = `Item ${id} sem saldo`
```

Restrição do banco é a última linha de defesa. Checar antes no service não dispensa traduzir a violação, porque duas requisições simultâneas passam pela checagem.

Inclua um id de rastreio no log para ligar uma reclamação ao erro real.
