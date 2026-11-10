"""Verificação documental limitada do contrato OANET; Python 3.10+, somente biblioteca padrão.

Não substitui validador integral OpenAPI/JSON Schema, testes de provedor nem testes de integração.
O subconjunto suportado, as propriedades que NÃO são provadas e o gate de hash estão no README deste diretório.
"""

import argparse
import copy
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import urlsplit
import uuid


class Invalido(ValueError):
    pass


def exigir(condicao, mensagem):
    if not condicao:
        raise Invalido(mensagem)


# ---------------------------------------------------------------- JSON Schema (subconjunto)
def resolver(documento, referencia):
    exigir(referencia.startswith("#/"), f"Referência externa não suportada: {referencia}")
    atual = documento
    for parte in referencia[2:].split("/"):
        chave = parte.replace("~1", "/").replace("~0", "~")
        exigir(isinstance(atual, dict) and chave in atual, f"Referência ausente: {referencia}")
        atual = atual[chave]
    return atual


def conferir_refs(documento, no=...):
    no = documento if no is ... else no
    if isinstance(no, dict):
        if "$ref" in no:
            resolver(documento, no["$ref"])
        for valor in no.values():
            conferir_refs(documento, valor)
    elif isinstance(no, list):
        for valor in no:
            conferir_refs(documento, valor)


def mesmo_json(a, b):
    # Em Python True == 1; em JSON Schema boolean não é number/integer.
    return type(a) is type(b) and a == b


