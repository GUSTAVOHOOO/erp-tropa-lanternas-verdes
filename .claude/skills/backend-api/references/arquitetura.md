# Arquitetura em camadas

Cada classe tem um motivo só para mudar. Mudou a rota: controller. Mudou a regra: service. Mudou o banco: repository. As dependências seguem uma direção: controller → service → repository.

## Controller

Define rota e método, extrai parâmetros e body, chama um método do service, define o status e devolve o resultado.

```
// antes: regra e dados na rota
criar(body):
    item = lista.procurar(body.itemId)
    se não item: responder 404
    se item.saldo < body.qtd: responder 409
    total = item.valor * body.qtd
    item.saldo -= body.qtd
    responder total

// depois: mesma resposta para o cliente
criar(body):
    retornar service.criar(body)
```

Como rota, status e JSON não mudam, esse refactor preserva o contrato.

## Service

Decide se a operação pode existir, quanto custa e o que muda depois dela. Por não conhecer HTTP, serve a vários caminhos com as mesmas regras:

```
Controller HTTP  ┐
Outro service    ├→ Service.criar(dados)
Tarefa agendada  ┘
```

Um service cuida de um assunto e pede ao service do outro o que precisar.

**Exceção com status no service** é o caminho pragmático em frameworks como NestJS. Com domínio mais estrito ou muitos consumidores além do HTTP, lance erros de domínio puros e traduza para status em uma peça só, na borda. Escolha um e mantenha.

## Repository

Todo acesso a dados passa por ele, então trocar de array para banco, ou de banco, é mudança local: o service só passa a aguardar a Promise.

Para participar de uma transação, o método recebe a conexão da transação como argumento:

```
baixarSaldo(id, qtd, conexao): executa UPDATE condicional pela conexão recebida
```

## Injeção de dependência e módulos

Cada classe recebe colaboradores pelo construtor, e o container ou um ponto de composição monta as peças. Cada módulo declara o que oferece e o que usa; esquecer de exportar ou importar causa o erro clássico de dependência não encontrada.

```
src/
  comum/              peças de toda a API (log, filtro, interceptor)
  recursos/
    dto/
    recursos.controller   HTTP
    recursos.service      regras
    recursos.repository   dados
    recursos.module
  reservas/           mesma estrutura
```

Tudo de um assunto mora junto: apagar a pasta remove o recurso.

## Testes

Regra no service, com dependências falsas, sem servidor nem banco:

```ts
it('cobra taxa abaixo do valor mínimo', async () => {
  const falso = { buscar: async () => ({ id: 1, valor: 50, saldo: 10 }), baixar: fn() }
  const service = new Service(falso)

  const r = await service.criar({ itemId: 1, qtd: 2 })

  expect(r.taxa).toBe(15)
  expect(falso.baixar).toHaveBeenCalled()
})
```

Use banco real no que o falso esconde: transações, concorrência, restrições e consultas.
