'use client'

/*
 * Lanternas em cena (worker: Lanternas). Interface combinada, não mude as assinaturas:
 * - CamadaLanternas: camada ambiente do deck, renderizada por ApresentacaoOa atrás dos slides.
 *   `slideId` é o id do slide atual; `chave` muda a cada troca de slide (0 no início).
 * - ChamadaTropa: bloco para usar dentro de um slide (o worker de slides o posiciona).
 */
export function CamadaLanternas({ slideId, chave }: { slideId: string; chave: number }) {
  void slideId
  void chave
  return null
}

export function ChamadaTropa({ className = '' }: { className?: string }) {
  void className
  return null
}
