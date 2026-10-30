<?php
/**
 * auth.php — sessão, autorização e respostas JSON da API.
 *
 * A sessão é um token aleatório guardado na tabela `sessoes` e enviado pelo
 * navegador no cabeçalho `X-Pipoquetas-Token`. Toda rota que exige login
 * confere o token no servidor — nunca só na interface.
 */

define('PIPO_SESSAO_DIAS', 30);

/** Token da requisição atual. */
function pipo_token(): string
{
    if (!empty($_SERVER['HTTP_X_PIPOQUETAS_TOKEN'])) {
        return trim((string) $_SERVER['HTTP_X_PIPOQUETAS_TOKEN']);
    }
    if (!empty($_GET['token'])) {
        return trim((string) $_GET['token']);
    }
    return '';
}

/** Usuário logado (ou null). Confere a validade da sessão no servidor. */
function pipo_usuario(?PDO $db = null): ?array
{
    $token = pipo_token();
    if ($token === '') {
        return null;
    }
    $db = $db ?: pipo_db();
    $st = $db->prepare('SELECT u.*, s.expira_em FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?');
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) {
        return null;
    }
    if (strtotime((string) $u['expira_em']) < time()) {
        $del = $db->prepare('DELETE FROM sessoes WHERE token = ?');
        $del->execute([$token]);
        return null;
    }
    return $u;
}

/** Exige login (e opcionalmente um tipo de conta). Encerra a requisição se falhar. */
function pipo_exigir(array $tipos = []): array
{
    $u = pipo_usuario();
    if (!$u) {
        pipo_erro('Entre na sua conta para continuar.', 401);
    }
    if ($tipos && !in_array($u['tipo'], $tipos, true)) {
        pipo_erro('Acesso negado.', 403);
    }
    return $u;
}

/** Abre uma sessão nova e devolve o token. */
function pipo_abrir_sessao(PDO $db, int $usuarioId): string
{
    $token = bin2hex(random_bytes(24));
    $agora = time();
    $st = $db->prepare('INSERT INTO sessoes (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)');
    $st->execute([
        $token,
        $usuarioId,
        gmdate('Y-m-d H:i:s', $agora),
        gmdate('Y-m-d H:i:s', $agora + PIPO_SESSAO_DIAS * 86400),
    ]);
    return $token;
}

/** Dados do usuário sem dados sensíveis. */
function pipo_publico(array $u): array
{
    return [
        'id'          => (int) $u['id'],
        'tipo'        => $u['tipo'],
        'nome'        => $u['nome'],
        'usuario'     => $u['usuario'],
        'email'       => $u['email'],
        'nascimento'  => $u['nascimento'],
        'criado_em'   => $u['criado_em'],
    ];
}

/* ------------------------------------------------------------------ *
 *  Respostas
 * ------------------------------------------------------------------ */

/** Sucesso: o corpo da resposta É o conteúdo pedido. */
function pipo_ok($dados = null, int $status = 200): void
{
    pipo_json(is_array($dados) ? $dados : ['dados' => $dados], $status);
}

/** Erro: a resposta sai com o status HTTP e a mensagem em {erro}. */
function pipo_erro(string $mensagem, int $status = 400): void
{
    pipo_json(['erro' => $mensagem], $status);
}

/** Envia a resposta JSON e encerra o script. */
function pipo_json(array $dados, int $status = 200): void
{
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
    }
    // Quando o PHP roda pela linha de comando (servidor.ps1) não há cabeçalhos:
    // a primeira linha carrega o status para o servidor montar a resposta HTTP.
    if (PHP_SAPI === 'cli') {
        echo 'PIPO-STATUS: ' . $status . "\n";
    }
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Corpo da requisição (JSON, formulário ou nada). */
function pipo_corpo(): array
{
    $bruto = '';
    $b64 = getenv('PIPO_BODY_B64');
    if ($b64 !== false && $b64 !== '') {
        $bruto = (string) base64_decode($b64, true);
    }
    if ($bruto === '') {
        $bruto = (string) file_get_contents('php://input');
    }
    if ($bruto === '' && !empty($_POST)) {
        return $_POST;
    }
    if ($bruto === '') {
        return [];
    }
    $json = json_decode($bruto, true);
    if (is_array($json)) {
        return $json;
    }
    $form = [];
    parse_str($bruto, $form);
    return is_array($form) ? $form : [];
}
