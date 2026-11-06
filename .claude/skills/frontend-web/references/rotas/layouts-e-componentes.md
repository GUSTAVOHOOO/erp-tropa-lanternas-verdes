# Layouts, Server e Client Components

### ROTA-05: Um único layout raiz com html lang="pt-BR"
**Fonte:** [SLIDE] ROTAS p. 14 ("único lugar com `<html>` e `<body>`", `<html lang="pt-BR">`)
**Regra:** `app/layout.tsx` é o único arquivo com `<html>` e `<body>`, com `lang="pt-BR"`. Layouts
de grupo devolvem só a casca (header, sidebar) e `{children}`.
**✅ Certo:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```
**❌ Errado:** `<html>` dentro de `app/(painel)/layout.tsx`, ou `lang="en"` deixado do create-next-app.
**Como verificar:** `rg -n "<html" app` deve achar só `app/layout.tsx`, com `lang="pt-BR"`.

### ROTA-06: Layout para tudo que se repete entre rotas
**Fonte:** [SLIDE] ROTAS p. 14 ("layout.tsx: a casca que persiste", "Estado preservado"); p. 22
**Regra:** Header público vai em `app/(site)/layout.tsx`; sidebar e botão "Sair" em
`app/(painel)/layout.tsx`. Nenhuma página repete header/menu.
**✅ Certo:**
```tsx
// app/(painel)/layout.tsx
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 p-6">{children}</main></div>
}
```
**❌ Errado:** `<Sidebar />` importado em cada `page.tsx` do painel.
**Como verificar:** `rg -n "<(Header|Sidebar|Footer|Menu)" app -g page.tsx` deve retornar vazio.

### ROTA-07: Páginas são Server Components; podem ser async e ter metadata
**Fonte:** [SLIDE] ROTAS p. 13 ("Server Component por padrão: pode ser async", `export const metadata`); APIS p. 11
**Regra:** `page.tsx` não leva `'use client'`. Ela é `async`, busca os dados pela camada de serviço
(API-05) e exporta `metadata` com título em português (o sufixo do site vem do `title.template`: PROD-04).
**✅ Certo:**
```tsx
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Ocorrências' }
export default async function OcorrenciasPage() { const lista = await listarOcorrencias({}); ... }
```
**❌ Errado:** `'use client'` no topo de `page.tsx` para poder usar `useEffect` e buscar dados.
**Como verificar:** `rg -l "^['\"]use client['\"]" app -g page.tsx` deve retornar vazio.

### ROTA-08: 'use client' só nos componentes interativos, nunca em layout
**Fonte:** [SLIDE] ROTAS p. 13 ("'use client' só se precisar. Estado e eventos? Extraia um componente cliente pequeno"); p. 22 (armadilha "'use client' no layout inteiro") + [DOCS] https://nextjs.org/docs/app/getting-started/server-and-client-components
**Regra:** Só leva `'use client'` o arquivo que usa estado, evento, hook de cliente (`useState`,
`useForm`, `usePathname`, `useRouter`, `useSearchParams`) ou API do navegador. Layouts e páginas
ficam no servidor e importam o pedaço interativo. Exceção obrigatória: `error.tsx` (ROTA-21).
**✅ Certo:**
```tsx
// components/MenuNavegacao.tsx
'use client'
import { usePathname } from 'next/navigation'
```
**❌ Errado:**
```tsx
// app/(painel)/layout.tsx
'use client'
```
**Como verificar:** `rg -l "^['\"]use client['\"]" app components` e conferir, arquivo por arquivo, que existe um hook de cliente ou evento; `rg -l "^['\"]use client['\"]" app -g layout.tsx` deve retornar vazio.
