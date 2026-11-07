<?php
/**
 * rotas/auth.php — sessão, cadastro e recuperação de senha.
 */

const PIPO_DESTINOS = [
    'usuario'       => 'index.html',
    'empresa'       => 'empresa.html',
    'administrador' => 'admin.html',
];

/** GET /api/eu — quem está logado ( conferido no servidor). */
function pipo_rota_eu(PDO $db): void
{
    $u = pipo_usuario($db);
    if (!$u) {
        pipo_ok(['logado' => false, 'usuario' => null, 'nao_lidas' => 0]);
    }
    // O contador vem junto com a sessão: evita uma segunda requisição só para
    // descobrir quantas notificações não foram lidas.
    $st = $db->prepare('SELECT COUNT(*) FROM notificacoes WHERE usuario_id = ? AND lida = 0');
    $st->execute([(int) $u['id']]);
    pipo_ok([
        'logado'    => true,
        'usuario'   => pipo_publico($u),
        'nao_lidas' => (int) $st->fetchColumn(),
    ]);
}

/** POST /api/login */
function pipo_rota_login(PDO $db): void
{
    $d = pipo_corpo();
    $ident = strtolower(trim((string) ($d['identificador'] ?? '')));
    $senha = (string) ($d['senha'] ?? '');
    if ($ident === '' || $senha === '') {
        pipo_erro('Informe usuário e senha.');
    }
    $st = $db->prepare('SELECT * FROM usuarios WHERE usuario = ? OR email = ?');
    $st->execute([$ident, $ident]);
    $u = $st->fetch();
    if (!$u || !pipo_confere_senha($senha, (string) $u['senha_hash'])) {
        pipo_erro('Usuário ou senha não conferem.', 401);
    }
    // O tipo de conta vem do banco (nunca da tela): a identificação é automática.
    if ($u['status'] === 'pendente') {
        pipo_erro('Seu cadastro ainda aguarda a aprovação do administrador.', 403);
    }
    if ($u['status'] === 'recusado') {
        pipo_erro('Cadastro recusado pelo administrador.', 403);
    }
    $token = pipo_abrir_sessao($db, (int) $u['id']);
    pipo_ok([
        'token'    => $token,
        'destino'  => PIPO_DESTINOS[$u['tipo']] ?? 'index.html',
        'usuario'  => pipo_publico($u),
    ]);
}

/** POST /api/logout */
function pipo_rota_logout(PDO $db): void
{
    $token = pipo_token();
    if ($token !== '') {
        $st = $db->prepare('DELETE FROM sessoes WHERE token = ?');
        $st->execute([$token]);
    }
    pipo_ok();
}

