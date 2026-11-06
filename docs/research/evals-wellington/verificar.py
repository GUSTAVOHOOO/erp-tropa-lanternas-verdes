"""Valida o catálogo e links da skill; não avalia qualidade do frontend.

Uso: python -X utf8 docs/research/evals-wellington/verificar.py
     Acrescente --baseline CAMINHO_DA_SKILL_ORIGINAL para comparar os IDs.
"""

import argparse
import json
import re
from pathlib import Path


def catalogo(pasta):
    regras = {}
    for arquivo in sorted((pasta / "references").glob("*.md")):
        texto = arquivo.read_text(encoding="utf-8")
        titulos = list(re.finditer(r"^### ([A-Z]+-\d{2}): (.+)$", texto, re.M))
        for indice, titulo in enumerate(titulos):
            identificador = titulo[1]
            fim = titulos[indice + 1].start() if indice + 1 < len(titulos) else len(texto)
            corpo = texto[titulo.end():fim]
            assert identificador not in regras, f"ID duplicado: {identificador}"
            assert re.search(r"^\*\*Fonte:\*\* \[(SLIDE|DOCS|DECISÃO)\]", corpo, re.M), (
                f"Fonte ausente: {identificador}"
            )
            assert "**Como verificar" in corpo, f"Verificação ausente: {identificador}"
            regras[identificador] = (arquivo.name, titulo[2])
        assert "rg -L " not in texto, f"Busca incorreta em {arquivo.name}"
        assert "xargs" not in texto, f"Pipeline incompatível com PowerShell: {arquivo.name}"
    assert regras, "Catálogo vazio"
    return regras


def main():
    argumentos = argparse.ArgumentParser()
    argumentos.add_argument("--baseline", type=Path)
    opcoes = argumentos.parse_args()
    raiz = Path(__file__).resolve().parents[3]
    pasta = raiz / ".claude/skills/padroes-wellington"
    texto = (pasta / "SKILL.md").read_text(encoding="utf-8")
    regras = catalogo(pasta)
    links = re.findall(r"\]\((references/[^)]+\.md)\)", texto)
    assert len(set(links)) == 9, "Referências esperadas não estão todas vinculadas"
    for link in links:
        assert (pasta / link).is_file(), f"Link inexistente: {link}"
    for identificador in re.findall(r"\b[A-Z]+-\d{2}\b", texto):
        assert identificador in regras, f"ID desconhecido no entrypoint: {identificador}"
    assert ".claude/skills/padroes-wellington/SKILL.md" in (
        raiz / "AGENTS.md"
    ).read_text(encoding="utf-8"), "Apontador ausente no AGENTS.md"

    if opcoes.baseline:
        # A versão original contém comandos de busca antigos; aqui comparamos
        # somente identidade/títulos, sem exigir que ela passe nas correções.
        originais = {}
        for arquivo in (opcoes.baseline / "references").glob("*.md"):
            for identificador, titulo in re.findall(
                r"^### ([A-Z]+-\d{2}): (.+)$", arquivo.read_text(encoding="utf-8"), re.M
            ):
                assert identificador not in originais, f"ID duplicado na baseline: {identificador}"
                originais[identificador] = (arquivo.name, titulo)
        assert originais == regras, "IDs, títulos ou arquivos de regras mudaram"

    print(json.dumps({"regras": len(regras), "links_validos": len(set(links)),
                      "baseline_comparada": bool(opcoes.baseline)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
