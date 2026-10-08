# ============================================================
#  Barq 1.2.4 - in-place upgrade with full diagnostics
#  NEW in 1.2.4:
#   - History/Bookmarks panel: LEFT edge by default (Chrome-style),
#     AND a small button inside the panel header ("to the right" /
#     "to the left") moves it to the other side instantly - your
#     choice is remembered.
#   - ALL buttons now visibly PRESS when clicked (dip + darken).
#   - Panel lists: loading state + clear error message if data
#     cannot load - never a silently empty box.
#   - Prints the OLD version it found before upgrading (diagnostic).
#  Kept: side panel 1.2.2, white high-contrast text 1.2.3,
#        stay-open panels, search history, star bookmarks,
#        tracker blocking, 5 search engines, hardware accel OFF
#  Safe for old PCs and 32-bit Windows. Rollback (only if ever needed):
#    Remove-Item 'D:\Barq\resources\app' -Recurse -Force
#    Rename-Item 'D:\Barq\resources\app.asar.bak' 'app.asar'
#  Paste this WHOLE script into PowerShell (Administrator).
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'

function Upgrade-Barq {

  Write-Host '===== Barq 1.2.4 upgrade - panel side toggle + pressed buttons =====' -ForegroundColor Cyan

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

  # [3] current state + OLD version (diagnostic)
  $oldVer = '?'
  try { $oldVer = (Get-Content -LiteralPath (Join-Path $appDir 'package.json') -Raw | ConvertFrom-Json).version } catch {}
  Write-Host ('[3] state: asar=' + (Test-Path -LiteralPath $asar) + ' bak=' + (Test-Path -LiteralPath $asarBak) + ' app=' + (Test-Path -LiteralPath $appDir) + '  current-version=' + $oldVer)

  # [4] embedded payload + integrity check
  $b64 = @'
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

'@
  $b64 = ($b64 -replace '\s', '')
  $bytes = [Convert]::FromBase64String($b64)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne 'fed2efe9c4b963dfc24bdf4154380cd1301a55e654e219f29e4391d998fb85ad') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.2.4.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.2.4 files written to resources\app (OK)' -ForegroundColor Green
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
  $uiJsRaw = ''
  $homeRaw = ''
  try { $mainRaw = Get-Content -LiteralPath (Join-Path $appDir 'main.js') -Raw } catch {}
  try { $uiRaw = Get-Content -LiteralPath (Join-Path $appDir 'chrome\ui.html') -Raw } catch {}
  try { $uiJsRaw = Get-Content -LiteralPath (Join-Path $appDir 'chrome\ui.js') -Raw } catch {}
  try { $homeRaw = Get-Content -LiteralPath (Join-Path $appDir 'chrome\home.html') -Raw } catch {}
  $sideOk  = $mainRaw.Contains('panelSide === "left"')
  $ipcOk   = $mainRaw.Contains('barq:panel-side')
  $uiOk    = $uiRaw.Contains('width: 360px')
  $flipOk  = $uiRaw.Contains('id="side-history"') -and $uiRaw.Contains('id="side-bookmarks"') -and $uiRaw.Contains('body.panel-right .panel')
  $pressOk = $uiRaw.Contains('button:active') -and $homeRaw.Contains('a.tile:active')
  $whiteOk = $uiRaw.Contains('color: #ffffff')
  $bgOk    = $uiRaw.Contains('#18251f')
  $btnOk   = $uiRaw.Contains('id="marks"')
  $featOk  = $mainRaw.Contains('BOOKMARKS_MAX')
  $stayOk  = -not $mainRaw.Contains('closePanel(); // ')
  Write-Host ('[7] verify: version=' + $ver + '  side-panel=' + $(if ($sideOk) {'OK'} else {'MISSING'}) + '  side-ipc=' + $(if ($ipcOk) {'OK'} else {'MISSING'}) + '  ui-side=' + $(if ($uiOk) {'OK'} else {'MISSING'}) + '  side-toggle=' + $(if ($flipOk) {'OK'} else {'MISSING'}) + '  pressed-buttons=' + $(if ($pressOk) {'OK'} else {'MISSING'}) + '  white-text=' + $(if ($whiteOk) {'OK'} else {'MISSING'}) + '  new-bg=' + $(if ($bgOk) {'OK'} else {'MISSING'}) + '  buttons=' + $(if ($btnOk) {'OK'} else {'MISSING'}) + '  features=' + $(if ($featOk) {'OK'} else {'MISSING'}))
  if (-not ($sideOk -and $ipcOk -and $uiOk -and $flipOk -and $pressOk -and $whiteOk -and $bgOk -and $btnOk -and $featOk -and $stayOk)) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'NEW: the history/bookmarks panel opens on the LEFT edge with white text.'
  Write-Host 'Inside the panel header there is a small button ("to the right" /'
  Write-Host '"to the left") that moves the panel to the other side - it remembers.'
  Write-Host 'ALL buttons now visibly press down when clicked.'
}

Upgrade-Barq
