"""Gera app/banco.js a partir de QUIZ/banco_questoes.json.

Rode sempre que editar o banco:  python atualizar_banco.py
(O app lê um .js em vez do .json para funcionar abrindo o index.html direto, sem servidor.)
"""
import json, pathlib

aqui = pathlib.Path(__file__).parent
banco = json.loads((aqui.parent / "banco_questoes.json").read_text(encoding="utf-8"))
(aqui / "banco.js").write_text("window.BANCO = " + json.dumps(banco, ensure_ascii=False) + ";\n", encoding="utf-8")
print(f"banco.js gerado com {len(banco['questoes'])} questões")
