# -*- coding: utf-8 -*-
"""1.4.4 — تعديلات main.js: افتراضي جوجل + أسماء المتعقبات + IPC الجديدة + البحث متعدد المحركات"""
import io

p = 'main.js'
src = io.open(p, encoding='utf-8').read()
orig = src

def rep(old, new, count=1):
    global src
    n = src.count(old)
    assert n == count, 'anchor not found or ambiguous (%d): %s' % (n, old[:70])
    src = src.replace(old, new)

# ---------- 1) الافتراضي جوجل + الترحيل ----------
rep(
    'let omniEnabled = Object.keys(SEARCH_ENGINES); // الكل مفعّل افتراضياً',
    '''// 1.4.4 — الافتراضي: جوجل فقط مفعّل والباقي لا، والاختيار محفوظ لكل مرة يفتح فيها المستخدم المتصفح
const OMNI_DEFAULT = ["google"];
let omniEnabled = OMNI_DEFAULT.slice();
let omniPrev = null; // لقطة الاختيار السابق — زر «شامل» يبدّل بين الكل واللقطة'''
)

rep(
    '''function loadOmniEnabled() {
  try {
    const f = dataFile("omni-engines.json");
    if (f && fs.existsSync(f)) {
      const ok = sanitizeOmniEnabled(JSON.parse(fs.readFileSync(f, "utf8")));
      if (ok) return ok;
    }
  } catch {}
  return Object.keys(SEARCH_ENGINES);
}''',
    '''function loadOmniEnabled() {
  try {
    const f = dataFile("omni-engines.json");
    if (f && fs.existsSync(f)) {
      const ok = sanitizeOmniEnabled(JSON.parse(fs.readFileSync(f, "utf8")));
      if (ok) {
        // ترحيل 1.4.4: ملف «الكل مفعّل» هو إعداد المصنع القديم لا اختيار مستخدم حقيقي
        // → يُستبدل بالافتراضي الجديد (جوجل فقط). أي تركيبة أخرى يُحترم فيها اختيار المستخدم.
        const all = Object.keys(SEARCH_ENGINES);
        const sameAll = ok.length === all.length && all.every((id) => ok.indexOf(id) !== -1);
        return sameAll ? OMNI_DEFAULT.slice() : ok;
      }
    }
  } catch {}
  return OMNI_DEFAULT.slice();
}'''
)

# ---------- 2) مخزن أسماء المتعقبات ----------
rep(
    '''let blockedTotal = 0;
let blockedCurrent = 0;''',
    '''let blockedTotal = 0;
let blockedCurrent = 0;
// 1.4.4 — أسماء المتعقبات المحجوبة فعلياً: عدّاد لكل نطاق + سجل آخر المحجوبات
// (الدرع في الشريط يفتح قائمة بالأسماء الحقيقية ليطمئن المستخدم — لا أرقام عمياء)
const blockedByDomain = Object.create(null);
const blockedLog = [];
function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\\./, "") || "نطاق غير معروف";
  } catch {
    return "نطاق غير معروف";
  }
}'''
)

# ---------- 3) تسجيل المحجوب في معالج الحجب ----------
rep(
    '''      if (details.resourceType !== "mainFrame" && isBlocked(details.url)) {
        blockedTotal += 1;
        blockedCurrent += 1;
        scheduleStats();
        cb({ cancel: true });
        return;
      }''',
    '''      if (details.resourceType !== "mainFrame" && isBlocked(details.url)) {
        blockedTotal += 1;
        blockedCurrent += 1;
        // 1.4.4 — سجّل من حُجب بالضبط (النطاق + عدد الطلبات الملغاة منه)
        const bh = hostOf(details.url);
        blockedByDomain[bh] = (blockedByDomain[bh] || 0) + 1;
        blockedLog.push({ d: bh, t: Date.now() });
        if (blockedLog.length > 80) blockedLog.splice(0, blockedLog.length - 80);
        scheduleStats();
        cb({ cancel: true });
        return;
      }'''
)

