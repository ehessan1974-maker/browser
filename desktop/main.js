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
// 1.4.1 — مسح السجل يمسحه من زري رجوع وتقدم أيضاً: الزران يتبعان مسار تنقل خاص
//         ببرق يمُح مع السجل — «مسح الكل» يعطّل الزرين فوراً ويقفّل سجل كروم الداخلي،
//         وحذف مدخل واحد يزيله من مسار الرجوع والتقدم (بالاتجاهين) حتى لو كانت
//         الجلسة نفسها، مع استبدال إعادة التوجيه السريعة لنفس الموقع بدل تكديسها.
// 1.4.6 — إشعار التحديث من داخل البرنامج كما طلبه المستخدم:
//         رسالة فورية «يتوفر تحديث جديد» لحظة اكتشافه (وليس فقط عند اكتمال
//         تنزيله)، والفحص كل 30 دقيقة بدل 4 ساعات حتى يصل الخبر للجميع أسرع.
// 1.4.5 — خاصيات كروم في الشريط الفوقاني وقائمة 3 نقاط:
//         تكبير/تصغير خط الصفحة (أزرار + Ctrl+= / Ctrl+- / Ctrl+0)،
//         ترجمة الصفحة عبر غوغل (translate.goog)، خانة تنزيلات كاملة مثل كروم
//         (قائمة منبثقة: تقدم حي، فتح، إظهار بالمجلد، إلغاء، مسح — تُفتح تلقائياً
//         عند بدء أي تنزيل)، وقائمة 3 نقاط للإعدادات (تكبير، ترجمة، تنزيلات،
//         النسخة الخفيفة HTML، مسح الكاش، حول برق).
// 1.4.2 — حساب برق: زر تسجيل دخول اختياري تماماً — من لا يريد حساباً
//         يعمل على برق بشكل طبيعي 100% بلا أي قفل ولا شاشة دخول.
//         الزر يفتح لوحة «الحساب»: دخول أو إنشاء حساب محلي على الجهاز
//         (الاسم نص عادي وكلمة المرور salt+SHA-256 في account.json)،
//         والجلسة تعود عند كل فتح حتى تسجيل الخروج. التحقق كله في main.
"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  shell,
  screen,
  dialog,
} = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
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
let uiPopH = 0; // 1.4.4: ارتفاع القائمة المنبثقة المفتوحة من الشريط (0 = مغلقة)
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

/* ---------------- 1.4.1: مسار رجوع/تقدم يمسح مع السجل ---------------- */
// الزران كانا يتبعان سجل كروم الداخلي: المستخدم يمسح السجل من اللوحة
// فيبقى الزران يوصلان بالصفحات الممسوحة. الآن يتبعان مساراً خاصاً ببرق
// يُمسح مع السجل: «مسح الكل» يعطّلهما فوراً، وحذف مدخل واحد يُزيله
// من المسار أيضاً (رجوعاً وتقدماً) — والصفحة الحالية تبقى كما هي.

const NAV_STACK_MAX = 60;
let navStack = [];     // روابط فقط — الأحدث في النهاية، وصفحتا home/omni ضمنها
let navPos = -1;       // موضع الصفحة الحالية في المسار
let navBtnNav = false; // التنقل الجاري بدأ من زر رجوع/تقدم
let lastNavAt = 0;     // لكشف إعادة التوجيه السريعة لنفس الموقع — تُستبدل لا تُكدّس

function navCur() {
  return navPos >= 0 && navPos < navStack.length ? navStack[navPos] : null;
}

function sameHost(a, b) {
  try {
    const h = (u) => new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return h(a) === h(b);
  } catch { return false; }
}