def validar_formato(valor, formato, onde):
    try:
        if formato == "uuid":
            exigir(str(uuid.UUID(valor)) == valor.lower(), f"{onde}: UUID canônico inválido")
        elif formato == "date":
            exigir(re.fullmatch(r"\d{4}-\d{2}-\d{2}", valor), f"{onde}: data inválida")
            dt.date.fromisoformat(valor)
        elif formato == "date-time":
            exigir(re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})", valor), f"{onde}: timestamp com fuso exigido")
            data = dt.datetime.fromisoformat(valor.replace("Z", "+00:00"))
            exigir(data.tzinfo is not None, f"{onde}: fuso ausente")
        elif formato == "email":
            exigir(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", valor), f"{onde}: e-mail inválido")
        elif formato == "uri":
            parsed = urlsplit(valor)
            exigir(parsed.scheme in ("http", "https") and parsed.hostname, f"{onde}: URL HTTP(S) absoluta exigida")
        else:
            raise Invalido(f"{onde}: formato sem suporte: {formato}")
    except (ValueError, OverflowError) as erro:
        if isinstance(erro, Invalido):
            raise
        raise Invalido(f"{onde}: formato {formato} inválido") from erro


def bytes_utf8(valor, onde):
    try:
        return len(valor.encode("utf-8"))
    except UnicodeEncodeError as erro:  # ex.: substituto isolado; é entrada inválida, não falha do validador
        raise Invalido(f"{onde}: texto não codificável em UTF-8") from erro


def validar(valor, schema, documento, onde="$"):
    if "$ref" in schema:
        validar(valor, resolver(documento, schema["$ref"]), documento, onde)
    for chave in ("anyOf", "oneOf"):
        if chave in schema:
            acertos = 0
            for alternativa in schema[chave]:
                try:
                    validar(valor, alternativa, documento, onde)
                    acertos += 1
                except Invalido:
                    pass
            exigir(acertos == 1 if chave == "oneOf" else acertos >= 1, f"{onde}: {chave} sem variante válida única/compatível")
    for parte in schema.get("allOf", []):
        validar(valor, parte, documento, onde)
    if "const" in schema:
        exigir(mesmo_json(valor, schema["const"]), f"{onde}: valor diferente de const")
    if "enum" in schema:
        exigir(any(mesmo_json(valor, v) for v in schema["enum"]), f"{onde}: fora do enum")
    tipo = schema.get("type")
    tipos = {"object": lambda x: isinstance(x, dict), "array": lambda x: isinstance(x, list), "string": lambda x: isinstance(x, str), "integer": lambda x: type(x) is int,
             "number": lambda x: type(x) in (int, float) and math.isfinite(x), "boolean": lambda x: type(x) is bool, "null": lambda x: x is None}
    if tipo:
        exigir(tipo in tipos, f"{onde}: tipo não suportado {tipo}")
        exigir(tipos[tipo](valor), f"{onde}: esperado {tipo}, recebido {type(valor).__name__}")
    if isinstance(valor, dict):
        props = schema.get("properties", {})
        exigir(set(schema.get("required", [])) <= valor.keys(), f"{onde}: campos obrigatórios ausentes {set(schema.get('required', [])) - valor.keys()}")
        exigir(len(valor) >= schema.get("minProperties", 0), f"{onde}: objeto vazio ou incompleto")
        if schema.get("additionalProperties") is False:
            exigir(set(valor) <= props.keys(), f"{onde}: campos desconhecidos {set(valor) - props.keys()}")
        for nome, conteudo in valor.items():
            if nome in props:
                validar(conteudo, props[nome], documento, f"{onde}.{nome}")
    if isinstance(valor, list):
        exigir(len(valor) >= schema.get("minItems", 0), f"{onde}: poucos itens")
        exigir(len(valor) <= schema.get("maxItems", math.inf), f"{onde}: itens demais")
        if "items" in schema:
            for i, conteudo in enumerate(valor):
                validar(conteudo, schema["items"], documento, f"{onde}[{i}]")
    if isinstance(valor, str):
        exigir(len(valor) >= schema.get("minLength", 0), f"{onde}: texto curto")
        exigir(len(valor) <= schema.get("maxLength", math.inf), f"{onde}: texto longo")
        if "pattern" in schema:
            # fullmatch: o padrão é absoluto; '$' do re.search aceitaria uma quebra de linha final.
            exigir(re.fullmatch(schema["pattern"], valor), f"{onde}: padrão inválido")
        if "format" in schema:
            validar_formato(valor, schema["format"], onde)
        if "x-max-palavras" in schema:
            exigir(len(valor.split()) <= schema["x-max-palavras"], f"{onde}: palavras demais")
        if "x-max-bytes" in schema:
            exigir(bytes_utf8(valor, onde) <= schema["x-max-bytes"], f"{onde}: bytes UTF-8 demais")
    if type(valor) in (int, float):
        exigir(valor >= schema.get("minimum", -math.inf), f"{onde}: abaixo do mínimo")
        exigir(valor <= schema.get("maximum", math.inf), f"{onde}: acima do máximo")


KEYWORDS = {"$ref", "type", "const", "enum", "properties", "required", "additionalProperties", "minProperties", "items", "minItems", "maxItems", "minLength", "maxLength", "pattern",
            "format", "minimum", "maximum", "anyOf", "oneOf", "allOf", "description", "default", "writeOnly", "readOnly", "discriminator", "title", "examples"}


def conferir_keywords(schema):
    """Recusa keywords desconhecidas para evitar passar novas regras em silêncio."""
    for chave in schema:
        exigir(chave in KEYWORDS or chave.startswith("x-"), f"Keyword não suportada: {chave}; atualizar validador/limites antes de aceitar")
    for child in schema.get("properties", {}).values():
        conferir_keywords(child)
    if "items" in schema:
        conferir_keywords(schema["items"])
    for chave in ("anyOf", "oneOf", "allOf"):
        for child in schema.get(chave, []):
            conferir_keywords(child)


# Campos sem os quais um consumidor ou provedor erra em silêncio: precisam continuar em `required`.
CAMPOS_CRITICOS = {
    "Ocorrencia": ["id", "titulo", "setorId", "gravidade", "status", "responsavelId", "resolucao", "criadaPorId", "criadaEm", "resolvidaEm", "prazoEm", "vencida"],
    "Usuario": ["id", "email", "papel", "lanternaId", "setorId"],
    "LanternaFicha": ["id", "setorId", "status", "mentorId", "fontes", "estatisticas", "mentor", "aprendizes"],
    "Comentario": ["id", "ocorrenciaId", "autorId", "autor", "texto"],
    "MetaPaginacao": ["total", "pagina", "limite", "paginas"],
    "CadastroEntrada": ["nome", "email", "senha", "setorId"],
    "LoginEntrada": ["email", "senha"],
    "ResponsavelEntrada": ["responsavelId"],
    "VinculoEntrada": ["lanternaId"],
}
# Limites de bytes que não podem sumir do schema.
BYTES_OBRIGATORIOS = {"CadastroEntrada": 72, "LoginEntrada": 72}


# ---------------------------------------------------------------- busca determinística (C-04)
def normalizar_busca(texto):
    """NFD, remove marcas combinantes (Mn), minúsculas. Mesma função para texto armazenado e termo."""
    decomposto = unicodedata.normalize("NFD", texto)
    return "".join(c for c in decomposto if unicodedata.category(c) != "Mn").lower()


def casa_busca(armazenado, termo):
    """Substring literal; termo aparado; termo vazio é ignorado (casa tudo). %, _ e \\ não são curingas."""
    termo = normalizar_busca(termo.strip())
    return termo == "" or termo in normalizar_busca(armazenado)


# ---------------------------------------------------------------- parâmetros e respostas de uma operação
def conferir_request(request, operation, documento):
    params = operation.get("parameters", [])
    exigir(set(request) <= {"path", "query", "body"}, f"Chaves de request desconhecidas: {set(request) - {'path', 'query', 'body'}}")
    for local in ("path", "query"):
        valores = request.get(local, {})
        definidos = {p["name"]: p for p in params if p["in"] == local}
        exigir(set(valores) <= definidos.keys(), f"Parâmetro {local} desconhecido: {sorted(set(valores) - definidos.keys())}")
        for nome, p in definidos.items():
            exigir(not p.get("required") or nome in valores, f"Parâmetro obrigatório ausente: {local}.{nome}")
            if nome in valores:
                # Query/path nas fixtures já estão convertidos; HTTP serializa como texto.
                validar(valores[nome], p["schema"], documento, local + "." + nome)
    if "requestBody" in operation:
        exigir("body" in request, "Request sem body obrigatório")
        media = operation["requestBody"]["content"]["application/json"]
        validar(request["body"], media["schema"], documento, "request.body")
    else:
        exigir("body" not in request, "Body em operação sem corpo")


def schema_da_resposta(operation, status):
    declarado = operation["responses"].get(str(status))
    exigir(declarado is not None, f"Status não declarado: {status}")
    return declarado


def corpo_de_erro(status, codigo, caminho, relogio, detalhes=None):
    erro = {"status": status, "mensagem": "Mensagem do cenário", "codigo": codigo}
    if detalhes is not None:
        erro["detalhes"] = [{"campo": d["campo"], "mensagens": ["Mensagem do cenário"]} for d in detalhes]
    return {"sucesso": False, "erro": erro, "caminho": caminho, "timestamp": relogio}


def caminho_de(template, request):
    caminho = template
    for nome, valor in request.get("path", {}).items():
        caminho = caminho.replace("{" + nome + "}", str(valor))
    return caminho


def regex_do_template(template):
    return re.compile(re.sub(r"\\\{[^}]+\\\}", "[^/]+", re.escape(template)))


# ---------------------------------------------------------------- API.md: tabelas de rotas e de códigos
LINHA_ROTA = re.compile(r"^\|\s*`(GET|POST|PATCH|DELETE) (/[^`\s]*)`\s*\|(.*)$", re.M)


def acesso_do_texto(texto):
    texto = texto.strip()
    if texto in ("Pub", "Aut", "G", "L"):
        return texto
    return "Aut" if " ou " in texto else None


def rotas_da_api(api):
    """Só linhas de tabela de rotas: método e caminho entre crases na primeira célula."""
    rotas = {}
    for metodo, caminho, resto in LINHA_ROTA.findall(api):
        celulas = [c.strip() for c in re.split(r"(?<!\\)\|", resto)]
        if celulas and celulas[-1] == "":
            celulas.pop()
        chave = (metodo, re.sub(r":(\w+)", r"{\1}", caminho))
        exigir(chave not in rotas, f"Rota repetida em API.md: {chave}")
        rotas[chave] = celulas
    return rotas


def codigos_da_api(api):
    inicio = api.index("## Códigos de erro")
    fim = api.index("\n## ", inicio + 5)
    tabela = {}
    for status, celula in re.findall(r"^\|\s*(\d{3})\s*\|\s*([^|]+)\|", api[inicio:fim], re.M):
        tabela.setdefault(int(status), set()).update(re.findall(r"`([A-Z_]+)`", celula))
    return tabela


def conferir_api(spec, api, ops):
    rotas = rotas_da_api(api)
    spec_rotas = {(met.upper(), path): o for path, item in spec["paths"].items() for met, o in item.items()}
    exigir(set(rotas) == set(spec_rotas), f"Cobertura API.md divergente; faltam={set(rotas) - set(spec_rotas)}; sobram={set(spec_rotas) - set(rotas)}")
    for chave, celulas in rotas.items():
        o = spec_rotas[chave]
        oid = o["operationId"]
        exigir(len(celulas) in (2, 4), f"Linha de rota com colunas inesperadas em API.md: {chave}")
        acesso = acesso_do_texto(celulas[0])
        exigir(acesso == o["x-acesso"], f"Acesso divergente entre API.md ({celulas[0]!r}) e x-acesso ({o['x-acesso']}): {oid}")
        sucesso = re.match(r"\s*(\d{3})", celulas[2] if len(celulas) == 4 else celulas[1])
        spec_sucesso = [int(s) for s in o["responses"] if int(s) < 300]
        exigir(sucesso and [int(sucesso.group(1))] == spec_sucesso, f"Status de sucesso divergente entre API.md e OpenAPI: {oid}")
        if len(celulas) == 4:
            texto = celulas[3]
            api_status = {int(s) for s in re.findall(r"\b([45]\d\d)\b", texto)} - {500}
            spec_status = {int(s) for s in o["responses"] if int(s) >= 400} - {500}
            exigir(api_status == spec_status, f"Status de erro divergentes entre API.md {sorted(api_status)} e OpenAPI {sorted(spec_status)}: {oid}")
            citados = set(re.findall(r"`([A-Z_]{4,})`", texto))
            declarados = {c for r in o["responses"].values() for c in r.get("x-codigos", [])}
            exigir(citados <= declarados, f"API.md cita código não declarado em {oid}: {sorted(citados - declarados)}")
        # Papéis de rota: 401 e 403 coerentes com o acesso.
        respostas = o["responses"]
        codigos_401 = respostas.get("401", {}).get("x-codigos", [])
        if o["x-acesso"] == "Pub":
            exigir("NAO_AUTENTICADO" not in codigos_401 and "403" not in respostas, f"Rota pública não declara NAO_AUTENTICADO/403: {oid}")
        else:
            exigir("NAO_AUTENTICADO" in codigos_401, f"Rota protegida sem 401 NAO_AUTENTICADO: {oid}")
        if o["x-acesso"] in ("G", "L"):
            exigir(respostas.get("403", {}).get("x-codigos") == ["SEM_PERMISSAO"], f"Rota restrita por papel sem 403 SEM_PERMISSAO: {oid}")
    por_status = {}
    for o in ops.values():
        for status, resposta in o["responses"].items():
            if int(status) >= 400:
                por_status.setdefault(int(status), set()).update(resposta["x-codigos"])
    exigir(codigos_da_api(api) == por_status, f"Tabela de códigos de API.md diverge dos x-codigos do OpenAPI: {codigos_da_api(api)} != {por_status}")
    return rotas


# ---------------------------------------------------------------- OpenAPI
def conferir_spec(spec, api):
    exigir(spec["openapi"] == "3.1.0", "Versão OpenAPI inesperada")
    conferir_refs(spec)
    schemas = spec["components"]["schemas"]
    for schema in schemas.values():
        conferir_keywords(schema)
    for nome, campos in CAMPOS_CRITICOS.items():
        exigir(set(campos) <= set(schemas[nome].get("required", [])), f"Campos críticos fora de required em {nome}: {sorted(set(campos) - set(schemas[nome].get('required', [])))}")
    for nome, limite in BYTES_OBRIGATORIOS.items():
        exigir(schemas[nome]["properties"]["senha"].get("x-max-bytes") == limite, f"{nome}.senha sem x-max-bytes={limite}")
    ops, rotas = {}, set()
    for path, item in spec["paths"].items():
        for method, operation in item.items():
            oid = operation["operationId"]
            exigir(oid not in ops, f"operationId duplicado: {oid}")
            ops[oid] = operation
            rotas.add((method.upper(), path))
            exigir(operation["x-acesso"] in ("Pub", "Aut", "G", "L"), f"Acesso não definido: {oid}")
            exigir(operation["security"] == ([] if operation["x-acesso"] == "Pub" else [{"bearerAuth": []}]), f"Segurança divergente: {oid}")
            params = operation.get("parameters", [])
            exigir(len({(p['in'], p['name']) for p in params}) == len(params), f"Parâmetro duplicado: {oid}")
            exigir(set(re.findall(r"\{([^}]+)\}", path)) == {p['name'] for p in params if p['in'] == 'path' and p.get('required')}, f"Path params divergentes: {oid}")
            for p in params:
                conferir_keywords(p["schema"])
            medias = []
            if "requestBody" in operation:
                medias.append(operation["requestBody"]["content"]["application/json"])
            template = regex_do_template(path)
            for status, response in operation["responses"].items():
                exigir(status.isdigit(), f"Status não suportado {status}")
                if status == "204":
                    exigir("content" not in response, f"204 com content: {oid}")
                    continue
                media = response["content"]["application/json"]
                medias.append(media)
                if int(status) >= 400:
                    codigos = response.get("x-codigos")
                    exigir(codigos and len(set(codigos)) == len(codigos), f"Erro sem códigos por operação (ou repetidos): {oid} {status}")
                    # enum do allOf == x-codigos == chaves de exemplos; ErroNNN já os admite.
                    enum_op = media["schema"]["allOf"][1]["properties"]["erro"]["properties"]["codigo"]["enum"]
                    exigir(enum_op == codigos, f"Enum do schema diverge de x-codigos em {oid} {status}: {enum_op} != {codigos}")
                    base = resolver(spec, media["schema"]["allOf"][0]["$ref"])["properties"]["erro"]["properties"]["codigo"]["enum"]
                    exigir(set(codigos) <= set(base), f"Código fora do enum de Erro{status} em {oid}: {sorted(set(codigos) - set(base))}")
                    exigir(set(media["examples"]) == set(codigos), f"Exemplos de erro não cobrem exatamente x-codigos em {oid} {status}")
                    for nome, exemplo in media["examples"].items():
                        valor = resolver(spec, exemplo["$ref"])["value"] if "$ref" in exemplo else exemplo["value"]
                        exigir(template.fullmatch(valor["caminho"]), f"caminho do exemplo {oid}/{nome} não corresponde à rota {path}: {valor['caminho']}")
                        exigir(valor["erro"]["codigo"] == nome and valor["erro"]["status"] == int(status), f"Exemplo {oid}/{nome} inconsistente com código/status")
            for media in medias:
                conferir_keywords(media["schema"])
                exigir(media.get("examples"), f"Corpo sem exemplo: {oid}")
                for nome, exemplo in media["examples"].items():
                    if "$ref" in exemplo:
                        exemplo = resolver(spec, exemplo["$ref"])
                    exigir("value" in exemplo, f"Exemplo {nome} sem value")
                    validar(exemplo["value"], media["schema"], spec, "exemplo." + nome)
    # cada ErroNNN admite exatamente os códigos usados por alguma operação (sem órfãos)
    uso = {}
    for o in ops.values():
        for status, resposta in o["responses"].items():
            if int(status) >= 400:
                uso.setdefault(status, set()).update(resposta["x-codigos"])
    for status, usados in uso.items():
        enum = schemas[f"Erro{status}"]["properties"]["erro"]["properties"]["codigo"]["enum"]
        exigir(set(enum) == usados and len(enum) == len(usados), f"Erro{status} admite códigos diferentes dos usados pelas operações: {sorted(set(enum) ^ usados)}")
    conferir_api(spec, api, ops)
    return ops


# ---------------------------------------------------------------- mundos
COLECOES = ("setores", "usuarios", "lanternas", "ocorrencias", "eventos", "comentarios")
JANELA = {"critica": dt.timedelta(hours=24), "alta": dt.timedelta(days=3), "media": dt.timedelta(days=7), "baixa": dt.timedelta(days=14)}
ORDEM_GRAV = {"baixa": 0, "media": 1, "alta": 2, "critica": 3}
CAMPOS_FICHA_BASE = ("id", "codinome", "identidadeCivil", "especie", "planetaNatal", "setorId", "status", "anoIngresso", "primeiraAparicao", "habilidades", "mentorId", "citacao", "biografia", "fontes")


def instante(texto):
    return dt.datetime.fromisoformat(texto.replace("Z", "+00:00"))


def aplicar_ajustes(mundo, ajustes):
    """Gramática única de `ajustes` e `efeitos`: {colecao, chave, mesclar|adicionar|remover}."""
    mundo = copy.deepcopy(mundo)
    for a in ajustes or []:
        exigir(a.get("colecao") in COLECOES, f"Coleção desconhecida em ajuste: {a.get('colecao')}")
        exigir(isinstance(a.get("chave"), str), "Ajuste sem chave textual")
        acoes = [k for k in ("mesclar", "adicionar", "remover") if k in a]
        exigir(len(acoes) == 1 and set(a) <= {"colecao", "chave", acoes[0]}, f"Ajuste deve ter exatamente uma ação: {a}")
        colecao, chave = mundo[a["colecao"]], a["chave"]
        if acoes[0] == "mesclar":
            exigir(chave in colecao, f"Ajuste mesclar em entidade inexistente: {a['colecao']}.{chave}")
            exigir(isinstance(a["mesclar"], dict) and "id" not in a["mesclar"], "mesclar exige objeto sem id")
            colecao[chave].update(copy.deepcopy(a["mesclar"]))
        elif acoes[0] == "adicionar":
            exigir(chave not in colecao, f"Ajuste adicionar sobre chave existente: {a['colecao']}.{chave}")
            colecao[chave] = copy.deepcopy(a["adicionar"])
        else:
            exigir(a["remover"] is True and chave in colecao, f"Ajuste remover inválido: {a['colecao']}.{chave}")
            del colecao[chave]
    return mundo


def schema_ficha_base(spec):
    ficha = spec["components"]["schemas"]["LanternaFicha"]
    return {"type": "object", "properties": {k: ficha["properties"][k] for k in CAMPOS_FICHA_BASE}, "required": list(CAMPOS_FICHA_BASE), "additionalProperties": False}


def sem(d, chave):
    return {k: v for k, v in d.items() if k != chave}


def validar_mundo(spec, w, relogio, onde="mundo"):
    S = spec["components"]["schemas"]
    agora = instante(relogio)
    for c in COLECOES:
        exigir(isinstance(w.get(c), dict), f"{onde}: coleção ausente {c}")
    # formato das entidades
    for k, s in w["setores"].items():
        validar(s, S["Setor"], spec, f"{onde}.setores.{k}")
        exigir(k == str(s["id"]), f"{onde}: chave de Setor diverge do id: {k}")
    for k, u in w["usuarios"].items():
        validar(u, S["Usuario"], spec, f"{onde}.usuarios.{k}")
    base = schema_ficha_base(spec)
    for k, f in w["lanternas"].items():
        validar(f, base, spec, f"{onde}.lanternas.{k}")
        exigir(k == f["id"], f"{onde}: chave de Ficha diverge do slug: {k}")
    for k, o in w["ocorrencias"].items():
        exigir("excluidaEm" in o, f"{onde}.ocorrencias.{k}: excluidaEm é obrigatório no mundo (null se ativa)")
        validar(sem(o, "excluidaEm"), S["Ocorrencia"], spec, f"{onde}.ocorrencias.{k}")
        if o["excluidaEm"] is not None:
            validar(o["excluidaEm"], {"type": "string", "format": "date-time"}, spec, f"{onde}.ocorrencias.{k}.excluidaEm")
    por_id_usuario = {u["id"]: u for u in w["usuarios"].values()}
    for k, c in w["comentarios"].items():
        exigir("excluidoEm" in c, f"{onde}.comentarios.{k}: excluidoEm é obrigatório no mundo")
        exigir(c.get("autorId") in por_id_usuario, f"{onde}: autor inexistente no Comentário {k}")
        validar(projetar("comentarios", c, w), S["Comentario"], spec, f"{onde}.comentarios.{k}")
        if c["excluidoEm"] is not None:
            validar(c["excluidoEm"], {"type": "string", "format": "date-time"}, spec, f"{onde}.comentarios.{k}.excluidoEm")
    for k, e in w["eventos"].items():
        exigir(e.get("autorId") in por_id_usuario, f"{onde}: autor inexistente no Evento {k}")
        validar(projetar("eventos", e, w), S["Evento"], spec, f"{onde}.eventos.{k}")
    # unicidade
    for c in ("usuarios", "ocorrencias", "eventos", "comentarios"):
        ids = [e["id"] for e in w[c].values()]
        exigir(len(ids) == len(set(ids)), f"{onde}: ids repetidos em {c}")
    exigir(len({u["email"].lower() for u in w["usuarios"].values()}) == len(w["usuarios"]), f"{onde}: e-mail repetido")
    por_id_ocor = {o["id"]: (k, o) for k, o in w["ocorrencias"].items()}
    setores = {s["id"] for s in w["setores"].values()}
    fichas = w["lanternas"]
    # usuários e vínculos
    vinculos = {}
    for k, u in w["usuarios"].items():
        exigir(u["setorId"] is None or u["setorId"] in setores, f"{onde}: Setor inexistente na conta {k}")
        exigir(u["papel"] != "lanterna" or u["setorId"] is not None, f"{onde}: conta Lanterna sem Setor ({k}) não é estado válido")
        exigir(instante(u["criadoEm"]) <= agora, f"{onde}: conta criada no futuro: {k}")
        if u["lanternaId"] is not None:
            exigir(u["lanternaId"] in fichas, f"{onde}: Ficha inexistente no vínculo de {k}")
            exigir(u["lanternaId"] not in vinculos, f"{onde}: Ficha vinculada a duas contas: {u['lanternaId']}")
            vinculos[u["lanternaId"]] = k
            exigir(u["setorId"] is not None and fichas[u["lanternaId"]]["setorId"] == u["setorId"], f"{onde}: vínculo com Setor diferente em {k}")
    # fichas
    for k, f in fichas.items():
        exigir(f["setorId"] is None or f["setorId"] in setores, f"{onde}: Setor inexistente na Ficha {k}")
        if f["mentorId"] is not None:
            exigir(f["mentorId"] in fichas and f["mentorId"] != k, f"{onde}: mentor inválido em {k}")
            visto, atual = {k}, f["mentorId"]
            while atual is not None:
                exigir(atual not in visto, f"{onde}: ciclo de mentoria em {k}")
                visto.add(atual)
                atual = fichas[atual]["mentorId"]
    # ocorrências
    pendentes = {}
    for k, o in w["ocorrencias"].items():
        exigir(o["setorId"] in setores, f"{onde}: Setor inexistente na Ocorrência {k}")
        exigir(o["criadaPorId"] in por_id_usuario, f"{onde}: criador inexistente na Ocorrência {k}")
        criador = por_id_usuario[o["criadaPorId"]]
        criada = instante(o["criadaEm"])
        exigir(criada <= agora, f"{onde}: Ocorrência criada no futuro: {k}")
        esperado_prazo = (criada + JANELA[o["gravidade"]]).astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        exigir(o["prazoEm"] == esperado_prazo, f"{onde}: prazoEm de {k} deveria ser {esperado_prazo} (criadaEm + janela da Gravidade)")
        exigir(o["vencida"] is (o["status"] != "resolvida" and agora > instante(o["prazoEm"])), f"{onde}: vencida de {k} incoerente com o relógio {relogio}")
        if o["responsavelId"] is not None:
            exigir(o["responsavelId"] in fichas, f"{onde}: Responsável inexistente na Ocorrência {k}")
            exigir(fichas[o["responsavelId"]]["setorId"] == o["setorId"], f"{onde}: Responsável de outro Setor na Ocorrência {k}")
        exigir(o["status"] != "em_andamento" or o["responsavelId"] is not None, f"{onde}: em_andamento sem Responsável ({k})")
        if o["status"] == "resolvida":
            exigir(o["resolucao"] is not None and o["resolvidaEm"] is not None, f"{onde}: resolvida sem resolucao/resolvidaEm ({k})")
            exigir(criada <= instante(o["resolvidaEm"]) <= agora, f"{onde}: resolvidaEm fora do intervalo em {k}")
        else:
            exigir(o["resolucao"] is None and o["resolvidaEm"] is None, f"{onde}: resolução em Ocorrência não resolvida ({k})")
        if o["excluidaEm"] is not None:
            exigir(criada <= instante(o["excluidaEm"]) <= agora, f"{onde}: excluidaEm fora do intervalo em {k}")
        elif o["status"] != "resolvida" and o["responsavelId"] is not None:
            pendentes[o["responsavelId"]] = pendentes.get(o["responsavelId"], 0) + 1
    # status calculado da Ficha (RN-20)
    for k, f in fichas.items():
        n = pendentes.get(k, 0)
        if f["status"] == "em_missao":
            exigir(n > 0, f"{onde}: Ficha {k} em_missao sem Ocorrência pendente")
        else:
            exigir(n == 0, f"{onde}: Ficha {k} {f['status']} é Responsável de {n} Ocorrência(s) pendente(s); deveria estar em_missao")
    # eventos, comentários e linha do tempo
    for k, c in w["comentarios"].items():
        exigir(c["ocorrenciaId"] in por_id_ocor, f"{onde}: Comentário {k} de Ocorrência inexistente")
        o = por_id_ocor[c["ocorrenciaId"]][1]
        u = por_id_usuario[c["autorId"]]
        exigir(instante(o["criadaEm"]) <= instante(c["criadoEm"]) <= agora, f"{onde}: criadoEm do Comentário {k} fora do intervalo")
    apagados = {c["id"]: c for c in w["comentarios"].values() if c["excluidoEm"] is not None}
    eventos_por_ocor = {}
    for k, e in w["eventos"].items():
        exigir(e["ocorrenciaId"] in por_id_ocor, f"{onde}: Evento {k} de Ocorrência inexistente")
        exigir(instante(e["criadoEm"]) <= agora, f"{onde}: Evento {k} no futuro")
        eventos_por_ocor.setdefault(e["ocorrenciaId"], []).append(e)
    eventos_de_comentario = set()
    for oid_, (k, o) in por_id_ocor.items():
        linha = sorted(eventos_por_ocor.get(oid_, []), key=lambda e: (e["criadoEm"], e["id"]))
        exigir(linha and linha[0]["tipo"] == "criada", f"{onde}: linha do tempo de {k} deve começar por criada")
        exigir(linha[0]["autorId"] == o["criadaPorId"], f"{onde}: autor do Evento criada de {k} diverge de criadaPorId")
        exigir(linha[0]["criadoEm"] == o["criadaEm"], f"{onde}: Evento criada de {k} não está em criadaEm")
        status, resp, resolucao, resolvida_em = "aberta", None, None, None
        for e in linha[1:]:
            d, t = e["dados"], e["tipo"]
            exigir(e["criadoEm"] >= o["criadaEm"], f"{onde}: Evento anterior à criação em {k}")
            if t == "criada":
                raise Invalido(f"{onde}: dois Eventos criada em {k}")
            if t == "atribuida":
                exigir(d["de"] == resp and d["de"] != d["para"], f"{onde}: atribuida de {k}: 'de' deve ser o Responsável atual e diferir de 'para'")
                resp = d["para"]
                exigir(status != "resolvida", f"{onde}: atribuição de Ocorrência resolvida em {k}")
            elif t == "status_alterado":
                exigir(status == "aberta" and resp is not None, f"{onde}: status_alterado de {k} exige aberta com Responsável")
                status = "em_andamento"
            elif t == "resolvida":
                exigir(status == "em_andamento", f"{onde}: resolvida de {k} exige em_andamento")
                status, resolucao, resolvida_em = "resolvida", d["resolucao"], e["criadoEm"]
            elif t == "reaberta":
                exigir(status == "resolvida" and d["responsavelAnteriorId"] == resp and d["responsavelId"] in (resp, None), f"{onde}: reaberta de {k} incoerente com o estado anterior")
                status, resp, resolucao, resolvida_em = "aberta", d["responsavelId"], None, None
            elif t == "comentario_apagado":
                c = apagados.get(d["comentarioId"])
                exigir(c is not None and c["ocorrenciaId"] == oid_, f"{onde}: comentario_apagado de {k} sem Comentário excluído correspondente")
                exigir(c["excluidoEm"] == e["criadoEm"], f"{onde}: excluidoEm do Comentário diverge do Evento comentario_apagado em {k}")
                eventos_de_comentario.add(d["comentarioId"])
        exigir(status == o["status"], f"{onde}: linha do tempo de {k} termina em {status}, a Ocorrência está {o['status']}")
        exigir(resp == o["responsavelId"], f"{onde}: linha do tempo de {k} termina com Responsável {resp}, a Ocorrência tem {o['responsavelId']}")
        exigir(resolucao == o["resolucao"] and resolvida_em == o["resolvidaEm"], f"{onde}: resolução/resolvidaEm de {k} divergem da linha do tempo")
    exigir(set(apagados) == eventos_de_comentario, f"{onde}: Comentário excluído sem Evento comentario_apagado (ou o inverso)")


# ---------------------------------------------------------------- cenários
TIPOS = {"sucesso", "pedido_invalido", "rejeicao", "global"}
PRECONDICOES = {"token_ausente", "token_adulterado", "token_expirado", "throttle", "falha_controlada"}
RECURSO_DA_ROTA = {"consultarSetor": "setores", "editarSetor": "setores", "consultarFichaLanterna": "lanternas", "editarLanterna": "lanternas", "alterarStatusLanterna": "lanternas",
                   "consultarOcorrencia": "ocorrencias", "editarOcorrencia": "ocorrencias", "alterarStatusOcorrencia": "ocorrencias", "atribuirResponsavel": "ocorrencias",
                   "alterarPapel": "usuarios", "vincularLanterna": "usuarios"}
ENTIDADE_DA_RESPOSTA = {"cadastrarUsuario": "usuarios", "consultarUsuarioAtual": "usuarios", "alterarPapel": "usuarios", "vincularLanterna": "usuarios", "consultarSetor": "setores",
                        "criarSetor": "setores", "editarSetor": "setores", "consultarFichaLanterna": "lanternas", "criarLanterna": "lanternas", "editarLanterna": "lanternas",
                        "alterarStatusLanterna": "lanternas", "consultarOcorrencia": "ocorrencias", "criarOcorrencia": "ocorrencias", "editarOcorrencia": "ocorrencias",
                        "alterarStatusOcorrencia": "ocorrencias", "atribuirResponsavel": "ocorrencias", "criarComentario": "comentarios"}
CRIACOES = {"cadastrarUsuario", "criarSetor", "criarLanterna", "criarOcorrencia", "criarComentario"}
LISTAS = {"listarUsuarios", "listarLanternas", "listarOcorrencias", "listarMinhaFila", "listarEventos", "listarComentarios"}
SENHA_PADRAO = "SomenteTeste123!"


def autor_resumo(w, autor_id):
    u = next(u for u in w["usuarios"].values() if u["id"] == autor_id)
    return {"id": u["id"], "nome": u["nome"], "papel": u["papel"]}


def projetar(colecao, entidade, w=None):
    """Forma da API a partir do estado do mundo. `autor` (Evento/Comentário) é sempre derivado da conta atual."""
    if colecao == "ocorrencias":
        return sem(entidade, "excluidaEm")
    if colecao == "comentarios":
        return {**sem(entidade, "excluidoEm"), "autor": autor_resumo(w, entidade["autorId"])}
    if colecao == "eventos":
        return {**entidade, "autor": autor_resumo(w, entidade["autorId"])}
    if colecao == "lanternas":
        return {k: entidade[k] for k in CAMPOS_FICHA_BASE}
    return entidade


def contexto(w, s, ops):
    """Atalhos de consulta sobre o mundo inicial do cenário, usados pelas pré-condições."""
    req = s.get("request", {})
    c = type("Ctx", (), {})()
    c.w, c.s, c.req = w, s, req
    c.path, c.body, c.query = req.get("path", {}), req.get("body", {}), req.get("query", {})
    c.ator = w["usuarios"].get(s["ator"]) if s["ator"] != "Pub" else None
    c.usuario = lambda id_: next((u for u in w["usuarios"].values() if u["id"] == id_), None)
    c.ocor = lambda id_: next((o for o in w["ocorrencias"].values() if o["id"] == id_), None)
    c.comentario = lambda id_: next((x for x in w["comentarios"].values() if x["id"] == id_), None)
    c.ficha = lambda id_: w["lanternas"].get(id_)
    c.setor_existe = lambda id_: str(id_) in w["setores"]
    c.visivel = lambda o: o is not None and o["excluidaEm"] is None and (c.ator is None or c.ator["papel"] == "guardiao" or o["setorId"] == c.ator["setorId"])
    c.guardioes = lambda: [u for u in w["usuarios"].values() if u["papel"] == "guardiao"]
    return c


def _mentor_ciclo(c, ficha_id, mentor):
    atual, visto = mentor, set()
    while atual is not None and atual in c.w["lanternas"] and atual not in visto:
        if atual == ficha_id:
            return True
        visto.add(atual)
        atual = c.w["lanternas"][atual]["mentorId"]
    return False


def _alvo_papel(c):
    return c.usuario(c.path.get("id"))


def _transicao_invalida(c):
    o = c.ocor(c.path["id"])
    novo, atual = c.body["status"], o["status"]
    validas = {("aberta", "em_andamento"), ("em_andamento", "resolvida"), ("resolvida", "aberta")}
    return c.visivel(o) and (atual, novo) not in validas


def _ficha_setor_diferente_vincular(c):
    alvo, ficha = _alvo_papel(c), c.ficha(c.body.get("lanternaId"))
    return alvo is not None and ficha is not None and alvo["papel"] == "lanterna" and (alvo["setorId"] is None or ficha["setorId"] is None or alvo["setorId"] != ficha["setorId"])


def _setor_efetivo_papel(c):
    alvo = _alvo_papel(c)
    return alvo, c.body.get("setorId", alvo["setorId"] if alvo else None)


def _ultimo_guardiao(c, alvo):
    return alvo["papel"] == "guardiao" and len(c.guardioes()) == 1


# (operationId, codigo) -> predicado: o estado inicial + request permitem a falha declarada.
ESTADO_PERMITE = {
    ("cadastrarUsuario", "NAO_ENCONTRADO"): lambda c: not c.setor_existe(c.body["setorId"]),
    ("cadastrarUsuario", "EMAIL_JA_CADASTRADO"): lambda c: any(u["email"].lower() == c.body["email"].lower() for u in c.w["usuarios"].values()),
    ("entrar", "CREDENCIAIS_INVALIDAS"): lambda c: not any(u["email"].lower() == c.body["email"].lower() for u in c.w["usuarios"].values()) or c.body["senha"] != SENHA_PADRAO,
    ("alterarPapel", "NAO_ENCONTRADO"): lambda c: _alvo_papel(c) is None or (c.body.get("setorId") is not None and not c.setor_existe(c.body["setorId"])),
    ("alterarPapel", "ULTIMO_GUARDIAO"): lambda c: _alvo_papel(c) is not None and _ultimo_guardiao(c, _alvo_papel(c)) and c.body["papel"] == "lanterna",
    ("alterarPapel", "SETOR_OBRIGATORIO"): lambda c: _alvo_papel(c) is not None and c.body["papel"] == "lanterna" and "setorId" not in c.body and _alvo_papel(c)["setorId"] is None and not _ultimo_guardiao(c, _alvo_papel(c)),
    ("alterarPapel", "SETOR_DIFERENTE"): lambda c: (_alvo_papel(c) is not None and c.body["papel"] == "lanterna" and not _ultimo_guardiao(c, _alvo_papel(c)) and _alvo_papel(c)["lanternaId"] is not None
                                                  and _setor_efetivo_papel(c)[1] is not None and c.ficha(_alvo_papel(c)["lanternaId"])["setorId"] != _setor_efetivo_papel(c)[1] and c.setor_existe(_setor_efetivo_papel(c)[1])),
    ("vincularLanterna", "NAO_ENCONTRADO"): lambda c: _alvo_papel(c) is None or (c.body["lanternaId"] is not None and c.ficha(c.body["lanternaId"]) is None),
    ("vincularLanterna", "VINCULO_NAO_PERMITIDO"): lambda c: _alvo_papel(c) is not None and _alvo_papel(c)["papel"] == "guardiao" and c.ficha(c.body["lanternaId"]) is not None,
    ("vincularLanterna", "SETOR_DIFERENTE"): _ficha_setor_diferente_vincular,
    ("vincularLanterna", "LANTERNA_JA_VINCULADA"): lambda c: (_alvo_papel(c) is not None and not _ficha_setor_diferente_vincular(c) and _alvo_papel(c)["papel"] == "lanterna" and c.ficha(c.body["lanternaId"]) is not None
                                                            and any(u["lanternaId"] == c.body["lanternaId"] and u["id"] != _alvo_papel(c)["id"] for u in c.w["usuarios"].values())),
    ("consultarSetor", "NAO_ENCONTRADO"): lambda c: not c.setor_existe(c.path["id"]),
    ("editarSetor", "NAO_ENCONTRADO"): lambda c: not c.setor_existe(c.path["id"]),
    ("excluirSetor", "NAO_ENCONTRADO"): lambda c: not c.setor_existe(c.path["id"]),
    ("criarSetor", "SETOR_JA_CADASTRADO"): lambda c: c.setor_existe(c.body["id"]),
    ("excluirSetor", "SETOR_EM_USO"): lambda c: c.setor_existe(c.path["id"]) and (any(u["setorId"] == c.path["id"] for u in c.w["usuarios"].values()) or any(f["setorId"] == c.path["id"] for f in c.w["lanternas"].values())
                                                                                  or any(o["setorId"] == c.path["id"] for o in c.w["ocorrencias"].values())),
    ("criarLanterna", "NAO_ENCONTRADO"): lambda c: c.body.get("setorId") is not None and not c.setor_existe(c.body["setorId"]),
    ("criarLanterna", "LANTERNA_JA_CADASTRADA"): lambda c: c.ficha(c.body["id"]) is not None,
    ("criarLanterna", "MENTOR_INVALIDO"): lambda c: c.body.get("mentorId") is not None and c.ficha(c.body["mentorId"]) is None,
    ("consultarFichaLanterna", "NAO_ENCONTRADO"): lambda c: c.ficha(c.path["id"]) is None,
    ("editarLanterna", "NAO_ENCONTRADO"): lambda c: c.ficha(c.path["id"]) is None or (c.body.get("setorId") is not None and not c.setor_existe(c.body["setorId"])),
    ("editarLanterna", "MENTOR_INVALIDO"): lambda c: c.ficha(c.path["id"]) is not None and c.body.get("mentorId") is not None and (
        c.body["mentorId"] == c.path["id"] or c.ficha(c.body["mentorId"]) is None or _mentor_ciclo(c, c.path["id"], c.body["mentorId"])),
    ("editarLanterna", "LANTERNA_EM_USO"): lambda c: (c.ficha(c.path["id"]) is not None and "setorId" in c.body and c.body["setorId"] != c.ficha(c.path["id"])["setorId"]
                                                    and (any(u["lanternaId"] == c.path["id"] and u["setorId"] != c.body["setorId"] for u in c.w["usuarios"].values())
                                                         or any(o["responsavelId"] == c.path["id"] and o["setorId"] != c.body["setorId"] for o in c.w["ocorrencias"].values()))),
    ("alterarStatusLanterna", "NAO_ENCONTRADO"): lambda c: c.ficha(c.path["id"]) is None,
    ("alterarStatusLanterna", "LANTERNA_EM_MISSAO"): lambda c: c.ficha(c.path["id"]) is not None and c.ficha(c.path["id"])["status"] == "em_missao",
    ("criarOcorrencia", "NAO_ENCONTRADO"): lambda c: c.ator["papel"] == "guardiao" and not c.setor_existe(c.body["setorId"]),
    ("listarMinhaFila", "CONTA_SEM_LANTERNA"): lambda c: c.ator["papel"] == "lanterna" and c.ator["lanternaId"] is None,
    ("listarMinhaFila", "SEM_PERMISSAO"): lambda c: c.ator["papel"] == "guardiao",
    ("editarOcorrencia", "SEM_PERMISSAO"): lambda c: (c.ator["papel"] == "lanterna" and c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["criadaPorId"] != c.ator["id"]),
    ("editarOcorrencia", "OCORRENCIA_RESOLVIDA"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] == "resolvida"
                                                            and (c.ator["papel"] == "guardiao" or c.ocor(c.path["id"])["criadaPorId"] == c.ator["id"])),
    ("alterarStatusOcorrencia", "SEM_PERMISSAO"): lambda c: (c.ator["papel"] == "lanterna" and c.visivel(c.ocor(c.path["id"])) and c.body["status"] == "aberta" and c.ocor(c.path["id"])["status"] == "resolvida"),
    ("alterarStatusOcorrencia", "TRANSICAO_INVALIDA"): _transicao_invalida,
    ("alterarStatusOcorrencia", "SEM_RESPONSAVEL"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] == "aberta" and c.ocor(c.path["id"])["responsavelId"] is None
                                                             and c.body["status"] == "em_andamento"),
    ("alterarStatusOcorrencia", "RESOLUCAO_OBRIGATORIA"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] == "em_andamento" and c.body["status"] == "resolvida"
                                                                   and len(str(c.body.get("resolucao") or "").strip()) < 10),
    ("alterarStatusOcorrencia", "MOTIVO_OBRIGATORIO"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ator["papel"] == "guardiao" and c.ocor(c.path["id"])["status"] == "resolvida"
                                                                 and c.body["status"] == "aberta" and len(str(c.body.get("motivo") or "").strip()) < 10),
    ("atribuirResponsavel", "NAO_ENCONTRADO"): lambda c: c.ocor(c.path["id"]) is None or c.ocor(c.path["id"])["excluidaEm"] is not None or (
        c.body["responsavelId"] is not None and c.ficha(c.body["responsavelId"]) is None),
    ("atribuirResponsavel", "OCORRENCIA_RESOLVIDA"): lambda c: c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] == "resolvida",
    ("atribuirResponsavel", "SEM_RESPONSAVEL"): lambda c: c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] == "em_andamento" and c.body["responsavelId"] is None,
    ("atribuirResponsavel", "RESPONSAVEL_DE_OUTRO_SETOR"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] != "resolvida" and c.body["responsavelId"] is not None
                                                                     and c.ficha(c.body["responsavelId"]) is not None
                                                                     and c.ficha(c.body["responsavelId"])["setorId"] != c.ocor(c.path["id"])["setorId"]),
    ("atribuirResponsavel", "LANTERNA_AFASTADO"): lambda c: (c.visivel(c.ocor(c.path["id"])) and c.ocor(c.path["id"])["status"] != "resolvida" and c.body["responsavelId"] is not None
                                                            and c.ficha(c.body["responsavelId"]) is not None and c.ficha(c.body["responsavelId"])["status"] == "afastado"
                                                            and c.ficha(c.body["responsavelId"])["setorId"] == c.ocor(c.path["id"])["setorId"]),
    ("excluirComentario", "SEM_PERMISSAO"): lambda c: (c.comentario(c.path["id"]) is not None and c.comentario(c.path["id"])["excluidoEm"] is None and c.ator["papel"] == "lanterna"
                                                      and c.comentario(c.path["id"])["autorId"] != c.ator["id"]
                                                      and c.visivel(c.ocor(c.comentario(c.path["id"])["ocorrenciaId"]))),
    ("excluirComentario", "NAO_ENCONTRADO"): lambda c: (c.comentario(c.path["id"]) is None or c.comentario(c.path["id"])["excluidoEm"] is not None
                                                       or not c.visivel(c.ocor(c.comentario(c.path["id"])["ocorrenciaId"]))),
}
for _op in ("consultarOcorrencia", "editarOcorrencia", "alterarStatusOcorrencia", "listarEventos", "listarComentarios", "criarComentario"):
    ESTADO_PERMITE[(_op, "NAO_ENCONTRADO")] = lambda c: not c.visivel(c.ocor(c.path["id"]))
