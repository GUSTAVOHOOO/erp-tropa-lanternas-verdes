# Documentação

Atualizada em 2026-11-09: OANET é a UI oficial (D28); back-end e adoção nas rotas reais continuam em migração. Cada documento distingue **estado atual** e **destino**.

## Por onde começar

| Quero | Leia |
|---|---|
| Entender o produto e a linguagem | [PRODUCT.md](../PRODUCT.md), [GLOSSARY.md](../GLOSSARY.md) |
| Saber o que foi decidido e por quê | [backend/ESCOPO.md](backend/ESCOPO.md), [adr/](adr/) |
| Saber o que fazer e em que ordem | [PLANO.md](PLANO.md), [CONTRIBUINDO.md](CONTRIBUINDO.md) |
| Trabalhar no back-end | [backend/](backend/): `ARQUITETURA`, `MODELO-DE-DADOS`, `REGRAS-DE-NEGOCIO`, `API`, `DTOS`, `CENARIOS-DE-TESTE`, `SEED` |
| Trabalhar no front-end | [frontend/](frontend/): `ARQUITETURA`, `TELAS`, `MIGRACAO` |
| Continuar agora a adoção da UI oficial | [agents/HANDOFF-OANET.md](agents/HANDOFF-OANET.md) |
| Dividir ou receber uma tarefa | [agents/README.md](agents/README.md), [agents/MAPA.md](agents/MAPA.md), [agents/TAREFA.md](agents/TAREFA.md) |
| Implementar design e assets | [UI.md](UI.md) (canônico), [design/oanet/movimento-cinematografico.md](design/oanet/movimento-cinematografico.md) (evidências) |

## Mapa dos documentos

| Pasta ou arquivo | Conteúdo | Descreve |
|---|---|---|
| `backend/ESCOPO.md` | Enunciado do professor e decisões D1 a D28 | Decisões; implementação de destino indicada por tarefa |
| `backend/MODELO-DE-DADOS.md` | Entidades, relacionamentos, seed | Destino |
| `backend/REGRAS-DE-NEGOCIO.md` | Regras RN-01 a RN-52 | Destino |
| `backend/API.md` | Rotas, envelope, erros, permissões | Destino |
| `backend/ARQUITETURA.md` | Camadas, pastas, testes, ordem de implementação | Destino |
| `backend/DTOS.md` | Campos e limites de cada rota | Destino |
| `backend/CENARIOS-DE-TESTE.md` | Um cenário "dado, quando, então" por regra | Destino |
| `backend/SEED.md` | O que o seed grava e de onde vem | Destino |
| `PLANO.md` | Backlog por tarefa (BE, FE, DOC), dependências, aceite e marcos | Destino |
| `CONTRIBUINDO.md` | Guia do dev: ambiente, fluxo, definição de pronto | Atual |
| `frontend/ARQUITETURA.md` | Camadas do front, sessão, dados, formulários | Destino, com o atual indicado |
| `frontend/TELAS.md` | Cada tela: acesso, dados, estados, features | Atual e planejado |
| `frontend/MIGRACAO.md` | Arquivo por arquivo, do json-server à API real | Atual para destino |
| `agents/` | Fluxo de trabalho, mapa do código, modelo de tarefa | Atual |
| `adr/` | Decisões difíceis de reverter | Permanente |
| `research/lanternas/` | Pesquisa dos 25 Lanternas para o seed | Insumo (aceito em D18) |
| `research/2026-11-06-skill-frontend-web-mapeamento.md` | Como a skill de front-end foi refeita | Histórico |
| `UI.md` | Contrato visual oficial OANET, assets e regras de reutilização | Base atual; adoção em migração |
| `agents/HANDOFF-OANET.md` | Transferência de responsabilidade e primeiro incremento executável | Continuação atual |
| `design/oanet/`, `superpowers/`, `../DESIGN.md` | Evidências de implementação e estudos históricos identificados como tais | Referência e histórico |

## Regras para manter a documentação

- Documento de destino não afirma que algo existe; documento de estado atual não promete o que ainda não foi feito.
- Decisão nova entra em `backend/ESCOPO.md` (ou em um ADR, se for difícil de reverter, surpreendente e fruto de um trade-off real) no mesmo dia.
- Termo novo do domínio entra em `GLOSSARY.md`.
- Ao implementar uma parte, atualize o documento correspondente de "Destino" para "Atual".
