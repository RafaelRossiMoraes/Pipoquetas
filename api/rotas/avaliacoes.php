<?php
/**
 * rotas/avaliacoes.php — avaliações por filme.
 *
 * Cada avaliação pertence a UM filme e a UM usuário (UNIQUE filme_id + usuario_id).
 * A média e a quantidade são calculadas por filme, nunca globalmente.
 */

function pipo_rota_avaliacoes(PDO $db, array $p, string $metodo): void
{
    $filmeId = trim((string) ($p[1] ?? ''));
    if ($filmeId === '') {
        pipo_erro('Filme não informado.');
    }
    $checa = $db->prepare('SELECT id FROM filmes WHERE id = ?');
    $checa->execute([$filmeId]);
    if (!$checa->fetch()) {
        pipo_erro('Filme não encontrado.', 404);
    }

    if ($metodo === 'GET') {
        pipo_rota_listar_avaliacoes($db, $filmeId);
    }
    if ($metodo === 'POST') {
        pipo_rota_criar_avaliacao($db, $filmeId);
    }
    pipo_erro('Método não permitido.', 405);
}

function pipo_rota_listar_avaliacoes(PDO $db, string $filmeId): void
{
    $st = $db->prepare(
        'SELECT a.id, a.nota, a.texto, a.criado_em, a.usuario_id, u.nome, u.usuario
           FROM avaliacoes a JOIN usuarios u ON u.id = a.usuario_id
          WHERE a.filme_id = ? ORDER BY a.criado_em DESC, a.id DESC'
    );
    $st->execute([$filmeId]);
    $lista = [];
    foreach ($st->fetchAll() as $a) {
        $lista[] = [
            'id'         => (int) $a['id'],
            'usuario'    => $a['nome'],
            'usuarioId'  => (int) $a['usuario_id'],
            'avatar'     => pipo_avatar((int) $a['usuario_id']),
            'nota'       => (int) $a['nota'],
            'texto'      => (string) $a['texto'],
            'criado_em'  => $a['criado_em'],
        ];
    }
    $soma = $db->prepare('SELECT AVG(nota) AS media, COUNT(*) AS quantidade FROM avaliacoes WHERE filme_id = ?');
    $soma->execute([$filmeId]);
    $r = $soma->fetch();
    pipo_ok([
        'media'      => $r && $r['media'] !== null ? round((float) $r['media'], 1) : null,
        'quantidade' => $r ? (int) $r['quantidade'] : 0,
        'lista'      => $lista,
    ]);
}

function pipo_rota_criar_avaliacao(PDO $db, string $filmeId): void
{
    // sem login não se avalia — a checagem é feita no servidor, não só na tela
    $u = pipo_exigir();
    $d = pipo_corpo();
    $nota = (int) ($d['nota'] ?? 0);
    $texto = trim((string) ($d['texto'] ?? ''));
    if ($nota < 1 || $nota > 5) {
        pipo_erro('A nota deve ser de 1 a 5 estrelas.');
    }
    if ($texto === '') {
        pipo_erro('Escreva um comentário para publicar a avaliação.');
    }
    $texto = mb_substr($texto, 0, 2000);

    // uma avaliação por usuário e por filme: se já existe, atualiza
    $existe = $db->prepare('SELECT id FROM avaliacoes WHERE filme_id = ? AND usuario_id = ?');
    $existe->execute([$filmeId, (int) $u['id']]);
    if ($existe->fetch()) {
        $up = $db->prepare('UPDATE avaliacoes SET nota = ?, texto = ?, criado_em = ? WHERE filme_id = ? AND usuario_id = ?');
        $up->execute([$nota, $texto, gmdate('Y-m-d H:i:s'), $filmeId, (int) $u['id']]);
    } else {
        $ins = $db->prepare('INSERT INTO avaliacoes (filme_id, usuario_id, nota, texto, criado_em) VALUES (?, ?, ?, ?, ?)');
        $ins->execute([$filmeId, (int) $u['id'], $nota, $texto, gmdate('Y-m-d H:i:s')]);
    }
    $soma = $db->prepare('SELECT AVG(nota) AS media, COUNT(*) AS quantidade FROM avaliacoes WHERE filme_id = ?');
    $soma->execute([$filmeId]);
    $r = $soma->fetch();
    pipo_ok([
        'media'      => $r && $r['media'] !== null ? round((float) $r['media'], 1) : null,
        'quantidade' => $r ? (int) $r['quantidade'] : 0,
    ]);
}

/** Avatar padrão do usuário (o projeto tem dois na pasta assets). */
function pipo_avatar(int $usuarioId): string
{
    return ($usuarioId % 3 === 0) ? 'assets/avatar2.png' : 'assets/avatar.png';
}
