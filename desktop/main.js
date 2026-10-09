// برق — متصفح سطح مكتب خفيف بمحرك Chromium
// شريط أدوات عربي RTL + حظر حقيقي للمتعقبات على مستوى الشبكة
// 1.1.0 — البحث في كل محركات البحث: جوجل، بينج، دك دك جو، ياندكس، ويكيبيديا
// 1.2.0 — سجل بحث + مفضلة بنجمة (تخزين محلي JSON في userData)
// 1.2.1 — إصلاح حاسم: اللوحتان كانتا مخفيتين خلف BrowserView — layout() ينزل العرض عند فتح اللوحة
// 1.2.2 — اللوحتان صارتا جانبيتين بنمط كروم: على الحافة اليسرى (مرآة RTL لكروم) والعرض ينضغط جانبياً
// 1.2.3 — اللوحة تبقى مفتوحة أثناء التنقل مثل كروم تماماً (الإغلاق بزرها فقط فقط)
// 1.2.4 — جهة اللوحة الجانبية قابلة للتبديل يسار/يمين بزر داخل رأس اللوحة،
//         والاختيار يُحفظ لدى الواجهة ويُطبّق على تخطيط العرض فوراً
// 1.2.5 — إصلاح التغطية: فك/إرفاق الصفحة حول اللوحة (أخفى الصفحة — انحدار أُصلح بعده)
// 1.2.6 — اللوحة BrowserView مستقل يُرفق آخراً فترسم فوق الصفحة دائماً (لا تغطية معكوسة)
// 1.2.7 — سلوك كروم الحقيقي: عند فتح اللوحة الصفحة تنزاح/تنضغط جانباً لتفرغ مكانها
//         (لا تبقى مخبوأة وراءها)، وعند الغلق ترجع لكامل المساحة.
//         اللوحة تبقى BrowserView مستقلاً بأعلى طبقة كضمان — فلو تعذّرت الإزاحة
//         على جهاز قديم فأسوأ حالة أن ترسم اللوحة فوق الصفحة (سلوك 1.2.6) — لا اختفاء أبداً.
// 1.2.8 — النسخة المحمولة الحقيقية: إن وُجد ملف portable.txt بجوار Barq.exe
//         تصبح كل بيانات المستخدم (مفضلة/سجل/جلسات) بمجلد Data بجواره،
//         فيشتغل برق من فلاش USB أو أي مجلد بدون تثبيت ومعه ملفاته.
// 1.3.0 — البحث الشامل: استعلام واحد ← عدة محركات في نفس اللحظة:
//         نتائج حية مباشرة (ويكيبيديا API + دك دك جو HTML + بينج HTML)
//         تُجلب من العملية الرئيسية بالتوازي وكل قسم يظهر لحظة جهوزه،
//         + محركات جديدة: يوتيوب، إكس، خرائط جوجل (المجموع 8)،
//         + زر «الكل» في الشريط والرئيسية يفتح صفحة البحث الشامل.
// 1.3.1 — خانة تفعيل أمام كل محرك في صفحة البحث الشامل: المستخدم يفعّل/يلغي
//         أي محرك ويبقى اختياره محفوظاً (omni-engines.json) ويُطبَّق فوراً
//         حتى أثناء البحث الجاري — إلغاء يخفي القسم، وتفعيل يجلب النتائج لحضاً.
// 1.4.0 — السجل صار سجل تصفح كامل: أي نقرة على أي رابط أو موقع تدخل السجل
//         (وليس البحث فقط) بعنوان الصفحة الحقيقي، ومنطق «الأحدث للأمام»
//         يمنع التكرار فيتماشى مع زري رجوع وتقدم (الرجوع يحدّث الموقع لا يكرره)،
//         + عرض اللوحة الجانبية قابل للتغيير بالسحب من حافتها (260–640) ويُحفظ،
//         + زر «مسح الكل» يُعطّل تلقائياً عندما يكون السجل فارغاً.
"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  shell,
  screen,
} = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { blockedHosts } = require("./trackers");

/* ------------------------- الوضع المحمول (1.2.8) ------------------------- */
// إن وُجد ملف portable.txt بجوار Barq.exe: كل بيانات المستخدم تُخزَّن
// بمجلد Data بجواره بدلاً من %APPDATA% — النسخة تنتقل مع فلاش USB
// وتحمل مفضلتها وسجلها معها. بدون الملف يبقى السلوك العادي تماماً.
try {
  const EXE_DIR = path.dirname(app.getPath("exe"));
  if (fs.existsSync(path.join(EXE_DIR, "portable.txt"))) {
    const PORTABLE_DATA = path.join(EXE_DIR, "Data");
    if (!fs.existsSync(PORTABLE_DATA)) fs.mkdirSync(PORTABLE_DATA, { recursive: true });
    app.setPath("userData", PORTABLE_DATA);
  }
} catch (e) { /* لا portable.txt — الوضع العادي */ }

