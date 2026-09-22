// explore.js — catálogo com filtros funcionais.
// Adaptação para JS da lógica de gerar_dados_filmes.py:
//   extrair_classificacao / extrair_plataforma / buscar_filme viram
//   extração de opções e filtragem sobre filmesData (leitura local, sem API).
// Depende de: js/dados-filmes.js (filmesData) e js/app.js.
(function () {
  const filmes = typeof filmesData !== "undefined" ? filmesData : [];
  const grid = document.querySelector(".movies-grid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const selGenero = document.getElementById("filtro-genero");
  const selClassificacao = document.getElementById("filtro-classificacao");
  const selLancamento = document.getElementById("filtro-lancamento");
  const selNota = document.getElementById("filtro-nota");
  const selStreaming = document.getElementById("filtro-streaming");
  const btnAplicar = document.querySelector(".btn-filter-apply");
  const btnApagar = document.querySelector(".btn-filter-reset");

  // ---------- Extração das opções (equivale ao mapeamento do .py) ----------
  const unicos = (arr) => [...new Set(arr)].sort();
  const generos = unicos(filmes.flatMap((f) => f.generos || []));
  const classificacoes = unicos(filmes.map((f) => f.classificacao).filter(Boolean));
  const anos = unicos(filmes.map((f) => f.ano).filter(Boolean)).reverse();
  const streamings = unicos(filmes.map((f) => f.plataforma).filter(Boolean));

  function preencher(select, opcoes, rotulo) {
    if (!select) return;
    select.innerHTML = `<option value="">${rotulo || "Todos"}</option>` +
      opcoes.map((o) => `<option value="${o}">${o}</option>`).join("");
  }

  preencher(selGenero, generos, "Todos os gêneros");
  preencher(selClassificacao, classificacoes.map((c) => (c === "L" ? "Livre" : c + " anos")), "Todas");
  if (selClassificacao) {
    [...selClassificacao.options].forEach((opt, i) => { if (i > 0) opt.value = classificacoes[i - 1]; });
  }
  preencher(selLancamento, anos, "Todos os anos");
  preencher(selStreaming, streamings, "Todos");
  preencher(selNota, ["4.5+", "4.0+", "3.5+", "3.0+"], "Qualquer nota");

  // ---------- Estado inicial via URL (?q= / ?genero=) ----------
  const qInicial = (params.get("q") || "").toLowerCase();
  const generoInicial = params.get("genero") || "";
  if (selGenero && generoInicial) {
    [...selGenero.options].forEach((o) => {
      if (o.value.toLowerCase() === generoInicial.toLowerCase()) selGenero.value = o.value;
    });
  }

  // ---------- Favoritos (localStorage) ----------
  function getFavoritos() {
    try { return JSON.parse(localStorage.getItem("pipoquetas-favoritos") || "[]"); }
    catch (e) { return []; }
  }

  // ---------- Render ----------
  function ageClass(c) {
    return c === "L" ? "age-l" : "age-" + String(c).replace(/\D/g, "");
  }

  function cardFilme(f) {
    const favs = getFavoritos();
    const isFav = favs.includes(f.id);
    return `
      <article class="explore-card" data-id="${f.id}">
        <div class="card-media">
          <img src="${f.imagem}" alt="${f.titulo}">
          ${f.ano ? `<span class="card-year">${f.ano}</span>` : ""}
          ${f.nota ? `<span class="card-rating"><i class="fa-regular fa-star"></i> ${Number(f.nota).toFixed(1)}</span>` : ""}
        </div>
        <div class="card-content">
          ${f.classificacao ? `<span class="age-badge ${ageClass(f.classificacao)}">${f.classificacao === "L" ? "AL" : "A" + f.classificacao}</span>` : ""}
          <h3 class="movie-title">${f.titulo}</h3>
          <p class="movie-description">${f.sinopse || ""}</p>
        </div>
        <div class="card-actions">
          <button aria-label="Favoritar" data-acao="fav"><i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
          <button aria-label="Adicionar à lista" data-acao="lista"><i class="fa-regular fa-bookmark"></i></button>
          <button aria-label="Remover" data-acao="remover"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </article>`;
  }

  function aplicarFiltros() {
    const g = selGenero ? selGenero.value : "";
    const c = selClassificacao ? selClassificacao.value : "";
    const a = selLancamento ? selLancamento.value : "";
    const n = selNota ? selNota.value : "";
    const s = selStreaming ? selStreaming.value : "";
    const q = qInicial;

    const lista = filmes.filter((f) => {
      if (g && !(f.generos || []).includes(g)) return false;
      if (c && String(f.classificacao) !== String(c)) return false;
      if (a && String(f.ano) !== String(a)) return false;
      if (n && Number(f.nota || 0) < parseFloat(n)) return false;
      if (s && f.plataforma !== s) return false;
      if (q && !(f.titulo + " " + (f.sinopse || "")).toLowerCase().includes(q)) return false;
      return true;
    });

    grid.innerHTML = lista.length
      ? lista.map(cardFilme).join("")
      : `<p class="empty-state">Nenhum filme encontrado com os filtros aplicados.</p>`;

    grid.querySelectorAll(".explore-card").forEach((card) => {
      card.querySelector(".card-media").addEventListener("click", () => {
        window.location.href = "filme.html?id=" + encodeURIComponent(card.dataset.id);
      });
      card.querySelectorAll("button[data-acao]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = card.dataset.id;
          if (btn.dataset.acao === "remover") { card.remove(); return; }
          if (btn.dataset.acao === "fav") {
            let favs = getFavoritos();
            if (favs.includes(id)) favs = favs.filter((x) => x !== id);
            else favs.push(id);
            try { localStorage.setItem("pipoquetas-favoritos", JSON.stringify(favs)); } catch (err) { /* sem storage */ }
            btn.querySelector("i").className = (favs.includes(id) ? "fa-solid" : "fa-regular") + " fa-heart";
          }
        });
      });
    });
  }

  if (btnAplicar) btnAplicar.addEventListener("click", aplicarFiltros);
  if (btnApagar) {
    btnApagar.addEventListener("click", () => {
      [selGenero, selClassificacao, selLancamento, selNota, selStreaming].forEach((s) => { if (s) s.value = ""; });
      window.history.replaceState({}, "", "explore.html");
      aplicarFiltros();
    });
  }

  aplicarFiltros();
})();
