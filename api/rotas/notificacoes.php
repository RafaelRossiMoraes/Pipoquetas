<?php
/**
 * rotas/notificacoes.php — notificações do usuário logado.
 */

function pipo_rota_notificacoes(PDO $db, array $p, string $metodo): void
{
    $u = pipo_exigir();
    $usuarioId = (int) $u['id'];

    // /api/notificacoes/ler-todas
    if (($p[1] ?? '') === 'ler-todas' && $metodo === 'POST') {
        $st = $db->prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?');
        $st->execute([$usuarioId]);
        pipo_ok(['nao_lidas' => 0]);
    }

    // /api/notificacoes/{id}/lida
    if (($p[2] ?? '') === 'lida' && $metodo === 'POST') {
        $st = $db->prepare('UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?');
        $st->execute([(int) ($p[1] ?? 0), $usuarioId]);
        pipo_rota_listar_notificacoes($db, $usuarioId);
    }

    if (($p[1] ?? '') === '' && $metodo === 'GET') {
        pipo_rota_listar_notificacoes($db, $usuarioId);
    }
    pipo_erro('Rota não encontrada.', 404);
}

function pipo_rota_listar_notificacoes(PDO $db, int $usuarioId): void
{
    $st = $db->prepare('SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY criado_em DESC, id DESC');
    $st->execute([$usuarioId]);
    $lista = [];
    $naoLidas = 0;
    foreach ($st->fetchAll() as $n) {
        if ((int) $n['lida'] === 0) {
            $naoLidas++;
        }
        $lista[] = [
            'id'         => (int) $n['id'],
            'tipo'       => $n['tipo'],
            'icone'      => $n['icone'],
            'imagem'     => $n['imagem'],
            'titulo'     => $n['titulo'],
            'descricao'  => (string) $n['descricao'],
            'link'       => $n['link'],
            'lida'       => (int) $n['lida'] === 1,
            'criado_em'  => $n['criado_em'],
        ];
    }
    pipo_ok(['notificacoes' => $lista, 'nao_lidas' => $naoLidas]);
}