const HOME_FILE = path.join(__dirname, "chrome", "home.html");
const CHROME_H = 56;

/* ------------------------- محركات البحث المدعومة ------------------------- */

const SEARCH_ENGINES = {
  google:     { name: "جوجل",      url: "https://www.google.com/search?q=" },
  bing:       { name: "بينج",      url: "https://www.bing.com/search?q=" },
  duckduckgo: { name: "دك دك جو",  url: "https://duckduckgo.com/?q=" },
  yandex:     { name: "ياندكس",    url: "https://yandex.com/search/?text=" },
  wikipedia:  { name: "ويكيبيديا", url: "https://ar.wikipedia.org/w/index.php?search=" },
  youtube:    { name: "يوتيوب",    url: "https://www.youtube.com/results?search_query=" },
  x:          { name: "إكس (تويتر)", url: "https://x.com/search?q=" },
  maps:       { name: "خرائط جوجل", url: "https://www.google.com/maps/search/" },
};
const DEFAULT_ENGINE = "duckduckgo";

let currentEngine = DEFAULT_ENGINE;

function engineFile() {
  try {
    return path.join(app.getPath("userData"), "search-engine.json");
  } catch {
    return null;
  }
}

function loadEngine() {
  try {
    const f = engineFile();
    if (f && fs.existsSync(f)) {
      const id = JSON.parse(fs.readFileSync(f, "utf8")).engine;
      if (SEARCH_ENGINES[id]) return id;
    }
  } catch {}
  return DEFAULT_ENGINE;
}

function saveEngine(id) {
  try {
    const f = engineFile();
    if (f) fs.writeFileSync(f, JSON.stringify({ engine: id }), "utf8");
  } catch {}
}

/* ---------------------- سجل البحث والمفضلة (1.2.0) ---------------------- */

const SEARCH_HISTORY_MAX = 300;
const BOOKMARKS_MAX = 500;
const PANEL_W = 360;    // العرض الافتراضي للوحة
const PANEL_MIN = 260;  // أقل عرض بالسحب (1.4.0)
const PANEL_MAX = 640;  // أقصى عرض بالسحب (1.4.0)

let searchHistory = []; // { url, title, q, engine, t } — سجل تصفح كامل (1.4.0)
let bookmarks = [];     // { url, title, t }
let panelOpenName = null; // null | "history" | "bookmarks"
let panelSide = "left";   // جهة اللوحة — main هو مصدر الحقيقة الوحيد ويُحفظ على القرص
let panelW = PANEL_W;     // عرض اللوحة الذي اختاره المستخدم بالسحب (1.4.0)

function dataFile(name) {
  try {
    return path.join(app.getPath("userData"), name);
  } catch {
    return null;
  }
}

function readJson(name, fallback) {
  try {
    const f = dataFile(name);
    if (f && fs.existsSync(f)) {
      const v = JSON.parse(fs.readFileSync(f, "utf8"));
      if (Array.isArray(v) || (v && typeof v === "object")) return v; // 1.4.0: الكائنات أيضاً — إصلاح: إعدادات اللوحة كانت لا تُقرأ
    }
  } catch {}
  return fallback;
}

function writeJson(name, value) {
  try {
    const f = dataFile(name);
    if (f) fs.writeFileSync(f, JSON.stringify(value), "utf8");
  } catch {}
}

// هل هذا رابط بحث في أحد المحركات؟ يرجع معرف المحرك أو null
function engineIdFromUrl(url) {
  for (const id in SEARCH_ENGINES) {
    if (url.startsWith(SEARCH_ENGINES[id].url)) return id;
  }
  return null;
}

/* --- 1.4.0: سجل تصفح كامل — كل نقرة/موقع يدخل السجل لا البحث فقط ---
   منطق «الأحدث للأمام»: نفس الرابط يُنقل للأعلى ويُحدَّث وقته ولا يتكرر أبداً —
   لهذا يتماشى السجل مع زري رجوع وتقدم: الرجوع لموقع مُسجَّل يحدّثه ولا يضيف نسخة */

let histWriteTimer = null;
let histPanelTimer = null;

function scheduleHistoryWrite() {
  if (histWriteTimer) return;
  histWriteTimer = setTimeout(() => {
    histWriteTimer = null;
    writeJson("search-history.json", searchHistory);
  }, 400);
}

