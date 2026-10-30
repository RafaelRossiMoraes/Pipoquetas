<?php
/**
 * index.php — ponto de entrada da API do Pipoquetas.
 *
 * Uso:  api/index.php?r=<rota>
 *   GET  /api/eu
 *   POST /api/login | /api/logout | /api/cadastro | /api/esqueci-senha | /api/redefinir-senha
 *   GET  /api/filmes | /api/filmes/catalogo | /api/filmes/{id}/avaliacoes
 *   GET  /api/playlists          POST /api/playlists
 *   GET  /api/playlists/{id}     PUT /api/playlists/{id}   DELETE /api/playlists/{id}
 *   POST /api/playlists/{id}/itens         DELETE /api/playlists/{id}/itens/{filmeId}
 *   GET  /api/favoritos          POST /api/favoritos/{filmeId}
 *   GET  /api/lista-interesses   POST /api/lista-interesses/{filmeId}
 *   GET  /api/notificacoes       POST /api/notificacoes/{id}/lida | /api/notificacoes/ler-todas
 *   GET  /api/admin/empresas     POST /api/admin/empresas/{id}/aprovar|recusar
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/rotas/auth.php';
require_once __DIR__ . '/rotas/playlists.php';
require_once __DIR__ . '/rotas/avaliacoes.php';
require_once __DIR__ . '/rotas/notificacoes.php';
require_once __DIR__ . '/rotas/filmes.php';
require_once __DIR__ . '/rotas/admin.php';

$db = pipo_db();

$rota = (string) ($_GET['r'] ?? '');
if ($rota === '') {
    // servidor.ps1 roda o PHP pela linha de comando: a query string vem por $_SERVER
    $query = (string) ($_SERVER['QUERY_STRING'] ?? '');
    if (substr($query, 0, 1) === '?') {
        $query = substr($query, 1);
    }
    $partes = [];
    parse_str($query, $partes);
    $rota = (string) ($partes['r'] ?? '');
}
$metodo = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$partes = array_values(array_filter(explode('/', trim($rota, '/')), 'strlen'));
$principal = $partes[0] ?? '';

// rota com parâmetro: /api/filmes/{id}/avaliacoes -> ["filmes", "{id}", "avaliacoes"]
switch ($principal) {
    case 'eu':
        pipo_rota_eu($db);
        break;

    case 'login':
        pipo_rota_login($db);
        break;

    case 'logout':
        pipo_rota_logout($db);
        break;

    case 'cadastro':
        pipo_rota_cadastro($db);
        break;

    case 'esqueci-senha':
        pipo_rota_esqueci($db);
        break;

    case 'redefinir-senha':
        pipo_rota_redefinir($db);
        break;

    case 'clientes':
        if (($partes[1] ?? '') === 'importar') {
            pipo_rota_importar($db);
        }
        pipo_rota_exportar($db);
        break;

    case 'filmes':
        pipo_rota_filmes($db, $partes, $metodo);
        break;

    case 'playlists':
        pipo_rota_playlists($db, $partes, $metodo);
        break;

    case 'favoritos':
        pipo_rota_lista_tipo($db, $partes, $metodo, 'favoritos');
        break;

    case 'lista-interesses':
        pipo_rota_lista_tipo($db, $partes, $metodo, 'lista-interesses');
        break;

    case 'notificacoes':
        pipo_rota_notificacoes($db, $partes, $metodo);
        break;

    case 'admin':
        pipo_rota_admin($db, $partes, $metodo);
        break;

    default:
        pipo_erro('Rota não encontrada.', 404);
}
