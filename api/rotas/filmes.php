<?php
/**
 * rotas/filmes.php — catálogo de filmes (administração/empresa) e catálogo público.
 */

function pipo_rota_filmes(PDO $db, array $p, string $metodo): void
{
    // /api/filmes/catalogo — catálogo aprovado (usado para montar playlists)
    if (($p[1] ?? '') === 'catalogo' && $metodo === 'GET') {
        pipo_rota_catalogo($db);
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
    if ($u['tipo'] === 'administrador') {
        $filmes = $db->query('SELECT * FROM filmes ORDER BY titulo ASC')->fetchAll();
    } else {
        $st = $db->prepare('SELECT * FROM filmes WHERE empresa_id = ? ORDER BY titulo ASC');
        $st->execute([(int) $u['id']]);
        $filmes = $st->fetchAll();
    }
    $lista = [];
    foreach ($filmes as $f) {
        $lista[] = pipo_filme_adm($db, $f);
    }
    pipo_ok($lista);
}

function pipo_filme_adm(PDO $db, array $f): array
{
    $empresaNome = null;
    if (!empty($f['empresa_id'])) {
        $st = $db->prepare('SELECT nome FROM usuarios WHERE id = ?');
        $st->execute([(int) $f['empresa_id']]);
        $e = $st->fetch();
        $empresaNome = $e ? $e['nome'] : null;
    }
    $contagem = $db->prepare('SELECT COUNT(*) AS q, AVG(nota) AS media FROM avaliacoes WHERE filme_id = ?');
    $contagem->execute([$f['id']]);
    $c = $contagem->fetch();
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
        'avaliacoes'    => $c ? (int) $c['q'] : 0,
        'notaMedia'     => $c && $c['media'] !== null ? round((float) $c['media'], 1) : 0,
        'visualizacoes' => 0,
        'empresaId'     => $f['empresa_id'] !== null ? (int) $f['empresa_id'] : null,
        'empresaNome'   => $empresaNome,
        'status'        => $f['status'],
    ];
}

function pipo_limpar_filme(array $d): array
{
    $classificacoes = ['L', '10', '12', '14', '16', '18'];
    $generos = [];
    foreach ((array) ($d['generos'] ?? []) as $g) {
        $g = mb_substr(trim((string) $g), 0, 30);
        if ($g !== '') {
            $generos[] = $g;
        }
    }
    return [
        'titulo'        => mb_substr(trim((string) ($d['titulo'] ?? '')), 0, 120),
        'ano'           => mb_substr(preg_replace('/\D/', '', (string) ($d['ano'] ?? '')), 0, 4),
        'classificacao' => in_array((string) ($d['classificacao'] ?? ''), $classificacoes, true) ? $d['classificacao'] : 'L',
        'generos'       => array_slice($generos, 0, 6),
        'plataforma'    => mb_substr(trim((string) ($d['plataforma'] ?? '')), 0, 60),
        'sinopse'       => mb_substr(trim((string) ($d['sinopse'] ?? '')), 0, 1500),
        'imagem'        => mb_substr(trim((string) ($d['imagem'] ?? '')), 0, 500) ?: 'assets/img-filmes/placeholder.svg',
    ];
}

function pipo_slug(string $t): string
{
    $t = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t) ?: $t;
    $t = strtolower(preg_replace('/[^a-z0-9]+/', '-', $t));
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
    pipo_ok(pipo_filme_adm($db, pipo_filme_por_id($db, $id)));
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
    pipo_ok(pipo_filme_adm($db, pipo_filme_por_id($db, (string) $f['id'])));
}

function pipo_rota_excluir_filme(PDO $db, array $u, array $f): void
{
    $st = $db->prepare('DELETE FROM filmes WHERE id = ?');
    $st->execute([$f['id']]);
    pipo_ok();
}