function schedulePanelRefresh() {
  if (histPanelTimer) return;
  histPanelTimer = setTimeout(() => {
    histPanelTimer = null;
    pushPanelRefresh("history"); // لو السجل مفتوح يتحدث فوراً (بدون قصف)
  }, 500);
}

function addHistoryEntry(rec) {
  const url = String(rec.url || "");
  if (!/^https?:\/\//i.test(url)) return;
  const t = Date.now();
  const idx = searchHistory.findIndex((x) => x.url === url);
  if (idx >= 0) {
    const e = searchHistory[idx];
    e.t = t;
    if (rec.title) e.title = rec.title;
    if (rec.q) e.q = rec.q;
    if (rec.engine) e.engine = rec.engine;
    searchHistory.splice(idx, 1);
    searchHistory.unshift(e);
  } else {
    searchHistory.unshift({
      url,
      title: String(rec.title || "").slice(0, 200),
      q: String(rec.q || "").slice(0, 300),
      engine: rec.engine || "",
      t,
    });
    if (searchHistory.length > SEARCH_HISTORY_MAX) {
      searchHistory.length = SEARCH_HISTORY_MAX;
    }
  }
  scheduleHistoryWrite();
  schedulePanelRefresh();
}

// استخراج كلمة البحث من رابط محرك — بمفاتيح كل محرك لا بالطول فقط
function queryFromUrl(url, engId) {
  const KEYS = {
    google: "q", bing: "q", duckduckgo: "q", x: "q",
    yandex: "text", wikipedia: "search", youtube: "search_query", maps: "query",
  };
  try {
    return new URL(url).searchParams.get(KEYS[engId] || "") || "";
  } catch {
    return "";
  }
}

// كل تنقّل رئيسي يستدعيه did-navigate / did-navigate-in-page
function logVisit(url) {
  if (!url || url.startsWith("file://") || /^https:\/\/barq\.internal\//i.test(url)) return;
  if (!/^https?:\/\//i.test(url)) return;
  const engId = engineIdFromUrl(url);
  addHistoryEntry({
    url,
    q: engId ? queryFromUrl(url, engId) : "",
    engine: engId || "",
    title: "",
  });
}

// العنوان الحقيقي يصل متأخراً (page-title-updated) — نحدّث مدخله لا نكرره
function updateHistoryTitle(url, title) {
  if (!url || !title) return;
  const e = searchHistory.find((x) => x.url === url);
  const t = String(title).slice(0, 200);
  if (e && e.title !== t) {
    e.title = t;
    scheduleHistoryWrite();
    schedulePanelRefresh();
  }
}

/* ------------------------- البحث الشامل (1.3.0) ------------------------- */
// استعلام واحد ← نتائج حية من عدة محركات في نفس اللحظة.
// جوجل وياندكس يحظران الجلب الآلي وعرض النتائج المضمّن، لذا النتائج الحية
// المباشرة من: ويكيبيديا (API رسمي) + دك دك جو (نسخة HTML الخالصة)
// + بينج (HTML)، وبقية المحركات تُفتح بنقرة من أزرار صفحة البحث الشامل.

const OMNI_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function httpGet(url, cb) {
  let done = false;
  const finish = (e, d) => { if (!done) { done = true; cb(e, d); } };
  const req = https.get(url, {
    headers: { "User-Agent": OMNI_UA, "Accept-Language": "ar,en;q=0.8" },
    timeout: 8000,
  }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      try { httpGet(new URL(res.headers.location, url).toString(), finish); }
      catch (e2) { finish(e2); }
      return;
    }
    if (res.statusCode !== 200) { res.resume(); finish(new Error("HTTP " + res.statusCode)); return; }
    let data = "";
    res.setEncoding("utf8");
    res.on("data", (c) => { if (data.length < 900000) data += c; });
    res.on("end", () => finish(null, data));
    res.on("error", (e2) => finish(e2));
  });
  req.on("timeout", () => req.destroy(new Error("timeout")));
  req.on("error", (e2) => finish(e2));
}

function stripTags(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// روابط دك دك جو التنفيذية: //duckduckgo.com/l/?uddg=<encoded>&rut=...
function ddgRealUrl(u) {
  const m = String(u || "").match(/[?&]uddg=([^&]+)/);
  if (m) { try { return decodeURIComponent(m[1]); } catch { return u; } }
  return u;
}

function parseDdg(html) {
  const out = [];
  const re = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && out.length < 6) {
    const t = stripTags(m[2]);
    if (!t || !m[1]) continue;
    out.push({ t: t, u: ddgRealUrl(m[1]), s: "" });
  }
  let i = 0;
  const sre = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = sre.exec(html)) && i < out.length) { out[i].s = stripTags(m[1]).slice(0, 220); i++; }
  return out;
}

