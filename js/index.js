// index.js — home: slideshow, carrosséis, render dinâmico dos filmes e planos.
// Depende de: js/dados-filmes.js (filmesData) e js/app.js (chrome compartilhado).
(function () {
  const filmes = typeof filmesData !== "undefined" ? filmesData : [];

  // ---------- Slideshow do hero ----------
  const heroSlides = document.querySelectorAll("#heroSlideshow .hero-slide");
  if (heroSlides.length > 0) {
    let heroSlideIndex = 0;
    setInterval(() => {
      heroSlides[heroSlideIndex].classList.remove("active");
      heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
      heroSlides[heroSlideIndex].classList.add("active");
    }, 10000);
  }

  // ---------- Carrossel de categorias ----------
  const categoriesContainer = document.getElementById("categoriesContainer");
  const prevCatBtn = document.getElementById("prevCatBtn");
  const nextCatBtn = document.getElementById("nextCatBtn");

  function updateCategoryButtons() {
    if (!categoriesContainer || !prevCatBtn || !nextCatBtn) return;
    const scrollLeft = categoriesContainer.scrollLeft;
    const maxScrollLeft = categoriesContainer.scrollWidth - categoriesContainer.clientWidth;
    prevCatBtn.classList.toggle("hidden", scrollLeft <= 5);
    nextCatBtn.classList.toggle("hidden", scrollLeft >= maxScrollLeft - 5);
  }

  if (categoriesContainer && prevCatBtn && nextCatBtn) {
    nextCatBtn.addEventListener("click", () => categoriesContainer.scrollBy({ left: 250, behavior: "smooth" }));
    prevCatBtn.addEventListener("click", () => categoriesContainer.scrollBy({ left: -250, behavior: "smooth" }));
    categoriesContainer.addEventListener("scroll", updateCategoryButtons);
    window.addEventListener("resize", updateCategoryButtons);
    // Clique numa categoria -> explore filtrado por gênero
    categoriesContainer.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = "explore.html?genero=" + encodeURIComponent(btn.textContent.trim());
      });
    });
    updateCategoryButtons();
  }

  // ---------- Render dinâmico dos carrosséis ----------
  function movieCard(f) {
    const tags = [f.plataforma, ...(f.generos || []).slice(0, 3)].filter(Boolean);
    return `
      <div class="movie-card" data-id="${f.id}" title="${f.titulo}">
        <img src="${f.imagem}" alt="${f.titulo}">
        <div class="card-overlay">
          <h3>${f.titulo}</h3>
          <div class="tags">${tags.map((t) => `<span>${t}</span>`).join("")}</div>
          <div class="info">
            <span>${f.ano || ""}</span>
            <span><i class="fa-solid fa-star"></i> ${Number(f.nota || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>`;
  }

  function renderCarrossel(gridId, lista) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = lista.map(movieCard).join("");
    grid.querySelectorAll(".movie-card").forEach((card) => {
      card.addEventListener("click", () => {
        window.location.href = "filme.html?id=" + encodeURIComponent(card.dataset.id);
      });
    });
  }

  renderCarrossel("moviesGrid", filmes.filter((f) => f.secao === "recomendados"));
  renderCarrossel("moviesGrid2", filmes.filter((f) => f.secao !== "recomendados"));

  // ---------- Setas dos carrosséis ----------
  [["prevMovieBtn", "moviesGrid", -300], ["nextMovieBtn", "moviesGrid", 300],
   ["prevMovieBtn2", "moviesGrid2", -300], ["nextMovieBtn2", "moviesGrid2", 300]
  ].forEach(([btnId, gridId, dx]) => {
    const btn = document.getElementById(btnId);
    const grid = document.getElementById(gridId);
    if (btn && grid) btn.addEventListener("click", () => grid.scrollBy({ left: dx, behavior: "smooth" }));
  });

  // ---------- Planos PipoPlus+ ----------
  const plansGrid = document.getElementById("plansGrid");
  if (plansGrid) {
    plansGrid.querySelectorAll(".plan-card").forEach((card) => {
      const btn = card.querySelector(".plan-btn");
      if (!btn) return;
      btn.addEventListener("click", () => {
        plansGrid.querySelectorAll(".plan-card").forEach((c) => c.classList.remove("selecionado"));
        card.classList.add("selecionado");
        try { localStorage.setItem("pipoquetas-plano", card.dataset.plan || ""); } catch (e) { /* sem storage */ }
      });
    });
    try {
      const salvo = localStorage.getItem("pipoquetas-plano");
      if (salvo) {
        const el = plansGrid.querySelector(`.plan-card[data-plan="${salvo}"]`);
        if (el) el.classList.add("selecionado");
      }
    } catch (e) { /* sem storage */ }
  }
})();
