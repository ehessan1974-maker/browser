// اختبار 1.4.4 — قائمة المحركات بخانات اختيار (افتراضي جوجل) + أسماء المتعقبات المحجوبة + زر شامل
"use strict";
const path = require("path");
const fs = require("fs");
const os = require("os");
const Module = require("module");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "barq-144-"));
let pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log("  PASS  " + n); } else { fail++; console.log("  FAIL  " + n); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ملف المحركات القديم = «الكل مفعّل» (إعداد المصنع القديم 1.3.1/1.4.3) — يجب أن يُرحَّل إلى جوجل فقط
const ALL = ["google", "bing", "duckduckgo", "yandex", "wikipedia", "youtube", "x", "maps"];
fs.writeFileSync(path.join(TMP, "omni-engines.json"), JSON.stringify(ALL), "utf8");

const handlers = {}, handles = {};
let reqFn = null; // معالج onBeforeRequest الحقيقي من main
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
function FakeView() {
  const v = { webContents: FakeWC(), _lastBounds: null, setBounds(b) { v._lastBounds = b; } };
  return v;
}
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
    isPackaged: false,
  },
  BrowserWindow: function () { return win; },
  BrowserView: FakeView,
  ipcMain: { on(n, f) { handlers[n] = f; }, handle(n, f) { handles[n] = f; } },
  session: {
    defaultSession: {
      webRequest: {
        onBeforeRequest(_filter, fn) { reqFn = fn; },
      },
    },
  },
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
  console.log("[boot] الإقلاع — ملف قديم «الكل مفعّل» يجب أن يُرحَّل إلى جوجل فقط");
  let bootError = null;
  try { require("/home/z/my-project/desktop/main.js"); readyFn(); await sleep(30); }
  catch (e) { bootError = e; }
  ok(!bootError, "الإقلاع اكتمل بلا استثناء");
  if (bootError) { console.log(bootError.stack); process.exit(1); }

  const view = () => win._views[0];
  const enabledNow = async () => (await handles["barq:omni-enabled"]()).enabled;

  console.log("[engines] الافتراضي الجديد: جوجل فقط + الترحيل");
  let en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "ترحيل ملف «الكل مفعّل» القديم → جوجل فقط (الافتراضي المطلوب)");
  let eg = await handles["barq:engines"]();
  ok(eg.enabled.length === 1 && eg.enabled[0] === "google" && eg.list.length === 8,
     "barq:engines يعيد enabled + القائمة كاملة (8 محركات)");
  const saved = JSON.parse(fs.readFileSync(path.join(TMP, "omni-engines.json"), "utf8"));
  ok(saved.length === 1 && saved[0] === "google", "الافتراضي كُتب على القرص (يُحفظ لكل مرة تفتح برق)");

  console.log("[engines] اختيار المستخدم: تفعيل بينج مع جوجل — يُحفظ ويُطبق");
  handlers["barq:omni-set-enabled"]({}, ["google", "bing"]);
  await sleep(10);
  en = await enabledNow();
  ok(en.length === 2 && en.indexOf("bing") !== -1 && en.indexOf("google") !== -1,
     "omni-set-enabled: جوجل + بينج مفعّلان");
  ok(JSON.parse(fs.readFileSync(path.join(TMP, "omni-engines.json"), "utf8")).length === 2,
     "اختيار المستخدم محفوظ على القرص فوراً");
  handlers["barq:omni-set-enabled"]({}, []); // قائمة فارغة = رفض
  en = await enabledNow();
  ok(en.length === 2, "رفض قائمة فارغة — محرك واحد على الأقل يبقى مفعّلاً");

  console.log("[omni-all] زر شامل: الكل ↔ رجوع للاختيار السابق");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة أولى: صح على كل المحركات الثمانية");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 2 && en.indexOf("bing") !== -1, "ضغطة ثانية: رجوع للاختيار السابق (جوجل + بينج)");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة ثالثة: الكل من جديد");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 2, "ضغطة رابعة: رجوع للاختيار السابق مجدداً (جوجل + بينج)");
  // رفض المعرّفات الغريبة بعد التبديل — ثم لقطة جديدة
  handlers["barq:omni-set-enabled"]({}, ["hack", "google"]);
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رفض المعرّفات الغريبة");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "شامل من اختيار مفرد: الكل");
  // محاكاة «بلا لقطة» (مثل ما بعد إعادة التشغيل والكل مفعل): رجوع → الافتراضي جوجل
  handlers["barq:omni-set-enabled"]({}, ALL);
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رجوع بلا لقطة محفوظة → الافتراضي جوجل");

  console.log("[navigate] البحث من الخانة العليا يتبع خانات الاختيار");
  handlers["barq:navigate"]({}, "https://example.com/page");
  await sleep(8);
  ok(view().webContents.getURL() === "https://example.com/page", "عنوان موقع → تنقل مباشر كما هو");
  handlers["barq:navigate"]({}, "قصيدة شعر عربي");
  await sleep(8);
  ok(view().webContents.getURL().indexOf("google.com/search?q=") !== -1,
     "محرك واحد مفعّل (جوجل) → بحث مباشر في جوجل");
  ok((await handles["barq:state"]()).engine === "google", "جوجل صار هو المحرك الافتراضي تلقائياً");
  handlers["barq:omni-set-enabled"]({}, ["google", "duckduckgo"]);
  handlers["barq:navigate"]({}, "مطبخ لبناني");
  await sleep(8);
  ok(view().webContents.getURL().indexOf("omni.html?q=") !== -1,
     "أكثر من محرك مفعّل → صفحة البحث الشامل بنفس الاستعلام");

  console.log("[trackers] درع المتعقبات: أسماء حقيقية مؤكدة");
  ok(typeof reqFn === "function", "معالج الحجب مسجّل على مستوى الجلسة");
  reqFn({ resourceType: "script", url: "https://www.google-analytics.com/analytics.js" }, (r) => {
    ok(r && r.cancel === true, "طلب google-analytics.com أُلغي فعلاً (cancel:true)");
  });
  reqFn({ resourceType: "script", url: "https://www.google-analytics.com/collect?v=1" }, () => {});
  reqFn({ resourceType: "image", url: "https://px.ads.linkedin.com/pxl?id=9" }, () => {});
  reqFn({ resourceType: "mainFrame", url: "https://www.google-analytics.com/" }, (r) => {
    ok(r && !r.cancel, "mainFrame لا يُحجب أبداً (الصفحات نفسها تُحمّل)");
  });
  reqFn({ resourceType: "script", url: "https://www.wikipedia.org/script.js" }, (r) => {
    ok(r && !r.cancel, "موقع غير مدرج يمرّ طبيعياً");
  });
  const tr = await handles["barq:trackers"]();
  ok(tr.total === 3 && tr.current === 3, "العدّادات: 3 طلبات محجوبة (الصفحة والجلسة)");
  const doms = tr.domains.map((d) => d.d);
  ok(doms.indexOf("google-analytics.com") !== -1 && doms.indexOf("px.ads.linkedin.com") !== -1,
     "الأسماء الحقيقية ظاهرة: google-analytics.com + px.ads.linkedin.com");
  const ga = tr.domains.filter((d) => d.d === "google-analytics.com")[0];
  ok(ga && ga.n === 2, "عدد الطلبات لكل نطاق صحيح (جوجل-أنا ليتك = 2)");
  ok(tr.domains[0].n >= tr.domains[tr.domains.length - 1].n, "القائمة مرتبة تنازلياً بالأكثر حجباً");

  console.log("[ui-pop] القوائم المنبثقة: الصفحة تنزاح ثم ترجع");
  handlers["barq:ui-pop"]({}, 300);
  await sleep(5);
  ok(view()._lastBounds && view()._lastBounds.y === 56 + 300 && view()._lastBounds.height === 840 - 56 - 300,
     "فتح القائمة: الصفحة نزحت للأسفل (y=356) بلا تغطية");
  handlers["barq:ui-pop-close"]();
  await sleep(5);
  ok(view()._lastBounds && view()._lastBounds.y === 56, "الغلق اليدوي: الصفحة رجعت لكامل مساحتها");
  handlers["barq:ui-pop"]({}, 300);
  view().webContents.emit("did-navigate", "https://x.example/");
  await sleep(5);
  ok(view()._lastBounds && view()._lastBounds.y === 56, "أي تنقل يغلق القائمة تلقائياً وترجع الصفحة");
  handlers["barq:ui-pop"]({}, 99999);
  await sleep(5);
  ok(view()._lastBounds && view()._lastBounds.y <= 56 + 420, "القيمة المتطرفة تُقيَّد (سقف 420)");

  console.log("[regress] انحدار سريع — الحالة والسجل والمفضلة");
  const st = await handles["barq:state"]();
  ok(typeof st.blockedTotal === "number" && typeof st.engine === "string", "nav-state سليم بعد كل شيء");
  handlers["barq:navigate"]({}, "https://regress.example/a");
  await sleep(8);
  const hist = await handles["barq:get-history"]();
  ok(hist && Array.isArray(hist.list) && hist.list.length >= 1, "السجل يعمل بعد كل التغييرات");

  console.log("\n=== النتيجة: " + pass + " PASS / " + fail + " FAIL ===");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
