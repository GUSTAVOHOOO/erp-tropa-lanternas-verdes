import { EsqueletoLista } from '@/components/EsqueletoLista'

/** Loading raiz para transições de rota de nível superior. */
export default function LoadingRaiz() {
  return (
    <div className="oa-screen max-w-4xl p-6">
      <EsqueletoLista linhas={8} />
    </div>
  )
}
