PIPOQUETAS — PROJETO INTEGRADOR
================================
Site de filmes (catálogo, favoritos, listas de interesse, playlists e avaliações) com
front-end em HTML/CSS/JS (jQuery) e back-end em PHP com banco de dados.

1. COMO ABRIR O SITE
--------------------
O site usa uma API (PHP + banco de dados), então ele precisa ser aberto por um servidor
local — não dá para abrir o index.html direto com duplo clique.

   Opção A (recomendada, sem instalar nada):
     1. Dê dois cliques em INICIAR.bat
     2. Ele sobe o servidor em http://localhost:8080 e abre o navegador nessa página
     3. Para parar, feche a janela preta do servidor

   Opção B (XAMPP):
     1. Ligue o Apache no XAMPP
     2. Abra http://localhost/ajax/Pipoquetas-ref/index.html
        (o PHP do XAMPP já serve a API e o banco)

   Sem o PHP (ou sem o servidor) o catálogo continua abrindo, mas login, favoritos,
   playlists, notificações e avaliações não funcionam (aparece um aviso na tela).

   Contas de demonstração (senha 123456):
     usuario        -> index.html     (perfil comum)
     empresa        -> empresa.html   (painel da empresa)
     administrador  -> admin.html     (painel do administrador)
   Código para criar administrador: PIPOQUETAS-ADMIN (js/login.js / api/rotas/auth.php)

2. BANCO DE DADOS
-----------------
O driver é escolhido sozinho:
   - MySQL do XAMPP (cria o banco "pipoquetas" se o serviço estiver ligado);
   - senão SQLite em dados/pipoquetas.sqlite (arquivo, sem instalar nada).
Para forçar um deles, rode o servidor com a variável PIPOQUETAS_DB=mysql (ou sqlite).

Tabelas (criadas na primeira execução — api/db.php):
   usuarios         id, tipo, nome, usuario, email, senha_hash, cnpj, nascimento, status, criado_em
   sessoes          token, usuario_id, criado_em, expira_em        (sessão do login)
   filmes           id, titulo, ano, duracao, generos, classificacao, nota, num_avaliacoes,
                    plataforma, imagem, sinopse, trailer_youtube_id, elenco, onde_assistir,
                    relacionados, diretores, secao, empresa_id, status, criado_em
   playlists        id, usuario_id, nome, descricao, icone, privacidade, obrigatoria, tipo,
                    criado_em, atualizado_em
   playlist_itens   id, playlist_id, filme_id, criado_em   (UNIQUE playlist_id + filme_id)
   avaliacoes       id, filme_id, usuario_id, nota, texto, criado_em (UNIQUE filme_id + usuario_id)
   notificacoes     id, usuario_id, tipo, icone, imagem, titulo, descricao, link, lida, criado_em

Regras garantidas pelo banco e pela API:
   - cada usuário nasce com as duas playlists obrigatórias (Favoritos e Lista de Interesses);
   - as playlists obrigatórias não podem ser excluídas;
   - o mesmo filme não entra duas vezes na mesma playlist;
   - o mesmo usuário avalia cada filme uma única vez;
   - toda rota que exige login confere o token da sessão no servidor (401) e a
     propriedade/privacidade do recurso (403).

3. ESTRUTURA DE PASTAS
-----------------------
   index.html ................ home (vitrine, carrosséis, plataformas, planos)
   explore.html .............. catálogo com filtros de busca
   filme.html ................ detalhe do filme (dinâmica, usa ?id= na URL)
   favoritos.html ........... lista de favoritos (modelo da 3ª imagem de referência)
   lista-interesses.html ..... lista de interesses (4ª imagem de referência)
   playlists.html ........... biblioteca de playlists + modal de criação (5ª e 6ª imagens)
   playlist.html ............ página de uma playlist personalizada (?id=) (7ª imagem)
   notificacoes.html ........ todas as notificações
   assinatura.html ........... planos PipoPlus+ (Bronze/Prata/Ouro)
   admin.html ................ painel do administrador (aprovações e catálogo)
   empresa.html .............. painel da empresa (meus filmes e desempenho)
   login.html ................ tela de entrar
   api/ ..................... back-end (PHP)
     index.php ................ roteador (api/index.php?r=<rota>)
     db.php ................... conexão, esquema e carga inicial
     auth.php ................. sessão (token), autorização e respostas JSON
     rotas/ ................... auth, playlists, avaliacoes, notificacoes, filmes, admin
   dados/filmes.json ......... catálogo (mesma fonte do js/dados-filmes.js)
   css/base.css .............. estilos COMPARTILHADOS (fundo, header, sidebar, footer,
                               menu do avatar, modal de configurações, tema escuro)
   css/index.css ............. estilos SÓ da home e da assinatura
   css/explore.css ........... estilos SÓ do explore (grade de cards, filtros)
   css/filme.css ............. estilos SÓ da página do filme
   css/admin.css ............. estilos SÓ dos painéis admin/empresa
   css/login.css ............. estilos SÓ do login
   css/notificacoes.css ...... estilos do painel de notificações
   css/playlists.css ......... favoritos, lista de interesses, biblioteca e playlist
   js/jquery.min.js ......... jQuery 3.7.1
   js/dados-filmes.js ........ catálogo em JS (usado por index, explore e filme)
   js/api.js ................. cliente da API (única porta de entrada para o back-end)
   js/app.js ................. comportamentos COMPARTILHADOS (sidebar, avatar, configurações,
                               tema, busca, estado de login)
   js/notificacoes.js ........ painel de notificações do header
   js/playlists-comum.js ..... partes compartilhadas das páginas de playlist
   js/index.js ............... lógica SÓ da home e da assinatura
   js/explore.js ............. lógica SÓ do explore (filtros, coração e bandeira)
   js/filme.js ............... lógica SÓ da página do filme (avaliações)
   js/favoritos.js ........... lógica SÓ da página de favoritos
   js/lista-interesses.js .... lógica SÓ da página da lista de interesses
   js/playlists.js ........... lógica SÓ da biblioteca de playlists
   js/playlist.js ............ lógica SÓ da página de uma playlist
   js/admin.js ............... lógica SÓ do painel do administrador
   js/empresa.js ............. lógica SÓ do painel da empresa
   js/login.js ............... lógica SÓ do login

