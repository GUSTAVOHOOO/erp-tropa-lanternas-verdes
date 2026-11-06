# Dados e CRUD

## Modelagem

Desenhe antes de codar. No requisito, substantivo vira entidade, característica vira atributo e verbo vira relacionamento.

| Tipo | Exemplo | Onde fica a FK |
|---|---|---|
| 1:1 | Usuário — Perfil | em um dos lados |
| 1:N | Grupo — Recursos | no lado do N |
| N:N | Aluno — Cursos | tabela no meio, com as duas chaves |

```
Grupo 1:N Recurso 1:N ItemReserva N:1 Reserva N:1 Usuario
```

- N:N com dados próprios vira entidade: `ItemReserva` guarda quantidade e valor.
- Relação inversa ("grupo tem recursos") não cria coluna: é só navegação.
- PK identifica a linha; FK aponta para a PK de outra tabela.

## Banco e ORM

- Declare no banco o que não pode ser violado: `NOT NULL`, `UNIQUE`, FK, `CHECK (saldo >= 0)`.
- O PostgreSQL não cria índice em FK. Indexe colunas de filtro, ordenação e junção.
- Vários drivers devolvem decimal como **string**.
- Guarde datas em UTC com fuso (`timestamptz`).
- O ORM escreve SQL que você precisa saber ler: ligue o log de queries em desenvolvimento.
- Mantenha um `.env.example` sem valores reais.
- Relações só vêm quando pedidas explicitamente.

## Create

```
JSON → validação (400) → controller → service (404/409) → repository (INSERT · 201)
```

Referência inexistente, como `grupoId` que aponta para nada, responde 404.

## Read

```jsonc
// GET /recursos?pagina=2&limite=10
{ "itens": [], "meta": { "total": 87, "pagina": 2, "limite": 10, "paginas": 9 } }
```

- `OFFSET = (pagina - 1) * limite`. Valide `pagina >= 1` e `1 <= limite <= máximo`.
- Inclua campo único na ordenação (`nome, id`), senão itens repetem ou somem entre páginas.
- Em tabelas grandes, prefira cursor (`WHERE id > ultimo`).
- `%` e `_` são curingas em `LIKE`: limite o tamanho do termo.
- Em listas grandes, selecione só as colunas usadas.

## Update

```
atualizar(id, dto):
    item = await buscar(id)      // garante o 404
    aplicar regras
    copiar para item só os campos presentes
    salvar(item)
```

O DTO de update é o de criação com campos opcionais. `null` explícito só limpa o campo se a regra permitir.

## Delete

| | Físico | Soft delete |
|---|---|---|
| Linha no banco | apagada | continua, com data de exclusão |
| Desfazer | não | sim |
| Quando | dado sem histórico | dado que registros antigos citam |

Soft delete tem custos: toda consulta precisa ignorar excluídos, `UNIQUE` colide com linhas "apagadas" (use índice parcial) e dado pessoal pode exigir exclusão real. Excluir algo referenciado por FK responde 409.

## Transação e concorrência

Qualquer erro desfaz tudo (`ROLLBACK`), e lançar exceção é o jeito de cancelar. Leitura ou escrita fora da conexão da transação não é desfeita.

Transação sozinha não impede corrida. Duas requisições leem saldo 1, as duas passam na checagem, e o saldo vai a -1. Correções, da mais simples à mais pesada:

1. **`UPDATE` condicional:**

   ```sql
   UPDATE recursos SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1;
   -- 0 linhas afetadas = sem saldo
   ```

2. **Lock pessimista** (`SELECT ... FOR UPDATE`): para regra que não cabe em um `WHERE`.
3. **Otimista** (coluna `versao`, com nova tentativa): para conflitos raros.

Ao travar várias linhas, use sempre a mesma ordem (por id), para evitar deadlock.

## Consultas sob medida

Soma, agrupamento e relatórios usam query builder ou SQL, ainda no repository. Método de SQL cru continua vulnerável se receber texto concatenado.
