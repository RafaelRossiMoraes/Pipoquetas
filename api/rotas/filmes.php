<?php
/**
 * rotas/filmes.php — catálogo de filmes (administração/empresa) e catálogo público.
 */

/** Lista padronizada de gêneros aceitos no cadastro de filmes. */
const PIPO_GENEROS = [
    'Ação', 'Animação', 'Aventura', 'Comédia', 'Crime', 'Documentário', 'Drama',
    'Família', 'Fantasia', 'Faroeste', 'Ficção científica', 'Guerra', 'História',
    'Mistério', 'Música', 'Romance', 'Suspense', 'Terror', 'Thriller',
];

/** Limite do arquivo de imagem enviado (4 MB). */
const PIPO_UPLOAD_MAX = 4194304;

function pipo_rota_filmes(PDO $db, array $p, string $metodo): void
{
    // /api/filmes/catalogo — catálogo aprovado (usado para montar playlists)
    if (($p[1] ?? '') === 'catalogo' && $metodo === 'GET') {
        pipo_rota_catalogo($db);
    }

    // /api/filmes/upload — recebe a imagem em base64 (funciona no servidor local)
    if (($p[1] ?? '') === 'upload' && $metodo === 'POST') {
        pipo_rota_upload($db);
    }

    // /api/filmes/{id}/avaliacoes
    if (($p[2] ?? '') === 'avaliacoes') {
        pipo_rota_avaliacoes($db, $p, $metodo);
    }

    $u = pipo_exigir(['administrador', 'empresa']);

    // /api/filmes
    if (!isset($p[1]) || $p[1] === '') {
        if ($metodo === 'GET') {
            pipo_rota_listar_filmes($db, $u);
        }
        if ($metodo === 'POST') {
            pipo_rota_criar_filme($db, $u);
        }
        pipo_erro('Método não permitido.', 405);
    }

    // /api/filmes/{id}
    $filme = pipo_filme_por_id($db, (string) $p[1]);
    if (!$filme) {
        pipo_erro('Filme não encontrado.', 404);
    }
    if (!pipo_pode_ver($u, $filme)) {
        pipo_erro('Acesso negado.', 403);
    }
    if ($metodo === 'PUT') {
        pipo_rota_editar_filme($db, $u, $filme);
    }
    if ($metodo === 'DELETE') {
        pipo_rota_excluir_filme($db, $u, $filme);
    }
    pipo_erro('Rota não encontrada.', 404);
}

function pipo_rota_catalogo(PDO $db): void
{
    $filmes = $db->query("SELECT id, titulo, ano, imagem, plataforma, nota, generos, classificacao
                             FROM filmes WHERE status = 'aprovado' ORDER BY titulo ASC")->fetchAll();
    $lista = [];
    foreach ($filmes as $f) {
        $lista[] = [
            'id'         => $f['id'],
            'titulo'     => $f['titulo'],
            'ano'        => $f['ano'],
            'imagem'     => $f['imagem'],
            'plataforma' => $f['plataforma'],
            'nota'       => (float) $f['nota'],
            'generos'    => json_decode((string) $f['generos'], true) ?: [],
            'classificacao' => $f['classificacao'],
        ];
    }
    pipo_ok($lista);
}

function pipo_filme_por_id(PDO $db, string $id): ?array
{
    $st = $db->prepare('SELECT * FROM filmes WHERE id = ?');
    $st->execute([$id]);
    $f = $st->fetch();
    return $f ?: null;
}

function pipo_pode_ver(array $u, array $f): bool
{
    if ($u['tipo'] === 'administrador') {
        return true;
    }
    return (int) ($f['empresa_id'] ?? 0) === (int) $u['id'];
}

function pipo_rota_listar_filmes(PDO $db, array $u): void
{
    // Uma única consulta com os agregados de avaliações e o nome da empresa.
    // Antes era 1 consulta por filme (75 filmes = 150 consultas por abertura do painel).
    $sql = "SELECT f.*,
                   e.nome AS empresa_nome,
                   COALESCE(a.q, 0) AS aval_q,
                   a.media AS aval_media
              FROM filmes f
              LEFT JOIN usuarios e ON e.id = f.empresa_id
              LEFT JOIN (SELECT filme_id, COUNT(*) AS q, AVG(nota) AS media
                           FROM avaliacoes GROUP BY filme_id) a ON a.filme_id = f.id";
    if ($u['tipo'] === 'administrador') {
        $st = $db->prepare($sql . ' ORDER BY f.titulo ASC');
        $st->execute();
    } else {
        $st = $db->prepare($sql . ' WHERE f.empresa_id = ? ORDER BY f.titulo ASC');
        $st->execute([(int) $u['id']]);
    }
    pipo_ok(array_map('pipo_filme_adm', $st->fetchAll()));
}

/** Monta o JSON de um filme já enriquecido pela consulta de listagem. */
function pipo_filme_adm(array $f): array
{
    return [
        'id'            => $f['id'],
        'titulo'        => $f['titulo'],
        'ano'           => $f['ano'],
        'duracao'       => $f['duracao'],
        'classificacao' => $f['classificacao'],
        'generos'       => json_decode((string) $f['generos'], true) ?: [],
        'plataforma'    => $f['plataforma'],
        'sinopse'       => $f['sinopse'],
        'imagem'        => $f['imagem'],
        'nota'          => (float) $f['nota'],
        'numAvaliacoes' => (int) $f['num_avaliacoes'],
        'avaliacoes'    => (int) ($f['aval_q'] ?? 0),
        'notaMedia'     => ($f['aval_media'] ?? null) !== null ? round((float) $f['aval_media'], 1) : 0,
        'visualizacoes' => 0,
        'empresaId'     => $f['empresa_id'] !== null ? (int) $f['empresa_id'] : null,
        'empresaNome'   => $f['empresa_nome'] ?? null,
        'status'        => $f['status'],
    ];
}

/** Busca um filme já com os agregados usados pelos painéis (evita 3 consultas). */
function pipo_filme_adm_por_id(PDO $db, string $id): ?array
{
    $st = $db->prepare(
        "SELECT f.*, e.nome AS empresa_nome,
                COALESCE(a.q, 0) AS aval_q, a.media AS aval_media
           FROM filmes f
           LEFT JOIN usuarios e ON e.id = f.empresa_id
           LEFT JOIN (SELECT filme_id, COUNT(*) AS q, AVG(nota) AS media
                        FROM avaliacoes GROUP BY filme_id) a ON a.filme_id = f.id
          WHERE f.id = ?"
    );
    $st->execute([$id]);
    $f = $st->fetch();
    return $f ? pipo_filme_adm($f) : null;
}

/** Normaliza um gênero para comparar sem acentos/maiúsculas. */
function pipo_chave_genero(string $g): string
{
    $g = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $g) ?: $g;
    return strtolower(preg_replace('/[^a-z0-9]+/i', '', $g));
}