// did-navigate يحدّث المسار: دفع تنقل جديد / استبدال إعادة توجيه / تقليم الأمام
function trackNav(url) {
  if (!url || /^https:\/\/barq\.internal\//i.test(url)) return;
  const now = Date.now();
  const cur = navCur();
  if (navBtnNav) {
    navBtnNav = false;
    if (cur === url) { lastNavAt = now; return; }        // وصلنا لهدف الزر
    if (navPos >= 0) { navStack[navPos] = url; lastNavAt = now; return; } // أعاد التوجيه أثناء الرجوع
  }
  if (cur === url) { lastNavAt = now; return; }          // إعادة تحميل نفس الصفحة
  // 900ms: إعادة التوجيه تصل لحظات بعد الالتزام — لا يمكن لإنسان أن يتنقل لنفس
  // الموقع خلال هذا الضيق بينما الصفحة الأولى لم تُرسم بعد، فالنافذة آمنة
  if (cur && now - lastNavAt < 900 && sameHost(cur, url)) {
    navStack[navPos] = url;                              // إعادة توجيه سريعة — استبدال لا تكديس
    lastNavAt = now;
    return;
  }
  navStack = navStack.slice(0, navPos + 1);              // تنقل جديد يقلّم ما بعد الحالي
  navStack.push(url);
  if (navStack.length > NAV_STACK_MAX) navStack.shift();
  navPos = navStack.length - 1;
  lastNavAt = now;
}

// تنقّل داخل الصفحة (SPA/مرساة): يُدمج في الموضع الحالي — لا يكدّس المسار
function trackInPageNav(url) {
  if (!url || navPos < 0 || navPos >= navStack.length) return;
  if (navStack[navPos] !== url) navStack[navPos] = url;
}

// زر رجوع/تقدم: يتبع مسار برق — بعد المسح يصل فقط لما لم يُمسح
function goNav(delta) {
  if (!view || view.webContents.isDestroyed()) return;
  const idx = navPos + delta;
  if (idx < 0 || idx >= navStack.length) return;
  const url = navStack[idx];
  if (!url) return;
  navPos = idx;
  navBtnNav = true;
  view.webContents.loadURL(url).catch(() => {});
}

// إزالة كل مواضع رابط من المسار (تبقى الصفحة الحالية إن كانت هي الرابط)
function pruneNavUrls(url) {
  if (!url || navStack.indexOf(url) === -1) return;
  const kept = [];
  let newPos = -1;
  for (let i = 0; i < navStack.length; i++) {
    if (i === navPos) newPos = kept.length;              // الحالي يبقى في مكانه
    if (navStack[i] === url && i !== navPos) continue;   // المحذوف يخرج من المسار
    kept.push(navStack[i]);
  }
  navStack = kept;
  navPos = newPos >= 0 ? newPos : Math.min(navPos, navStack.length - 1);
  pushStats();                                           // الأزرار تُعاد حسابها فوراً
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

// طلب HTTPS عام (GET/POST/PATCH مع توثيق اختياري) — يعيد JSON (1.4.3 حساب برق السحابي)
function httpReq(method, url, headers, body, cb) {
  let done = false;
  const finish = (e, d) => { if (!done) { done = true; cb(e, d); } };
  try {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: method,
      headers: Object.assign(
        { "User-Agent": OMNI_UA, "Accept": "application/vnd.github+json" },
        payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {},
        headers || {}
      ),
      timeout: 12000,
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { if (data.length < 900000) data += c; });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          finish(new Error("HTTP " + res.statusCode), data ? data.slice(0, 300) : "");
          return;
        }
        try { finish(null, JSON.parse(data || "{}")); }
        catch { finish(null, {}); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e2) => finish(e2));
    if (payload) req.write(payload);
    req.end();
  } catch (e) { finish(e); }
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

// 1.4.4 — الافتراضي: جوجل فقط مفعّل والباقي لا، والاختيار محفوظ لكل مرة يفتح فيها المستخدم المتصفح
const OMNI_DEFAULT = ["google"];
let omniEnabled = OMNI_DEFAULT.slice();
let omniPrev = null; // لقطة الاختيار السابق — زر «شامل» يبدّل بين الكل واللقطة

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
}

function saveOmniEnabled(arr) {
  try {
    const f = dataFile("omni-engines.json");
    if (f) fs.writeFileSync(f, JSON.stringify(arr), "utf8");
  } catch {}
}

/* ---------------- تكبير/تصغير خط الصفحة مثل كروم (1.4.5) ---------------- */
// درجات كروم نفسها (100% ↔ 110% ↔ 125%…) عبر zoomLevel الكرومي
// (1.2^level). يُطبّق على صفحة العرض الرئيسي ويُعاد تطبيقه بعد كل تنقل،
// وباختصارات كروم نفسها: Ctrl+= تكبير، Ctrl+- تصغير، Ctrl+0 الحجم الأصلي.

const ZOOM_MIN = -3;   // ≈ 58%
const ZOOM_MAX = 5;    // ≈ 249%
let zoomLevel = 0;

function zoomPercent() {
  return Math.round(Math.pow(1.2, zoomLevel) * 100);
}

function applyZoom(level) {
  zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, level));
  try {
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.setZoomLevel(zoomLevel);
    }
  } catch {}
  try {
    if (win && !win.isDestroyed()) {
      win.webContents.send("barq:zoom-changed", { percent: zoomPercent() });
    }
  } catch {}
}

// اختصارات كروم — تعمل في الشريط وفي الصفحة وفي اللوحة الجانبية
function bindZoomKeys(wc) {
  try {
    wc.on("before-input-event", (e, input) => {
      if (input.type !== "keyDown" || !(input.control || input.meta)) return;
      const k = String(input.key || "").toLowerCase();
      if (k === "=" || k === "+") { e.preventDefault(); applyZoom(zoomLevel + 0.5); }
      else if (k === "-") { e.preventDefault(); applyZoom(zoomLevel - 0.5); }
      else if (k === "0") { e.preventDefault(); applyZoom(0); }
    });
  } catch {}
}

