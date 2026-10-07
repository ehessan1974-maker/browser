# ============================================================
#  Barq 1.2.0 - in-place upgrade with full diagnostics
#  New: search history panel + star bookmarks (local JSON storage)
#  Kept: tracker blocking, 5 search engines, hardware acceleration OFF
#  Safe for old PCs and 32-bit Windows. Rollback (only if ever needed):
#    Remove-Item 'D:\Barq\resources\app' -Recurse -Force
#    Rename-Item 'D:\Barq\resources\app.asar.bak' 'app.asar'
#  Paste this WHOLE script into PowerShell (Administrator).
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'

function Upgrade-Barq {

  Write-Host '===== Barq 1.2.0 upgrade - diagnostic mode =====' -ForegroundColor Cyan

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
  if ($hash -ne '0fb42f0d39109a31dfa4a18d287177275f4f53e8b653962403d3429219f46809') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.2.0.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.2.0 files written to resources\app (OK)' -ForegroundColor Green
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
      Write-Host '[6] no app.asar present (already 1.1.0) (OK)' -ForegroundColor Green
    }
  } catch {
    Write-Host ('[6] warning: ' + $_.Exception.Message) -ForegroundColor Yellow
  }

  # [7] verify
  try { $ver = (Get-Content -LiteralPath (Join-Path $appDir 'package.json') -Raw | ConvertFrom-Json).version } catch { $ver = '?' }
  $featOk = (Get-Content -LiteralPath (Join-Path $appDir 'main.js') -Raw) -match 'BOOKMARKS_MAX'
  $uiOk  = (Get-Content -LiteralPath (Join-Path $appDir 'chrome\ui.html') -Raw) -match 'panel-history'
  Write-Host ('[7] verify: version=' + $ver + '  features-code=' + $(if ($featOk) {'OK'} else {'MISSING'}) + '  ui=' + $(if ($uiOk) {'OK'} else {'MISSING'}))
  if (-not ($featOk -and $uiOk)) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'The toolbar now has a STAR (bookmarks) and a CLOCK (search history) button.'
  Write-Host 'Do a search, press the clock: it appears in the history panel. Press the star: page saved.'
}

Upgrade-Barq