4. FLUXO DE DADOS (como as páginas se conversam)
-------------------------------------------------
   O navegador fala com api/index.php?r=<rota> por meio de js/api.js. A sessão é um token
   guardado no navegador (localStorage) que vai no cabeçalho X-Pipoquetas-Token e é
   conferido no servidor a cada requisição.

   Rotas principais:
     GET  /api/eu                                  quem está logado
     POST /api/login | /api/logout | /api/cadastro | /api/esqueci-senha | /api/redefinir-senha
     GET  /api/filmes | /api/filmes/catalogo       catálogo (admin/empresa) e catálogo público
     GET  /api/filmes/{id}/avaliacoes              média, quantidade e avaliações do filme
     POST /api/filmes/{id}/avaliacoes              publica/atualiza a avaliação (só logado)
     GET  /api/playlists                           playlists do usuário (com total de filmes)
     POST /api/playlists                           cria playlist personalizada
     GET  /api/playlists/{id}                      playlist + filmes
     PUT  /api/playlists/{id}                      edita
     DELETE /api/playlists/{id}                    exclui (não vale para as obrigatórias)
     POST /api/playlists/{id}/itens                adiciona filme
     DELETE /api/playlists/{id}/itens/{filmeId}    remove filme
     GET/POST /api/favoritos[/{filmeId}]           favoritos (a playlist "favoritos")
     GET/POST /api/lista-interesses[/{filmeId}]    lista de interesses
     GET  /api/notificacoes                        notificações do usuário
     POST /api/notificacoes/{id}/lida | /ler-todas marca como lida
     GET  /api/admin/empresas                      empresas aguardando aprovação
     POST /api/admin/empresas/{id}/aprovar|recusar
     POST /api/admin/filmes/{id}/aprovar|recusar

   MENU LATERAL (todas as páginas)
     - logado: Início, Explore, Assistir Depois, Favoritos, Lista de Interesses, Playlists,
       PipoPlus+, Configurações e Sair;
     - deslogado: só Início e Explore; ao abrir o menu aparece o bloco "Para Mais Recursos"
       com Criar Conta / Iniciar Sessão (1ª imagem de referência).

   NOTIFICAÇÕES (2ª imagem de referência)
     Sino no header > painel vermelho com ícone, texto, horário e bolinha de "não lida";
     clicar no item abre o conteúdo relacionado; "Mostrar todas as notificações" leva para
     notificacoes.html. Só funciona com a conta logada.

5. DE ONDE VIERAM OS DADOS (TMDB)
---------------------------------
   gerar_dados_filmes.py busca título, ano, gêneros, sinopse, nota, classificação
   brasileira, streaming no Brasil e trailer no YouTube, usando a API da TMDB, e grava
   js/dados-filmes.js. Passos:
     1. pip install requests
     2. Colocar o token TMDB (v4, começa com "eyJ...") em TMDB_TOKEN
     3. Dentro da pasta pipoquetas/, rodar: python gerar_dados_filmes.py
   Campos de curadoria local (duracao, elenco, ondeAssistir, relacionados, numAvaliacoes)
   NÃO vêm da API: após regenerar, mesclar de volta a partir da cópia atual de
   js/dados-filmes.js. O catálogo do banco (tabela filmes) é montado a partir de
   dados/filmes.json, que é a mesma fonte.

6. MANUTENÇÃO RÁPIDA
--------------------
   Trocar um pôster .......... assets/img-filmes/ + campo "imagem" em dados/filmes.json
   Adicionar filme ........... novo objeto em dados/filmes.json com "id" único
   Mudar cor/fundo ........... css/base.css (afeta todas as páginas)
   Mudar só a home ........... css/index.css + js/index.js
   Filtros do explore ........ js/explore.js (função aplicarFiltros)
   Playlists e favoritos .... js/playlists-comum.js + js/favoritos.js + js/playlists.js
   Notificações ............. js/notificacoes.js + css/notificacoes.css
   Regras do banco ........... api/db.php (esquema e carga inicial)
