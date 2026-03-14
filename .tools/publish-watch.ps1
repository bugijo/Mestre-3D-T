$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$urlFile = Join-Path $PSScriptRoot 'public-url.txt'
$logFile = Join-Path $PSScriptRoot 'publish-watch.log'
$stdoutFile = Join-Path $PSScriptRoot 'publish-watch.stdout.log'
$stderrFile = Join-Path $PSScriptRoot 'publish-watch.stderr.log'
$restartDelaySeconds = if ($env:PUBLISH_RESTART_DELAY_SECONDS) { [int]$env:PUBLISH_RESTART_DELAY_SECONDS } else { 8 }

function Write-Log {
  param([string]$Message)

  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $logFile -Value $line
  Write-Host $line
}

function Extract-PublicUrl {
  param([string]$Text)

  if (-not $Text) {
    return $null
  }

  $match = [regex]::Match($Text, 'https://[a-z0-9.-]+\.[a-z]{2,}')
  if ($match.Success) {
    return $match.Value
  }

  return $null
}

Remove-Item $stdoutFile, $stderrFile -Force -ErrorAction SilentlyContinue

Write-Log "Supervisor de publicacao iniciado."

while ($true) {
  Set-Location $root
  Remove-Item $stdoutFile, $stderrFile -Force -ErrorAction SilentlyContinue

  $process = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', 'npm run publish:test' `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdoutFile `
    -RedirectStandardError $stderrFile `
    -PassThru

  Write-Log "Processo publish:test iniciado com PID $($process.Id)."

  $url = $null
  $deadline = (Get-Date).AddMinutes(3)

  while (-not $process.HasExited -and (Get-Date) -lt $deadline) {
    if (Test-Path $stdoutFile) {
      $content = Get-Content $stdoutFile -Raw
      $url = Extract-PublicUrl -Text $content
      if ($url) {
        Set-Content -Path $urlFile -Value $url
        Write-Log "URL publica ativa: $url"
        break
      }
    }

    Start-Sleep -Seconds 2
    $process.Refresh()
  }

  if (-not $url) {
    if (Test-Path $stderrFile) {
      $stderr = Get-Content $stderrFile -Raw
      if ($stderr) {
        Write-Log "stderr: $stderr"
      }
    }
    Write-Log "Nao foi possivel capturar a URL publica nesta tentativa."
  }

  $process.WaitForExit()
  Write-Log "Processo publish:test finalizado com codigo $($process.ExitCode). Reiniciando em $restartDelaySeconds s."
  Start-Sleep -Seconds $restartDelaySeconds
}