# ---------- 4) uiPopH قرب panelOpenName ----------
rep(
    'let panelOpenName = null; // null | "history" | "bookmarks"',
    '''let panelOpenName = null; // null | "history" | "bookmarks"
let uiPopH = 0; // 1.4.4: ارتفاع القائمة المنبثقة المفتوحة من الشريط (0 = مغلقة)'''
)

# ---------- 5) layout ينزح الصفحة تحت القائمة ----------
rep(
    '''  const [w, h] = win.getContentSize();
  const top = CHROME_H;
  const height = Math.max(0, h - CHROME_H);''',
    '''  const [w, h] = win.getContentSize();
  // 1.4.4: قائمة المحركات/نافذة المتعقبات المنبثقة من الشريط تُنزح الصفحة أسفلها
  // كي لا تغطيها طبقة العرض — نفس منطق إزاحة اللوحة الجانبية تماماً
  const top = CHROME_H + uiPopH;
  const height = Math.max(0, h - CHROME_H - uiPopH);'''
)

# ---------- 6) closeUiPop قبل layout ----------
rep(
    'function layout() {',
    '''// 1.4.4 — إغلاق أي قائمة منبثقة من الشريط: الصفحة ترجع لكامل مساحتها فوراً
function closeUiPop() {
  if (!uiPopH) return;
  uiPopH = 0;
  layout();
  try {
    if (win && !win.isDestroyed()) win.webContents.send("barq:ui-pop-closed");
  } catch {}
}

function layout() {'''
)

# ---------- 7) إغلاق القائمة عند التنقل وفتح اللوحة ----------
rep(
    '''  wc.on("did-navigate", (_e, url) => {
    blockedCurrent = 0;
    trackNav(url);''',
    '''  wc.on("did-navigate", (_e, url) => {
    blockedCurrent = 0;
    closeUiPop(); // 1.4.4: أي تنقل يغلق قائمة المحركات/نافذة المتعقبات المفتوحة
    trackNav(url);'''
)

rep(
    '''  panelOpenName = n;
  layout();''',
    '''  panelOpenName = n;
  closeUiPop(); // 1.4.4: فتح اللوحة الجانبية يغلق قائمة المحركات المنسدلة
  layout();'''
)

# ---------- 8) navigate: محرك واحد مباشر / أكثر = شامل ----------
rep(
    '''ipcMain.on("barq:navigate", (_e, raw) => {
  const url = normalizeInput(raw);
  if (url) navigate(url); // 1.4.0: السجل يتكفل به did-navigate — مصدر واحد للسجل
});''',
    '''ipcMain.on("barq:navigate", (_e, raw) => {
  const input = String(raw == null ? "" : raw).trim();
  if (!input) return;
  // عنوان موقع → تنقل مباشر كما هو
  if (/^https?:\\/\\//i.test(input) ||
      (/^[\\w-]+(\\.[\\w-]+)+(\\/.*)?$/i.test(input) && !input.includes(" "))) {
    navigate(normalizeInput(input));
    return;
  }
  // 1.4.4 — البحث من الخانة العليا يتبع خانات الاختيار في القائمة المنسدلة:
  // محرك واحد مفعّل = بحث مباشر فيه (ويصير هو الافتراضي)؛ أكثر من محرك = البحث الشامل
  if (omniEnabled.length === 1) {
    const only = omniEnabled[0];
    if (SEARCH_ENGINES[only] && only !== currentEngine) {
      currentEngine = only;
      saveEngine(only);
      pushStats();
    }
    navigate(normalizeInput(input));
    return;
  }
  omniOpenPage(input);
});

// 1.4.4 — فتح صفحة البحث الشامل (تُستخدم من منطق المحركات المتعددة ومن omni-open)
function omniOpenPage(q) {
  const s = String(q || "").trim();
  if (!view || view.webContents.isDestroyed()) return;
  view.webContents
    .loadFile(path.join(__dirname, "chrome", "omni.html"), { query: s ? { q: s } : {} })
    .catch(() => {});
}'''
)

