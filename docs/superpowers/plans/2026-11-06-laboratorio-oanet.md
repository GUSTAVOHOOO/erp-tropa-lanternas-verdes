# Laboratório OANET Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar `/laboratorio`, uma vitrine navegável e cinematográfica inteiramente desenhada em HTML, CSS, SVG e Canvas.

**Architecture:** Rota pública independente da casca antiga. Componentes reutilizáveis OANET compõem telas demonstrativas, sem chamadas de escrita à API. Arte procedural usa funções determinísticas e APIs nativas do navegador.

**Tech Stack:** Next.js 16.4 instalado, React 19, TypeScript, Tailwind 4, Canvas 2D e SVG; sem dependências novas.

## Global Constraints

- Nenhuma imagem, ícone ou asset da internet; não consumir os PNGs da etapa anterior.
- Referência aprovada: painel HUD verde e preto, molduras com recortes técnicos e atmosfera cinematográfica.
- Preservar trabalho local e `db.json`; exemplos são identificados como demonstração.
- CSS customizado e tokens ficam em `app/globals.css`, sob escopo `.oa-lab`.
- Nesta vitrine, bordas técnicas, brilho emissivo e animação procedural são parte do pedido explícito do usuário e substituem a contenção visual da proposta anterior. Demais regras acadêmicas permanecem.
- Verificar desktop, tablet, celular, teclado, movimento reduzido, lint, testes e build. Falhas de baseline continuam visíveis.

## Tarefa e responsáveis

**Estado:** concluída como vitrine demonstrativa. **Base:** main, f819c48, com alterações locais preservadas.
**Integração:** agente principal. **Mudança compartilhada:** apenas o principal edita `app/globals.css`, adicionando estilos isolados para o laboratório.

### Task 1: Biblioteca de símbolos e constructos

**Responsável:** agente SVG.
**Files:** `components/oanet/IconeOa.tsx`, `components/oanet/EmblemaOa.tsx`, `components/oanet/ConstructosOa.tsx`.

- [x] Criar ícones geométricos originais e acessíveis, em SVG inline com `currentColor`.
- [x] Criar emblema, bateria e arquitetura vetorial com IDs únicos por instância.
- [x] Exportar `IconeOa({nome, className})`, `EmblemaOa({className})`, `BateriaOa({className})`, `CidadeOa({className})`.
- [x] Conferir tipos e ausência de imagens/importações externas.

### Task 2: Galáxia procedural

**Responsável:** agente galáxia.
**Files:** `components/oanet/GalaxiaProcedural.tsx`, `components/oanet/galaxia.ts`, `__tests__/lib/galaxia.test.ts`.

- [x] Testar primeiro a geração determinística de partículas e limites numéricos.
- [x] Desenhar braços espirais, poeira estelar, núcleo e órbitas em Canvas, sem arquivos de imagem.
- [x] Exportar `GalaxiaProcedural({className?, compact?})` com zoom, pausa e seleção de setor.
- [x] Interromper animação fora da área visível e respeitar movimento reduzido; liberar observers/listeners/RAF.
- [x] Executar `npm exec -- vitest run __tests__/lib/galaxia.test.ts`.

### Task 3: Vitrine e telas

**Responsável:** principal.
**Files:** `app/laboratorio/page.tsx`, `components/oanet/LaboratorioOa.tsx`, `components/oanet/PainelOa.tsx`, `components/oanet/TelasOa.tsx`, `components/oanet/ComponentesOa.tsx`, `components/oanet/dados-demo.ts`, `app/globals.css`, `__tests__/components/laboratorio-oanet.test.tsx`.

- [x] Escrever e executar testes de navegação das telas e interação da vitrine.
- [x] Compor estrutura com sidebar, header e rodapé; molduras reutilizáveis com recortes próprios.
- [x] Criar Central, Ocorrências, Lanternas, Portal, Acesso e galeria de Componentes.
- [x] Tornar funcionais navegação, filtros locais demonstrativos, seleção, notificações e confirmação.
- [x] Exibir dados demonstrativos claramente e impedir escrita na API real.
- [x] Reutilizar botões/inputs Base UI existentes com a nova aparência; construir gráficos e indicadores como SVG.

### Task 4: Revisão e verificação

**Responsável:** principal e revisor.

- [x] `npm exec -- vitest run __tests__`, `npm run lint`, `npm run build`.
- [x] Reexecutar `npm run test:run` para registrar a falha histórica da descoberta, se persistir.
- [x] Iniciar o servidor local e inspecionar navegador em desktop, tablet e 375px.
- [x] Rever ausência de assets de rede, overflow, foco e interações.
- [x] Registrar comandos e resultados e entregar o endereço navegável.
