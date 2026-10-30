<?php
/**
 * rotas/playlists.php — playlists do usuário, favoritos e lista de interesses.
 *
 * Regras:
 *  - cada usuário tem duas playlists obrigatórias (favoritos e lista de interesses);
 *  - as obrigatórias não podem ser excluídas nem trocadas de tipo;
 *  - um filme não entra duas vezes na mesma playlist (UNIQUE playlist_id + filme_id);
 *  - toda alteração confere a propriedade/privacidade no servidor.
 */

/** Ícones que o usuário pode escolher ao criar uma playlist. */
const PIPO_ICONES = ['heart', 'list-star', 'star', 'smile', 'bookmark', 'film', 'bolt', 'rocket', 'trophy', 'users', 'video', 'moon'];

/** Cria (se faltarem) as duas playlists obrigatórias de um usuário. */
function pipo_criar_playlists_obrigatorias(PDO $db, int $usuarioId): void
{
    $modelo = [
        ['favoritos', 'Favoritos', 'Filmes salvos como favoritos', 'heart', 'privada'],
        ['lista-interesses', 'Lista de Interesses', 'Filmes salvos como interessantes para serem assistidos depois.', 'list-star', 'privada'],
    ];
    $checa = $db->prepare('SELECT id FROM playlists WHERE usuario_id = ? AND tipo = ?');
    $ins = $db->prepare('INSERT INTO playlists
        (usuario_id, nome, descricao, icone, privacidade, obrigatoria, tipo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)');
    $agora = gmdate('Y-m-d H:i:s');
    foreach ($modelo as $m) {
        $checa->execute([$usuarioId, $m[0]]);
        if ($checa->fetch()) {
            continue;
        }
        $ins->execute([$usuarioId, $m[1], $m[2], $m[3], $m[4], $m[0], $agora, $agora]);
    }
}

/** Playlist de um tipo ('favoritos' | 'lista-interesses') de um usuário. */
function pipo_playlist_tipo(PDO $db, int $usuarioId, string $tipo): ?array
{
    $st = $db->prepare('SELECT * FROM playlists WHERE usuario_id = ? AND tipo = ?');
    $st->execute([$usuarioId, $tipo]);
    $p = $st->fetch();
    return $p ?: null;
}

/** Playlist pública (para o JSON). */
function pipo_playlist_publico(array $p, int $total = 0): array
{
    return [
        'id'         => (int) $p['id'],
        'nome'       => $p['nome'],
        'descricao'  => (string) $p['descricao'],
        'icone'      => $p['icone'],
        'privacidade'=> $p['privacidade'],
        'obrigatoria'=> (int) $p['obrigatoria'] === 1,
        'tipo'       => $p['tipo'],
        'total'      => $total,
        'criado_em'  => $p['criado_em'],
        'atualizado_em' => $p['atualizado_em'],
    ];
}

/** Quantidade de filmes de uma playlist. */
function pipo_playlist_total(PDO $db, int $playlistId): int
{
    $st = $db->prepare('SELECT COUNT(*) FROM playlist_itens WHERE playlist_id = ?');
    $st->execute([$playlistId]);
    return (int) $st->fetchColumn();
}

/** Valida e limpa os dados de uma playlist vinda do formulário. */
function pipo_limpar_playlist(array $d): array
{
    $nome = trim((string) ($d['nome'] ?? ''));
    $descricao = trim((string) ($d['descricao'] ?? ''));
    $icone = (string) ($d['icone'] ?? 'heart');
    $privacidade = (string) ($d['privacidade'] ?? 'privada');
    if ($icone === '' || !in_array($icone, PIPO_ICONES, true)) {
        $icone = 'heart';
    }
    if (!in_array($privacidade, ['publica', 'privada'], true)) {
        $privacidade = 'privada';
    }
    return [
        'nome'        => mb_substr($nome, 0, 80),
        'descricao'   => mb_substr($descricao, 0, 300),
        'icone'       => $icone,
        'privacidade' => $privacidade,
    ];
}

/* ------------------------------------------------------------------ *
 *  /api/playlists
 * ------------------------------------------------------------------ */
function pipo_rota_playlists(PDO $db, array $p, string $metodo): void
{
    $u = pipo_exigir();
    $id = isset($p[1]) ? (int) $p[1] : 0;

    // /api/playlists
    if ($id === 0) {
        if ($metodo === 'GET') {
            pipo_rota_listar_playlists($db, (int) $u['id']);
        }
        if ($metodo === 'POST') {
            pipo_rota_criar_playlist($db, (int) $u['id']);
        }
        pipo_erro('Método não permitido.', 405);
    }

    // /api/playlists/{id}
    $pl = pipo_playlist_por_id($db, $id);
    if (!$pl) {
        pipo_erro('Playlist não encontrada.', 404);
    }
    $dono = (int) $pl['usuario_id'] === (int) $u['id'];
    if (!$dono && $pl['privacidade'] !== 'publica') {
        pipo_erro('Esta playlist é privada.', 403);
    }

    if ($metodo === 'GET') {
        pipo_rota_ver_playlist($db, $pl);
    }
    if ($metodo === 'PUT') {
        pipo_rota_editar_playlist($db, $pl, $u);
    }
    if ($metodo === 'DELETE') {
        pipo_rota_excluir_playlist($db, $pl, $u);
    }

    // /api/playlists/{id}/itens
    if (isset($p[2]) && $p[2] === 'itens') {
        if ($metodo === 'POST') {
            pipo_rota_adicionar_item($db, $pl, $u);
        }
        if ($metodo === 'DELETE') {
            pipo_rota_remover_item($db, $pl, $u, $p[3] ?? '');
        }
        pipo_erro('Método não permitido.', 405);
    }
    pipo_erro('Rota não encontrada.', 404);
}

function pipo_playlist_por_id(PDO $db, int $id): ?array
{
    $st = $db->prepare('SELECT * FROM playlists WHERE id = ?');
    $st->execute([$id]);
    $p = $st->fetch();
    return $p ?: null;
}

function pipo_rota_listar_playlists(PDO $db, int $usuarioId): void
{
    $st = $db->prepare('SELECT * FROM playlists WHERE usuario_id = ? ORDER BY obrigatoria DESC, tipo ASC, nome ASC');
    $st->execute([$usuarioId]);
    $lista = [];
    foreach ($st->fetchAll() as $pl) {
        $lista[] = pipo_playlist_publico($pl, pipo_playlist_total($db, (int) $pl['id']));
    }
    pipo_ok(['playlists' => $lista]);
}

function pipo_rota_criar_playlist(PDO $db, int $usuarioId): void
{
    $d = pipo_limpar_playlist(pipo_corpo());
    if ($d['nome'] === '') {
        pipo_erro('Informe o nome da playlist.');
    }
    $agora = gmdate('Y-m-d H:i:s');
    $st = $db->prepare('INSERT INTO playlists
        (usuario_id, nome, descricao, icone, privacidade, obrigatoria, tipo, criado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)');
    $st->execute([$usuarioId, $d['nome'], $d['descricao'], $d['icone'], $d['privacidade'], 'personalizada', $agora, $agora]);
    $pl = pipo_playlist_por_id($db, (int) $db->lastInsertId());
    pipo_ok(['playlist' => pipo_playlist_publico($pl, 0)]);
}

function pipo_rota_ver_playlist(PDO $db, array $pl): void
{
    $ids = pipo_playlist_ids($db, (int) $pl['id']);
    pipo_ok([
        'playlist' => pipo_playlist_publico($pl, count($ids)),
        'filmes'   => pipo_filmes_por_ids($db, $ids),
    ]);
}

function pipo_rota_editar_playlist(PDO $db, array $pl, array $u): void
{
    if ((int) $pl['usuario_id'] !== (int) $u['id']) {
        pipo_erro('Você só pode editar as suas playlists.', 403);
    }
    $d = pipo_limpar_playlist(pipo_corpo());
    if ($d['nome'] === '') {
        pipo_erro('Informe o nome da playlist.');
    }
    $st = $db->prepare('UPDATE playlists SET nome = ?, descricao = ?, icone = ?, privacidade = ?, atualizado_em = ? WHERE id = ?');
    $st->execute([$d['nome'], $d['descricao'], $d['icone'], $d['privacidade'], gmdate('Y-m-d H:i:s'), (int) $pl['id']]);
    $novo = pipo_playlist_por_id($db, (int) $pl['id']);
    pipo_ok(['playlist' => pipo_playlist_publico($novo, pipo_playlist_total($db, (int) $pl['id']))]);
}

function pipo_rota_excluir_playlist(PDO $db, array $pl, array $u): void
{
    if ((int) $pl['usuario_id'] !== (int) $u['id']) {
        pipo_erro('Você só pode excluir as suas playlists.', 403);
    }
    if ((int) $pl['obrigatoria'] === 1) {
        pipo_erro('As playlists Favoritos e Lista de Interesses não podem ser excluídas.');
    }
    $st = $db->prepare('DELETE FROM playlists WHERE id = ?');
    $st->execute([(int) $pl['id']]);
    pipo_ok();
}

function pipo_rota_adicionar_item(PDO $db, array $pl, array $u): void
{
    if ((int) $pl['usuario_id'] !== (int) $u['id']) {
        pipo_erro('Você só pode alterar as suas playlists.', 403);
    }
    $d = pipo_corpo();
    $filmeId = trim((string) ($d['filme_id'] ?? ''));
    if ($filmeId === '') {
        pipo_erro('Informe o filme.');
    }
    $checa = $db->prepare('SELECT id FROM filmes WHERE id = ?');
    $checa->execute([$filmeId]);
    if (!$checa->fetch()) {
        pipo_erro('Filme não encontrado.', 404);
    }
    $existe = $db->prepare('SELECT id FROM playlist_itens WHERE playlist_id = ? AND filme_id = ?');
    $existe->execute([(int) $pl['id'], $filmeId]);
    if (!$existe->fetch()) {
        $ins = $db->prepare('INSERT INTO playlist_itens (playlist_id, filme_id, criado_em) VALUES (?, ?, ?)');
        $ins->execute([(int) $pl['id'], $filmeId, gmdate('Y-m-d H:i:s')]);
    }
    pipo_ok(['total' => pipo_playlist_total($db, (int) $pl['id'])]);
}

function pipo_rota_remover_item(PDO $db, array $pl, array $u, string $filmeId): void
{
    if ((int) $pl['usuario_id'] !== (int) $u['id']) {
        pipo_erro('Você só pode alterar as suas playlists.', 403);
    }
    $filmeId = trim(urldecode($filmeId));
    $del = $db->prepare('DELETE FROM playlist_itens WHERE playlist_id = ? AND filme_id = ?');
    $del->execute([(int) $pl['id'], $filmeId]);
    pipo_ok(['total' => pipo_playlist_total($db, (int) $pl['id'])]);
}

/** Ids dos filmes de uma playlist, na ordem em que foram salvos. */
function pipo_playlist_ids(PDO $db, int $playlistId): array
{
    $st = $db->prepare('SELECT filme_id FROM playlist_itens WHERE playlist_id = ? ORDER BY id ASC');
    $st->execute([$playlistId]);
    return array_map(function ($r) { return $r['filme_id']; }, $st->fetchAll());
}

/* ------------------------------------------------------------------ *
 *  /api/favoritos  e  /api/lista-interesses
 * ------------------------------------------------------------------ */
function pipo_rota_lista_tipo(PDO $db, array $p, string $metodo, string $tipo): void
{
    $u = pipo_exigir();
    $pl = pipo_playlist_tipo($db, (int) $u['id'], $tipo);
    if (!$pl) {
        pipo_criar_playlists_obrigatorias($db, (int) $u['id']);
        $pl = pipo_playlist_tipo($db, (int) $u['id'], $tipo);
    }
    $filmeId = isset($p[1]) ? trim(urldecode((string) $p[1])) : '';

    if ($metodo === 'GET') {
        $ids = pipo_playlist_ids($db, (int) $pl['id']);
        pipo_ok([
            'playlist' => pipo_playlist_publico($pl, count($ids)),
            'filmes'   => pipo_filmes_por_ids($db, $ids),
        ]);
    }
    if ($metodo === 'POST') {
        if ($filmeId === '') {
            pipo_erro('Informe o filme.');
        }
        $checa = $db->prepare('SELECT id FROM filmes WHERE id = ?');
        $checa->execute([$filmeId]);
        if (!$checa->fetch()) {
            pipo_erro('Filme não encontrado.', 404);
        }
        $existe = $db->prepare('SELECT id FROM playlist_itens WHERE playlist_id = ? AND filme_id = ?');
        $existe->execute([(int) $pl['id'], $filmeId]);
        $ativo = (bool) $existe->fetch();
        if ($ativo) {
            $del = $db->prepare('DELETE FROM playlist_itens WHERE playlist_id = ? AND filme_id = ?');
            $del->execute([(int) $pl['id'], $filmeId]);
        } else {
            $ins = $db->prepare('INSERT INTO playlist_itens (playlist_id, filme_id, criado_em) VALUES (?, ?, ?)');
            $ins->execute([(int) $pl['id'], $filmeId, gmdate('Y-m-d H:i:s')]);
        }
        pipo_ok(['ativo' => !$ativo, 'total' => pipo_playlist_total($db, (int) $pl['id'])]);
    }
    pipo_erro('Método não permitido.', 405);
}

/* ------------------------------------------------------------------ *
 *  Filmes
 * ------------------------------------------------------------------ */

/** Filmes do catálogo no formato usado pelas telas. */
function pipo_filme_publico(array $f): array
{
    return [
        'id'         => $f['id'],
        'titulo'     => $f['titulo'],
        'ano'        => $f['ano'],
        'duracao'    => $f['duracao'],
        'generos'    => json_decode((string) $f['generos'], true) ?: [],
        'classificacao' => $f['classificacao'],
        'nota'       => (float) $f['nota'],
        'numAvaliacoes' => (int) $f['num_avaliacoes'],
        'plataforma' => $f['plataforma'],
        'imagem'     => $f['imagem'],
        'sinopse'    => $f['sinopse'],
        'trailerYoutubeId' => $f['trailer_youtube_id'],
        'elenco'     => json_decode((string) $f['elenco'], true) ?: [],
        'ondeAssistir' => json_decode((string) $f['onde_assistir'], true) ?: [],
        'relacionados' => json_decode((string) $f['relacionados'], true) ?: [],
        'diretores'  => $f['diretores'],
    ];
}

/** Filmes na ordem da lista de ids informada. */
function pipo_filmes_por_ids(PDO $db, array $ids): array
{
    if (!$ids) {
        return [];
    }
    $marcadores = implode(',', array_fill(0, count($ids), '?'));
    $st = $db->prepare("SELECT * FROM filmes WHERE id IN ($marcadores)");
    $st->execute(array_values($ids));
    $filmes = $st->fetchAll();
    $ordem = array_flip(array_values($ids));
    usort($filmes, function ($a, $b) use ($ordem) {
        return ($ordem[$a['id']] ?? 0) <=> ($ordem[$b['id']] ?? 0);
    });
    return array_map('pipo_filme_publico', $filmes);
}