/* ----------------- خانة التنزيلات مثل كروم (1.4.5) ----------------- */
// كل تنزيل يبدأ من أي صفحة يُتابع هنا: تقدم حي بالقائمة المنبثقة من الشريط،
// القائمة تُفتح تلقائياً عند بدء التنزيل (سلوك كروم) وفيها فتح الملف /
// إظهاره في المجلد / إلغاء جارٍ / مسح المكتملة. الحد 30 عنصراً.

let dlSeq = 0;
let downloads = []; // { id, item, file, url, state, received, total, path }
let dlPushTimer = null;

function downloadsList() {
  return downloads.map((d) => ({
    id: d.id,
    file: d.file,
    url: d.url,
    state: d.state,
    received: d.received,
    total: d.total,
    path: d.path || "",
  }));
}

function pushDownloads() {
  if (dlPushTimer) return; // تسطيح تحديثات updated المتلاحقة — قائمة صغيرة لا تحتاج أسرع
  dlPushTimer = setTimeout(() => {
    dlPushTimer = null;
    try {
      if (win && !win.isDestroyed()) {
        win.webContents.send("barq:downloads", { list: downloadsList() });
      }
    } catch {}
  }, 200);
}

function attachDownloads(ses) {
  ses.on("will-download", (_e, item) => {
    const rec = {
      id: ++dlSeq,
      item,
      file: String(item.getFilename() || "ملف").slice(0, 120),
      url: String(item.getURL() || "").slice(0, 300),
      state: "progressing",
      received: 0,
      total: Number(item.getTotalBytes()) || 0,
      path: "",
    };
    downloads.unshift(rec);
    if (downloads.length > 30) downloads.length = 30;
    pushDownloads();
    // سلوك كروم: فقاعة التنزيل تُفتح تلقائياً عند بدء التنزيل
    try {
      if (win && !win.isDestroyed()) win.webContents.send("barq:download-start");
    } catch {}
    item.on("updated", (_e2, st) => {
      rec.received = item.getReceivedBytes();
      rec.total = Number(item.getTotalBytes()) || rec.total;
      if (st === "interrupted") rec.state = "interrupted";
      pushDownloads();
    });
    item.on("done", (_e2, st) => {
      rec.received = item.getReceivedBytes();
      rec.total = Number(item.getTotalBytes()) || rec.total;
      rec.state =
        st === "completed" ? "completed" : st === "cancelled" ? "cancelled" : "interrupted";
      rec.path = item.getSavePath() || "";
      rec.item = null; // اكتمل — لا نحمل مرجع العنصر زيادة على الذاكرة
      pushDownloads();
    });
  });
}

/* ------------ حساب برق — تسجيل دخول اختياري تماماً (1.4.2) ------------ */
// زر الحساب يفتح لوحة «الحساب»: الدخول اختياري — من لا يريد حساباً
// يعمل على برق بشكل طبيعي 100% بلا أي قفل ولا شاشة دخول.
// الحساب محلي على هذا الجهاز: الاسم نص عادي وكلمة المرور مشفّرة
// (salt + SHA-256) في account.json — الجلسة تبقى مفتوحة بعد إغلاق
// برق حتى تسجيل الخروج، والتحقق كله في main.
// ملف فاسد أو ناقص = يعامل ك«لا حساب» — لا حبس ولا تعطل أبداً.

let accountUser = ""; // فارغ = زائر (الوضع الطبيعي الافتراضي)

function accountRec() {
  try {
    const f = dataFile("account.json");
    if (f && fs.existsSync(f)) {
      const v = JSON.parse(fs.readFileSync(f, "utf8"));
      if (v && typeof v.user === "string" && v.user.length >= 2 && v.user.length <= 40 &&
          typeof v.salt === "string" && v.salt.length >= 16 &&
          typeof v.hash === "string" && /^[0-9a-f]{64}$/.test(v.hash)) return v;
    }
  } catch {}
  return null; // لا حساب (أو ملف فاسد — نتجاهله ونعمل بلا حساب)
}

function accountHash(salt, pass) {
  return crypto.createHash("sha256").update(salt + String(pass)).digest("hex");
}

// عند فتح برق: الجلسة تعود تلقائياً إن كانت مفتوحة — وإلا يبقى برق على وضع الزائر
function accountRestore() {
  const rec = accountRec();
  accountUser = rec && rec.signedIn ? rec.user : "";
}

/* -------- حساب برق السحابي — يتبعك من أي مكان في العالم (1.4.3) -------- */
// مثل كروم: تسجّل دخولك من أي جهاز تجد بياناتك (السجل + المفضلة) تنتظرك.
// المخزن: Gist خاص على حساب GitHub الخاص بالمستخدم — عبر رمز وصول (PAT)
// بصلاحية gist فقط. main هو من يتصل بGitHub — الواجهة لا ترى الرمز أبداً.
// بلا دخول سحابي يعمل برق محلياً بشكل طبيعي 100% — لا إجبار ولا قفل.

