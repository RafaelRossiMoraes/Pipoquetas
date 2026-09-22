PIPOQUETAS — PROJETO UNIFICADO
==============================
Como funciona o código (guia de leitura e manutenção).

1. COMO ABRIR O SITE
--------------------
Não precisa de servidor nem instalação. Abra o arquivo abaixo no navegador:
  pipoquetas/index.html
Todas as páginas são HTML + CSS + JavaScript puros e os dados ficam num
arquivo local (js/dados-filmes.js). Funciona offline (só Font Awesome e os
trailers do YouTube exigem internet).

Login de demonstração (tela login.html, senha sempre "123456"):
  usuario        -> index.html     (perfil comum)
  administrador  -> admin.html     (painel do administrador)
  empresa        -> empresa.html   (painel da empresa)

2. ESTRUTURA DE PASTAS
----------------------
  index.html ................ home (vitrine, carrosséis, plataformas, planos)
  explore.html .............. catálogo com filtros de busca
  filme.html ................ detalhe do filme (dinâmica, usa ?id= na URL)
  assinatura.html ........... planos PipoPlus+ (Bronze/Prata/Ouro)
  admin.html ................ painel do administrador (aprovações e catálogo)
  empresa.html .............. painel da empresa (meus filmes e desempenho)
  login.html ................ tela de entrar
  gerar_dados_filmes.py ..... script que busca dados na API TMDB (rodar 1 vez)
  css/base.css .............. estilos COMPARTILHADOS (fundo, header, sidebar,
                              footer, menu do avatar, modal de configurações,
                              tema escuro). Referência visual: vish2/index.
  css/index.css ............. estilos SÓ da home e da assinatura
                              (hero, categorias, cards, plataformas, planos)
  css/explore.css ........... estilos SÓ do explore (grade de cards, filtros)
  css/filme.css ............. estilos SÓ da página do filme
                              (trailer, onde assistir, elenco, avaliações)
  css/admin.css ............. estilos SÓ dos painéis admin/empresa (tabelas,
                              badges, estatísticas, modal de filme)
  css/login.css ............. estilos SÓ do login
  js/dados-filmes.js ........ BANCO DE DADOS local (lista "filmesData", 10
                              filmes). É o único lugar com dados de filme.
  js/app.js ................. comportamentos COMPARTILHADOS de todas as
                              páginas (sidebar, avatar, configurações, tema,
                              busca do topo). Carregado em todas as páginas.
  js/index.js ............... lógica SÓ da home e da assinatura
  js/explore.js ............. lógica SÓ do explore (filtros)
  js/filme.js ............... lógica SÓ da página do filme
  js/admin.js ............... lógica SÓ do painel do administrador
  js/empresa.js ............. lógica SÓ do painel da empresa
  js/login.js ............... lógica SÓ do login
  assets/ ................... imagens e fontes (img-filmes, img-hero,
                              img-elenco, img_class, img-logos, logos, fonts)

