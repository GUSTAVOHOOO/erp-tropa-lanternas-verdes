import Link from 'next/link'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { IconeOa } from '@/components/oanet/IconeOa'
import { ConstructoComNota } from '@/app/(site)/lanternas/[id]/_components/ConstructoComNota'
import { MolduraOa, SeloOa } from '@/components/oanet/PainelOa'
import {
  CAMPOS_COM_FONTE,
  rotuloStatusLanterna,
  type CampoComFonte,
  type LanternaFicha,
  type StatusLanterna,
} from '@/lib/schemas/lanterna'
import type { Setor } from '@/lib/schemas/setor'

const tonsStatus: Record<StatusLanterna, 'verde' | 'ambar' | 'neutro'> = {
  ativo: 'verde',
  em_missao: 'ambar',
  afastado: 'neutro',
}

const rotulosCamposFonte: Record<CampoComFonte, string> = {
  codinome: 'Codinome',
  identidadeCivil: 'Identidade civil',
  especie: 'Espécie',
  planetaNatal: 'Planeta natal',
  setorId: 'Setor de patrulha',
  anoIngresso: 'Ano de ingresso',
  primeiraAparicao: 'Primeira aparição',
  habilidades: 'Habilidades',
  mentorId: 'Mentor',
  citacao: 'Citação',
  biografia: 'Biografia',
}

/** Para onde apontam os links da Ficha: área pública ou painel. */
export type RotasFicha = {
  voltar: string
  rotuloVoltar: string
  ficha: (id: string) => string
  setor: ((setorId: number) => string) | null
}

type FichaLanternaProps = { lanterna: LanternaFicha, setor: Setor | undefined, rotas: RotasFicha }

