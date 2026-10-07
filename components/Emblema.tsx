import { cn } from '@/lib/utils'

/** Emblema próprio da Tropa (anel, núcleo e duas barras). Não é o logo registrado da DC. */
export function Emblema({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <circle cx="16" cy="16" r="13.5" strokeWidth="2.5" />
      <rect x="7" y="7" width="18" height="3" rx="1" fill="currentColor" stroke="none" />
      <rect x="7" y="22" width="18" height="3" rx="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="4.5" strokeWidth="2.5" />
    </svg>
  )
}
