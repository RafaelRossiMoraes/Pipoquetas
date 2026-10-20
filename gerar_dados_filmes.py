"""
gerar_dados_filmes.py — completa o catálogo até 75 filmes usando a API da TMDB.

Como usar (na pasta do projeto):
  1. pip install -r requirements.txt
  2. Crie UMA VEZ o arquivo tmdb_chave.txt (na mesma pasta deste script) e cole nele só a sua chave da TMDB.
     O script lê esse arquivo sozinho, sem pedir nada. O arquivo está no .gitignore, então não vai pro GitHub.
     Aceita a "API Key" curta (v3) ou o "Token de leitura" comprido (v4, começa com eyJ).
     (Alternativas: variável de ambiente TMDB_CHAVE, ou colar a chave quando o script pedir.)
  3. python gerar_dados_filmes.py

O que ele faz: mantém os filmes que já estão em dados/filmes.json (incluindo os cadastrados por empresas),
busca filmes bem avaliados e populares na TMDB e acrescenta até chegar a TOTAL. Baixa os pôsteres para
assets/img-filmes/. Pode rodar de novo à vontade: se já houver filmes suficientes, não duplica nada.
"""
import json, os, re, sys, unicodedata
import requests

TOTAL = 75
BAIXAR_POSTERS = True
IDIOMA, REGIAO = "pt-BR", "BR"
BASE_URL = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p"
SAIDA = os.path.join("dados", "filmes.json")
PASTA_POSTERS = os.path.join("assets", "img-filmes")
PLACEHOLDER = "assets/img-filmes/placeholder.svg"
SEM_FOTO = "assets/avatar.png"

# Os 10 filmes originais: só usados para descobrir o id deles na TMDB e não repetir.
BUSCAS = {
    "filme-1917": ("1917", 2019), "titanic": ("Titanic", 1997),
    "capitao-america-guerra-civil": ("Capitão América: Guerra Civil", 2016),
    "estrelas-alem-do-tempo": ("Estrelas Além do Tempo", 2016), "duna-parte-2": ("Dune: Part Two", 2024),
    "interestelar": ("Interestelar", 2014), "blade-runner-2049": ("Blade Runner 2049", 2017),
    "matrix-resurrections": ("Matrix Resurrections", 2021),
    "star-wars-ep2": ("Star Wars: Episódio II - Ataque dos Clones", 2002),
    "homem-aranha-aranhaverso": ("Homem-Aranha: Através do Aranhaverso", 2023),
}

ARQUIVO_CHAVE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmdb_chave.txt")


def ler_chave():
    """Ordem: arquivo tmdb_chave.txt, depois variável TMDB_CHAVE."""
    if os.path.exists(ARQUIVO_CHAVE):
        with open(ARQUIVO_CHAVE, encoding="utf-8-sig") as f:
            chave = f.read().strip().strip('"').strip("'")
            if chave.lower().startswith("bearer "): chave = chave[7:].strip()
            if chave: return chave
    return os.environ.get("TMDB_CHAVE", "").strip()


CHAVE = ler_chave()


def tmdb(caminho, **params):
    headers, p = {"accept": "application/json"}, dict(params, language=params.get("language", IDIOMA))
    if CHAVE.startswith("eyJ"): headers["Authorization"] = "Bearer " + CHAVE
    else: p["api_key"] = CHAVE
    r = requests.get(BASE_URL + caminho, headers=headers, params=p, timeout=20)
    r.raise_for_status()
    return r.json()


def slug(t):
    s = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "filme"


def classificacao(d):
    for r in d.get("release_dates", {}).get("results", []):
        if r.get("iso_3166_1") == REGIAO:
            for x in r.get("release_dates", []):
                if x.get("certification"): return x["certification"]
    return ""


def provedores(d): return d.get("watch/providers", {}).get("results", {}).get(REGIAO, {})


def plataforma(d):
    fl = provedores(d).get("flatrate", [])
    return fl[0]["provider_name"] if fl else ""


def onde_assistir(d):
    p, lista, vistos = provedores(d), [], set()
    for tipo, rotulo in (("flatrate", "Assine"), ("rent", "Alugar"), ("buy", "Comprar")):
        for pr in p.get(tipo, []):
            if pr["provider_name"] in vistos: continue
            vistos.add(pr["provider_name"])
            logo = f"{IMG}/w92{pr['logo_path']}" if pr.get("logo_path") else SEM_FOTO
            lista.append({"nome": pr["provider_name"], "logo": logo, "url": p.get("link", ""), "preco": rotulo})
    return lista[:5]


def trailer(d):
    vs = [v for v in d.get("videos", {}).get("results", []) if v.get("site") == "YouTube" and "Trailer" in (v.get("type") or "")]
    for v in vs:
        if (v.get("iso_639_1") or "").lower() == "pt": return v["key"]
    return vs[0]["key"] if vs else ""


