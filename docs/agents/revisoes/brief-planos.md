# Revisão independente DOC-03 — planos e navegação

Você é revisor Claude Code com modelo solicitado `claude-sonnet-5-5`. Checkout compartilhada: `C:/Users/Windows 11/Documents/Desenvolvimento web/TrabalhoWeb`. Não está sozinho na história desta checkout; preserve assets locais/untracked, código parcial e docs. Sem reset/stash/clean, commit/push, instalação ou implementação de features.

**Propriedade exclusiva:** somente `docs/agents/revisoes/rodada-1-planos.md`. Outro revisor cuida do pacote de contrato. Leia os demais arquivos, mas não os edite nesta rodada.

## Contexto necessário

Leia AGENTS, `docs/agents/{README,MAPA,TAREFA,DOC-03-PLANEJAMENTO,HANDOFF-OANET}.md`, pesquisa `docs/research/2026-11-09-documentacao-para-agentes.md`, README raiz, `docs/README.md`, `docs/PLANO.md`, planos em `docs/frontend/PLANO-IMPLEMENTACAO.md` e `docs/backend/PLANO-IMPLEMENTACAO.md`, `docs/INTEGRACAO.md`, UI/TELAS/MIGRACAO/arquiteturas. Consulte contratos/API/DTO/RN/ESCOPO quando uma dependência exigir.

Usuário suspendeu UI para planejar todo o front e back separados, acordar contrato para independência e juntar depois. O laboratório OANET é oficial; UI-01 herdada é parcial sem aceite. NestJS, fake de contrato, scripts e novas rotas descritos são destino. A preparação FE pode usar HTTP falso no servidor/testes; ativação é contra API real, com banco isolado. Dois devs acumulam integração/revisão, sem terceiro obrigatório.

## Investigue falhas que impediriam execução

- Cobertura de todas as rotas existentes, estados e novas features. Fronteiras UI-01/UI-02/FE preservam RSC, RHF/Zod/Actions e permissões. Caminhos existem ou estão identificados como planejados.
- Dependências internas e gates FE/BE formam ordem executável, sem ciclo e sem exigir front pronto para testar back ou back pronto para preparar front. Seed mínimo, Eventos desde primeira mutação, auth/Setor e limpeza têm pré-condições corretas.
- Preparação P, provedor B e ativação A têm critérios observáveis. Como integrar cliente/sessão/consumidores sem quebrar rotas ainda json-server? Trocar apenas API_URL não resolve contrato diferente. Avalie se roteiro permite um estado integrado consistente.
- Cada tarefa tem responsável por arquivo, limites compartilhados, teste sucesso/erro e comando que será realmente disponível. Planos não afirmam execução atual de scripts futuros. Cheque testes/caminhos contra arquivos existentes quando relevante.
- READMEs descrevem todas as pastas de docs, fontes canônicas e ponto de entrada por papel; instruções são encontráveis sem carregar tudo ou seguir referências circulares. Histórico não compete com contrato atual.
- Escopo de dados/config/dependências está explícito. Escrever testes não altera db.json; assets untracked não se perdem em worktree. Nenhum plano autoriza commit/publicação atual ou retomada automática de UI ao entregar documentação.
- Gates testam navegador desktop/celular/teclado/movimento, login/logout/permissão, persistência e rollback proporcionalmente, sem promover mock como integração ou exigir ferramenta arbitrária.

Execute `node docs/agents/validar-documentacao.mjs` e `git diff --check`; registre resultado e limites. Não precisa executar build/testes da aplicação sem mudança funcional. Uma falha de validação capturada é resultado válido da revisão.

## Entrega

Relatório com modelo efetivamente observado (ou limite de atestação), fontes examinadas, achados `P-01...` com severidade P0/P1/P2/P3, arquivo/seção/linha, evidência, impacto concreto e correção verificável. Separe sugestões e achados; nenhuma quota de problemas. Indique se um dev novo conseguiria começar, o que bloqueia e o que pode ser preparado independentemente.

Retorne pelo mecanismo da tarefa Orca. Não corrija arquivos nem delegue nesta rodada; o coordenador atribuirá correções com propriedade separada.
