# ============================================================
#  Barq 1.2.2 - in-place upgrade with full diagnostics
#  NEW: the search-history and bookmarks panels are now SIDE
#       panels on the left edge (Chrome-style, mirrored for the
#       Arabic RTL interface). The page shrinks sideways instead
#       of the panel dropping over it. The star/ribbon/clock
#       buttons moved to the left end of the toolbar, right above
#       the side panel - exactly like Chrome's arrangement.
#  Includes the 1.2.1 fix (panels were hidden behind the page).
#  Kept: search history, star bookmarks, tracker blocking,
#        5 search engines, hardware acceleration OFF
#  Safe for old PCs and 32-bit Windows. Rollback (only if ever needed):
#    Remove-Item 'D:\Barq\resources\app' -Recurse -Force
#    Rename-Item 'D:\Barq\resources\app.asar.bak' 'app.asar'
#  Paste this WHOLE script into PowerShell (Administrator).
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'

function Upgrade-Barq {

  Write-Host '===== Barq 1.2.2 upgrade - Chrome-style side panels =====' -ForegroundColor Cyan

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
  if ($hash -ne '2bfd62627cf5651930c858d366467ff9bbeba81b8d4760b52e126ff125b2c77d') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.2.2.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.2.2 files written to resources\app (OK)' -ForegroundColor Green
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
      Write-Host '[6] no app.asar present (already upgraded before) (OK)' -ForegroundColor Green
    }
  } catch {
    Write-Host ('[6] warning: ' + $_.Exception.Message) -ForegroundColor Yellow
  }

  # [7] verify
  try { $ver = (Get-Content -LiteralPath (Join-Path $appDir 'package.json') -Raw | ConvertFrom-Json).version } catch { $ver = '?' }
  $mainRaw = ''
  $uiRaw = ''
  try { $mainRaw = Get-Content -LiteralPath (Join-Path $appDir 'main.js') -Raw } catch {}
  try { $uiRaw = Get-Content -LiteralPath (Join-Path $appDir 'chrome\ui.html') -Raw } catch {}
  $sideOk = $mainRaw.Contains('panelOpen ? PANEL_W : 0')
  $uiOk   = $uiRaw.Contains('width: 360px')
  $btnOk  = $uiRaw.Contains('id="marks"')
  $featOk = $mainRaw.Contains('BOOKMARKS_MAX')
  Write-Host ('[7] verify: version=' + $ver + '  side-panel=' + $(if ($sideOk) {'OK'} else {'MISSING'}) + '  ui-side=' + $(if ($uiOk) {'OK'} else {'MISSING'}) + '  buttons=' + $(if ($btnOk) {'OK'} else {'MISSING'}) + '  features=' + $(if ($featOk) {'OK'} else {'MISSING'}))
  if (-not ($sideOk -and $uiOk -and $btnOk -and $featOk)) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'NEW: the clock (history) and ribbon (favorites) buttons open a SIDE'
  Write-Host 'panel on the LEFT edge, Chrome-style. The page shrinks sideways.'
  Write-Host 'Try: search something, press the clock. Open any site, press the star, then the ribbon.'
}

Upgrade-Barq