/** POST /api/cadastro */
function pipo_rota_cadastro(PDO $db): void
{
    $d = pipo_corpo();
    $tipo = (string) ($d['tipo'] ?? 'usuario');
    $nome = trim((string) ($d['nome'] ?? ''));
    $usuario = strtolower(trim((string) ($d['usuario'] ?? '')));
    $email = strtolower(trim((string) ($d['email'] ?? '')));
    $senha = (string) ($d['senha'] ?? '');

    // O formulário público só cria contas de cliente ou empresa. Contas de
    // administrador são criadas exclusivamente por procedimento interno.
    if ($tipo === 'administrador' || !in_array($tipo, ['usuario', 'empresa'], true)) {
        pipo_erro('Perfil inválido. Escolha Cliente ou Empresa.');
    }
    if (mb_strlen($nome) < 2) {
        pipo_erro('Informe seu nome.');
    }
    if (!preg_match('/^[a-z0-9_.-]{3,30}$/', $usuario)) {
        pipo_erro('Usuário: 3 a 30 letras minúsculas, números, ponto, hífen ou _.');
    }
    if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
        pipo_erro('E-mail inválido.');
    }
    if (mb_strlen($senha) < 6) {
        pipo_erro('A senha precisa ter pelo menos 6 caracteres.');
    }
    $cnpj = null;
    if ($tipo === 'empresa') {
        $cnpj = preg_replace('/\D/', '', (string) ($d['cnpj'] ?? ''));
        if (strlen($cnpj) !== 14) {
            pipo_erro('CNPJ inválido (são 14 números).');
        }
        $cnpj = substr($cnpj, 0, 2) . '.' . substr($cnpj, 2, 3) . '.' . substr($cnpj, 5, 3) . '/' . substr($cnpj, 8, 4) . '-' . substr($cnpj, 12);
    }
    $checa = $db->prepare('SELECT id FROM usuarios WHERE usuario = ? OR email = ?');
    $checa->execute([$usuario, $email]);
    if ($checa->fetch()) {
        pipo_erro('Usuário ou e-mail já cadastrado.', 409);
    }
    $status = ($tipo === 'empresa') ? 'pendente' : 'ativo';
    $st = $db->prepare('INSERT INTO usuarios (tipo, nome, usuario, email, senha_hash, cnpj, nascimento, status, criado_em)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $st->execute([
        $tipo, $nome, $usuario, $email, pipo_hash_senha($senha), $cnpj,
        !empty($d['nascimento']) ? substr((string) $d['nascimento'], 0, 10) : null,
        $status, gmdate('Y-m-d H:i:s'),
    ]);
    $id = (int) $db->lastInsertId();

    // todo usuário novo nasce com as duas playlists obrigatórias
    pipo_criar_playlists_obrigatorias($db, $id);

    if ($status === 'pendente') {
        pipo_ok(['ok' => true, 'mensagem' => 'Cadastro enviado! Aguarde a aprovação do administrador para entrar.']);
    }
    $token = pipo_abrir_sessao($db, $id);
    // Lê o registro recém-criado para devolver também nascimento e data de cadastro.
    $novo = $db->prepare('SELECT * FROM usuarios WHERE id = ?');
    $novo->execute([$id]);
    $registro = $novo->fetch() ?: [
        'id' => $id, 'tipo' => $tipo, 'nome' => $nome, 'usuario' => $usuario, 'email' => $email,
    ];
    pipo_ok(['token' => $token, 'destino' => PIPO_DESTINOS[$tipo], 'usuario' => pipo_publico($registro)]);
}

/** POST /api/esqueci-senha */
function pipo_rota_esqueci(PDO $db): void
{
    $d = pipo_corpo();
    $ident = strtolower(trim((string) ($d['identificador'] ?? '')));
    $r = ['mensagem' => 'Se a conta existir, um código de 6 dígitos foi gerado (vale por 15 minutos).'];
    $st = $db->prepare('SELECT id FROM usuarios WHERE usuario = ? OR email = ?');
    $st->execute([$ident, $ident]);
    $u = $st->fetch();
    if ($u) {
        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $r['codigo'] = $codigo; // modo demonstração: sem e-mail, o código aparece na tela
        $st = $db->prepare('INSERT INTO sessoes (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)');
        $st->execute(['reset:' . $codigo, (int) $u['id'], gmdate('Y-m-d H:i:s'), gmdate('Y-m-d H:i:s', time() + 900)]);
    }
    pipo_ok($r);
}

/** POST /api/redefinir-senha */
function pipo_rota_redefinir(PDO $db): void
{
    $d = pipo_corpo();
    $ident = strtolower(trim((string) ($d['identificador'] ?? '')));
    $codigo = trim((string) ($d['codigo'] ?? ''));
    $senha = (string) ($d['senha'] ?? '');
    $st = $db->prepare('SELECT id FROM usuarios WHERE usuario = ? OR email = ?');
    $st->execute([$ident, $ident]);
    $u = $st->fetch();
    if (!$u) {
        pipo_erro('Código inválido ou expirado. Peça um novo.', 400);
    }
    $checa = $db->prepare('SELECT * FROM sessoes WHERE token = ? AND usuario_id = ?');
    $checa->execute(['reset:' . $codigo, (int) $u['id']]);
    $r = $checa->fetch();
    if (!$r || strtotime((string) $r['expira_em']) < time()) {
        pipo_erro('Código inválido ou expirado. Peça um novo.', 400);
    }
    if (mb_strlen($senha) < 6) {
        pipo_erro('A nova senha precisa ter pelo menos 6 caracteres.');
    }
    $up = $db->prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?');
    $up->execute([pipo_hash_senha($senha), (int) $u['id']]);
    $del = $db->prepare('DELETE FROM sessoes WHERE token = ?');
    $del->execute(['reset:' . $codigo]);
    pipo_ok(['mensagem' => 'Senha alterada! Já pode entrar.']);
}

