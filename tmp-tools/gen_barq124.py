#!/usr/bin/env python3
# Builds barq124.zip + Barq-Upgrade-1.2.4.ps1
# 1.2.4: panel side toggle (left/right) + :active pressed feedback everywhere + bulletproof panel text
import base64, hashlib, os, shutil, subprocess, zipfile

SRC = '/home/z/my-project/desktop'
STAGE = '/tmp/barq124-stage'
OUT_DIR = '/home/z/my-project/download/barq-1.2.4'
ZIP_PATH = os.path.join(OUT_DIR, 'barq124.zip')
PS1_PATH = os.path.join(OUT_DIR, 'Barq-Upgrade-1.2.4.ps1')
PUB_DIR = '/home/z/my-project/public/downloads'

# ---------- 1. stage files (zip layout identical to previous releases) ----------
if os.path.exists(STAGE):
    shutil.rmtree(STAGE)
os.makedirs(os.path.join(STAGE, 'chrome'))
for f in ['main.js', 'trackers.js', 'package.json']:
    shutil.copy2(os.path.join(SRC, f), os.path.join(STAGE, f))
for f in ['preload.js', 'home.html', 'ui.html', 'ui.js']:
    shutil.copy2(os.path.join(SRC, 'chrome', f), os.path.join(STAGE, 'chrome', f))

# ---------- 2. zip ----------
os.makedirs(OUT_DIR, exist_ok=True)
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)
subprocess.run(
    ['zip', '-r', '-X', 'barq124.zip', 'main.js', 'trackers.js', 'chrome', 'package.json'],
    cwd=STAGE, check=True, capture_output=True)
shutil.move(os.path.join(STAGE, 'barq124.zip'), ZIP_PATH)

data = open(ZIP_PATH, 'rb').read()
sha = hashlib.sha256(data).hexdigest()

# ---------- 3. base64 blob: 76-char lines, LAST line ends with newline ----------
b64 = base64.b64encode(data).decode()
lines = [b64[i:i + 76] for i in range(0, len(b64), 76)]
blob = '\n'.join(lines) + '\n'

TEMPLATE = r'''# ============================================================
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
@@B64@@
'@
  $b64 = ($b64 -replace '\s', '')
  $bytes = [Convert]::FromBase64String($b64)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne '@@SHA@@') {
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
'''

ps1 = TEMPLATE.replace('@@B64@@', blob).replace('@@SHA@@', sha)
with open(PS1_PATH, 'w', encoding='ascii', newline='\n') as fh:
    fh.write(ps1)

# ---------- 4. round-trip verification ----------
txt = open(PS1_PATH, 'r', encoding='ascii').read()
start_marker = "$b64 = @'\n"
end_marker = "\n'@\n"
i = txt.index(start_marker) + len(start_marker)
j = txt.index(end_marker, i)
inner = txt[i:j]
assert inner.endswith('\n'), 'last base64 line has no trailing newline'
assert "'@" not in inner and "@'" not in inner, 'here-string terminator collision'
decoded = base64.b64decode(inner.replace('\n', ''))
assert hashlib.sha256(decoded).hexdigest() == sha, 'sha mismatch'
with zipfile.ZipFile(ZIP_PATH) as z:
    bad = z.testzip()
    assert bad is None, f'corrupt zip entry: {bad}'
assert decoded == data, 'payload != zip bytes'

# ---------- 5. payload == current sources + fix markers ----------
with zipfile.ZipFile(ZIP_PATH) as z, open('/tmp/barq124-stage/main.js', 'rb') as a, open('/tmp/barq124-stage/chrome/ui.html', 'rb') as b, open('/tmp/barq124-stage/chrome/ui.js', 'rb') as c, open('/tmp/barq124-stage/package.json', 'rb') as d, open('/tmp/barq124-stage/chrome/home.html', 'rb') as e:
    assert z.read('main.js') == a.read(), 'main.js mismatch'
    assert z.read('chrome/ui.html') == b.read(), 'ui.html mismatch'
    assert z.read('chrome/ui.js') == c.read(), 'ui.js mismatch'
    assert z.read('chrome/home.html') == e.read(), 'home.html mismatch'
    assert z.read('package.json') == d.read(), 'package.json mismatch'
    m = z.read('main.js'); u = z.read('chrome/ui.html'); j2 = z.read('chrome/ui.js'); h = z.read('chrome/home.html')
    assert b'panelSide === "left"' in m, 'side marker missing in main.js'
    assert b'barq:panel-side' in m, 'side ipc missing in main.js'
    assert b'BOOKMARKS_MAX' in m, 'features missing in main.js'
    assert b'width: 360px' in u, 'side css missing in ui.html'
    assert b'body.panel-right .panel' in u, 'panel-right css missing'
    assert b'id="side-history"' in u and b'id="side-bookmarks"' in u, 'side buttons missing'
    assert b'button:active' in u, 'pressed css missing in ui.html'
    assert b'color: #ffffff' in u, 'white text missing in ui.html'
    assert b'#18251f' in u, 'new panel bg missing in ui.html'
    assert b'id="marks"' in u, 'marks missing in ui.html'
    assert b'barq-panel-side' in j2, 'side storage missing in ui.js'
    assert b'applyPanelSide' in j2, 'applyPanelSide missing in ui.js'
    assert b'a.tile:active' in h, 'pressed css missing in home.html'
    assert b'"version": "1.2.4"' in z.read('package.json'), 'version marker missing'
    assert b'1.2.4' in j2, 'ui.js 1.2.4 marker missing'

# ---------- 6. plan C: public copy ----------
os.makedirs(PUB_DIR, exist_ok=True)
shutil.copy2(ZIP_PATH, os.path.join(PUB_DIR, 'barq124.zip'))

print('ZIP      :', ZIP_PATH, len(data), 'bytes')
print('SHA256   :', sha)
print('PS1      :', PS1_PATH, os.path.getsize(PS1_PATH), 'bytes,', ps1.count('\n'), 'lines')
print('Public   :', os.path.join(PUB_DIR, 'barq124.zip'))
print('VERIFY   : round-trip OK, payload OK, side-toggle + pressed + contrast markers OK')
