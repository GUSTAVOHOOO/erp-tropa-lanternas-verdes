"""Extrai somente métricas das execuções Wellington conhecidas, sem copiar chats.

Uso: uv run python -X utf8 docs/research/evals-wellington/extrair-metricas.py
"""

import argparse
import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from statistics import mean, median


AGENTES = {
    "eval_controle": ("controle", 1), "eval_controle_2": ("controle", 2),
    "eval_original": ("original", 1), "eval_original_2": ("original", 2),
    "eval_revisada": ("intermediaria", 1), "eval_revisada_2": ("intermediaria", 2),
    "eval_final": ("tentativa_2", 1), "eval_final_2": ("tentativa_2", 2),
    "eval_validada_1": ("final_anterior", 1), "eval_validada_2": ("final_anterior", 2),
    "eval_validada_3": ("final_anterior", 3),
    "eval_eficiencia_base": ("anterior_calibracao", 1),
    "eval_eficiente_1": ("otimizada_v1", 1), "eval_eficiente_2": ("otimizada_v1", 2),
    "eval_eficiente_3": ("otimizada_v1", 3),
    "eval_economia_1": ("otimizada", 1), "eval_economia_2": ("otimizada", 2),
    "eval_economia_3": ("otimizada", 3),
}


def extrair(pasta):
    linhas = []
    for arquivo in sorted(pasta.glob("*.jsonl")):
        with arquivo.open(encoding="utf-8") as entrada:
            primeiro = json.loads(next(entrada))
            meta = primeiro.get("payload", {})
            nome = meta.get("agent_path", "") or ""
            if not nome.startswith("/root/") or nome[6:] not in AGENTES:
                continue
            eventos = [primeiro] + [json.loads(linha) for linha in entrada if linha.strip()]
        registros = [e["payload"] for e in eventos if e["type"] == "token_usage_record"]
        inicios = [e for e in eventos if e["type"] == "event_msg" and e["payload"].get("type") == "task_started"]
        fins = [e for e in eventos if e["type"] == "event_msg" and e["payload"].get("type") == "task_complete"]
        if not registros or len(inicios) != 1 or len(fins) != 1:
            continue
        total = registros[-1]["turn_token_usage"]
        campos = ["input_tokens", "cached_input_tokens", "output_tokens", "reasoning_output_tokens", "total_tokens"]
        for campo in campos:
            if sum(r["usage"].get(campo, 0) for r in registros) != total.get(campo, 0):
                raise ValueError(f"Acumulado inconsistente: {nome}, {campo}")
        if not (0 <= total["cached_input_tokens"] <= total["input_tokens"]):
            raise ValueError(f"Cache inconsistente: {nome}")
        if total["input_tokens"] + total["output_tokens"] != total["total_tokens"]:
            raise ValueError(f"Total inconsistente: {nome}")
        tipo, repeticao = AGENTES[nome[6:]]
        modelos = sorted({e["payload"]["model"] for e in eventos if e["type"] == "turn_context" and "model" in e["payload"]})
        inicio = datetime.fromisoformat(inicios[0]["timestamp"].replace("Z", "+00:00"))
        fim = datetime.fromisoformat(fins[0]["timestamp"].replace("Z", "+00:00"))
        chamadas = [e["payload"] for e in eventos if e["type"] == "response_item" and e["payload"].get("type") in ("function_call", "custom_tool_call")]
        saidas = [e["payload"] for e in eventos if e["type"] == "response_item" and e["payload"].get("type") in ("function_call_output", "custom_tool_call_output")]
        linhas.append({"condicao": tipo, "repeticao": repeticao, "agente": nome,
                       "arquivo_origem": arquivo.name,
                       "sha256_origem": hashlib.sha256(arquivo.read_bytes()).hexdigest(),
                       "modelos_registrados": modelos,
                       "inicio_utc": inicio.isoformat(), "fim_utc": fim.isoformat(),
                       "duracao_segundos": (fim - inicio).total_seconds(),
                       **{campo: total.get(campo, 0) for campo in campos},
                       "uncached_input_tokens": total["input_tokens"] - total["cached_input_tokens"],
                       "requisicoes_modelo": len(registros),
                       "primeira_entrada_tokens": registros[0]["usage"]["input_tokens"],
                       "ultima_entrada_tokens": registros[-1]["usage"]["input_tokens"],
                       "pico_entrada_tokens": max(r["usage"]["input_tokens"] for r in registros),
                       "chamadas_ferramentas": len(chamadas),
                       "caracteres_saidas_ferramentas": sum(len(str(s.get("output", ""))) for s in saidas),
                       "saidas_truncadas": sum("truncated" in str(s.get("output", "")).lower() for s in saidas)})
    return linhas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sessions", type=Path, default=Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))) / "sessions/2026/11/06")
    parser.add_argument("--out", type=Path, default=Path(__file__).with_name("metricas-eficiencia.json"))
    args = parser.parse_args()
    execucoes = extrair(args.sessions)
    resumos = {}
    campos = ["duracao_segundos", "input_tokens", "cached_input_tokens", "uncached_input_tokens", "output_tokens", "reasoning_output_tokens", "total_tokens", "requisicoes_modelo", "chamadas_ferramentas", "pico_entrada_tokens", "caracteres_saidas_ferramentas", "saidas_truncadas"]
    for condicao in sorted({e["condicao"] for e in execucoes}):
        grupo = [e for e in execucoes if e["condicao"] == condicao]
        resumos[condicao] = {"n": len(grupo), **{c: {"mediana": median(e[c] for e in grupo), "media": mean(e[c] for e in grupo), "min": min(e[c] for e in grupo), "max": max(e[c] for e in grupo)} for c in campos}}
    args.out.write_text(json.dumps({"metodo": "token_usage_record.usage somado e conferido contra turn_token_usage; tempo entre eventos task_started/task_complete", "execucoes": execucoes, "resumos": resumos}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(resumos, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
