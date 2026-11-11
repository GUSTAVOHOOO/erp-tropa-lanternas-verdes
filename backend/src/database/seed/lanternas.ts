import type { EntityManager } from 'typeorm'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { Setor } from '../../setores/setor.entity.js'

type CampoFonte =
  | 'codinome' | 'identidadeCivil' | 'especie' | 'planetaNatal' | 'setorId'
  | 'anoIngresso' | 'primeiraAparicao' | 'habilidades' | 'mentorId' | 'citacao' | 'biografia'

type SementeLanterna = {
  id: string
  codinome: string
  identidadeCivil: string | null
  especie: string | null
  planetaNatal: string | null
  setorId: number | null
  status: 'ativo' | 'afastado'
  anoIngresso: number | null
  primeiraAparicao: string | null
  habilidades: string[]
  mentorId: string | null
  citacao: string | null
  biografia: string | null
  fontes: Record<CampoFonte, { estado: 'verificado' | 'nao_verificado'; url?: string }>
}

const CAMPOS_FONTE: CampoFonte[] = [
  'codinome', 'identidadeCivil', 'especie', 'planetaNatal', 'setorId', 'anoIngresso',
  'primeiraAparicao', 'habilidades', 'mentorId', 'citacao', 'biografia',
]

function ficha(
  dados: Omit<SementeLanterna, 'fontes'>,
  fontesVerificadas: Partial<Record<CampoFonte, string>> = {},
): SementeLanterna {
  const fontes = Object.fromEntries(CAMPOS_FONTE.map((campo) => [
    campo,
    fontesVerificadas[campo]
      ? { estado: 'verificado' as const, url: fontesVerificadas[campo] }
      : { estado: 'nao_verificado' as const },
  ])) as SementeLanterna['fontes']
  return { ...dados, fontes }
}

const dc = 'https://www.dc.com'
const gcd = 'https://www.comics.org'

