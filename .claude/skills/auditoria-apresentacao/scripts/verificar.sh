#!/usr/bin/env bash
# Verificações automáticas do projeto contra a skill padroes-wellington.
# Uso: bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh <raiz-do-projeto-next>
# Saída: uma linha por verificação. "OK" = nada encontrado. "VIOLACAO" = regra quebrada com certeza.
# "REVISAR" = heurística: abrir os arquivos listados e decidir. Explicação de cada C-xx em references/checks.md.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REGRAS_DIR="$SCRIPT_DIR/../../padroes-wellington/references"
RAIZ="${1:-.}"
cd "$RAIZ" || { echo "Pasta não encontrada: $RAIZ"; exit 1; }

DIRS=""
for d in app components lib; do [ -d "$d" ] && DIRS="$DIRS $d"; done
if [ -z "$DIRS" ]; then echo "Nenhuma pasta app/, components/ ou lib/ em $(pwd). Passe a raiz do projeto Next."; exit 1; fi

VIOLACOES=0
REVISOES=0

# Lista arquivos .ts/.tsx do projeto (sem node_modules, .next e components/ui gerado pelo shadcn)
arquivos() {
  { find $DIRS -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null; [ -f proxy.ts ] && echo proxy.ts; } \
    | grep -v -e '/node_modules/' -e '/\.next/' -e '^components/ui/'
}

# grep em todos os arquivos do projeto
g() { arquivos | tr '\n' '\0' | xargs -0 -r grep -nE "$@" 2>/dev/null; }
# arquivos que casam com o padrão
gl() { arquivos | tr '\n' '\0' | xargs -0 -r grep -lE "$@" 2>/dev/null; }

relatar() { # tipo id regra descricao achados
  local tipo="$1" id="$2" regra="$3" desc="$4" achados="$5"
  if [ -z "$achados" ]; then
    echo "OK        $id [$regra] $desc"
  else
    echo "$tipo  $id [$regra] $desc"
    echo "$achados" | head -30 | sed 's/^/    /'
    [ "$(echo "$achados" | wc -l)" -gt 30 ] && echo "    ... (mais resultados omitidos)"
    if [ "$tipo" = "VIOLACAO" ]; then VIOLACOES=$((VIOLACOES+1)); else REVISOES=$((REVISOES+1)); fi
  fi
}

# Arquivos que contêm A mas não contêm B
com_sem() { # padraoA padraoB [filtro-de-caminho]
  local f
  gl "$1" | grep -E "${3:-.}" | while IFS= read -r f; do grep -qE "$2" "$f" || echo "$f"; done
}

# Para cada linha que casa com A, procura B nas N linhas seguintes; imprime arquivo:linha quando não acha
janela_sem() { # padraoA padraoB N
  arquivos | while IFS= read -r f; do
    PAD_A="$1" PAD_B="$2" awk -v N="$3" -v F="$f" '
      $0 ~ ENVIRON["PAD_A"] { if (pend) print F":"ini; pend=1; ini=NR; fim=NR+N }
      pend && $0 ~ ENVIRON["PAD_B"] { pend=0 }
      pend && NR>=fim { print F":"ini; pend=0 }
      END { if (pend) print F":"ini }' "$f"
  done
}

echo "== Verificações automáticas: $(pwd) =="
echo

# ---------- Rotas e navegação ----------
relatar VIOLACAO C-01 ROTA-18 "import de next/router" "$(g "from ['\"]next/router['\"]")"
relatar VIOLACAO C-02 ROTA-16 "<a href> interno ou window.location" "$(g "<a [^>]*href=[\"'{]/|window\.location")"
relatar VIOLACAO C-05 ROTA-07/08 "'use client' em page.tsx ou layout.tsx" "$(arquivos | grep -E '/(page|layout)\.tsx$' | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use client['\"]" && echo "$f"; done)"
relatar VIOLACAO C-08 ROTA-10 "params/searchParams tipados sem Promise" "$(g "(params|searchParams): \{")"
relatar VIOLACAO C-09 ROTA-10 "params/searchParams lidos sem await (page/layout)" "$(arquivos | grep -E '/(page|layout)\.tsx$' | tr '\n' '\0' | xargs -0 -r grep -nE "[^a-zA-Z](params|searchParams)\.[a-zA-Z]" 2>/dev/null)"
relatar VIOLACAO C-13 ROTA-21 "error.tsx sem 'use client'" "$(arquivos | grep -E '/error\.tsx$' | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use client['\"]" || echo "$f"; done)"
relatar VIOLACAO C-14 ROTA-21/API-10 "page com dados sem loading.tsx/error.tsx na pasta ou acima" "$(arquivos | grep -E '/page\.tsx$' | while IFS= read -r f; do
    grep -qE "await (listar|buscar)|Promise\.all" "$f" || continue
    for alvo in loading.tsx error.tsx; do
      d="$(dirname "$f")"; achou=0
      while [ "$d" != "." ] && [ "$d" != "/" ]; do [ -f "$d/$alvo" ] && { achou=1; break; }; [ "$d" = "app" ] && break; d="$(dirname "$d")"; done
      [ $achou -eq 0 ] && echo "$f (falta $alvo)"
    done
  done)"
