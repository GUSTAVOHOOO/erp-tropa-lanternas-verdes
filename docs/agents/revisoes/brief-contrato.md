# Revisão independente DOC-03 — contrato

Você é revisor Claude Code, modelo solicitado `claude-sonnet-5-5`. Esta tarefa é revisão documental, não implementação. Trabalhe na checkout atual `C:/Users/Windows 11/Documents/Desenvolvimento web/TrabalhoWeb`: ela contém muito trabalho aprovado ainda sem commit. Preserve tudo; não use reset/stash/clean, não commit/push, não instale pacotes e não altere aplicação ou dados.

**Propriedade exclusiva:** crie/edite somente `docs/agents/revisoes/rodada-1-contrato.md`. Outro revisor examina planos; outros arquivos têm responsáveis. Você pode ler todo o repo e executar verificações que não alteram arquivos compartilhados.

## Contexto e leitura

Leia `AGENTS.md`, `docs/agents/README.md`, `docs/agents/DOC-03-PLANEJAMENTO.md`, a skill `.claude/skills/backend-api/SKILL.md`, `docs/contratos/README.md`, `openapi.json`, `exemplos/cenarios.json`, `validar.py`; depois API/DTO/RN/modelo/ESCOPO/SEED e cenários do back nas partes pertinentes. A pesquisa que orientou o trabalho está em `docs/research/2026-11-09-documentacao-para-agentes.md`.

Usuário quer dois devs independentes por contrato e integração posterior. Next+json-server é atual; NestJS/fake HTTP de contrato ainda não existem. UI-01 é parcial e está pausada. D29–D33 registram definições técnicas acrescentadas na consolidação. Não trate destino como implementado nem aceite mock como teste real de provedor.

## O que investigar

- Cada operação descrita em API tem request/query/path, resposta completa, nulabilidade/defaults, autenticação, erros e exemplos corretos em OpenAPI.
- API, DTO, regras, modelo, seed e schemas concordam. Duplicidade, conta sem vínculo, rebaixamento sem Setor, troca de Setor da Ficha, soft delete, autor/vínculos, fila, eventos e dashboard têm resultado determinístico.
- Formato de erros e 204, campos extras, paginação/ordenação, datas/IDs, senha em bytes, formatos de evento discriminados e respostas de lista/detalhe têm tratamento utilizável pelo FE.
- Cenários incluem pré-condições, requests válidos e inválidos, cobertura real de sucesso/erro por operação, IDs/datas consistentes e isolamento. Exemplos não devem prometer provar regras reais.
- Validador realmente detecta os problemas que declara. Verifique escopo declarado versus código; limites honestos são aceitáveis. Procure falso positivo de aceite, referências quebradas, exemplos sem ligação à operação e lacunas que permitam cliente/provedor incompatíveis. Se fizer probes, use diretório temporário fora dos arquivos compartilhados.
- A proposta não depende de endpoint inventado, transporte direto no browser ou dados demonstrativos OANET em fluxo real.

Execute da raiz `py -3 docs/contratos/validar.py` e `node docs/agents/validar-documentacao.mjs`. Registre os códigos de saída e limites. Falha capturada é evidência válida da revisão, não falha da sua tarefa.

## Relatório exigido

Indique modelo efetivamente observado (se o host expuser; se não, diga que o parâmetro foi solicitado e não pôde ser atestado), fontes lidas e verificações. Para cada achado, use ID `C-01...`, severidade P0/P1/P2/P3, arquivo+seção/linha, evidência concreta da contradição, impacto no dev FE/BE e correção/critério de verificação. Separe achados de sugestões. Não invente uma quantidade mínima de falhas. Declare limites e se o contrato está apto para liberação ou quais achados impedem.

Entregue o relatório ao coordenador pelo mecanismo da tarefa Orca; não inicie correções nem novos agentes nesta rodada.
