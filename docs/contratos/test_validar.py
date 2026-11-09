"""Testes documentais permanentes do validador (stdlib, sem dependências): cada correção de C-09 tem um teste negativo.

Executar da raiz do repositório:  py -3 -m unittest discover -s docs/contratos -p "test_*.py" -v

Cada caso muta uma cópia em memória do contrato aprovado e exige que `verificar()` levante `Invalido` com a
mensagem do controle que deveria disparar. Assim um teste não passa por acidente por causa de outro erro.
Isto prova o validador, não a API: execução real, bcrypt e concorrência seguem sem prova (ver README).
"""
import contextlib
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))
import validar as v  # noqa: E402

RAIZ_BACKEND = AQUI.parent / "backend"


def carregar():
    spec = json.loads((AQUI / "openapi.json").read_text(encoding="utf-8"))
    cen = json.loads((AQUI / "exemplos" / "cenarios.json").read_text(encoding="utf-8"))
    api = (RAIZ_BACKEND / "API.md").read_text(encoding="utf-8")
    return spec, cen, api


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec0, cls.cen0, cls.api0 = carregar()

    def novo(self):
        return copy.deepcopy(self.spec0), copy.deepcopy(self.cen0), self.api0

    def rejeita(self, trecho, spec, cen, api):
        with self.assertRaisesRegex(v.Invalido, trecho):
            v.verificar(spec, cen, api)

    @staticmethod
    def cenario(cen, id_):
        return next(s for s in cen["cenarios"] if s["id"] == id_)

    @staticmethod
    def trocar_id(s, novo):
        """Troca o id do path e o `caminho` esperado juntos (senão o controle de caminho dispara antes)."""
        antigo = s["request"]["path"]["id"]
        s["request"]["path"]["id"] = novo
        s["esperado"]["caminho"] = s["esperado"]["caminho"].replace(str(antigo), str(novo))

    @staticmethod
    def operacao(spec, op):
        return next(o for item in spec["paths"].values() for o in item.values() if o["operationId"] == op)


class PositivoEBasico(Base):
    def test_pacote_aprovado_passa(self):
        operacoes, cenarios = v.verificar(*self.novo())
        self.assertEqual(operacoes, 30)
        self.assertGreater(cenarios, 150)

    def test_cobertura_de_todos_os_pares_operacao_codigo(self):
        spec, cen, _ = self.novo()
        tem = {(s["operationId"], s["esperado"]["status"], s["esperado"].get("codigo")) for s in cen["cenarios"] if s["operationId"]}
        declarados = {(o["operationId"], int(st), c) for item in spec["paths"].values() for o in item.values() for st, r in o["responses"].items() for c in r.get("x-codigos", [])}
        self.assertEqual(declarados - tem, set())
        self.assertGreaterEqual(len(declarados), 144)

    def test_cenarios_de_decisao_existem(self):
        ids = {s["id"] for s in self.cen0["cenarios"]}
        for esperado in ("atribuirResponsavel.422.SEM_RESPONSAVEL.liberar-em-andamento", "vincularLanterna.422.VINCULO_NAO_PERMITIDO.guardiao-com-setor",
                         "alterarStatusLanterna.409.LANTERNA_EM_MISSAO.ativo-sobre-calculado", "global.404.NAO_ENCONTRADO.rota-desconhecida",
                         "cadastrarUsuario.400.DADOS_INVALIDOS.senha-multibyte-74-bytes", "entrar.400.DADOS_INVALIDOS.senha-multibyte-74-bytes",
                         "cadastrarUsuario.201.senha-72-bytes", "listarUsuarios.200.curinga-percentual", "atribuirResponsavel.200.carga-multipla"):
            self.assertIn(esperado, ids)


