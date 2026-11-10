# Dados e consumo da API real

Abra só o arquivo do seu assunto. `...` nas fontes = `node_modules/next/dist/docs/01-app/`.

- [cliente-http.md](cliente-http.md) — API-17, API-02, API-03, API-08, API-16: lib/api.ts, checagem de resposta, ApiError com código, API_URL, montagem de URL
- [camada-servico.md](camada-servico.md) — API-01, API-04, API-19, API-14: uma função por operação, validar resposta com Zod, paginação, escrita (POST/PATCH/DELETE)
- [leitura-e-cache.md](leitura-e-cache.md) — API-05, API-06, API-07, API-15: buscar no servidor, cache explícito, Promise.all, sem busca no cliente
- [erros.md](erros.md) — API-12, API-13, API-18: destino de cada status, mensagens humanas, código estável para campo ou erro geral
- [estados-da-tela.md](estados-da-tela.md) — API-09, API-10, API-11: carregando, vazio, erro, sucesso; loading.tsx e error.tsx com retry
