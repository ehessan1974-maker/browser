# ===== Intel 4 Series GPU driver update 2009 -> 2011 (v3) =====
# Your Windows is 32-bit (v2 proved it), so v3 uses the official Microsoft
# 32-bit driver cab (8.15.10.2555) - the same file Windows Update used to ship.
# Lenovo downloads are geo-blocked for your region (that was the 403 error);
# the Microsoft CDN is not. The download now shows a live percent progress.
# Nothing touches your system until step [5]. Ctrl+C anytime - safe.
# Rollback: Device Manager -> display adapter -> Roll Back Driver.
# Paste this WHOLE block into PowerShell (Administrator).

$ProgressPreference = 'SilentlyContinue'

function Update-IntelGpu {
  # [0] admin + 32-bit guard
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  if (-not (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host '[FAIL] not admin. Close this window, right-click PowerShell, Run as administrator, paste again.' -ForegroundColor Red
    return
  }
  if ([Environment]::Is64BitOperatingSystem) {
    Write-Host '[FAIL] this build targets 32-bit Windows only. Tell me this line appeared.' -ForegroundColor Red
    return
  }
  Write-Host '[0] running as administrator, 32-bit Windows confirmed (OK)' -ForegroundColor Green

  # [1] get the file (your Downloads copy if present, else download with progress)
  $out = Join-Path $env:TEMP 'IntelGFX2555.cab'
  $u1 = 'https://catalog.s.download.windowsupdate.com/msdownload/update/driver/drvs/2013/02/20541202_69255649c39c0b2eeaa72014f7cfb1c4fd673ae1.cab'
  $u2 = 'http://download.windowsupdate.com/msdownload/update/driver/drvs/2013/02/20541202_69255649c39c0b2eeaa72014f7cfb1c4fd673ae1.cab'
  $man = Get-ChildItem -Path "$env:USERPROFILE\Downloads" -Filter '20541202*.cab' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($man) {
    Copy-Item $man.FullName $out -Force
    Write-Host '[1] using the copy from your Downloads folder (OK)' -ForegroundColor Green
  } else {
    Write-Host '[1] downloading (19.6 MB) - a percent progress will appear ...' -ForegroundColor Cyan
    if (Test-Path $out) { Remove-Item $out -Force }
    & "$env:SystemRoot\System32\curl.exe" -L --fail --retry 3 --retry-delay 2 --connect-timeout 20 --max-time 1800 -A 'Mozilla/5.0' -o $out $u1
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $out)) {
      Write-Host '[1] first server failed, trying the mirror ...' -ForegroundColor Yellow
      if (Test-Path $out) { Remove-Item $out -Force }
      & "$env:SystemRoot\System32\curl.exe" -L --fail --retry 3 --retry-delay 2 --connect-timeout 20 --max-time 1800 -A 'Mozilla/5.0' -o $out $u2
    }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $out)) {
      if (Test-Path $out) { Remove-Item $out -Force -ErrorAction SilentlyContinue }
      Write-Host "[FAIL] download failed (curl exit code $LASTEXITCODE)." -ForegroundColor Red
      Write-Host '       Manual way: open this link in your browser, save the file into Downloads, then paste this block again:' -ForegroundColor Yellow
      Write-Host ('       ' + $u1) -ForegroundColor Yellow
      return
    }
    Write-Host '[1] download finished (OK)' -ForegroundColor Green
  }

  # [2] integrity gate
  $sha = 'c87b3cda5567ef3624559b14555d0b922d57d74e99d3556d518156095a3ff7d0'
  $got = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
  if ($got -ne $sha) {
    Write-Host '[FAIL] file corrupted (SHA256 mismatch). Paste this block again to retry.' -ForegroundColor Red
    return
  }
  Write-Host '[2] file verified: SHA256 OK' -ForegroundColor Green

  # [3] extract with the Windows built-in expand.exe
  $dir = Join-Path $env:USERPROFILE 'Desktop\IntelGFX2555'
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  & "$env:SystemRoot\System32\expand.exe" -F:* $out $dir | Out-Null
  $inf = Join-Path $dir 'kit51500.inf'
  if (-not (Test-Path $inf)) {
    Write-Host '[FAIL] extraction failed (kit51500.inf not found). Tell me this line.' -ForegroundColor Red
    return
  }
  $dv = Select-String -Path $inf -Pattern 'DriverVer\s*=\s*(.+)' | Select-Object -First 1
  if (-not $dv -or $dv.Matches[0].Groups[1].Value -notmatch '8\.15\.10\.2555') {
    Write-Host '[FAIL] unexpected driver version inside kit51500.inf - nothing was installed. Tell me this line.' -ForegroundColor Red
    return
  }
  Write-Host '[3] extracted, driver version 8.15.10.2555 confirmed (OK)' -ForegroundColor Green

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
  & "$env:SystemRoot\System32\pnputil.exe" /add-driver $inf /install

  Write-Host ''
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'Now REBOOT the laptop, then run the check command again:'
  Write-Host '  Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, DriverDate, Status'
  Write-Host 'Expected: DriverVersion = 8.15.10.2555 and Status = OK on both lines'
}

Update-IntelGpu