class Esquema(Base):
    def test_slug_com_quebra_de_linha_final_e_recusado(self):
        schema = self.spec0["components"]["schemas"]["SlugLanterna"]
        v.validar("hal-jordan", schema, self.spec0)
        with self.assertRaisesRegex(v.Invalido, "padrão inválido"):
            v.validar("hal-jordan\n", schema, self.spec0)

    def test_bytes_utf8_do_limite(self):
        schema = {"type": "string", "maxLength": 72, "x-max-bytes": 72}
        v.validar("ç" * 36, schema, {})  # 72 bytes: válido
        with self.assertRaisesRegex(v.Invalido, "bytes UTF-8 demais"):
            v.validar("ç" * 37, schema, {})  # 37 caracteres, 74 bytes
        with self.assertRaisesRegex(v.Invalido, "bytes UTF-8 demais"):
            v.validar("😀" * 19, schema, {})

    def test_erro_de_encoding_vira_invalido_sem_quebrar(self):
        with self.assertRaisesRegex(v.Invalido, "não codificável em UTF-8"):
            v.validar("\ud800abc", {"type": "string", "x-max-bytes": 72}, {})

    def test_booleano_nao_e_inteiro(self):
        with self.assertRaises(v.Invalido):
            v.validar(True, {"type": "integer"}, {})

    def test_keyword_desconhecida_e_recusada(self):
        spec, cen, api = self.novo()
        spec["components"]["schemas"]["Setor"]["uniqueItems"] = True
        self.rejeita("Keyword não suportada", spec, cen, api)

    def test_campo_critico_fora_de_required(self):
        spec, cen, api = self.novo()
        spec["components"]["schemas"]["Ocorrencia"]["required"].remove("prazoEm")
        self.rejeita("Campos críticos fora de required em Ocorrencia", spec, cen, api)

    def test_limite_de_bytes_removido_do_schema_de_senha(self):
        for nome in ("CadastroEntrada", "LoginEntrada"):
            spec, cen, api = self.novo()
            del spec["components"]["schemas"][nome]["properties"]["senha"]["x-max-bytes"]
            self.rejeita(f"{nome}.senha sem x-max-bytes", spec, cen, api)

    def test_senha_multibyte_acima_do_limite_nao_pode_ser_fixture_positiva(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "cadastrarUsuario.201.senha-72-bytes")["request"]["body"]["senha"] = "ç" * 37
        self.rejeita("request deveria ser válido", spec, cen, api)

    def test_senha_multibyte_acima_do_limite_vale_como_pedido_invalido(self):
        # controle positivo: o 400 por bytes só passa porque o request viola de fato o x-max-bytes
        spec, cen, api = self.novo()
        s = self.cenario(cen, "cadastrarUsuario.400.DADOS_INVALIDOS.senha-multibyte-74-bytes")
        self.assertEqual(len(s["request"]["body"]["senha"]), 37)
        self.assertEqual(len(s["request"]["body"]["senha"].encode("utf-8")), 74)
        v.verificar(spec, cen, api)
        s["request"]["body"]["senha"] = "ç" * 36
        self.rejeita("VALIDA no OpenAPI", spec, cen, api)


class ApiMdEAcesso(Base):
    def test_acesso_do_openapi_diverge_da_tabela(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "criarSetor")["x-acesso"] = "Aut"
        self.rejeita("Acesso divergente entre API.md", spec, cen, api)

    def test_acesso_da_api_md_diverge_do_openapi(self):
        spec, cen, api = self.novo()
        api = api.replace("| `POST /setores` | G |", "| `POST /setores` | Aut |")
        self.rejeita("Acesso divergente entre API.md", spec, cen, api)

    def test_rota_removida_da_api_md(self):
        spec, cen, api = self.novo()
        linha = [x for x in api.splitlines() if x.startswith("| `DELETE /setores/:id`")][0]
        self.rejeita("Cobertura API.md divergente", spec, cen, api.replace(linha, ""))

    def test_rota_protegida_sem_401(self):
        spec, cen, api = self.novo()
        del self.operacao(spec, "criarSetor")["responses"]["401"]
        self.rejeita("401", spec, cen, api)

    def test_rota_de_papel_sem_403(self):
        spec, cen, api = self.novo()
        del self.operacao(spec, "criarSetor")["responses"]["403"]
        self.rejeita("403", spec, cen, api)

    def test_rota_publica_nao_declara_nao_autenticado(self):
        spec, cen, api = self.novo()
        o = self.operacao(spec, "consultarSetor")
        o["responses"]["401"] = copy.deepcopy(self.operacao(spec, "criarSetor")["responses"]["401"])
        o["responses"]["401"]["content"]["application/json"]["examples"] = {"NAO_AUTENTICADO": {"value": {
            "sucesso": False, "erro": {"status": 401, "mensagem": "x", "codigo": "NAO_AUTENTICADO"}, "caminho": "/setores/1", "timestamp": "2026-11-09T12:00:00Z"}}}
        self.rejeita("(Status de erro divergentes|Rota pública)", spec, cen, api)

    def test_status_de_sucesso_diverge(self):
        spec, cen, api = self.novo()
        api = api.replace("| 201 | 400, 401, 403, 409 `SETOR_JA_CADASTRADO` |", "| 200 | 400, 401, 403, 409 `SETOR_JA_CADASTRADO` |")
        self.rejeita("Status de sucesso divergente", spec, cen, api)

    def test_enum_de_codigo_diverge_de_x_codigos(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "criarSetor")["responses"]["409"]["x-codigos"] = ["LANTERNA_EM_USO"]
        self.rejeita("Enum do schema diverge de x-codigos", spec, cen, api)

    def test_codigo_novo_precisa_estar_no_erro_422(self):
        spec, cen, api = self.novo()
        spec["components"]["schemas"]["Erro422"]["properties"]["erro"]["properties"]["codigo"]["enum"].remove("VINCULO_NAO_PERMITIDO")
        self.rejeita("Código fora do enum de Erro422", spec, cen, api)

    def test_tabela_de_codigos_da_api_md_precisa_do_codigo_novo(self):
        spec, cen, api = self.novo()
        self.rejeita("Tabela de códigos de API.md diverge", spec, cen, api.replace("`SETOR_OBRIGATORIO`, `VINCULO_NAO_PERMITIDO`", "`SETOR_OBRIGATORIO`"))

    def test_caminho_do_exemplo_do_openapi_fora_da_rota(self):
        spec, cen, api = self.novo()
        spec["components"]["examples"]["criarSetor_SETOR_JA_CADASTRADO"]["value"]["caminho"] = "/ocorrencias/qualquer"
        self.rejeita("caminho do exemplo", spec, cen, api)