function parseBing(html) {
  const out = [];
  const re = /<li[^>]+class="[^"]*b_algo[^"]*"[^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<li[^>]+class="[^"]*b_algo|<\/ol>)/g;
  let m;
  while ((m = re.exec(html)) && out.length < 6) {
    const t = stripTags(m[2]);
    if (!t || !m[1]) continue;
    out.push({ t: t, u: m[1], s: stripTags(m[3] || "").slice(0, 220) });
  }
  return out;
}

function searchWiki(q, cb) {
  const u = "https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
    encodeURIComponent(q) + "&format=json&srlimit=5";
  httpGet(u, (e, d) => {
    if (e || !d) return cb([]);
    try {
      const r = JSON.parse(d);
      cb(((r.query && r.query.search) || []).map((x) => ({
        t: x.title,
        u: "https://ar.wikipedia.org/wiki/" + encodeURIComponent(String(x.title).replace(/ /g, "_")),
        s: stripTags(x.snippet || ""),
      })));
    } catch { cb([]); }
  });
}

function searchDdg(q, cb) {
  httpGet("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q), (e, d) => {
    cb(e || !d ? [] : parseDdg(d));
  });
}

function searchBing(q, cb) {
  httpGet("https://www.bing.com/search?q=" + encodeURIComponent(q) + "&setlang=ar", (e, d) => {
    cb(e || !d ? [] : parseBing(d));
  });
}

/* ------------------- تفعيل/إلغاء المحركات (1.3.1) ------------------- */
// خانة اختيار أمام كل محرك بصفحة البحث الشامل. الاختيار محفوظ على القرص
// وmain هو مصدر الحقيقة: يتحقق من المعرّفات ولا يقبل قائمة فارغة أبداً
// (محرك واحد على الأقل يبقى مفعّلاً) — وملف فاسد = كل المحركات مفعّلة.

let omniEnabled = Object.keys(SEARCH_ENGINES); // الكل مفعّل افتراضياً

function sanitizeOmniEnabled(arr) {
  if (!Array.isArray(arr)) return null;
  const seen = {};
  const out = [];
  for (const id of arr) {
    if (SEARCH_ENGINES[id] && !seen[id]) { seen[id] = true; out.push(id); }
  }
  return out.length ? out : null; // قائمة فارغة = ارفضها
}

function loadOmniEnabled() {
  try {
    const f = dataFile("omni-engines.json");
    if (f && fs.existsSync(f)) {
      const ok = sanitizeOmniEnabled(JSON.parse(fs.readFileSync(f, "utf8")));
      if (ok) return ok;
    }
  } catch {}
  return Object.keys(SEARCH_ENGINES);
}

function saveOmniEnabled(arr) {
  try {
    const f = dataFile("omni-engines.json");
    if (f) fs.writeFileSync(f, JSON.stringify(arr), "utf8");
  } catch {}
}

function isBookmarked(url) {
  return bookmarks.some((b) => b.url === url);
}

function toggleBookmark() {
  if (!view || view.webContents.isDestroyed()) return { ok: false };
  const url = view.webContents.getURL() || "";
  if (!url || url.startsWith("file://") || /^https:\/\/barq\.internal\//i.test(url)) {
    return { ok: false };
  }
  const idx = bookmarks.findIndex((b) => b.url === url);
  let starred;
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    starred = false;
  } else {
    const title = (view.webContents.getTitle() || url).slice(0, 200);
    bookmarks.unshift({ url, title, t: Date.now() });
    if (bookmarks.length > BOOKMARKS_MAX) bookmarks.length = BOOKMARKS_MAX;
    starred = true;
  }
  writeJson("bookmarks.json", bookmarks);
  pushStats();
  pushPanelRefresh("bookmarks"); // 1.2.6: لو المفضلة مفتوحة تتحدث فوراً
  return { ok: true, starred };
}

function removeBookmark(url) {
  const n = bookmarks.length;
  bookmarks = bookmarks.filter((b) => b.url !== url);
  if (bookmarks.length !== n) {
    writeJson("bookmarks.json", bookmarks);
    pushStats();
  }
}

// 1.2.7 — اللوحة BrowserView مستقل يُرفق آخراً فيرسم فوق صفحة الويب دائماً (ضمان الظهور)،
// والصفحة تنزاح/تنضغط جانباً عند فتح اللوحة (سلوك كروم) وترجع لكامل المساحة عند الغلق.
// 1.2.7 — عرض اللوحة مصدر واحد تستخدمه حدود اللوحة وإزاحة الصفحة معاً حتى لا يتعارضا أبداً
function panelWidth() {
  const size = win && !win.isDestroyed() ? win.getContentSize() : [PANEL_W, 0];
  return Math.min(panelW, PANEL_MAX, Math.max(0, size[0]));
}

