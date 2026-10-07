import type { Metadata } from 'next'
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, CircleAlertIcon, CirclePlusIcon, HouseIcon, InboxIcon, LayoutDashboardIcon, ListIcon, LogOutIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Emblema } from '@/components/Emblema'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeStatus } from '@/components/IconeStatus'
import { MensagemErro } from '@/components/MensagemErro'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { GRAVIDADES, rotuloGravidade, STATUS_OCORRENCIA, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { SecaoVitrine } from '@/app/(site)/design-system/_components/SecaoVitrine'

export const metadata: Metadata = {
  title: 'Design system | Central de Oa',
  description: 'Tokens, tipografia, emblema, ícones e componentes da Central de Oa.',
}

// [DEC-12] dados de exemplo fixos: a vitrine não chama a API
const CORES = [
  { token: '--background', classe: 'bg-background', uso: 'Fundo das páginas' },
  { token: '--sidebar', classe: 'bg-sidebar', uso: 'Coluna do painel e header' },
  { token: '--card', classe: 'bg-card', uso: 'Superfícies: cartão, campo, painel' },
  { token: '--secondary', classe: 'bg-secondary', uso: 'Hover e item ativo' },
  { token: '--border', classe: 'bg-border', uso: 'Bordas e linhas de tabela' },
  { token: '--primary', classe: 'bg-primary', uso: 'Ação primária, seleção e foco' },
  { token: '--destructive', classe: 'bg-destructive', uso: 'Erros de formulário' },
]

const TEXTOS = [
  { token: '--foreground', classe: 'text-foreground', uso: 'Texto principal' },
  { token: '--muted-foreground', classe: 'text-muted-foreground', uso: 'Texto secundário' },
  { token: '--texto-terciario', classe: 'text-texto-terciario', uso: 'Cabeçalho de tabela, ausências' },
  { token: '--primary-texto', classe: 'text-primary-texto', uso: 'Verde sobre fundo escuro' },
]

const SIGNIFICADO_GRAVIDADE = {
  baixa: 'Azul: esperança. A situação tem solução.',
  media: 'Amarelo: medo. Pede atenção.',
  alta: 'Laranja: ganância. Alguém está tirando proveito.',
  critica: 'Vermelho: fúria. Ação imediata.',
} as const

const ICONES = [
  { nome: 'Resumo', icone: <LayoutDashboardIcon aria-hidden /> },
  { nome: 'Ocorrências', icone: <ListIcon aria-hidden /> },
  { nome: 'Registrar', icone: <CirclePlusIcon aria-hidden /> },
  { nome: 'Sair', icone: <LogOutIcon aria-hidden /> },
  { nome: 'Início', icone: <HouseIcon aria-hidden /> },
  { nome: 'Lanternas', icone: <UsersIcon aria-hidden /> },
  { nome: 'Sobre', icone: <BookOpenIcon aria-hidden /> },
  { nome: 'Erro', icone: <CircleAlertIcon aria-hidden /> },
  { nome: 'Vazio', icone: <InboxIcon aria-hidden /> },
  { nome: 'Avançar', icone: <ArrowRightIcon aria-hidden /> },
  { nome: 'Voltar', icone: <ArrowLeftIcon aria-hidden /> },
]

const VARIANTES = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

const EXEMPLOS: Ocorrencia[] = [
  { id: 'exemplo-1', titulo: 'Ataque de Parallax em Coast City', descricao: 'Exemplo.', planeta: 'Terra', setorId: '2814', gravidade: 'critica', status: 'em_andamento', envolvidos: 3, responsavelId: 'hal-jordan', resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-01T12:00:00.000Z' },
  { id: 'exemplo-2', titulo: 'Nave de Sinestro avistada perto de Marte', descricao: 'Exemplo.', planeta: 'Marte', setorId: '2814', gravidade: 'alta', status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-02T12:00:00.000Z' },
  { id: 'exemplo-3', titulo: 'Contrabando de anéis falsificados', descricao: 'Exemplo.', planeta: 'Terra', setorId: '2814', gravidade: 'media', status: 'resolvida', envolvidos: 4, responsavelId: 'guy-gardner', resolucao: 'Anéis apreendidos.', criadaPor: 'u1', criadaEm: '2026-10-03T12:00:00.000Z' },
  { id: 'exemplo-4', titulo: 'Tempestade de energia amarela', descricao: 'Exemplo.', planeta: 'Lua', setorId: '2814', gravidade: 'baixa', status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-04T12:00:00.000Z' },
]

/** Vitrine do design system: tudo o que as telas usam, num lugar só, para a apresentação. */
export default function DesignSystemPage() {
  return (
    <div className="grid gap-10">
      <CabecalhoPagina
        titulo="Design system da Tropa"
        descricao="Tokens, tipografia, emblema, ícones e componentes da Central de Oa. Use Tab para ver o foco: o brilho do anel."
      />

      <SecaoVitrine id="cores" titulo="Cores" descricao="Tema único Noite. Neutros com um leve tom de verde; o verde forte é reservado para ação, seleção e foco.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CORES.map((cor) => (
            <li key={cor.token} className="flex items-center gap-3">
              <span aria-hidden="true" className={`size-10 shrink-0 rounded-md border border-border ${cor.classe}`} />
              <span className="grid">
                <code className="font-mono text-xs">{cor.token}</code>
                <span className="text-sm text-muted-foreground">{cor.uso}</span>
              </span>
            </li>
          ))}
        </ul>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TEXTOS.map((texto) => (
            <li key={texto.token} className={texto.classe}>
              <code className="font-mono text-xs">{texto.token}</code> · {texto.uso}
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="gravidade" titulo="Gravidade" descricao="O espectro emocional dos Lanternas. A cor nunca aparece sem o texto.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {GRAVIDADES.map((gravidade) => (
            <li key={gravidade} className="grid gap-1 rounded-md border border-border bg-card p-4">
              <BadgeGravidade gravidade={gravidade} />
              <span className="text-sm text-muted-foreground">{SIGNIFICADO_GRAVIDADE[gravidade]}</span>
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="tipografia" titulo="Tipografia" descricao="Barlow para a interface, Barlow Condensed em títulos, marca, juramento e nome do lanterna, IBM Plex Mono só para dados.">
        <div className="grid gap-4">
          <p className="font-heading text-4xl leading-none font-bold">Barlow Condensed 700 · título de página</p>
          <p className="font-heading text-2xl font-semibold">Barlow Condensed 600 · título de seção</p>
          <p className="text-lg font-semibold">Barlow 600 · subtítulo e nome em destaque</p>
          <p className="max-w-prose">Barlow 400 · texto corrido. De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo.</p>
          <p className="font-mono text-xs text-muted-foreground">IBM Plex Mono 500 · Setor 2814</p>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="emblema" titulo="Emblema e ícones" descricao="Emblema próprio (anel, núcleo e duas barras). Ícones do lucide-react com traço 2.">
        <div className="flex flex-wrap items-end gap-6">
          <Emblema className="size-24 text-primary-texto drop-shadow-anel" />
          <Emblema className="size-12 text-primary-texto" />
          <Emblema className="size-8 text-texto-terciario" />
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {ICONES.map((item) => (
            <li key={item.nome} className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4.5">
              {item.icone}
              {item.nome}
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-6">
          {STATUS_OCORRENCIA.map((status) => (
            <li key={status} className="flex items-center gap-2 text-sm">
              <IconeStatus status={status} className="size-5" />
              <BadgeStatus status={status} />
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="botoes" titulo="Botões" descricao="Mesmas variantes do shadcn, visual da Tropa. Linha de cima normal, linha de baixo desabilitado.">
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            {VARIANTES.map((variant) => (
              <Button key={variant} type="button" variant={variant}>{variant}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {VARIANTES.map((variant) => (
              <Button key={variant} type="button" variant={variant} disabled>{variant}</Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="xs">Mínimo</Button>
            <Button type="button" size="sm">Pequeno</Button>
            <Button type="button">Padrão</Button>
            <Button type="button" size="lg">Grande</Button>
            <Button type="button" size="icon" aria-label="Registrar ocorrência"><PlusIcon aria-hidden /></Button>
            <Button type="button" size="icon-sm" aria-label="Registrar ocorrência (pequeno)"><PlusIcon aria-hidden /></Button>
            <Button type="button" size="icon-lg" aria-label="Registrar ocorrência (grande)"><PlusIcon aria-hidden /></Button>
            <Button type="button"><PlusIcon aria-hidden />Com ícone</Button>
          </div>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="campos" titulo="Campos" descricao="Normal, com erro e desabilitado. O erro tem texto e ícone, nunca só a borda vermelha.">
        <div className="grid max-w-xl gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="ds-titulo">Título</Label>
            <Input id="ds-titulo" placeholder="Ex.: Ataque em Coast City" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-planeta">Planeta</Label>
            <Input id="ds-planeta" aria-invalid aria-describedby="ds-planeta-erro" defaultValue="T" />
            <MensagemErro id="ds-planeta-erro">Informe o planeta onde a ocorrência aconteceu.</MensagemErro>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-setor">Setor</Label>
            <Input id="ds-setor" disabled defaultValue="Setor 2814" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-descricao">Descrição</Label>
            <Textarea id="ds-descricao" rows={3} placeholder="O que aconteceu?" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-gravidade">Gravidade</Label>
            <Select items={rotuloGravidade} defaultValue="media">
              <SelectTrigger id="ds-gravidade" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRAVIDADES.map((gravidade) => (
                  <SelectItem key={gravidade} value={gravidade}>{rotuloGravidade[gravidade]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="selos" titulo="Selos" descricao="Gravidade e status têm componentes próprios; o Badge neutro serve para o resto (ex.: status do lanterna).">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>Padrão</Badge>
          <Badge variant="secondary">Em missão</Badge>
          <Badge variant="outline">Contorno</Badge>
          <Badge variant="destructive">Afastado</Badge>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="tabela" titulo="Tabela e resumo" descricao="A barra acende um segmento por ocorrência: vazio, meio carregado e cheio, como o ícone de status.">
        <BarraStatus ocorrencias={EXEMPLOS} />
        <TabelaOcorrencias
          ocorrencias={EXEMPLOS}
          nomeSetor={{ '2814': 'Setor 2814' }}
          nomeLanterna={{ 'hal-jordan': 'Hal Jordan', 'guy-gardner': 'Guy Gardner' }}
        />
      </SecaoVitrine>

      <SecaoVitrine id="estados" titulo="Alerta, vazio e carregando">
        <Alert>
          <InboxIcon aria-hidden />
          <div>
            <AlertTitle>Ocorrência registrada</AlertTitle>
            <AlertDescription>O Guardião do setor já pode atribuir um responsável.</AlertDescription>
          </div>
        </Alert>
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <div>
            <AlertTitle>Não foi possível salvar</AlertTitle>
            <AlertDescription>Verifique sua conexão e tente de novo.</AlertDescription>
          </div>
        </Alert>
        <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Este setor ainda não tem lanterna designado." acao={{ href: '/lanternas', rotulo: 'Ver todos' }} />
        <div className="grid gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </SecaoVitrine>
    </div>
  )
}
