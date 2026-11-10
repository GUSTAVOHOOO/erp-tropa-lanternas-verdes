---
status: accepted
---

# O token JWT fica no servidor do Next, em cookie httpOnly

O back-end NestJS emite o JWT no login. O front não o guarda em `localStorage` nem chama a API do navegador: Server Actions e Server Components chamam a API com `Authorization: Bearer`, e o token vive num cookie `httpOnly` lido só no servidor do Next. Escolhemos isso para o token ficar fora do alcance de qualquer script no navegador (XSS) e para manter a arquitetura atual de Actions, `dal.ts` e `proxy.ts`.

## Opções consideradas

- **Token no navegador (`localStorage`) e chamadas diretas à API**: mais simples, mas qualquer XSS rouba a sessão, e a API precisaria de CORS para a origem do front.
- **Cookie assinado criado pelo front (modelo anterior, com HMAC)**: servia à API fake. Com back-end real o papel e o setor passam a vir da API, então o front não deve fabricar sessão.

## Consequências

- Toda chamada à API acontece no servidor; não há navegador consumindo a API direto, então o CORS da API é mínimo.
- A expiração do cookie acompanha a do token; 401 vindo da API significa sessão inválida e leva ao login.
- O papel e o setor mostrados na interface vêm da API (token ou `/me`), nunca de dados que o front produziu.