function panelBounds() {
  const [w, h] = win.getContentSize();
  const pw = panelWidth();
  return {
    x: panelSide === "left" ? 0 : Math.max(0, w - pw),
    y: CHROME_H,
    width: pw,
    height: Math.max(0, h - CHROME_H),
  };
}

function pushPanelButtons() {
  if (win && !win.isDestroyed()) {
    win.webContents.send("barq:panel-buttons", {
      history: panelOpenName === "history",
      bookmarks: panelOpenName === "bookmarks",
    });
  }
}

function pushPanelRefresh(name) {
  if (panelOpenName === name && panelView && !panelView.webContents.isDestroyed()) {
    panelView.webContents.send("barq:panel-show", { name, side: panelSide });
  }
}

function setPanel(name) {
  if (!win || win.isDestroyed() || !panelView) return;
  const n = name === "history" || name === "bookmarks" ? name : null;
  if (n && panelOpenName === n) {
    closePanel(); // نفس الزر ثانية = إغلاق
    return;
  }
  if (!n) {
    closePanel();
    return;
  }
  panelOpenName = n;
  layout(); // 1.2.7: الصفحة تنزاح أولاً لتفرغ مكان اللوحة (سلوك كروم)
  if (win.getBrowserViews().indexOf(panelView) === -1) {
    win.addBrowserView(panelView); // آخر من أُرفق = أعلى طبقة فوق الصفحة
  }
  panelView.setBounds(panelBounds());
  panelView.webContents.send("barq:panel-show", { name: n, side: panelSide });
  pushPanelButtons();
  // تأمين للأجهزة القديمة: إعادة تطبيق التخطيط بعد استقرار الطبقات — الاستدعاء لا ضرر منه
  setImmediate(function () {
    if (panelOpenName === n) layout();
  });
}

function closePanel() {
  if (!panelOpenName) return;
  panelOpenName = null;
  try {
    if (panelView && !panelView.webContents.isDestroyed() && win && !win.isDestroyed() &&
        win.getBrowserViews().indexOf(panelView) !== -1) {
      win.removeBrowserView(panelView);
    }
  } catch {}
  layout(); // 1.2.7: الصفحة ترجع تكبر على كامل المساحة بعد غلق اللوحة
  pushPanelButtons();
}

/* ------------------- استقرار الأجهزة القديمة / 32-bit ------------------- */

// تسريع الرسوميات على كروت الشاشة القديمة سبب شائع لتجميد الويندوز — نستخدم المعالج بدلًا منه
app.disableHardwareAcceleration();

// عمليات أقل = ذاكرة أقل: موقع واحد لكل عملية، حد أقصى للعمليات، بلا عزل مواقع (يضاعف الذاكرة)
app.commandLine.appendSwitch("process-per-site");
app.commandLine.appendSwitch("renderer-process-limit", "2");
app.commandLine.appendSwitch("disable-features", "site-per-process,IsolateOrigins");
// سقف ذاكرة V8 لكل عملية (256MB) — يمنع نمو الذاكرة بلا حدود على الأجهزة القديمة
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256");
// كاش قرص صغير (32MB) — الكاش الكبير على الأقراص الميكانيكية القديمة يسبب تجمدًا واضحًا
app.commandLine.appendSwitch("disk-cache-size", "33554432");

let win = null;
let view = null;
let panelView = null;
let blockedTotal = 0;
let blockedCurrent = 0;
let badgeTimer = null;

/* ------------------------------ tracker block ----------------------------- */

function isBlocked(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host.endsWith(".github.io") || host === "localhost") return false;
    return blockedHosts.some(
      (d) => host === d || host.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

function pushStats() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("barq:nav-state", navState());
}

function scheduleStats() {
  if (badgeTimer) return;
  badgeTimer = setTimeout(() => {
    badgeTimer = null;
    pushStats();
  }, 250);
}

// Electron ≥27 يوفّر navigationHistory؛ نسخة ويندوز 7 (Electron 22) توفر الدوال على webContents مباشرة
function navHistory(wc) {
  return wc.navigationHistory ?? wc;
}