3. FLUXO DE DADOS (como as páginas se conversam)
------------------------------------------------
  js/dados-filmes.js é a fonte única. Cada filme tem um "id" (slug), ex.:
  "duna-parte-2". As páginas nunca chamam a API TMDB em tempo de uso.

  HOME (index.html + js/index.js)
    - Lê "filmesData".
    - Separa por campo "secao": "recomendados" vai no carrossel
      "Recomendados para você"; o restante vai em "Mais Assistidos".
    - Clicar num card abre filme.html?id=<id>.
    - Clicar numa categoria abre explore.html?genero=<nome>.
    - Clicar num plano salva a escolha no navegador (localStorage).

  EXPLORE (explore.html + js/explore.js)
    - Lê "filmesData" e monta as opções dos filtros sozinha (gêneros,
      classificações, anos, notas, streamings) — é a versão em JS da
      lógica do gerar_dados_filmes.py.
    - Botão "aplicar" filtra; "apagar" limpa. Aceita ?q= (busca do topo)
      e ?genero= (categorias da home) direto na URL.
    - Coração salva favorito no navegador; X remove o card da tela;
      clicar na imagem abre filme.html?id=<id>.

  FILME (filme.html + js/filme.js)
    - Lê o ?id= da URL e procura o filme em "filmesData".
    - Monta trailer (clicar troca a capa pelo player do YouTube),
      nota, classificação, duração, gêneros, onde assistir, relacionados
      (puxa os dados dos filmes vizinhos) e elenco.
    - Avaliações: 2 fixas de exemplo + as que o visitante publicar
      (formulário "Deixe sua avaliação", salvo no navegador por filme).

  CHROME COMPARTILHADO (js/app.js, todas as páginas)
    - Botão de menu abre/fecha a sidebar; avatar abre o menu suspenso;
      "Configurações"/"Ajustes" abre o modal (abas trocam o título);
      "Escuro/Claro" troca o tema e lembra a escolha (localStorage);
      busca do topo leva para explore.html?q=<texto>.

  ADMIN (admin.html + js/admin.js)
    - 4 blocos: empresas pendentes, filmes pendentes, catálogo (lê
      "filmesData", com adicionar/editar/remover via modal) e moderação
      de comentários. Dados de exemplo em memória (somem ao recarregar);
      no sistema final virão do banco (tabelas Empresa, Filme,
      Avaliacao_Usuario).

  EMPRESA (empresa.html + js/empresa.js)
    - "Meus filmes" (cadastrar/editar/remover; novo cadastro entra como
      "pendente") + "Desempenho por filme" (visualizações, avaliações,
      nota média) + 4 cartões de estatística. Também em memória.

  LOGIN (login.html + js/login.js)
    - Olho mostra/oculta a senha; ao enviar, confere o perfil e
      redireciona (ver credenciais no item 1).

4. DE ONDE VIERAM OS DADOS (TMDB)
---------------------------------
  gerar_dados_filmes.py busca título, ano, gêneros, sinopse, nota,
  classificação brasileira, streaming no Brasil e trailer no YouTube,
  usando a API da TMDB, e grava js/dados-filmes.js. Passos:
    1. pip install requests
    2. Colocar o token TMDB (v4, começa com "eyJ...") em TMDB_TOKEN
    3. Dentro da pasta pipoquetas/, rodar: python gerar_dados_filmes.py
  Campos de curadoria local (duracao, elenco, ondeAssistir, relacionados,
  numAvaliacoes) NÃO vêm da API: após regenerar, mesclar de volta a partir
  da cópia atual de js/dados-filmes.js. O filme "Duna: Parte 2" já está
  corrigido aqui (a busca antiga retornava um documentário errado).

5. O QUE FOI UNIFICADO (de onde veio cada parte)
------------------------------------------------
  - Visual (fundo, header, sidebar, footer): index do diretório vish2.
  - Planos PipoPlus+: assinatura.html do vish2 + seção de planos do vish.
  - Explore com filtros funcionais e footer: versão do diretório
    "Pipoquetas-explore MATHEUS" (a dos outros diretórios usava layout
    antigo e apontava para um explore.js inexistente).
  - Página de filme única: fusão das 4 pastas de filme (dune2,
    interstellar, blade_runner2049, matrix_ressurection) — mesmo layout,
    dados por filme agora em js/dados-filmes.js.
  - Admin, empresa, login e dados TMDB: diretório vish (Pipoquetas-main
    era cópia quase idêntica e foi descartado sem perda).
  - index_dark.html duplicado: removido; o tema escuro agora é o botão
    Escuro/Claro das Configurações (css/base.css, bloco "Tema escuro").
  - 2 chaves "}" que faltavam nos CSS herdados foram fechadas
    (explore.css e filme.css, blocos @media finais).

6. MANUTENÇÃO RÁPIDA
--------------------
  Trocar um pôster .......... assets/img-filmes/ + campo "imagem" em
                              js/dados-filmes.js
  Adicionar filme ........... novo objeto em js/dados-filmes.js com "id"
                              único + "secao" (recomendados ou
                              mais-assistidos); detalhe completo
                              (trailer/elenco/ondeAssistir) é opcional
  Mudar cor/fundo ........... css/base.css (afeta todas as páginas)
  Mudar só a home ........... css/index.css + js/index.js
  Filtros do explore ........ js/explore.js (função aplicarFiltros)