ESTADO_PERMITE[("excluirOcorrencia", "NAO_ENCONTRADO")] = lambda c: c.ocor(c.path["id"]) is None or c.ocor(c.path["id"])["excluidaEm"] is not None

# Cenários "as duas condições são verdadeiras": provam a precedência declarada.
PRECEDENCIA_AMBAS = {
    "editarOcorrencia.404.NAO_ENCONTRADO.outro-setor-antes-da-autoria": lambda c: c.ocor(c.path["id"]) is not None and c.ocor(c.path["id"])["criadaPorId"] != c.ator["id"] and c.ocor(c.path["id"])["setorId"] != c.ator["setorId"],
    "editarOcorrencia.403.SEM_PERMISSAO.resolvida-precede-409": lambda c: c.ocor(c.path["id"])["status"] == "resolvida" and c.ocor(c.path["id"])["criadaPorId"] != c.ator["id"] and c.ocor(c.path["id"])["setorId"] == c.ator["setorId"],
    "atribuirResponsavel.409.OCORRENCIA_RESOLVIDA.precede-ficha": lambda c: c.ocor(c.path["id"])["status"] == "resolvida" and c.ficha(c.body["responsavelId"])["setorId"] != c.ocor(c.path["id"])["setorId"],
    "atribuirResponsavel.422.RESPONSAVEL_DE_OUTRO_SETOR.precede-afastado": lambda c: c.ficha(c.body["responsavelId"])["status"] == "afastado" and c.ficha(c.body["responsavelId"])["setorId"] != c.ocor(c.path["id"])["setorId"],
    "vincularLanterna.422.SETOR_DIFERENTE.precede-ja-vinculada": lambda c: any(u["lanternaId"] == c.body["lanternaId"] for u in c.w["usuarios"].values()) and c.ficha(c.body["lanternaId"])["setorId"] != _alvo_papel(c)["setorId"],
    "vincularLanterna.422.VINCULO_NAO_PERMITIDO.precede-setor": lambda c: _alvo_papel(c)["papel"] == "guardiao" and c.ficha(c.body["lanternaId"])["setorId"] is None,
    "vincularLanterna.404.NAO_ENCONTRADO.ficha-inexistente-precede-guardiao": lambda c: _alvo_papel(c)["papel"] == "guardiao" and c.ficha(c.body["lanternaId"]) is None,
    "alterarPapel.409.ULTIMO_GUARDIAO.precede-setor": lambda c: _ultimo_guardiao(c, _alvo_papel(c)) and _alvo_papel(c)["setorId"] is None and "setorId" not in c.body,
    "listarMinhaFila.403.SEM_PERMISSAO.guardiao-promovido-com-vinculo": lambda c: c.ator["papel"] == "guardiao" and c.ator["lanternaId"] is not None,
}


