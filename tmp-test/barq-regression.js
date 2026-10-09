// اختبار انحدار 1.4.1 بعد تعديلات 1.4.2 — مسار رجوع/تقدم يمسح مع السجل
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const Module = require("module");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "barq-reg-"));
let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log("  PASS  " + n); } else { fail++; console.log("  FAIL  " + n); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const handlers = {}, handles = {};
function FakeWC() {
  const ev = {};
  const wc = {
    _url: "about:blank",
    on(n, f) { (ev[n] = ev[n] || []).push(f); return wc; },
    emit(n, ...a) { (ev[n] || []).forEach((f) => f({ preventDefault() {}, defaultPrevented: false }, ...a)); },
    isDestroyed: () => false,
    loadURL(u) { wc._url = u; wc.emit("did-navigate", u); return Promise.resolve(); },
    loadFile(p, o) {
      let q = "";
      if (o && o.query) q = "?" + Object.keys(o.query).map((k) => k + "=" + encodeURIComponent(o.query[k])).join("&");
      wc._url = "file://" + String(p).replace(/\\/g, "/") + q;
      wc.emit("did-navigate", wc._url);
      return Promise.resolve();
    },
    getURL: () => wc._url, getTitle: () => "T",
    reload() { wc.emit("did-navigate", wc._url); },
    clearHistory() {}, setWindowOpenHandler() {}, send() {},
    session: { setPermissionRequestHandler() {} },
  };
  return wc;
}
function FakeView() { return { webContents: FakeWC(), setBounds() {} }; }
let readyFn = null;
const win = {
  _views: [], webContents: FakeWC(),
  addBrowserView(v) { win._views.push(v); },
  removeBrowserView(v) { win._views = win._views.filter((x) => x !== v); },
  getBrowserViews() { return win._views; },
  setBounds() {}, getContentSize: () => [1280, 840],
  getContentBounds: () => ({ x: 0, y: 0, width: 1280, height: 840 }),
  isDestroyed: () => false, isMinimized: () => false, restore() {}, focus() {},
  on() {}, loadFile() { return Promise.resolve(); },
};
const electronStub = {
  app: {
    getPath: (k) => (k === "exe" ? path.join(TMP, "Barq.exe") : TMP),
    setPath() {}, disableHardwareAcceleration() {},
    commandLine: { appendSwitch() {} },
    requestSingleInstanceLock: () => true, on() {},
    whenReady: () => ({ then: (f) => { readyFn = f; } }),
    quit() {},
  },
  BrowserWindow: function () { return win; },
  BrowserView: FakeView,
  ipcMain: { on(n, f) { handlers[n] = f; }, handle(n, f) { handles[n] = f; } },
  session: { defaultSession: { webRequest: { onBeforeRequest() {} } } },
  shell: { openExternal() {} },
  screen: { getCursorScreenPoint: () => ({ x: 0, y: 0 }) },
};
const origLoad = Module._load;
Module._load = function (request) {
  if (request === "electron") return electronStub;
  return origLoad.apply(this, arguments);
};

(async function main() {
  require("/home/z/my-project/desktop/main.js");
  readyFn();
  const view = win._views[0].webContents;
  const state = () => handles["barq:state"]();

  view.emit("did-navigate", "https://a.example/1"); await sleep(8);
  view.emit("did-navigate", "https://b.example/2"); await sleep(8);
  view.emit("did-navigate", "https://c.example/3"); await sleep(8);
  ok(state().canBack === true && state().canFwd === false, "A,B,C: رجوع متاح وتقدم لا");
  handlers["barq:back"]();
  ok(view.getURL() === "https://b.example/2", "رجوع -> B");
  handlers["barq:forward"]();
  ok(view.getURL() === "https://c.example/3", "تقدم -> C");

  handlers["barq:clear-history"]();
  ok(state().canBack === false && state().canFwd === false, "مسح الكل: الزران معطّلان فوراً");

  handlers["barq:navigate"]({}, "https://e1.example/1"); await sleep(8);
  handlers["barq:navigate"]({}, "https://e2.example/2"); await sleep(8);
  handlers["barq:navigate"]({}, "https://e3.example/3"); await sleep(8);
  const list = await handles["barq:get-history"]();
  const tE2 = list.list.find((x) => x.url === "https://e2.example/2").t;
  handlers["barq:remove-search"]({}, tE2);
  handlers["barq:back"]();
  ok(view.getURL() === "https://e1.example/1", "حذف e2: الرجوع يقفز فوقه -> e1");
  handlers["barq:back"]();
  ok(view.getURL() === "https://c.example/3", "رجوع آخر -> مرساة المسح C (المعروضة لحظة المسح تبقى)");

  view.emit("did-navigate", "https://r.example/x");
  view.emit("did-navigate", "https://www.r.example/y");
  handlers["barq:back"]();
  ok(view.getURL() === "https://c.example/3", "إعادة التوجيه السريعة استُبدلت: رجوع واحد من y يقفز فوق x إلى المرساة");

  handlers["barq:navigate"]({}, "https://g.example/1"); await sleep(8);
  view.emit("did-navigate-in-page", "https://g.example/1#part");
  handlers["barq:back"]();
  ok(view.getURL() === "https://c.example/3", "SPA/مرساة اندمجت: رجوع واحد يخرج من الصفحة كلها إلى المرساة");

  console.log("\n[regression] ===== " + pass + " PASS / " + fail + " FAIL =====");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("CRASH:", e); process.exit(2); });
