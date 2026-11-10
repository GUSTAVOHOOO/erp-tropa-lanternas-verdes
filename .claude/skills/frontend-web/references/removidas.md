# IDs removidos (lápides)

Estes IDs saíram da skill, mas o código do app ainda pode trazer marcadores como `// [AUTH-03]`. Não os reutilize para outra regra. Ao encontrar um marcador abaixo no código, o trecho está desatualizado em relação à skill e deve migrar para a regra indicada.

### AUTH-03: (removida) Cookie assinado com HMAC e SESSION_SECRET
**Fonte:** [DECISÃO] aposentada: o cookie fabricado e assinado pelo front deu lugar ao JWT da API.
**Regra:** Removida. O front não assina cookie nem guarda `SESSION_SECRET`. Substituída por AUTH-02 (cookie com o JWT), AUTH-04 (papel vindo da API) e AUTH-12 (token só no servidor).

### AUTH-11: (removida) Limitações da API fake documentadas
**Fonte:** [DECISÃO] aposentada junto com a API fake.
**Regra:** Removida. Senha em texto puro e login no front deixaram de existir: hash e login são da API (`backend-api`). O front nunca recebe nem exibe senha ou hash. Ver AUTH-08.

### STACK-04: (removida) API fake com json-server em db.json, porta 3001
**Fonte:** [DECISÃO] aposentada: a API agora é o back-end real (`backend-api`).
**Regra:** Removida. Nada mais é simulado. Substituída por API-17 (cliente único), API-08 (`API_URL`) e PROD-01 (ambiente validado).

### DEC-09: (removida) Mapa das áreas exigidas pelo enunciado
**Fonte:** [DECISÃO] aposentada: mapeava áreas de um enunciado acadêmico.
**Regra:** Removida. A localização de rotas e arquivos é a árvore de STACK-05 e o `docs/agents/MAPA.md` do projeto.
