// index.js (jQuery) — home: slideshow, carrosséis, render dinâmico dos filmes e planos.
// Depende de: jQuery, js/dados-filmes.js (filmesData) e js/app.js (chrome compartilhado).
$(function () {
  var filmes = (typeof filmesData !== "undefined") ? filmesData : [];

  // ---------- Slideshow do hero ----------
  var $heroSlides = $("#heroSlideshow .hero-slide");
  if ($heroSlides.length > 0) {
    var heroSlideIndex = 0;
    setInterval(function () {
      $heroSlides.eq(heroSlideIndex).removeClass("active");
      heroSlideIndex = (heroSlideIndex + 1) % $heroSlides.length;
      $heroSlides.eq(heroSlideIndex).addClass("active");
    }, 10000);
  }

  // ---------- Carrossel de categorias ----------
  var $categoriesContainer = $("#categoriesContainer");
  var $prevCatBtn = $("#prevCatBtn");
  var $nextCatBtn = $("#nextCatBtn");

  function updateCategoryButtons() {
    if (!$categoriesContainer.length || !$prevCatBtn.length || !$nextCatBtn.length) return;
    var scrollLeft = $categoriesContainer.scrollLeft();
    var maxScrollLeft = $categoriesContainer[0].scrollWidth - $categoriesContainer[0].clientWidth;
    $prevCatBtn.toggleClass("hidden", scrollLeft <= 5);
    $nextCatBtn.toggleClass("hidden", scrollLeft >= maxScrollLeft - 5);
  }

  if ($categoriesContainer.length && $prevCatBtn.length && $nextCatBtn.length) {
    $nextCatBtn.on("click", function () {
      $categoriesContainer.animate({ scrollLeft: $categoriesContainer.scrollLeft() + 250 }, 400);
    });
    $prevCatBtn.on("click", function () {
      $categoriesContainer.animate({ scrollLeft: $categoriesContainer.scrollLeft() - 250 }, 400);
    });
    $categoriesContainer.on("scroll", updateCategoryButtons);
    $(window).on("resize", updateCategoryButtons);
    // Clique numa categoria -> explore filtrado por gênero
    $categoriesContainer.find(".cat-btn").on("click", function () {
      window.location.href = "explore.html?genero=" + encodeURIComponent($.trim($(this).text()));
    });
    updateCategoryButtons();
  }

  // ---------- Render dinâmico dos carrosséis ----------
  function movieCard(f) {
    var tags = [f.plataforma].concat((f.generos || []).slice(0, 3)).filter(Boolean);
    var tagsHtml = $.map(tags, function (t) { return "<span>" + t + "</span>"; }).join("");
    return (
      '<div class="movie-card" data-id="' + f.id + '" title="' + f.titulo + '">' +
        '<img src="' + f.imagem + '" alt="' + f.titulo + '">' +
        '<div class="card-overlay">' +
          "<h3>" + f.titulo + "</h3>" +
          '<div class="tags">' + tagsHtml + "</div>" +
          '<div class="info">' +
            "<span>" + (f.ano || "") + "</span>" +
            '<span><i class="fa-solid fa-star"></i> ' + Number(f.nota || 0).toFixed(1) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderCarrossel(gridId, lista) {
    var $grid = $("#" + gridId);
    if (!$grid.length) return;
    $grid.html($.map(lista, movieCard).join(""));
    $grid.find(".movie-card").on("click", function () {
      window.location.href = "filme.html?id=" + encodeURIComponent($(this).data("id"));
    });
  }

  renderCarrossel("moviesGrid", $.grep(filmes, function (f) { return f.secao === "recomendados"; }));
  renderCarrossel("moviesGrid2", $.grep(filmes, function (f) { return f.secao !== "recomendados"; }));

  // ---------- Setas dos carrosséis ----------
  $.each([
    ["prevMovieBtn", "moviesGrid", -300], ["nextMovieBtn", "moviesGrid", 300],
    ["prevMovieBtn2", "moviesGrid2", -300], ["nextMovieBtn2", "moviesGrid2", 300]
  ], function (_, item) {
    var $btn = $("#" + item[0]);
    var $grid = $("#" + item[1]);
    var dx = item[2];
    if ($btn.length && $grid.length) {
      $btn.on("click", function () {
        $grid.animate({ scrollLeft: $grid.scrollLeft() + dx }, 400);
      });
    }
  });

  // ---------- Planos PipoPlus+ ----------
  var $plansGrid = $("#plansGrid");
  if ($plansGrid.length) {
    $plansGrid.find(".plan-card").each(function () {
      var $card = $(this);
      var $btn = $card.find(".plan-btn");
      if (!$btn.length) return;
      $btn.on("click", function () {
        $plansGrid.find(".plan-card").removeClass("selecionado");
        $card.addClass("selecionado");
        try { localStorage.setItem("pipoquetas-plano", $card.data("plan") || ""); } catch (err) { /* sem storage */ }
      });
    });
    try {
      var salvo = localStorage.getItem("pipoquetas-plano");
      if (salvo) {
        $plansGrid.find('.plan-card[data-plan="' + salvo + '"]').addClass("selecionado");
      }
    } catch (err) { /* sem storage */ }
  }
});
