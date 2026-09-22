// filme.js — página de detalhe: render dinâmico via ?id= a partir de filmesData.
// Funde os 4 filme.html (dune2, interstellar, blade_runner2049, matrix_ressurection).
// Depende de: js/dados-filmes.js (filmesData) e js/app.js.
(function () {
  const filmes = typeof filmesData !== "undefined" ? filmesData : [];
  const params = new URLSearchParams(window.location.search);
  const filme = filmes.find((f) => f.id === params.get("id")) || filmes[0];
  if (!filme) return;

  document.title = filme.titulo;

  // ---------- Avaliações seed (mesmas das 4 versões) + locais ----------
  const seedReviews = [
    {
      user: "Jorel", avatar: "assets/avatar.png", nota: 1,
      texto: "NÃO GOSTEI NEM UM POUCO, ESPERAVA MUITO MAIS JÁ QUE A FRANQUIA NUNCA NOS DECEPCIONOU. COMO UM GRANDE FÃ, ESTOU ENTRISTECIDO COM A QUALIDADE DO FILME."
    },
    {
      user: "pessoa feliz", avatar: "assets/avatar2.png", nota: 4,
      texto: "Muito interessante de fato, mas não é o melhor da franquia."
    }
  ];
  function userReviews() {
    try { return JSON.parse(localStorage.getItem("pipoquetas-reviews-" + filme.id) || "[]"); }
    catch (e) { return []; }
  }

  function stars(nota) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += `<i class="${i <= nota ? "fa-solid" : "fa-regular"} fa-star"></i>`;
    }
    return html;
  }

  function reviewCard(r) {
    return `
      <article class="review-card">
        <header class="review-head">
          <img src="${r.avatar}" alt="${r.user}" class="review-avatar">
          <div>
            <strong class="review-user">${r.user}</strong>
            <div class="review-stars" aria-label="${r.nota} de 5 estrelas">${stars(r.nota)}</div>
          </div>
        </header>
        <p class="review-text">${r.texto}</p>
      </article>`;
  }

  // ---------- Render principal ----------
  const page = document.getElementById("moviePage");
  if (page) {
    const relacionados = (filme.relacionados || [])
      .map((id) => filmes.find((f) => f.id === id))
      .filter(Boolean);

    page.innerHTML = `
      <section class="movie-info">
        <div class="trailer" id="trailer" data-video-id="${filme.trailerYoutubeId || ""}">
          <button class="trailer-play" aria-label="Reproduzir trailer"><i class="fa-solid fa-play"></i></button>
          <span class="trailer-yt"><i class="fa-solid fa-play"></i></span>
        </div>
        <h2 class="movie-title">${filme.titulo}${filme.ano ? " (" + filme.ano + ")" : ""}</h2>
        <div class="movie-meta">
          ${filme.classificacao ? `<img class="class-indicativa" src="assets/img_class/${filme.classificacao === "L" ? "L" : filme.classificacao}.png" alt="${filme.classificacao} anos">` : ""}
          ${filme.duracao ? `<span class="meta-sep"></span><span>${filme.duracao}</span>` : ""}
          ${filme.ano ? `<span class="meta-sep"></span><span>${filme.ano}</span>` : ""}
        </div>
        <div class="movie-genres">${(filme.generos || []).map((g) => `<a href="explore.html?genero=${encodeURIComponent(g)}">${g}</a>`).join("")}</div>
        ${(filme.ondeAssistir || []).length ? `
        <div class="watch-card">
          <h3>Onde Assistir</h3>
          <div class="watch-grid">
            ${filme.ondeAssistir.map((w) => `
              <div class="watch-item">
                <img class="watch-logo" src="${w.logo}" alt="${w.nome}">
                <span class="watch-name">${w.nome}</span>
                <a href="${w.url}" target="_blank" rel="noopener" class="watch-price">${w.preco}</a>
              </div>`).join("")}
          </div>
        </div>` : ""}
      </section>
      <aside class="movie-aside">
        <div class="score-card">
          <i class="fa-solid fa-star"></i>
          <div class="score-value">${Number(filme.nota || 0).toFixed(1)}
            ${filme.numAvaliacoes ? `<span class="score-count">${filme.numAvaliacoes} Avaliações</span>` : ""}
          </div>
        </div>
        ${relacionados.length ? `
        <div class="related-card">
          <h3>Relacionados</h3>
          ${relacionados.map((r) => `
            <a href="filme.html?id=${encodeURIComponent(r.id)}" class="related-item">
              <img src="${r.imagem}" alt="${r.titulo}">
              <div>
                <h4>${r.titulo}</h4>
                <p><i class="fa-solid fa-star"></i> ${Number(r.nota || 0).toFixed(1)} | ${r.ano || ""}</p>
              </div>
            </a>`).join("")}
        </div>` : ""}
        ${(filme.elenco || []).length ? `
        <div class="cast-card">
          <h3><a href="#">Elenco ></a></h3>
          <div class="cast-row">
            ${filme.elenco.map((c) => `
              <a href="#" class="cast-member">
                <img src="${c.foto}" alt="${c.personagem}">
                <span>${c.personagem}</span>
                <span>${c.ator}</span>
              </a>`).join("")}
          </div>
        </div>` : ""}
      </aside>`;

    // Trailer: troca a capa pelo player do YouTube
    const trailer = document.getElementById("trailer");
    if (trailer) {
      trailer.addEventListener("click", () => {
        if (trailer.classList.contains("playing") || !filme.trailerYoutubeId) return;
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${filme.trailerYoutubeId}?autoplay=1&rel=0`;
        iframe.title = "Trailer de " + filme.titulo;
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        trailer.classList.add("playing");
        trailer.replaceChildren(iframe);
      });
    }
  }

  // ---------- Avaliações ----------
  const reviewsSection = document.getElementById("reviewsList");
  function renderReviews() {
    if (!reviewsSection) return;
    reviewsSection.innerHTML = [...userReviews(), ...seedReviews].map(reviewCard).join("");
  }
  renderReviews();

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = document.getElementById("reviewTexto").value.trim();
      const nota = Number(document.getElementById("reviewNota").value) || 5;
      if (!texto) return;
      const lista = userReviews();
      lista.unshift({ user: "Você", avatar: "assets/avatar.png", nota, texto });
      try { localStorage.setItem("pipoquetas-reviews-" + filme.id, JSON.stringify(lista)); } catch (err) { /* sem storage */ }
      reviewForm.reset();
      renderReviews();
    });
  }
})();
