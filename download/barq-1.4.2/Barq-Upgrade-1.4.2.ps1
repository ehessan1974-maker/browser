﻿============================================================
#  Barq 1.4.2 upgrade - BARQ ACCOUNT (OPTIONAL LOGIN)
#  A new account button in the toolbar opens the Account panel:
#  sign in / create a local account / sign out. 100% OPTIONAL -
#  without an account Barq works completely normally (no lock, no
#  password screen, nothing blocked). The account lives on this PC
#  only: name as plain text + password ENCRYPTED (salt + SHA-256)
#  in account.json - never sent anywhere. The session comes back
#  on every Barq start until you sign out. Verification in main.
#  TINY zip (~36KB) upgrades EVERY copy at once (installed + portable)
#  HOW TO USE:
#   1) Download barq142.zip -> it lands in Downloads
#   2) Open PowerShell, paste this WHOLE block, press Enter
#   3) Wait for: ===== DONE =====
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'
& {
  Write-Host '===== Barq 1.4.2 - optional Barq account (works normally without it) - 36KB upgrade =====' -ForegroundColor Cyan
  $sha = [System.Security.Cryptography.SHA256]::Create()

  # [1] close Barq (locked files = silent failure)
  $proc = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($proc) { $proc | Stop-Process -Force; Start-Sleep -Seconds 2 }
  Write-Host '[1] Barq closed'

  # [2] find barq142.zip
  $zip = $null
  foreach ($c in @((Join-Path $env:USERPROFILE 'Downloads\barq142.zip'),
                   (Join-Path $env:USERPROFILE 'Desktop\barq142.zip'),
                   'D:\Barq\resources\barq142.zip',
                   'D:\Barq-Portable\resources\barq142.zip')) {
    if (Test-Path -LiteralPath $c) { $zip = $c; break }
  }
  if (-not $zip) {
    $g = Get-ChildItem -Path (Join-Path $env:USERPROFILE 'Downloads') -Filter 'barq142*.zip' -ErrorAction SilentlyContinue |
         Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($g) { $zip = $g.FullName }
  }
  if (-not $zip) {
    Write-Host '[FAIL] barq142.zip not found - download it first (36KB) then paste again' -ForegroundColor Red; return
  }
  Write-Host ('[2] zip found: ' + $zip)

  # [3] SHA256 gate
  $hash = [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($zip))).Replace('-','').ToLower()
  if ($hash -ne 'dce87f68befec8e3deed583934a9535accf1748eefaeb9a97a689793735f7683') {
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
      # remove the old lock page (1.4.2 is an optional account - no lock screen anymore)
      $oldLock = Join-Path $app 'chrome\lock.html'
      if (Test-Path -LiteralPath $oldLock) { Remove-Item -LiteralPath $oldLock -Force }
      $asar = Join-Path $res 'app.asar'
      if (Test-Path -LiteralPath $asar) {
        Move-Item -LiteralPath $asar -Destination (Join-Path $res 'app.asar.bak') -Force
      }
      $v  = (Get-Content -LiteralPath (Join-Path $app 'package.json') -Raw | ConvertFrom-Json).version
      $m1 = (Get-Content -LiteralPath (Join-Path $app 'main.js') -Raw) -match 'function accountRec'
      $m2 = (Get-Content -LiteralPath (Join-Path $app 'main.js') -Raw) -match 'barq:account-register'
      $m3 = (Get-Content -LiteralPath (Join-Path $app 'chrome\panel.js') -Raw) -match 'renderAccount'
      if ($v -eq '1.4.2' -and $m1 -and $m2 -and $m3) {
        $done += $t
        Write-Host ('    [OK] ' + $t + '  ->  1.4.2 (optional Barq account)') -ForegroundColor Green
      } else {
        Write-Host ('    [FAIL] ' + $t + '  version=' + $v + ' account-api=' + $m1 + ' account-panel=' + $m3) -ForegroundColor Red
      }
    } catch {
      Write-Host ('    [FAIL] ' + $t + '  ' + $_.Exception.Message) -ForegroundColor Red
    }
  }
  if (-not $done) { Write-Host '[FAIL] nothing upgraded - nothing broken either' -ForegroundColor Red; return }

  # [6] start Barq (prefer the installed copy)
  $start = if ($done -contains 'D:\Barq') { 'D:\Barq' } else { $done[0] }
  Start-Process -FilePath (Join-Path $start 'Barq.exe') -WorkingDirectory $start
  Write-Host ('===== DONE - 1.4.2 on: ' + ($done -join ' | ') + ' =====') -ForegroundColor Green
  Write-Host '     try it: Barq starts normally as always; click the account button (person icon) in the toolbar -> sign in or create an account, or just ignore it - everything works without it'
}