def conferir_atores(s, op, acesso, status, codigo, usuarios):
    ator, pre = s["ator"], s.get("precondicao", {}).get("tipo")
    if acesso == "Pub":
        return
    if status == 401 and codigo == "NAO_AUTENTICADO":
        exigir(ator == "Pub", f"{s['id']}: 401 NAO_AUTENTICADO exige ator Pub (sem credencial utilizável)")
        return
    exigir(ator != "Pub", f"{s['id']}: operação protegida ({acesso}) com ator sem credencial fora de um 401")
    papel = usuarios[ator]["papel"]
    if acesso == "G":
        esperado = "lanterna" if status == 403 else "guardiao"
    elif acesso == "L":
        esperado = "guardiao" if status == 403 else "lanterna"
    else:
        return
    exigir(papel == esperado, f"{s['id']}: ator {ator} ({papel}) não serve para status {status} em operação {acesso}: a esteira exige papel {esperado}")


def conferir_lista(op, s, resposta, w, rel, ctx_ops):
    dados = resposta["corpo"]["dados"]
    meta, itens = dados["meta"], dados["itens"]
    query = s["request"].get("query", {})
    pagina, limite = query.get("pagina", 1), query.get("limite", 20)
    exigir(meta["pagina"] == pagina and meta["limite"] == limite, f"{s['id']}: meta.pagina/limite diferem do pedido")
    exigir(meta["paginas"] == (math.ceil(meta["total"] / limite) if meta["total"] else 0), f"{s['id']}: meta.paginas inconsistente com total/limite")
    esperados = max(0, min(limite, meta["total"] - (pagina - 1) * limite))
    exigir(len(itens) == esperados, f"{s['id']}: {len(itens)} itens, esperados {esperados} (página além do fim devolve lista vazia)")
    busca = query.get("busca", "")
    ator = w["usuarios"].get(s["ator"])
    if op == "listarUsuarios":
        por_id = {u["id"]: u for u in w["usuarios"].values()}
        for it in itens:
            exigir(por_id.get(it["id"]) == it, f"{s['id']}: item da lista não corresponde a uma conta do mundo")
            exigir(casa_busca(it["nome"], busca) or casa_busca(it["email"], busca), f"{s['id']}: item não casa a busca {busca!r} (nome ou email)")
        elegiveis = [u for u in w["usuarios"].values() if casa_busca(u["nome"], busca) or casa_busca(u["email"], busca)]
        exigir(meta["total"] == len(elegiveis), f"{s['id']}: total {meta['total']} ≠ {len(elegiveis)} contas que casam a busca")
        campo = query.get("ordenar", "nome")
        chave = (lambda u: (normalizar_busca(u["nome"]), u["id"])) if campo == "nome" else (lambda u: (u["criadoEm"], u["id"]))
        ordenadas = sorted(elegiveis, key=lambda u: u["id"])
        ordenadas = sorted(ordenadas, key=lambda u: chave(u)[0], reverse=query.get("ordem", "asc") == "desc")
        ini = (pagina - 1) * limite
        exigir([i["id"] for i in itens] == [u["id"] for u in ordenadas[ini:ini + limite]], f"{s['id']}: página fora da ordem pedida (campo normalizado, desempate por id)")
    elif op == "listarLanternas":
        for it in itens:
            f = w["lanternas"].get(it["id"])
            exigir(f is not None and all(f[k] == it[k] for k in it), f"{s['id']}: item da lista não corresponde à Ficha do mundo")
            exigir(casa_busca(it["codinome"], busca), f"{s['id']}: item não casa a busca {busca!r} (codinome)")
    elif op == "listarOcorrencias":
        por_id = {o["id"]: o for o in w["ocorrencias"].values()}
        for it in itens:
            o = por_id.get(it["id"])
            exigir(o is not None and o["excluidaEm"] is None and projetar("ocorrencias", o) == it, f"{s['id']}: item da lista não corresponde a Ocorrência ativa do mundo")
            exigir(ator["papel"] == "guardiao" or o["setorId"] == ator["setorId"], f"{s['id']}: Lanterna recebeu Ocorrência de outro Setor")
            exigir(casa_busca(it["titulo"], busca), f"{s['id']}: item não casa a busca {busca!r} (título)")
    elif op == "listarMinhaFila":
        elegiveis = [o for o in w["ocorrencias"].values() if o["excluidaEm"] is None and o["status"] != "resolvida" and ator["lanternaId"] is not None and o["responsavelId"] == ator["lanternaId"]]
        chave = lambda o: (o["prazoEm"], -ORDEM_GRAV[o["gravidade"]], o["id"])
        esperado_total = sorted(elegiveis, key=chave)
        exigir(meta["total"] == len(esperado_total), f"{s['id']}: total da fila {meta['total']} ≠ {len(esperado_total)} pendentes atribuídas")
        ini = (pagina - 1) * limite
        exigir([i["id"] for i in itens] == [o["id"] for o in esperado_total[ini:ini + limite]], f"{s['id']}: fila fora da ordem prazo asc, Gravidade crítica→baixa, id asc (ou com itens indevidos)")
    elif op == "listarEventos":
        oc = next(o for o in w["ocorrencias"].values() if o["id"] == s["request"]["path"]["id"])
        esperado = [projetar("eventos", e, w) for e in sorted((e for e in w["eventos"].values() if e["ocorrenciaId"] == oc["id"]), key=lambda e: (e["criadoEm"], e["id"]))]
        exigir(meta["total"] == len(esperado) and itens == esperado[(pagina - 1) * limite:pagina * limite], f"{s['id']}: eventos diferem da linha do tempo do mundo")
    elif op == "listarComentarios":
        oc = next(o for o in w["ocorrencias"].values() if o["id"] == s["request"]["path"]["id"])
        esperado = sorted((projetar("comentarios", x, w) for x in w["comentarios"].values() if x["ocorrenciaId"] == oc["id"] and x["excluidoEm"] is None), key=lambda x: (x["criadoEm"], x["id"]))
        exigir(meta["total"] == len(esperado) and itens == esperado[(pagina - 1) * limite:pagina * limite], f"{s['id']}: comentários diferem dos não excluídos do mundo")


