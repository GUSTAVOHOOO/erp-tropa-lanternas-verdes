# OANET — estudos cinematográficos

> A direção evoluiu para visuais inteiramente gerados em código, aprovados
> pelo usuário. Veja o [guia do redesign](../../UI.md) e o
> [laboratório implementado](laboratorio-codigo.md). Esta página preserva
> a exploração inicial e seus artefatos.

## Tarefa: direção visual e primeiro pacote de arte

**Estado:** em revisão visual pelo usuário.
**Responsável e integração:** Codex.
**Base:** main, f819c48, com alterações locais anteriores preservadas.

### Objetivo e limites

Criar uma proposta cinematográfica para o redesign completo, a partir das
duas referências fornecidas. O usuário confirmou a intensidade cinematográfica.
Escopo desta entrega: identidade, estudos das telas principais e artes de
ambiente. Não inclui implementar o site ou modificar a estrutura do código.

**Arquivos atribuídos:** `PRODUCT.md`, `DESIGN.md`, esta pasta e
`public/assets/oanet/`. Nenhuma mudança em configuração, dependências,
dados compartilhados ou regras acadêmicas.

### Ver os conceitos

- [Direção: painel, início e detalhe](01-direcao-cinematografica.png)
- [Acesso, catálogo, ficha, lista e formulários](02-telas-do-sistema.png)
- [Panorama de Oa](../../../public/assets/oanet/oa-panorama-v1.png)
- [Mapa galáctico](../../../public/assets/oanet/mapa-galactico-v1.png)
- [Direção visual completa](../../../DESIGN.md)
- [Prompts completos](prompts.json)

As pranchas são imagens conceituais com dados ilustrativos, não capturas de
uma aplicação implementada. O cabeçalho e alguns detalhes de molduras variam
entre as gerações e deverão ser unificados no design definitivo.

### Critérios de aceite desta etapa

- [x] Direção cinematográfica coerente com as referências.
- [x] Estudos de entrada, operação e formulários.
- [x] Artes separadas de Oa e da galáxia, sem textos incorporados.
- [x] Imagens e prompts preservados no projeto.
- [x] Feedback do usuário: direção aprovada e evolução para componentes em código.

### Comandos e resultados

- `git status --short`: sucesso; identificou alterações preexistentes em
  AGENTS.md, CLAUDE.md, README.md, db.json e documentação/skills não rastreadas.
- Leitura de `docs/agents/README.md`, `MAPA.md`, `TAREFA.md`, skill acadêmica,
  README, spec original, CSS e página inicial: sucesso.
- `node <skill-impeccable>/scripts/context.mjs`: saída `NO_PRODUCT_MD`;
  o contexto estratégico foi criado após a confirmação da direção desejada.
- Busca dos diretórios `public`, `.agents` e `.impeccable`: não existiam;
  a ausência não indica falha da aplicação. A pasta de assets foi criada.
- Ferramenta integrada imagegen: duas pranchas e duas artes geradas;
  retrato rejeitado automaticamente pela ferramenta, sem arquivo produzido.
- `New-Item` e `Copy-Item`: sucesso, arquivos copiados para esta pasta e
  `public/assets/oanet/`, preservando os originais.
- Verificação com Node: quatro PNGs válidos (1586×992, 1536×1024 e duas
  artes de 1672×941), cinco prompts completos no JSON, incluindo o rejeitado,
  e todos os links do índice resolvidos para arquivos existentes.
- `git diff --check`: saída 0; avisos de conversão LF/CRLF em README.md e
  db.json preexistentes. `git status --short`: arquivos novos limitados ao
  contexto de design, documentação visual e assets; alterações anteriores preservadas.

Não foram executados testes de aplicação, lint ou build: não houve mudança
em código executável. Não foi realizada verificação em navegador nem auditoria
de acessibilidade. Inspeção visual das quatro imagens geradas: feita.

### Pendências

Revisar layouts com o usuário. Desenvolver Sobre, estados auxiliares e
mockups de celular; produzir retratos e arte específica adicional conforme
a composição escolhida. A implementação deve preservar o domínio existente,
sem apresentar estatísticas fictícias ou funções não implementadas como reais.
