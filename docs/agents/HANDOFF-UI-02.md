# Handoff UI-02 — Conclusão de Entrega & Relatório de Revisões Visuais

**Data:** 11 de Novembro de 2026  
**Contexto:** Conclusão da migração da suíte UI-02 (UI-02.01 a UI-02.12) para o Design System OANET.  
**Decisão de Engenharia:** Conclusão e merge das Pull Requests #6, #7 e #8, com o catálogo das correções visuais registrado para a próxima frente (Sprint de Refinamento / UI-03).

---

## 1. Status Geral das Entregas e PRs

Todas as 12 frentes da UI-02 foram validadas com sucesso e integradas à `main`:
- **Build de Produção:** Next.js 16.4.6 Turbopack aprovado (13/13 rotas compiladas).
- **Testes Automatizados:** 204 testes passando em 40 arquivos de teste (Vitest).
- **Qualidade de Código:** 0 erros e 0 warnings no ESLint; contratos e integridade de dados preservados.

| PR | Ramo / Base | Escopo Entregue |
| :--- | :--- | :--- |
| **PR #6** | `front/ui-02-bloco-a-publicas` ← `main` | UI-02.01 a UI-02.04: Portal, Sobre, Login e Catálogo de Lanternas |
| **PR #7** | `front/ui-02-bloco-b-operacionais` ← Bloco A | UI-02.05 a UI-02.08: Ficha do Lanterna, Resumo Operacional, Lista de Ocorrências e Nova Ocorrência |
| **PR #8** | `front/ui-02-bloco-c-gestao-estados` ← Bloco B | UI-02.09 a UI-02.12: Detalhes, Atribuição, Boundaries globais de Erro/Loading e limpeza de legados |

---

## 2. Diagnóstico das Dúvidas e Itens Apontados pelo Usuário

### Item 1 — Barra Lateral Fixa ao Rolar a Página
- **Comportamento atual:** Ao rolar a página em telas compridas, a sidebar acompanha a rolagem e desaparece da visão.
- **Causa raiz:** No arquivo `app/globals.css`, a regra `position: sticky; top: 18px; max-height: calc(100dvh - 36px); align-self: start; overflow-y: auto;` estava aplicada apenas ao seletor de laboratório (`.oa-lab .oa-sidebar`), e não ao `.oa-shell > .oa-sidebar` do layout padrão de produção.
- **Ação para o próximo ciclo:** Mover o comportamento `sticky` para `.oa-sidebar` dentro do grid de desktop (`min-width: 980px`), garantindo que o menu e a insígnia fiquem sempre visíveis independente da rolagem.

---

### Item 2 — Componente "A Caixa" (Imagem 0)
- **Identificação no Código:** Componente `<div className="oa-topbar-globe"><IconeOa nome="setores" /></div>` em `components/oanet/CascaOa.tsx`.
- **O que faz:** Representa o **Globo / Cubo de Monitoramento de Setores Espaciais** (os 3.600 setores da jurisdição de Oa). Na especificação visual da OANET, é um elemento de telemetria decorativo que indica que a estação de trabalho está conectada à rede galáctica.
- **Situação:** Atualmente é puramente estático/decorativo (não possui clique).
- **Sugestão de Redesign / Evolução:** 
  1. Torná-lo interativo, abrindo um modal rápido com o mapa holográfico da galáxia ou atalho para o filtro setorial.
  2. Ou adicionar tooltip explicativo: *"Rede OANET: 3.600 Setores Ativos"*.

---

### Item 3 — Textos e Elementos Vazando da Moldura (Imagens 1, 2, 3 e 4)
- **Problema Observado:**
  - Em **Status Operacional**: As legendas inferiores *"4 abertas"*, *"2 em andamento"* e *"3 resolvidas"* colidem com o chanfro inferior e ultrapassam a linha de corte.
  - Em **Filtros Operacionais**: Os campos dropdown (`Select`) encostam diretamente na borda inferior da moldura.
  - Em **Registro Operacional**: A data *"REGISTRADA EM 07/10/2026, 15:14"* fica encavalada sobre a quina inferior recortada.
  - Em **Nova Ocorrência**: Os inputs de texto e áreas de descrição estão sem margem de respiro interna na base.
- **Causa Raiz:** A classe `.oa-panel` possui chanfros angulares de 14px nos cantos (`clip-path: var(--oa-cut)`), porém `.oa-panel-content` possui apenas `min-width: 0;` sem padding inferior ou lateral unificado.
- **Ação para o próximo ciclo:** 
  - Padronizar o container de conteúdo das molduras com uma "Safe Area": `padding: 20px 24px 28px 24px` (ou classes utilitárias `p-6 pb-8`).
  - Adicionar espaçamento de respiro inferior (`pb-4` / `mb-2`) nos componentes filhos (`BarraStatus`, `FiltroOcorrencias`, `FormOcorrencia` e grid de detalhes do dossiê).

---

### Item 4 — Estilização das Quinas nos Selos / Badges (Imagem 4)
- **Identificação no Código:** Componente `SeloOa` em `components/oanet/PainelOa.tsx` e regra `.oa-badge` em `app/globals.css`.
- **Situação:** Atualmente, a regra CSS utiliza:
  ```css
  clip-path: polygon(0 4px, 4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%);
  ```
  Como o elemento possui uma borda CSS retangular e o `clip-path` recorta os dois cantos (topo-esquerdo e base-direita), ambas as diagonais ficam sem a linha da borda (abertas).
- **Especificação do Usuário:**
  - Manter o canto superior esquerdo com a quina chanfrada aberta (sem borda).
  - No canto inferior direito, fechar o contorno adicionando a linha de borda/borda fechada.