/** Miolo da Ficha de um Lanterna, comum à área pública e ao painel. [COMP-01] */
export function FichaLanterna({ lanterna, setor, rotas }: FichaLanternaProps) {
  const tom = tonsStatus[lanterna.status] ?? 'neutro'
  const origem = [lanterna.especie, lanterna.planetaNatal].filter(Boolean).join(' · ') || 'Origem não registrada'

  return (
    <article className="oa-screen max-w-4xl space-y-6">
      <div className="grid gap-4">
        <LinkVoltar href={rotas.voltar}>{rotas.rotuloVoltar}</LinkVoltar>
        <CabecalhoPagina titulo={lanterna.codinome} descricao={origem} />
      </div>

      <MolduraOa className="oa-profile-panel">
        <div className="oa-profile">
          <span className="oa-profile-code">
            ARQUIVO DA TROPA / {lanterna.setorId !== null ? `SETOR ${lanterna.setorId}` : 'SEM SETOR'}
          </span>

          <ConstructoComNota codinome={lanterna.codinome} />

          <div className="my-3 flex justify-center">
            <SeloOa tom={tom}>{rotuloStatusLanterna[lanterna.status]}</SeloOa>
          </div>

          <h2 className="font-heading text-2xl font-bold uppercase">{lanterna.codinome}</h2>
          <p className="text-sm text-(--oa-muted)">{origem}</p>

          {lanterna.citacao && (
            <blockquote className="mt-4 border-l-2 border-(--oa-energy) pl-4 italic text-sm text-(--oa-text) text-left">
              &ldquo;{lanterna.citacao}&rdquo;
            </blockquote>
          )}

          {lanterna.biografia && (
            <p className="mt-4 text-sm text-(--oa-muted) leading-relaxed text-left">
              {lanterna.biografia}
            </p>
          )}

          <dl className="mt-6 grid gap-4 border-t border-(--oa-line) pt-6 sm:grid-cols-2 text-left">
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Identidade civil</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.identidadeCivil ?? 'Não registrado'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Espécie</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.especie ?? 'Não registrado'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Planeta natal</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.planetaNatal ?? 'Não registrado'}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Setor de patrulha</dt>
              <dd className="grid gap-1">
                {lanterna.setorId !== null ? (
                  <>
                    {rotas.setor ? (
                      <Link
                        href={rotas.setor(lanterna.setorId)}
                        className="oa-sector-label w-fit text-sm text-(--oa-energy) hover:underline"
                      >
                        <IconeOa nome="setores" />
                        {setor?.nome ?? `Setor ${lanterna.setorId}`}
                      </Link>
                    ) : (
                      <span className="oa-sector-label w-fit text-sm text-(--oa-text)">
                        <IconeOa nome="setores" />
                        {setor?.nome ?? `Setor ${lanterna.setorId}`}
                      </span>
                    )}
                    {setor?.descricao && <span className="text-xs text-(--oa-muted)">{setor.descricao}</span>}
                  </>
                ) : (
                  <span className="text-sm font-medium text-(--oa-text)">Sem setor</span>
                )}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Status operacional</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{rotuloStatusLanterna[lanterna.status]}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Ano de ingresso</dt>
              <dd className="text-sm font-medium text-(--oa-text)">
                {lanterna.anoIngresso !== null ? String(lanterna.anoIngresso) : 'Não registrado'}
              </dd>
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Primeira aparição</dt>
              <dd className="text-sm font-medium text-(--oa-text)">{lanterna.primeiraAparicao ?? 'Não registrado'}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-(--oa-line) pt-4 text-left">
            <h3 className="text-xs uppercase tracking-wider text-(--oa-muted) mb-2">Habilidades</h3>
            {lanterna.habilidades.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {lanterna.habilidades.map((hab) => (
                  <li key={hab} className="oa-badge oa-badge--neutro text-xs">
                    {hab}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--oa-muted)">Nenhuma habilidade registrada</p>
            )}
          </div>
        </div>
      </MolduraOa>

      <MolduraOa titulo="Estatísticas operacionais" icone="relatorios">
        <div className="oa-panel-body p-4 md:p-6">
          <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Ocorrências resolvidas</dt>
              <dd className="font-heading text-2xl font-bold text-(--oa-energy)">{lanterna.estatisticas.resolvidas}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Em andamento</dt>
              <dd className="font-heading text-2xl font-bold text-(--oa-text)">{lanterna.estatisticas.emAndamento}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Carga atual</dt>
              <dd className="font-heading text-2xl font-bold text-(--oa-text)">{lanterna.estatisticas.cargaAtual}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs uppercase tracking-wider text-(--oa-muted)">Tempo médio de resolução</dt>
              <dd className="font-heading text-2xl font-bold text-(--oa-text)">
                {lanterna.estatisticas.tempoMedioResolucaoHoras !== null
                  ? `${lanterna.estatisticas.tempoMedioResolucaoHoras} horas`
                  : 'Sem resoluções'}
              </dd>
            </div>
          </dl>
        </div>
      </MolduraOa>

      <MolduraOa titulo="Relações na Tropa" icone="pessoal">
        <div className="oa-panel-body p-4 md:p-6 grid gap-6 sm:grid-cols-2 text-left">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-(--oa-muted) mb-2">Mentor</h3>
            {lanterna.mentor ? (
              <Link
                href={rotas.ficha(lanterna.mentor.id)}
                className="oa-sector-label w-fit text-sm text-(--oa-energy) hover:underline"
              >
                <IconeOa nome="pessoal" />
                {lanterna.mentor.codinome}
              </Link>
            ) : (
              <p className="text-sm text-(--oa-muted)">Sem mentor</p>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-(--oa-muted) mb-2">Aprendizes</h3>
            {lanterna.aprendizes.length > 0 ? (
              <ul className="grid gap-2">
                {lanterna.aprendizes.map((aprendiz) => (
                  <li key={aprendiz.id}>
                    <Link
                      href={rotas.ficha(aprendiz.id)}
                      className="oa-sector-label w-fit text-sm text-(--oa-energy) hover:underline"
                    >
                      <IconeOa nome="pessoal" />
                      {aprendiz.codinome}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--oa-muted)">Nenhum aprendiz</p>
            )}
          </div>
        </div>
      </MolduraOa>

      <MolduraOa titulo="Verificação de fontes" icone="verificado">
        <div className="oa-panel-body p-4 md:p-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS_COM_FONTE.map((campo) => {
              const info = lanterna.fontes[campo]
              const verificado = info?.estado === 'verificado'
              return (
                <li
                  key={campo}
                  className="flex items-center justify-between gap-2 border border-(--oa-line) bg-(--oa-surface) p-3"
                >
                  <span className="text-xs font-medium text-(--oa-text)">{rotulosCamposFonte[campo]}</span>
                  <div className="flex items-center gap-2">
                    <SeloOa tom={verificado ? 'verde' : 'neutro'}>
                      {verificado ? 'verificado' : 'não verificado'}
                    </SeloOa>
                    {info?.url && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="oa-text-action text-xs text-(--oa-energy) hover:underline"
                      >
                        fonte
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </MolduraOa>
    </article>
  )
}
