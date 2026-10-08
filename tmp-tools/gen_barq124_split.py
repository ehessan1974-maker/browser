#!/usr/bin/env python3
# Builds the 3-paste split delivery for Barq 1.2.4 (paste-safe for PS 5.1 console).
# paste 1 -> base64 part A -> %TEMP%\barq124_a.b64  (+ len/md5 self-check)
# paste 2 -> base64 part B -> %TEMP%\barq124_b.b64  (+ len/md5 self-check)
# paste 3 -> installer: joins parts, SHA256 gate, steps [1]..[8]
import base64, hashlib, os, zipfile

ZIP_PATH = '/home/z/my-project/download/barq-1.2.4/barq124.zip'
OUT_DIR = '/home/z/my-project/download/barq-1.2.4'
SRC = '/home/z/my-project/desktop'
SPLIT = 140  # lines per part

# ---------- 0. zip integrity + payload == current sources ----------
data = open(ZIP_PATH, 'rb').read()
sha = hashlib.sha256(data).hexdigest()
with zipfile.ZipFile(ZIP_PATH) as z:
    assert z.testzip() is None, 'corrupt zip'
    assert z.read('main.js') == open(os.path.join(SRC, 'main.js'), 'rb').read()
    assert z.read('chrome/ui.html') == open(os.path.join(SRC, 'chrome/ui.html'), 'rb').read()
    assert z.read('chrome/ui.js') == open(os.path.join(SRC, 'chrome/ui.js'), 'rb').read()
    assert z.read('package.json') == open(os.path.join(SRC, 'package.json'), 'rb').read()
    assert b'panelSide === "left"' in z.read('main.js'), 'side marker missing'
    assert b'closePanel(); // ' not in z.read('main.js'), 'stay-open marker missing'
    assert b'width: 360px' in z.read('chrome/ui.html'), 'side css missing'
    assert b'color: #ffffff' in z.read('chrome/ui.html'), 'white text missing'
    assert b'#18251f' in z.read('chrome/ui.html'), 'new panel bg missing'
    assert b'id="marks"' in z.read('chrome/ui.html'), 'marks missing'
    assert b'id="side-history"' in z.read('chrome/ui.html'), 'side toggle missing'
    assert b'button:active' in z.read('chrome/ui.html'), 'pressed css missing'
    assert b'"version": "1.2.4"' in z.read('package.json'), 'version marker missing'

# ---------- 1. base64 split ----------
b64 = base64.b64encode(data).decode()
lines = [b64[i:i + 76] for i in range(0, len(b64), 76)]
assert ''.join(lines) == b64
A, B = lines[:SPLIT], lines[SPLIT:]
for part in (A, B):
    assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in ''.join(part)), 'bad b64 char'
    assert "@'" not in ''.join(part) and "'@" not in ''.join(part), 'here-string collision'

def md5_of(part):
    s = ''.join(part)  # exactly what PS computes after -replace '\s',''
    return len(s), hashlib.md5(s.encode('ascii')).hexdigest()

lenA, md5A = md5_of(A)
lenB, md5B = md5_of(B)
assert base64.b64decode(''.join(A) + ''.join(B)) == data, 'split does not round-trip'

# ---------- 2. part A block ----------
P1 = r'''# ============================================================
#  Barq 1.2.4 upgrade - PASTE 1 of 3  (payload part A)
#  Copy this WHOLE block (first line to last line), paste it in
#  PowerShell, press Enter once. Wait for:  [OK-A] part 1 saved
#  (If you see ">>" after pasting, press Enter once. If it stays
#   ">>", press Ctrl+C and copy the block again, whole.)
# ============================================================
$ErrorActionPreference = 'Continue'
$BarqA = @'
@@LINESA@@
'@
$p = ($BarqA -replace '\s', '')
$len = $p.Length
$md5 = [BitConverter]::ToString([System.Security.Cryptography.MD5]::Create().ComputeHash([Text.Encoding]::ASCII.GetBytes($p))).Replace('-', '').ToLower()
if ($len -eq @@LENA@@ -and $md5 -eq '@@MD5A@@') {
  [IO.File]::WriteAllText((Join-Path $env:TEMP 'barq124_a.b64'), $p)
  Write-Host ('[OK-A] part 1 saved (len=' + $len + ')') -ForegroundColor Green
} else {
  Write-Host ('[FAIL-A] len=' + $len + ' md5=' + $md5) -ForegroundColor Red
  Write-Host ('expected: len=@@LENA@@ md5=@@MD5A@@') -ForegroundColor Yellow
  Write-Host '-> run PASTE 1 again, copy it whole, first line to last line' -ForegroundColor Yellow
}
'''

