# ============================================================
#  Barq - make a PORTABLE copy from your installed Barq
#  NO DOWNLOAD NEEDED - copies D:\Barq as-is
#  HOW TO USE:
#   1) Open PowerShell, paste this WHOLE block, press Enter
#   2) Wait for: ===== DONE =====
#  Want it on a USB stick? In $dst line write instead:  E:\Barq-Portable
# ============================================================
$ErrorActionPreference = 'Continue'
& {
  $src = 'D:\Barq'
  $dst = 'D:\Barq-Portable'    # <- للفلاش اكتب هنا:  E:\Barq-Portable

  Write-Host '===== Barq portable-maker (zero download) =====' -ForegroundColor Cyan
  if (-not (Test-Path -LiteralPath (Join-Path $src 'Barq.exe'))) {
    Write-Host ('[FAIL] not found: ' + $src + '\Barq.exe') -ForegroundColor Red; return
  }

  # [1] close Barq (locked files = broken copy)
  $proc = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($proc) { $proc | Stop-Process -Force; Start-Sleep -Seconds 2 }
  Write-Host '[1] Barq closed'

  # [2] copy everything EXCEPT portable data (Data\) and the marker itself
  robocopy $src $dst /E /NFL /NDL /NJH /NJS /NP /XF portable.txt /XD Data | Out-Null
  if ($LASTEXITCODE -ge 8) {
    Write-Host ('[FAIL] robocopy error code ' + $LASTEXITCODE) -ForegroundColor Red; return
  }
  Write-Host ('[2] copied to ' + $dst)

  # [3] drop junk that only makes sense in the original (old backups/zips)
  $res = Join-Path $dst 'resources'
  foreach ($i in @('app.asar.bak','barq120.zip','barq121.zip','barq122.zip','barq123.zip','barq124.zip','barq125.zip','barq126.zip','barq127.zip','barq128.zip')) {
    $p = Join-Path $res $i
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
  }
  Write-Host '[3] junk cleaned inside the copy'

  # [4] write the portable marker - from now data lives in Data\ next to Barq.exe
  if (-not (Test-Path -LiteralPath (Join-Path $dst 'portable.txt'))) {
    Set-Content -LiteralPath (Join-Path $dst 'portable.txt') -Value 'Barq portable - all data stays in Data folder next to Barq.exe'
  }
  Write-Host '[4] portable.txt written'

  # [5] verify + start
  $ok = (Test-Path -LiteralPath (Join-Path $dst 'Barq.exe')) -and
        (Test-Path -LiteralPath (Join-Path $dst 'portable.txt')) -and
        (Test-Path -LiteralPath (Join-Path $dst 'resources'))
  if (-not $ok) { Write-Host '[FAIL] copy verification failed - original untouched' -ForegroundColor Red; return }
  Start-Process -FilePath (Join-Path $dst 'Barq.exe') -WorkingDirectory $dst
  Write-Host '===== DONE - portable Barq is running =====' -ForegroundColor Green
  Write-Host ('    its data folder: ' + (Join-Path $dst 'Data') + ' (created on first use)')
  Write-Host '    move the whole folder to USB anytime - it travels with its data'
}
