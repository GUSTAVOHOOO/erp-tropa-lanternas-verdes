# Modelo de tarefa e passagem de contexto

Copie a seção abaixo para o registro da tarefa. Substitua os campos antes de
despachar trabalho. Este arquivo é um modelo, não um quadro de tarefas em execução.
Use os papéis e verificações do [guia](README.md).

---

## Tarefa: <identificador e resultado esperado>

**Estado:** proposta | pronta | em andamento | em revisão | bloqueada | concluída  
**Responsável:** <pessoa/agente>  
**Integração/revisão:** <responsável>  
**Base:** <branch e commit; alterações locais existentes relevantes>  
**Dependências:** <tarefas/contratos necessários, ou nenhuma>

### Objetivo e limites

<Problema concreto, comportamento esperado e o que o usuário precisa observar.>

**Arquivos atribuídos:** <lista de arquivos; cada um tem um responsável>  
**Mudanças compartilhadas:** <dependências, configuração, dados ou regras afetadas;
se houver, indicar responsável e motivo>

### Contexto necessário

- Código e testes de referência: <caminhos e símbolos relevantes>.
- Regras das skills: <IDs de `frontend-web` ou regras de `backend-api` aplicáveis, e decisões D de `docs/backend/ESCOPO.md`>.
- Contrato da API: <rotas e códigos de erro de `docs/backend/API.md` afetados>.
- Revisão do contrato: <versão e hash do conjunto de `py -3 docs/contratos/validar.py --hash`; exemplos/cenários usados; consumidor ou provedor que será verificado>.
- Ciência do contrato (G-1): <versão e SHA-256 do registro G-1 de `docs/INTEGRACAO.md` que quem executa leu; hash diferente do registro = parar>.
- Fixture de integração: <etapa BE-FX usada, comando `fixture:integracao` e manifesto, quando a tarefa depender dela>.
- Posse na sequência UI: <linha UI-02.xx que entregou os arquivos de página/formulário antes desta tarefa assumi-los>.
- Guia Next local: <arquivo/seção pertinente, quando envolver Next.js>.
- Contratos com outras tarefas: <assinaturas, schemas, props, retorno e consumidores>.
- Estado/dados: <fixture e portas isoladas quando houver teste de escrita>.
- Modo da entrega: <preparação independente com contrato simulado | provedor aceito | ativação no Corte 1 ou gate aditivo de `docs/INTEGRACAO.md`>.

### Critérios de aceite

- [ ] <Comportamento de sucesso observável>.
- [ ] <Erro, permissão ou caso de borda relevante>.
- [ ] <Consumidores afetados continuam compatíveis ou foram atualizados>.
- [ ] <Verificações adequadas ao impacto foram executadas e registradas>.
- [ ] <Dependências realmente existentes e arquivos planejados distinguidos; gate de integração e evidência definidos>.

### Retorno do responsável

**Resultado:** <o que mudou e como atende ao objetivo>  
**Arquivos alterados:** <caminhos e propósito>  
**Verificações:** <comando, código de saída e resultado; para inspeção manual,
cenário e observação>  
**Limites/pendências:** <o que não foi verificado, falhas anteriores ou impedimentos>  
**Integração:** <commit/branch ou diff; dependências e decisões para o próximo responsável>

**Reprodução:** <revisão do contrato, cenário, comando, ambiente/porta e resultado esperado versus observado; artefato de evidência>.

Em bloqueio, registre a evidência e a informação/dependência exata necessária
para continuar. Na revisão, confira o diff contra o aceite. Conclusão depende
também da validação no estado integrado, não apenas do relato do implementador.
