# servidor.ps1 - mini servidor local do Pipoquetas. Abre o site em http://localhost:8080
# Use pelo INICIAR.bat. Para parar, feche a janela preta.
#
# Serve os arquivos do site e executa os arquivos .php (api/index.php) com o PHP do XAMPP,
# que é quem conversa com o banco de dados (MySQL do XAMPP ou SQLite em dados/pipoquetas.sqlite).
$porta = 8080
$raiz = (Split-Path -Parent $MyInvocation.MyCommand.Path).TrimEnd('\') + '\'
$tipos = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".svg" = "image/svg+xml"; ".png" = "image/png"; ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"; ".gif" = "image/gif"; ".webp" = "image/webp"; ".ico" = "image/x-icon"
  ".woff" = "font/woff"; ".woff2" = "font/woff2"; ".ttf" = "font/ttf"; ".txt" = "text/plain; charset=utf-8"
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
if (-not $php) {
  Write-Host "ATENCAO: nao achei o PHP. A API (login, playlists, avaliacoes) nao vai funcionar."
  Write-Host "Instale o XAMPP (C:\xampp\php\php.exe) ou ajuste o caminho em servidor.ps1."
}

$escutador = New-Object System.Net.HttpListener
$escutador.Prefixes.Add("http://localhost:$porta/")
try {
  $escutador.Start()
} catch {
  Write-Host "Nao consegui iniciar na porta $porta. Feche outro programa que use essa porta ou troque o numero no arquivo servidor.ps1."
  Write-Host $_.Exception.Message
  exit 1
}

Write-Host "Pipoquetas rodando em http://localhost:$porta  (feche esta janela para parar)"
if ($php) { Write-Host "API e banco de dados: $php" } else { Write-Host "API e banco de dados: DESATIVADOS (sem PHP)" }
Start-Process "http://localhost:$porta/index.html"

function Responder-Json($ctx, $status, $texto) {
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = "application/json; charset=utf-8"
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.OutputStream.Close()
}

while ($escutador.IsListening) {
  $ctx = $escutador.GetContext()
  try {
    $pedido = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($pedido -eq "") { $pedido = "index.html" }
    $arquivo = [System.IO.Path]::GetFullPath((Join-Path $raiz $pedido))
    $liberado = $arquivo.StartsWith($raiz) -and (Test-Path $arquivo -PathType Leaf) -and -not $arquivo.ToLower().EndsWith("tmdb_chave.txt")

    if (-not $liberado) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.OutputStream.Close()
      continue
    }

    $ext = [System.IO.Path]::GetExtension($arquivo).ToLower()

    # ---------- arquivo PHP: a API ----------
    if ($ext -eq ".php") {
      if (-not $php) {
        Responder-Json $ctx 503 '{"erro":"PHP nao encontrado: a API do Pipoquetas precisa do PHP do XAMPP."}'
        continue
      }
      $corpo = ""
      if ($ctx.Request.HasEntityBody) {
        $ms = New-Object System.IO.MemoryStream
        $ctx.Request.InputStream.CopyTo($ms)
        $corpo = [Convert]::ToBase64String($ms.ToArray())
        $ms.Dispose()
      }
      $psi = New-Object System.Diagnostics.ProcessStartInfo
      $psi.FileName = $php
      $psi.Arguments = '-d display_errors=stderr -d error_reporting=E_ALL -d html_errors=0 "' + $arquivo + '"'
      $psi.UseShellExecute = $false
      $psi.RedirectStandardOutput = $true
      $psi.RedirectStandardError = $true
      $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
      $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
      $psi.CreateNoWindow = $true
      $psi.WorkingDirectory = $raiz
      $psi.EnvironmentVariables["REQUEST_METHOD"] = [string]$ctx.Request.HttpMethod
      $psi.EnvironmentVariables["REQUEST_URI"] = [string]$ctx.Request.RawUrl
      $query = [string]$ctx.Request.Url.Query
      if ($query.StartsWith("?")) { $query = $query.Substring(1) }
      $psi.EnvironmentVariables["QUERY_STRING"] = $query
      $psi.EnvironmentVariables["CONTENT_TYPE"] = [string]$ctx.Request.ContentType
      $psi.EnvironmentVariables["CONTENT_LENGTH"] = [string]$ctx.Request.ContentLength
      $psi.EnvironmentVariables["SCRIPT_NAME"] = "/" + $pedido
      $psi.EnvironmentVariables["PIPO_BODY_B64"] = $corpo
      if ($ctx.Request.RemoteEndpointAddress) {
        $psi.EnvironmentVariables["REMOTE_ADDR"] = [string]$ctx.Request.RemoteEndpointAddress.Address
      }
      $token = $ctx.Request.Headers["X-Pipoquetas-Token"]
      if ($token) { $psi.EnvironmentVariables["HTTP_X_PIPOQUETAS_TOKEN"] = $token }

      $proc = [System.Diagnostics.Process]::Start($psi)
      $saida = $proc.StandardOutput.ReadToEnd()
      $erroSaida = $proc.StandardError.ReadToEnd()
      $proc.WaitForExit()

      if ($erroSaida) { Write-Host "PHP: $erroSaida" }

      # a primeira linha pode trazer o status HTTP (PIPO-STATUS: 404)
      $status = 200
      $linhas = $saida -split "`r?`n"
      if ($linhas.Count -gt 1 -and $linhas[0] -like "PIPO-STATUS:*") {
        $status = [int]($linhas[0] -replace "PIPO-STATUS:\s*", "")
        $saida = ($linhas[1..($linhas.Count - 1)] -join "`n")
      }
      Responder-Json $ctx $status $saida
      continue
    }

    # ---------- arquivo comum ----------
    $ctx.Response.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($arquivo)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $ctx.Response.StatusCode = 500
  }
  $ctx.Response.OutputStream.Close()
}
