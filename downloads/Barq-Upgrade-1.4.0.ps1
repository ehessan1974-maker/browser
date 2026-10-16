# ============================================================
#  Barq 1.4.0 upgrade - FULL BROWSING HISTORY (every link/site you open)
#  + consistent with Back/Forward (no duplicates) + RESIZABLE side panel
#  (drag its inner edge, 260-640, saved) + Clear-all disabled when empty
#  TINY zip (~26KB) upgrades EVERY copy at once (installed + portable)
#  HOW TO USE:
#   1) Download barq140.zip -> it lands in Downloads
#   2) Open PowerShell, paste this WHOLE block, press Enter
#   3) Wait for: ===== DONE =====
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'
& {
  Write-Host '===== Barq 1.4.0 - full browsing history + resizable panel - 30KB upgrade =====' -ForegroundColor Cyan
  $sha = [System.Security.Cryptography.SHA256]::Create()

  # [1] close Barq (locked files = silent failure)
  $proc = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($proc) { $proc | Stop-Process -Force; Start-Sleep -Seconds 2 }
  Write-Host '[1] Barq closed'

  # [2] find barq140.zip
  $zip = $null
  foreach ($c in @((Join-Path $env:USERPROFILE 'Downloads\barq140.zip'),
                   (Join-Path $env:USERPROFILE 'Desktop\barq140.zip'),
                   'D:\Barq\resources\barq140.zip',
                   'D:\Barq-Portable\resources\barq140.zip')) {
    if (Test-Path -LiteralPath $c) { $zip = $c; break }
  }
  if (-not $zip) {
    $g = Get-ChildItem -Path (Join-Path $env:USERPROFILE 'Downloads') -Filter 'barq140*.zip' -ErrorAction SilentlyContinue |
         Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($g) { $zip = $g.FullName }
  }
  if (-not $zip) {
    Write-Host '[FAIL] barq140.zip not found - download it first (30KB) then paste again' -ForegroundColor Red; return
  }
  Write-Host ('[2] zip found: ' + $zip)

  # [3] SHA256 gate
  $hash = [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($zip))).Replace('-','').ToLower()
  if ($hash -ne '7fe6dda640507d4fd62ddd835ee4017fd8d5c946dd6e47c889b8821b095694d3') {
    Write-Host '[FAIL] zip is corrupted - download it again and re-paste' -ForegroundColor Red; return
  }
  Write-Host '[3] zip SHA256 verified'

  # [4] collect every Barq copy on this machine
  $targets = @()
  if (Test-Path -LiteralPath 'D:\Barq\Barq.exe') { $targets += 'D:\Barq' }
  foreach ($parent in @((Join-Path $env:USERPROFILE 'Desktop'),
                        (Join-Path $env:USERPROFILE 'Downloads'),
                        'D:\', 'E:\', 'F:\')) {
    if (Test-Path -LiteralPath $parent) {
      Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $d = $_.FullName
        if ((Test-Path -LiteralPath (Join-Path $d 'Barq.exe')) -and
            (Test-Path -LiteralPath (Join-Path $d 'portable.txt'))) { $targets += $d }
      }
    }
  }
  $targets = $targets | Select-Object -Unique
  if (-not $targets) {
    Write-Host '[FAIL] no Barq copy found (D:\Barq or portable folder with Barq.exe + portable.txt)' -ForegroundColor Red; return
  }
  Write-Host ('[4] copies to upgrade: ' + ($targets -join '  |  '))

  # [5] upgrade each copy
  $done = @()
  foreach ($t in $targets) {
    try {
      $res = Join-Path $t 'resources'
      $app = Join-Path $res 'app'
      if (-not (Test-Path -LiteralPath $res)) { New-Item -ItemType Directory -Path $res | Out-Null }
      if (-not (Test-Path -LiteralPath $app)) { New-Item -ItemType Directory -Path $app | Out-Null }
      Expand-Archive -LiteralPath $zip -DestinationPath $app -Force
      $asar = Join-Path $res 'app.asar'
      if (Test-Path -LiteralPath $asar) {
        Move-Item -LiteralPath $asar -Destination (Join-Path $res 'app.asar.bak') -Force
      }
      $v  = (Get-Content -LiteralPath (Join-Path $app 'package.json') -Raw | ConvertFrom-Json).version
      $m1 =  Test-Path -LiteralPath (Join-Path $app 'chrome\omni.html')
      $m2 = (Get-Content -LiteralPath (Join-Path $app 'main.js') -Raw) -match 'barq:panel-resize-start'
      $m3 = (Get-Content -LiteralPath (Join-Path $app 'main.js') -Raw) -match 'function panelWidth'
      if ($v -eq '1.4.0' -and $m1 -and $m2 -and $m3) {
        $done += $t
        Write-Host ('    [OK] ' + $t + '  ->  1.4.0 (full history + resizable panel)') -ForegroundColor Green
      } else {
        Write-Host ('    [FAIL] ' + $t + '  version=' + $v + ' omni-page=' + $m1 + ' resize-api=' + $m2) -ForegroundColor Red
      }
    } catch {
      Write-Host ('    [FAIL] ' + $t + '  ' + $_.Exception.Message) -ForegroundColor Red
    }
  }
  if (-not $done) { Write-Host '[FAIL] nothing upgraded - nothing broken either' -ForegroundColor Red; return }

  # [6] start Barq (prefer the installed copy)
  $start = if ($done -contains 'D:\Barq') { 'D:\Barq' } else { $done[0] }
  Start-Process -FilePath (Join-Path $start 'Barq.exe') -WorkingDirectory $start
  Write-Host ('===== DONE - 1.4.0 on: ' + ($done -join ' | ') + ' =====') -ForegroundColor Green
  Write-Host '     try it: open any site -> the clock button shows it in history; drag the panel edge to resize it'
}
