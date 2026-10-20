<?php
/**
 * db.php — banco de dados do Pipoquetas.
 *
 * Driver escolhido automaticamente:
 *   - MySQL (XAMPP) quando o serviço estiver de pé;
 *   - SQLite (arquivo dados/pipoquetas.sqlite) caso contrário — sem instalar nada.
 * Para forçar um deles:  set PIPOQUETAS_DB=mysql   (ou sqlite) antes de rodar o servidor.
 *
 * O esquema é criado na primeira execução e a carga inicial (usuários de demonstração,
 * catálogo de filmes, playlists obrigatórias, avaliações e notificações) é aplicada
 * sem sobrescrever o que já existe.
 */

define('PIPO_RAIZ', dirname(__DIR__));
define('PIPO_DADOS', PIPO_RAIZ . DIRECTORY_SEPARATOR . 'dados');

/** Conecta (uma única vez por requisição) e garante esquema + carga inicial. */
function pipo_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $driver = pipo_driver();
    $opts = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    if ($driver === 'mysql') {
        $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=pipoquetas;charset=utf8mb4', 'root', '', $opts);
    } else {
        $arquivo = PIPO_DADOS . DIRECTORY_SEPARATOR . 'pipoquetas.sqlite';
        $pdo = new PDO('sqlite:' . $arquivo, null, null, $opts);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }
    pipo_migrar($pdo, $driver);
    pipo_semear($pdo, $driver);
    return $pdo;
}

/** 'mysql' ou 'sqlite'. */
function pipo_driver(): string
{
    static $driver = null;
    if ($driver !== null) {
        return $driver;
    }
    $forcado = strtolower((string) getenv('PIPOQUETAS_DB'));
    if ($forcado === 'mysql' || $forcado === 'sqlite') {
        $driver = $forcado;
        return $driver;
    }
    $driver = pipo_tem_mysql() ? 'mysql' : 'sqlite';
    return $driver;
}

function pipo_tem_mysql(): bool
{
    try {
        $p = new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4', 'root', '', [
            PDO::ATTR_ERRMODE     => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT     => 2,
        ]);
        $p->exec('CREATE DATABASE IF NOT EXISTS pipoquetas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        return true;
    } catch (Exception $e) {
        return false;
    }
}

/* ------------------------------------------------------------------ *
 *  Esquema
 * ------------------------------------------------------------------ */