function navState() {
  let url = "";
  let canBack = false;
  let canFwd = false;
  if (view && !view.webContents.isDestroyed()) {
    const wc = view.webContents;
    url = wc.getURL() || "";
    canBack = navHistory(wc).canGoBack();
    canFwd = navHistory(wc).canGoForward();
  }
  const isHome = url.startsWith("file://");
  const eng = SEARCH_ENGINES[currentEngine] || SEARCH_ENGINES[DEFAULT_ENGINE];
  let title = "";
  if (view && !view.webContents.isDestroyed()) {
    title = view.webContents.getTitle() || "";
  }
  return {
    url: isHome ? "" : url,
    canBack,
    canFwd,
    blockedCurrent,
    blockedTotal,
    isHome,
    engine: currentEngine,
    engineName: eng ? eng.name : "",
    title,
    starred: !isHome && !!url && isBookmarked(url),
  };
}

/* --------------------------------- helpers -------------------------------- */

function normalizeInput(raw) {
  const input = (raw || "").trim();
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(input) && !input.includes(" ")) {
    return "https://" + input;
  }
  const eng = SEARCH_ENGINES[currentEngine] || SEARCH_ENGINES[DEFAULT_ENGINE];
  return eng.url + encodeURIComponent(input);
}

function navigate(target) {
  if (!view || !target) return;
  view.webContents.loadURL(target).catch(() => {});
}

function goHome() {
  if (!view || view.webContents.isDestroyed()) return;
  view.webContents
    .loadFile(HOME_FILE, { query: { engine: currentEngine } })
    .catch(() => {});
}

// روابط داخلية من صفحة البداية: barq.internal/set-engine و barq.internal/search
function handleInternal(raw) {
  try {
    const u = new URL(raw);
    if (u.hostname !== "barq.internal") return;
    const id = u.searchParams.get("e") || currentEngine;
    const q = u.searchParams.get("q");
    if (u.pathname === "/set-engine") {
      if (SEARCH_ENGINES[id]) {
        currentEngine = id;
        saveEngine(id);
      }
      goHome();
    } else if (u.pathname === "/search" && q) {
      const eng =
        SEARCH_ENGINES[id] ||
        SEARCH_ENGINES[currentEngine] ||
        SEARCH_ENGINES[DEFAULT_ENGINE];
      // 1.4.0: السجل يتكفل به did-navigate بعد النقل — لا تسجيل يدوي هنا
      navigate(eng.url + encodeURIComponent(q));
    } else if (u.pathname === "/omni") {
      // صفحة البحث الشامل — من زر «الكل» بالرئيسية أو من داخل الصفحة نفسها
      view.webContents
        .loadFile(path.join(__dirname, "chrome", "omni.html"), { query: q ? { q: q } : {} })
        .catch(() => {});
    }
  } catch {}
}

/* ---------------------------------- setup --------------------------------- */