def elenco(d):
    return [{"personagem": c.get("character") or "", "ator": c["name"],
             "foto": f"{IMG}/w185{c['profile_path']}" if c.get("profile_path") else SEM_FOTO}
            for c in d.get("credits", {}).get("cast", [])[:6]]


def baixar_poster(d, fid):
    if not d.get("poster_path"): return PLACEHOLDER
    url = f"{IMG}/w500{d['poster_path']}"
    if not BAIXAR_POSTERS: return url
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        os.makedirs(PASTA_POSTERS, exist_ok=True)
        with open(os.path.join(PASTA_POSTERS, fid + ".jpg"), "wb") as f: f.write(r.content)
        return f"assets/img-filmes/{fid}.jpg"
    except Exception:
        return url  # se falhar o download, usa o link direto da TMDB


def montar(d, secao, ids):
    fid, n = slug(d["title"]), 2
    while fid in ids: fid, n = f"{slug(d['title'])}-{n}", n + 1
    ids.add(fid)
    av, rt = round(d.get("vote_average", 0), 1), d.get("runtime") or 0
    return {"id": fid, "tmdbId": d["id"], "titulo": d["title"], "ano": (d.get("release_date") or "")[:4],
            "duracao": f"{rt // 60}h{rt % 60:02d}min" if rt else "", "generos": [g["name"] for g in d.get("genres", [])],
            "classificacao": classificacao(d), "avaliacao": av, "nota": round(av / 2, 1), "numAvaliacoes": d.get("vote_count", 0),
            "plataforma": plataforma(d), "imagem": baixar_poster(d, fid), "secao": secao, "sinopse": d.get("overview", ""),
            "trailerYoutubeId": trailer(d), "elenco": elenco(d), "ondeAssistir": onde_assistir(d), "relacionados": []}


def main():
    global CHAVE
    if not CHAVE: CHAVE = input("Não achei o arquivo tmdb_chave.txt. Cole sua chave/token da TMDB: ").strip()
    if not CHAVE: sys.exit("Sem chave da TMDB, não dá para continuar.")

    existentes = json.load(open(SAIDA, encoding="utf-8")) if os.path.exists(SAIDA) else []
    catalogo = [f for f in existentes if not f.get("empresaId")]
    faltam = TOTAL - len(catalogo)
    if faltam <= 0:
        return print(f"O catálogo já tem {len(catalogo)} filmes. Nada a fazer.")

    ids, usados = {f["id"] for f in existentes}, {f["tmdbId"] for f in existentes if f.get("tmdbId")}
    for f in catalogo:  # descobre o id TMDB dos filmes originais para não repetir
        if f["id"] in BUSCAS and not f.get("tmdbId"):
            q, ano = BUSCAS[f["id"]]
            achados = tmdb("/search/movie", query=q, year=ano).get("results") or tmdb("/search/movie", query=q).get("results")
            if achados: f["tmdbId"] = achados[0]["id"]; usados.add(f["tmdbId"])

    por_secao = {}
    for rota, secao in (("top_rated", "recomendados"), ("popular", "mais-assistidos")):
        lista = []
        for pg in range(1, 6): lista += [r["id"] for r in tmdb(f"/movie/{rota}", page=pg, region=REGIAO)["results"]]
        por_secao[secao] = [i for i in lista if i not in usados]

    ordem = []  # alterna recomendados / mais assistidos
    for a, b in zip(por_secao["recomendados"], por_secao["mais-assistidos"]): ordem += [(a, "recomendados"), (b, "mais-assistidos")]

    novos = []
    for tid, secao in ordem:
        if len(novos) >= faltam: break
        if tid in usados: continue
        usados.add(tid)
        d = tmdb(f"/movie/{tid}", append_to_response="release_dates,watch/providers,videos,credits", include_video_language="pt,en,null")
        if not d.get("poster_path") or not d.get("overview"): continue  # pula filmes sem capa/sinopse
        novos.append(montar(d, secao, ids))
        print(f"[{len(novos)}/{faltam}] {novos[-1]['titulo']}")

    todos = catalogo + novos
    for f in novos:  # relacionados: os 3 filmes com mais gêneros em comum
        outros = sorted((o for o in todos if o["id"] != f["id"]), key=lambda o: -len(set(o.get("generos", [])) & set(f["generos"])))
        f["relacionados"] = [o["id"] for o in outros[:3]]

    os.makedirs("dados", exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as out:
        json.dump(existentes + novos, out, ensure_ascii=False, indent=2)
    with open(os.path.join("js", "dados-filmes.js"), "w", encoding="utf-8") as js:  # é este arquivo que o site lê
        js.write("// Gerado por gerar_dados_filmes.py. Não edite à mão.\nconst filmesData = " + json.dumps(existentes + novos, ensure_ascii=False, indent=2) + ";\n")
    print(f"\nPronto! {len(novos)} filmes novos. Total no catálogo: {len(todos)}. Recarregue o site (js/dados-filmes.js foi atualizado).")


if __name__ == "__main__":
    main()