def conferir_sucesso(op, s, o, spec, w0, wf, rel):
    esperado = s["esperado"]
    status = esperado["status"]
    exigir(str(status) in o["responses"] and status < 300, f"{s['id']}: status de sucesso {status} não declarado")
    declarado = o["responses"][str(status)]
    if status == 204:
        exigir("corpo" not in esperado, f"{s['id']}: 204 sem corpo")
        return
    exigir("corpo" in esperado, f"{s['id']}: sucesso sem corpo")
    validar(esperado["corpo"], declarado["content"]["application/json"]["schema"], spec, f"{s['id']}.esperado.corpo")
    dados = esperado["corpo"]["dados"]
    req = s["request"]
    if op in LISTAS:
        conferir_lista(op, s, esperado, w0, rel, None)
        return
    if op in RECURSO_DA_ROTA:
        exigir(isinstance(dados, dict) and dados["id"] == req["path"]["id"], f"{s['id']}: id da resposta ({dados.get('id')!r}) diferente do id do path ({req['path']['id']!r})")
    colecao = ENTIDADE_DA_RESPOSTA.get(op)
    if colecao:
        alvo = next((e for e in wf[colecao].values() if e["id"] == dados["id"]), None)
        exigir(alvo is not None, f"{s['id']}: a entidade da resposta ({dados['id']!r}) não existe no mundo final")
        exigir(projetar(colecao, alvo, wf) == (projetar(colecao, dados) if colecao == "lanternas" else dados), f"{s['id']}: resposta diverge da entidade do mundo final")
    if op == "entrar":
        usuario = next((u for u in w0["usuarios"].values() if u["email"].lower() == s["request"]["body"]["email"].lower()), None)
        exigir(usuario == dados["usuario"], f"{s['id']}: usuario do login diverge da conta do mundo")
        exigir(dados["token"] == "<JWT_FICTICIO_NAO_UTILIZAVEL>" and dados["expiresIn"] == 28800, f"{s['id']}: token deve ser o marcador fictício e expiresIn 28800")
    if op == "consultarUsuarioAtual":
        exigir(w0["usuarios"][s["ator"]] == dados, f"{s['id']}: /auth/me diverge da conta do ator")


