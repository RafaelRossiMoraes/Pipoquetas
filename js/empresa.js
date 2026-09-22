// empresa.js — painel da empresa (extraído de empresa.html).
// "meusFilmesData" vem de um SELECT em Filme filtrado pela empresa logada (placeholder local).
// Depende de: js/app.js.
(function () {
  let meusFilmesData = [
    {
      titulo: "Estrada Sem Volta", ano: "2025", classificacao: "14",
      generos: ["Suspense"], plataforma: "StreamFlix", preco: "R$12,90",
      sinopse: "Um motorista de aplicativo se vê perseguido após presenciar um crime.",
      imagem: "assets/img-filmes/placeholder.png", status: "pendente",
      visualizacoes: 0, avaliacoes: 0, notaMedia: 0
    },
    {
      titulo: "Refúgio", ano: "2024", classificacao: "L",
      generos: ["Drama", "Família"], plataforma: "StreamFlix", preco: "R$9,90",
      sinopse: "Uma família reconstrói a vida após perder tudo em uma enchente.",
      imagem: "assets/img-filmes/placeholder.png", status: "aprovado",
      visualizacoes: 3420, avaliacoes: 87, notaMedia: 4.2
    }
  ];

  // ---------- Renderização ----------
  function renderMeusFilmes() {
    const tbody = document.getElementById("tbodyMeusFilmes");
    if (!tbody) return;
    tbody.innerHTML = "";
    meusFilmesData.forEach((f, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="cell-title"><img src="${f.imagem}" alt="${f.titulo}">${f.titulo}</td>
        <td>${f.ano}</td>
        <td>${f.plataforma || "—"}</td>
        <td><span class="badge badge-${f.status}">${f.status}</span></td>
        <td>
          <button class="action-btn editar" data-index="${index}" data-acao="editar-filme">Editar</button>
          <button class="action-btn remover" data-index="${index}" data-acao="remover-filme">Remover</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.getElementById("countMeusFilmes").textContent = meusFilmesData.length;
    document.getElementById("statTotalFilmes").textContent = meusFilmesData.length;
    document.getElementById("statPendentes").textContent = meusFilmesData.filter((f) => f.status === "pendente").length;
    document.getElementById("emptyMeusFilmes").style.display = meusFilmesData.length ? "none" : "block";

    document.getElementById("statVisualizacoes").textContent =
      meusFilmesData.reduce((soma, f) => soma + (f.visualizacoes || 0), 0);

    const comNota = meusFilmesData.filter((f) => f.avaliacoes > 0);
    document.getElementById("statAvaliacaoMedia").textContent = comNota.length
      ? (comNota.reduce((soma, f) => soma + f.notaMedia, 0) / comNota.length).toFixed(1)
      : "0.0";
  }

  function renderDesempenho() {
    const tbody = document.getElementById("tbodyDesempenho");
    if (!tbody) return;
    tbody.innerHTML = "";
    meusFilmesData.filter((f) => f.status === "aprovado").forEach((f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.titulo}</td>
        <td>${f.visualizacoes}</td>
        <td>${f.avaliacoes}</td>
        <td><i class="fa-solid fa-star"></i> ${Number(f.notaMedia).toFixed(1)}</td>`;
      tbody.appendChild(tr);
    });
    const aprovados = meusFilmesData.filter((f) => f.status === "aprovado").length;
    document.getElementById("emptyDesempenho").style.display = aprovados ? "none" : "block";
  }

  // ---------- Ações ----------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const index = btn.dataset.index !== undefined ? Number(btn.dataset.index) : null;
    if (btn.dataset.acao === "remover-filme") {
      meusFilmesData.splice(index, 1);
      renderMeusFilmes();
      renderDesempenho();
    }
    if (btn.dataset.acao === "editar-filme") abrirFormularioFilme(meusFilmesData[index], index);
  });

  // ---------- Modal ----------
  const filmeFormOverlay = document.getElementById("filmeFormOverlay");
  const filmeForm = document.getElementById("filmeForm");
  let indexEmEdicao = null;

  function abrirFormularioFilme(filme, index) {
    indexEmEdicao = index === undefined ? null : index;
    document.getElementById("filmeFormTitulo").textContent = filme ? "Editar filme" : "Cadastrar filme";
    document.getElementById("campoTitulo").value = filme ? filme.titulo : "";
    document.getElementById("campoAno").value = filme ? filme.ano : "";
    document.getElementById("campoClassificacao").value = filme ? filme.classificacao : "L";
    document.getElementById("campoGeneros").value = filme ? (filme.generos || []).join(", ") : "";
    document.getElementById("campoPlataforma").value = filme ? filme.plataforma : "";
    document.getElementById("campoPreco").value = filme ? filme.preco : "";
    document.getElementById("campoSinopse").value = filme ? filme.sinopse : "";
    document.getElementById("campoImagem").value = filme ? filme.imagem : "";
    filmeFormOverlay.classList.add("active");
  }

  const btnAdicionar = document.getElementById("btnAdicionarFilme");
  if (btnAdicionar) btnAdicionar.addEventListener("click", () => abrirFormularioFilme(null, null));
  const btnCancelar = document.getElementById("btnCancelarFilme");
  if (btnCancelar) btnCancelar.addEventListener("click", () => filmeFormOverlay.classList.remove("active"));
  if (filmeFormOverlay) {
    filmeFormOverlay.addEventListener("click", (e) => {
      if (e.target === filmeFormOverlay) filmeFormOverlay.classList.remove("active");
    });
  }

  if (filmeForm) {
    filmeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const dados = {
        titulo: document.getElementById("campoTitulo").value,
        ano: document.getElementById("campoAno").value,
        classificacao: document.getElementById("campoClassificacao").value,
        generos: document.getElementById("campoGeneros").value.split(",").map((g) => g.trim()).filter(Boolean),
        plataforma: document.getElementById("campoPlataforma").value,
        preco: document.getElementById("campoPreco").value,
        sinopse: document.getElementById("campoSinopse").value,
        imagem: document.getElementById("campoImagem").value || "assets/img-filmes/placeholder.png"
      };
      if (indexEmEdicao !== null) meusFilmesData[indexEmEdicao] = { ...meusFilmesData[indexEmEdicao], ...dados };
      else meusFilmesData.push({ ...dados, status: "pendente", visualizacoes: 0, avaliacoes: 0, notaMedia: 0 });
      filmeFormOverlay.classList.remove("active");
      renderMeusFilmes();
      renderDesempenho();
    });
  }

  // ---------- Inicialização ----------
  renderMeusFilmes();
  renderDesempenho();
})();
