# Backend

Para testar autenticação, POST/PATCH e demais rotas pelo Postman, importe a coleção e o ambiente de [postman/README.md](postman/README.md). O roteiro inclui 65 chamadas com verificações automáticas e exemplos de JSON.

Execute os comandos deste documento dentro da pasta `backend/`. A raiz do repositório contém o projeto frontend Next.js e tem seus próprios comandos e configuração TypeScript.

```powershell
cd backend
```

## Requisitos

- Node.js `^22.13.0` ou `>=24.11.0` (TypeORM 1.1 não aceita Node 24.9).
- SQLite local em `DATABASE_PATH` e as variáveis obrigatórias de `.env.example`.

Na primeira configuração, copie o exemplo para `.env` dentro de `backend/`:

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e substitua `JWT_SECRET` por um segredo aleatório com pelo menos 32 bytes. Mantenha `PORT=3001` como um número inteiro. O arquivo `.env.example` é somente o modelo; ele não é carregado automaticamente. Em instalações já configuradas, preserve o `.env` existente.

Depois de configurar `.env`, compile e aplique as migrations:

```powershell
npm install
npm run build
npm run migration:run
npm run seed -- --etapa completa
npm start
```

Com a API em execução, `GET http://localhost:3001/saude` confirma que ela iniciou. O processo usa o mesmo `DATABASE_PATH` configurado no `.env`; após reiniciar com esse caminho, os registros permanecem no SQLite. Para desenvolvimento, `npm run start:dev` inicia a API com recarga automática.

## Seed mínimo de demonstração

`npm run seed -- --etapa minima` insere os Setores 0, 674 e 2814 e a conta Guardião abaixo. A execução é idempotente: reexecutá-la não duplica os registros. O seed não cadastra essa conta pela API pública.

| Papel | E-mail | Senha local de demonstração |
|---|---|---|
| Guardião | `ganthet@oa.tropa` | `guardiao123` |

Para definir outra senha, forneça `SEED_SENHA` no ambiente antes do comando. A senha precisa ter ao menos 8 caracteres e no máximo 72 bytes UTF-8. As senhas no banco são hashes bcrypt.

`npm run seed -- --limpar --etapa minima` apaga e recria o banco indicado por `DATABASE_PATH`. Esse modo exige `NODE_ENV=development` e caminho absoluto para o arquivo SQLite. É recusado em produção e não deve ser usado contra dados que precisem ser preservados. O seed comum não apaga dados.

## Seed completo de demonstração

`npm run seed -- --etapa completa` adiciona os sete Setores, 25 fichas de Lanternas, as contas de demonstração de Hal Jordan e Kilowog (Setores 2814 e 674), nove ocorrências históricas, seus eventos e seis comentários (um apagado). As ocorrências e eventos passam pelos serviços transacionais do domínio; ao repetir o seed, IDs e datas existentes são preservados e o status de cada Lanterna é recalculado. A conta sem ficha existe na fixture de integração etapa b. Campos sem fonte continuam como `null`, com as fontes registradas em cada Ficha.

| Papel | E-mail | Senha local de demonstração | Ficha | Setor |
|---|---|---|---|---:|
| Guardião | `ganthet@oa.tropa` | `guardiao123` | — | — |
| Lanterna | `hal@oa.tropa` | `lanterna123` | `hal-jordan` | 2814 |
| Lanterna | `kilowog@oa.tropa` | `lanterna123` | `kilowog` | 674 |

`SEED_SENHA` substitui a senha local das contas criadas pelo seed. `SEED_INSTANTE` (opcional, data ISO com fuso) fixa o único instante de referência usado para calcular as datas históricas; sem ele, o seed captura o horário atual uma vez. `npm run seed -- --limpar --etapa completa` recria o banco completo e tem as mesmas proteções de desenvolvimento e caminho absoluto do seed mínimo.

## Fixture de integração

Depois de migrar um SQLite vazio, `npm run fixture:integracao` grava a etapa a: Setores 2814 e 674 e cinco contas estáveis (G, segundo Guardião, L2814, L674 e Lanterna sem Ficha). Para escolher uma etapa mais completa, passe `--etapa` com um valor entre `b`, `c`, `d` e `e`: b acrescenta fichas e vínculos; c acrescenta Ocorrências abertas, vencida, no prazo e excluída; d aplica atribuições, transições e resoluções; e acrescenta Comentários de autores distintos e um Evento de exclusão. Cada etapa prepara o conjunto cumulativo correspondente em banco novo. A fixture recusa produção, banco sem migration, banco com dados, caminho relativo e senha ausente. Defina `FIXTURE_SENHA` no ambiente; não há senha padrão. Ela deve ter ao menos 8 caracteres e no máximo 72 bytes UTF-8.

O comando imprime o manifesto JSON sem senha, hash ou token. A etapa `e`, usada pelo integrador, prepara 2 Setores, 5 contas de teste (G, G2, L2814, L674 e L-sem-ficha), 3 Fichas, 22 Ocorrências, 33 Eventos e 3 Comentários. IDs de contas, Fichas, Ocorrências e Comentários são estáveis; os Eventos gerados pelo ciclo de vida usam UUIDs e aparecem no manifesto de cada execução.

| Recurso | IDs estáveis |
|---|---|
| Setores | `2814`, `674` |
| Contas G, G2, L2814, L674, L-sem-ficha | `f1f68873-7ea3-4e5a-817f-aca74d4d2814`, `d50dfc82-a05b-4aef-9bd2-5f2dd6f2674a`, `6d77f441-a918-4716-9343-7823028c2814`, `bed7e7b5-3144-4a65-9b71-f28619696740`, `32facbd1-c095-45c0-b64a-fb8d238f0001` |
| Fichas Hal 2814, Kilowog 674, sem Setor | `fixture-hal-2814`, `fixture-kilowog-674`, `fixture-sem-setor` |
| Ocorrências 1–22 | `a0800000-0000-4000-8000-<índice hexadecimal de 000000000001 a 000000000016>` |
| Comentários 1–3 | `a0830000-0000-4000-8000-000000000001`, `a0830000-0000-4000-8000-000000000002`, `a0830000-0000-4000-8000-000000000003` |

O manifesto traz os IDs completos, vínculos, estados e contagens da execução. Para gravá-lo em arquivo:

```powershell
npm run fixture:integracao -- --saida .\data\manifesto-etapa-a.json
```

Exemplo PowerShell para um banco exclusivo de integração:

```powershell
$env:DATABASE_PATH = (Join-Path (Get-Location) 'data\integracao.sqlite')
$env:FIXTURE_SENHA = 'senha-local-de-integracao'
npm run migration:run
npm run fixture:integracao -- --etapa e --saida .\data\manifesto-etapa-e.json
```

As contas usam o mesmo valor de `FIXTURE_SENHA` e podem autenticar por `POST /auth/login`. O manifesto contém IDs estáveis, estado e contagens, sem senha, hash ou token.
