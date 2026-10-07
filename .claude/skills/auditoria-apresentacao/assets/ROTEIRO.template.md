# Roteiro de apresentação: ERP da Tropa dos Lanternas Verdes

- **Data:** {{AAAA-MM-DD}} · **Versão:** {{hash}}
- **Duração alvo:** {{n}} min · **Integrantes:** {{nomes}}

Como usar: cada integrante estuda as features que vai apresentar. Em "Por que assim", a fonte está
escrita do jeito que deve ser dita: "slide de Formulários, página 20". Se a origem é Docs ou
Decisão, diga isso; não atribua ao professor.

## Ordem da demonstração

1. {{Homepage e navegação pública}} ({{quem}}, {{min}})
2. {{Páginas públicas: setores}}
3. {{Login e tentativa de acesso sem login}}
4. {{Painel como Lanterna: só o setor dele; tentativa de ver outro setor → 403}}
5. {{Painel como Guardião: tudo + atribuir responsável}}
6. {{Nova ocorrência: validação no cliente e no servidor}}
7. {{Estados de tela: loading, vazio, erro (derrubar o json-server)}}
8. {{Arquitetura: lib/, troca de API_URL para o back-end}}

---

## Feature: {{nome}}

**O que é:** {{uma ou duas frases, do ponto de vista do usuário}}

**Arquivos:**
- `{{caminho}}`: {{papel do arquivo}}

**Como funciona (fluxo):**
1. {{passo, citando arquivo:linha}}
2. ...

**Por que assim:**
- **[{{ID}}]** {{regra em uma linha}}. Fonte: {{Slide DECK p. N / Docs <url> / Decisão do grupo}}.
- ...

**Trecho para mostrar na tela:** `{{arquivo}}:{{linha inicial}}-{{linha final}}`

**Pergunta provável do professor:** {{pergunta}}
**Resposta:** {{resposta curta, citando a regra e a fonte}}

**Quem apresenta:** {{nome}}

---

{{Repetir a seção "Feature" para cada feature.}}

## Perguntas gerais (qualquer integrante deve saber responder)

| Pergunta | Resposta curta | Regras |
|---|---|---|
| {{...}} | {{...}} | {{IDs}} |
