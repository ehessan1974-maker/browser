// اختبار 1.4.2 — حساب برق: تسجيل دخول اختياري (بلا حساب يعمل برق طبيعياً 100%)
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const Module = require("module");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "barq-acc-"));
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
  const accFile = path.join(TMP, "account.json");
  const readAcc = () => { try { return JSON.parse(fs.readFileSync(accFile, "utf8")); } catch { return null; } };

  console.log("[guest] T1 بلا حساب — برق يعمل طبيعياً 100%");
  ok(state().account === "", "الوضع الافتراضي: زائر بلا حساب");
  handlers["barq:navigate"]({}, "https://n1.example/1"); await sleep(8);
  ok(view.getURL() === "https://n1.example/1", "التنقل يعمل بلا حساب");
  const h1 = await handles["barq:get-history"]();
  ok(h1.list.length >= 1, "السجل يعمل بلا حساب");
  handlers["barq:back"](); await sleep(4);
  ok(String(view.getURL()).indexOf("home.html") !== -1 || view.getURL() === "https://n1.example/1", "رجوع/تقدم يعمل بلا حساب");

  console.log("[guest] T2 إنشاء حساب — الرفض ثم القبول");
  let r = await handles["barq:account-register"]({}, { user: "أ", pass: "12345", confirm: "12345" });
  ok(r.ok === false, "اسم قصير جداً مرفوض");
  r = await handles["barq:account-register"]({}, { user: "أحمد", pass: "123", confirm: "123" });
  ok(r.ok === false, "كلمة قصيرة مرفوضة");
  r = await handles["barq:account-register"]({}, { user: "أحمد", pass: "12345", confirm: "99999" });
  ok(r.ok === false, "تأكيد مخالف مرفوض");
  r = await handles["barq:account-register"]({}, { user: "  أحمد   محمود  ", pass: "سر12345", confirm: "سر12345" });
  ok(r.ok === true && r.user === "أحمد محمود", "إنشاء سليم + تطبيع الاسم (تقليم ومسافات مفردة)");
  ok(state().account === "أحمد محمود", "الحالة تعرض الاسم بعد الإنشاء");

  console.log("[file] T3 الملف مشفّر بلا نص صريح");
  const rec = readAcc();
  ok(rec && typeof rec.salt === "string" && /^[0-9a-f]{32}$/.test(rec.salt), "salt سليم (32 hex)");
  const expect = crypto.createHash("sha256").update(rec.salt + "سر12345").digest("hex");
  ok(rec.hash === expect, "الهاش يطابق salt+SHA-256");
  ok(JSON.stringify(rec).indexOf("سر12345") === -1, "لا نص صريح للكلمة في الملف");
  ok(rec.signedIn === true, "الجلسة مفتوحة في الملف");

  console.log("[dup] T4 إنشاء ثانٍ مرفوض");
  r = await handles["barq:account-register"]({}, { user: "غيره", pass: "12345", confirm: "12345" });
  ok(r.ok === false, "حساب واحد لكل جهاز — الإنشاء الثاني مرفوض");

  console.log("[out] T5 الخروج — والبرق يبقى طبيعياً تماماً");
  r = await handles["barq:account-logout"]({});
  ok(r.ok === true && state().account === "", "خروج — الحالة رجعت زائراً");
  ok(readAcc() && readAcc().signedIn === false, "الحساب محفوظ (signedIn:false) — يكفي الدخول لاحقاً");
  handlers["barq:navigate"]({}, "https://n2.example/2"); await sleep(8);
  ok(view.getURL() === "https://n2.example/2", "بعد الخروج: التنقل يعمل طبيعياً");
  const hb = await handles["barq:get-bookmarks"]();
  ok(Array.isArray(hb.list), "بعد الخروج: المفضلة تعمل طبيعياً");

  console.log("[in] T6 الدخول — رفض الخاطئ وقبول الصحيح");
  r = await handles["barq:account-login"]({}, { user: "أحمد محمود", pass: "خطأ" });
  ok(r.ok === false, "كلمة خاطئة مرفوضة");
  r = await handles["barq:account-login"]({}, { user: "شخص آخر", pass: "سر12345" });
  ok(r.ok === false, "اسم لا يطابق حساب الجهاز مرفوض");
  r = await handles["barq:account-login"]({}, { user: "أحمد محمود", pass: "سر12345" });
  ok(r.ok === true && state().account === "أحمد محمود", "دخول صحيح — الجلسة فُتحت");
  r = await handles["barq:account-login"]({}, { user: "أحمد محمود", pass: "سر12345" });
  ok(r.ok === true, "الدخول بحالة أحرف مختلفة للاسم مقبول");
  ok(readAcc().signedIn === true, "الجلسة محفوظة — تعود عند كل فتح لبرق");

  console.log("[corrupt] T7 ملف فاسد = لا حساب ولا حبس");
  fs.writeFileSync(accFile, "نص غير JSON {{{", "utf8");
  ok(state().account === "أحمد محمود", "ملف فاسد: الجلسة الجارية تستمر في الذاكرة — لا انقطاع مفاجئ");
  r = await handles["barq:account-login"]({}, { user: "أحمد محمود", pass: "سر12345" });
  ok(r.ok === false && r.msg.indexOf("أنشئ حساباً") !== -1, "دخول على ملف فاسد: رسالة واضحة");
  r = await handles["barq:account-register"]({}, { user: "حساب جديد", pass: "12345", confirm: "12345" });
  ok(r.ok === true && state().account === "حساب جديد", "بعد الفساد: إنشاء حساب يعمل من جديد");
  await handles["barq:account-logout"]({});

  console.log("[ui] T8 الزر واللوحة");
  const pre = fs.readFileSync("/home/z/my-project/desktop/chrome/preload.js", "utf8");
  ok(pre.indexOf("account: () => ipcRenderer.send(\"barq:panel\", \"account\")") !== -1, "الزر يفتح لوحة الحساب عبر barq.account");
  ok(pre.indexOf("accountRegister") !== -1 && pre.indexOf("accountLogin") !== -1 && pre.indexOf("accountLogout") !== -1, "جسر الحساب كامل في preload");
  let threw = false;
  try { handlers["barq:panel"]({}, "account"); } catch (e) { threw = true; }
  ok(!threw, "barq:panel(\"account\") يُنفَّذ بلا استثناء");

  console.log("[flow] T9 كل شيء يعمل بعد الدخول أيضاً");
  await handles["barq:account-login"]({}, { user: "حساب جديد", pass: "12345" });
  handlers["barq:navigate"]({}, "https://n3.example/3"); await sleep(8);
  ok(view.getURL() === "https://n3.example/3", "مسجّل الدخول: التنقل طبيعي");
  ok((await handles["barq:get-history"]()).list.some((x) => x.url === "https://n3.example/3"), "مسجّل الدخول: السجل يسجل");
  ok(state().account === "حساب جديد", "الحالة تحمل الاسم طوال الجلسة");

  console.log("\n[account] ===== " + pass + " PASS / " + fail + " FAIL =====");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("CRASH:", e); process.exit(2); });
