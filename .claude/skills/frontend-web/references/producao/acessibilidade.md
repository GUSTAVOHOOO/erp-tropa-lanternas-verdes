# Acessibilidade verificável

### PROD-08: Acessibilidade verificável, não declarada
**Fonte:** [DECISÃO] aprovada + [DOCS] `eslint-config-next` (inclui regras `jsx-a11y`) e `@axe-core/playwright` (opcional, STACK-06)
**Regra:** Três verificações, todas executáveis: (1) `npm run lint` sem avisos `jsx-a11y`; (2) teste E2E (PROD-11) roda `AxeBuilder` nas páginas principais e exige zero violações `serious`/`critical`; (3) roteiro manual: percorrer cada fluxo só com Tab/Enter/Esc com foco sempre visível (CSS-14), zoom em 200% sem perda, contraste de texto 4,5:1 e de componentes 3:1, `prefers-reduced-motion` respeitado (CSS-15). Mensagens de sucesso e erro dinâmicas usam `role="alert"` ou `aria-live`. Campos seguem FORM-09 e FORM-10; ícone sem texto tem `aria-label`; imagem tem `alt`.
**✅ Certo:**
```ts
const resultado = await new AxeBuilder({ page }).analyze()
expect(resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]) // [PROD-08]
```
**❌ Errado:** "acessível" sem nenhuma verificação; `<div onClick>` como botão (CSS-07); informação só por cor (CSS-12).
**Como verificar:** rode `npm run lint` e `npm run e2e`; registre qual item do roteiro manual foi feito e em qual navegador.