/** POST /api/perfil/senha — troca a senha do usuário logado. */
function pipo_rota_perfil(PDO $db, array $p, string $metodo): void
{
    $u = pipo_exigir();
    if (($p[1] ?? '') !== 'senha' || $metodo !== 'POST') {
        pipo_erro('Rota não encontrada.', 404);
    }
    $d = pipo_corpo();
    $atual = (string) ($d['senha_atual'] ?? '');
    $nova = (string) ($d['nova_senha'] ?? '');
    $st = $db->prepare('SELECT senha_hash FROM usuarios WHERE id = ?');
    $st->execute([(int) $u['id']]);
    $hash = (string) $st->fetchColumn();
    if (!pipo_confere_senha($atual, $hash)) {
        pipo_erro('A senha atual não confere.', 403);
    }
    if (mb_strlen($nova) < 6) {
        pipo_erro('A nova senha precisa ter pelo menos 6 caracteres.');
    }
    $up = $db->prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?');
    $up->execute([pipo_hash_senha($nova), (int) $u['id']]);
    // Mantém a sessão atual e encerra as outras por segurança.
    $del = $db->prepare('DELETE FROM sessoes WHERE usuario_id = ? AND token <> ?');
    $del->execute([(int) $u['id'], pipo_token()]);
    pipo_ok(['mensagem' => 'Senha alterada com sucesso.']);
}

/**
 * POST /api/clientes/importar — traz as contas que existiam no navegador (localStorage)
 * para o banco, sem duplicar e sem trocar a senha de quem já está aqui.
 */
function pipo_rota_importar(PDO $db): void
{
    $d = pipo_corpo();
    $lista = $d['clientes'] ?? [];
    if (!is_array($lista)) {
        pipo_ok(['importados' => 0]);
    }
    $ins = $db->prepare('INSERT INTO usuarios (tipo, nome, usuario, email, senha_hash, cnpj, nascimento, status, criado_em)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $checa = $db->prepare('SELECT id FROM usuarios WHERE usuario = ? OR email = ?');
    $n = 0;
    foreach ($lista as $c) {
        if (!is_array($c) || empty($c['usuario']) || empty($c['email'])) {
            continue;
        }
        $checa->execute([$c['usuario'], $c['email']]);
        if ($checa->fetch()) {
            continue;
        }
        $senha = (string) ($c['senha_hash'] ?? '');
        if (strpos($senha, 'bcrypt:') !== 0 && strpos($senha, 'cyrb53:') !== 0) {
            $senha = 'cyrb53:' . pipo_cyrb53('123456');
        }
        // Contas administrativas nunca entram por importação do navegador.
        $tipoImportado = in_array($c['tipo'] ?? 'usuario', ['usuario', 'empresa'], true) ? $c['tipo'] : 'usuario';
        $ins->execute([
            $tipoImportado, $c['nome'] ?? $c['usuario'], $c['usuario'], $c['email'], $senha,
            $c['cnpj'] ?? null, $c['nascimento'] ?? null, $c['status'] ?? 'ativo',
            $c['criado_em'] ?? gmdate('Y-m-d H:i:s'),
        ]);
        pipo_criar_playlists_obrigatorias($db, (int) $db->lastInsertId());
        $n++;
    }
    pipo_ok(['importados' => $n]);
}

/** GET /api/clientes/export — download dos cadastros (usado pelo botão da tela de login). */
function pipo_rota_exportar(PDO $db): void
{
    // sem senha: só os dados de cadastro
    $usuarios = $db->query('SELECT id, tipo, nome, usuario, email, cnpj, nascimento, status, criado_em FROM usuarios ORDER BY id')->fetchAll();
    pipo_ok(['clientes' => $usuarios]);
}
