# ============================================================
#  Barq 1.2.7 upgrade - the page now SHIFTS beside the panel
#  (Chrome-like: panel opens -> page shrinks to make room,
#   panel closes -> page expands back to full)
#  HOW TO USE:
#   1) Download barq127.zip (preview tab -> /downloads/barq127.zip)
#      It lands in Downloads (or put it in D:\Barq\resources)
#   2) Open PowerShell, paste this WHOLE block, press Enter
#   3) Wait for:  ===== DONE =====
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'
& {
  Write-Host '===== Barq 1.2.7 - page shifts beside the panel (Chrome-like) =====' -ForegroundColor Cyan
  $root = 'D:\Barq'
  $res  = Join-Path $root 'resources'
  $app  = Join-Path $res 'app'
  $pj   = Join-Path $app 'package.json'
  $sha  = [System.Security.Cryptography.SHA256]::Create()

  # [0] report current state (diagnostic)
  $old = 'unknown'
  if (Test-Path -LiteralPath $pj) { $old = (Get-Content -LiteralPath $pj -Raw | ConvertFrom-Json).version }
  Write-Host ('[0] currently installed: ' + $old)

  # [1] close Barq (locked files = silent failure)
  $proc = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($proc) { $proc | Stop-Process -Force; Start-Sleep -Seconds 2 }
  Write-Host '[1] Barq closed'

  # [2] find barq127.zip
  $zip = $null
  foreach ($c in @((Join-Path $res 'barq127.zip'),
                   (Join-Path $env:USERPROFILE 'Downloads\barq127.zip'),
                   (Join-Path $env:USERPROFILE 'Desktop\barq127.zip'))) {
    if (Test-Path -LiteralPath $c) { $zip = $c; break }
  }
  if (-not $zip) {
    $g = Get-ChildItem -Path (Join-Path $env:USERPROFILE 'Downloads') -Filter 'barq127*.zip' -ErrorAction SilentlyContinue |
         Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($g) { $zip = $g.FullName }
  }
  if (-not $zip) {
    Write-Host '[FAIL] barq127.zip not found - download it first from the preview tab:' -ForegroundColor Red
    Write-Host '       add  /downloads/barq127.zip  to the preview URL, then paste this again' -ForegroundColor Red
    return
  }
  Write-Host ('[2] zip found: ' + $zip)

  # [3] SHA256 gate
  $hash = [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($zip))).Replace('-','').ToLower()
  if ($hash -ne '4e317ea8aaab0b17abe7b65992a06a5f3ccbf378fd04f5048444465097177fc4') {
    Write-Host '[FAIL] zip is corrupted - download it again and re-paste' -ForegroundColor Red; return
  }
  Write-Host '[3] zip SHA256 verified'

  # [4] extract over resources\app
  if (-not (Test-Path -LiteralPath $app)) { New-Item -ItemType Directory -Path $app | Out-Null }
  Expand-Archive -LiteralPath $zip -DestinationPath $app -Force
  Write-Host '[4] 1.2.7 files written into resources\app'

  # [5] neutralize old app.asar if any (backup kept, reversible)
  $asar = Join-Path $res 'app.asar'
  if (Test-Path -LiteralPath $asar) {
    Move-Item -LiteralPath $asar -Destination (Join-Path $res 'app.asar.bak') -Force
    Write-Host '[5] app.asar -> app.asar.bak'
  } else { Write-Host '[5] no app.asar (OK)' }

  # [6] clean old loose junk from resources\
  foreach ($i in @('main.js','trackers.js','package.json','chrome','barq124.zip','barq125.zip','barq126.zip')) {
    $p = Join-Path $res $i
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
  }
  Write-Host '[6] resources\ cleaned'

  # [7] verify version + 1.2.7 markers
  $v = (Get-Content -LiteralPath $pj -Raw | ConvertFrom-Json).version
  $m1 = (Test-Path -LiteralPath (Join-Path $app 'chrome\panel.html'))
  $m2 = (Get-Content -LiteralPath (Join-Path $app 'main.js') -Raw) -match 'function panelWidth'
  $m3 = (Get-Content -LiteralPath (Join-Path $app 'chrome\panel.js') -Raw) -match 'onPanelShow'
  Write-Host ('[7] version=' + $v + '  panel-file=' + $m1 + '  page-shift=' + $m2 + '  panel-logic=' + $m3)
  if ($v -ne '1.2.7' -or -not $m1 -or -not $m2 -or -not $m3) {
    Write-Host '[FAIL] verification failed - nothing deleted, Barq still works' -ForegroundColor Red; return
  }
  Write-Host '[7] 1.2.7 verified' -ForegroundColor Green

  # [8] start Barq
  Start-Process -FilePath (Join-Path $root 'Barq.exe') -WorkingDirectory $root
  Write-Host '===== DONE - Barq 1.2.7 is running =====' -ForegroundColor Cyan
}
