<?php
/**
 * servidor-router.php — roteador do servidor PHP embutido (php -S).
 *
 * Vantagens em relação a iniciar um processo PHP novo a cada chamada:
 *   - a API responde muito mais rápido;
 *   - arquivos estáticos recebem cache/ETag e compressão gzip;
 *   - arquivos sensíveis (banco SQLite, scripts locais) não são expostos.
 *
 * Para usar pelo XAMPP/Apache este arquivo é ignorado.
 */

$caminho = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$caminho = str_replace('\\', '/', $caminho);
if ($caminho === '' || $caminho === '/') {
    $caminho = '/index.html';
}
if (substr($caminho, -1) === '/') {
    $caminho .= 'index.html';
}

// Nunca serve banco de dados, arquivos de controle ou scripts do projeto.
if (preg_match('#(^|/)\.#', $caminho)
    || preg_match('#^/dados/#i', $caminho)
    || preg_match('#\.(sqlite|sqlite3|db|bat|ps1|py|log)$#i', $caminho)
    || preg_match('#^/(servidor-router|gerar_dados_filmes)\.#i', $caminho)
) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    return true;
}

// A API continua sendo executada pelo PHP normalmente.
if (preg_match('#^/api/[^/]+\.php$#', $caminho)) {
    if ($caminho !== '/api/index.php') {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Not found';
        return true;
    }
    return false;
}

$arquivo = __DIR__ . DIRECTORY_SEPARATOR . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $caminho), DIRECTORY_SEPARATOR);
$real = realpath($arquivo);
$raiz = realpath(__DIR__);
if ($real === false || $raiz === false || strpos($real, $raiz) !== 0 || !is_file($real)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    return true;
}

$ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
$tipos = [
    'html' => 'text/html; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'js'   => 'application/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'ico'  => 'image/x-icon',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf'  => 'font/ttf',
    'otf'  => 'font/otf',
    'txt'  => 'text/plain; charset=utf-8',
];
if (!isset($tipos[$ext])) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    return true;
}

$mtime = (int) filemtime($real);
$tamanho = (int) filesize($real);
$etag = '"' . dechex($mtime) . '-' . dechex($tamanho) . '"';

if ($ext === 'html') {
    $cache = 'no-cache, must-revalidate';
} elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'otf'], true)) {
    $cache = 'public, max-age=604800';
} else {
    $cache = 'public, max-age=300, must-revalidate';
}

header('Content-Type: ' . $tipos[$ext]);
header('Cache-Control: ' . $cache);
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('X-Content-Type-Options: nosniff');
header('Vary: Accept-Encoding');

if (trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
    http_response_code(304);
    return true;
}

$texto = in_array($ext, ['html', 'css', 'js', 'json', 'svg', 'txt'], true);
$aceitaGzip = stripos((string) ($_SERVER['HTTP_ACCEPT_ENCODING'] ?? ''), 'gzip') !== false;
if ($texto && $aceitaGzip && $tamanho > 1024 && function_exists('gzencode')) {
    $conteudo = gzencode((string) file_get_contents($real), 6);
    header('Content-Encoding: gzip');
    header('Content-Length: ' . strlen($conteudo));
    echo $conteudo;
    return true;
}

header('Content-Length: ' . $tamanho);
readfile($real);
return true;
