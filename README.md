# ERP da Tropa dos Lanternas Verdes

Front-end da Central de Oa: registro e acompanhamento de ocorrências intergalácticas.
Trabalho da disciplina Desenvolvimento Web com React & Next.js (Prof. Wellington).

## Como rodar

Requisitos: Node.js 20.9 ou mais novo.

```bash
npm install
cp .env.example .env.local   # depois troque o SESSION_SECRET por um valor aleatório
npm run api                  # terminal 1: API fake (json-server) em http://localhost:3001
npm run dev                  # terminal 2: aplicação em http://localhost:3000
```

## Usuários de demonstração

| Usuário | Papel | Setor | E-mail | Senha |
|---|---|---|---|---|
| Ganthet | Guardião | todos | ganthet@oa.tropa | guardiao123 |
| Hal Jordan | Lanterna | 2814 | hal@oa.tropa | lanterna123 |
| Kilowog | Lanterna | 674 | kilowog@oa.tropa | lanterna123 |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run api` | json-server com `db.json` na porta 3001 |
| `npm run test:run` | testes (Vitest) uma vez; `npm test` fica observando |
| `npm run lint` | ESLint |
| `npm run build` | build de produção |

## Organização

- `app/(site)`: área pública (homepage, lanternas, sobre, login, acesso negado).
- `app/(painel)`: Central de Comando, protegida.
- `proxy.ts`: o "middleware" do enunciado (no Next.js 16 o arquivo se chama `proxy.ts`).
- `lib/`: camada de serviço (uma função por operação), sessão e schemas Zod.
- `components/`: componentes reutilizáveis; `components/ui` é gerado pelo shadcn/ui.
- `.claude/skills/padroes-wellington`: as regras de código com a fonte de cada uma (slide, doc ou decisão).
- `docs/AUDITORIA.md` e `docs/ROTEIRO.md`: evidências dos requisitos e roteiro da apresentação.

## Limitações conhecidas (API fake)

O json-server não tem autenticação: as senhas ficam em texto puro no `db.json`. Na etapa de back-end,
`lib/` e `API_URL` são o principal ponto de integração com a API real. As telas podem continuar se o
contrato de dados for mantido; o login e a sessão podem precisar de ajustes para autenticação com hash.
