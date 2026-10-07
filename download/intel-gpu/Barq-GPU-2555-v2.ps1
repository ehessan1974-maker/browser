# ===== Intel 4 Series GPU driver update 2009 -> 2011 (v2, self-adapting) =====
# v1 hung at the download step: PowerShell's built-in downloader is silent and
# very slow on old machines. v2 uses curl.exe (already built into your Windows)
# so you SEE a live percent progress, and it auto-picks the 32-bit or 64-bit
# official Lenovo package of the same driver version 8.15.10.2555.
# Nothing touches your system until step [5]. Cancel anytime with Ctrl+C - safe.
# Rollback if ever needed: Device Manager -> display adapter -> Roll Back Driver.
# Paste this WHOLE block into PowerShell (Administrator).

$ProgressPreference = 'SilentlyContinue'

function Update-IntelGpu {
  # [0] admin?
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  if (-not (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host '[FAIL] not admin. Close this window, right-click PowerShell, Run as administrator, paste again.' -ForegroundColor Red
    return
  }
  Write-Host '[0] running as administrator (OK)' -ForegroundColor Green

  # pick package by Windows bitness (same driver 8.15.10.2555, official Lenovo copy)
  if ([Environment]::Is64BitOperatingSystem) {
    $exe = '7xd658ww.exe'; $sha = '83a2b07393e79bba4580d9a3f031edda1b59d71405dff792523b67169879e0ef'
  } else {
    $exe = '7xd558ww.exe'; $sha = '4fe98a91a06928fe90928519ec831cd8ffbb9d32b91884838d86aa54eb712b50'
  }
  $url = 'https://download.lenovo.com/pccbbs/mobiles/' + $exe

  # [1] get the file (uses your Downloads copy if you already have it)
  $out = Join-Path $env:TEMP $exe
  $man = Join-Path $env:USERPROFILE ('Downloads\' + $exe)
  if (Test-Path $man) {
    Copy-Item $man $out -Force
    Write-Host '[1] using the copy from your Downloads folder (OK)' -ForegroundColor Green
  } else {
    Write-Host '[1] downloading (~17 MB) - a percent progress will appear ...' -ForegroundColor Cyan
    & "$env:SystemRoot\System32\curl.exe" -L --fail --retry 3 --retry-delay 2 --connect-timeout 20 --max-time 1200 -o $out $url
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $out)) {
      Write-Host "[FAIL] download failed (curl exit code $LASTEXITCODE)." -ForegroundColor Red
      Write-Host ('       Manual way: open this link in your browser, save it as ' + $exe + ' into Downloads, then paste this block again:') -ForegroundColor Yellow
      Write-Host ('       ' + $url) -ForegroundColor Yellow
      return
    }
    Write-Host '[1] download finished (OK)' -ForegroundColor Green
  }

  # [2] integrity gate
  $got = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
  if ($got -ne $sha) {
    Write-Host '[FAIL] file corrupted (SHA256 mismatch). Paste this block again to retry.' -ForegroundColor Red
    return
  }
  Write-Host '[2] file verified: SHA256 OK' -ForegroundColor Green

  # [3] extract (official silent extract, no install yet)
  $dir = Join-Path $env:USERPROFILE 'Desktop\IntelGFX2555'
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Write-Host '[3] extracting to Desktop\IntelGFX2555 (15-30 seconds, nothing on screen - normal) ...' -ForegroundColor Cyan
  Start-Process -FilePath $out -ArgumentList ('/VERYSILENT /NORESTART /SUPPRESSMSGBOXES /DIR="{0}" /EXTRACT="YES"' -f $dir) -Wait
  $inf = $null
  $arch = 'NTx86'; if ([Environment]::Is64BitOperatingSystem) { $arch = 'NTamd64' }
  foreach ($f in (Get-ChildItem -Path $dir -Recurse -Filter *.inf -ErrorAction SilentlyContinue)) {
    $c = Get-Content $f.FullName -ErrorAction SilentlyContinue
    if (-not $c) { continue }
    if (@($c | Select-String -Pattern 'DriverVer\s*=.*8\.15\.10\.2555').Count -eq 0) { continue }
    if (@($c | Select-String -Pattern ('\[' + $arch)).Count -gt 0) { $inf = $f; break }
    if (-not $inf) { $inf = $f }
  }
  if (-not $inf) {
    Write-Host '[FAIL] extraction failed or driver INF not found. Tell me this line.' -ForegroundColor Red
    return
  }
  Write-Host ('[3] extracted, driver INF found: ' + $inf.Name + ' (OK)') -ForegroundColor Green

  # [4] safety net: restore point
  Write-Host '[4] creating a system restore point (30-60 seconds) ...' -ForegroundColor Cyan
  try {
    Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue
    Checkpoint-Computer -Description 'Before Intel GPU driver 8.15.10.2555' -ErrorAction Stop
    Write-Host '[4] restore point created (OK)' -ForegroundColor Green
  } catch {
    Write-Host '[4] restore point skipped - continuing anyway' -ForegroundColor Yellow
  }

  # [5] install
  Write-Host '[5] installing driver (screen may blink a few seconds - normal) ...' -ForegroundColor Cyan
  & "$env:SystemRoot\System32\pnputil.exe" /add-driver $inf.FullName /install

  Write-Host ''
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'Now REBOOT the laptop, then run the check command again:'
  Write-Host '  Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, DriverDate, Status'
  Write-Host 'Expected: DriverVersion = 8.15.10.2555 and Status = OK on both lines'
}

Update-IntelGpu
