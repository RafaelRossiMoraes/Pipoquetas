"""
gerar_dados_filmes.py
----------------------
Roda UMA VEZ (ou sempre que quiser atualizar os dados) para buscar as
informações dos filmes na API da TMDB e salvar tudo em "dados-filmes.js".

Depois disso, o index.html NÃO chama mais a API — ele só lê esse arquivo
local. Isso significa: sem gastar seu token toda hora, e o site funciona
100% offline na apresentação (as imagens já estão em img-filmes/).

COMO USAR:
1. pip install requests
2. Preencha TMDB_TOKEN abaixo com o seu token da TMDB (v4 Read Access Token
   - o token comprido que começa mais ou menos com "eyJ...").
   Se você só tem a "API Key" (v3, string curta), veja a nota no fim do
   arquivo em vez de usar Bearer.
3. Rode: python gerar_dados_filmes.py
4. Confira o dados-filmes.js gerado e recarregue o index.html no navegador.
"""

import json
import sys
import requests

TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZmNiZDZiMzQzZjA1NmYwZWY1Yzk3M2FhZGI5NDBmNSIsIm5iZiI6MTc4NTk0ODQ3Mi45NTgwMDAyLCJzdWIiOiI2YTczNjkzOGMzNDBkYjI1NjY0NTIyZjgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Fj9Kj8NrQrnEd2mripQ5W9yNs1cSS7zxtc1onR-7i6I"

BASE_URL = "https://api.themoviedb.org/3"
IDIOMA = "pt-BR"
REGIAO = "BR"

HEADERS = {
    "Authorization": f"Bearer {TMDB_TOKEN}",
    "accept": "application/json",
}

# Ajuste "busca" e "ano" se algum filme vier errado na busca.
# "local_img" tem que bater com o arquivo que já está em img-filmes/.
# "secao" define em qual carrossel do site o filme aparece.
FILMES = [
    {"busca": "1917", "ano": 2019, "local_img": "img-filmes/1917.png", "secao": "recomendados"},
    {"busca": "Titanic", "ano": 1997, "local_img": "img-filmes/titanic.png", "secao": "recomendados"},
    {"busca": "Capitão América: Guerra Civil", "ano": 2016, "local_img": "img-filmes/capitaoamericaguerracivil.png", "secao": "recomendados"},
    {"busca": "Estrelas Além do Tempo", "ano": 2016, "local_img": "img-filmes/estrelasalemdotempo.png", "secao": "recomendados"},
    {"busca": "Duna: Parte 2", "ano": 2024, "local_img": "img-filmes/dune.png", "secao": "recomendados"},
    {"busca": "Interestelar", "ano": 2014, "local_img": "img-filmes/interestellar.png", "secao": "lancamentos"},
    {"busca": "Blade Runner 2049", "ano": 2017, "local_img": "img-filmes/7.png", "secao": "lancamentos"},
    {"busca": "Matrix Resurrections", "ano": 2021, "local_img": "img-filmes/matrixresurrections.png", "secao": "lancamentos"},
    {"busca": "Star Wars: Episódio II - Ataque dos Clones", "ano": 2002, "local_img": "img-filmes/starwarsepisodeii.png", "secao": "lancamentos"},
    {"busca": "Homem-Aranha: Através do Aranhaverso", "ano": 2023, "local_img": "img-filmes/homemaranhaspiderverso.png", "secao": "lancamentos"},
]


def buscar_filme(nome, ano):
    resp = requests.get(
        f"{BASE_URL}/search/movie",
        headers=HEADERS,
        params={"query": nome, "language": IDIOMA, "year": ano},
    )
    resp.raise_for_status()
    resultados = resp.json().get("results", [])

    if not resultados:
        # tenta de novo sem o ano, caso a busca exata não encontre nada
        resp = requests.get(
            f"{BASE_URL}/search/movie",
            headers=HEADERS,
            params={"query": nome, "language": IDIOMA},
        )
        resp.raise_for_status()
        resultados = resp.json().get("results", [])

    if not resultados:
        raise ValueError(f"Filme não encontrado na TMDB: {nome}")

    return resultados[0]["id"]


def detalhes_filme(tmdb_id):
    resp = requests.get(
        f"{BASE_URL}/movie/{tmdb_id}",
        headers=HEADERS,
        params={"language": IDIOMA, "append_to_response": "release_dates,watch/providers"},
    )
    resp.raise_for_status()
    return resp.json()


def extrair_classificacao(dados):
    """Classificação indicativa brasileira (L, 10, 12, 14, 16, 18)."""
    releases = dados.get("release_dates", {}).get("results", [])
    for r in releases:
        if r.get("iso_3166_1") == REGIAO:
            for d in r.get("release_dates", []):
                if d.get("certification"):
                    return d["certification"]
    return ""


def extrair_plataforma(dados):
    """Primeiro serviço de streaming (assinatura) disponível no Brasil."""
    providers = dados.get("watch/providers", {}).get("results", {}).get(REGIAO, {})
    flatrate = providers.get("flatrate", [])
    if flatrate:
        return flatrate[0]["provider_name"]
    return ""


def main():
    if TMDB_TOKEN == "COLOQUE_SEU_TOKEN_AQUI":
        sys.exit("Edite o arquivo e coloque seu token da TMDB em TMDB_TOKEN antes de rodar.")

    filmes_final = []
    for f in FILMES:
        print(f"Buscando: {f['busca']}...")
        tmdb_id = buscar_filme(f["busca"], f["ano"])
        dados = detalhes_filme(tmdb_id)

        filmes_final.append({
            "titulo": dados.get("title"),
            "ano": (dados.get("release_date") or "")[:4],
            "generos": [g["name"] for g in dados.get("genres", [])],
            "classificacao": extrair_classificacao(dados),
            "avaliacao": round(dados.get("vote_average", 0), 1),
            "plataforma": extrair_plataforma(dados),
            "imagem": f["local_img"],
            "secao": f["secao"],
            "sinopse": dados.get("overview", ""),
        })

    with open("dados-filmes.js", "w", encoding="utf-8") as out:
        out.write("// Gerado automaticamente por gerar_dados_filmes.py\n")
        out.write("// Não chama a API TMDB em tempo de execução — apenas leitura local.\n")
        out.write("const filmesData = ")
        out.write(json.dumps(filmes_final, ensure_ascii=False, indent=2))
        out.write(";\n")

    print("\ndados-filmes.js gerado com sucesso! Recarregue o index.html.")


if __name__ == "__main__":
    main()

# NOTA: se seu token for uma "API Key" v3 (string curta, sem pontos),
# troque a autenticação por parâmetro de URL em vez de header Bearer:
#   params={"api_key": "SUA_API_KEY", "query": nome, ...}
# e remova o dicionário HEADERS das chamadas requests.get(...).