relatar VIOLACAO C-35 ROTA-05 "layout raiz sem <html lang=\"pt-BR\">" "$( [ -f app/layout.tsx ] && { grep -q 'lang="pt-BR"' app/layout.tsx || echo app/layout.tsx; } || echo 'app/layout.tsx não existe')"
relatar VIOLACAO C-36 ROTA-22 "falta app/not-found.tsx" "$( [ -f app/not-found.tsx ] || echo 'app/not-found.tsx')"
relatar VIOLACAO C-41 ROTA-05 "<html> fora do layout raiz" "$(g "<html" | grep -v '^app/layout\.tsx:')"
relatar REVISAR  C-38 ROTA-08 "arquivos com 'use client' (conferir se precisam)" "$(arquivos | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use client['\"]" && echo "$f"; done)"

# ---------- Autenticação ----------
relatar VIOLACAO C-07 AUTH-01 "middleware.ts em vez de proxy.ts / proxy.ts ausente" "$( { [ -f middleware.ts ] && echo 'middleware.ts existe'; [ -f proxy.ts ] || echo 'proxy.ts não existe'; [ -f proxy.ts ] && ! grep -qE 'export (default )?function proxy|export const proxy' proxy.ts && echo 'proxy.ts não exporta a função proxy'; } )"
relatar VIOLACAO C-12 AUTH-04 "página privada sem verificarSessao/exigirPapel" "$(arquivos | grep -E '^app/\(painel\)/.*page\.tsx$' | while IFS= read -r f; do grep -qE 'verificarSessao|exigirPapel' "$f" || echo "$f"; done)"
relatar VIOLACAO C-10 AUTH-05 "Server Action do painel sem verificarSessao/exigirPapel" "$(arquivos | grep -E '^app/\(painel\)/' | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use server['\"]" || continue; awk -v F="$f" '/export async function/ { if (fn && !ok) print F": "fn; fn=$0; ok=0 } /verificarSessao|exigirPapel/ { ok=1 } END { if (fn && !ok) print F": "fn }' "$f" | grep -v 'function sair'; done)"
relatar VIOLACAO C-33 AUTH-02/ROTA-10 "cookies() usado sem await" "$(g "[^(]cookies\(\)\.(get|set|delete|has)")"
relatar VIOLACAO C-34 AUTH-02 "localStorage/sessionStorage/document.cookie" "$(g "localStorage|sessionStorage|document\.cookie")"
relatar VIOLACAO C-49 AUTH-06 "forbidden() / authInterrupts experimentais" "$( { g "forbidden\("; [ -f next.config.ts ] && grep -n "authInterrupts" next.config.ts; } )"

# ---------- Formulários ----------
relatar REVISAR  C-06 FORM-12 "useState e register no mesmo arquivo (conferir se é o mesmo campo)" "$(gl 'register\(' | while IFS= read -r f; do grep -q 'useState' "$f" && echo "$f"; done)"
relatar VIOLACAO C-27a FORM-01 "useForm sem zodResolver" "$(com_sem 'useForm\(' 'zodResolver\(')"
relatar VIOLACAO C-27b FORM-04 "useForm sem defaultValues" "$(com_sem 'useForm\(' 'defaultValues')"
relatar VIOLACAO C-27c FORM-05 "useForm sem mode onBlur + reValidateMode onChange" "$( { com_sem 'useForm\(' "mode: ['\"]onBlur"; com_sem 'useForm\(' "reValidateMode: ['\"]onChange"; } | sort -u)"
relatar VIOLACAO C-28 FORM-06 "onSubmit sem handleSubmit" "$(g "onSubmit=\{" | grep -v 'handleSubmit')"
relatar VIOLACAO C-29 FORM-07 "<form> com handleSubmit sem noValidate (mesma linha)" "$(g "<form[^>]*handleSubmit" | grep -v 'noValidate')"
relatar REVISAR  C-30 FORM-10 "mensagem de erro em <p>/<span> sem role=\"alert\"" "$(g "<(p|span)[^>]*>.*(errors\.|fieldState\.error|erro\})" | grep -v 'role="alert"')"
relatar VIOLACAO C-31 FORM-21 "watch( solto (usar useWatch)" "$(g "(^|[^A-Za-z])watch\(")"
relatar REVISAR  C-32 FORM-14 ".refine( sem path: nas 5 linhas seguintes" "$(janela_sem '\.refine\(' 'path:' 5 | grep -E '^lib/schemas/')"
relatar VIOLACAO C-25 FORM-15/18 "sintaxe Zod 3 (z.string().email(), .flatten())" "$(g "z\.string\(\)\.(email|uuid|url)\(|\.flatten\(\)")"
relatar REVISAR  C-26 FORM-13 "z.number() em lib/schemas (só vale em schema de resposta)" "$(g "z\.number\(\)" | grep -E '^lib/schemas/')"
relatar VIOLACAO C-11 FORM-17 "arquivo 'use server' sem safeParse" "$(arquivos | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use server['\"]" || continue; grep -q 'safeParse' "$f" || echo "$f"; done | grep -v '^app/(painel)/actions\.ts$')"
relatar VIOLACAO C-46 FORM-02 "z.object( fora de lib/" "$(g "z\.object\(" | grep -v '^lib/')"
relatar VIOLACAO C-50 FORM-03 "useForm com genérico (useForm<...>)" "$(g "useForm<")"

# ---------- API ----------
relatar VIOLACAO C-04a API-01 "fetch fora de lib/" "$(g "fetch\(" | grep -v '^lib/')"
relatar VIOLACAO C-04b API-02 "arquivo de lib/ com fetch e sem res.ok" "$(com_sem 'fetch\(' '\.ok' '^lib/')"
relatar REVISAR  C-04c API-02 "fetch sem 'if (!res.ok)' nas 6 linhas seguintes" "$(janela_sem 'await fetch\(' '!res\.ok' 6 | grep -E '^lib/')"
relatar VIOLACAO C-15 API-06 "fetch sem cache/revalidate explícito (8 linhas)" "$(janela_sem 'fetch\(' 'cache:|revalidate' 8 | grep -E '^lib/')"
relatar REVISAR  C-51 API-04 "res.json() fora de .parse(" "$(g "res\.json\(\)" | grep -v '\.parse(' | grep -E '^lib/')"
relatar VIOLACAO C-03 API-08 "variável NEXT_PUBLIC_ (projeto não deve ter)" "$( { g "NEXT_PUBLIC_"; for e in .env .env.local .env.example .env.development .env.production; do [ -f "$e" ] && grep -n "NEXT_PUBLIC_" "$e" | sed "s|^|$e:|"; done; } )"
relatar VIOLACAO C-47 API-08 "process.env em arquivo 'use client'" "$(arquivos | while IFS= read -r f; do head -3 "$f" | grep -qE "^['\"]use client['\"]" && grep -n 'process\.env' "$f" | sed "s|^|$f:|"; done)"
relatar REVISAR  C-16 API-05/15 "useEffect (busca no cliente?)" "$(g "useEffect")"
relatar VIOLACAO C-23 API-12 "catch vazio" "$(g "catch *(\([^)]*\))? *\{ *\}")"
relatar VIOLACAO C-24 API-14 "revalidateTag com um argumento (Next 16 exige dois)" "$(g "revalidateTag\(['\"\`][^'\"\`]*['\"\`]\)")"
relatar VIOLACAO C-52 API-11/13 "error.message exibido na tela" "$(g "\{ *(error|e|erro)\.message *\}")"
relatar VIOLACAO C-48 DEC-04 "localhost escrito no código" "$(g "localhost")"

# ---------- Componentes, JS, CSS ----------
relatar VIOLACAO C-17 COMP-13 "key com índice" "$(g "key=\{(i|index|idx)\}")"
relatar VIOLACAO C-44 COMP-14/JS-08 ".length && em JSX" "$(g "\.length &&")"
relatar VIOLACAO C-19 COMP-16/JS-06 "HTML cru ou manipulação direta do DOM" "$(g "dangerouslySetInnerHTML|innerHTML|document\.(querySelector|getElementById)|addEventListener|classList")"
relatar VIOLACAO C-45 COMP-06 "tipo any" "$(g ": any([^a-zA-Z]|$)|<any>")"
relatar VIOLACAO C-53 COMP-15 "class= ou for= em JSX" "$(g " (class|for)=\"" | grep -E '\.tsx:')"
relatar VIOLACAO C-21 JS-01 "var" "$(g "(^|[^a-zA-Z_.])var [a-zA-Z_]")"
relatar VIOLACAO C-22 JS-02 "comparação solta (== ou !=)" "$(g "[^=!<>]==[^=]|!=[^=]")"
relatar VIOLACAO C-20 CSS-02 "style inline" "$(g "style=\{\{")"
relatar REVISAR  C-37 CSS-04/09 "valor arbitrário ou cor hex no className" "$(g "[a-z]-\[[0-9#]|#[0-9a-fA-F]{6}")"
relatar VIOLACAO C-54 CSS-09 "tailwind.config.* criado" "$(ls tailwind.config.* 2>/dev/null)"
relatar VIOLACAO C-55 CSS-07 "<div onClick> no lugar de botão" "$(g "<div[^>]*onClick")"

# ---------- Dependências ----------
relatar VIOLACAO C-18 STACK-06 "dependência fora da lista permitida" "$( [ -f package.json ] && node -e '
  const p = require("./package.json");
  const deps = Object.keys({ ...p.dependencies, ...p.devDependencies });
  const ok = ["next","react","react-dom","typescript","@types/node","@types/react","@types/react-dom",
    "tailwindcss","@tailwindcss/turbopack","eslint","eslint-config-next","react-hook-form","@hookform/resolvers",
    "zod","json-server","vitest","jsdom","@testing-library/react","@testing-library/dom",
    "shadcn","@base-ui/react","class-variance-authority","clsx","tailwind-merge","cn","lucide-react","tw-animate-css"];
  deps.filter(d => !ok.includes(d)).forEach(d => console.log(d));
' 2>/dev/null)"
relatar VIOLACAO C-56 DEC-01/02/07 "import de biblioteca descartada" "$(g "from ['\"](axios|@tanstack/react-query|swr|zustand|redux|@reduxjs/toolkit|jose|next-auth|prop-types|yup|formik)['\"]")"
relatar VIOLACAO C-57 DEC-10 "flags experimentais no next.config" "$( [ -f next.config.ts ] && grep -nE "cacheComponents|reactCompiler|experimental" next.config.ts)"
relatar VIOLACAO C-58 DEC-10 "cacheComponents ligado" "$( [ -f next.config.ts ] && grep -nE "cacheComponents|partialPrefetching" next.config.ts)"

# ---------- Marcadores [ID] ----------
echo
echo "== Marcadores [ID] no código =="
MARC="$(arquivos | tr '\n' '\0' | xargs -0 -r grep -ohE "\[[A-Z]{2,5}-[0-9]{2}\]" 2>/dev/null | tr -d '[]' | sort)"
if [ -z "$MARC" ]; then
  echo "Nenhum marcador encontrado."
else
  echo "$MARC" | uniq -c | sort -k2 | awk '{ printf "  %-9s %s ocorrência(s)\n", $2, $1 }'
  if [ -d "$REGRAS_DIR" ]; then
    INEXISTENTES="$(echo "$MARC" | uniq | while IFS= read -r id; do grep -qE "^### $id:" "$REGRAS_DIR"/*.md || echo "$id"; done)"
    relatar VIOLACAO C-39 SKILL "marcador com ID que não existe em padroes-wellington" "$INEXISTENTES"
  else
    echo "  (pasta de regras não encontrada em $REGRAS_DIR; pulei a checagem de IDs)"
  fi
fi

echo
echo "== Resumo: $VIOLACOES verificação(ões) com VIOLACAO, $REVISOES com REVISAR =="