const CLOUD_GIST_DESC = "barq-sync (برق)";
const CLOUD_SYNC_MAX = 300;
let cloud = { login: "", name: "", token: "", gistId: "", lastSync: 0 };

function cloudLoad() {
  try {
    const f = dataFile("cloud.json");
    if (f && fs.existsSync(f)) {
      const v = JSON.parse(fs.readFileSync(f, "utf8"));
      if (v && typeof v.token === "string" && v.token.length > 20) {
        cloud = {
          login: String(v.login || ""),
          name: String(v.name || ""),
          token: v.token,
          gistId: typeof v.gistId === "string" ? v.gistId : "",
          lastSync: Number(v.lastSync) || 0,
        };
      }
    }
  } catch {} // ملف فاسد = غير مسجّل — لا تعطل أبداً
}

function cloudSave() {
  writeJson("cloud.json", cloud);
}

function cloudSigned() {
  return !!(cloud.login && cloud.token);
}

function cloudSyncPayload() {
  return {
    v: 1,
    updated: Date.now(),
    device: "برق سطح المكتب",
    history: searchHistory.slice(0, CLOUD_SYNC_MAX),
    bookmarks: bookmarks.slice(0, BOOKMARKS_MAX),
  };
}

// دمج بيانات جهاز آخر: من كل الأجهزة حسب الأحدث وبلا تكرار
function cloudMergeRemote(remote) {
  if (!remote || typeof remote !== "object") return false;
  const rh = Array.isArray(remote.history) ? remote.history : [];
  const rm = Array.isArray(remote.bookmarks) ? remote.bookmarks : [];
  if (!rh.length && !rm.length) return false;
  const seen = {};
  const merged = [];
  searchHistory.concat(rh).forEach((h) => {
    if (!h || !h.url || seen[h.url]) return;
    seen[h.url] = 1;
    merged.push({
      url: String(h.url).slice(0, 500),
      title: String(h.title || "").slice(0, 200),
      q: String(h.q || "").slice(0, 200),
      engine: String(h.engine || "").slice(0, 20),
      t: Number(h.t) || 0,
    });
  });
  merged.sort((a, b) => b.t - a.t);
  searchHistory = merged.slice(0, SEARCH_HISTORY_MAX);
  const sm = {};
  const mm = [];
  bookmarks.concat(rm).forEach((b) => {
    if (!b || !b.url || sm[b.url]) return;
    sm[b.url] = 1;
    mm.push({ url: String(b.url).slice(0, 500), title: String(b.title || "").slice(0, 200), t: Number(b.t) || 0 });
  });
  mm.sort((a, b) => b.t - a.t);
  bookmarks = mm.slice(0, BOOKMARKS_MAX);
  writeJson("search-history.json", searchHistory);
  writeJson("bookmarks.json", bookmarks);
  pushPanelRefresh("history");
  pushPanelRefresh("bookmarks");
  return true;
}

// المزامنة: اسحب السحابي ← ادمجه محلياً ← ارفع الناتج — خطوة واحدة ذكية
function cloudSync(cb) {
  cb = cb || function () {};
  if (!cloudSigned()) return cb({ ok: false, msg: "غير مسجّل سحابياً" });
  const push = (gistId) => {
    httpReq("PATCH", "https://api.github.com/gists/" + gistId,
      { Authorization: "Bearer " + cloud.token },
      { files: { "barq-sync.json": { content: JSON.stringify(cloudSyncPayload()) } } },
      (e) => {
        if (e) return cb({ ok: false, msg: "تعذر الرفع — تحقق من الاتصال" });
        cloud.lastSync = Date.now();
        cloudSave();
        pushStats();
        cb({ ok: true });
      });
  };
  const ensure = () => {
    if (cloud.gistId) return push(cloud.gistId);
    // ابحث عن مخزن المزامنة ضمن gists الحساب
    httpReq("GET", "https://api.github.com/gists?per_page=100",
      { Authorization: "Bearer " + cloud.token }, null, (e, list) => {
        if (e || !Array.isArray(list))
          return cb({ ok: false, msg: "تعذر الوصول إلى GitHub — تحقق من الرمز والاتصال" });
        let found = null;
        list.forEach((g) => {
          if (g && g.description && g.description.indexOf(CLOUD_GIST_DESC) === 0 &&
              g.files && g.files["barq-sync.json"]) found = g;
        });
        if (found) {
          // اسحب ما لدى الأجهزة الأخرى أولاً ثم ارفع الدمج
          httpReq("GET", "https://api.github.com/gists/" + found.id,
            { Authorization: "Bearer " + cloud.token }, null, (e2, g2) => {
              if (!e2 && g2 && g2.files && g2.files["barq-sync.json"] && g2.files["barq-sync.json"].content) {
                try { cloudMergeRemote(JSON.parse(g2.files["barq-sync.json"].content)); } catch {}
              }
              cloud.gistId = found.id;
              cloudSave();
              push(found.id);
            });
          return;
        }
        httpReq("POST", "https://api.github.com/gists",
          { Authorization: "Bearer " + cloud.token },
          { description: CLOUD_GIST_DESC, public: false, files: { "barq-sync.json": { content: JSON.stringify(cloudSyncPayload()) } } },
          (e3, g3) => {
            if (e3 || !g3 || !g3.id) return cb({ ok: false, msg: "تعذر إنشاء مخزن المزامنة" });
            cloud.gistId = g3.id;
            cloud.lastSync = Date.now();
            cloudSave();
            pushStats();
            cb({ ok: true });
          });
      });
  };
  ensure();
}