def validar_cenarios(spec, cen, ops):
    exigir(cen["versaoContrato"] == spec["info"]["version"], "Versão divergente das fixtures")
    relogio_base = cen["relogioReferencia"]
    validar(relogio_base, {"type": "string", "format": "date-time"}, spec, "relogioReferencia")
    exigir(set(cen["mundos"]) >= {"base"}, "Mundo base ausente")
    mundos = {}
    for nome, mundo in cen["mundos"].items():
        w = {c: mundo[c] for c in COLECOES}
        validar_mundo(spec, w, relogio_base, f"mundos.{nome}")
        mundos[nome] = w
    rotas = [(met.upper(), regex_do_template(path), path) for path, item in spec["paths"].items() for met in item]
    vistos, cobertura = set(), set()
    ops_com_sucesso = set()
    for s in cen["cenarios"]:
        exigir(s.get("id") and s["id"] not in vistos, f"Cenário sem id ou repetido: {s.get('id')}")
        vistos.add(s["id"])
        for chave in ("tipo", "descricao", "ator", "mundo", "request", "esperado"):
            exigir(chave in s, f"{s['id']}: falta {chave}")
        exigir(s["tipo"] in TIPOS, f"{s['id']}: tipo desconhecido")
        exigir(s["mundo"] in mundos, f"{s['id']}: mundo desconhecido")
        rel = s.get("relogio", relogio_base)
        w0 = aplicar_ajustes(mundos[s["mundo"]], s.get("ajustes"))
        if s.get("ajustes") or "relogio" in s:
            validar_mundo(spec, w0, rel, s["id"] + ".estadoInicial")
        exigir(s["ator"] == "Pub" or s["ator"] in w0["usuarios"], f"{s['id']}: ator desconhecido {s['ator']}")
        esperado = s["esperado"]
        status = esperado["status"]
        pre = s.get("precondicao")
        if pre is not None:
            exigir(pre.get("tipo") in PRECONDICOES, f"{s['id']}: precondicao desconhecida")
        # --- cenário global (rota/método sem operação)
        if s["tipo"] == "global":
            exigir(s["operationId"] is None and set(s["request"]) == {"metodo", "caminho"}, f"{s['id']}: global exige operationId null e request {{metodo, caminho}}")
            for met, rx, path in rotas:
                exigir(not (met == s["request"]["metodo"] and rx.fullmatch(s["request"]["caminho"])), f"{s['id']}: a rota existe ({path}); não é rota desconhecida")
            exigir(status == 404 and esperado["codigo"] == "NAO_ENCONTRADO" and esperado["caminho"] == s["request"]["caminho"], f"{s['id']}: rota desconhecida é 404 NAO_ENCONTRADO com o caminho pedido")
            validar(corpo_de_erro(404, "NAO_ENCONTRADO", esperado["caminho"], rel), spec["components"]["schemas"]["Erro404"], spec, s["id"])
            cobertura.add(("global", 404, "NAO_ENCONTRADO"))
            continue
        op = s["operationId"]
        exigir(op in ops, f"{s['id']}: operationId desconhecido {op}")
        o = ops[op]
        acesso = o["x-acesso"]
        codigo = esperado.get("codigo")
        # --- tipo × status
        exigir((s["tipo"] == "sucesso") == (status < 300), f"{s['id']}: tipo {s['tipo']} incompatível com o status {status}")
        exigir((s["tipo"] == "pedido_invalido") == (status == 400), f"{s['id']}: pedido_invalido é exatamente o status 400")
        schema_da_resposta(o, status)
        if status >= 400:
            exigir(codigo in o["responses"][str(status)]["x-codigos"], f"{s['id']}: código {codigo} não declarado para {op} {status}")
        conferir_atores(s, op, acesso, status, codigo, w0["usuarios"])
        # --- precondições que não são só dados
        exigir((status == 401 and codigo == "NAO_AUTENTICADO") == (pre is not None and pre["tipo"].startswith("token_")), f"{s['id']}: 401 NAO_AUTENTICADO exige precondicao token_* (e só ele)")
        exigir((status == 429) == (pre is not None and pre["tipo"] == "throttle"), f"{s['id']}: 429 exige precondicao throttle (e só ele)")
        exigir((status == 500) == (pre is not None and pre["tipo"] == "falha_controlada"), f"{s['id']}: 500 exige precondicao falha_controlada (e só ele)")
        if pre and pre["tipo"] == "throttle":
            exigir(pre.get("tentativasAnteriores") and pre.get("janela"), f"{s['id']}: throttle declara tentativasAnteriores e janela")
        if pre and pre["tipo"] == "falha_controlada":
            exigir(pre.get("ponto"), f"{s['id']}: falha_controlada declara o ponto da falha")
        # --- request × tipo
        precedencia = s.get("precedencia")
        valido = True
        try:
            conferir_request(s["request"], o, spec)
        except Invalido as erro:
            valido, motivo = False, str(erro)
        if s["tipo"] == "pedido_invalido":
            por = s.get("invalidoPor", "schema")
            exigir(por in ("schema", "papel", "destino"), f"{s['id']}: invalidoPor desconhecido")
            if por == "schema":
                exigir(not valido, f"{s['id']}: marcado como pedido inválido, mas o request VALIDA no OpenAPI (fixture positiva disfarçada)")
            else:
                exigir(valido, f"{s['id']}: invalidoPor={por} exige request válido no schema (a regra do {por} é quem recusa)")
            detalhes = esperado.get("detalhes")
            exigir(isinstance(detalhes, list) and detalhes and all(isinstance(d.get("campo"), str) and d["campo"] for d in detalhes), f"{s['id']}: 400 declara detalhes[].campo")
            if por == "schema":
                exigir("variante" in motivo or any(d["campo"] == "corpo" or d["campo"] in motivo for d in detalhes), f"{s['id']}: campo dos detalhes ({[d['campo'] for d in detalhes]}) não aparece na violação: {motivo}")
        elif precedencia is not None:
            exigir((precedencia, status) in (("autenticacao>formato", 401), ("papel>formato", 403)), f"{s['id']}: precedencia {precedencia} incompatível com o status {status}")
            exigir(not valido, f"{s['id']}: cenário de precedência precisa de request inválido para provar a ordem")
        else:
            exigir(valido, f"{s['id']}: request deveria ser válido (esteira: o 4xx/5xx esperado não é de formato) — {'' if valido else motivo}")
        # --- caminho, corpo e resposta esperada
        if status >= 300:
            caminho = caminho_de(next(p for p, item in spec["paths"].items() if any(x["operationId"] == op for x in item.values())), s["request"])
            exigir(esperado["caminho"] == caminho, f"{s['id']}: caminho do erro {esperado['caminho']!r} ≠ rota do pedido {caminho!r}")
            exigir(set(esperado) <= {"status", "codigo", "caminho", "detalhes"}, f"{s['id']}: esperado de erro com chaves desconhecidas")
            validar(corpo_de_erro(status, codigo, esperado["caminho"], rel, esperado.get("detalhes")), resolver(spec, f"#/components/schemas/Erro{status}"), spec, s["id"])
            exigir("efeitos" not in s, f"{s['id']}: rejeição não tem efeitos (nenhuma mudança, nenhum Evento)")
            wf = w0
        else:
            wf = aplicar_ajustes(w0, s.get("efeitos"))
            if o["x-acesso"] != "Pub" or op == "entrar":
                pass
            metodo = next(m for path, item in spec["paths"].items() for m, x in item.items() if x["operationId"] == op).upper()
            if metodo != "GET" and op != "entrar":
                exigir("efeitos" in s, f"{s['id']}: sucesso de escrita declara efeitos")
                exigir(bool(s["efeitos"]) or s.get("semMudanca") is True, f"{s['id']}: efeitos vazios exigem semMudanca=true")
                if op in CRIACOES:
                    novos = [a for a in s["efeitos"] if "adicionar" in a]
                    exigir(novos, f"{s['id']}: criação deve adicionar a entidade criada")
            else:
                exigir("efeitos" not in s, f"{s['id']}: leitura não tem efeitos")
            if wf is not w0 and s.get("efeitos"):
                validar_mundo(spec, wf, rel, s["id"] + ".estadoFinal")
            conferir_sucesso(op, s, o, spec, w0, wf, rel)
            ops_com_sucesso.add(op)
        # --- o estado inicial permite a falha declarada
        if status >= 400 and not (status in (401, 429, 500) and codigo in ("NAO_AUTENTICADO", "MUITAS_TENTATIVAS", "ERRO_INTERNO")) and s["tipo"] != "pedido_invalido" and precedencia is None:
            regra = ESTADO_PERMITE.get((op, codigo))
            if status == 403 and acesso == "G":
                regra = regra or (lambda c: True)  # papel da rota: já provado por conferir_atores
            exigir(regra is not None, f"{s['id']}: sem regra de pré-condição para ({op}, {codigo}); atualizar o validador antes de aceitar")
            exigir(regra(contexto(w0, s, ops)), f"{s['id']}: o estado inicial/request NÃO permite {status} {codigo} em {op}")
        if s["id"] in PRECEDENCIA_AMBAS:
            exigir(PRECEDENCIA_AMBAS[s["id"]](contexto(w0, s, ops)), f"{s['id']}: cenário de precedência não tem as duas condições verdadeiras")
        cobertura.add((op, status, codigo))
    # --- cobertura por operação × código
    for oid, o in ops.items():
        exigir(oid in ops_com_sucesso, f"Operação sem cenário de sucesso: {oid}")
        for status, resposta in o["responses"].items():
            for codigo in resposta.get("x-codigos", []):
                exigir((oid, int(status), codigo) in cobertura, f"Par operação×código sem cenário: {oid} {status} {codigo}")
    exigir(("global", 404, "NAO_ENCONTRADO") in cobertura, "Sem cenário de rota desconhecida (404 NAO_ENCONTRADO)")
    for chave in cobertura:
        if chave[0] != "global":
            exigir(chave in {(oid, int(st), c) for oid, o in ops.items() for st, r in o["responses"].items() for c in r.get("x-codigos", [])} or chave[1] < 300 or chave[2] is None,
                   f"Cenário para par não declarado: {chave}")
    return len(cen["cenarios"])


