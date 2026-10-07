# Auditoria do projeto: ERP da Tropa dos Lanternas Verdes

- **Data:** {{AAAA-MM-DD}}
- **Versão auditada:** {{hash do commit ou "sem git"}}
- **Gerado por:** skill `auditoria-apresentacao`, com as regras da skill `padroes-wellington`
- **Como reproduzir:** `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh {{raiz}}`

Legenda de origem: **Slide** = está nos slides do professor (sigla do deck + página) ·
**Docs** = documentação oficial atual · **Decisão** = escolha do grupo.
Siglas dos decks: JS, CSS, JSX, PROPS, ROTAS, FORMS, APIS (tabela no `SKILL.md` de `padroes-wellington`).

## 1. Resumo

| Item | Resultado |
|---|---|
| Requisitos do enunciado atendidos | {{n}} de 6 |
| Violações confirmadas | {{n}} |
| Itens para revisar | {{n}} |
| Regras com marcador no código | {{n}} de {{total}} |
| Regras de slide ainda não aplicadas | {{n}} |
| `npm run lint` / `npm run build` | {{ok / erro}} |

{{Duas ou três frases: o que está pronto, o que falta, o que é mais arriscado na apresentação.}}

## 2. Matriz de requisitos

| Req | Requisito (literal) | Arquivo:linha | Regra(s) | Fonte | Status |
|---|---|---|---|---|---|
| REQ-01 | Homepage: ponto de entrada, com navegação clara para as demais áreas. | `app/(site)/page.tsx:{{l}}` | DEC-09, ROTA-16 | Decisão; Slide ROTAS p. 19, 22 | ✅ / ⚠️ / ❌ |
| REQ-02 | Páginas públicas: pelo menos duas... | `app/(site)/sobre/page.tsx:{{l}}`, ... | ... | ... | ... |
| REQ-03 | Área privada... | ... | ... | ... | ... |
| REQ-04 | Sistema de login... | ... | ... | ... | ... |
| REQ-05a | Controle de acesso: verificar se está autenticado | `proxy.ts:{{l}}`, `lib/dal.ts:{{l}}` | AUTH-01, AUTH-04 | Docs (Next 16) | ... |
| REQ-05b | Controle de acesso: permitir/bloquear rotas privadas | ... | ... | ... | ... |
| REQ-05c | Controle de acesso: redirecionar não autenticados para o login | ... | ... | ... | ... |
| REQ-06a | Componentização | ... | ... | ... | ... |
| REQ-06b | Organização/estrutura de projeto | ... | ... | ... | ... |
| REQ-06c | Estado local | ... | ... | ... | ... |
| REQ-06d | Hooks | ... | ... | ... | ... |
| REQ-06e | Navegação entre telas | ... | ... | ... | ... |
| REQ-06f | Reuso na etapa de back-end | ... | ... | ... | ... |

Status: ✅ atendido com evidência · ⚠️ atendido com ressalva (explicar abaixo) · ❌ não atendido.

{{Ressalvas, uma por linha: "REQ-05: o enunciado fala em middleware; usamos proxy.ts (Next 16), ver AUTH-01."}}

## 3. Violações

### 3.1 Confirmadas

| # | Check | Regra | Arquivo:linha | Problema | Como corrigir |
|---|---|---|---|---|---|
| 1 | C-{{xx}} | {{ID}} | `{{arquivo}}:{{l}}` | {{o que está errado}} | {{ação curta}} |

### 3.2 Revisadas e descartadas (falso positivo)

| Check | Arquivo:linha | Por que não é violação |
|---|---|---|

### 3.3 Verificações manuais

| Check | Resultado | Observação |
|---|---|---|
| M-05 fluxo de acesso | ✅/❌ | {{passo que falhou}} |
| M-06 quatro estados | | |
| ... | | |

## 4. Regras aplicadas

| ID | Título | Origem | Fonte | Marcadores | Onde |
|---|---|---|---|---|---|
| FORM-17 | Revalidar tudo no servidor com safeParse | Slide | FORMS p. 8, 13, 20, 21 | 3 | `app/(site)/login/actions.ts:{{l}}`, ... |

## 5. Regras dos slides ainda não aplicadas

Só regras com etiqueta `[SLIDE]` que não têm marcador nem evidência no código.

| ID | Título | Fonte | Motivo | Ação |
|---|---|---|---|---|
| {{ID}} | ... | Slide {{DECK}} p. {{n}} | falta implementar / a feature ainda não existe / não se aplica (explicar) | ... |

## 6. Pontos de atenção para a banca

Diferenças entre slide e versão atual que vale explicar antes que perguntem (copiar das
"Notas de versão" das regras usadas):

- {{AUTH-01: middleware.ts → proxy.ts no Next 16.}}
- {{ROTA-10: params é Promise; no Next 16 o acesso síncrono foi removido.}}
- {{FORM-03: useForm sem genérico por causa do z.coerce no Zod 4.}}
- {{AUTH-06: 403 via página /acesso-negado porque forbidden() é experimental.}}
