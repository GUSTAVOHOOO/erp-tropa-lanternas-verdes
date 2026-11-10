# Autenticação e segurança

Conteúdo: fluxo, senhas, usuário, JWT, login, autorização, ameaças, token no front-end, prova de proteção.

## Fluxo

```
Login (uma vez):  e-mail e senha → API compara com o hash → assina e devolve JWT
Cada requisição:  Authorization: Bearer <token> → guard confere a assinatura → libera
```

## Senhas

Hash forte é de mão única, com sal aleatório por senha e custo lento de propósito (bcrypt: 10 ou mais). Compare com a função da biblioteca.

## Usuário

- Hash oculto nas consultas comuns (como `select: false`) protege só **leituras**: após salvar, o objeto em memória ainda tem o hash.
- Normalize o e-mail (minúsculas, sem espaços) antes de salvar e comparar.
- E-mail único com restrição no banco, além da checagem no service.

## JWT

`header.payload.assinatura`, com `HMACSHA256(header + "." + payload, JWT_SECRET)`.

- **Assinado, não secreto:** qualquer um lê o payload.
- **Adulterou, invalidou:** trocar o papel à mão quebra a assinatura, e a API responde 401.
- **Algoritmo fixo:** recuse outro `alg`, inclusive `none`.
- **Segredo:** 32 bytes ou mais, aleatório. Expiração de cerca de uma hora.

**Limites do JWT stateless:** papel no token vale até expirar, e logout não invalida. Em operação crítica ou conta bloqueada, confira o usuário no banco ou mantenha lista de revogados. Sessão longa pede refresh token.

## Login

```
entrar(dto):
    usuario = buscarComSenha(dto.email)
    ok = compare(dto.senha, usuario?.hash ou hashIsca)
    se não usuario ou não ok: lançar 401 "E-mail ou senha inválidos"
    retornar { accessToken: assinar({ sub, email, papel }) }
```

O hash isca iguala o tempo de resposta: sem ele, e-mail inexistente responde mais rápido e revela quem tem conta.

No cadastro, "e-mail já cadastrado" (409) também revela a conta. Costuma ser aceitável; se a privacidade pesar mais, responda sempre igual e continue por e-mail.

## Autorização

- **Seguro por padrão:** com guard global, esquecer a marca de pública gera 401 fácil de notar.
- **Ordem dos guards:** primeiro quem é, depois o papel, que depende do usuário preenchido antes.
- **Dono:** o guard não sabe de quem é o registro, o service sabe.

```
buscarDoUsuario(id, usuario):
    registro = await buscar(id)
    se registro.donoId != usuario.sub e usuario.papel != 'admin':
        lançar NaoEncontrado          // 404, não 403
    retornar registro
```

Trocar `/reservas/7` por `/reservas/8` e ver dado alheio é **IDOR/BOLA**, a falha mais comum em APIs.

Faça um mapa de permissões por rota:

| Rota | Quem pode | Senão |
|---|---|---|
| `GET /recursos` | qualquer um | – |
| `POST/PATCH/DELETE /recursos` | admin | 403 |
| `POST /reservas` | usuário logado | 401 |
| `GET /reservas/minhas` | o próprio | 401 |
| `GET /reservas/:id` | dono ou admin | 404 |

## Ameaças ainda não cobertas pelas regras

| Ameaça | Defesa |
|---|---|
| Token roubado | expiração curta e HTTPS |
| Segredo vazado | rotação |
| Limite por IP atrás de proxy | configurar a confiança no proxy, senão todos dividem o mesmo IP |

Segurança é em camadas: cada defesa fecha uma porta que as outras deixam aberta.

## Token no front-end

Prefira cookie a `localStorage`, porque JavaScript não lê um cookie `httpOnly`, e um XSS não rouba o token.

```
Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax
```

Com servidor no front (Next.js e afins), uma ação no servidor faz o login, guarda o token em cookie e o reenvia como `Authorization: Bearer`. Se o navegador chamar a API direto com cookie, adicione proteção contra CSRF.

## Prova de proteção

| Requisição | Esperado | Quem barra |
|---|---|---|
| Cadastro com `"papel": "admin"` | 400 | validação |
| Cadastro com e-mail usado | 409 | service |
| Senha errada | 401 | service |
| Rota protegida sem token | 401 | guard |
| Ação de admin como usuário comum | 403 | guard de papel |
| Token com papel trocado à mão | 401 | assinatura |
| Recurso de outra pessoa | 404 | service |
| Várias tentativas de login | 429 | limitador |