function cloudVerifyToken(token, cb) {
  httpReq("GET", "https://api.github.com/user", { Authorization: "Bearer " + token }, null, (e, u) => {
    if (e || !u || !u.login) return cb({ ok: false, msg: "الرمز غير صالح أو تعذر الاتصال بـGitHub" });
    cb({ ok: true, login: u.login, name: u.name || u.login });
  });
}

// استعادة الجلسة السحابية عند الإقلاع
cloudLoad();

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
  const n = name === "history" || name === "bookmarks" || name === "account" ? name : null;
  if (n && panelOpenName === n) {
    closePanel(); // نفس الزر ثانية = إغلاق
    return;
  }
  if (!n) {
    closePanel();
    return;
  }
  panelOpenName = n;
  closeUiPop(); // 1.4.4: فتح اللوحة الجانبية يغلق قائمة المحركات المنسدلة
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
// 1.4.4 — أسماء المتعقبات المحجوبة فعلياً: عدّاد لكل نطاق + سجل آخر المحجوبات
// (الدرع في الشريط يفتح قائمة بالأسماء الحقيقية ليطمئن المستخدم — لا أرقام عمياء)
const blockedByDomain = Object.create(null);
const blockedLog = [];
function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "") || "نطاق غير معروف";
  } catch {
    return "نطاق غير معروف";
  }
}
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