function attachViewEvents() {
  const wc = view.webContents;

  wc.on("did-navigate", (_e, url) => {
    blockedCurrent = 0;
    logVisit(url); // 1.4.0: كل تنقل يدخل السجل — نقرة رابط، عنوان، رجوع، تقدم
    pushStats();
  });
  wc.on("did-navigate-in-page", (_e, url) => {
    logVisit(url); // تنقلات داخل الصفحة (SPA) أيضاً تدخل السجل
    pushStats();
  });
  wc.on("did-finish-load", pushStats);
  // عنوان الصفحة يحدّث السجل والنجمة والحالة (النجمة تُسجل بعنوان حقيقي)
  wc.on("page-title-updated", (_e, title) => {
    updateHistoryTitle(wc.getURL(), title);
    pushStats();
  });

  // النوافذ المنبثقة تُفتح داخل نفس العرض — لا نوافذ عشوائية
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) navigate(url);
    return { action: "deny" };
  });

  // الخصوصية: لا صلاحيات حساسة افتراضيًا
  wc.session.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(["media", "geolocation", "notifications"].indexOf(permission) === -1);
  });

  wc.on("new-window", (e, url) => {
    e.preventDefault();
    if (/^https?:\/\//i.test(url)) navigate(url);
  });

  // الروابط الخارجية (mailto وغيرها) عبر التطبيق الافتراضي + روابط برق الداخلية
  wc.on("will-navigate", (e, url) => {
    if (/^https:\/\/barq\.internal\//i.test(url)) {
      e.preventDefault();
      handleInternal(url);
      return;
    }
    if (!/^https?:|^file:/i.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

function layout() {
  if (!win || win.isDestroyed() || !view) return;
  const [w, h] = win.getContentSize();
  const top = CHROME_H;
  const height = Math.max(0, h - CHROME_H);
  // 1.2.7 — سلوك كروم: اللوحة مفتوحة => الصفحة تنزاح للجهة المقابلة وتنضغط،
  // اللوحة مغلقة => الصفحة كامل المساحة. واللوحة تبقى أعلى طبقة، فلو تعذّرت
  // الإزاحة على جهاز قديم فأسوأ حالة رسمها فوق الصفحة — لا اختفاء ولا تغطية معكوسة.
  if (panelOpenName) {
    const pw = panelWidth();
    view.setBounds({
      x: panelSide === "left" ? pw : 0,
      y: top,
      width: Math.max(0, w - pw),
      height: height,
    });
  } else {
    view.setBounds({ x: 0, y: top, width: Math.max(0, w), height: height });
  }
  if (panelOpenName && panelView && !panelView.webContents.isDestroyed()) {
    panelView.setBounds(panelBounds());
  }
}

// نسخة واحدة فقط من برق — النقر المتكرر على الأيقونة لا يفتح نسخًا إضافية (سبب رئيسي لامتلاء الذاكرة)
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // محرك البحث + سجل البحث + المفضلة المحفوظة من الجلسة السابقة
    currentEngine = loadEngine();
    // 1.4.0 — ترحيل صيغة السجل القديمة ({q,engine,t}) إلى صيغة التصفح الكاملة
    searchHistory = readJson("search-history.json", [])
      .map((x) => ({
        url: x.url || "",
        title: x.title || "",
        q: x.q || "",
        engine: x.engine || "",
        t: x.t || 0,
      }))
      .filter((x) => x.url || x.q);
    bookmarks = readJson("bookmarks.json", []);
    omniEnabled = loadOmniEnabled(); // 1.3.1 — محركات البحث الشامل المفعّلة
    // 1.4.0 — تفضيلات اللوحة: الجهة + العرض المختار بالسحب
    const panelPrefs = readJson("panel-side.json", {});
    panelSide = panelPrefs.side === "right" ? "right" : "left";
    if (Number.isFinite(panelPrefs.width)) {
      panelW = Math.min(PANEL_MAX, Math.max(PANEL_MIN, panelPrefs.width));
    }

    // حظر المتعقبات قبل أي اتصال
    const ses = session.defaultSession;
    ses.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, cb) => {
      if (details.resourceType !== "mainFrame" && isBlocked(details.url)) {
        blockedTotal += 1;
        blockedCurrent += 1;
        scheduleStats();
        cb({ cancel: true });
        return;
      }
      cb({});
    });

    win = new BrowserWindow({
      width: 1280,
      height: 840,
      minWidth: 780,
      minHeight: 560,
      title: "برق",
      backgroundColor: "#0c1210",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "chrome", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    win.loadFile(path.join(__dirname, "chrome", "ui.html"));

    view = new BrowserView({
      webPreferences: {
        // 1.3.0 — جسر البحث الشامل فقط: 3 دوال استعلام بلا أي صلاحية أخرى
        preload: path.join(__dirname, "chrome", "omni-preload.js"),
        contextIsolation: true,
        sandbox: true,
      },
    });
    win.addBrowserView(view);
    attachViewEvents();

    // 1.2.6 — اللوحة المستقلة: تُحمّل مرة واحدة وتُرفق/تفك عند الفتح/الغلق فقط،
    // وتُرفق آخراً فتبقى أعلى طبقة فوق الصفحة مهما حدث
    panelView = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, "chrome", "preload.js"),
        contextIsolation: true,
        sandbox: true,
      },
    });
    panelView.webContents.loadFile(path.join(__dirname, "chrome", "panel.html"));

    layout();
    win.on("resize", layout);
    // 1.2.7: كل تغيير لحجم/وضع النافذة يعيد حساب إزاحة الصفحة وحدود اللوحة معاً
    win.on("maximize", layout);
    win.on("unmaximize", layout);
    win.on("restore", layout);
    win.on("enter-full-screen", layout);
    win.on("leave-full-screen", layout);
    win.on("closed", () => {
      win = null;
    });

    goHome();
    pushStats();
  });
}

app.on("window-all-closed", () => {
  app.quit();
});

/* ----------------------------------- IPC ---------------------------------- */

/* البحث الشامل (1.3.0): ثلاثة محركات تجيب بالتوازي وكل قسم يظهر لحظة جهوزه */
ipcMain.handle("barq:omni-wiki", (_e, q) => new Promise((res) => searchWiki(String(q || "").slice(0, 200), res)));
ipcMain.handle("barq:omni-ddg",  (_e, q) => new Promise((res) => searchDdg(String(q || "").slice(0, 200), res)));
ipcMain.handle("barq:omni-bing", (_e, q) => new Promise((res) => searchBing(String(q || "").slice(0, 200), res)));
ipcMain.on("barq:omni-open", (_e, q) => {
  const s = String(q || "").trim();
  if (!view || view.webContents.isDestroyed()) return;
  view.webContents
    .loadFile(path.join(__dirname, "chrome", "omni.html"), { query: s ? { q: s } : {} })
    .catch(() => {});
});