/** Converte os gêneros recebidos para a lista padronizada, sem duplicatas. */
function pipo_normalizar_generos(array $recebidos): array
{
    // Apelidos aceitos para não gerar registros duplicados/inconsistentes.
    $apelidos = [
        'scifi'          => 'Ficção científica',
        'ficcaocientifica' => 'Ficção científica',
        'ficcao'         => 'Ficção científica',
        'musical'        => 'Música',
        'investigacao'   => 'Mistério',
        'misterio'       => 'Mistério',
        'policial'       => 'Crime',
        'infantil'       => 'Família',
        'biografia'      => 'História',
    ];
    $mapa = [];
    foreach (PIPO_GENEROS as $g) {
        $mapa[pipo_chave_genero($g)] = $g;
    }
    foreach ($apelidos as $chave => $g) {
        $mapa[$chave] = $g;
    }
    $saida = [];
    foreach ($recebidos as $g) {
        $chave = pipo_chave_genero(trim((string) $g));
        if ($chave !== '' && isset($mapa[$chave]) && !in_array($mapa[$chave], $saida, true)) {
            $saida[] = $mapa[$chave];
        }
    }
    return array_slice($saida, 0, 6);
}

/** Caminho de imagem aceito: pasta do catálogo ou pasta de uploads. */
function pipo_imagem_valida(string $caminho): bool
{
    return $caminho === ''
        || (bool) preg_match('#^assets/img-filmes/(?:uploads/)?[A-Za-z0-9._-]+$#', $caminho);
}

function pipo_limpar_filme(array $d): array
{
    $classificacoes = ['L', '10', '12', '14', '16', '18'];
    $imagem = mb_substr(trim((string) ($d['imagem'] ?? '')), 0, 500);
    if (!pipo_imagem_valida($imagem)) {
        $imagem = '';
    }
    return [
        'titulo'        => mb_substr(trim((string) ($d['titulo'] ?? '')), 0, 120),
        'ano'           => mb_substr(preg_replace('/\D/', '', (string) ($d['ano'] ?? '')), 0, 4),
        'classificacao' => in_array((string) ($d['classificacao'] ?? ''), $classificacoes, true) ? $d['classificacao'] : 'L',
        'generos'       => pipo_normalizar_generos((array) ($d['generos'] ?? [])),
        'plataforma'    => mb_substr(trim((string) ($d['plataforma'] ?? '')), 0, 60),
        'sinopse'       => mb_substr(trim((string) ($d['sinopse'] ?? '')), 0, 1500),
        'imagem'        => $imagem ?: 'assets/img-filmes/placeholder.svg',
    ];
}

function pipo_slug(string $t): string
{
    $t = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t) ?: $t;
    // Converte para minúsculas ANTES de remover caracteres, senão as maiúsculas
    // também seriam descartadas (ex.: "Filme Teste" virava "ilme-este").
    $t = strtolower($t);
    $t = preg_replace('/[^a-z0-9]+/', '-', $t);
    $t = trim($t, '-');
    return $t !== '' ? $t : 'filme';
}

