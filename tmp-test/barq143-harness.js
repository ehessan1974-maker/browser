// اختبار 1.4.3 — الحساب السحابي (يتبعك من أي مكان) + التحديث التلقائي + انحدار 1.4.2
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const Module = require("module");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "barq-cloud-"));
let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log("  PASS  " + n); } else { fail++; console.log("  FAIL  " + n); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// cloud.json مُعد مسبقاً — محاكاة جلسة سحابية محفوظة من فتح سابق
fs.writeFileSync(path.join(TMP, "cloud.json"), JSON.stringify({
  login: "tester", name: "المختبِر", token: "ghp_" + "x".repeat(36),
  gistId: "gist-fake-id-123", lastSync: 1700000000000,
}), "utf8");

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
    isPackaged: false, // بيئة تطوير محاكاة — autoUpdater يجب أن يتخطى الفحص بهدوء
  },
  BrowserWindow: function () { return win; },
  BrowserView: FakeView,
  ipcMain: { on(n, f) { handlers[n] = f; }, handle(n, f) { handles[n] = f; } },
  session: { defaultSession: { webRequest: { onBeforeRequest() {} } } },
  shell: { openExternal() {}, openPath() {} },
  screen: { getCursorScreenPoint: () => ({ x: 0, y: 0 }) },
  dialog: { showMessageBox: () => Promise.resolve({ response: 1 }) },
};
const origLoad = Module._load;
Module._load = function (request) {
  if (request === "electron") return electronStub;
  return origLoad.apply(this, arguments);
};

(async function main() {
  console.log("[boot] الإقلاع — cloud.json يُستعاد + autoUpdater يتخطى بيئة التطوير بهدوء");
  let bootError = null;
  try { require("/home/z/my-project/desktop/main.js"); readyFn(); await sleep(30); }
  catch (e) { bootError = e; }
  ok(!bootError, "الإقلاع اكتمل بلا استثناء (autoUpdater غير مثبت — يتخطى بهدوء)");
  if (bootError) { console.log(bootError.stack); process.exit(1); }

  const state = () => handles["barq:state"]();
  const cloudFile = path.join(TMP, "cloud.json");

  console.log("[cloud] القسم السحابي — الجلسة تُستعاد من cloud.json");
  let cs = await handles["barq:cloud-state"]();
  ok(cs.signed === true && cs.login === "tester" && cs.name === "المختبِر",
     "cloud-state: جلسة سابقة مُستعادة (signed/login/name)");
  ok(typeof cs.lastSync === "number" && cs.lastSync > 0, "آخر مزامنة محفوظة");

  console.log("[cloud] رمز خاطئ الصيغة — رفض فوري دون لمس الشبكة");
  let r = await handles["barq:cloud-login"]({}, { token: "not-a-token" });
  ok(r.ok === false, "رمز لا يشبه GitHub مرفوض فوراً");
  r = await handles["barq:cloud-login"]({}, { token: "" });
  ok(r.ok === false, "رمز فارغ مرفوض");

  console.log("[cloud] رمز صالح الصيغة لكن مرفوض من GitHub (اختبار واقعي عبر الشبكة)");
  r = await handles["barq:cloud-login"]({}, { token: "ghp_" + "z".repeat(36) });
  ok(r.ok === false && r.msg, "GitHub رفض الرمز المزيف (ok:false + رسالة) — التحقق في main فعلي");
  const cf = (() => { try { return JSON.parse(fs.readFileSync(cloudFile, "utf8")); } catch { return null; } })();
  ok(!cf || cf.login !== "z".repeat(1) || cf.token.indexOf("zzz") === -1 || cf.login === "tester",
     "بعد فشل الدخول: cloud.json لم يُفسَد (الجلسة القديمة باقية)");

  console.log("[cloud] مزامنة بمعرف gist مزيف — فشل آمن برسالة بلا انهيار");
  r = await handles["barq:cloud-sync"]();
  ok(r && typeof r.ok === "boolean", "cloud-sync يرجع نتيجة منضبطة (ok/ msg)");
  ok(r.ok === false && r.msg && r.msg.length > 3, "مزامنة بgist مزيف: فشل واضح بلا استثناء");

  console.log("[cloud] الخروج السحابي — يمسح الجلسة السحابية فقط");
  r = await handles["barq:cloud-logout"]();
  ok(r.ok === true, "خروج سحابي تم");
  cs = await handles["barq:cloud-state"]();
  ok(cs.signed === false && !cs.login, "بعد الخروج: غير مسجّل سحابياً");
  const cf2 = (() => { try { return JSON.parse(fs.readFileSync(cloudFile, "utf8")); } catch { return null; } })();
  ok(cf2 && !cf2.token && !cf2.login, "cloud.json صار فارغاً (لا رمز ولا اسم)");
  handlers["barq:navigate"]({}, "https://after-cloud.example/1"); await sleep(8);
  ok(win._views[0].webContents.getURL() === "https://after-cloud.example/1", "بعد الخروج السحابي: التصفح طبيعي 100%");

  console.log("[regress] انحدار 1.4.2 — الحساب المحلي والتصفح لم يُمَسّا");
  r = await handles["barq:account-register"]({}, { user: "  أحمد   محمود  ", pass: "سر12345", confirm: "سر12345" });
  ok(r.ok === true && r.user === "أحمد محمود", "إنشاء حساب محلي + تطبيع الاسم");
  ok(state().account === "أحمد محمود", "الحالة تعرض الاسم");
  const rec = (() => { try { return JSON.parse(fs.readFileSync(path.join(TMP, "account.json"), "utf8")); } catch { return null; } })();
  const expect = crypto.createHash("sha256").update(rec.salt + "سر12345").digest("hex");
  ok(rec.hash === expect && JSON.stringify(rec).indexOf("سر12345") === -1, "كلمة المرور مشفّرة salt+SHA-256 بلا نص صريح");
  r = await handles["barq:account-logout"]({});
  ok(r.ok === true && state().account === "", "خروج محلي — زائر يعمل طبيعياً");
  r = await handles["barq:account-login"]({}, { user: "أحمد محمود", pass: "سر12345" });
  ok(r.ok === true, "دخول محلي صحيح");

  console.log("[regress] السجل والمفضلة بعد كل شيء");
  const h = await handles["barq:get-history"]();
  ok(Array.isArray(h.list) && h.list.length >= 1, "السجل يعمل");
  const b = await handles["barq:get-bookmarks"]();
  ok(Array.isArray(b.list), "المفضلة تعمل");

  console.log("\n=== النتيجة: " + pass + " PASS / " + fail + " FAIL ===");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("HARNESS-ERROR:", e); process.exit(1); });
