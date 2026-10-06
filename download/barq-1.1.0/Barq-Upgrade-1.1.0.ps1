# ============================================================
#  Barq 1.1.0 - in-place upgrade with full diagnostics
#  Adds: 5 search engines (Google / Bing / DuckDuckGo / Yandex / Wikipedia)
#  Safe for old PCs: hardware acceleration disabled inside (helps the 0x116 issue)
#  Rollback (only if ever needed):
#    Remove-Item 'D:\Barq\resources\app' -Recurse -Force
#    Rename-Item 'D:\Barq\resources\app.asar.bak' 'app.asar'
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'

function Upgrade-Barq {

  Write-Host '===== Barq 1.1.0 upgrade - diagnostic mode =====' -ForegroundColor Cyan

  # [1] close running Barq (locked files = silent failure)
  $p = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($p) {
    $p | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host '[1] Barq was running -> closed it (OK)' -ForegroundColor Yellow
  } else {
    Write-Host '[1] Barq is not running (OK)' -ForegroundColor Green
  }

  # [2] find the real Barq folder
  $barq = $null
  $sh = New-Object -ComObject WScript.Shell
  $desk = [Environment]::GetFolderPath('Desktop')
  Get-ChildItem -LiteralPath $desk -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
    if (-not $barq) {
      try {
        $t = $sh.CreateShortcut($_.FullName).TargetPath
        if ($t -like '*Barq.exe') { $barq = Split-Path -Parent $t }
      } catch {}
    }
  }
  if ($barq) { Write-Host ('[2] found via desktop shortcut: ' + $barq) -ForegroundColor Green }

  if (-not $barq) {
    $candidates = @('D:\Barq','C:\Barq',"$env:USERPROFILE\Desktop\Barq","$env:USERPROFILE\Downloads\Barq","$env:USERPROFILE\Barq","$env:LOCALAPPDATA\Programs\barq","$env:LOCALAPPDATA\Programs\Barq")
    foreach ($c in $candidates) {
      if (Test-Path -LiteralPath (Join-Path $c 'Barq.exe')) { $barq = $c; break }
    }
    if ($barq) { Write-Host ('[2] found: ' + $barq) -ForegroundColor Green }
  }

  if (-not $barq) {
    Write-Host '[2] not in usual places -> deeper search, please wait...' -ForegroundColor Yellow
    $roots = @('D:\', $desk, "$env:USERPROFILE\Downloads", "$env:LOCALAPPDATA\Programs")
    foreach ($r in $roots) {
      if ($barq) { break }
      $hit = Get-ChildItem -Path $r -Filter 'Barq.exe' -Recurse -Depth 3 -Force -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hit) { $barq = $hit.DirectoryName }
    }
    if ($barq) { Write-Host ('[2] found: ' + $barq) -ForegroundColor Green }
  }

  if (-not $barq) {
    Write-Host '[FAIL] Barq.exe not found anywhere. Tell me where you extracted it.' -ForegroundColor Red
    return
  }

  $res     = Join-Path $barq 'resources'
  $appDir  = Join-Path $res 'app'
  $asar    = Join-Path $res 'app.asar'
  $asarBak = Join-Path $res 'app.asar.bak'

  # write permission probe
  try {
    New-Item -ItemType Directory -Force -Path $res -ErrorAction Stop | Out-Null
    Set-Content -LiteralPath (Join-Path $res '.barq_test') -Value 'x' -ErrorAction Stop
    Remove-Item -LiteralPath (Join-Path $res '.barq_test') -Force
  } catch {
    Write-Host '[FAIL] no write permission to the Barq folder. Open PowerShell AS ADMINISTRATOR and paste again.' -ForegroundColor Red
    return
  }

  # [3] current state
  Write-Host ('[3] state: asar=' + (Test-Path -LiteralPath $asar) + ' bak=' + (Test-Path -LiteralPath $asarBak) + ' app=' + (Test-Path -LiteralPath $appDir))

  # [4] embedded payload + integrity check
  $b64 = @'
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
'@
  $b64 = ($b64 -replace '\s', '')
  $bytes = [Convert]::FromBase64String($b64)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne '87a65d41f48c56931bc041ae18529f0af082446f9c63ad823223026415d6c531') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.1.0.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.1.0 files written to resources\app (OK)' -ForegroundColor Green
  } else {
    Write-Host '[FAIL] extraction failed' -ForegroundColor Red
    return
  }

  # [6] neutralize old app.asar (backup kept, fully reversible)
  try {
    if (Test-Path -LiteralPath $asar) {
      if (Test-Path -LiteralPath $asarBak) {
        Remove-Item -LiteralPath $asar -Force -ErrorAction Stop
        Write-Host '[6] old app.asar removed (backup already existed) (OK)' -ForegroundColor Green
      } else {
        Rename-Item -LiteralPath $asar -NewName 'app.asar.bak' -Force -ErrorAction Stop
        Write-Host '[6] app.asar -> app.asar.bak backup (OK)' -ForegroundColor Green
      }
    } else {
      Write-Host '[6] no app.asar present (OK)' -ForegroundColor Green
    }
  } catch {
    Write-Host ('[6] warning: ' + $_.Exception.Message) -ForegroundColor Yellow
  }

  # [7] verify
  try { $ver = (Get-Content -LiteralPath (Join-Path $appDir 'package.json') -Raw | ConvertFrom-Json).version } catch { $ver = '?' }
  $engOk = (Get-Content -LiteralPath (Join-Path $appDir 'main.js') -Raw) -match 'SEARCH_ENGINES'
  Write-Host ('[7] verify: version=' + $ver + '  engines-code=' + $(if ($engOk) {'OK'} else {'MISSING'}))
  if (-not $engOk) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'Home page must show 5 engine chips: Google / Bing / DuckDuckGo / Yandex / Wikipedia'
  Write-Host 'The toolbar now has an engine dropdown next to the address bar.'
}

Upgrade-Barq