function navState() {
  let url = "";
  // 1.4.1 — الأزرار تتبع مسار برق الخاص (يمسح مع السجل) لا سجل كروم الداخلي
  const canBack = navPos > 0;
  const canFwd = navPos >= 0 && navPos < navStack.length - 1;
  if (view && !view.webContents.isDestroyed()) {
    url = view.webContents.getURL() || "";
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
    account: accountUser, // 1.4.2 — الحساب إن دخل؛ "" = زائر يعمل طبيعياً
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
    closeUiPop(); // 1.4.4: أي تنقل يغلق قائمة المحركات/نافذة المتعقبات المفتوحة
    trackNav(url); // 1.4.1: تحديث مسار رجوع/تقدم (يمسح مع السجل)
    logVisit(url); // 1.4.0: كل تنقل يدخل السجل — نقرة رابط، عنوان، رجوع، تقدم
    // 1.4.5: كروم يحفظ حجم الخط عبر التنقلات — نعيد التطبيق بعد كل تنقل
    try { wc.setZoomLevel(zoomLevel); } catch {}
    pushStats();
  });
  wc.on("did-navigate-in-page", (_e, url) => {
    trackInPageNav(url); // تنقل داخل الصفحة يُدمج في الموضع الحالي للمسار
    logVisit(url); // تنقلات داخل الصفحة (SPA) أيضاً تدخل السجل
    pushStats();
  });
  // أمان: لو فشل تنقل بدأ من زر رجوع/تقدم — لا تعلّق العلامة على التنقل التالي
  wc.on("did-fail-load", (_e, _c, _d, _u, isMainFrame) => {
    if (isMainFrame) navBtnNav = false;
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

// 1.4.4 — إغلاق أي قائمة منبثقة من الشريط: الصفحة ترجع لكامل مساحتها فوراً
function closeUiPop() {
  if (!uiPopH) return;
  uiPopH = 0;
  layout();
  try {
    if (win && !win.isDestroyed()) win.webContents.send("barq:ui-pop-closed");
  } catch {}
}

function layout() {
  if (!win || win.isDestroyed() || !view) return;
  const [w, h] = win.getContentSize();
  // 1.4.4: قائمة المحركات/نافذة المتعقبات المنبثقة من الشريط تُنزح الصفحة أسفلها
  // كي لا تغطيها طبقة العرض — نفس منطق إزاحة اللوحة الجانبية تماماً
  const top = CHROME_H + uiPopH;
  const height = Math.max(0, h - CHROME_H - uiPopH);
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

/* ------------ التحديث التلقائي — من جيت هاب مباشرة (1.4.3) ------------ */
// 1.4.6 — رسالة فورية «يتوفر تحديث جديد» لحظة الاكتشاف + فحص كل 30 دقيقة.
// ينزل التحديث في الخلفية ويُبلّغ المستخدم بلحظة الاكتشاف ولحظة الجهوزية.
// لا شيء يُفرض على المستخدم أبداً.
let autoUpdater = null;
try { autoUpdater = require("electron-updater").autoUpdater; } catch {}

function setupAutoUpdater() {
  if (!autoUpdater || !app.isPackaged) return; // في بيئة التطوير: لا فحص
  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    // 1.4.6 — رسالة فورية عند اكتشاف تحديث: مرة واحدة لكل إصدار، لا إزعاج بالتكرار
    let notifiedAvailable = "";
    autoUpdater.on("update-available", (info) => {
      const v = info && info.version ? String(info.version) : "";
      if (!v || v === notifiedAvailable) return;
      notifiedAvailable = v;
      if (!win || win.isDestroyed()) return;
      dialog
        .showMessageBox(win, {
          type: "info",
          title: "تحديث جديد لبرق",
          message:
            "يتوفر تحديث جديد لبرق" + (v ? " — الإصدار " + v : "") + ".",
          detail: "جارٍ تنزيله الآن في الخلفية… سنخبرك فور جهوزيته للتثبيت.",
          buttons: ["حسناً"],
          defaultId: 0,
          noLink: true,
        })
        .catch(() => {});
    });
    autoUpdater.on("update-downloaded", (info) => {
      if (!win || win.isDestroyed()) return;
      dialog.showMessageBox(win, {
        type: "info",
        title: "توفر تحديث لبرق",
        message: "توفر تحديث جديد" + (info && info.version ? " (" + info.version + ")" : "") + " — نُزّل وجهّز للتثبيت تلقائياً.",
        detail: "أعد تشغيل برق الآن لتثبيت التحديث؟",
        buttons: ["أعد التشغيل الآن", "لاحقاً"],
        defaultId: 0,
        cancelId: 1,
      }).then((r) => {
        if (r.response === 0) {
          try { autoUpdater.quitAndInstall(); } catch {}
        }
      }).catch(() => {});
    });
    autoUpdater.on("error", () => {}); // بلا إنترنت: صمت تام — لا إزعاج
    setTimeout(() => { try { autoUpdater.checkForUpdates(); } catch {} }, 15000);
    // 1.4.6 — كل 30 دقيقة بدل 4 ساعات: التحديث الجديد يصل للجميع أسرع بكثير
    setInterval(() => { try { autoUpdater.checkForUpdates(); } catch {} }, 30 * 60 * 1000);
  } catch {}
}

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
    saveOmniEnabled(omniEnabled); // 1.4.4: ترحيل الافتراضي القديم يُكتب مرة واحدة على القرص
    // 1.4.0 — تفضيلات اللوحة: الجهة + العرض المختار بالسحب
    const panelPrefs = readJson("panel-side.json", {});
    panelSide = panelPrefs.side === "right" ? "right" : "left";
    if (Number.isFinite(panelPrefs.width)) {
      panelW = Math.min(PANEL_MAX, Math.max(PANEL_MIN, panelPrefs.width));
    }

    // حظر المتعقبات قبل أي اتصال
    const ses = session.defaultSession;
    // 1.4.5 — خانة التنزيلات: كل تنزيل من أي صفحة يُتابع هنا
    attachDownloads(ses);
    ses.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, cb) => {
      if (details.resourceType !== "mainFrame" && isBlocked(details.url)) {
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

    // 1.4.5 — اختصارات تكبير الخط تعمل في الشريط والصفحة واللوحة معاً
    bindZoomKeys(win.webContents);
    bindZoomKeys(view.webContents);
    bindZoomKeys(panelView.webContents);

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

    // 1.4.2 — استعادة جلسة الحساب إن كانت مفتوحة — برق يفتح طبيعياً دائماً
    accountRestore();
    // 1.4.3 — التحديث التلقائي: يفحص بلا إزعاج ويثبّت عند الموافقة فقط
    setupAutoUpdater();
    goHome();
    pushStats();
  });
}

