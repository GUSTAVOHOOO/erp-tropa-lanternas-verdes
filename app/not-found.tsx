import { PaginaAviso } from '@/components/PaginaAviso'

/** 404 global: nenhuma rota casou com a URL. */
export default function NaoEncontrada() {
  return (
    <main className="flex-1 p-4 md:p-8"> {/* [ROTA-22] */}
      <PaginaAviso
        titulo="Setor desconhecido"
        descricao="Este endereço não existe em nenhum dos 3600 setores."
        acao={{ href: '/', rotulo: 'Voltar ao início' }}
      />
    </main>
  )
}
