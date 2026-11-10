# Listas na URL e estado otimista

### PROD-06: Paginação, busca, filtros e ordenação nas listas vivem na URL
**Fonte:** [DECISÃO] aprovada (estende ROTA-14 e API-19)
**Regra:** Os `searchParams` de uma lista passam por um schema Zod com `.catch` (valor inválido vira padrão, não erro); `pagina` mínimo 1, `limite` com teto, texto da busca com `trim` e tamanho máximo, ordenação só pelos campos permitidos. Mudar busca ou filtro volta para `pagina=1`. A busca digitada atualiza a URL com debounce (`router.replace`, `useTransition` para o indicador). Envolva a lista em `<Suspense key={…params}>` para que o `loading` apareça a cada troca. Estado vazio com ação (API-09). Os controles mostram a página atual e o total (`meta`, API-19).
**✅ Certo:**
```ts
const buscaSchema = z.object({
  q: z.string().trim().max(100).catch(''),
  pagina: z.coerce.number().int().min(1).catch(1),
  status: z.enum(STATUS).optional().catch(undefined),
})
const filtro = buscaSchema.parse(await searchParams) // [PROD-06]
```
**❌ Errado:** `useState` para filtro ou página (some no F5); buscar a cada tecla sem debounce; `?pagina=abc` quebrando a página.
**Como verificar:** abra `?pagina=abc&status=xyz`: a lista carrega com os padrões; F5 e botão Voltar preservam o filtro; troque o filtro e a página volta a 1.

### PROD-07: Estado otimista só para ação reversível, com desfazer visível
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../02-guides/forms.md` (exemplo com `useOptimistic`)
**Regra:** Use `useOptimistic` dentro de `startTransition` para ações curtas, quase sempre bem-sucedidas e reversíveis (marcar, favoritar, mudar status). A Server Action continua sendo a autoridade: ao terminar, `revalidatePath` traz o dado real; se falhar, a UI volta ao valor anterior **e** mostra a mensagem (API-13). Não use para pagamento, estoque, exclusão sem desfazer, nem quando a regra do servidor muda o resultado (409/422 são esperados).
**✅ Certo:**
```tsx
const [otimista, setOtimista] = useOptimistic(status)
function mudar(novo: Status) {
  startTransition(async () => {
    setOtimista(novo) // [PROD-07]
    const r = await atualizarStatus(id, novo)
    if (!r.ok) setErro(r.erro) // ao fim da transição, a UI volta ao valor real
  })
}
```
**❌ Errado:** atualizar a UI e ignorar o retorno da action; otimismo em operação financeira; erro silencioso.
**Como verificar:** com a API desligada, mude o status: a UI reverte e a mensagem aparece; com a API lenta, o resultado aparece antes da resposta.