function pipo_rota_criar_filme(PDO $db, array $u): void
{
    $d = pipo_limpar_filme(pipo_corpo());
    if ($d['titulo'] === '') {
        pipo_erro('Informe o título do filme.');
    }
    $base = pipo_slug($d['titulo']);
    $id = $base;
    $n = 2;
    while (pipo_filme_por_id($db, $id)) {
        $id = $base . '-' . $n++;
    }
    $status = ($u['tipo'] === 'empresa') ? 'pendente' : 'aprovado';
    $st = $db->prepare('INSERT INTO filmes
        (id, titulo, ano, duracao, generos, classificacao, nota, num_avaliacoes, plataforma, imagem, sinopse,
         trailer_youtube_id, elenco, onde_assistir, relacionados, diretores, secao, empresa_id, status, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?, ?, ?)');
    $st->execute([
        $id, $d['titulo'], $d['ano'], null, json_encode($d['generos'], JSON_UNESCAPED_UNICODE), $d['classificacao'],
        $d['plataforma'], $d['imagem'], $d['sinopse'],
        json_encode([], JSON_UNESCAPED_UNICODE), json_encode([], JSON_UNESCAPED_UNICODE), json_encode([], JSON_UNESCAPED_UNICODE),
        'recomendados', $u['tipo'] === 'empresa' ? (int) $u['id'] : null, $status, gmdate('Y-m-d H:i:s'),
    ]);
    pipo_ok(pipo_filme_adm_por_id($db, $id));
}

function pipo_rota_editar_filme(PDO $db, array $u, array $f): void
{
    $d = pipo_limpar_filme(pipo_corpo());
    if ($d['titulo'] === '') {
        pipo_erro('Informe o título do filme.');
    }
    $status = ($u['tipo'] === 'empresa') ? 'pendente' : $f['status'];
    $st = $db->prepare('UPDATE filmes SET titulo = ?, ano = ?, generos = ?, classificacao = ?, plataforma = ?, sinopse = ?, imagem = ?, status = ? WHERE id = ?');
    $st->execute([
        $d['titulo'], $d['ano'], json_encode($d['generos'], JSON_UNESCAPED_UNICODE), $d['classificacao'],
        $d['plataforma'], $d['sinopse'], $d['imagem'], $status, $f['id'],
    ]);
    pipo_ok(pipo_filme_adm_por_id($db, (string) $f['id']));
}

function pipo_rota_excluir_filme(PDO $db, array $u, array $f): void
{
    $st = $db->prepare('DELETE FROM filmes WHERE id = ?');
    $st->execute([$f['id']]);
    pipo_ok();
}

/**
 * POST /api/filmes/upload
 * Recebe a imagem como data URL base64 (o mini servidor local não repassa
 * multipart/form-data para o PHP, então o navegador envia em JSON).
 */
function pipo_rota_upload(PDO $db): void
{
    pipo_exigir(['administrador', 'empresa']);
    $d = pipo_corpo();
    $nome = trim((string) ($d['nome'] ?? 'imagem'));
    $dados = (string) ($d['dados'] ?? '');
    if (!preg_match('#^data:image/(png|jpe?g|webp|gif);base64,(.+)$#i', $dados, $m)) {
        pipo_erro('Envie uma imagem JPG, PNG, WEBP ou GIF.');
    }
    $binario = base64_decode($m[2], true);
    if ($binario === false || $binario === '') {
        pipo_erro('Não foi possível ler o arquivo enviado.');
    }
    if (strlen($binario) > PIPO_UPLOAD_MAX) {
        pipo_erro('A imagem pode ter no máximo 4 MB.');
    }
    // Confere o conteúdo real (não só a extensão informada pelo navegador).
    $info = @getimagesizefromstring($binario);
    $tipos = [
        IMAGETYPE_PNG  => 'png',
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_GIF  => 'gif',
    ];
    if (!$info || !isset($tipos[$info[2]])) {
        pipo_erro('O arquivo enviado não é uma imagem válida.');
    }
    $ext = $tipos[$info[2]];
    $pasta = PIPO_RAIZ . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'img-filmes' . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($pasta) && !@mkdir($pasta, 0775, true) && !is_dir($pasta)) {
        pipo_erro('Não foi possível criar a pasta de imagens.', 500);
    }
    $base = pipo_slug(pathinfo($nome, PATHINFO_FILENAME));
    $arquivo = $base . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (@file_put_contents($pasta . DIRECTORY_SEPARATOR . $arquivo, $binario) === false) {
        pipo_erro('Não foi possível salvar a imagem.', 500);
    }
    pipo_ok([
        'caminho' => 'assets/img-filmes/uploads/' . $arquivo,
        'nome'    => $nome,
    ]);
}