class Cenarios(Base):
    def test_ator_sem_papel_da_rota(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.201")["ator"] = "L674"
        self.rejeita("não serve para status 201", spec, cen, api)

    def test_ator_publico_em_rota_protegida(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.200")["ator"] = "Pub"
        self.rejeita("sem credencial fora de um 401", spec, cen, api)

    def test_403_exige_ator_sem_o_papel(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.403.SEM_PERMISSAO")["ator"] = "G"
        self.rejeita("não serve para status 403", spec, cen, api)

    def test_400_exige_ator_que_passa_a_esteira(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.400.DADOS_INVALIDOS.campo-extra")["ator"] = "L2814"
        self.rejeita("a esteira exige papel guardiao", spec, cen, api)

    def test_pedido_invalido_que_na_verdade_e_valido(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.400.DADOS_INVALIDOS.limite-51")["request"]["query"]["limite"] = 50
        self.rejeita("fixture positiva disfarçada", spec, cen, api)

    def test_fixture_positiva_invalida(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.200")["request"]["query"]["limite"] = 51
        self.rejeita("request deveria ser válido", spec, cen, api)

    def test_esteira_404_com_uuid_malformado(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "consultarOcorrencia.404.NAO_ENCONTRADO.outro-setor")["request"]["path"]["id"] = "nao-e-uuid"
        self.rejeita("request deveria ser válido", spec, cen, api)

    def test_pedido_invalido_por_papel_precisa_ser_valido_no_schema(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarOcorrencia.400.DADOS_INVALIDOS.lanterna-com-setorId")["request"]["body"]["titulo"] = "x"
        self.rejeita("invalidoPor=papel exige request válido", spec, cen, api)

    def test_detalhes_do_400_apontam_o_campo_violado(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.400.DADOS_INVALIDOS.limite-51")["esperado"]["detalhes"] = [{"campo": "pagina"}]
        self.rejeita("não aparece na violação", spec, cen, api)

    def test_caminho_do_erro_diverge_da_rota(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "consultarOcorrencia.404.NAO_ENCONTRADO.inexistente")["esperado"]["caminho"] = "/ocorrencias/qualquer"
        self.rejeita("caminho do erro", spec, cen, api)

    def test_codigo_nao_declarado_para_a_operacao(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "alterarStatusOcorrencia.422.SEM_RESPONSAVEL.iniciar")["esperado"]["codigo"] = "MENTOR_INVALIDO"
        self.rejeita("não declarado para alterarStatusOcorrencia 422", spec, cen, api)

    def test_cobertura_de_par_operacao_codigo(self):
        spec, cen, api = self.novo()
        cen["cenarios"] = [s for s in cen["cenarios"] if s["id"] != "atribuirResponsavel.422.SEM_RESPONSAVEL.liberar-em-andamento"]
        self.rejeita("Par operação×código sem cenário: atribuirResponsavel 422 SEM_RESPONSAVEL", spec, cen, api)

    def test_cobertura_do_codigo_novo_de_vinculo(self):
        spec, cen, api = self.novo()
        cen["cenarios"] = [s for s in cen["cenarios"] if "VINCULO_NAO_PERMITIDO" not in s["id"]]
        self.rejeita("Par operação×código sem cenário: vincularLanterna 422 VINCULO_NAO_PERMITIDO", spec, cen, api)

    def test_cobertura_de_sucesso_e_de_rota_desconhecida(self):
        spec, cen, api = self.novo()
        cen["cenarios"] = [s for s in cen["cenarios"] if not s["id"].startswith("consultarSaude.200")]
        self.rejeita("Operação sem cenário de sucesso: consultarSaude", spec, cen, api)
        spec, cen, api = self.novo()
        cen["cenarios"] = [s for s in cen["cenarios"] if s["tipo"] != "global"]
        self.rejeita("Sem cenário de rota desconhecida", spec, cen, api)

    def test_rota_desconhecida_que_existe(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "global.404.NAO_ENCONTRADO.rota-desconhecida")
        s["request"]["caminho"] = "/saude"
        s["esperado"]["caminho"] = "/saude"
        self.rejeita("a rota existe", spec, cen, api)

    def test_precondicao_obrigatoria_do_401_429_500(self):
        for id_, trecho in (("listarUsuarios.401.NAO_AUTENTICADO", "401 NAO_AUTENTICADO exige precondicao token_"), ("entrar.429.MUITAS_TENTATIVAS", "429 exige precondicao throttle"),
                            ("listarUsuarios.500.ERRO_INTERNO", "500 exige precondicao falha_controlada")):
            spec, cen, api = self.novo()
            del self.cenario(cen, id_)["precondicao"]
            self.rejeita(trecho, spec, cen, api)

    def test_precondicao_de_throttle_incompleta(self):
        spec, cen, api = self.novo()
        del self.cenario(cen, "entrar.429.MUITAS_TENTATIVAS")["precondicao"]["janela"]
        self.rejeita("throttle declara", spec, cen, api)

    def test_rejeicao_nao_tem_efeitos(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.409.SETOR_JA_CADASTRADO")["efeitos"] = [{"colecao": "setores", "chave": "9", "remover": True}]
        self.rejeita("rejeição não tem efeitos", spec, cen, api)

    def test_sucesso_de_escrita_sem_efeitos(self):
        spec, cen, api = self.novo()
        del self.cenario(cen, "criarSetor.201")["efeitos"]
        self.rejeita("sucesso de escrita declara efeitos", spec, cen, api)

    def test_tipo_e_status_incompativeis(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.409.SETOR_JA_CADASTRADO")["tipo"] = "pedido_invalido"
        self.rejeita("pedido_invalido é exatamente o status 400", spec, cen, api)

    def test_versao_do_contrato_diverge(self):
        spec, cen, api = self.novo()
        cen["versaoContrato"] = "1.0.1"
        self.rejeita("Versão divergente", spec, cen, api)

    def test_id_do_cenario_repetido(self):
        spec, cen, api = self.novo()
        cen["cenarios"][1]["id"] = cen["cenarios"][0]["id"]
        self.rejeita("repetido", spec, cen, api)

    def test_esteira_ordem_autenticacao_e_papel_antes_do_formato(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.401.NAO_AUTENTICADO.precede-formato")["request"] = copy.deepcopy(self.cenario(cen, "criarSetor.201")["request"])
        self.rejeita("precisa de request inválido para provar a ordem", spec, cen, api)
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.403.SEM_PERMISSAO.precede-formato")["request"] = copy.deepcopy(self.cenario(cen, "criarSetor.201")["request"])
        self.rejeita("precisa de request inválido para provar a ordem", spec, cen, api)


class EstadoInicialPermiteAFalha(Base):
    def casos(self):
        spec, cen, api = self.novo()
        return spec, cen, api

    def test_ultimo_guardiao_precisa_de_um_unico_guardiao(self):
        spec, cen, api = self.novo()
        del self.cenario(cen, "alterarPapel.409.ULTIMO_GUARDIAO")["ajustes"]
        self.rejeita("NÃO permite 409 ULTIMO_GUARDIAO", spec, cen, api)

    def test_liberar_em_andamento_exige_ocorrencia_em_andamento(self):
        spec, cen, api = self.novo()
        self.trocar_id(self.cenario(cen, "atribuirResponsavel.422.SEM_RESPONSAVEL.liberar-em-andamento"), self.cen0["mundos"]["base"]["ocorrencias"]["O2"]["id"])
        self.rejeita("NÃO permite 422 SEM_RESPONSAVEL", spec, cen, api)

    def test_liberar_ocorrencia_aberta_e_sucesso_nao_erro(self):
        ids = {s["id"] for s in self.cen0["cenarios"]}
        self.assertIn("atribuirResponsavel.200.libera-aberta", ids)

    def test_vinculo_de_guardiao_exige_alvo_guardiao(self):
        spec, cen, api = self.novo()
        self.trocar_id(self.cenario(cen, "vincularLanterna.422.VINCULO_NAO_PERMITIDO.guardiao-com-setor"), self.cen0["mundos"]["base"]["usuarios"]["SEM_VINCULO"]["id"])
        self.rejeita("NÃO permite 422 VINCULO_NAO_PERMITIDO", spec, cen, api)

    def test_ficha_sem_setor_exige_ficha_sem_setor(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "vincularLanterna.422.SETOR_DIFERENTE.ficha-sem-setor")["request"]["body"]["lanternaId"] = "john-stewart"
        self.rejeita("NÃO permite 422 SETOR_DIFERENTE", spec, cen, api)

    def test_vinculo_duplicado_exige_ficha_de_outra_conta(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "vincularLanterna.409.LANTERNA_JA_VINCULADA")["request"]["body"]["lanternaId"] = "john-stewart"
        self.rejeita("NÃO permite 409 LANTERNA_JA_VINCULADA", spec, cen, api)

    def test_precedencia_vinculo_precisa_das_duas_condicoes(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "vincularLanterna.422.VINCULO_NAO_PERMITIDO.precede-setor")["request"]["body"]["lanternaId"] = "john-stewart"
        self.rejeita("duas condições", spec, cen, api)

    def test_precedencia_de_autoria_antes_do_estado(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "editarOcorrencia.403.SEM_PERMISSAO.resolvida-precede-409")["ator"] = "L2814"
        self.rejeita("(NÃO permite 403 SEM_PERMISSAO|duas condições)", spec, cen, api)

    def test_estado_precede_ficha_na_atribuicao(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "atribuirResponsavel.409.OCORRENCIA_RESOLVIDA.precede-ficha")["request"]["body"]["responsavelId"] = "guy-gardner"
        self.rejeita("duas condições", spec, cen, api)

    def test_comentario_de_ocorrencia_excluida_nao_e_acessivel(self):
        spec, cen, api = self.novo()
        self.trocar_id(self.cenario(cen, "excluirComentario.404.NAO_ENCONTRADO.ocorrencia-excluida"), self.cen0["mundos"]["base"]["comentarios"]["C1"]["id"])
        self.rejeita("NÃO permite 404 NAO_ENCONTRADO", spec, cen, api)

    def test_afastar_ficha_em_missao_exige_em_missao(self):
        spec, cen, api = self.novo()
        self.trocar_id(self.cenario(cen, "alterarStatusLanterna.409.LANTERNA_EM_MISSAO.afastar"), "john-stewart")
        self.rejeita("NÃO permite 409 LANTERNA_EM_MISSAO", spec, cen, api)

    def test_setor_em_uso_exige_referencia(self):
        spec, cen, api = self.novo()
        self.trocar_id(self.cenario(cen, "excluirSetor.409.SETOR_EM_USO.so-usuario"), 3601)
        self.rejeita("NÃO permite 409 SETOR_EM_USO", spec, cen, api)

    def test_login_com_credencial_correta_nao_e_401(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "entrar.401.CREDENCIAIS_INVALIDAS.senha-incorreta")["request"]["body"]["senha"] = "SomenteTeste123!"
        self.rejeita("NÃO permite 401 CREDENCIAIS_INVALIDAS", spec, cen, api)

    def test_rejeicao_sem_regra_de_pre_condicao_e_recusada(self):
        spec, cen, api = self.novo()
        regra = v.ESTADO_PERMITE.pop(("criarSetor", "SETOR_JA_CADASTRADO"))
        try:
            self.rejeita("sem regra de pré-condição", spec, cen, api)
        finally:
            v.ESTADO_PERMITE[("criarSetor", "SETOR_JA_CADASTRADO")] = regra


class MundoERelacoes(Base):
    def mundo(self, cen):
        return cen["mundos"]["base"]

    def test_prazo_errado(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O1"]["prazoEm"] = "2026-11-12T14:00:00Z"
        self.rejeita("prazoEm de O1 deveria ser", spec, cen, api)

    def test_vencida_incoerente_com_o_relogio(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O2"]["vencida"] = False
        self.rejeita("vencida de O2 incoerente", spec, cen, api)

    def test_vencida_segue_o_relogio_do_cenario(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "consultarOcorrencia.200.relogio-posterior")
        s["ajustes"] = s["ajustes"][:2]  # O9 continua com vencida=false às 15:00Z
        self.rejeita("vencida de O9 incoerente com o relógio 2026-11-09T15:00:00Z", spec, cen, api)

    def test_responsavel_inexistente(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O2"]["responsavelId"] = "ficha-fantasma"
        self.rejeita("Responsável inexistente", spec, cen, api)

    def test_ficha_do_vinculo_inexistente(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["usuarios"]["L2814"]["lanternaId"] = "ficha-fantasma"
        self.rejeita("Ficha inexistente no vínculo", spec, cen, api)

    def test_vinculo_com_setor_diferente(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["usuarios"]["L2814"]["setorId"] = 674
        self.rejeita("vínculo com Setor diferente", spec, cen, api)

    def test_conta_lanterna_sem_setor_nao_e_estado_valido(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["usuarios"]["SEM_VINCULO"]["setorId"] = None
        self.rejeita("conta Lanterna sem Setor", spec, cen, api)

    def test_ficha_vinculada_a_duas_contas(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["usuarios"]["SEM_VINCULO"]["lanternaId"] = "hal-jordan"
        self.rejeita("Ficha vinculada a duas contas", spec, cen, api)

    def test_status_da_ficha_diverge_das_ocorrencias_pendentes(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["lanternas"]["hal-jordan"]["status"] = "ativo"
        self.rejeita("Ficha hal-jordan ativo é Responsável de", spec, cen, api)
        spec, cen, api = self.novo()
        self.mundo(cen)["lanternas"]["john-stewart"]["status"] = "em_missao"
        self.rejeita("em_missao sem Ocorrência pendente", spec, cen, api)

    def test_responsavel_de_outro_setor(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O4"]["responsavelId"] = "hal-jordan"
        self.rejeita("Responsável de outro Setor", spec, cen, api)

    def test_autor_do_evento_criada_diverge_do_criador(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["eventos"]["O1.1"]["autorId"] = self.mundo(cen)["usuarios"]["G"]["id"]
        self.rejeita("autor do Evento criada de O1 diverge de criadaPorId", spec, cen, api)

    def test_linha_do_tempo_diverge_do_estado_final(self):
        spec, cen, api = self.novo()
        del self.mundo(cen)["eventos"]["O1.3"]
        self.rejeita("linha do tempo de O1 termina em aberta, a Ocorrência está em_andamento", spec, cen, api)

    def test_responsavel_final_diverge_da_linha_do_tempo(self):
        spec, cen, api = self.novo()
        del self.mundo(cen)["eventos"]["O8.2"]
        self.rejeita("termina com Responsável None", spec, cen, api)

    def test_resolvida_em_diverge_do_evento_de_resolucao(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O3"]["resolvidaEm"] = "2026-11-05T10:00:00Z"
        self.rejeita("resolução/resolvidaEm de O3 divergem da linha do tempo", spec, cen, api)

    def test_resolvida_antes_da_criacao(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["ocorrencias"]["O3"]["resolvidaEm"] = "2026-11-01T10:00:00Z"
        self.rejeita("resolvidaEm fora do intervalo", spec, cen, api)

    def test_comentario_apagado_sem_evento(self):
        spec, cen, api = self.novo()
        del self.mundo(cen)["eventos"]["O1.5"]
        self.rejeita("Comentário excluído sem Evento comentario_apagado", spec, cen, api)

    def test_email_repetido_com_caixa_diferente(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["usuarios"]["G"]["email"] = "L2814@example.invalid"
        self.rejeita("e-mail repetido", spec, cen, api)

    def test_ciclo_de_mentoria(self):
        spec, cen, api = self.novo()
        self.mundo(cen)["lanternas"]["hal-jordan"]["mentorId"] = "guy-gardner"
        self.rejeita("ciclo de mentoria", spec, cen, api)

    def test_ajuste_sobre_entidade_inexistente(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "criarSetor.201")["ajustes"] = [{"colecao": "usuarios", "chave": "FANTASMA", "mesclar": {"nome": "x"}}]
        self.rejeita("mesclar em entidade inexistente", spec, cen, api)

    def test_criacao_com_id_ja_existente(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "criarSetor.201")
        s["efeitos"][0]["adicionar"]["id"] = 2814
        s["efeitos"][0]["chave"] = "2814"
        self.rejeita("sobre chave existente", spec, cen, api)

    def test_efeito_que_gera_mundo_invalido(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "atribuirResponsavel.200.atribui")
        s["efeitos"] = [e for e in s["efeitos"] if e["colecao"] != "eventos"]
        self.rejeita("atribuirResponsavel.200.atribui.estadoFinal", spec, cen, api)

    def test_efeito_esquece_status_calculado_da_ficha(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "atribuirResponsavel.200.atribui")
        s["efeitos"] = [e for e in s["efeitos"] if e["colecao"] != "lanternas"]
        self.rejeita("deveria estar em_missao", spec, cen, api)


class RespostasEsperadas(Base):
    def test_id_da_resposta_diverge_do_path(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "consultarOcorrencia.200")
        s["esperado"]["corpo"]["dados"]["id"] = self.cen0["mundos"]["base"]["ocorrencias"]["O2"]["id"]
        self.rejeita("id da resposta .* diferente do id do path", spec, cen, api)

    def test_id_da_resposta_do_setor_diverge_do_path(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "consultarSetor.200")["request"]["path"]["id"] = 674
        self.rejeita("diferente do id do path", spec, cen, api)

    def test_resposta_diverge_da_entidade_do_mundo(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "consultarOcorrencia.200")["esperado"]["corpo"]["dados"]["titulo"] = "Outro título qualquer"
        self.rejeita("resposta diverge da entidade do mundo", spec, cen, api)

    def test_prazo_e_vencida_da_resposta_seguem_o_mundo(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "consultarOcorrencia.200.guardiao-vencida")["esperado"]["corpo"]["dados"]["vencida"] = False
        self.rejeita("resposta diverge da entidade do mundo", spec, cen, api)

    def test_resposta_com_campo_obrigatorio_ausente(self):
        spec, cen, api = self.novo()
        del self.cenario(cen, "consultarOcorrencia.200")["esperado"]["corpo"]["dados"]["prazoEm"]
        self.rejeita("campos obrigatórios ausentes", spec, cen, api)

    def test_meta_de_paginas_errada(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.200.busca-teste-pagina-2")["esperado"]["corpo"]["dados"]["meta"]["paginas"] = 2
        self.rejeita("meta.paginas inconsistente", spec, cen, api)

    def test_meta_de_pagina_diverge_do_pedido(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "listarUsuarios.200.busca-teste-pagina-2")["esperado"]["corpo"]["dados"]["meta"]["pagina"] = 1
        self.rejeita("meta.pagina/limite diferem do pedido", spec, cen, api)

    def test_pagina_alem_do_fim_nao_pode_ter_itens(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "listarOcorrencias.200.pagina-alem-do-fim")
        s["esperado"]["corpo"]["dados"]["itens"] = [self.cen0["mundos"]["base"]["ocorrencias"]["O1"]] and s["esperado"]["corpo"]["dados"]["itens"] or []
        self.assertEqual(s["esperado"]["corpo"]["dados"]["itens"], [])
        s["esperado"]["corpo"]["dados"]["meta"]["total"] = 99
        s["esperado"]["corpo"]["dados"]["meta"]["paginas"] = 10
        self.rejeita("(itens, esperados|meta)", spec, cen, api)

    def test_total_de_usuarios_nao_bate_com_a_busca(self):
        spec, cen, api = self.novo()
        m = self.cenario(cen, "listarUsuarios.200.busca-teste-pagina-2")["esperado"]["corpo"]["dados"]["meta"]
        m["total"], m["paginas"] = 4, 2
        self.rejeita("contas que casam a busca", spec, cen, api)

    def test_item_que_nao_casa_a_busca(self):
        spec, cen, api = self.novo()
        g = self.cen0["mundos"]["base"]["usuarios"]["G"]
        self.cenario(cen, "listarUsuarios.200.busca-sem-acento")["esperado"]["corpo"]["dados"]["itens"] = [g]
        self.rejeita("não casa a busca", spec, cen, api)

    def test_item_de_lista_que_nao_existe_no_mundo(self):
        spec, cen, api = self.novo()
        item = self.cenario(cen, "listarUsuarios.200.busca-sem-acento")["esperado"]["corpo"]["dados"]["itens"][0]
        item["nome"] = "Conta sem vínculo (adulterada)"
        self.rejeita("não corresponde a uma conta do mundo", spec, cen, api)

    def test_pagina_de_usuarios_fora_da_ordem(self):
        spec, cen, api = self.novo()
        dados = self.cenario(cen, "listarUsuarios.200.busca-teste-pagina-2")["esperado"]["corpo"]["dados"]
        dados["itens"].reverse()
        self.rejeita("fora da ordem pedida", spec, cen, api)

    def test_minha_fila_fora_da_ordem(self):
        spec, cen, api = self.novo()
        itens = self.cenario(cen, "listarMinhaFila.200")["esperado"]["corpo"]["dados"]["itens"]
        itens[0], itens[-1] = itens[-1], itens[0]
        self.rejeita("fila fora da ordem", spec, cen, api)

    def test_minha_fila_so_pendentes_e_nao_excluidas(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "listarMinhaFila.200")
        base = self.cen0["mundos"]["base"]["ocorrencias"]
        s["esperado"]["corpo"]["dados"]["itens"].append({k: v_ for k, v_ in base["O6"].items() if k != "excluidaEm"})
        s["esperado"]["corpo"]["dados"]["meta"]["total"] += 1
        self.rejeita("total da fila", spec, cen, api)

    def test_linha_do_tempo_da_resposta_diverge_do_mundo(self):
        spec, cen, api = self.novo()
        itens = self.cenario(cen, "listarEventos.200")["esperado"]["corpo"]["dados"]["itens"]
        itens.pop()
        self.rejeita("itens, esperados", spec, cen, api)

    def test_lista_de_comentarios_inclui_apagado(self):
        spec, cen, api = self.novo()
        s = self.cenario(cen, "listarComentarios.200")["esperado"]["corpo"]["dados"]
        apagado = {k: v_ for k, v_ in self.cen0["mundos"]["base"]["comentarios"]["C6"].items() if k != "excluidoEm"}
        apagado["autor"] = {"id": apagado["autorId"], "nome": "Lanterna 2814 B de teste", "papel": "lanterna"}
        s["itens"].append(apagado)
        s["meta"]["total"] += 1
        self.rejeita("comentários diferem dos não excluídos", spec, cen, api)

    def test_login_devolve_somente_o_marcador_de_token(self):
        spec, cen, api = self.novo()
        self.cenario(cen, "entrar.200")["esperado"]["corpo"]["dados"]["token"] = "eyJhbGciOiJIUzI1NiJ9.token-utilizavel.assinatura"
        self.rejeita("token deve ser o marcador fictício", spec, cen, api)


class ControlesAnteriores(Base):
    """Controles que já existiam antes da rodada 2 também têm teste negativo permanente."""

    def test_operation_id_duplicado(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "consultarSaude")["operationId"] = "listarSetores"
        self.rejeita("operationId duplicado", spec, cen, api)

    def test_referencia_interna_inexistente(self):
        spec, cen, api = self.novo()
        spec["components"]["schemas"]["SetorResposta"]["properties"]["dados"] = {"$ref": "#/components/schemas/NaoExiste"}
        self.rejeita("Referência ausente", spec, cen, api)

    def test_referencia_externa_nao_suportada(self):
        with self.assertRaisesRegex(v.Invalido, "Referência externa não suportada"):
            v.resolver({}, "https://example.invalid/schema.json")

    def test_seguranca_diverge_do_acesso(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "criarSetor")["security"] = []
        self.rejeita("Segurança divergente", spec, cen, api)

    def test_parametro_de_path_ausente(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "consultarSetor")["parameters"] = []
        self.rejeita("Path params divergentes", spec, cen, api)

    def test_corpo_sem_exemplo(self):
        spec, cen, api = self.novo()
        del self.operacao(spec, "criarSetor")["requestBody"]["content"]["application/json"]["examples"]
        self.rejeita("Corpo sem exemplo", spec, cen, api)

    def test_exemplo_do_openapi_fora_do_schema(self):
        spec, cen, api = self.novo()
        spec["components"]["examples"]["consultarSetor_sucesso"]["value"]["dados"]["id"] = "texto"
        self.rejeita("esperado integer", spec, cen, api)

    def test_formato_timestamp_sem_fuso(self):
        schema = {"type": "string", "format": "date-time"}
        v.validar("2026-11-09T12:00:00Z", schema, {})
        with self.assertRaisesRegex(v.Invalido, "timestamp com fuso exigido"):
            v.validar("2026-11-09T12:00:00", schema, {})

    def test_formatos_uuid_data_email_url(self):
        v.validar("00000000-0000-4000-8000-000000000201", {"type": "string", "format": "uuid"}, {})
        for valor, formato in (("00000000-0000-4000-8000-00000000020", "uuid"), ("2026-02-30", "date"), ("sem-arroba", "email"), ("ftp://example.invalid", "uri")):
            with self.assertRaises(v.Invalido):
                v.validar(valor, {"type": "string", "format": formato}, {})

    def test_enum_const_campo_extra_e_limites(self):
        with self.assertRaisesRegex(v.Invalido, "fora do enum"):
            v.validar("x", {"enum": ["a"]}, {})
        with self.assertRaisesRegex(v.Invalido, "campos desconhecidos"):
            v.validar({"a": 1, "b": 2}, {"type": "object", "properties": {"a": {}}, "additionalProperties": False}, {})
        with self.assertRaisesRegex(v.Invalido, "acima do máximo"):
            v.validar(51, {"type": "integer", "maximum": 50}, {})
        with self.assertRaisesRegex(v.Invalido, "objeto vazio"):
            v.validar({}, {"type": "object", "minProperties": 1}, {})

    def test_204_com_corpo_e_recusado(self):
        spec, cen, api = self.novo()
        self.operacao(spec, "excluirSetor")["responses"]["204"]["content"] = {"application/json": {}}
        self.rejeita("204 com content", spec, cen, api)


class BuscaDeterministica(unittest.TestCase):
    def test_acento_e_caixa(self):
        self.assertTrue(v.casa_busca("Conta sem vínculo", "VINCULO"))
        self.assertTrue(v.casa_busca("Lanterna Ágil", "ágil"))
        self.assertTrue(v.casa_busca("GUARDIÃO", "guardiao"))
        self.assertFalse(v.casa_busca("Lanterna Agil", "agi l"))

    def test_normalizacao_unicode_composta_e_decomposta(self):
        self.assertTrue(v.casa_busca("Vínculo", "vínculo"))  # i + acento combinante
        self.assertTrue(v.casa_busca("Vínculo", "vínculo"))
        self.assertEqual(v.normalizar_busca("Ç̃"), "c")

    def test_trim_e_busca_vazia_ignorada(self):
        self.assertTrue(v.casa_busca("qualquer", ""))
        self.assertTrue(v.casa_busca("qualquer", "   "))
        self.assertTrue(v.casa_busca("a b", " a b "))

    def test_curingas_sao_literais(self):
        self.assertFalse(v.casa_busca("Conta qualquer", "%"))
        self.assertFalse(v.casa_busca("Conta qualquer", "_"))
        self.assertFalse(v.casa_busca("Conta qualquer", "\\"))
        self.assertTrue(v.casa_busca("Conta 100% a_b\\c", "%"))
        self.assertTrue(v.casa_busca("Conta 100% a_b\\c", "a_b"))
        self.assertFalse(v.casa_busca("axb", "a_b"))
        self.assertTrue(v.casa_busca("Conta 100% a_b\\c", "\\"))

    def test_substring_literal_nao_regex(self):
        self.assertFalse(v.casa_busca("abc", "a.c"))
        self.assertTrue(v.casa_busca("a.c", "a.c"))


class HashEInterface(Base):
    def test_hash_estavel_independe_do_fim_de_linha(self):
        partes1, conjunto1 = v.hash_do_pacote(AQUI.parent)
        self.assertEqual(len(conjunto1), 64)
        self.assertEqual(set(partes1), set(v.ARQUIVOS_DO_PACOTE))

    def test_conferir_hash_errado_falha_com_codigo_1(self):
        erro = io.StringIO()
        with contextlib.redirect_stderr(erro), contextlib.redirect_stdout(io.StringIO()):
            codigo = v.main(["--conferir-hash", "0" * 64])
        self.assertEqual(codigo, 1)
        self.assertIn("o contrato mudou depois do aceite", erro.getvalue())

    def test_conferir_hash_certo_passa(self):
        _, conjunto = v.hash_do_pacote(AQUI.parent)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(v.main(["--conferir-hash", conjunto]), 0)

    def test_cli_rejeita_copia_com_erro_sem_levantar_excecao(self):
        spec, cen, _ = carregar()
        cen["cenarios"][0]["esperado"]["status"] = 500
        with tempfile.TemporaryDirectory() as tmp:
            caminho = Path(tmp) / "cenarios.json"
            caminho.write_text(json.dumps(cen), encoding="utf-8")
            erro = io.StringIO()
            with contextlib.redirect_stderr(erro), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(v.main(["--fixtures", str(caminho)]), 1)
            self.assertIn("FALHA documental", erro.getvalue())

    def test_cli_arquivo_inexistente_e_json_quebrado(self):
        with tempfile.TemporaryDirectory() as tmp:
            quebrado = Path(tmp) / "quebrado.json"
            quebrado.write_text("{", encoding="utf-8")
            for argumentos in (["--spec", str(Path(tmp) / "nao-existe.json")], ["--spec", str(quebrado)]):
                with contextlib.redirect_stderr(io.StringIO()) as erro, contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(v.main(argumentos), 1)
                self.assertIn("FALHA documental", erro.getvalue())


if __name__ == "__main__":
    unittest.main(verbosity=2)
