# DOC-03 — correção dos planos após revisão Sonnet 5.5

Você é um agente Claude Code com modelo solicitado `claude-sonnet-5-5`, responsável por corrigir a documentação de execução. Leia AGENTS, guia dos agentes, TAREFA, registro DOC-03 e a skill `writing-for-agents` no host quando disponível. A implementação da aplicação continua suspensa. Preserve todos os arquivos e alterações locais de outras tarefas. Não commit/push, não reset/stash/clean, não instale dependências e não altere código funcional/configuração/dados.

## Propriedade exclusiva nesta rodada

Pode editar somente:

- `AGENTS.md`, `DESIGN.md`, `README.md`.
- `docs/README.md`, `docs/PLANO.md`, `docs/CONTRIBUINDO.md`, `docs/INTEGRACAO.md`, `docs/UI.md`.
- `docs/agents/README.md`, `MAPA.md`, `TAREFA.md`, `HANDOFF-OANET.md`.
- `docs/frontend/PLANO-IMPLEMENTACAO.md`, `ARQUITETURA.md`, `MIGRACAO.md`, `TELAS.md`.
- `docs/backend/PLANO-IMPLEMENTACAO.md`, `ARQUITETURA.md` (somente ordem/execução; sem redefinir contrato/RN).
- Relatório novo `docs/agents/revisoes/rodada-2-correcao-planos.md`.

**Não edite** `docs/contratos/**`, API/DTO/ESCOPO/modelo/RN/SEED/cenários BE, pesquisa, relatórios da rodada 1, validador de links nem DOC-03-PLANEJAMENTO.md/revisoes/README.md (coordenação). Outro agente revisa/corrige contrato e fontes canônicas. Se um achado exigir esses arquivos, comunique o coordenador com alteração proposta; mantenha a sua documentação apontando para a fonte.

## Entrada

Leia integralmente `docs/agents/revisoes/rodada-1-planos.md`, os dois planos, PLANO, INTEGRACAO e os arquivos indicados em cada achado. Confira caminhos atuais para inventário dos componentes. Leia a pesquisa `docs/research/2026-11-09-documentacao-para-agentes.md` e o README do contrato. HEAD observado `949b1e8` incorporou externamente pacote OANET e D28; entregáveis da DOC-03 ainda são locais. Não transformar commit de UI parcial em aceite.

## Decisões da coordenação para resolver os achados

