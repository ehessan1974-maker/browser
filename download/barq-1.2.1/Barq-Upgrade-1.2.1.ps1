# ============================================================
#  Barq 1.2.1 - in-place upgrade with full diagnostics
#  FIX: the history/bookmarks panels were drawn BEHIND the page
#       view, so they could never be seen. The page view now
#       slides down while a panel is open. Plus: a dedicated
#       ribbon button for the favorites list (no more double-click).
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

  Write-Host '===== Barq 1.2.1 upgrade - panel visibility fix =====' -ForegroundColor Cyan

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
AAAAAAgACADQAQAAvDoAAAAA

'@
  $b64 = ($b64 -replace '\s', '')
  $bytes = [Convert]::FromBase64String($b64)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne 'c9af626144b89437fbe92ce8d7e3b2220d72ad03e376f2c94926638f6ab7bdfd') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.2.1.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.2.1 files written to resources\app (OK)' -ForegroundColor Green
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
  $fixOk  = $mainRaw.Contains('panelOpen ? PANEL_H : 0')
  $featOk = $mainRaw.Contains('BOOKMARKS_MAX')
  $uiOk   = $uiRaw.Contains('id="marks"')
  Write-Host ('[7] verify: version=' + $ver + '  panel-fix=' + $(if ($fixOk) {'OK'} else {'MISSING'}) + '  marks-button=' + $(if ($uiOk) {'OK'} else {'MISSING'}) + '  features=' + $(if ($featOk) {'OK'} else {'MISSING'}))
  if (-not ($fixOk -and $uiOk -and $featOk)) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'FIXED: the CLOCK button now really opens the search history panel.'
  Write-Host 'There is a new RIBBON button (next to the star) for the favorites list.'
  Write-Host 'Try: search something, press the clock. Open any site, press the star, then the ribbon.'
}

Upgrade-Barq
