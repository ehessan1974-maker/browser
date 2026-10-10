// برق — منطق شريط الأدوات (يعمل بمعزل تام عبر contextIsolation)
// 1.2.0 — زر نجمة للمفضلة + لوحة سجل البحث
// 1.2.2 — اللوحتان جانبيتين بنمط كروم + الزر صاحب اللوحة المفتوحة يبقى مضيئاً
// 1.2.6 — اللوحتان صارتا panel.html (BrowserView مستقل فوق الصفحة)
// 1.3.0 — زر البحث الشامل: استعلام واحد ← عدة محركات في نفس اللحظة
// 1.4.2 — زر حساب برق (دخول اختياري — بلا حساب يعمل كل شيء طبيعياً)
// 1.4.5 — خاصيات كروم: تنزيلات بقائمة حيّة + قائمة 3 نقاط
// 1.4.7 — ثورة القوائم: كل القوائم المنبثقة صارت BrowserView عائماً مستقلاً (pop.html)
//         يرسم فوق الصفحة بلا أي إزاحة لها، تُفتح بالطلب فقط وتُغلق بالنقر خارجها
//         أو Escape أو أي تنقل، والقائمة النشطة دائماً أعلى طبقة (الشكاوى 2 و3).
//         + زر إضافات كروم (الشكوى 4) + قائمة سجل رجوع/تقدم عند التحويم (الشكوى 7).
"use strict";

const el = {
  back: document.getElementById("back"),
  fwd: document.getElementById("fwd"),
  reload: document.getElementById("reload"),
  home: document.getElementById("home"),
  star: document.getElementById("star"),
  marks: document.getElementById("marks"),
  hist: document.getElementById("hist"),
  accountbtn: document.getElementById("accountbtn"),
  form: document.getElementById("go"),
  url: document.getElementById("url"),
  count: document.getElementById("count"),
  omni: document.getElementById("omni"),
  engineBtn: document.getElementById("engineBtn"),
  engineName: document.getElementById("engineName"),
  shield: document.getElementById("shield"),
  extbtn: document.getElementById("extbtn"),
  dlbtn: document.getElementById("dlbtn"),
  menuBtn: document.getElementById("menuBtn"),
};

let focused = false;
let openType = null;     // القائمة العائمة المفتوحة الآن (نفس تسميات main)
let hoverTimer = null;   // مؤقت فتح قائمة التحويم لرجوع/تقدم
let omniTotal = 0;       // عدد المحركات الكلي — لإضاءة زر «شامل»
let omniOn = [];         // المحركات المفعّلة حالياً

// زر الشريط المسؤول عن كل نوع قائمة — لإضاءته وهو مفتوح (نمط كروم)
const POP_BTN = {
  engines: el.engineBtn,
  shield: el.shield,
  downloads: el.dlbtn,
  menu: el.menuBtn,
  ext: el.extbtn,
};

/* --------------------- فتح/غلق القوائم العائمة (1.4.7) --------------------- */

function clearOn() {
  Object.keys(POP_BTN).forEach(function (t) {
    POP_BTN[t].classList.remove("on");
  });
}

function anchorOf(btn) {
  const r = btn.getBoundingClientRect();
  return {
    x: Math.round(r.left),
    y: Math.round(r.bottom + 2),
    w: Math.round(r.width),
  };
}

function togglePop(type) {
  const btn = POP_BTN[type];
  if (!btn) return;
  if (openType === type) {
    window.barq.popClose();
    return;
  }
  clearOn();
  openType = type;
  btn.classList.add("on");
  const a = anchorOf(btn);
  window.barq.popOpen({
    type: type,
    x: a.x,
    y: a.y,
    w: a.w,
    // RTL: قائمة المحركات تنسدل من حافة الزر اليمنى، والبقية من يسار الشريط
    align: type === "engines" ? "right" : "left",
  });
}

// main يغلق القائمة من أي سبب (نقر خارجي/تنقل/Escape في مكان آخر) — نمسح الإضاءة
window.barq.onPopClosed(function () {
  openType = null;
  clearOn();
  if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
});

// الطلب من داخل القائمة العائمة نفسها (من الإعدادات): بدّل لقائمة أخرى في الشريط
window.barq.onPopRequest(function (d) {
  const t = d && d.type;
  if (!POP_BTN[t]) return;
  openType = null; // main أغلق القائمة السابقة — نفتح الجديدة كطلب جديد
  togglePop(t);
});

// غلق بالضغط على أي مكان في الشريط ليس زر قائمة (أزرار القوائم توقف الانتشار)
document.addEventListener("click", function () {
  if (openType) window.barq.popClose();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") window.barq.popClose();
});

/* --------------------- 1.4.7 — قوائم السجل عند التحويم --------------------- */
// التحويم على رجوع/تقدم (ثلث ثانية) يسدل قائمة الصفحات المحفوظة في ذلك الاتجاه،
// والنقر على أي مدخل يقفز إليه. الخروج من الزر والقائمة معاً يغلقها (main يتكفل بالتأخير).

