"""
gerar_dados_filmes.py
----------------------
Roda UMA VEZ (ou sempre que quiser atualizar os dados) para buscar as
informações dos filmes na API da TMDB e salvar tudo em "js/dados-filmes.js".

Depois disso, o index.html / explore.html / filme.html NÃO chamam mais a API —
eles só leem esse arquivo local. Isso significa: sem gastar o token toda hora,
e o site funciona 100% offline na apresentação (as imagens já estão em
assets/img-filmes/).

A lógica de extração daqui (classificação, plataforma, trailer) está espelhada
em js/explore.js, que aplica os mesmos critérios sobre os dados locais.

COMO USAR:
1. pip install requests
2. Preencha TMDB_TOKEN abaixo com o seu token da TMDB (v4 Read Access Token
   - o token comprido que começa mais ou menos com "eyJ...").
3. Rode (a partir da pasta pipoquetas/): python gerar_dados_filmes.py
4. Confira o js/dados-filmes.js gerado e recarregue o index.html no navegador.
"""

import json
import sys

import requests

TMDB_TOKEN = "COLOQUE_SEU_TOKEN_AQUI"

BASE_URL = "https://api.themoviedb.org/3"
IDIOMA = "pt-BR"
REGIAO = "BR"

HEADERS = {
    "Authorization": f"Bearer {TMDB_TOKEN}",
    "accept": "application/json",
}

# Ajuste "busca" e "ano" se algum filme vier errado na busca.
# "id" é o slug usado em filme.html?id=<slug> e não deve mudar depois de
# publicado (links e favoritos salvos usam esse valor).
# "local_img" tem que bater com o arquivo que já está em assets/img-filmes/.
# "secao" define em qual carrossel da home o filme aparece.
# "nota" é a nota do site (0-5); se omitida, usa avaliacao_TMDB / 2.
FILMES = [
    {"id": "filme-1917", "busca": "1917", "ano": 2019, "local_img": "assets/img-filmes/1917.png", "secao": "mais-assistidos"},
    {"id": "titanic", "busca": "Titanic", "ano": 1997, "local_img": "assets/img-filmes/titanic.png", "secao": "mais-assistidos"},
    {"id": "capitao-america-guerra-civil", "busca": "Capitão América: Guerra Civil", "ano": 2016, "local_img": "assets/img-filmes/capitaoamericaguerracivil.png", "secao": "mais-assistidos"},
    {"id": "estrelas-alem-do-tempo", "busca": "Estrelas Além do Tempo", "ano": 2016, "local_img": "assets/img-filmes/estrelasalemdotempo.png", "secao": "mais-assistidos"},
    {"id": "duna-parte-2", "busca": "Dune: Part Two", "ano": 2024, "local_img": "assets/img-filmes/dune.png", "secao": "recomendados"},
    {"id": "interestelar", "busca": "Interestelar", "ano": 2014, "local_img": "assets/img-filmes/interestellar.png", "secao": "recomendados"},
    {"id": "blade-runner-2049", "busca": "Blade Runner 2049", "ano": 2017, "local_img": "assets/img-filmes/bladerunner.png", "secao": "recomendados"},
    {"id": "matrix-resurrections", "busca": "Matrix Resurrections", "ano": 2021, "local_img": "assets/img-filmes/matrixresurrections.png", "secao": "recomendados"},
    {"id": "star-wars-ep2", "busca": "Star Wars: Episódio II - Ataque dos Clones", "ano": 2002, "local_img": "assets/img-filmes/starwarsepisodeii.png", "secao": "recomendados"},
    {"id": "homem-aranha-aranhaverso", "busca": "Homem-Aranha: Através do Aranhaverso", "ano": 2023, "local_img": "assets/img-filmes/homemaranhaspiderverso.png", "secao": "mais-assistidos"},
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
        params={
            "language": IDIOMA,
            "append_to_response": "release_dates,watch/providers,videos",
        },
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


def extrair_trailer_youtube(dados):
    """Chave do trailer oficial no YouTube (preferindo dublado/localizado)."""
    videos = dados.get("videos", {}).get("results", [])
    candidatos = [v for v in videos if v.get("site") == "YouTube" and "Trailer" in (v.get("type") or "")]
    for v in candidatos:
        if (v.get("iso_639_1") or "").lower() == "pt":
            return v.get("key", "")
    if candidatos:
        return candidatos[0].get("key", "")
    return ""


def main():
    if TMDB_TOKEN == "COLOQUE_SEU_TOKEN_AQUI":
        sys.exit("Edite o arquivo e coloque seu token da TMDB em TMDB_TOKEN antes de rodar.")

    filmes_final = []
    for f in FILMES:
        print(f"Buscando: {f['busca']}...")
        tmdb_id = buscar_filme(f["busca"], f["ano"])
        dados = detalhes_filme(tmdb_id)
        avaliacao = round(dados.get("vote_average", 0), 1)

        filmes_final.append({
            "id": f["id"],
            "titulo": dados.get("title"),
            "ano": (dados.get("release_date") or "")[:4],
            "generos": [g["name"] for g in dados.get("genres", [])],
            "classificacao": extrair_classificacao(dados),
            "avaliacao": avaliacao,
            "nota": round(avaliacao / 2, 1),
            "plataforma": extrair_plataforma(dados),
            "imagem": f["local_img"],
            "secao": f["secao"],
            "sinopse": dados.get("overview", ""),
            "trailerYoutubeId": extrair_trailer_youtube(dados),
        })

    with open("js/dados-filmes.js", "w", encoding="utf-8") as out:
        out.write("// Gerado automaticamente por gerar_dados_filmes.py\n")
        out.write("// Não chama a API TMDB em tempo de execução — apenas leitura local.\n")
        out.write("const filmesData = ")
        out.write(json.dumps(filmes_final, ensure_ascii=False, indent=2))
        out.write(";\n")

    print("\njs/dados-filmes.js gerado com sucesso! Recarregue o index.html.")
    print("ATENÇÃO: confira os campos duracao/elenco/ondeAssistir/relacionados,")
    print("que são curadoria local e precisam ser mesclados manualmente.")


if __name__ == "__main__":
    main()

# NOTA: se seu token for uma "API Key" v3 (string curta, sem pontos),
# troque a autenticação por parâmetro de URL em vez de header Bearer:
#   params={"api_key": "SUA_API_KEY", "query": nome, ...}
# e remova o dicionário HEADERS das chamadas requests.get(...).
