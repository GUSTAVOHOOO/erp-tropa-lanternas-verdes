# Fontes e manutenção do catálogo

Abra só para localizar o material do curso, conferir uma atribuição ou editar regras. As páginas são as do PDF, com a capa na p. 1.

## Material do curso (rótulo [SLIDE])

A localização registrada é `../skill-welinton/` **a partir da raiz do projeto**, uma pasta irmã dentro de `Desenvolvimento web`. Confira se existe antes de afirmar que leu o PDF; o checkout pode não incluí-lo. Sem acesso, diga "a referência da skill registra…".

| Sigla | Arquivo | Páginas registradas |
|---|---|---|
| JS | `javascript_fundamentos_dom.pdf` | 18 |
| CSS | `css_tailwind_web_development.pdf` | 20 |
| JSX | `react_intro_componentes_jsx.pdf` | 16 |
| PROPS | `react_props_state_components.pdf` | 12 |
| ROTAS | `Rotas, Layouts e Navegação — React Router Next.js App Router.pdf` | 23 |
| FORMS | `formularios-validacao-rhf-zod.pdf` | 22 |
| APIS | `Consumo de APIs — Fetch, Axios, Loading e Erros no Next.js App Router.pdf` | 24 |

## Editar regras

- IDs têm formato `PREFIXO-NN` e são permanentes. O app tem marcadores como `// [FORM-17]`: nunca renumere. Regra reescrita mantém o ID; regra retirada vira lápide em [removidas.md](removidas.md) (`(removida)` + qual regra a substitui); regra nova usa o próximo número livre do prefixo (`node scripts/consultar.mjs --listar PREFIXO`).
- Cada pasta de `references/` tem um `README.md` com uma linha por arquivo; arquivos têm um assunto só e até cerca de 150 linhas. Regra nova entra no arquivo do seu assunto e na linha do README.
- Uma regra tem `Fonte`, `Regra`, exemplos quando úteis e `Como verificar`. `[SLIDE]` exige deck e página; `[DOCS]`, o arquivo da doc instalada em `node_modules/next/dist/docs/` ou um link oficial; `[DECISÃO]`, escolha explicitamente acordada. Nunca rotule como `[SLIDE]` o que não está no material. Recomendação do agente é proposta até ser decidida.
- Divergências entre slide e versão instalada entram em `Nota de versão`.
- Contrato com a API (envelope, códigos, status) é citado da `backend-api`, não copiado: quando mudar, só `lib/api.ts` e `lib/api-error.ts` do app e a regra API-03 mudam.
- Antes de renomear arquivos ou alterar IDs, procure os marcadores no app (`rg "\[ID\]" app components lib __tests__`) e nos documentos.
- Após editar, rode `consultar.mjs` (ele falha em ID duplicado) e confira links e comandos.