# ---------- 3. part B block ----------
P2 = P1.replace('PASTE 1 of 3  (payload part A)', 'PASTE 2 of 3  (payload part B)')
P2 = P2.replace('$BarqA', '$BarqB').replace("barq124_a.b64", "barq124_b.b64")
P2 = P2.replace('[OK-A] part 1 saved', '[OK-B] part 2 saved')
P2 = P2.replace('[FAIL-A]', '[FAIL-B]')
P2 = P2.replace('run PASTE 1 again', 'run PASTE 2 again')
P2 = P2.replace('@@LINESA@@', '@@LINESB@@').replace('@@LENA@@', '@@LENB@@').replace('@@MD5A@@', '@@MD5B@@')

# ---------- 4. installer block (logic identical to proven 1.2.2/1.2.3 script) ----------
P3 = r'''# ============================================================
#  Barq 1.2.4 upgrade - PASTE 3 of 3  (install)
#  Paste this WHOLE block and it runs by itself. Barq will open
#  automatically at the end. Wait for:  ===== DONE =====
# ============================================================
$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'
& {

  Write-Host '===== Barq 1.2.4 upgrade - panel side toggle + pressed buttons =====' -ForegroundColor Cyan

  # [1] payload from the two saved parts
  $fa = Join-Path $env:TEMP 'barq124_a.b64'
  $fb = Join-Path $env:TEMP 'barq124_b.b64'
  if (-not (Test-Path -LiteralPath $fa)) { Write-Host '[FAIL] part 1 not saved yet - run PASTE 1 first' -ForegroundColor Red; return }
  if (-not (Test-Path -LiteralPath $fb)) { Write-Host '[FAIL] part 2 not saved yet - run PASTE 2 first' -ForegroundColor Red; return }
  $b64 = ([IO.File]::ReadAllText($fa) + [IO.File]::ReadAllText($fb)) -replace '\s', ''
  try { $bytes = [Convert]::FromBase64String($b64) } catch {
    Write-Host '[FAIL] payload broken - run PASTE 1 and PASTE 2 again' -ForegroundColor Red; return }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLower()
  if ($hash -ne '@@SHA@@') {
    Write-Host '[FAIL] payload hash mismatch - run PASTE 1 and PASTE 2 again' -ForegroundColor Red; return }
  Write-Host ('[1] payload OK: ' + $bytes.Length + ' bytes, SHA256 verified') -ForegroundColor Green

  # [2] close running Barq (locked files = silent failure)
  $proc = Get-Process -Name 'Barq' -ErrorAction SilentlyContinue
  if ($proc) {
    $proc | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host '[2] Barq was running -> closed it (OK)' -ForegroundColor Yellow
  } else {
    Write-Host '[2] Barq is not running (OK)' -ForegroundColor Green
  }

  # [3] find the real Barq folder
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
  if (-not $barq) {
    $candidates = @('D:\Barq','C:\Barq',"$env:USERPROFILE\Desktop\Barq","$env:USERPROFILE\Downloads\Barq","$env:USERPROFILE\Barq","$env:LOCALAPPDATA\Programs\barq","$env:LOCALAPPDATA\Programs\Barq")
    foreach ($c in $candidates) {
      if (Test-Path -LiteralPath (Join-Path $c 'Barq.exe')) { $barq = $c; break }
    }
  }
  if (-not $barq) {
    $roots = @('D:\', $desk, "$env:USERPROFILE\Downloads", "$env:LOCALAPPDATA\Programs")
    foreach ($r in $roots) {
      if ($barq) { break }
      $hit = Get-ChildItem -Path $r -Filter 'Barq.exe' -Recurse -Depth 3 -Force -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hit) { $barq = $hit.DirectoryName }
    }
  }
  if (-not $barq) {
    Write-Host '[FAIL] Barq.exe not found anywhere. Tell me where you extracted it.' -ForegroundColor Red
    return
  }
  Write-Host ('[3] found: ' + $barq) -ForegroundColor Green

  $res     = Join-Path $barq 'resources'
  $appDir  = Join-Path $res 'app'
  $asar    = Join-Path $res 'app.asar'
  $asarBak = Join-Path $res 'app.asar.bak'

  # OLD version diagnostic
  $oldVer = '?'
  try { $oldVer = (Get-Content -LiteralPath (Join-Path $appDir 'package.json') -Raw | ConvertFrom-Json).version } catch {}
  Write-Host ('[3] installed version before this upgrade: ' + $oldVer)

  try {
    New-Item -ItemType Directory -Force -Path $res -ErrorAction Stop | Out-Null
    Set-Content -LiteralPath (Join-Path $res '.barq_test') -Value 'x' -ErrorAction Stop
    Remove-Item -LiteralPath (Join-Path $res '.barq_test') -Force
  } catch {
    Write-Host '[FAIL] no write permission to the Barq folder. Open PowerShell AS ADMINISTRATOR and paste again.' -ForegroundColor Red
    return
  }

  Write-Host ('[4] state: asar=' + (Test-Path -LiteralPath $asar) + ' bak=' + (Test-Path -LiteralPath $asarBak) + ' app=' + (Test-Path -LiteralPath $appDir))

  # [5] write resources\app
  $zipPath = Join-Path $env:TEMP 'barq-1.2.4.zip'
  [IO.File]::WriteAllBytes($zipPath, $bytes)
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
  if (-not (Test-Path -LiteralPath (Join-Path $appDir 'chrome\ui.html'))) {
    Write-Host '[FAIL] extraction failed' -ForegroundColor Red
    return
  }
  Write-Host '[5] 1.2.4 files written to resources\app (OK)' -ForegroundColor Green

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
  $homeRaw = ''
  try { $mainRaw = Get-Content -LiteralPath (Join-Path $appDir 'main.js') -Raw } catch {}
  try { $uiRaw = Get-Content -LiteralPath (Join-Path $appDir 'chrome\ui.html') -Raw } catch {}
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
'''