function hoverArm(type, btn) {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(function () {
    hoverTimer = null;
    if (openType && openType !== type) return; // قائمة ضغط مفتوحة — لا نطارد المؤشر
    const a = anchorOf(btn);
    openType = type;
    window.barq.popOpen({ type: type, x: a.x, y: a.y, w: a.w, align: "left", hover: true });
  }, 350);
}

el.back.addEventListener("mouseenter", function () { hoverArm("hback", el.back); });
el.fwd.addEventListener("mouseenter", function () { hoverArm("hfwd", el.fwd); });
el.back.addEventListener("mouseleave", function () {
  if (openType === "hback") window.barq.hoverLeave();
});
el.fwd.addEventListener("mouseleave", function () {
  if (openType === "hfwd") window.barq.hoverLeave();
});

/* ------------------------------ حالة التنقل ------------------------------ */

function render(s) {
  // 1.4.2 — برق يعمل طبيعياً دائماً — الحساب اختياري: الزر يضيء فقط والجلسة مفتوحة
  el.back.disabled = !s.canBack;
  el.fwd.disabled = !s.canFwd;
  if (!focused) el.url.value = s.isHome ? "" : s.url;
  el.count.textContent = String(s.blockedCurrent) + " / " + String(s.blockedTotal);
  if (s.engineName) el.engineName.textContent = s.engineName;
  el.star.disabled = !!s.isHome;
  el.star.classList.toggle("star-on", !!s.starred);
  el.accountbtn.classList.toggle("on", !!s.account);
  el.accountbtn.title = s.account
    ? "الحساب: " + s.account + " — فتح لوحة الحساب"
    : "حساب برق — تسجيل الدخول (اختياري)";
  const engName = s.engineName || "جوجل"; // 1.4.7 — جوجل هو الافتراضي الرسمي
  el.url.placeholder = s.isHome
    ? "برق • صفحة البداية — ابحث في " + engName + " أو اكتب عنوانًا…"
    : "ابحث في " + engName + " أو اكتب عنوانًا…";
}

window.barq.onNavState(render);
window.barq.state().then(render);

/* --------------- 1.4.7 — إضاءة زر «شامل»: كل المحركات مفعّلة --------------- */

function updateOmniBtn() {
  if (!omniTotal) return;
  const allOn = omniOn.length === omniTotal;
  el.omni.classList.toggle("on", allOn);
  el.omni.title = allOn
    ? "شامل — كل المحركات مفعّلة؛ اضغط للرجوع لاختيارك السابق"
    : "شامل — فعّل كل المحركات بضغطة واحدة";
}

window.barq.engines().then(function (d) {
  omniTotal = (d.list || []).length;
  omniOn = (d.enabled || []).slice();
  updateOmniBtn();
}).catch(function () {});

window.barq.onOmniEnabled(function (d) {
  if (d && d.enabled) {
    omniOn = d.enabled.slice();
    updateOmniBtn();
  }
});

/* --------------------------- بقية أزرار الشريط --------------------------- */

el.omni.addEventListener("click", function () {
  try { window.barq.omniAll(); } catch (e) {}
});

el.engineBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  togglePop("engines");
});
el.shield.addEventListener("click", function (e) {
  e.stopPropagation();
  togglePop("shield");
});
el.extbtn.addEventListener("click", function (e) {
  e.stopPropagation();
  togglePop("ext");
});
el.dlbtn.addEventListener("click", function (e) {
  e.stopPropagation();
  togglePop("downloads");
});
el.menuBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  togglePop("menu");
});

// سلوك كروم: فقاعة التنزيل تُفتح تلقائياً لحظة بدء التنزيل
window.barq.onDownloadStart(function () {
  if (openType !== "downloads") togglePop("downloads");
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  window.barq.popClose(); // البحث يغلق أي قائمة مفتوحة
  window.barq.navigate(el.url.value);
  el.url.blur();
});
el.url.addEventListener("focus", () => {
  focused = true;
  el.url.select();
});
el.url.addEventListener("blur", () => {
  focused = false;
  window.barq.state().then(render);
});

el.back.addEventListener("click", () => window.barq.back());
el.fwd.addEventListener("click", () => window.barq.forward());
el.reload.addEventListener("click", () => window.barq.reload());
el.home.addEventListener("click", () => window.barq.home());

// 1.4.2 — حساب برق: يفتح لوحة الحساب (دخول/إنشاء/خروج — كلها اختيارية)
el.accountbtn.addEventListener("click", () => {
  try {
    window.barq.account();
  } catch (e) {}
});

/* ------------------- النجمة: حفظ/إزالة الصفحة الحالية ------------------- */

el.star.addEventListener("click", () => {
  window.barq.star().then((r) => {
    if (r && r.ok) {
      el.star.classList.toggle("star-on", !!r.starred);
      // تحديث قائمة المفضلة يتكفل به main عبر pushPanelRefresh
    }
  });
});

/* ------------- اللوحتان: السجل والمفضلة (تُعرَضان في panel.html) ------------- */

el.hist.addEventListener("click", () => {
  try {
    window.barq.panel("history");
  } catch (e) {}
});
el.marks.addEventListener("click", () => {
  try {
    window.barq.panel("bookmarks");
  } catch (e) {}
});