# ---------- 9) omni-open يعيد استخدام omniOpenPage ----------
rep(
    '''ipcMain.on("barq:omni-open", (_e, q) => {
  const s = String(q || "").trim();
  if (!view || view.webContents.isDestroyed()) return;
  view.webContents
    .loadFile(path.join(__dirname, "chrome", "omni.html"), { query: s ? { q: s } : {} })
    .catch(() => {});
});''',
    'ipcMain.on("barq:omni-open", (_e, q) => omniOpenPage(q));'
)

# ---------- 10) مزامنة المحركات + زر شامل + الدرع + القوائم ----------
rep(
    '''ipcMain.handle("barq:omni-enabled", () => ({ enabled: omniEnabled.slice() }));
ipcMain.on("barq:omni-set-enabled", (_e, arr) => {
  const ok = sanitizeOmniEnabled(arr);
  if (!ok) return; // لا قائمة فارغة ولا معرّفات غريبة
  omniEnabled = ok;
  saveOmniEnabled(omniEnabled);
});''',
    '''ipcMain.handle("barq:omni-enabled", () => ({ enabled: omniEnabled.slice() }));
ipcMain.on("barq:omni-set-enabled", (_e, arr) => {
  const ok = sanitizeOmniEnabled(arr);
  if (!ok) return; // لا قائمة فارغة ولا معرّفات غريبة
  omniEnabled = ok;
  saveOmniEnabled(omniEnabled);
  syncOmniEnabled(); // 1.4.4: القائمة في الشريط تتحدث لحظياً من أي مكان
});

// 1.4.4 — مزامنة حالة المحركات مع شريط الأدوات بعد كل تغيير
function syncOmniEnabled() {
  try {
    if (win && !win.isDestroyed()) {
      win.webContents.send("barq:omni-enabled-changed", { enabled: omniEnabled.slice() });
    }
  } catch {}
  pushStats();
}

// 1.4.4 — زر «شامل» في الشريط: صح على كل المحركات ↔ رجوع للاختيار السابق
ipcMain.on("barq:omni-all", () => {
  const all = Object.keys(SEARCH_ENGINES);
  const isAll = omniEnabled.length === all.length &&
    all.every((id) => omniEnabled.indexOf(id) !== -1);
  if (!isAll) {
    omniPrev = omniEnabled.slice(); // احفظ الوضع السابق قبل التوسيع
    omniEnabled = all.slice();
  } else {
    omniEnabled = omniPrev && omniPrev.length ? omniPrev.slice() : OMNI_DEFAULT.slice();
    omniPrev = null;
  }
  saveOmniEnabled(omniEnabled);
  syncOmniEnabled();
});

// 1.4.4 — درع المتعقبات: النطاقات المحجوبة فعلياً وعدد الطلبات الملغاة لكل منها
ipcMain.handle("barq:trackers", () => ({
  total: blockedTotal,
  current: blockedCurrent,
  domains: Object.keys(blockedByDomain)
    .map((d) => ({ d, n: blockedByDomain[d] }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 40),
  recent: blockedLog.slice(-12).reverse(),
}));

// 1.4.4 — القوائم المنبثقة من الشريط: الصفحة تنزاح أسفلها لحظة الفتح
ipcMain.on("barq:ui-pop", (_e, h) => {
  const n = Math.max(0, Math.min(420, Number(h) || 0));
  if (n === uiPopH) return;
  uiPopH = n;
  layout();
});
ipcMain.on("barq:ui-pop-close", () => closeUiPop());'''
)

# ---------- 11) barq:engines يعيد enabled ----------
rep(
    '''ipcMain.handle("barq:engines", () => ({
  current: currentEngine,
  list: Object.keys(SEARCH_ENGINES).map((id) => ({''',
    '''ipcMain.handle("barq:engines", () => ({
  current: currentEngine,
  enabled: omniEnabled.slice(), // 1.4.4: خانات الاختيار في القائمة المنسدلة
  list: Object.keys(SEARCH_ENGINES).map((id) => ({'''
)

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('main.js edits OK — %d -> %d chars' % (len(orig), len(src)))
