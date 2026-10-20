<?php
/**
 * rotas/admin.php — aprovação de empresas e filmes pelo administrador.
 */

function pipo_rota_admin(PDO $db, array $p, string $metodo): void
{
    pipo_exigir(['administrador']);
    $acao = $p[1] ?? '';

    // /api/admin/empresas
    if ($acao === 'empresas' && $metodo === 'GET') {
        $st = $db->prepare("SELECT id, nome, cnpj, email, criado_em, status FROM usuarios WHERE tipo = 'empresa' AND status = 'pendente' ORDER BY criado_em ASC");
        $st->execute();
        $lista = [];
        foreach ($st->fetchAll() as $e) {
            $lista[] = [
                'id'     => (int) $e['id'],
                'nome'   => $e['nome'],
                'cnpj'   => (string) $e['cnpj'],
                'email'  => $e['email'],
                'data'   => substr((string) $e['criado_em'], 0, 10),
                'status' => $e['status'],
            ];
        }
        pipo_ok($lista);
    }

    // /api/admin/empresas/{id}/aprovar|recusar
    if ($acao === 'empresas' && isset($p[3])) {
        $id = (int) $p[2];
        $novo = ($p[3] === 'aprovar') ? 'ativo' : 'recusado';
        $st = $db->prepare("UPDATE usuarios SET status = ? WHERE id = ? AND tipo = 'empresa'");
        $st->execute([$novo, $id]);
        pipo_ok();
    }

    // /api/admin/filmes/{id}/aprovar|recusar
    if ($acao === 'filmes' && isset($p[3])) {
        $novo = ($p[3] === 'aprovar') ? 'aprovado' : 'recusado';
        $st = $db->prepare('UPDATE filmes SET status = ? WHERE id = ?');
        $st->execute([$novo, (string) $p[2]]);
        pipo_ok();
    }

    pipo_erro('Rota não encontrada.', 404);
}