1. **P-01 aceito:** adotar um primeiro corte integrado **único e coerente**, sem adaptador legado temporário e sem publicação intermediária. G1/G2/G3/G4/G5 são provas preparatórias; ativar em conjunto cliente, JWT, todos os consumidores existentes e dashboard que substitui o Resumo (parte FE-07 + BE-11). Os endpoints de status/atribuição já presentes nas telas precisam existir no mesmo corte. G6 (histórico/comentários), fila da FE-07 e G8 (gestão) são aditivos. M1 pode ser demonstração de autenticação do provedor/consumidor isolados; não é publicação parcial do app real. Ajustar matriz com coluna/grupo “ativa junto com”, dependências e marcos, sem contagens calculadas apenas da primeira página da lista.
2. **P-02 aceito:** G2/FE-02 precisam de BE-05 leitura pública Setores; cadastro carrega `GET /setores` pelo servidor e testa erro/vazio da origem. O back testa cadastro via persistência sem precisar do próprio endpoint HTTP.
3. **P-03 aceito:** eliminar instruções operacionais históricas de começar UI agora em AGENTS/DESIGN/MIGRACAO/handoff. Preservar o relato como histórico, com atribuição temporal explícita e remissão ao plano; a conclusão documental não inicia implementação. Aprovação visual D28 continua válida e não se pede de novo.
4. **P-04 aceito:** um dev FE e uma sequência de posse por arquivo. UI-01 e uma base de componentes compartilhados precedem as migrações; cada FE que toca página/form assume o arquivo só depois da linha UI correspondente. Preparação do cliente/HTTP pode avançar antes; páginas têm rebase/merge explícito na base UI aceita, sem duas implementações concorrentes nos mesmos arquivos.
5. **P-05 aceito:** acrescentar inventário/etapa de componentes compartilhados (pode ser UI-02.00) com paths reais e testes, destino de cada componente (adaptar, substituir ou remover) e dono. Não usar wildcard para conferir propriedade sem lista suficiente. Incluir cabeçalhos, tabela, badges, links, campos, navegação/marca e primitivas usadas. Se a UI já extraiu algo, inspecione e preserve.
6. **P-06 aceito:** definir G-1 “aceite do contrato”: coordenador/integrador registra versão, hash SHA-256 e evidências após rodada de correções, sem P0/P1 abertos e com validadores aprovados. A dupla registra ciência da revisão consumida antes de abrir tarefas. Não falsificar assinaturas dos devs; o hash final será preenchido pelo coordenador quando o contrato estiver congelado. A implementação permanece fora da DOC-03.
7. **P-07 aceito:** atribuir ao BE um mecanismo de fixture de integração **somente de teste**, com comando planejado nomeado, arquivos próprios, IDs e manifesto de estado. Entregá-lo incrementalmente antes dos gates que o usam, sem endpoint de bootstrap público. Contas/setores surgem nas tarefas iniciais; ocorrências e vínculos nas correspondentes. Casos exatos de relógio/Prazo ficam no teste de provedor com relógio injetável; E2E usa datas relativas ao instante da fixture e margens seguras, sem depender de relógio configurável de produção. FE/integração invocam o comando do back após ele existir; nada é implementado nesta rodada.
8. **P-08 aceito:** um único procedimento canônico de remoção em FE-09, referenciado de PLANO/INTEGRACAO em vez de três regex divergentes. Escopo explícito app/lib/components/tests/scripts/package/lock, ignorar caminhos inexistentes de modo documentado; citar equivalente PowerShell e `npm ls json-server --all` com saída vazia esperada (exit pode ser 1 quando ausente). Menções históricas em docs/skills não são dependências operacionais. Não apagar dados agora.
9. **P-09 aceito com ressalva:** documentos locais não são falha desta entrega, pois o usuário não autorizou commit. É pré-condição para distribuir trabalho: base comum precisa incluir **todos** os entregáveis DOC-03, por commit autorizado ou pacote/diff que inclua untracked e seja aplicado/verificado no destino. Não exigir checkout limpa global nem criar commits agora. Assets OANET já estão nos commits citados; confirmar estado atual e não perder documentação local em worktree de HEAD.
10. **P-10 e P-11 aceitos:** explicitar Evento `atribuida` em atribuir/reatribuir/liberar, testes e rollback; nomear layouts reais e teste da casca em FE-02/FE-07/FE-08 para links por papel, com edição sequencial pelo dev FE.
11. **P-12 aceito:** após o corte único mínimo, G8 já terá ocorrências disponíveis. Se documentar prova antecipada B, não marcá-la A antes do conjunto real; explicitar casos históricos/excluídos na fixture integrada.

Considere S-01 a S-06, quando pertinentes: roteiro visual em A, processo/env isolado sem disputar `.env.local`, proprietário único de package por tarefa, Playwright download Chromium planejado em FE-00, teste existente de sessão entre arquivos da FE-02. Rollback é proporcional à demonstração integrada acadêmica; não inventar implantação em produção existente.

## Verificação e retorno

- Mantenha G/FE/BE e IDs UI sincronizados entre plano geral, planos de frente, gates e índices. Novos passos devem dizer arquivo/owner/dep/aceite/erro/comando futuro.
- Execute `node docs/agents/validar-documentacao.mjs`, `py -3 docs/contratos/validar.py` e `git diff --check`. O contrato pode receber revisão de outro agente; reporte uma divergência sem tentar corrigi-lo nesta propriedade.
- Não execute build/testes de app sem mudança funcional. Não declare scripts futuros existentes.
- Relatório: cada P-01 a P-12 e S pertinente, decisão, arquivo/seção corrigida, evidência, limite ou pendência real. Não edite o relatório original.
- Retorne ao coordenador pelo mecanismo Orca. Congele arquivos ao finalizar; não retome UI nem delegue implementação.
