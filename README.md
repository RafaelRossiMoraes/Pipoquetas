# Pipoquetas

Aplicação web de catálogo de filmes com recursos sociais: favoritos, lista de interesses
(“assistir depois”), playlists personalizadas, avaliações com estrelas e comentários,
painel para empresas distribuidoras e painel administrativo com aprovação de empresas e
filmes.

O projeto foi desenvolvido no contexto do **Projeto Integrador** do curso técnico
(identificado no rodapé das páginas como **2DSB**), com autoria indicada de Rafael Rossi,
Vitor Nunes, Rhian Victor e Matheus Gonçalves. Esta documentação foi produzida a partir da
leitura do código e da inspeção do banco de dados efetivamente presentes no repositório.

> **Última atualização desta documentação:** 13/11/2026.
>
> O arquivo `readme.txt` foi preservado por ser referenciado pela própria interface
> (Configurações → Ajuda), mas contém trechos desatualizados. **Este `README.md` é a
> referência principal.**

---

## Sumário

1. [Apresentação do projeto](#1-apresentação-do-projeto)
2. [Tecnologias utilizadas](#2-tecnologias-utilizadas)
3. [Funcionalidades](#3-funcionalidades)
4. [Estrutura do projeto](#4-estrutura-do-projeto)
5. [Banco de dados](#5-banco-de-dados)
6. [Instalação e execução](#6-instalação-e-execução)
7. [Documentação detalhada](#7-documentação-detalhada)
8. [Observações adicionais](#8-observações-adicionais)

---

## 1. Apresentação do projeto

### 1.1 O que é a Pipoquetas

A Pipoquetas é uma aplicação web monolítica, executada em navegador, que reúne:

- uma **vitrine de filmes** com destaques, categorias e carrosséis;
- um **catálogo pesquisável** com filtros por gênero, classificação indicativa, ano,
  nota e plataforma de streaming;
- uma **página de detalhe** com trailer do YouTube, elenco, onde assistir, filmes
  relacionados e avaliações;
- **listas pessoais** (Favoritos e Lista de Interesses) e **playlists personalizadas**;
- **avaliações** de 1 a 5 estrelas com comentário;
- **painel da empresa** para cadastrar e acompanhar filmes;
- **painel do administrador** para aprovar empresas e filmes e gerenciar o catálogo.

O nome “Pipoquetas” é uma referência lúdica a pipoca e ao ato de assistir filmes.

### 1.2 Objetivo principal

Centralizar, em uma única interface, a descoberta de filmes e a organização da experiência
do espectador, ao mesmo tempo em que oferece às distribuidoras um canal para cadastrar
produções e ao administrador um mecanismo de curadoria e moderação.

### 1.3 Problema que a aplicação busca solucionar

O projeto parte de três necessidades práticas:

1. **Dispersão da informação**: o espectador precisa consultar vários serviços para saber
   onde um filme está disponível, quem dirigiu, qual o elenco e qual a classificação.
2. **Falta de organização pessoal**: favoritos e listas de “quero assistir” costumam ficar
   espalhados em anotações, abas ou serviços diferentes.
3. **Ausência de curadoria**: catálogos abertos precisam de um fluxo em que empresas
   cadastrem títulos e um administrador aprove o que entra no catálogo público.

### 1.4 Público-alvo

- **Visitantes** que querem navegar pelo catálogo sem criar conta.
- **Clientes** que desejam salvar favoritos, montar listas e avaliar filmes.
- **Empresas distribuidoras** que precisam cadastrar e acompanhar seus títulos.
- **Administradores** responsáveis pela curadoria, aprovação e manutenção do catálogo.

### 1.5 Contexto de utilização

A aplicação foi pensada para execução **local**, em ambiente Windows, com PHP e banco de
dados. Não há infraestrutura de produção, autenticação externa, envio de e-mail ou
cobrança real implementados. O foco é demonstrar, de ponta a ponta, o fluxo de uma
plataforma de catálogo colaborativo.

---

## 2. Tecnologias utilizadas

### 2.1 Linguagens

| Camada | Tecnologia |
|---|---|
| Marcação | HTML5 |
| Estilo | CSS3 (folhas próprias, sem framework) |
| Comportamento no navegador | JavaScript (majoritariamente ES5, com `URLSearchParams`, `FileReader`, `localStorage`, `sessionStorage`) |
| Back-end | PHP 8 (sem framework, com PDO) |
| Banco de dados | SQLite 3 (padrão) ou MySQL/MariaDB (XAMPP) |
| Script auxiliar | Python 3 (opcional, apenas para gerar o catálogo via TMDB) |
| Automação local | Windows Batch (`INICIAR.bat`) e PowerShell (`servidor.ps1`) |

### 2.2 Front-end

- **jQuery 3.7.1** local (`js/jquery.min.js`), usado para DOM, eventos, AJAX e animações.
- **Font Awesome 6.4/6.5** carregado por CDN (`cdnjs.cloudflare.com`) para os ícones.
- **CSS próprio**, dividido por página:
  - `css/base.css` — fundo, header, sidebar, footer, dropdown, modal de configurações,
    tema claro/escuro e comportamento convidado × logado;
  - `css/index.css` — home e página de planos;
  - `css/explore.css` — grade de cards e filtros;
  - `css/filme.css` — página de detalhe;
  - `css/playlists.css` — favoritos, lista de interesses, biblioteca e playlist;
  - `css/admin.css` — painéis de administrador e empresa;
  - `css/login.css` — tela de autenticação.
- **Catálogo em JavaScript** (`js/dados-filmes.js`) com 75 filmes embutidos, usado pela
  home, pelo Explore e pela página de filme.
- **Cliente de API próprio** (`js/api.js`), que centraliza as chamadas ao back-end.

Não há React, Vue, Angular, Bootstrap, Tailwind, Webpack, Vite, npm ou Composer.

### 2.3 Back-end

- PHP com **PDO** e *prepared statements*.
- Roteamento manual por *front controller*: `api/index.php?r=<rota>`.
- Sessão própria baseada em **token opaco** persistido na tabela `sessoes`, enviado no
  cabeçalho `X-Pipoquetas-Token`.
- Respostas em **JSON** (`Content-Type: application/json; charset=utf-8`).
- Nenhum framework (Laravel, Symfony, Slim etc.) e nenhuma biblioteca PHP externa.

### 2.4 Banco de dados

- **SQLite 3**: arquivo `dados/pipoquetas.sqlite`, com `PRAGMA foreign_keys = ON`,
  `journal_mode = WAL`, `synchronous = NORMAL` e `busy_timeout = 5000`.
- **MySQL/MariaDB** (XAMPP): banco `pipoquetas`, charset `utf8mb4`, collation
  `utf8mb4_unicode_ci`, criado automaticamente quando o serviço está disponível.
- O driver é escolhido em tempo de execução (detalhes na seção 6.4).
- O esquema é criado e a carga inicial é aplicada na primeira execução, de forma
  idempotente e versionada (`pipo_meta`).

### 2.5 Bibliotecas, frameworks e serviços externos

| Serviço/recurso | Uso | Dependência em tempo de execução? |
|---|---|---|
| jQuery 3.7.1 | DOM e AJAX | Sim (arquivo local) |
| Font Awesome (CDN) | Ícones | Sim (CDN) |
| YouTube Embed | Trailer na página do filme | Sim (quando o usuário clica em reproduzir) |
| TMDB API v3 | Geração do catálogo pelo script Python | Não (apenas em lote, offline) |
| `image.tmdb.org` | Fotos de elenco e logos de streaming referenciados no catálogo | Sim, para os itens que usam URL remota |
| Sites das plataformas de streaming | Links “Onde Assistir” | Sim, ao clicar |
| XAMPP (Apache/MySQL/PHP) | Ambiente opcional de execução | Opcional |
| Python + `requests` | Script `gerar_dados_filmes.py` | Opcional |

---

## 3. Funcionalidades

As funcionalidades abaixo estão organizadas por tipo de usuário. A coluna “Situação”
diferencia o que está implementado do que é apenas parcial ou visual.

### 3.1 Visitante (não autenticado)

| Funcionalidade | Descrição | Situação |
|---|---|---|
| Home | Hero com três slides (troca a cada 10 s), categorias, carrossel “Recomendados para você”, carrossel “Mais Assistidos”, faixa de plataformas e rodapé | Implementado |
| Explore | Grade de filmes com filtros de gênero, classificação, ano, nota e streaming, busca por texto e botão “Carregar mais” (lotes de 24) | Implementado |
| Detalhe do filme | Sinopse, ano, duração, classificação, gêneros, trailer do YouTube, elenco, onde assistir e relacionados, via `filme.html?id=<slug>` | Implementado |
| Avaliações | Leitura da média, quantidade e lista de avaliações | Implementado |
| Planos PipoPlus+ | Página com os planos Bronze, Prata e Ouro | Apenas visual |
| Tema claro/escuro | Alternância no modal de configurações, persistida no navegador | Implementado |
| Cadastro e login | Formulários de entrada, cadastro de cliente/empresa e recuperação de senha | Implementado |
| Favoritos, listas e playlists | Bloqueados; a interface convida a entrar | Implementado (restrição) |

O visitante **não** consegue favoritar, avaliar, criar playlists ou acessar painéis.

### 3.2 Cliente (tipo de conta `usuario`)

Além de tudo o que o visitante acessa:

| Funcionalidade | Descrição | Situação |
|---|---|---|
| Favoritos | Playlist obrigatória `favoritos`; botão de coração no Explore e na página de detalhe | Implementado |
| Lista de Interesses | Playlist obrigatória `lista-interesses` (“Assistir Depois”); botão de bandeira | Implementado |
| Playlists personalizadas | Criar, editar, excluir, escolher ícone e privacidade, adicionar/remover filmes | Implementado |
| Biblioteca de playlists | Lista as duas obrigatórias e as personalizadas, com total de filmes | Implementado |
| Avaliar filmes | Nota de 1 a 5 e comentário; uma avaliação por filme, com atualização | Implementado |
| Histórico de avaliações | Aba “Avaliações” no modal de configurações | Implementado |
| Alterar senha | Aba “Segurança”, exige a senha atual | Implementado |
| Dados da conta | Nome, e-mail, tipo, data de cadastro e nascimento (somente leitura) | Implementado |
| Notificações | API e tabela existem, mas não há sino nem página de notificações na interface atual | Parcial |
| Perfil | Não há edição de nome, e-mail, foto ou exclusão de conta | Não implementado |

### 3.3 Empresa (tipo de conta `empresa`)

| Funcionalidade | Descrição | Situação |
|---|---|---|
| Cadastro | Auto-cadastro com CNPJ; a conta nasce com status `pendente` | Implementado |
| Login | Somente após aprovação do administrador | Implementado |
| Painel | Indicadores: filmes cadastrados, pendentes, visualizações e avaliação média | Implementado (visualizações sempre 0) |
| Meus Filmes | Lista apenas os filmes da própria empresa, com status | Implementado |
| Cadastrar filme | Título, ano, classificação, gêneros, plataforma, sinopse e imagem; entra como `pendente` | Implementado |
| Editar filme | Edita os campos do formulário; qualquer edição volta o filme para `pendente` | Implementado |
| Excluir filme | Remove o filme e, por cascata, itens de playlist e avaliações | Implementado |
| Upload de imagem | JPG, PNG, WEBP ou GIF até 4 MB; grava em `assets/img-filmes/uploads/` | Implementado |
| Desempenho | Quantidade real de avaliações e média real por filme | Implementado |
| Preço | Campo existe no formulário, mas não é persistido nem devolvido pela API | Parcial |
| Recursos de cliente | A API permite que uma conta de empresa use favoritos, playlists e avaliações, embora o painel não exponha esses atalhos | Implementado tecnicamente |

### 3.4 Administrador (tipo de conta `administrador`)

| Funcionalidade | Descrição | Situação |
|---|---|---|
| Painel | Indicadores de empresas pendentes, filmes pendentes, catálogo e comentários | Implementado |
| Aprovar/recusar empresas | Lista empresas com status `pendente` e altera para `ativo` ou `recusado` | Implementado |
| Aprovar/recusar filmes | Lista filmes `pendente` e altera para `aprovado` ou `recusado` | Implementado |
| Catálogo | Lista todos os filmes, com edição e remoção | Implementado |
| Adicionar filme | Cadastra filme diretamente como `aprovado`, sem empresa associada | Implementado |
| Moderação de comentários | Tabela com dois comentários de exemplo em memória; remover apenas apaga da tela | Apenas visual |
| Upload de imagem | Mesmo fluxo da empresa | Implementado |
| Gestão de usuários | Não há tela para editar, excluir ou promover usuários | Não implementado |

O administrador **não** é criado pelo formulário público. A carga inicial cria a conta
`administrador`; novas contas administrativas exigiriam procedimento interno no banco.

### 3.5 Funcionalidades transversais

- **Busca no header**: envia `explore.html?q=<texto>` e filtra título + sinopse.
- **Sidebar responsiva**: botão hambúrguer, overlay e menu lateral.
- **Menu do avatar**: opções mudam conforme o tipo de conta.
- **Modal de configurações**: abas Conta, Privacidade, Informações, Segurança, Ajuda e
  Avaliações (esta última criada dinamicamente).
- **Sessão em cache**: o usuário é pintado na tela com `sessionStorage` por até 5 minutos
  e revalidado em seguida por `GET /api/eu`.
- **Tema**: claro/escuro, persistido em `localStorage` na chave `pipoquetas-tema`.
- **Avisos flutuantes**: componente `#pipoAviso` para mensagens e erros.
- **Migração legada**: contas antigas em `localStorage` (`pipo_clientes`) são importadas
  uma única vez para o banco.
- **Exportação de cadastros**: botão “Baixar clientes.json” na tela de login.

### 3.6 Funcionalidades parciais ou ausentes (importante)

Estas situações foram confirmadas no código e não devem ser confundidas com
funcionalidades prontas:

1. **Notificações**: existem a tabela `notificacoes`, a carga inicial, as rotas
   `GET /api/notificacoes` e `POST /api/notificacoes/{id}/lida|ler-todas`, e o contador
   `nao_lidas` em `/api/eu`. Porém **não existe** `notificacoes.html`, sino no header,
   `#notifBadge` em qualquer página, `js/notificacoes.js` ou `css/notificacoes.css`.
   O `readme.txt` antigo cita esses arquivos, mas eles não estão no projeto.
2. **Assinaturas**: a página `assinatura.html` exibe três planos; o clique apenas grava
   a escolha em `localStorage` (`pipoquetas-plano`). Não há tabela, cobrança, checkout ou
   associação do plano à conta.
3. **Moderação de comentários**: `js/admin.js` usa um vetor local `comentariosData` com
   dois exemplos. Não há rota de listagem/remoção de avaliações para o administrador.
4. **Edição de perfil**: o modal mostra os dados, mas não há endpoint para alterar nome,
   e-mail, foto ou senha fora da aba Segurança.
5. **Envio de e-mail**: a recuperação de senha gera um código de 6 dígitos e o devolve na
   própria resposta JSON (“modo demonstração”); nenhum e-mail é enviado.
6. **Métrica de visualizações**: a API devolve `visualizacoes: 0` fixo para todo filme.
7. **Campos avançados de filme**: trailer, elenco, onde assistir, relacionados, duração e
   diretores não são editáveis pelos painéis; só existem nos filmes da carga inicial
   (trailer em 65 e duração em 69).
8. **Filmes cadastrados pelos painéis**: entram no banco e no catálogo usado pelas
   playlists, mas **não aparecem** na home, no Explore nem na página de detalhe, porque
   essas telas leem `js/dados-filmes.js`, e não a API.
9. **Preço do filme**: o formulário da empresa envia `preco`, mas o back-end ignora.
10. **Playlists obrigatórias**: não podem ser excluídas, mas a API permite editar nome,
    descrição, ícone e privacidade; a interface esconde a opção de edição.
11. **Playlists públicas**: só podem ser abertas por outro **usuário autenticado**; não há
    acesso anônimo a playlist pública.
12. **Exclusão de conta**: não existe.

---

## 4. Estrutura do projeto

```
Pipoquetas-1.1 temp/
├── INICIAR.bat                  Atalho Windows: executa servidor.ps1
├── servidor.ps1                 Sobe o PHP embutido em http://localhost:8080
├── servidor-router.php          Roteador do servidor embutido (cache, gzip, bloqueios)
├── readme.txt                   Guia antigo (parcialmente desatualizado)
├── requirements.txt             Dependência do script Python (requests)
├── gerar_dados_filmes.py        Gera dados/filmes.json e js/dados-filmes.js via TMDB
│
├── index.html                   Home
├── explore.html                 Catálogo com filtros
├── filme.html                   Detalhe do filme (?id=<slug>)
├── favoritos.html               Playlist obrigatória de favoritos
├── lista-interesses.html        Playlist obrigatória “Assistir Depois”
├── playlists.html               Biblioteca de playlists + modal de criação
├── playlist.html                Playlist personalizada (?id=<id>)
├── assinatura.html              Planos PipoPlus+
├── login.html                   Login, cadastro e recuperação de senha
├── admin.html                   Painel do administrador
├── empresa.html                 Painel da empresa
│
├── api/
│   ├── index.php                Front controller: api/index.php?r=<rota>
│   ├── db.php                   Conexão, esquema, índices, carga inicial, senhas
│   ├── auth.php                 Token, autorização e respostas JSON
│   └── rotas/
│       ├── auth.php             /eu, /login, /logout, /cadastro, /esqueci-senha,
│       │                        /redefinir-senha, /perfil/senha, /clientes/*
│       ├── filmes.php           /filmes, /filmes/catalogo, /filmes/upload,
│       │                        /filmes/{id}, /filmes/{id}/avaliacoes
│       ├── playlists.php        /playlists, /favoritos, /lista-interesses
│       ├── avaliacoes.php       Avaliações e /minhas-avaliacoes
│       ├── notificacoes.php     /notificacoes
│       └── admin.php            /admin/empresas, /admin/filmes
│
├── js/
│   ├── jquery.min.js            jQuery 3.7.1
│   ├── api.js                   Cliente HTTP, token, migração, avisos
│   ├── app.js                   Header, sidebar, configurações, tema, sessão, gêneros
│   ├── dados-filmes.js          Catálogo local (75 filmes) usado pela UI
│   ├── index.js                 Home e seleção de plano
│   ├── explore.js               Filtros, busca, favoritar/lista, paginação
│   ├── filme.js                 Detalhe, trailer, avaliações
│   ├── favoritos.js             Página de favoritos
│   ├── lista-interesses.js      Página da lista de interesses
│   ├── playlists-comum.js       Ícones, linha de filme, lista vazia
│   ├── playlists.js             Biblioteca e CRUD de playlists
│   ├── playlist.js              Playlist individual e seletor de filmes
│   ├── admin.js                 Painel do administrador
│   ├── empresa.js               Painel da empresa
│   └── login.js                 Login, cadastro, recuperação
│
├── css/
│   ├── base.css                 Estilos compartilhados e tema
│   ├── index.css                Home e planos
│   ├── explore.css              Explore
│   ├── filme.css                Detalhe do filme
│   ├── playlists.css            Favoritos, listas e playlists
│   ├── admin.css                Painéis administrativos
│   └── login.css                Login
│
├── dados/
│   ├── filmes.json              Catálogo mestre (75 filmes)
│   ├── pipoquetas.sqlite        Banco SQLite (gerado/atualizado em execução)
│   └── .pipo_driver             Cache do driver escolhido (gerado em execução)
│
└── assets/
    ├── avatar.png, avatar2.png  Avatares padrão
    ├── bg-img.png               Imagem de fundo
    ├── fonts/                   Fonte Ethnocentric
    ├── img-filmes/              Pôsteres locais + placeholder.svg + uploads/
    ├── img-elenco/              Fotos locais de atores
    ├── img-hero/                Imagens do hero da home
    ├── img_class/               Indicadores de classificação (L, 10, 12, 14, 16, 18)
    ├── img-logos/               Logos locais de plataformas
    └── logos/                   Logotipos do projeto (branca e 2DSB)
```

### 4.1 Responsabilidade dos principais arquivos

- **`api/index.php`**: recebe `?r=`, divide a rota em segmentos, escolhe o módulo e o
  método HTTP. Não há `.htaccess`; o roteamento é por *query string*.
- **`api/db.php`**: decide MySQL × SQLite, abre a conexão PDO, cria tabelas e índices
  (`pipo_migrar`), aplica a carga inicial (`pipo_semear`) e implementa hash/verificação
  de senha.
- **`api/auth.php`**: lê o token, valida a sessão no banco, exige login/tipo, abre sessão e
  padroniza respostas JSON.
- **`api/rotas/*.php`**: regras de cada domínio (autenticação, filmes, playlists,
  avaliações, notificações, administração).
- **`js/api.js`**: única porta de entrada do front-end para a API; converte `/api/...` em
  `api/index.php?r=...`, injeta o token e trata erros/servidor fora do ar.
- **`js/app.js`**: comportamento global de todas as páginas (sidebar, avatar, modal de
  configurações, tema, busca, estado de login, gêneros e upload).
- **`js/dados-filmes.js`**: fonte do catálogo exibido na home, no Explore e no detalhe.
  É gerado pelo script Python e não consulta o banco.
- **`servidor-router.php`**: serve arquivos estáticos com ETag, gzip e cache; bloqueia
  `dados/`, dotfiles, `.sqlite`, `.bat`, `.ps1`, `.py` e `.log` quando o servidor é o PHP
  embutido.

---

## 5. Banco de dados

### 5.1 Visão geral

O banco tem **oito tabelas** (sete de domínio + uma de metadados):

| Tabela | Finalidade |
|---|---|
| `usuarios` | Contas de clientes, empresas e administradores (uma única tabela, discriminada por `tipo`) |
| `sessoes` | Tokens de login e códigos temporários de redefinição de senha |
| `filmes` | Catálogo, incluindo filmes da carga inicial e filmes cadastrados por empresas/admin |
| `playlists` | Playlists do usuário, incluindo as duas obrigatórias |
| `playlist_itens` | Tabela intermediária N:N entre playlists e filmes |
| `avaliacoes` | Avaliações (nota + comentário) de usuários sobre filmes |
| `notificacoes` | Notificações destinadas a um usuário |
| `pipo_meta` | Metadados internos (`schema_version`, `seed_version`) |

### 5.2 Entidades e relacionamentos (resumo)

- Um **usuário** pode ter várias **sessões**, várias **playlists**, várias **avaliações**
  e várias **notificações**.
- Uma **playlist** pertence a um único usuário e contém vários **filmes**, por meio de
  `playlist_itens`.
- Um **filme** pode estar em várias playlists e receber várias avaliações.
- Uma **avaliação** pertence a um único usuário e a um único filme; o par
  (`filme_id`, `usuario_id`) é único.
- Uma **empresa** é um registro de `usuarios` com `tipo = 'empresa'`; seus filmes são
  ligados por `filmes.empresa_id`. **Essa ligação não tem constraint de chave estrangeira**
  no banco; é garantida apenas pela aplicação.

O detalhamento completo, com dicionário de dados e lógica relacional, está em
[`DOCUMENTACAO_BANCO_DE_DADOS.txt`](DOCUMENTACAO_BANCO_DE_DADOS.txt).

### 5.3 Observações importantes

- Não existem tabelas separadas para cliente, empresa ou administrador, nem tabelas de
  gênero, elenco, diretor ou plataforma. Esses dados ficam em colunas `TEXT` com JSON
  dentro de `filmes`.
- `filmes.nota` e `filmes.num_avaliacoes` são metadados do catálogo (herdados da TMDB) e
  **não são recalculados** quando um usuário avalia. A média real é calculada na tabela
  `avaliacoes` e devolvida por `/api/filmes/{id}/avaliacoes`.
- O banco não usa transações explícitas; as operações são comandos isolados.
- Não há `CHECK` para nota, status, tipo ou privacidade; a validação é feita na API.

---

## 6. Instalação e execução

### 6.1 Pré-requisitos

**Obrigatório para a API:**

- PHP 8.x com as extensões `pdo_sqlite` (padrão) e, se for usar MySQL, `pdo_mysql`.
  O PHP do XAMPP já inclui ambas.
- Permissão de escrita na pasta `dados/` (SQLite) e em `assets/img-filmes/uploads/`
  (upload de imagens).

**Opcional:**

- MySQL/MariaDB do XAMPP, caso se queira usar MySQL em vez de SQLite.
- Python 3 + `requests`, apenas para regenerar o catálogo via TMDB.
- Navegador moderno com JavaScript habilitado.

**Não é necessário:** Composer, npm, Node.js, Apache (o PHP embutido basta) ou instalar
bibliotecas PHP.

### 6.2 Opção A — Windows, com `INICIAR.bat` (recomendada)

1. Dê dois cliques em **`INICIAR.bat`**.
2. O script executa `servidor.ps1`, que procura o PHP nesta ordem:
   - `..\..\..\php\php.exe` relativo à pasta do projeto;
   - `C:\xampp\php\php.exe`;
   - `%ProgramFiles%\xampp\php\php.exe`;
   - `%ProgramFiles(x86)%\xampp\php\php.exe`;
   - `%LOCALAPPDATA%\Programs\xampp\php\php.exe`;
   - `php` no `PATH`.
3. Se encontrar o PHP, sobe o servidor embutido em **`http://localhost:8080`** usando
   `servidor-router.php` e abre o navegador em `index.html`.
4. Para parar, feche a janela preta do servidor.

O `servidor.ps1` apaga `dados/.pipo_driver` a cada inicialização, forçando a reavaliação
do banco.

> Se o PHP não for encontrado, o script cai em **modo somente estático**: as páginas e o
> catálogo abrem, mas a API responde 503 e login, favoritos, playlists, avaliações e
> painéis não funcionam.

### 6.3 Opção B — XAMPP/Apache

1. Copie a pasta do projeto para dentro de `htdocs` (por exemplo,
   `C:\xampp\htdocs\pipoquetas`).
2. Inicie o **Apache** no painel do XAMPP. O **MySQL** é opcional.
3. Acesse `http://localhost/pipoquetas/index.html`.
4. O PHP do XAMPP executa `api/index.php` normalmente; `servidor-router.php` é ignorado
   nesse modo.

> **Atenção:** no Apache, o bloqueio de arquivos sensíveis feito por
> `servidor-router.php` **não se aplica**. A pasta `dados/` fica dentro do diretório web,
> e o arquivo `dados/pipoquetas.sqlite` pode ser baixado se não houver uma regra de
> negação no Apache. Para um ambiente exposto, configure `Require all denied` para
> `dados/` ou mantenha o projeto fora da raiz pública.

### 6.4 Configuração do banco de dados

O driver é escolhido automaticamente:

1. Se a variável de ambiente **`PIPOQUETAS_DB`** for `mysql` ou `sqlite`, ela é obedecida.
2. Caso contrário, o sistema lê o cache `dados/.pipo_driver`. Se o cache tiver menos de
   **1 hora**, usa o driver registrado.
3. Sem cache válido, testa a porta `127.0.0.1:3306` com timeout de 0,25 s. Se o MySQL
   responder e a conexão PDO funcionar, usa **MySQL** e cria o banco `pipoquetas`
   automaticamente. Caso contrário, usa **SQLite**.
4. O resultado é gravado em `dados/.pipo_driver` no formato
   `{"driver":"sqlite","verificado":<timestamp>}`.

**Forçar SQLite** (no Prompt de Comando, antes de abrir o site):

```bat
set PIPOQUETAS_DB=sqlite
INICIAR.bat
```

**Forçar MySQL** (com o serviço ligado):

```bat
set PIPOQUETAS_DB=mysql
INICIAR.bat
```

Em PowerShell:

```powershell
$env:PIPOQUETAS_DB = "sqlite"
.\servidor.ps1
```

Se `PIPOQUETAS_DB=mysql` for forçado e o MySQL estiver indisponível, a conexão falha e a
API retorna erro (não há fallback automático nesse caso).

**MySQL:** host `127.0.0.1`, porta `3306`, banco `pipoquetas`, charset `utf8mb4`. As
credenciais são fixas em `api/db.php` e não são reproduzidas nesta documentação.
Não há arquivo `.env`.

**SQLite:** arquivo `dados/pipoquetas.sqlite`. A pasta `dados/` precisa ser gravável.

### 6.5 Carga inicial e contas de demonstração

Na primeira execução, `api/db.php`:

- cria as oito tabelas e os índices;
- cria as contas de demonstração e os críticos usados nas avaliações de exemplo;
- importa os **75 filmes** de `dados/filmes.json`;
- cria as **duas playlists obrigatórias** para cada usuário;
- gera avaliações de exemplo (2 ou 3 por filme; os dois filmes com avaliação
  legada ficam apenas com ela);
- gera notificações de exemplo para as três contas de demonstração.

Contas de demonstração (o tipo é identificado automaticamente no login):

| Usuário | Tipo | Destino após o login |
|---|---|---|
| `usuario` | Cliente | `index.html` |
| `empresa` | Empresa | `empresa.html` |
| `administrador` | Administrador | `admin.html` |

A senha inicial dessas contas é a definida na função `pipo_semear_usuarios()` em
`api/db.php`. Por diretriz de segurança, ela não é reproduzida nesta documentação.

> **Administrador novo:** não há código de convite nem promoção pela interface. O
> `readme.txt` antigo menciona um código `PIPOQUETAS-ADMIN`, mas **esse código não existe**
> na implementação atual. Novas contas administrativas exigem inserção/atualização direta
> no banco ou procedimento interno.

### 6.6 Script Python (opcional) — regenerar o catálogo

O catálogo pode ser regenerado a partir da TMDB:

```bat
pip install -r requirements.txt
python gerar_dados_filmes.py
```

O script:

- lê a chave de `tmdb_chave.txt` (na raiz) ou da variável `TMDB_CHAVE`;
- busca filmes bem avaliados/populares, mantém os já existentes e completa até 75;
- baixa pôsteres para `assets/img-filmes/`;
- grava `dados/filmes.json` e `js/dados-filmes.js`.

**Ele não atualiza o banco.** Para refletir o novo catálogo no MySQL/SQLite, é necessário
reiniciar a carga inicial (ver 6.7) ou inserir os filmes manualmente. Como a carga só
insere filmes inexistentes, os já gravados não são sobrescritos.

### 6.7 Reiniciar o banco (procedimento destrutivo)

Para recriar o banco do zero:

1. Pare o servidor.
2. Faça backup de `dados/pipoquetas.sqlite` se precisar dos dados.
3. Apague `dados/pipoquetas.sqlite` (e, se existirem, `pipoquetas.sqlite-wal` e
   `pipoquetas.sqlite-shm`).
4. Inicie o servidor novamente.

A carga inicial roda de novo. Alternativamente, aumente `PIPO_ESQUEMA_VERSAO` /
`PIPO_SEED_VERSAO` em `api/db.php` — mas isso é alteração de código e não cobre mudanças
de colunas já existentes (não há migrações `ALTER TABLE`).

### 6.8 Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| “Não foi possível falar com o servidor” | Site aberto por `file://` ou PHP não iniciado | Use `INICIAR.bat` ou o Apache e acesse via `http://localhost` |
| Login, favoritos e playlists não funcionam | Modo somente estático (PHP não encontrado) | Instale/ajuste o PHP ou o XAMPP |
| Erro de conexão MySQL | `PIPOQUETAS_DB=mysql` forçado com serviço parado | Ligue o MySQL ou use `sqlite` |
| Banco “vazio” ou catálogo antigo | `seed_version` já está em 2 | Reinicie o banco (6.7) |
| Alterações de `filmes.json` não aparecem | O banco não é re-semeado e a UI usa `dados-filmes.js` | Regenere o JS e reinicie o banco |
| Upload falha | Pasta `assets/img-filmes/uploads` sem permissão ou imagem > 4 MB | Ajuste permissões / reduza a imagem |
| Porta 8080 ocupada | Outro processo usando a porta | Feche o processo ou altere `$porta` em `servidor.ps1` |

---

## 7. Documentação detalhada

| Documento | Conteúdo |
|---|---|
| [`DOCUMENTACAO_BANCO_DE_DADOS.txt`](DOCUMENTACAO_BANCO_DE_DADOS.txt) | Entidades, atributos, chaves, relacionamentos, integridade, índices, carga inicial e limitações do banco |
| [`ANALISE_DE_SISTEMAS.txt`](ANALISE_DE_SISTEMAS.txt) | Atores, permissões, requisitos funcionais e não funcionais, regras de negócio, fluxos e arquitetura |
| [`DOCUMENTACAO_ARMAZENAMENTO.txt`](DOCUMENTACAO_ARMAZENAMENTO.txt) | Onde cada dado/arquivo está armazenado, armazenamento local × externo, navegador, banco, uploads e mapeamento geral |

---

## 8. Observações adicionais

### 8.1 Manutenção rápida

| Tarefa | Onde mexer |
|---|---|
| Trocar um pôster | Substituir o arquivo em `assets/img-filmes/` e ajustar `imagem` em `dados/filmes.json` e `js/dados-filmes.js` |
| Adicionar filme ao catálogo estático | Novo objeto em `dados/filmes.json` e em `js/dados-filmes.js` com `id` único; depois reiniciar o banco |
| Mudar cores/fundo/tema | `css/base.css` (afeta todas as páginas) |
| Mudar só a home | `css/index.css` + `js/index.js` |
| Filtros do Explore | `js/explore.js` (função `aplicarFiltros`) |
| Favoritos/listas/playlists | `js/playlists-comum.js`, `js/favoritos.js`, `js/lista-interesses.js`, `js/playlists.js`, `js/playlist.js` |
| Regras do banco | `api/db.php` (esquema e carga) |
| Rotas e permissões | `api/index.php`, `api/auth.php`, `api/rotas/*.php` |
| Textos de configurações | `js/app.js` (função `montarPainelConfiguracoes`) |
| Planos | `assinatura.html` + `js/index.js` |

### 8.2 Dependências externas

- **Font Awesome via CDN**: se a CDN falhar, os ícones somem, mas o layout permanece.
- **YouTube**: o trailer só carrega com internet; em `file://`, abre em nova aba.
- **TMDB / `image.tmdb.org`**: fotos de elenco e logos de streaming remotos exigem
  internet. Os pôsteres dos 75 filmes são locais.
- **Sites de streaming**: os links “Onde Assistir” apontam para páginas externas.
- **PHP + PDO**: sem PHP, a API não funciona.

### 8.3 Configurações necessárias

- `dados/` gravável (SQLite).
- `assets/img-filmes/uploads/` gravável (upload).
- Porta 8080 livre (ou ajuste em `servidor.ps1`).
- PHP com `pdo_sqlite` e/ou `pdo_mysql`.
- Para o gerador: `tmdb_chave.txt` ou `TMDB_CHAVE`.
- Para MySQL: serviço na porta 3306 e credenciais compatíveis com as fixadas em
  `api/db.php`.

### 8.4 Limitações conhecidas

1. **Duplicação do catálogo**: `dados/filmes.json`, `js/dados-filmes.js` e a tabela
   `filmes` guardam a mesma informação em locais diferentes. A home, o Explore e o
   detalhe usam o JS; playlists, avaliações e painéis usam o banco.
2. **Filmes novos não aparecem na vitrine**: cadastrados por empresa/admin, entram no
   banco, mas não no `js/dados-filmes.js`. Consequentemente, `filme.html?id=<novo>` não
   encontra o filme e exibe o primeiro filme do catálogo.
3. **Duas noções de nota**: `filmes.nota` (metadado TMDB) e a média real de `avaliacoes`.
   A primeira não é atualizada quando alguém avalia.
4. **Notificações sem interface**: o módulo existe apenas no back-end.
5. **Assinaturas sem cobrança**: a seleção do plano é apenas visual/local.
6. **Moderação de comentários fictícia**: dois registros em memória, sem persistência.
7. **Sem edição de perfil** e sem exclusão de conta.
8. **Sem envio de e-mail**: o código de recuperação aparece na tela.
9. **Visualizações sempre 0**.
10. **Campos avançados de filme não editáveis** pelos painéis.
11. **Preço ignorado** pelo back-end.
12. **Edição de filme pela empresa volta para `pendente`** (inclusive filmes já aprovados).
13. **Playlist pública exige login** para ser vista.
14. **API permite editar playlists obrigatórias**, embora a UI esconda a opção.
15. **Sem CSRF, rate limiting, bloqueio por tentativas ou verificação de e-mail**.
16. **Endpoint de exportação de cadastros é público** (`GET /api/clientes/export`), sem
    autenticação; retorna todos os usuários sem senha.
17. **Sem transações explícitas**; operações compostas podem deixar estado parcial em caso
    de falha.
18. **Sem logs persistentes, métricas, testes automatizados ou migrações `ALTER TABLE`**.
19. **SQLite dentro da pasta web** no modo Apache, sem regra de bloqueio própria.
20. **`tmdb_chave.txt` não está no `.gitignore`**, apesar de o comentário do script afirmar
    que está. Se for criado, deve ser mantido fora do versionamento.
21. **`readme.txt` desatualizado**: cita `notificacoes.html`, `js/notificacoes.js`,
    `css/notificacoes.css` e o código `PIPOQUETAS-ADMIN`, que não existem; também usa um
    caminho fixo de XAMPP que pode não corresponder à instalação.

### 8.5 Segurança — resumo

**Pontos positivos implementados:**

- Senhas com `password_hash()` (bcrypt) e prefixo `bcrypt:`; suporte legado a `cyrb53:`.
- *Prepared statements* em todas as consultas.
- Token de sessão aleatório de 24 bytes (48 caracteres hex), validado no servidor.
- Sessões com expiração de 30 dias e exclusão do token expirado ao ser usado.
- Autorização por tipo de conta e por propriedade do recurso.
- Validação de upload por conteúdo real (`getimagesizefromstring`), extensão derivada do
  tipo, limite de 4 MB e caminho restrito a `assets/img-filmes/`.
- Escape de HTML (`esc()`) na maior parte das renderizações dinâmicas.
- Bloqueio de arquivos sensíveis no roteador do PHP embutido.

**Pontos de atenção:**

- Token em `localStorage` (vulnerável a XSS; não há cookie `HttpOnly`).
- Exportação pública de cadastros.
- Código de recuperação devolvido na resposta.
- Ausência de CSRF, rate limiting e verificação de e-mail.
- Credenciais de banco fixas no código.
- Ausência de HTTPS (ambiente local).
- Possível exposição de `dados/pipoquetas.sqlite` sob Apache.
- `filmes.empresa_id` sem chave estrangeira.
- Sem trilha de auditoria.

### 8.6 Sobre o `readme.txt`

O `readme.txt` foi mantido no repositório e é aberto pelo link “Abrir o guia do projeto”
no modal de Ajuda (`js/app.js`). Ele ainda é útil como histórico, mas **não deve ser usado
como fonte de verdade**: além dos arquivos inexistentes já citados, ele descreve um fluxo
de notificações e um código de administrador que não estão implementados. Consulte este
`README.md` e os três documentos técnicos.
