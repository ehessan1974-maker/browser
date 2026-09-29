// برق — متصفح سطح مكتب خفيف بمحرك Chromium
// شريط أدوات عربي RTL + حظر حقيقي للمتعقبات على مستوى الشبكة
"use strict";

const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  shell,
} = require("electron");
const path = require("path");
const { blockedHosts } = require("./trackers");

const HOME_FILE = path.join(__dirname, "chrome", "home.html");
const CHROME_H = 56;
const SEARCH_URL = "https://duckduckgo.com/?q=";

/* ------------------- استقرار الأجهزة القديمة / 32-bit ------------------- */

// تسريع الرسوميات على كروت الشاشة القديمة سبب شائع لتجميد الويندوز — نستخدم المعالج بدلًا منه
app.disableHardwareAcceleration();

// عمليات أقل = ذاكرة أقل: موقع واحد لكل عملية، حد أقصى للعمليات، بلا عزل مواقع (يضاعف الذاكرة)
app.commandLine.appendSwitch("process-per-site");
app.commandLine.appendSwitch("renderer-process-limit", "2");
app.commandLine.appendSwitch("disable-features", "site-per-process,IsolateOrigins");

let win = null;
let view = null;
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
  return {
    url: isHome ? "" : url,
    canBack,
    canFwd,
    blockedCurrent,
    blockedTotal,
    isHome,
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
  return SEARCH_URL + encodeURIComponent(input);
}

function navigate(target) {
  if (!view || !target) return;
  view.webContents.loadURL(target).catch(() => {});
}

function goHome() {
  if (view) view.webContents.loadFile(HOME_FILE).catch(() => {});
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

  // الروابط الخارجية (mailto وغيرها) عبر التطبيق الافتراضي
  wc.on("will-navigate", (e, url) => {
    if (!/^https?:|^file:/i.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

function layout() {
  if (!win || win.isDestroyed() || !view) return;
  const [w, h] = win.getContentSize();
  view.setBounds({
    x: 0,
    y: CHROME_H,
    width: w,
    height: Math.max(0, h - CHROME_H),
  });
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
    layout();
    win.on("resize", layout);
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
  if (url) navigate(url);
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
