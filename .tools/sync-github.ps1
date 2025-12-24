param(
  [string]$Branch = "main"
)

$root = (Get-Location).Path
$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir "sync-github.log"

function Log($msg, $kind = "info") {
  $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  $line = "[SYNC][$kind][$ts] $msg"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

Log "Inicio"

if (-not (Test-Path ".git")) {
  Log "Inicializando repositorio" "info"
  git init | Out-Null
  git branch -M $Branch | Out-Null
}

$remoteUrl = git config --get remote.origin.url
if (-not $remoteUrl) {
  if (Test-Path "github_config.md") {
    $cfg = Get-Content "github_config.md" -Raw
    $m = Select-String -InputObject $cfg -Pattern "repo_url:\s*(.+)" -AllMatches
    if ($m.Matches.Count -gt 0) {
      $url = $m.Matches[0].Groups[1].Value.Trim()
      git remote add origin $url | Out-Null
      Log "Remote origin definido: $url" "info"
      $remoteUrl = $url
    } else {
      Log "github_config.md sem repo_url" "error"
      exit 1
    }
  } else {
    Log "Remote origin ausente" "error"
    exit 1
  }
}

Log "Validando acesso ao remoto" "info"
$ls = git ls-remote --heads origin 2>&1
if ($LASTEXITCODE -ne 0) {
  Log ("Falha ao acessar remoto: " + $ls) "error"
  exit 1
}
Log "Remoto acessivel" "success"

$porcelain = git status --porcelain
Log ("Status: " + ((git status -b) -join " ")) "info"

if ($porcelain) {
  git add -A | Out-Null
  $changed = ($porcelain -split "`n" | Where-Object { $_.Trim() -ne "" })
  $msg = "chore(sync): auto-sync " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + " - " + ($changed.Count) + " alteracoes"
  Log ("Commit: " + $msg) "info"
  $commitOut = git commit -m $msg 2>&1
  if ($LASTEXITCODE -ne 0) {
    Log ("Sem mudanças para commit: " + $commitOut) "info"
  } else {
    Log ("Commit efetuado") "success"
  }
} else {
  Log "Sem alteracoes locais" "info"
}

$curBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($curBranch -eq "HEAD" -or $curBranch -eq "") {
  git branch -M $Branch | Out-Null
  $curBranch = $Branch
}
Log ("Branch atual: " + $curBranch) "info"

Log "Sincronizando com remoto (pull --rebase)" "info"
$pullOut = git pull --rebase origin $curBranch 2>&1
if ($LASTEXITCODE -ne 0) {
  Log ("Conflitos no rebase: " + $pullOut) "error"
  git rebase --abort | Out-Null
  Log "Rebase abortado. Resolva conflitos e reexecute." "error"
  exit 1
}
Log "Pull concluido" "success"

Log "Enviando alterações (push)" "info"
$pushOut = git push origin $curBranch 2>&1
if ($LASTEXITCODE -ne 0) {
  Log ("Falha no push: " + $pushOut) "error"
  exit 1
}
Log "Push concluido" "success"

Log "Fim com sucesso" "success"