- **Ação Técnica para o próximo ciclo:**
  - Opção A: Modificar o polígono para chanfro assimétrico exclusivo no topo esquerdo:
    ```css
    clip-path: polygon(0 4px, 4px 0, 100% 0, 100% 100%, 0 100%);
    ```
    Dessa forma o canto inferior direito mantém o contorno retangular 100% íntegro e estilizado.
  - Opção B: Renderizar o contorno da quina chanfrada inferior através de pseudo-elemento `::after` com borda desenhada na diagonal.

---

### Item 5 — Componente de Engrenagem e Proposta de Redesign (Imagem 5)
- **Identificação no Código:** Botão de controle de acessibilidade em `components/oanet/CascaOa.tsx`:
  ```tsx
  <button
    type="button"
    className="oa-icon-button"
    aria-label="Reduzir efeitos luminosos"
    aria-pressed={modoCalmo}
    onClick={() => setModoCalmo(!modoCalmo)}
  >
    <IconeOa nome="configuracao" />
  </button>
  ```
- **Qual a função dele:** Ele é o alternador de **Modo Calmo (Acessibilidade de Efeitos)**. Quando acionado, ele desativa as animações de luz, blooms intensos e pulsações cósmicas para proporcionar leitura confortável e evitar fadiga visual.
- **Por que é pouco autoexplicativo:** O ícone de engrenagem remete a "Configurações Gerais da Conta / Aplicação". O usuário espera uma página ou menu suspenso de ajustes ao clicar nele, e não um toggle de iluminação.
- **Proposta de Redesign para o próximo ciclo:**
  1. **Troca do Ícone:** Substituir a engrenagem por um ícone semântico de luminosidade/movimento (ex.: ícone de faíscas/luz `sparkles`, olho ou varinha de efeitos).
  2. **Feedback Visual:** Exibir tooltip claro ao passar o mouse (*"Modo Calmo: Reduzir brilho e animações"*).
  3. **Estado Ativo/Inativo:** Mudar a cor/estilo do botão para indicar claramente quando o modo calmo está ligado ou desligado.

---

## 3. Backlog de Ações para a Próxima Iteração (UI-03)

| ID | Item | Escopo / Arquivo | Complexidade | Situação |
| :--- | :--- | :--- | :--- | :--- |
| **REF-01** | Fixar a barra lateral em desktop (`position: sticky`) | `app/globals.css` (`.oa-shell > .oa-sidebar`) | Baixa (1 dia) | Concluído (UI-03) |
| **REF-02** | Safe area de padding inferior nas molduras OANET | `app/globals.css` (`.oa-panel-content`) e views | Baixa (1 dia) | Concluído (UI-03) |
| **REF-03** | Ajuste na quina do `SeloOa` (contorno na base-direita) | `app/globals.css` (`.oa-badge`) | Baixa (0.5 dia) | Concluído (UI-03) |
| **REF-04** | Redesign do botão de Modo Calmo (ícone + tooltip) | `components/oanet/CascaOa.tsx` e `IconeOa.tsx` | Baixa (0.5 dia) | Concluído (UI-03) |
| **REF-05** | Definição funcional do Cubo de Setores no topo | `components/oanet/CascaOa.tsx` | Média (conforme spec de produto) | Concluído (opção 2); opção 1 pendente |

---

## 4. Entrega dos refinamentos (UI-03, 2026-11-11)

Os itens do backlog da seção 3 foram implementados na branch `front/ui-03-refinamentos`.

| ID | Situação | O que mudou |
| :--- | :--- | :--- |
| REF-01 | Concluído | A sidebar continua sticky, mas a altura passou de `calc(100dvh - 36px)` para `calc(100dvh - 71px)` em `app/globals.css`. Assim ela não é mais empurrada para cima pelo rodapé `.oa-system-footer` no fim da rolagem. Medido em 1440x900: topo da sidebar foi de -17px para 18px no fim da rolagem. O diagnóstico original do item 1 estava incompleto. |
| REF-02 | Concluído | Nova classe `.oa-panel-body` (16px 16px 28px; 20px 24px 30px a partir de 768px), aplicada às molduras de Status operacional, Filtros operacionais, Dados da ocorrência, Registro operacional, Atualizar status e Designação de Lanterna. Tabelas seguem rentes por decisão, e `.oa-panel-content` não recebeu padding. |
| REF-03 | Concluído | Opção A aplicada: `clip-path` do `.oa-badge` em `polygon(0 4px, 4px 0, 100% 0, 100% 100%, 0 100%)`. |
| REF-04 | Concluído | A engrenagem foi trocada pelo novo ícone "brilho" (`IconeOa`). O botão recebeu a classe `oa-calm-toggle` (borda de energia quando ativo) e tooltip visível por hover e foco, ligado por `aria-describedby`. Textos: "Modo calmo: reduz brilho e animações" e "Modo calmo ligado: brilho e animações reduzidos". O nome acessível "Reduzir efeitos luminosos" foi mantido. |
| REF-05 | Concluído (opção 2) | O cubo virou `role="img"` com nome e tooltip "Rede OANET: 3.600 setores sob a guarda de Oa". O texto vem do material de `/sobre`, não é métrica. Não há interação nova. |
| Hidratação (extra) | Concluído | Corrigido o aviso "1 Issue" do Next em todas as telas. `useMovimentoOa` gravava `data-offscreen` nas molduras antes da hidratação; `MolduraOa` recebeu `suppressHydrationWarning`. |

Verificações: `npm run test:run` (40 arquivos, 206 testes, exit 0), `npm run lint` (exit 0) e `npm run build` (exit 0). Não há erros de console no dev em 5 rotas. Capturas feitas em 1440 e 375 px.

Pendente: decisão de produto sobre tornar o cubo de setores interativo (REF-05, opção 1).