/** Fichas aceitas nas pesquisas docs/research/lanternas, convertidas conforme docs/backend/SEED.md. */
export const FICHAS_SEED: SementeLanterna[] = [
  ficha({
    id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra',
    setorId: 2814, status: 'ativo', anoIngresso: 1959,
    primeiraAparicao: 'Showcase #22, capa set.-out. 1959 (GCD); “S.O.S. Green Lantern!”',
    habilidades: ['Construtos de luz dura', 'Armas instantâneas', 'Campos de força', 'Voo', 'Durabilidade', 'Tecnologia alienígena'],
    mentorId: 'abin-sur', citacao: null,
    biografia: 'Hal é o Lanterna Verde mais conhecido da DC. Apareceu pela primeira vez em 1959, na Showcase #22, quando encontrou o alienígena Abin Sur morrendo e recebeu o anel dele. Passou a proteger o setor 2814, que cobre a Terra.',
  }, {
    codinome: `${dc}/characters/green-lantern`, setorId: `${dc}/graphic-novels/green-lantern-the-silver-age-omnibus-2017/green-lantern-the-silver-age-omnibus-vol-1`,
    anoIngresso: `${gcd}/issue/15200/`, primeiraAparicao: `${gcd}/issue/15200/`, habilidades: `${dc}/characters/green-lantern`,
    mentorId: `${dc}/characters/green-lantern`, biografia: `${dc}/characters/green-lantern`,
  }),
  ficha({
    id: 'john-stewart', codinome: 'John Stewart', identidadeCivil: 'Arquiteto e ex-militar (veterano)', especie: 'Humano', planetaNatal: 'Terra',
    setorId: 2814, status: 'ativo', anoIngresso: 1971,
    primeiraAparicao: 'Green Lantern (vol. 2) #87, capa dez. 1971 / jan. 1972, “Beware My Power!” (O’Neil e Adams)',
    habilidades: ['Construtos de luz dura', 'Armas instantâneas', 'Campos de força', 'Voo', 'Tecnologia alienígena'],
    mentorId: null, citacao: null,
    biografia: 'John Stewart é o terceiro humano a portar um anel de Lanterna Verde. Foi arquiteto e veterano militar antes de entrar no Corpo como reserva. Cria construtos sólidos por dentro e não esconde o rosto. Manteve a fidelidade aos ideais do Corpo mesmo após perdas pessoais.',
  }, {
    codinome: `${dc}/characters/john-stewart`, identidadeCivil: `${dc}/characters/john-stewart`, anoIngresso: `${dc}/characters/john-stewart`,
    primeiraAparicao: `${gcd}/issue/24687/`, habilidades: `${dc}/characters/john-stewart`, biografia: `${dc}/characters/john-stewart`,
  }),
  ficha({
    id: 'guy-gardner', codinome: 'Guy Gardner', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra',
    setorId: 2814, status: 'ativo', anoIngresso: null,
    primeiraAparicao: 'Green Lantern (vol. 2) #59, capa mar. 1968, “Earth’s Other Green Lantern!” (Broome e Kane)',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Guy Gardner apareceu em 1968, na GL #59, como um dos candidatos ao anel de Abin Sur. Hal Jordan ficou com o anel porque estava mais perto. O Corpo manteve Guy como Lanterna reserva.',
  }, {
    codinome: `${gcd}/series/4403/`, primeiraAparicao: `${gcd}/issue/21701/`,
    biografia: `${gcd}/issue/21701/`,
  }),
  ficha({
    id: 'kilowog', codinome: 'Kilowog', identidadeCivil: null, especie: 'Bolovaxiano', planetaNatal: 'Bolovax Vik',
    setorId: 674, status: 'ativo', anoIngresso: 1986,
    primeiraAparicao: 'Green Lantern (DC, 1960) #201, capa com logo “The Green Lantern Corps”, junho de 1986',
    habilidades: ['Anel do Poder (Lanterna Verde)', 'Treinamento de recrutas', 'Conhecimento genético e científico'],
    mentorId: null, citacao: null,
    biografia: 'Kilowog é natural de Bolovax Vik, onde trabalhou como cientista e geneticista. Virou o sargento-instrutor da Tropa dos Lanternas Verdes e treinou Hal Jordan, chamando de “poozers” os recrutas que falham. Quando as ondas de antimatéria da Crise atingiram o planeta, ele não conseguiu salvar a população, mesmo com o anel.',
  }, {
    codinome: `${dc}/blog/2011/05/18/kilowog-the-geneticist`, setorId: `${dc}/blog/2011/05/18/kilowog-the-geneticist`,
    anoIngresso: `${gcd}/issue/41476/`, primeiraAparicao: `${gcd}/issue/41476/`, habilidades: `${dc}/blog/2011/05/18/kilowog-the-geneticist`,
    biografia: `${dc}/blog/2011/05/18/kilowog-the-geneticist`,
  }),
  ficha({
    id: 'salaak', codinome: 'Salaak', identidadeCivil: null, especie: 'Slyggiano', planetaNatal: 'Slyggia',
    setorId: 0, status: 'ativo', anoIngresso: null, primeiraAparicao: null, habilidades: [], mentorId: null,
    citacao: null,
    biografia: 'Salaak é um Lanterna Verde da Tropa. Durante a Guerra dos Lanternas Verdes, ficou ao lado de Kilowog contra Hal, Guy, John e Kyle. Os demais dados (espécie, planeta, setor, primeira aparição) não foram verificados em fonte de alta confiança.',
  }, {
    codinome: `${dc}/comics/green-lantern-corps-2006/green-lantern-corps-59`, biografia: `${dc}/comics/green-lantern-corps-2006/green-lantern-corps-59`,
  }),
  ficha({
    id: 'arisia', codinome: 'Arisia Rrab', identidadeCivil: null, especie: 'Graxionita', planetaNatal: 'Graxos IV',
    setorId: 1417, status: 'afastado', anoIngresso: 1981,
    primeiraAparicao: 'Tales of the Green Lantern Corps #1, maio de 1981 (história “Challenge!”)',
    habilidades: ['Anel do Poder (Lanterna Verde)', 'Liderança'], mentorId: null, citacao: null,
    biografia: 'Arisia Rrab é uma Lanterna Verde graxosiana, de pele dourada, do planeta Graxos IV. Estreou em 1981, na minissérie Tales of the Green Lantern Corps. Aparece em Green Lantern Corps (2006) #24, #34 e #35 lutando contra Mongul e a Tropa Sinestro. Depois forma vínculo com John Stewart em Earth One vol. 2.',
  }, {
    codinome: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`, anoIngresso: `${gcd}/issue/35321/`,
    primeiraAparicao: `${gcd}/issue/35321/`, habilidades: `${dc}/blog/2020/05/21/green-lantern-earth-one-vol-two-is-coming`,
    biografia: `${dc}/comics/green-lantern-corps-2006/green-lantern-corps-24`,
  }),
  ficha({
    id: 'kyle-rayner', codinome: 'Kyle Rayner', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: null,
    primeiraAparicao: 'Green Lantern (vol. 3) #48 (início do vol. 3); ano em conflito: 1993 ou 1994',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Kyle Rayner estreou na Green Lantern #48 como o novo volume da série. Recebeu o último anel de Lanterna Verde na #50, depois da queda de Hal Jordan. Foi criado por Ron Marz e Darryl Banks.',
  }, {
    codinome: `${dc}/blog/2020/05/22/in-brightest-day-twelve-iconic-moments-in-the-green-lantern-saga`,
    primeiraAparicao: `${dc}/blog/2025/02/12/what-your-favorite-green-lantern-says-about-you`,
    biografia: `${dc}/blog/2020/05/22/in-brightest-day-twelve-iconic-moments-in-the-green-lantern-saga`,
  }),
  ficha({
    id: 'jessica-cruz', codinome: 'Jessica Cruz', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: 2814, status: 'ativo', anoIngresso: null,
    primeiraAparicao: 'Green Lantern #20 (2013); mês não verificado',
    habilidades: ['Construtos de luz dura', 'Armas instantâneas', 'Campos de força', 'Voo', 'Durabilidade', 'Tecnologia alienígena'],
    mentorId: null, citacao: null,
    biografia: 'Jessica Cruz é a primeira mulher a representar oficialmente o Setor 2814 no Corpo. Tinha ansiedade grave por causa de um trauma na juventude. O Anel de Volthoom a escolheu por medo e a controlou até ela se libertar. Depois de um sacrifício, recebeu um anel de Lanterna Verde e segue treinando com Simon Baz.',
  }, {
    codinome: `${dc}/characters/jessica-cruz`, setorId: `${dc}/characters/jessica-cruz`, primeiraAparicao: `${dc}/characters/jessica-cruz`,
    habilidades: `${dc}/characters/jessica-cruz`, biografia: `${dc}/characters/jessica-cruz`,
  }),
  ficha({
    id: 'simon-baz', codinome: 'Simon Baz', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: 2814, status: 'ativo', anoIngresso: null,
    primeiraAparicao: 'The New 52: Free Comic Book Day Special Edition #1 (2012); mês não verificado',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Simon Baz é o protetor do Setor 2814 e parceiro de Jessica Cruz. Apareceu pela primeira vez na Free Comic Book Day Special de 2012. Seu papel regular começou em 2016, com a série Green Lanterns (Renascimento).',
  }, {
    codinome: `${dc}/characters/simon-baz`, setorId: `${dc}/characters/simon-baz`, primeiraAparicao: `${dc}/characters/simon-baz`,
    biografia: `${dc}/characters/simon-baz`,
  }),
  ficha({
    id: 'abin-sur', codinome: 'Abin Sur', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: null,
    primeiraAparicao: 'Showcase #22, capa set.-out. 1959, “S.O.S. Green Lantern!”',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Abin Sur aparece pela primeira vez na Showcase #22, em 1959, onde morre após cair na Terra. Antes disso escolhera Guy Gardner como sucessor, mas Hal Jordan ficou com o anel porque estava mais perto. Passou o anel e a função de Lanterna do Setor 2814 a Hal.',
  }, {
    codinome: `${dc}/characters/green-lantern`, primeiraAparicao: `${gcd}/issue/15200/`,
    biografia: `${dc}/characters/green-lantern`,
  }),
  ficha({
    id: 'tomar-re', codinome: 'Tomar-Re', identidadeCivil: 'Cientista do próprio planeta, que também serviu na Guarda de Honra da Tropa',
    especie: null, planetaNatal: 'Xudar', setorId: 2813, status: 'ativo', anoIngresso: 1961,
    primeiraAparicao: 'Green Lantern (DC, 1960) #6, capa maio-junho de 1961, “The World of Living Phantoms!”',
    habilidades: ['Anel do Poder (Lanterna Verde)', 'Conhecimento científico'], mentorId: null, citacao: null,
    biografia: 'Tomar-Re é um cientista de Xudar que serviu na Guarda de Honra da Tropa e foi Lanterna do Setor 2813. Apareceu pela primeira vez em Green Lantern #6 (1961). Segundo a DC, não chegou a tempo de salvar Krypton, porque uma tempestade solar o deteve. Sua morte é divergente: a DC a associa à Crise nas Infinitas Terras, e a GCD diz que foi morto por Goldface em Green Lantern #198 (1986).',
  }, {
    codinome: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`, identidadeCivil: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`,
    planetaNatal: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`, setorId: `${gcd}/character/11051/`,
    anoIngresso: `${gcd}/issue/16226/`, primeiraAparicao: `${gcd}/issue/16226/`,
    habilidades: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`,
    biografia: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`,
  }),
  ficha({
    id: 'katma-tui', codinome: 'Katma Tui', identidadeCivil: null, especie: null, planetaNatal: 'Korugar',
    setorId: 1417, status: 'ativo', anoIngresso: 1964,
    primeiraAparicao: 'Green Lantern (DC, 1960) #30, “Once a Green Lantern — Always a Green Lantern!”, 1964',
    habilidades: ['Anel do Poder (Lanterna Verde)', 'Treinamento de recrutas'], mentorId: null, citacao: null,
    biografia: 'Katma Tui é uma Lanterna Verde de Korugar, de pele roxa, que treinou John Stewart e se casou com ele. Foi a Lanterna do Setor 1417 e foi sucedida por Soranik Natu. Um resumo de busca diz que a Star Sapphire a matou, mas a edição citada não foi confirmada, e ela reaparece viva em Green Lantern Corps (2025).',
  }, {
    codinome: `${dc}/blog/2023/03/07/emerald-allies-hal-jordan-and-john-stewart-s-close-friendship`,
    planetaNatal: `${dc}/blog/2023/03/07/emerald-allies-hal-jordan-and-john-stewart-s-close-friendship`,
    setorId: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    anoIngresso: `${gcd}/issue/18468/`, primeiraAparicao: `${gcd}/issue/18468/`,
    habilidades: `${dc}/blog/2023/03/07/emerald-allies-hal-jordan-and-john-stewart-s-close-friendship`,
    biografia: `${dc}/blog/2023/03/07/emerald-allies-hal-jordan-and-john-stewart-s-close-friendship`,
  }),
  ficha({
    id: 'soranik-natu', codinome: 'Soranik Natu', identidadeCivil: 'Neurocirurgiã de Korugar', especie: null,
    planetaNatal: 'Korugar', setorId: 1417, status: 'ativo', anoIngresso: 2005,
    primeiraAparicao: 'Green Lantern Corps: Recharge #1, setembro de 2005 (data da DC)',
    habilidades: ['Anel do Poder (Lanterna Verde)', 'Anel Amarelo (Tropa Sinestro)', 'Liderança da Tropa Sinestro'],
    mentorId: null, citacao: null,
    biografia: 'Soranik Natu é uma neurocirurgiã de Korugar que, no início, não quer entrar no Corpo, porque Sinestro dominou o seu mundo. Ela respeita a Tropa e se torna a Lanterna Verde do Setor 1417, sucedendo Katma Tui. Sinestro depois lhe tira o anel verde e a torna Lanterna Amarela; ela lidera a Tropa Sinestro e reaparece com Katma Tui em Green Lantern Corps (2025).',
  }, {
    codinome: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    identidadeCivil: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    planetaNatal: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    setorId: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    anoIngresso: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
    primeiraAparicao: `${dc}/comics/green-lantern-corps-recharge-2005/green-lantern-corps-recharge-1`,
    habilidades: `${dc}/comics/sinestro-2014/sinestro-22`,
    biografia: `${dc}/blog/2018/01/15/hal-jordan-and-the-green-lantern-corps-the-ballad-of-soranik-natu`,
  }),
  ficha({
    id: 'sinestro', codinome: 'Sinestro', identidadeCivil: 'Thaal Sinestro', especie: null, planetaNatal: 'Korugar',
    setorId: 1417, status: 'ativo', anoIngresso: 1961,
    primeiraAparicao: 'Green Lantern (vol. 2) #7, 1961. Mês não verificado',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Sinestro foi um Lanterna Verde do Setor 1417 que, segundo a DC, passou a impor a ordem de forma autoritária até conquistar Korugar, seu planeta natal. Foi expulso do Corpo depois que Hal Jordan, então recruta, descobriu seus métodos. Ele é, portanto, um ex-Lanterna Verde, e a ficha oficial não informa o período exato em que pertenceu ao Corpo.',
  }, {
    codinome: `${dc}/characters/sinestro`, identidadeCivil: `${dc}/characters/sinestro`, planetaNatal: `${dc}/characters/sinestro`,
    setorId: `${dc}/characters/sinestro`, anoIngresso: `${dc}/characters/sinestro`, primeiraAparicao: `${dc}/characters/sinestro`,
    biografia: `${dc}/characters/sinestro`,
  }),
  ficha({
    id: 'laira', codinome: 'Laira', identidadeCivil: null, especie: null, planetaNatal: null, setorId: null,
    status: 'ativo', anoIngresso: null, primeiraAparicao: null, habilidades: [], mentorId: null,
    citacao: null, biografia: null,
  }),
  ficha({
    id: 'ch-p', codinome: "Ch'p", identidadeCivil: null, especie: null, planetaNatal: null, setorId: null,
    status: 'ativo', anoIngresso: null, primeiraAparicao: null, habilidades: [], mentorId: null,
    citacao: null, biografia: null,
  }),
  ficha({
    id: 'boodikka', codinome: 'Boodikka', identidadeCivil: 'Boodikka', especie: null, planetaNatal: 'Bellatrix',
    setorId: null, status: 'ativo', anoIngresso: 1991,
    primeiraAparicao: 'Green Lantern (vol. 3) #20, dezembro de 1991 (segundo o dc.com)',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Boodikka é uma guerreira e mercenária de Bellatrix, identificada pela DC como Lanterna Verde com o alias Lanterna Alfa. Segundo a ficha oficial, ela estreou na série Green Lantern vol. 3 em dezembro de 1991. O destino final do personagem é disputado entre fontes e ficou de fora.',
  }, {
    codinome: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`, identidadeCivil: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`,
    planetaNatal: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`,
    anoIngresso: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`,
    primeiraAparicao: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`,
    biografia: `${dc}/blog/2011/06/15/boodikka-the-alpha-lantern-from-bellatrix`,
  }),
  ficha({
    id: 'ke-haan', codinome: "Ke'Haan", identidadeCivil: null, especie: null, planetaNatal: null, setorId: null,
    status: 'ativo', anoIngresso: null, primeiraAparicao: null, habilidades: [], mentorId: null,
    citacao: null, biografia: null,
  }),
  ficha({
    id: 'hannu', codinome: 'Hannu', identidadeCivil: null, especie: null, planetaNatal: 'Ovacron 6',
    setorId: 2, status: 'ativo', anoIngresso: 1994,
    primeiraAparicao: 'Green Lantern (vol. 3) #49, fevereiro de 1994',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Hannu é um Lanterna Verde ligado ao Setor 2, originário de Ovacron 6, segundo a ficha oficial da DC de 2011. Sua primeira aparição com o anel data de fevereiro de 1994, em Green Lantern vol. 3 #49. Fontes secundárias o descrevem como guerreiro, mas esse ponto não entrou na ficha por não ser verificado.',
  }, {
    codinome: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`, planetaNatal: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`,
    setorId: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`, anoIngresso: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`,
    primeiraAparicao: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`, biografia: `${dc}/blog/2011/06/13/who-are-hannu-and-princess-iolande`,
  }),
  ficha({
    id: 'isamot-kol', codinome: 'Isamot Kol', identidadeCivil: null, especie: 'Lizarkon (reptiliano humanoide)',
    planetaNatal: null, setorId: null, status: 'ativo', anoIngresso: null, primeiraAparicao: null,
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Isamot Kol é um Lanterna Verde da espécie lizarkon, um povo reptiliano que divide o planeta Thanagar com os thanagarianos. Já visitou a Terra em missão da Corporação. Aparece no elenco de Green Lantern Corps #11, e o GCD registra uma morte aparente dele em Green Lantern (2021) #1.',
  }, {
    codinome: `${gcd}/issue/968090/`, especie: `${dc}/blog/2022/03/10/ask-the-question-how-many-lantern-oaths-are-there`,
    biografia: `${dc}/blog/2022/03/10/ask-the-question-how-many-lantern-oaths-are-there`,
  }),
  ficha({
    id: 'medphyll', codinome: 'Medphyll', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: 1962,
    primeiraAparicao: 'Green Lantern (1960) #11, “The Strange Trial of Green Lantern!”, março de 1962',
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Medphyll é um Lanterna Verde de natureza vegetal, apresentado pela DC em 2011 junto com Penelops como um dos Lanternas de planta e de água. Estreou em Green Lantern #11 (vol. 2, março de 1962). Na saga Rotworld (2013), foi morto pelos Rot, e seu anel escolheu Frankenstein como sucessor.',
  }, {
    codinome: `${gcd}/issue/16811/`, anoIngresso: `${gcd}/issue/16811/`, primeiraAparicao: `${gcd}/issue/16811/`,
    biografia: `${dc}/blog/2011/06/01/medphyll-and-penelops-plant-and-aquatic-green-lanterns`,
  }),
  ficha({
    id: 'rot-lop-fan', codinome: 'Rot Lop Fan', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: 1987,
    primeiraAparicao: 'Green Lantern Annual #3 (DC, 1987), capa [agosto] 1987',
    habilidades: ['Poder ativado por som e tom', 'Instrumento sino F-Sharp', 'Cortou comunicação entre Starro e seus esporos'],
    mentorId: null, citacao: null,
    biografia: 'Rot Lop Fan é um Lanterna Verde cego, que não tem noção de luz ou visão. Katma Tui o treinou a canalizar o poder pelo som, usando o sino F-Sharp como instrumento. Em Xudar, usou esse poder para cortar a comunicação entre Starro e seus esporos, libertando os habitantes do planeta. Estreou em Green Lantern Annual #3 (1987).',
  }, {
    codinome: `${gcd}/issue/42271/`, anoIngresso: `${gcd}/issue/42271/`, primeiraAparicao: `${gcd}/issue/42271/`,
    habilidades: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`,
    biografia: `${dc}/blog/2026-09-03/off-world-warriors-five-essential-alien-green-lanterns`,
  }),
  ficha({
    id: 'bzzd', codinome: 'Bzzd', identidadeCivil: null, especie: null, planetaNatal: null, setorId: null,
    status: 'ativo', anoIngresso: null, primeiraAparicao: null, habilidades: [], mentorId: null,
    citacao: null,
    biografia: 'Bzzd é um Lanterna Verde que o GCD indexa como membro do Corpo. Aparece no elenco de Green Lantern Corps: Ring Quest (2008) e de Green Lantern: The Sinestro Corps War #2 (2009). Também aparece como Lanterna Negra em Blackest Night: Green Lantern Corps (2011).',
  }, {
    codinome: `${gcd}/issue/645026/`, biografia: `${gcd}/issue/560249/`,
  }),
  ficha({
    id: 'tomar-tu', codinome: 'Tomar-Tu', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: null, primeiraAparicao: null,
    habilidades: [], mentorId: null, citacao: null,
    biografia: 'Tomar-Tu é um Lanterna Verde de Xudar. Aparece em Hal Jordan and the Green Lantern Corps #43, onde é sequestrado dos Sciencells, e em #50, onde Hal Jordan o enfrenta. O GCD também o indexa em Green Lantern Corps #21 e em Star Trek / Green Lantern: The Spectrum War, numa cena de flashback com a morte dele.',
  }, {
    codinome: `${gcd}/issue/404706/`, biografia: `${dc}/comics/hal-jordan-and-the-green-lantern-corps-2016/hal-jordan-and-the-green-lantern-corps-43`,
  }),
  ficha({
    id: 'vath-sarn', codinome: 'Vath Sarn', identidadeCivil: null, especie: null, planetaNatal: null,
    setorId: null, status: 'ativo', anoIngresso: null, primeiraAparicao: null,
    habilidades: [], mentorId: null, citacao: null, biografia: null,
  }, { codinome: `${gcd}/issue/303802/` }),
]

export async function semearLanternas(
  repository: LanternasRepository,
  manager: EntityManager,
): Promise<void> {
  const ids = new Set(FICHAS_SEED.map(({ id }) => id))
  const mentores = new Map(FICHAS_SEED.map(({ id, mentorId }) => [id, mentorId]))
  for (const lanterna of FICHAS_SEED) {
    if (lanterna.setorId !== null && !(await manager.getRepository(Setor).findOneBy({ id: lanterna.setorId }))) {
      throw new Error(`Seed sector missing for lantern ${lanterna.id}: ${lanterna.setorId}`)
    }
    const visitados = new Set<string>()
    let mentorId = lanterna.mentorId
    while (mentorId !== null) {
      if (!ids.has(mentorId) || mentorId === lanterna.id || visitados.has(mentorId)) {
        throw new Error(`Invalid or cyclic mentor chain in seed for ${lanterna.id}`)
      }
      visitados.add(mentorId)
      mentorId = mentores.get(mentorId) ?? null
    }
  }

  for (const { mentorId: _mentorId, ...lanterna } of FICHAS_SEED) {
    await repository.salvar({ ...lanterna, mentorId: null }, manager)
  }
  for (const lanterna of FICHAS_SEED) {
    if (lanterna.mentorId !== null) {
      await repository.atualizar(lanterna.id, { mentorId: lanterna.mentorId }, manager)
    }
  }
}
