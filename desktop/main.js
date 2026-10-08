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
"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  shell,
} = require("electron");
const fs = require("fs");
const path = require("path");
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
const PANEL_W = 360; // عرض اللوحة المستقلة

let searchHistory = []; // { q, engine, t }
let bookmarks = [];     // { url, title, t }
let panelOpenName = null; // null | "history" | "bookmarks"
let panelSide = "left";   // جهة اللوحة — main هو مصدر الحقيقة الوحيد ويُحفظ على القرص

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
      if (Array.isArray(v)) return v;
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

function addSearchEntry(q, engineId) {
  q = (q || "").trim().slice(0, 300);
  if (!q) return;
  const t = Date.now();
  const last = searchHistory[0];
  if (last && last.q === q && t - last.t < 15000) {
    last.t = t; // نفس البحث الحديث يُحدّث وقته فقط — بلا تكرار
  } else {
    searchHistory.unshift({ q, engine: engineId || currentEngine, t });
    if (searchHistory.length > SEARCH_HISTORY_MAX) {
      searchHistory.length = SEARCH_HISTORY_MAX;
    }
  }
  writeJson("search-history.json", searchHistory);
  pushPanelRefresh("history"); // 1.2.6: لو السجل مفتوح يتحدث فوراً
}

function logSearchIfAny(raw, url) {
  const engId = engineIdFromUrl(url);
  if (!engId) return;
  const eng = SEARCH_ENGINES[engId];
  let q = "";
  try {
    q = decodeURIComponent(url.slice(eng.url.length));
  } catch {
    q = "";
  }
  if (!q && typeof raw === "string") q = raw.trim();
  addSearchEntry(q, engId);
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
  return Math.min(PANEL_W, Math.max(0, size[0]));
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
      addSearchEntry(q, SEARCH_ENGINES[id] ? id : null);
      navigate(eng.url + encodeURIComponent(q));
    }
  } catch {}
}

/* ---------------------------------- setup --------------------------------- */

function attachViewEvents() {
  const wc = view.webContents;

  wc.on("did-navigate", () => {
    blockedCurrent = 0;
    pushStats();
  });
  wc.on("did-navigate-in-page", pushStats);
  wc.on("did-finish-load", pushStats);
  // عنوان الصفحة يحدّث النجمة والحالة (النجمة تُسجل بعنوان حقيقي)
  wc.on("page-title-updated", pushStats);

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
    searchHistory = readJson("search-history.json", []);
    bookmarks = readJson("bookmarks.json", []);
    panelSide = readJson("panel-side.json", {}).side === "right" ? "right" : "left"; // 1.2.6

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
      webPreferences: { contextIsolation: true, sandbox: true },
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

ipcMain.on("barq:navigate", (_e, raw) => {
  const url = normalizeInput(raw);
  if (url) {
    logSearchIfAny(typeof raw === "string" ? raw : "", url);
    navigate(url);
  }
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

// 1.2.6 — جهة اللوحة: main هو مصدر الحقيقة الوحيد — يحفظها ويخبر اللوحة ويحرّك حدودها
ipcMain.on("barq:panel-side", (_e, side) => {
  panelSide = side === "right" ? "right" : "left";
  writeJson("panel-side.json", { side: panelSide });
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