function pipo_migrar(PDO $db, string $driver): void
{
    $mysql = ($driver === 'mysql');
    $auto  = $mysql ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $pk    = 'VARCHAR(160)';
    $txt   = 'VARCHAR(191)';
    $nome  = 'VARCHAR(500)';
    $longo = 'TEXT';

    $ddl = [];

    $ddl[] = "CREATE TABLE IF NOT EXISTS usuarios (
        id $auto,
        tipo $txt NOT NULL,
        nome $nome NOT NULL,
        usuario $txt NOT NULL,
        email $txt NOT NULL,
        senha_hash $txt NOT NULL,
        cnpj $txt NULL,
        nascimento $txt NULL,
        status $txt NOT NULL DEFAULT 'ativo',
        criado_em $txt NOT NULL,
        UNIQUE (usuario),
        UNIQUE (email)
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS sessoes (
        token $pk NOT NULL PRIMARY KEY,
        usuario_id INT NOT NULL,
        criado_em $txt NOT NULL,
        expira_em $txt NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS filmes (
        id $pk NOT NULL PRIMARY KEY,
        titulo $nome NOT NULL,
        ano $txt NULL,
        duracao $txt NULL,
        generos $longo NULL,
        classificacao $txt NULL,
        nota REAL DEFAULT 0,
        num_avaliacoes INT DEFAULT 0,
        plataforma $txt NULL,
        imagem $nome NULL,
        sinopse $longo NULL,
        trailer_youtube_id $txt NULL,
        elenco $longo NULL,
        onde_assistir $longo NULL,
        relacionados $longo NULL,
        diretores $nome NULL,
        secao $txt NULL,
        empresa_id INT NULL,
        status $txt NOT NULL DEFAULT 'aprovado',
        criado_em $txt NOT NULL
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS playlists (
        id $auto,
        usuario_id INT NOT NULL,
        nome $nome NOT NULL,
        descricao $longo NULL,
        icone $txt NOT NULL DEFAULT 'heart',
        privacidade $txt NOT NULL DEFAULT 'privada',
        obrigatoria INT NOT NULL DEFAULT 0,
        tipo $txt NULL,
        criado_em $txt NOT NULL,
        atualizado_em $txt NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS playlist_itens (
        id $auto,
        playlist_id INT NOT NULL,
        filme_id $pk NOT NULL,
        criado_em $txt NOT NULL,
        UNIQUE (playlist_id, filme_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS avaliacoes (
        id $auto,
        filme_id $pk NOT NULL,
        usuario_id INT NOT NULL,
        nota INT NOT NULL,
        texto $longo NULL,
        criado_em $txt NOT NULL,
        UNIQUE (filme_id, usuario_id),
        FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )";

    $ddl[] = "CREATE TABLE IF NOT EXISTS notificacoes (
        id $auto,
        usuario_id INT NOT NULL,
        tipo $txt NOT NULL,
        icone $txt NULL,
        imagem $nome NULL,
        titulo $nome NULL,
        descricao $longo NOT NULL,
        link $nome NULL,
        lida INT NOT NULL DEFAULT 0,
        criado_em $txt NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )";

    foreach ($ddl as $sql) {
        $db->exec($sql);
    }
}

/* ------------------------------------------------------------------ *
 *  Carga inicial
 * ------------------------------------------------------------------ */
function pipo_semear(PDO $db, string $driver): void
{
    pipo_semear_usuarios($db);
    pipo_semear_filmes($db);
    pipo_semear_playlists($db);
    pipo_semear_avaliacoes($db);
    pipo_semear_notificacoes($db);
}

/** Contas de demonstração (senha 123456) + críticos usados nas avaliações de exemplo. */
function pipo_semear_usuarios(PDO $db): void
{
    $contas = [
        ['usuario', 'Usuário Demo', 'usuario', 'usuario@pipoquetas.demo', '123456'],
        ['empresa', 'Empresa Demo', 'empresa', 'empresa@pipoquetas.demo', '123456'],
        ['administrador', 'Administrador Demo', 'administrador', 'administrador@pipoquetas.demo', '123456'],
        // críticos das avaliações de exemplo (não entram na lista de empresas da administração)
        ['usuario', 'Jorel', 'jorel', 'jorel@pipoquetas.demo', '123456'],
        ['usuario', 'Pessoa Feliz', 'pessoa_feliz', 'pessoa.feliz@pipoquetas.demo', '123456'],
        ['usuario', 'Carla Menezes', 'carla_menezes', 'carla.menezes@pipoquetas.demo', '123456'],
        ['usuario', 'Rafael Antunes', 'rafael_antunes', 'rafael.antunes@pipoquetas.demo', '123456'],
        ['usuario', 'Bruna Sales', 'bruna_sales', 'bruna.sales@pipoquetas.demo', '123456'],
        ['usuario', 'Diego Alencar', 'diego_alencar', 'diego.alencar@pipoquetas.demo', '123456'],
        ['usuario', 'Patrícia Rocha', 'patricia_rocha', 'patricia.rocha@pipoquetas.demo', '123456'],
        ['usuario', 'Thiago Lemos', 'thiago_lemos', 'thiago.lemos@pipoquetas.demo', '123456'],
    ];
    $agora = gmdate('Y-m-d H:i:s');
    foreach ($contas as $c) {
        $existe = $db->prepare('SELECT id FROM usuarios WHERE usuario = ?');
        $existe->execute([$c[2]]);
        if ($existe->fetch()) {
            continue;
        }
        $ins = $db->prepare('INSERT INTO usuarios (tipo, nome, usuario, email, senha_hash, cnpj, nascimento, status, criado_em)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $ins->execute([$c[0], $c[1], $c[2], $c[3], pipo_hash_senha($c[4]), null, null, 'ativo', $agora]);
    }
}

/** Catálogo: vem de dados/filmes.json (mesma fonte do js/dados-filmes.js). */
function pipo_semear_filmes(PDO $db): void
{
    $arquivo = PIPO_DADOS . DIRECTORY_SEPARATOR . 'filmes.json';
    if (!is_file($arquivo)) {
        return;
    }
    $filmes = json_decode((string) file_get_contents($arquivo), true);
    if (!is_array($filmes)) {
        return;
    }
    $diretores = pipo_diretores();
    $checa = $db->prepare('SELECT id FROM filmes WHERE id = ?');
    $ins = $db->prepare('INSERT INTO filmes
        (id, titulo, ano, duracao, generos, classificacao, nota, num_avaliacoes, plataforma, imagem,
         sinopse, trailer_youtube_id, elenco, onde_assistir, relacionados, diretores, secao, empresa_id, status, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $agora = gmdate('Y-m-d H:i:s');
    foreach ($filmes as $f) {
        if (!isset($f['id'])) {
            continue;
        }
        $checa->execute([$f['id']]);
        if ($checa->fetch()) {
            continue; // já está no banco: não sobrescreve edições da administração
        }
        $ins->execute([
            $f['id'],
            $f['titulo'] ?? '',
            $f['ano'] ?? null,
            $f['duracao'] ?? null,
            json_encode($f['generos'] ?? [], JSON_UNESCAPED_UNICODE),
            $f['classificacao'] ?? null,
            (float) ($f['nota'] ?? 0),
            (int) ($f['numAvaliacoes'] ?? 0),
            $f['plataforma'] ?? null,
            $f['imagem'] ?? null,
            $f['sinopse'] ?? null,
            $f['trailerYoutubeId'] ?? null,
            json_encode($f['elenco'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($f['ondeAssistir'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($f['relacionados'] ?? [], JSON_UNESCAPED_UNICODE),
            $diretores[$f['id']] ?? null,
            $f['secao'] ?? null,
            null,
            'aprovado',
            $agora,
        ]);
    }
}

/** Diretores dos filmes mais conhecidos (usados na listagem de favoritos/interesses). */
function pipo_diretores(): array
{
    return [
        'duna-parte-2'                 => 'Denis Villeneuve',
        'interestelar'                 => 'Christopher Nolan',
        'blade-runner-2049'            => 'Denis Villeneuve',
        'matrix-resurrections'         => 'Lana Wachowski',
        'star-wars-ep2'                => 'George Lucas',
        'homem-aranha-aranhaverso'     => 'Sam Raimi',
        'filme-1917'                   => 'Sam Mendes',
        'titanic'                      => 'James Cameron',
        'capitao-america-guerra-civil' => 'Anthony e Joe Russo',
        'estrelas-alem-do-tempo'       => 'Christopher Nolan',
        'batman-a-queda-do-morcego-parte-1' => 'Matt Reeves',
        'homem-aranha-um-novo-dia'     => 'Jon Watts',
        'avatar-aang-o-ultimo-mestre-do-ar' => 'James Cameron',
        'resident-evil'                => 'Paul W. S. Anderson',
        'como-magica'                  => 'Bill Condon',
        'sobrenatural-agora-entre-nos' => 'Dexter Fletcher',
        'a-odisseia'                   => 'Christopher Nolan',
        'demon-slayer-kimetsu-no-yaiba-castelo-infinito' => 'Tatsuya Yoshihara',
        'matchbox-o-filme'             => 'Nagesh Kukunoor',
        'a-captura'                    => 'Declan de Barra',
        'a-queda-2-no-limite'          => 'Nakamura Shichiro',
        'um-sonho-de-liberdade'        => 'Frank Darabont',
        'the-fix'                      => 'Abe Forsythe',
        'o-poderoso-chefao'            => 'Pierre Coffin e Chris Renaud',
        'tres-horas-para-viver'        => 'Paul W. S. Anderson',
        'devoradores-de-estrelas'      => 'The Jim Henson Company',
        'sobrevivencia'                => 'Marc Forster',
        'michael'                      => 'Niki Caro',
        'coracoes-jovens'              => 'Duane Adler',
        'after-impact'                 => 'Baran bo Odar',
        '12-homens-e-uma-sentenca'     => 'Alexander Payne',
        'resident-evil-bem-vindo-a-raccoon-city' => 'Johannes Roberts',
        'o-poderoso-chefao-parte-ii'   => 'Pierre Coffin e Chris Renaud',
        'the-mongoose'                 => 'Martin Campbell',
        'a-lista-de-schindler'         => 'Steven Spielberg',
        'meu-querido-assassino'        => 'Gunnar Hellström',
        'coyote-vs-acme'               => 'Dave Green',
        'batman-o-cavaleiro-das-trevas' => 'Christopher Nolan',
        'o-fim-da-rua'                 => 'Zach Lipovsky e Adam Siegel',
        'chainsaw-man-o-filme-arco-da-reze' => 'Dave Yarovesky',
        'toy-story-5'                  => 'Andrew Stanton',
        'a-viagem-de-chihiro'          => 'Hayao Miyazaki',
        'outra-mamae'                  => 'Drew Barrymore',
        'a-espera-de-um-milagre'       => 'Giuseppe Tornatore',
        'pinoquio-maldicao-de-madeira' => 'Guilherme Marcondes',
        'o-senhor-dos-aneis-o-retorno-do-rei' => 'Peter Jackson',
        'protocolo-de-exterminio'      => 'Megan Nellis',
        'dilwale-vai-levar-a-noiva'    => 'Nikhil Advani',
        'codigo-vinganca'              => 'F. Gary Gray',
        'parasita'                     => 'Bong Joon-ho',
        'your-name'                    => 'Makoto Shinkai',
        'pulp-fiction-tempo-de-violencia' => 'Quentin Tarantino',
        'obsessao'                     => 'Steven Soderbergh',
        'harakiri'                     => 'Masaki Kobayashi',
        'tres-homens-em-conflito'      => 'John Ford',
        'forrest-gump-o-contador-de-historias' => 'Robert Zemeckis',
        'digger'                       => 'Rohit Shetty',
        'cosas-imposibles'             => 'Ivan Reitman',
        'noticias-em-perigo'           => 'Spike Lee',
        'tumulo-dos-vagalumes'         => 'John Singleton',
        'o-rebelde'                    => 'Martin Scorsese',
        'os-sete-samurais'             => 'Akira Kurosawa',
        'v-h-s-mixtape'                => 'David Duchovny',
        'os-bons-companheiros'         => 'Martin Scorsese',
        'o-senhor-dos-aneis-a-sociedade-do-anel' => 'Peter Jackson',
        'clube-da-luta'                => 'David Fincher',
        'a-hipotese-do-amor'           => 'Charles Shyer',
        'a-vida-e-bela'                => 'John Carney',
        'zona-zero'                    => 'Bryan W. Robinson',
        'cinema-paradiso'              => 'Giuseppe Tornatore',
        'nao-olhe-para-baixo'          => 'Scott Mann',
        'o-senhor-dos-aneis-as-duas-torres' => 'Peter Jackson',
        'vingadores-doutor-destino'    => 'Anthony e Joe Russo',
        'cidade-de-deus'               => 'Fernando Meirelles e Kátia Lund',
        'moana'                        => 'Ron Clements, John Musker e Taika Waititi',
    ];
}

/** As duas playlists obrigatórias de cada usuário. */
function pipo_semear_playlists(PDO $db): void
{
    $usuarios = $db->query('SELECT id FROM usuarios')->fetchAll();
    $checa = $db->prepare('SELECT id FROM playlists WHERE usuario_id = ? AND tipo = ?');
    $ins = $db->prepare('INSERT INTO playlists
        (usuario_id, nome, descricao, icone, privacidade, obrigatoria, tipo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)');
    $agora = gmdate('Y-m-d H:i:s');
    $modelo = [
        ['favoritos', 'Favoritos', 'Filmes salvos como favoritos', 'heart', 'privada'],
        ['lista-interesses', 'Lista de Interesses', 'Filmes salvos como interessantes para serem assistidos depois.', 'list-star', 'privada'],
    ];
    foreach ($usuarios as $u) {
        foreach ($modelo as $m) {
            $checa->execute([$u['id'], $m[0]]);
            if ($checa->fetch()) {
                continue;
            }
            $ins->execute([$u['id'], $m[1], $m[2], $m[3], $m[4], $m[0], $agora, $agora]);
        }
    }
}

/**
 * Avaliações de exemplo — uma por filme (e não as mesmas em todos),
 * para que média e quantidade sejam calculadas individualmente.
 */
function pipo_semear_avaliacoes(PDO $db): void
{
    $checa = $db->prepare('SELECT COUNT(*) FROM avaliacoes WHERE filme_id = ?');
    $parede = $db->prepare('SELECT id FROM avaliacoes WHERE filme_id = ? AND usuario_id = ?');
    $ins = $db->prepare('INSERT INTO avaliacoes (filme_id, usuario_id, nota, texto, criado_em) VALUES (?, ?, ?, ?, ?)');
    $usuarios = $db->query("SELECT id, usuario FROM usuarios WHERE tipo = 'usuario' ORDER BY id")->fetchAll();
    if (!$usuarios) {
        return;
    }
    $ids = [];
    foreach ($usuarios as $u) {
        $ids[$u['usuario']] = (int) $u['id'];
    }
    $criticos = ['carla_menezes', 'rafael_antunes', 'bruna_sales', 'diego_alencar', 'patricia_rocha', 'thiago_lemos'];

    // as duas avaliações que já existiam no projeto, agora ligadas ao filme certo
    $legado = [
        ['duna-parte-2', 'jorel', 1, 'NÃO GOSTEI NEM UM POUCO, ESPERAVA MUITO MAIS JÁ QUE A FRANQUIA NUNCA NOS DECEPCIONOU. COMO UM GRANDE FÃ, ESTOU ENTRISTECIDO COM A QUALIDADE DO FILME.'],
        ['filme-1917', 'pessoa_feliz', 4, 'Muito interessante de fato, mas não é o melhor da franquia.'],
    ];

    $filmes = $db->query('SELECT id, titulo, nota FROM filmes ORDER BY id')->fetchAll();
    $modelos = [
        'O ritmo de %s me prendeu do começo ao fim — vale cada minuto.',
        'Terminei %s e achei que durava duas horas. Recomendo demais.',
        '%s tem uma fotografia belíssima, mas o roteiro tropeça no terço final.',
        'Esperava mais de %s mesmo assim; o resultado agrada.',
        'A trilha sonora de %s sozinha já valeria a sessão.',
        '%s é daqueles filmes que você termina discutindo com os amigos.',
        'Sentei com a família e ninguém olhou para o celular. %s funciona.',
        '%s tem um ritmo irregular, mas o elenco salva. Nota pra atuação.',
        'Revisitei %s anos depois e continua funcionando muito bem.',
        '%s me prendeu, mas o final poderia ser mais limpo.',
        'A direção de %s é precisa e o resultado aparece na tela.',
        'Demorei para engatar com %s, mas no fim gostei bastante.',
    ];
    $agora = time();

    foreach ($legado as $l) {
        if (!isset($ids[$l[1]])) {
            continue;
        }
        $parede->execute([$l[0], $ids[$l[1]]]);
        if ($parede->fetch()) {
            continue;
        }
        $ins->execute([$l[0], $ids[$l[1]], $l[2], $l[3], gmdate('Y-m-d H:i:s', $agora - 7200)]);
    }

    foreach ($filmes as $i => $f) {
        $checa->execute([$f['id']]);
        if ((int) $checa->fetchColumn() > 0) {
            continue; // o filme já tem avaliações: não duplica
        }
        $base = max(1, min(5, (int) round((float) $f['nota'])));
        $quantos = ($i % 3 === 0) ? 3 : 2;
        for ($j = 0; $j < $quantos; $j++) {
            $autor = $criticos[($i * 5 + $j * 2) % count($criticos)];
            if (!isset($ids[$autor])) {
                continue;
            }
            $parede->execute([$f['id'], $ids[$autor]]);
            if ($parede->fetch()) {
                continue;
            }
            $nota = max(1, min(5, $base + (($i + $j) % 3) - 1));
            $texto = sprintf($modelos[($i * 7 + $j) % count($modelos)], $f['titulo']);
            $ins->execute([$f['id'], $ids[$autor], $nota, $texto, gmdate('Y-m-d H:i:s', $agora - (86400 * (($i % 9) + 1)))]);
        }
    }
}

/** Notificações de exemplo (modelo da segunda imagem de referência). */
function pipo_semear_notificacoes(PDO $db): void
{
    $checa = $db->prepare('SELECT COUNT(*) FROM notificacoes WHERE usuario_id = ?');
    $ins = $db->prepare('INSERT INTO notificacoes
        (usuario_id, tipo, icone, imagem, titulo, descricao, link, lida, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)');
    $agora = time();
    $modelo = [
        ['curtida', 'fa-heart', 'assets/avatar2.png', 'Clare;ncio; curtiu sua crítica sobre: "Duna - Parte 2".', 'filme.html?id=duna-parte-2', 240],
        ['estreia', 'fa-clapperboard', null, 'O Filme "Interestelar" acaba de entrar nos destaques da semana', 'filme.html?id=interestelar', 2700],
        ['social', 'fa-user-plus', 'assets/avatar.png', 'Mordecai começou a seguir você!', null, 21600],
        ['comentario', 'fa-comment-dots', 'assets/avatar2.png', 'Gumball respondeu ao seu comentário em "1917": "Concordo totalmente..."', 'filme.html?id=filme-1917', 25200],
        ['critica', 'fa-comment-dots', null, 'Sua crítica de "Estrelas Além do Tempo" atingiu 50 curtidas e subiu para o topo!', 'filme.html?id=estrelas-alem-do-tempo', 86400],
        ['recomendacao', 'fa-circle-info', null, 'Baseado em "Titanic", achamos que você vai gostar de "A Forma da Água".', 'filme.html?id=titanic', 172800],
    ];
    $alvos = $db->query("SELECT id, usuario FROM usuarios WHERE usuario IN ('usuario', 'administrador', 'empresa')")->fetchAll();
    foreach ($alvos as $u) {
        $checa->execute([$u['id']]);
        if ((int) $checa->fetchColumn() > 0) {
            continue;
        }
        foreach ($modelo as $m) {
            $ins->execute([
                $u['id'], $m[0], $m[1], $m[2], null, $m[3], $m[4],
                gmdate('Y-m-d H:i:s', $agora - $m[5]),
            ]);
        }
    }
}

/* ------------------------------------------------------------------ *
 *  Senhas
 * ------------------------------------------------------------------ */

/** Gera o hash de uma senha nova (bcrypt). */
function pipo_hash_senha(string $senha): string
{
    return 'bcrypt:' . password_hash($senha, PASSWORD_DEFAULT);
}

/** Confere a senha contra o hash guardado (bcrypt ou cyrb53 vindo do navegador). */
function pipo_confere_senha(string $senha, string $guardado): bool
{
    if ($guardado === '') {
        return false;
    }
    if (strpos($guardado, 'bcrypt:') === 0) {
        return password_verify($senha, substr($guardado, 7));
    }
    if (strpos($guardado, 'cyrb53:') === 0) {
        return hash_equals(substr($guardado, 7), pipo_cyrb53($senha));
    }
    return false;
}

/** cyrb53 em PHP — mesma conta que o antigo js/api-local.js fazia no navegador. */
function pipo_cyrb53(string $texto): string
{
    $h1 = 0xdeadbeef;
    $h2 = 0x41c6ce57;
    $t = 'pipoquetas::' . $texto;
    $len = strlen($t);
    for ($i = 0; $i < $len; $i++) {
        $ch = ord($t[$i]);
        $h1 = pipo_i32(pipo_imul(pipo_i32($h1 ^ $ch), 2654435761));
        $h2 = pipo_i32(pipo_imul(pipo_i32($h2 ^ $ch), 1597334677));
    }
    $h1 = pipo_i32(pipo_imul(pipo_i32($h1 ^ pipo_ushr($h1, 16)), 2246822507) ^ pipo_imul(pipo_i32($h2 ^ pipo_ushr($h2, 13)), 3266489909));
    $h2 = pipo_i32(pipo_imul(pipo_i32($h2 ^ pipo_ushr($h2, 16)), 2246822507) ^ pipo_imul(pipo_i32($h1 ^ pipo_ushr($h1, 13)), 3266489909));
    return dechex(4294967296 * (pipo_ushr($h2, 0) & 0x1FFFFF) + pipo_ushr($h1, 0));
}

/** Equivalente a Math.imul do JavaScript (multiplicação de 32 bits com sinal). */
function pipo_imul(int $a, int $b): int
{
    $a &= 0xFFFFFFFF;
    $b &= 0xFFFFFFFF;
    $al = $a & 0xFFFF;
    $ah = $a >> 16;
    $bl = $b & 0xFFFF;
    $bh = $b >> 16;
    $r = ($al * $bl) + (((($ah * $bl) + ($al * $bh)) & 0xFFFF) << 16);
    $r &= 0xFFFFFFFF;
    return $r >= 0x80000000 ? $r - 0x100000000 : $r;
}

/** Equivalente a (x >>> n) do JavaScript. */
function pipo_ushr(int $v, int $n): int
{
    return ($v & 0xFFFFFFFF) >> $n;
}

/** Equivalente a (x | 0) do JavaScript. */
function pipo_i32(int $v): int
{
    $v &= 0xFFFFFFFF;
    return $v >= 0x80000000 ? $v - 0x100000000 : $v;
}