def verificar(spec, cen, api):
    ops = conferir_spec(spec, api)
    total = validar_cenarios(spec, cen, ops)
    return len(ops), total


# ---------------------------------------------------------------- hash do pacote (gate de versão)
ARQUIVOS_DO_PACOTE = ("contratos/openapi.json", "contratos/exemplos/cenarios.json", "contratos/validar.py", "contratos/test_validar.py", "contratos/README.md", "backend/API.md", "backend/DTOS.md", "backend/REGRAS-DE-NEGOCIO.md",
                      "backend/ESCOPO.md", "backend/MODELO-DE-DADOS.md", "backend/SEED.md", "backend/CENARIOS-DE-TESTE.md")


def hash_do_pacote(docs):
    """SHA-256 por arquivo e do conjunto, com fim de linha normalizado para LF (a checkout usa CRLF)."""
    partes = {}
    for rel in ARQUIVOS_DO_PACOTE:
        dados = (docs / rel).read_bytes().replace(b"\r\n", b"\n")
        partes[rel] = hashlib.sha256(dados).hexdigest()
    conjunto = hashlib.sha256("\n".join(f"{h}  {rel}" for rel, h in sorted(partes.items())).encode("utf-8")).hexdigest()
    return partes, conjunto


def main(argv=None):
    pasta = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", type=Path, default=pasta / "openapi.json")
    parser.add_argument("--fixtures", type=Path, default=pasta / "exemplos" / "cenarios.json")
    parser.add_argument("--api", type=Path, default=pasta.parent / "backend" / "API.md")
    parser.add_argument("--hash", action="store_true", help="imprime o SHA-256 do pacote (para o gate G-1) após validar")
    parser.add_argument("--conferir-hash", metavar="SHA256", help="falha se o hash do conjunto diferir do registrado")
    args = parser.parse_args(argv)
    try:
        spec = json.loads(args.spec.read_text(encoding="utf-8"))
        cen = json.loads(args.fixtures.read_text(encoding="utf-8"))
        api = args.api.read_text(encoding="utf-8")
        operacoes, cenarios = verificar(spec, cen, api)
        if args.hash or args.conferir_hash:
            partes, conjunto = hash_do_pacote(pasta.parent)
            if args.hash:
                for rel, h in partes.items():
                    print(f"{h}  docs/{rel}")
                print(f"{conjunto}  conjunto")
            exigir(not args.conferir_hash or args.conferir_hash.lower() == conjunto, f"Hash do pacote {conjunto} difere do registrado {args.conferir_hash}: o contrato mudou depois do aceite")
    except (Invalido, KeyError, TypeError, IndexError, StopIteration, OSError, json.JSONDecodeError) as erro:
        print(f"FALHA documental: {type(erro).__name__}: {erro}", file=sys.stderr)
        return 1
    print(f"OK documental: {operacoes} operações; {cenarios} cenários (mundo, pré-condições, efeitos, cobertura operação×código); API.md×OpenAPI; exemplos. "
          "Não valida API em execução, bcrypt, concorrência, agregações nem OpenAPI integral.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
