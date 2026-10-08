# ============================================================
#  Barq 1.2.3 - in-place upgrade with full diagnostics
#  NEW in 1.2.3:
#   - History/Bookmarks SIDE panel on the LEFT edge (Chrome-style,
#     mirrored for the Arabic RTL interface) - the page shrinks
#     sideways instead of the panel dropping over it.
#   - HIGH-CONTRAST panel text: white titles, bigger fonts, brighter
#     background - clearly readable on old faded laptop screens.
#   - The panel STAYS OPEN while you browse - exactly like Chrome.
#     It closes only when you press its button again.
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

  Write-Host '===== Barq 1.2.3 upgrade - side panels + clear text =====' -ForegroundColor Cyan

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
qkpPTbsqgPlfUEsDBBQAAAAIAM6IPV03J7y6qwYAALARAAALAAAAdHJhY2tlcnMuanOVWM2u3DQU
3s9TRLMqgslIVLCguotCBWxYsWCBWDi2J/GMY/vazp2ZUiSKygWVBULiDRD0UglQVUHhTZItT8Kx
k9hOZu4CqWrHxz6//ny+k67XWXvTvui+yv798ses+6p91v7Sfd3+mrW/tX+3L7L2WfcE1s/bf2Dv
BnafZ923vbB7Akt3ygmdqP0ZToGwu+6egoU73XX7sv3d2bpp/wAxCF9brMHh8+779hWo3YBb+Ova
LdzP3tdf3dPu8TtZJY3NLi4uMiJrxET26JEX5VQQ8wmz1Z1lvsxeH3a9Xee7Nz7E/gokfczuzPsa
1TRrf3LRdN/BUZexj/vP7jGo+Nyu4efL7ptgCNL8oXuSufhdYZxevlg2hmbGaobt8t5igaWAUAsu
8Y6SDyFGk11kny6yDGL6QMqS0+w+Mdk6uy8QP1qG3e8Hsik4fY8zvIOTS+KX2C1zQe3yjWxZelVz
FIRhZJkUOZZ13EDEUH3FMDW93Fnpd1Zo9DPVsKisYauk+kR+aiqYz/tDo4oCfUTezG+NLjpPFXuT
9cwYUmpVU2QaTWsq7CjeME0LZCiTg3Jfy48lZohnViMotDbOJJReUGzzDcK0kDLUbr4uNVJVPBVD
CsHaPbM2VsZYSArnUIXVbOdENLPDdnb04A/PJEVjmKDGrJBiky1nxurcCKRwhUItDF4NsfhUfNI2
V0yAf2ps6uhEyGU5Fzp95yIHpJFwZ+rgMgWZAASzIE7Xa3UIwMg1JYQFN/QK7m4U1qCAgl12oPx0
w5mZKE2u+V1WZohkkO5e6p3pfYqDSVI9GkvrsK7RQylWczHWzFIZHQ7rARCqKWpf1eG0bgoGYFJa
bh2eBqlUVBySwiODOJ1kWDBiAAy4Gg2bGmnbP54UMxup62jIIoAhD0ZkYwuNYt1NhTS1lZZNWY0y
Sz2WrnoDR0Y5qeW4yQShh/0+POumhj/jqo83+L57F2EtTVpOtKGQuIXEKQlaErk0xmXfnyAltjlO
msTqiCopozE4YhlAvIwiMFw1wdJDSmRqQUvOg1NkK+hGobi8oTvE4o3uCRZW85gMKnehahYpFMJn
5K0VNCecZIkloG14Ae52hITLi/uAsJVhtYrdSfPkiRBaQ42jZ1lbTfB4664y8MZcpqNorEu+VWvw
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

'@
  $b64 = ($b64 -replace '\s', '')
  $bytes = [Convert]::FromBase64String($b64)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne '0bc29cec989c60ca8d7386dd9e03d378c0164fe9d97d84eca495108940058cc3') {
    Write-Host '[FAIL] payload corrupted by copy/paste. Copy the whole code again, from the first line to the last.' -ForegroundColor Red
    return
  }
  Write-Host ('[4] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  $zipPath = Join-Path $env:TEMP 'barq-1.2.3.zip'
  [System.IO.File]::WriteAllBytes($zipPath, $bytes)

  # [5] write resources\app
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html')) {
    Write-Host '[5] 1.2.3 files written to resources\app (OK)' -ForegroundColor Green
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
  $stayOk = -not $mainRaw.Contains('closePanel(); // ')
  $uiOk   = $uiRaw.Contains('width: 360px')
  $whiteOk = $uiRaw.Contains('color: #ffffff')
  $bgOk   = $uiRaw.Contains('#18251f')
  $btnOk  = $uiRaw.Contains('id="marks"')
  $featOk = $mainRaw.Contains('BOOKMARKS_MAX')
  Write-Host ('[7] verify: version=' + $ver + '  side-panel=' + $(if ($sideOk) {'OK'} else {'MISSING'}) + '  stay-open=' + $(if ($stayOk) {'OK'} else {'MISSING'}) + '  ui-side=' + $(if ($uiOk) {'OK'} else {'MISSING'}) + '  white-text=' + $(if ($whiteOk) {'OK'} else {'MISSING'}) + '  new-bg=' + $(if ($bgOk) {'OK'} else {'MISSING'}) + '  buttons=' + $(if ($btnOk) {'OK'} else {'MISSING'}) + '  features=' + $(if ($featOk) {'OK'} else {'MISSING'}))
  if (-not ($sideOk -and $uiOk -and $btnOk -and $featOk -and $whiteOk -and $bgOk -and $stayOk)) { Write-Host '[FAIL] verification failed' -ForegroundColor Red; return }

  # [8] launch
  Start-Process -FilePath (Join-Path $barq 'Barq.exe')
  Write-Host '[8] Barq launched' -ForegroundColor Green
  Write-Host '===== DONE =====' -ForegroundColor Cyan
  Write-Host 'NEW: the clock (history) and ribbon (favorites) buttons open a SIDE'
  Write-Host 'panel on the LEFT edge, Chrome-style, with clear white text.'
  Write-Host 'The panel stays open while you browse - press its button again to close it.'
  Write-Host 'Try: search something, press the clock. Open any site, press the star, then the ribbon.'
}

Upgrade-Barq