/* تفعيل/إلغاء محركات البحث الشامل (1.3.1): main يتحقق ويحفظ — الواجهة ترسم فقط */
ipcMain.handle("barq:omni-enabled", () => ({ enabled: omniEnabled.slice() }));
ipcMain.on("barq:omni-set-enabled", (_e, arr) => {
  const ok = sanitizeOmniEnabled(arr);
  if (!ok) return; // لا قائمة فارغة ولا معرّفات غريبة
  omniEnabled = ok;
  saveOmniEnabled(omniEnabled);
});

ipcMain.on("barq:navigate", (_e, raw) => {
  const url = normalizeInput(raw);
  if (url) navigate(url); // 1.4.0: السجل يتكفل به did-navigate — مصدر واحد للسجل
});
ipcMain.on("barq:back", () => {
  if (view && !view.webContents.isDestroyed()) {
    const h = navHistory(view.webContents);
    if (h.canGoBack()) h.goBack();
  }
});
ipcMain.on("barq:forward", () => {
  if (view && !view.webContents.isDestroyed()) {
    const h = navHistory(view.webContents);
    if (h.canGoForward()) h.goForward();
  }
});
ipcMain.on("barq:reload", () => {
  if (view) view.webContents.reload();
});
ipcMain.on("barq:home", () => goHome());
ipcMain.handle("barq:state", () => navState());

/* ------------------------------ محرك البحث -------------------------------- */

ipcMain.on("barq:set-engine", (_e, id) => {
  if (SEARCH_ENGINES[id]) {
    currentEngine = id;
    saveEngine(id);
    pushStats();
  }
});

ipcMain.handle("barq:engines", () => ({
  current: currentEngine,
  list: Object.keys(SEARCH_ENGINES).map((id) => ({
    id,
    name: SEARCH_ENGINES[id].name,
  })),
}));

/* ---------------------- سجل البحث والمفضلة: IPC ---------------------- */

ipcMain.on("barq:panel", (_e, name) => setPanel(name));

/* عرض اللوحة بالسحب (1.4.0): main يتابع مؤشر النظام نفسه كل 16ms —
   السحب لا يتوقف لو خرج المؤشر من اللوحة، وينتهي بأي إفلات فأرة (اللوحة أو الصفحة) */
let resizeTimer = null;
function stopPanelResize() {
  if (resizeTimer) {
    clearInterval(resizeTimer);
    resizeTimer = null;
  }
  writeJson("panel-side.json", { side: panelSide, width: panelW });
}
ipcMain.on("barq:panel-resize-start", () => {
  if (!win || win.isDestroyed()) return;
  stopPanelResize(); // إعادة بدء نظيفة لو بقي مؤقّت سابق
  resizeTimer = setInterval(() => {
    if (!win || win.isDestroyed()) {
      stopPanelResize();
      return;
    }
    try {
      const c = screen.getCursorScreenPoint();
      const b = win.getContentBounds();
      const relX = c.x - b.x;
      let w = panelSide === "left" ? relX : b.width - relX;
      w = Math.min(PANEL_MAX, Math.max(PANEL_MIN, w));
      if (w !== panelW) {
        panelW = w;
        layout(); // الحافة تلاحق المؤشر — المؤشر يبقى على المقبض
      }
    } catch {}
  }, 16);
});
ipcMain.on("barq:panel-resize-end", () => stopPanelResize());

// 1.2.6 — جهة اللوحة: main هو مصدر الحقيقة الوحيد — يحفظها ويخبر اللوحة ويحرّك حدودها
ipcMain.on("barq:panel-side", (_e, side) => {
  panelSide = side === "right" ? "right" : "left";
  writeJson("panel-side.json", { side: panelSide, width: panelW });
  if (panelView && !panelView.webContents.isDestroyed()) {
    panelView.webContents.send("barq:panel-side-changed", { side: panelSide });
  }
  if (panelOpenName) layout();
});

ipcMain.handle("barq:get-history", () => ({
  list: searchHistory.slice(0, 150),
}));

ipcMain.on("barq:remove-search", (_e, t) => {
  const n = searchHistory.length;
  searchHistory = searchHistory.filter((x) => x.t !== t);
  if (searchHistory.length !== n) {
    writeJson("search-history.json", searchHistory);
  }
});

ipcMain.on("barq:clear-history", () => {
  searchHistory = [];
  writeJson("search-history.json", searchHistory);
});

ipcMain.handle("barq:get-bookmarks", () => ({ list: bookmarks }));

ipcMain.handle("barq:star", () => toggleBookmark());

ipcMain.on("barq:remove-bookmark", (_e, url) => removeBookmark(url));