// 1.4.3 — مزامنة صامتة عند الإغلاق: ما فعلته اليوم ينتظرك على أي جهاز غداً
app.on("before-quit", () => {
  if (cloudSigned() && cloud.gistId) {
    try {
      httpReq("PATCH", "https://api.github.com/gists/" + cloud.gistId,
        { Authorization: "Bearer " + cloud.token },
        { files: { "barq-sync.json": { content: JSON.stringify(cloudSyncPayload()) } } },
        () => {});
    } catch {}
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

/* ----------------------------------- IPC ---------------------------------- */

/* البحث الشامل (1.3.0): ثلاثة محركات تجيب بالتوازي وكل قسم يظهر لحظة جهوزه */
ipcMain.handle("barq:omni-wiki", (_e, q) => new Promise((res) => searchWiki(String(q || "").slice(0, 200), res)));
ipcMain.handle("barq:omni-ddg",  (_e, q) => new Promise((res) => searchDdg(String(q || "").slice(0, 200), res)));
ipcMain.handle("barq:omni-bing", (_e, q) => new Promise((res) => searchBing(String(q || "").slice(0, 200), res)));
ipcMain.on("barq:omni-open", (_e, q) => omniOpenPage(q));

/* تفعيل/إلغاء محركات البحث الشامل (1.3.1): main يتحقق ويحفظ — الواجهة ترسم فقط */
ipcMain.handle("barq:omni-enabled", () => ({ enabled: omniEnabled.slice() }));
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
ipcMain.on("barq:ui-pop-close", () => closeUiPop());

ipcMain.on("barq:navigate", (_e, raw) => {
  const input = String(raw == null ? "" : raw).trim();
  if (!input) return;
  // عنوان موقع → تنقل مباشر كما هو
  if (/^https?:\/\//i.test(input) ||
      (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(input) && !input.includes(" "))) {
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
}
ipcMain.on("barq:back", () => goNav(-1));   // 1.4.1: يتبع مسار برق — يمسح مع السجل
ipcMain.on("barq:forward", () => goNav(1)); // 1.4.1
ipcMain.on("barq:reload", () => {
  if (view) view.webContents.reload();
});
ipcMain.on("barq:home", () => {
  goHome();
});
ipcMain.handle("barq:state", () => navState());

/* ------------ حساب برق: تسجيل دخول اختياري — IPC (1.4.2) ------------ */
// كل التحقق في main — الواجهة لا ترى ولا تلمس الملف أبداً.
// بلا حساب يعمل برق بشكل طبيعي 100%، والحساب كله محلي على هذا الجهاز.

ipcMain.handle("barq:account-state", () => ({ user: accountUser }));

ipcMain.handle("barq:account-register", (_e, p) => {
  const user = String((p && p.user) || "").trim().replace(/\s+/g, " ").slice(0, 60);
  const pass = String((p && p.pass) || "");
  const confirm = String((p && p.confirm) || "");
  if (accountRec()) return { ok: false, msg: "حساب موجود سلفاً على هذا الجهاز — سجّل الدخول" };
  if (user.length < 2 || user.length > 40) return { ok: false, msg: "الاسم حرفان حتى 40 حرفاً" };
  if (pass.length < 4) return { ok: false, msg: "كلمة المرور قصيرة — 4 أحرف على الأقل" };
  if (pass !== confirm) return { ok: false, msg: "التأكيد لا يطابق كلمة المرور" };
  const salt = crypto.randomBytes(16).toString("hex");
  writeJson("account.json", { user: user, salt: salt, hash: accountHash(salt, pass), signedIn: true });
  accountUser = user;
  pushStats(); // زر الحساب يضيء فوراً
  return { ok: true, user: user };
});

ipcMain.handle("barq:account-login", (_e, p) => {
  const user = String((p && p.user) || "").trim();
  const pass = String((p && p.pass) || "");
  const rec = accountRec();
  if (!rec) return { ok: false, msg: "لا حساب على هذا الجهاز — أنشئ حساباً أولاً" };
  if (rec.user.toLowerCase() !== user.toLowerCase())
    return { ok: false, msg: "الاسم لا يطابق حساب هذا الجهاز" };
  if (accountHash(rec.salt, pass) !== rec.hash)
    return { ok: false, msg: "كلمة المرور غير صحيحة — حاول مجدداً" };
  writeJson("account.json", Object.assign({}, rec, { signedIn: true }));
  accountUser = rec.user;
  pushStats();
  return { ok: true, user: accountUser };
});

ipcMain.handle("barq:account-logout", () => {
  const rec = accountRec();
  if (rec) writeJson("account.json", Object.assign({}, rec, { signedIn: false }));
  accountUser = "";
  pushStats();
  return { ok: true };
});

/* -------- حساب برق السحابي: IPC (1.4.3) -------- */
// الرمز يُحفظ في cloud.json داخل userData — الواجهة لا تراه ولا تلمسه أبداً.
// الدخول اختياري تماماً — بلا دخول يعمل برق محلياً بشكل طبيعي 100%.

ipcMain.handle("barq:cloud-state", () => ({
  signed: cloudSigned(),
  login: cloud.login,
  name: cloud.name,
  lastSync: cloud.lastSync,
}));

ipcMain.handle("barq:cloud-login", (_e, p) => {
  const token = String((p && p.token) || "").trim();
  if (!/^(ghp_|gho_|github_pat_)[A-Za-z0-9_]{20,}$/.test(token))
    return { ok: false, msg: "الرمز لا يشبه رمز وصول GitHub — انسخه كاملاً" };
  return new Promise((res) => {
    cloudVerifyToken(token, (v) => {
      if (!v.ok) return res(v);
      cloud.login = v.login;
      cloud.name = v.name;
      cloud.token = token;
      cloud.gistId = "";
      cloudSave();
      pushStats();
      // أول مزامنة تلقائية بعد الدخول — بياناتك تنتظرك من أي جهاز
      cloudSync(() => {});
      res({ ok: true, name: v.name });
    });
  });
});

ipcMain.handle("barq:cloud-logout", () => {
  cloud = { login: "", name: "", token: "", gistId: "", lastSync: 0 };
  writeJson("cloud.json", cloud);
  pushStats();
  return { ok: true };
});

ipcMain.handle("barq:cloud-sync", () => {
  return new Promise((res) => {
    cloudSync((r) => res(r));
  });
});

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
  enabled: omniEnabled.slice(), // 1.4.4: خانات الاختيار في القائمة المنسدلة
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
  const victim = searchHistory.find((x) => x.t === t); // قبل الحذف — نحتاج رابطه
  const n = searchHistory.length;
  searchHistory = searchHistory.filter((x) => x.t !== t);
  if (searchHistory.length !== n) {
    writeJson("search-history.json", searchHistory);
    if (victim && victim.url) pruneNavUrls(victim.url); // 1.4.1: امسحه من رجوع/تقدم أيضاً
  }
});

ipcMain.on("barq:clear-history", () => {
  searchHistory = [];
  writeJson("search-history.json", searchHistory);
  // 1.4.1 — امسح السجل من زري رجوع وتقدم أيضاً: يبقى في المسار الصفحة الحالية
  // فقط فيُعطَّل الزران فوراً، + إقفال سجل كروم الداخلي احتياطاً
  navBtnNav = false;
  try {
    if (view && !view.webContents.isDestroyed()) {
      const u = view.webContents.getURL() || "";
      navStack = u ? [u] : [];
      navPos = u ? 0 : -1;
      if (typeof view.webContents.clearHistory === "function") view.webContents.clearHistory();
    } else {
      navStack = [];
      navPos = -1;
    }
  } catch {
    navStack = [];
    navPos = -1;
  }
  pushStats();
});

ipcMain.handle("barq:get-bookmarks", () => ({ list: bookmarks }));

ipcMain.handle("barq:star", () => toggleBookmark());

ipcMain.on("barq:remove-bookmark", (_e, url) => {
  removeBookmark(url);
});

/* ------------------- خاصيات كروم: IPC (1.4.5) ------------------- */

/* تكبير/تصغير خط الصفحة — درجات كروم نفسها */
ipcMain.on("barq:zoom", (_e, dir) => {
  if (dir === "reset") applyZoom(0);
  else if (dir === "in") applyZoom(zoomLevel + 0.5);
  else if (dir === "out") applyZoom(zoomLevel - 0.5);
});
ipcMain.handle("barq:zoom-get", () => ({ percent: zoomPercent() }));

/* ترجمة الصفحة عبر غوغل — نفس آلية كروم (translate.goog) بالعربية */
ipcMain.on("barq:translate", () => {
  if (!view || view.webContents.isDestroyed()) return;
  const url = view.webContents.getURL() || "";
  if (!/^https?:\/\//i.test(url) || url.indexOf(".translate.goog/") !== -1) return;
  let u;
  try { u = new URL(url); } catch { return; }
  // عناوين IP وlocalhost لا تُترجم عبر translate.goog
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname) || u.hostname === "localhost") return;
  const host = u.hostname.replace(/-/g, "--").replace(/\./g, "-");
  u.searchParams.set("_x_tr_sl", "auto");
  u.searchParams.set("_x_tr_tl", "ar");
  u.searchParams.set("_x_tr_hl", "ar");
  navigate("https://" + host + ".translate.goog" + u.pathname + u.search);
});

/* خانة التنزيلات مثل كروم: قائمة/فتح/إظهار بالمجلد/إلغاء/مسح */
ipcMain.handle("barq:downloads", () => ({ list: downloadsList() }));
ipcMain.on("barq:download-open", (_e, id) => {
  const d = downloads.find((x) => x.id === id);
  if (d && d.path && d.state === "completed") {
    try { shell.openPath(d.path); } catch {}
  }
});
ipcMain.on("barq:download-show", (_e, id) => {
  const d = downloads.find((x) => x.id === id);
  if (d && d.path && d.state === "completed") {
    try { shell.showItemInFolder(d.path); } catch {}
  }
});
ipcMain.on("barq:download-cancel", (_e, id) => {
  const d = downloads.find((x) => x.id === id);
  if (d && d.item && d.state === "progressing") {
    try { d.item.cancel(); } catch {}
  }
});
ipcMain.on("barq:downloads-clear", () => {
  downloads = downloads.filter((d) => d.state === "progressing");
  pushDownloads();
});

/* قائمة 3 نقاط: مسح الكاش + النسخة الخفيفة HTML + حول برق */
ipcMain.on("barq:clear-cache", () => {
  try { session.defaultSession.clearCache(); } catch {}
});
ipcMain.on("barq:light", () => {
  if (!view || view.webContents.isDestroyed()) return;
  view.webContents
    .loadFile(path.join(__dirname, "chrome", "light.html"))
    .catch(() => {});
});
ipcMain.handle("barq:about", () => ({ version: app.getVersion() }));
