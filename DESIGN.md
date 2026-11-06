# OANET — direção visual cinematográfica

> **Evolução em 2026-11-06:** o usuário solicitou visuais inteiramente gerados
> em código e componentes com bordas mais arrojadas. A vitrine `/laboratorio`
> implementa essa evolução em HTML/CSS/SVG/Canvas, sem consumir as imagens
> abaixo. Ver [registro da implementação](docs/design/oanet/laboratorio-codigo.md).
> A prévia foi aprovada pelo usuário; [docs/UI.md](docs/UI.md) orienta a
> continuação do redesign e a futura integração às rotas reais.
> O restante deste documento preserva a primeira exploração visual.

**Data:** 2026-11-06. **Estado:** proposta visual v1; não implementada.
O usuário confirmou que prefere a direção mais cinematográfica.
As pranchas são estudos de composição, com dados ilustrativos.

## Tema visual

Um operador da Tropa consulta um terminal na sala escura da Central de Oa,
iluminada pela Bateria Central. O ambiente pede preto esverdeado profundo,
energia verde emissiva, arquitetura monumental e informações claras.

A identidade se apoia em três elementos: o emblema da Tropa, os círculos
de energia e as molduras com cantos chanfrados. A arte tem profundidade
cinematográfica; os campos de trabalho têm superfícies sólidas.

## Cor

Manter como âncoras os tokens já existentes em `app/globals.css`:

| Papel | Referência atual | Uso proposto |
|---|---|---|
| Fundo | `oklch(0.165 0.012 155)` | Base escura entre as áreas de arte |
| Superfície | `oklch(0.205 0.014 155)` | Formulários, listas e detalhes |
| Texto | `oklch(0.955 0.008 155)` | Conteúdo principal |
| Energia | `oklch(0.80 0.19 150)` | Ação principal, seleção e emblema |
| Texto secundário | `oklch(0.775 0.014 155)` | Contexto e metadados |

Amarelo, laranja e vermelho identificam gravidade ou avisos, acompanhados
de rótulos. O dourado aparece como material da arquitetura nas imagens,
sem criar uma segunda cor para ações. Contraste da interface futura deve
ser medido; estas imagens não demonstram conformidade WCAG.

## Tipografia

Partir das fontes já presentes: Barlow Condensed para títulos, Barlow para
leitura e controles, IBM Plex Mono para identificadores técnicos pontuais.
Títulos compactos e fortes; evitar letras espaçadas em todos os rótulos.
Corpo de 16px como referência; descrições com largura confortável.

## Forma e composição

Molduras técnicas finas, cantos cortados e eixos de alinhamento rigorosos.
Brilho concentrado no emblema, na arte e na ação em destaque. Manter uma
hierarquia entre áreas iluminadas e áreas escuras de leitura.

Evitar molduras dentro de molduras. No desenho definitivo, simplificar as
arestas internas que os estudos gerados repetiram. Ícones funcionais devem
ser vetoriais e consistentes; não recortar controles de uma imagem gerada.

## Telas e experiências

| Tela | Composição proposta |
|---|---|
| Início | Panorama de Oa, frase principal e entrada da Central em destaque |
| Sobre | Arquitetura de Oa, narrativa da Tropa e juramento como peça editorial |
| Login | Arte vertical e formulário de acesso sobre fundo sólido |
| Lanternas | Cabeçalho galáctico, filtro por setor e lista legível de membros |
| Ficha do Lanterna | Emblema ou retrato, identificação, setor e biografia |
| Painel | Navegação persistente, mapa como foco visual e ocorrências prioritárias |
| Ocorrências | Filtros próximos da lista, gravidade e status identificáveis por texto |
| Nova ocorrência | Formulário amplo, contexto visual lateral e uma ação principal |
| Detalhe | Identificação da ocorrência, descrição, responsável e atualização do status |
| Atribuição | Contexto da ocorrência e escolha explícita do responsável |
| Erro, vazio, acesso negado e 404 | Símbolo de energia, explicação breve e caminho para continuar |

As pranchas cobrem nove estudos. Sobre, estados auxiliares e variações
de celular ainda não têm mockups próprios. O mapa é uma proposta visual;
o projeto atual não possui uma funcionalidade interativa de mapa.

## Movimento e telas menores

Propor acendimento breve ao selecionar, resposta visual nos controles e
transições discretas entre estados. A arte pode sugerir energia sem animação
contínua. Respeitar movimento reduzido e não atrasar a apresentação de dados.

No celular, recolher a navegação, empilhar o conteúdo e reduzir a presença
das imagens. Títulos, ações e formulários conservam prioridade. Não encolher
uma tela inteira de desktop para caber no celular.

## Assets

Artes geradas do zero com a ferramenta integrada imagegen:

- `public/assets/oanet/oa-panorama-v1.png`: ambiente para início e acesso,
  com espaço escuro à esquerda para texto aplicado pela interface.
- `public/assets/oanet/mapa-galactico-v1.png`: base visual galáctica sem
  textos, rótulos ou controles incorporados.

Pranchas em `docs/design/oanet/01-direcao-cinematografica.png` e
`docs/design/oanet/02-telas-do-sistema.png`. Prompts completos em
`docs/design/oanet/prompts.json`.

O retrato original solicitado à ferramenta foi rejeitado automaticamente;
nenhum retrato separado foi produzido. O pequeno retrato da primeira prancha
faz parte da própria imagem conceitual e não é um asset independente.

## Limites desta entrega

Esta etapa entrega direção visual, estudos e duas artes de ambiente.
Não altera componentes, regras, dados ou dependências do ERP. Aprovação dos
layouts, mockups das telas restantes, assets específicos de personagens,
adaptação responsiva, otimização dos arquivos e implementação ficam para
as próximas etapas do redesign.