P1 = P1.replace('@@LINESA@@', '\n'.join(A)).replace('@@LENA@@', str(lenA)).replace('@@MD5A@@', md5A)
P2 = P2.replace('@@LINESB@@', '\n'.join(B)).replace('@@LENB@@', str(lenB)).replace('@@MD5B@@', md5B)
P3 = P3.replace('@@SHA@@', sha)

files = {
    'paste1-partA.txt': P1,
    'paste2-partB.txt': P2,
    'paste3-install.txt': P3,
}
for name, content in files.items():
    assert all(ord(c) < 128 for c in content), f'non-ascii in {name}'
    with open(os.path.join(OUT_DIR, name), 'w', encoding='ascii', newline='\n') as fh:
        fh.write(content)

# ---------- 5. simulate exactly what PowerShell will do ----------
sa = open(os.path.join(OUT_DIR, 'paste1-partA.txt'), 'r', encoding='ascii').read()
sb = open(os.path.join(OUT_DIR, 'paste2-partB.txt'), 'r', encoding='ascii').read()
s3 = open(os.path.join(OUT_DIR, 'paste3-install.txt'), 'r', encoding='ascii').read()

def here_string_payload(txt, varname):
    start = txt.index("$" + varname + " = @'\n") + len("$" + varname + " = @'\n")
    end = txt.index("\n'@\n", start)
    inner = txt[start:end]
    assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in inner.replace('\n', '')), 'unexpected chars in here-string'
    return inner.replace('\n', '')

pa = here_string_payload(sa, 'BarqA')
pb = here_string_payload(sb, 'BarqB')
assert len(pa) == lenA and hashlib.md5(pa.encode('ascii')).hexdigest() == md5A, 'part A check mismatch'
assert len(pb) == lenB and hashlib.md5(pb.encode('ascii')).hexdigest() == md5B, 'part B check mismatch'
decoded = base64.b64decode(pa + pb)
assert hashlib.sha256(decoded).hexdigest() == sha, 'final sha mismatch'
assert decoded == data, 'decoded payload != zip bytes'
assert '@@' not in s3, 'unreplaced placeholder in installer'

print('ZIP     :', ZIP_PATH, len(data), 'bytes')
print('SHA256  :', sha)
print('PART A  :', lenA, 'chars,', len(A), 'lines, md5', md5A)
print('PART B  :', lenB, 'chars,', len(B), 'lines, md5', md5B)
print('BLOCKS  : paste1', len(P1.splitlines()), 'ln | paste2', len(P2.splitlines()), 'ln | paste3', len(P3.splitlines()), 'ln')
print('VERIFY  : split round-trip OK, md5 gates OK, final SHA256 OK')
