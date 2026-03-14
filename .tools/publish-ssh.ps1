$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$publicUrlFile = Join-Path $PSScriptRoot 'public-url.txt'
$previewOut = Join-Path $PSScriptRoot 'preview-public.log'
$previewErr = Join-Path $PSScriptRoot 'preview-public.err.log'
$sshOut = Join-Path $PSScriptRoot 'localhostrun.log'
$sshErr = Join-Path $PSScriptRoot 'localhostrun.err.log'
$port = if ($env:PUBLIC_PORT) { [int]$env:PUBLIC_PORT } else { 4173 }

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 700
    }
  }

  throw "Servidor nao respondeu em ${TimeoutSeconds}s: $Url"
}

function Ensure-PreviewServer {
  $listening = netstat -ano | Select-String ":$port"
  if ($listening) {
    Write-Host "[publish:ssh] Preview ja esta ativo na porta $port."
    return
  }

  Remove-Item $previewOut, $previewErr -Force -ErrorAction SilentlyContinue
  Write-Host "[publish:ssh] Iniciando preview publico em http://127.0.0.1:$port/"
  Start-Process cmd.exe -ArgumentList "/c npm run preview:public" -WorkingDirectory $root -RedirectStandardOutput $previewOut -RedirectStandardError $previewErr -WindowStyle Hidden | Out-Null
  Wait-ForUrl -Url "http://127.0.0.1:$port/" -TimeoutSeconds 60
}

function Extract-PublicUrl {
  param([string]$Text)

  $match = [regex]::Match($Text, 'https://[a-z0-9.-]+\.[a-z]{2,}')
  if ($match.Success) {
    return $match.Value
  }

  return $null
}

Set-Location $root
Ensure-PreviewServer
Remove-Item $sshOut, $sshErr -Force -ErrorAction SilentlyContinue

Write-Host "[publish:ssh] Abrindo tunel externo via localhost.run..."
$sshProcess = Start-Process -FilePath 'C:\Windows\System32\OpenSSH\ssh.exe' `
  -ArgumentList @('-o', 'StrictHostKeyChecking=no', '-o', 'ServerAliveInterval=30', '-R', "80:127.0.0.1:$port", 'nokey@localhost.run') `
  -RedirectStandardOutput $sshOut `
  -RedirectStandardError $sshErr `
  -PassThru

$deadline = (Get-Date).AddSeconds(45)
$publicUrl = $null

while ((Get-Date) -lt $deadline -and -not $sshProcess.HasExited) {
  if (Test-Path $sshOut) {
    $content = Get-Content $sshOut -Raw
    $publicUrl = Extract-PublicUrl -Text $content
    if ($publicUrl) {
      Set-Content -Path $publicUrlFile -Value $publicUrl
      Write-Host "[publish:ssh] URL publica: $publicUrl"
      break
    }
  }

  Start-Sleep -Seconds 2
  $sshProcess.Refresh()
}

if (-not $publicUrl) {
  if (Test-Path $sshErr) {
    Get-Content $sshErr
  }
  throw 'Nao foi possivel capturar a URL publica do localhost.run.'
}

$sshProcess.WaitForExit()
