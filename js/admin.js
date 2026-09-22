// admin.js — painel do administrador (extraído de admin.html).
// Listas de exemplo até integrar com o backend (tabelas Empresa, Filme, Avaliacao_Usuario).
// Depende de: js/dados-filmes.js (filmesData) e js/app.js.
(function () {
  let empresasData = [
    { id: 1, nome: "StreamFlix Distribuidora", cnpj: "12.345.678/0001-90", email: "contato@streamflix.com", data: "18/09/2026", status: "pendente" },
    { id: 2, nome: "CineBrasil Produções", cnpj: "98.765.432/0001-11", email: "contato@cinebrasil.com", data: "19/09/2026", status: "pendente" }
  ];

  let filmesPendentesData = [
    { id: 1, titulo: "Estrada Sem Volta", empresa: "StreamFlix Distribuidora", genero: "Suspense", classificacao: "14", status: "pendente" }
  ];

  let comentariosData = [
    { id: 1, usuario: "riri", filme: "Interestelar", texto: "Melhor filme que já assisti!!!", nota: 5 },
    { id: 2, usuario: "jorel_oficial", filme: "Matrix Resurrections", texto: "Não gostei muito, achei confuso.", nota: 2 }
  ];

  // ---------- Renderização ----------
  function renderEmpresas() {
    const tbody = document.getElementById("tbodyEmpresas");
    if (!tbody) return;
    tbody.innerHTML = "";
    empresasData.forEach((emp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.nome}</td>
        <td>${emp.cnpj}</td>
        <td>${emp.email}</td>
        <td>${emp.data}</td>
        <td><span class="badge badge-${emp.status}">${emp.status}</span></td>
        <td>
          ${emp.status === "pendente" ? `
            <button class="action-btn aprovar" data-id="${emp.id}" data-acao="aprovar-empresa">Aprovar</button>
            <button class="action-btn recusar" data-id="${emp.id}" data-acao="recusar-empresa">Recusar</button>
          ` : "—"}
        </td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("countEmpresas").textContent = empresasData.filter((e) => e.status === "pendente").length;
    document.getElementById("statEmpresasPendentes").textContent = empresasData.filter((e) => e.status === "pendente").length;
    document.getElementById("emptyEmpresas").style.display = empresasData.length ? "none" : "block";
  }

  function renderFilmesPendentes() {
    const tbody = document.getElementById("tbodyFilmesPendentes");
    if (!tbody) return;
    tbody.innerHTML = "";
    filmesPendentesData.forEach((f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.titulo}</td>
        <td>${f.empresa}</td>
        <td>${f.genero}</td>
        <td>${f.classificacao}</td>
        <td><span class="badge badge-${f.status}">${f.status}</span></td>
        <td>
          <button class="action-btn aprovar" data-id="${f.id}" data-acao="aprovar-filme">Aprovar</button>
          <button class="action-btn recusar" data-id="${f.id}" data-acao="recusar-filme">Recusar</button>
        </td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("countFilmesPendentes").textContent = filmesPendentesData.length;
    document.getElementById("statFilmesPendentes").textContent = filmesPendentesData.length;
    document.getElementById("emptyFilmesPendentes").style.display = filmesPendentesData.length ? "none" : "block";
  }

  function renderCatalogo() {
    const tbody = document.getElementById("tbodyCatalogo");
    if (!tbody) return;
    tbody.innerHTML = "";
    (typeof filmesData !== "undefined" ? filmesData : []).forEach((f, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="cell-title"><img src="${f.imagem}" alt="${f.titulo}">${f.titulo}</td>
        <td>${f.ano}</td>
        <td>${f.plataforma || "—"}</td>
        <td><i class="fa-solid fa-star"></i> ${f.nota !== undefined ? Number(f.nota).toFixed(1) : f.avaliacao}</td>
        <td>
          <button class="action-btn editar" data-index="${index}" data-acao="editar-filme">Editar</button>
          <button class="action-btn remover" data-index="${index}" data-acao="remover-filme">Remover</button>
        </td>`;
      tbody.appendChild(tr);
    });
    const total = typeof filmesData !== "undefined" ? filmesData.length : 0;
    document.getElementById("countCatalogo").textContent = total;
    document.getElementById("statCatalogo").textContent = total;
  }

  function renderComentarios() {
    const tbody = document.getElementById("tbodyComentarios");
    if (!tbody) return;
    tbody.innerHTML = "";
    comentariosData.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.usuario}</td>
        <td>${c.filme}</td>
        <td>${c.texto}</td>
        <td><i class="fa-solid fa-star"></i> ${c.nota}</td>
        <td><button class="action-btn remover" data-id="${c.id}" data-acao="remover-comentario">Remover</button></td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("countComentarios").textContent = comentariosData.length;
    document.getElementById("statComentarios").textContent = comentariosData.length;
    document.getElementById("emptyComentarios").style.display = comentariosData.length ? "none" : "block";
  }

  // ---------- Ações ----------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const acao = btn.dataset.acao;
    const id = btn.dataset.id ? Number(btn.dataset.id) : null;
    const index = btn.dataset.index !== undefined && btn.dataset.index !== "undefined" ? Number(btn.dataset.index) : null;

    if (acao === "aprovar-empresa" || acao === "recusar-empresa") {
      empresasData = empresasData.filter((emp) => emp.id !== id);
      renderEmpresas();
    }
    if (acao === "aprovar-filme" || acao === "recusar-filme") {
      filmesPendentesData = filmesPendentesData.filter((f) => f.id !== id);
      renderFilmesPendentes();
    }
    if (acao === "remover-filme" && typeof filmesData !== "undefined") {
      filmesData.splice(index, 1);
      renderCatalogo();
    }
    if (acao === "editar-filme" && typeof filmesData !== "undefined") {
      abrirFormularioFilme(filmesData[index], index);
    }
    if (acao === "remover-comentario") {
      comentariosData = comentariosData.filter((c) => c.id !== id);
      renderComentarios();
    }
  });

  // ---------- Modal de adicionar/editar filme ----------
  const filmeFormOverlay = document.getElementById("filmeFormOverlay");
  const filmeForm = document.getElementById("filmeForm");
  let indexEmEdicao = null;

  function abrirFormularioFilme(filme, index) {
    indexEmEdicao = index === undefined ? null : index;
    document.getElementById("filmeFormTitulo").textContent = filme ? "Editar filme" : "Adicionar filme";
    document.getElementById("campoTitulo").value = filme ? filme.titulo : "";
    document.getElementById("campoAno").value = filme ? filme.ano : "";
    document.getElementById("campoClassificacao").value = filme ? filme.classificacao : "L";
    document.getElementById("campoGeneros").value = filme ? (filme.generos || []).join(", ") : "";
    document.getElementById("campoPlataforma").value = filme ? filme.plataforma : "";
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
      const novoFilme = {
        titulo: document.getElementById("campoTitulo").value,
        ano: document.getElementById("campoAno").value,
        classificacao: document.getElementById("campoClassificacao").value,
        generos: document.getElementById("campoGeneros").value.split(",").map((g) => g.trim()).filter(Boolean),
        plataforma: document.getElementById("campoPlataforma").value,
        sinopse: document.getElementById("campoSinopse").value,
        imagem: document.getElementById("campoImagem").value || "assets/img-filmes/placeholder.png",
        avaliacao: 0,
        nota: 0,
        secao: "recomendados"
      };
      if (typeof filmesData === "undefined") window.filmesData = [];
      if (indexEmEdicao !== null) filmesData[indexEmEdicao] = { ...filmesData[indexEmEdicao], ...novoFilme };
      else filmesData.push(novoFilme);
      filmeFormOverlay.classList.remove("active");
      renderCatalogo();
    });
  }

  // ---------- Inicialização ----------
  renderEmpresas();
  renderFilmesPendentes();
  renderCatalogo();
  renderComentarios();
})();
