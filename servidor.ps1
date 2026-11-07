# servidor.ps1 - mini servidor local do Pipoquetas. Abre o site em http://localhost:8080
# Use pelo INICIAR.bat. Para parar, feche a janela preta.
#
# Quando o PHP do XAMPP está disponível, usa o servidor embutido do PHP
# (php -S). Assim a API não precisa iniciar um processo novo a cada chamada,
# o que era um dos principais motivos da lentidão. Sem PHP, cai no modo
# somente-estático (login, playlists etc. ficam indisponíveis).

$porta = 8080
$raiz = (Split-Path -Parent $MyInvocation.MyCommand.Path).TrimEnd('\') + '\'
$router = Join-Path $raiz "servidor-router.php"
$tipos = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".svg" = "image/svg+xml"; ".png" = "image/png"; ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"; ".gif" = "image/gif"; ".webp" = "image/webp"; ".ico" = "image/x-icon"
  ".woff" = "font/woff"; ".woff2" = "font/woff2"; ".ttf" = "font/ttf"; ".otf" = "font/otf"
  ".txt" = "text/plain; charset=utf-8"
}

# ---------- procura o PHP (XAMPP) ----------
function Procurar-Php {
  $candidatos = @(
    (Join-Path $raiz "..\..\..\php\php.exe"),
    "C:\xampp\php\php.exe",
    "$env:ProgramFiles\xampp\php\php.exe",
    "${env:ProgramFiles(x86)}\xampp\php\php.exe",
    "$env:LOCALAPPDATA\Programs\xampp\php\php.exe"
  )
  foreach ($c in $candidatos) {
    if (Test-Path $c) { return (Resolve-Path $c).Path }
  }
  $cmd = Get-Command php -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}
$php = Procurar-Php

# Reconfere o banco a cada vez que o servidor é iniciado (e não a cada requisição).
$cacheDriver = Join-Path $raiz "dados\.pipo_driver"
if (Test-Path $cacheDriver) { Remove-Item $cacheDriver -Force -ErrorAction SilentlyContinue }

if ($php) {
  Write-Host "Pipoquetas rodando em http://localhost:$porta  (feche esta janela para parar)"
  Write-Host "API e banco de dados: $php (servidor embutido, com cache de arquivos)"
  $argumentos = '-d display_errors=stderr -d error_reporting=E_ALL -d html_errors=0 -S localhost:' + $porta +
    ' -t "' + $raiz.TrimEnd('\') + '" "' + $router + '"'
  $processo = Start-Process -FilePath $php -ArgumentList $argumentos -NoNewWindow -PassThru
  Start-Sleep -Milliseconds 700
  Start-Process "http://localhost:$porta/index.html"
  Wait-Process -Id $processo.Id
  exit 0
}

Write-Host "ATENCAO: nao achei o PHP. A API (login, playlists, avaliacoes) nao vai funcionar."
Write-Host "Instale o XAMPP (C:\xampp\php\php.exe) ou ajuste o caminho em servidor.ps1."
Write-Host "Pipoquetas rodando em http://localhost:$porta  (modo somente estatico)"

# ---------- modo somente estático (sem PHP) ----------
$escutador = New-Object System.Net.HttpListener
$escutador.Prefixes.Add("http://localhost:$porta/")
try {
  $escutador.Start()
} catch {
  Write-Host "Nao consegui iniciar na porta $porta. Feche outro programa que use essa porta ou troque o numero no arquivo servidor.ps1."
  Write-Host $_.Exception.Message
  exit 1
}

Start-Process "http://localhost:$porta/index.html"

while ($escutador.IsListening) {
  $ctx = $escutador.GetContext()
  try {
    $pedido = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($pedido -eq "") { $pedido = "index.html" }
    $arquivo = [System.IO.Path]::GetFullPath((Join-Path $raiz $pedido))
    $sensivel = $arquivo.ToLower().EndsWith("tmdb_chave.txt") -or
                $arquivo.ToLower().EndsWith(".sqlite") -or
                $arquivo.ToLower().EndsWith(".sqlite-wal") -or
                $arquivo.ToLower().EndsWith(".sqlite-shm") -or
                $arquivo.ToLower().EndsWith(".ps1") -or
                $arquivo.ToLower().EndsWith(".bat")
    $liberado = $arquivo.StartsWith($raiz) -and (Test-Path $arquivo -PathType Leaf) -and -not $sensivel

    if (-not $liberado) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.OutputStream.Close()
      continue
    }

    $ext = [System.IO.Path]::GetExtension($arquivo).ToLower()
    if ($ext -eq ".php") {
      $ctx.Response.StatusCode = 503
      $texto = '{"erro":"PHP nao encontrado: a API do Pipoquetas precisa do PHP do XAMPP."}'
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)
      $ctx.Response.ContentType = "application/json; charset=utf-8"
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $ctx.Response.OutputStream.Close()
      continue
    }

    $mtime = [System.IO.File]::GetLastWriteTimeUtc($arquivo)
    $etag = '"' + $mtime.Ticks.ToString("x") + '-' + (Get-Item $arquivo).Length.ToString("x") + '"'
    $cache = if ($ext -eq ".html") { "no-cache, must-revalidate" } elseif ($ext -in @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".otf")) { "public, max-age=604800" } else { "public, max-age=300, must-revalidate" }
    $ctx.Response.Headers["Cache-Control"] = $cache
    $ctx.Response.Headers["ETag"] = $etag
    if ($ctx.Request.Headers["If-None-Match"] -eq $etag) {
      $ctx.Response.StatusCode = 304
      $ctx.Response.OutputStream.Close()
      continue
    }

    $ctx.Response.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($arquivo)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $ctx.Response.StatusCode = 500
  }
  $ctx.Response.OutputStream.Close()
}
