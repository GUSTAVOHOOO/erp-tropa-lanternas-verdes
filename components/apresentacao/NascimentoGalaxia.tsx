'use client'

/*
 * Nascimento de uma galáxia (worker: Galáxia). Interface combinada, não mude a assinatura.
 * Canvas que preenche o contêiner; `inicio` escolhe começar pela montagem ou já madura.
 */
export function NascimentoGalaxia({ className = '', inicio = 'montagem' }: { className?: string; inicio?: 'montagem' | 'madura' }) {
  void inicio
  return <div className={className} aria-hidden="true" />
}
