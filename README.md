# ERP da Tropa dos Lanternas Verdes

Aplicação web da Central de Oa para registrar, consultar e acompanhar ocorrências intergalácticas. O projeto foi desenvolvido para a disciplina Desenvolvimento Web com React & Next.js (Prof. Wellington).

## Pré-requisitos

- Node.js 26 ou mais novo;
- npm;
- Git.

Confira a versão instalada:

```bash
node --version
```

## Instalação

Na primeira execução, clone o repositório e instale as dependências:

```bash
git clone https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes.git
cd erp-tropa-lanternas-verdes
npm install
```

Crie o arquivo local de variáveis de ambiente:

```bash
cp .env.example .env.local
```

No Windows PowerShell, o equivalente é:

```powershell
Copy-Item .env.example .env.local
```

Abra `.env.local` e troque `SESSION_SECRET` por um segredo aleatório. O arquivo `.env.local` é ignorado pelo Git e não deve ser enviado ao repositório.

## Como executar

A aplicação usa dois servidores durante o desenvolvimento: o Next.js na porta 3000 e o json-server na porta 3001. Abra dois terminais na raiz do projeto.

No primeiro terminal, inicie a API fake:

```bash
npm run api
```

No segundo terminal, inicie a aplicação:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Para encerrar, pressione `Ctrl+C` nos dois terminais.

Se você executar somente `npm run dev`, as páginas sem dados podem abrir, mas login, lanternas e ocorrências não funcionarão corretamente porque a API estará desligada.

## Como navegar

### Área pública

- `/` — apresentação da Central de Oa e links principais;
- `/lanternas` — lista de Lanternas, com filtro por setor;
- `/lanternas/[id]` — ficha de uma Lanterna;
- `/sobre` — informações sobre Oa, a Tropa e o juramento;
- `/login` — entrada na Central de Comando.

### Área privada

- `/painel` — resumo das ocorrências do usuário;
- `/painel/ocorrencias` — lista com filtros de status, gravidade e setor (o filtro de setor aparece para o Guardião);
- `/painel/ocorrencias/nova` — registro de ocorrência;
- `/painel/ocorrencias/[id]` — detalhe e atualização de status;
- `/painel/ocorrencias/[id]/atribuir` — atribuição de responsável, exclusiva do Guardião.

O `proxy.ts` protege as rotas privadas. A página e cada Server Action também verificam a sessão e o papel do usuário. Um Lanterna só acessa o próprio setor, mesmo que tente alterar a URL ou enviar um setor diferente no formulário.

## Usuários de demonstração

| Usuário | Papel | Setor | E-mail | Senha |
|---|---|---|---|---|
| Ganthet | Guardião | todos | `ganthet@oa.tropa` | `guardiao123` |
| Hal Jordan | Lanterna | 2814 | `hal@oa.tropa` | `lanterna123` |
| Kilowog | Lanterna | 674 | `kilowog@oa.tropa` | `lanterna123` |

Para testar todos os fluxos, entre primeiro como Hal, depois saia e entre como Ganthet para conferir os filtros por setor e a atribuição de responsáveis.

## Scripts disponíveis

| Comando | Função |
|---|---|
| `npm run dev` | inicia o Next.js em modo de desenvolvimento |
| `npm run api` | inicia o json-server com `db.json` na porta 3001 |
| `npm run test:run` | executa a suíte Vitest uma vez |
| `npm test` | executa Vitest em modo de observação |
| `npm run lint` | executa o ESLint |
| `npm run build` | gera o build de produção |
| `npm start` | inicia o build de produção; execute `npm run build` antes |

Para validar uma alteração antes de criar commit:

```bash
npm run test:run
npm run lint
npm run build
```

## Estrutura do projeto

- `app/(site)` — páginas públicas, login e acesso negado;
- `app/(painel)` — Central de Comando protegida;
- `components` — componentes reutilizáveis e componentes gerados pelo shadcn/ui;
- `lib` — serviços de API, sessão, autorização, schemas Zod e formatação;
- `__tests__` — testes Vitest e React Testing Library;
- `db.json` — dados iniciais da API fake;
- `.claude/skills/padroes-wellington` — regras de código e fontes usadas no trabalho;
- `docs/AUDITORIA.md` — evidências dos requisitos;
- `docs/ROTEIRO.md` — roteiro para apresentação.

As páginas não chamam a API diretamente: as leituras e escritas passam por `lib/`. Os schemas Zod funcionam como contrato dos dados. Para trocar o json-server por um back-end real, o principal ponto de integração é `API_URL` e a camada de serviço; autenticação e sessão também podem exigir ajustes.

## Dados de demonstração

O json-server grava alterações de POST e PATCH em `db.json`. Para voltar aos dados originais depois de uma demonstração, use somente se você tiver alterações locais descartáveis:

```bash
git restore db.json
```

Não use esse comando para apagar alterações que você queira manter.

## Limitações conhecidas

O json-server não oferece autenticação real e as senhas de demonstração ficam em texto puro no `db.json`. Isso é uma limitação da API fake. Em um back-end real, o login deve usar hash de senha e a action/sessão deve ser adaptada ao contrato de autenticação.

## Documentação do trabalho

Leia [docs/AUDITORIA.md](docs/AUDITORIA.md) para ver a relação entre requisitos, arquivos e regras aplicadas. O [docs/ROTEIRO.md](docs/ROTEIRO.md) explica as features e reúne perguntas prováveis da apresentação.
