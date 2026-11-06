# Fontes e manutenção do catálogo

Consulte para localizar o material do professor, verificar uma atribuição ou
editar as regras. As páginas são as do PDF, com a capa na p. 1.

## Material do professor

A localização registrada é `../skill-welinton/` **a partir da raiz de
TrabalhoWeb**, uma pasta irmã dentro de `Desenvolvimento web`. Não é um caminho
relativo a `references/`. Confira sua existência antes de afirmar que leu o PDF;
o checkout pode não incluir o material externo.

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

- IDs têm formato `PREFIXO-NN` e são permanentes. Preserve títulos e fontes dos
  IDs existentes; para retirar uma regra, mantenha o número e marque `(removida)`.
- Uma nova regra usa o próximo número livre do assunto. Registre `Fonte`,
  `Regra`, exemplos quando úteis e `Como verificar`. Atualize o índice do arquivo.
- `[SLIDE]` exige deck e página; `[DOCS]`, link oficial pertinente;
  `[DECISÃO]`, escolha explicitamente acordada pelo grupo. Uma recomendação do
  agente não comprova essa escolha. Registre-a como proposta até ser decidida.
- Divergências entre slide e versão instalada entram em `Nota de versão`,
  preservando a distinção entre conteúdo ensinado e adaptação técnica.
- Antes de renomear arquivos ou alterar IDs, localize consumidores nos
  comentários do app, testes e documentos, inclusive `docs/AUDITORIA.md`.
- Após editar, confira links, IDs únicos, fontes e comandos. Reavalie o
  comportamento com casos reais em agentes novos; validação estrutural não mede
  qualidade das respostas. A bancada deste estudo está em
  `docs/research/evals-wellington/`, a partir da raiz do projeto.
