// برق — منطق شريط الأدوات (يعمل بمعزل تام عبر contextIsolation)
// 1.2.0 — زر نجمة للمفضلة + لوحة سجل البحث
// 1.2.1 — زر مخصص لقائمة المفضلة (بدل النقر المزدوج على النجمة)
// 1.2.2 — اللوحتان جانبيتين بنمط كروم + الزر صاحب اللوحة المفتوحة يبقى مضيئاً
// 1.2.6 — اللوحتان صارتا panel.html (BrowserView مستقل فوق الصفحة):
//         هنا فقط زرا الساعة/المفضلة يرسلان الطلب، والإضاءة تأتي من main
// 1.3.0 — زر البحث الشامل: استعلام واحد ← عدة محركات في نفس اللحظة
// 1.4.2 — زر حساب برق (دخول اختياري — بلا حساب يعمل كل شيء طبيعياً)
// 1.4.4 — قائمة المحركات بخانة اختيار لكل محرك (محفوظة، الافتراضي جوجل) +
//         درع يعرض أسماء المتعقبات المحجوبة فعلياً + زر «شامل» يبدّل الكل/السابق
// 1.4.5 — خاصيات كروم: زر تنزيلات بقائمة تقدم حي (تُفتح تلقائياً عند بدء
//         التنزيل مثل كروم) + قائمة 3 نقاط (تكبير/تصغير الخط، ترجمة غوغل،
//         التنزيلات، النسخة الخفيفة HTML، مسح الكاش، حول برق)
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
  // 1.4.4 — قائمة المحركات + درع المتعقبات
  engineBtn: document.getElementById("engineBtn"),
  engineName: document.getElementById("engineName"),
  engineMenu: document.getElementById("engineMenu"),
  shield: document.getElementById("shield"),
  shieldPop: document.getElementById("shieldPop"),
  shieldSub: document.getElementById("shieldSub"),
  shieldList: document.getElementById("shieldList"),
  // 1.4.5 — التنزيلات + قائمة 3 نقاط
  dlbtn: document.getElementById("dlbtn"),
  dlPop: document.getElementById("dlPop"),
  dlList: document.getElementById("dlList"),
  dlClear: document.getElementById("dlClear"),
  menuBtn: document.getElementById("menuBtn"),
  menuPop: document.getElementById("menuPop"),
  zoomPct: document.getElementById("zoomPct"),
  zoomIn: document.getElementById("zoomIn"),
  zoomOut: document.getElementById("zoomOut"),
  zoomReset: document.getElementById("zoomReset"),
  translateRow: document.getElementById("translateRow"),
  dlRow: document.getElementById("dlRow"),
  lightRow: document.getElementById("lightRow"),
  cacheRow: document.getElementById("cacheRow"),
  aboutRow: document.getElementById("aboutRow"),
};

let focused = false;
let enginesData = null; // { current, enabled:[], list:[] } — main مصدر الحقيقة
let openPop = null;     // null | "engines" | "shield" | "downloads" | "menu"
let shieldTimer = null;
let dlData = [];        // آخر قائمة تنزيلات من main — تُرسم عند فتح القائمة وكل تحديث
let lastState = null;   // آخر حالة تنقل — لتعطيل زر الترجمة حين لا تنطبق

/* ------------------------- إضاءة أزرار اللوحتين ------------------------- */

// main هو مصدر الحقيقة (يفتح/يغلق/يبدّل) ويخبرنا بحالة الأزرار بعد كل تغيير
window.barq.onPanelButtons(function (s) {
  el.hist.classList.toggle("on", !!(s && s.history));
  el.marks.classList.toggle("on", !!(s && s.bookmarks));
});

function render(s) {
  // 1.4.2 — برق يعمل طبيعياً دائماً — الحساب اختياري: الزر يضيء فقط والجلسة مفتوحة
  lastState = s;
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
  // 1.4.5 — الترجمة عبر غوغل تنطبق على صفحات الويب فقط (ليس صفحات برق الداخلية ولا translate.goog نفسها)
  const canTranslate =
    !!s.url && /^https?:\/\//i.test(s.url) && s.url.indexOf(".translate.goog/") === -1;
  el.translateRow.disabled = !canTranslate;
  el.translateRow.title = canTranslate
    ? "ترجمة الصفحة الحالية إلى العربية عبر غوغل"
    : "افتح صفحة ويب أولاً ثم ترجمها";
  const engName = s.engineName || "دك دك جو";
  el.url.placeholder = s.isHome
    ? "برق • صفحة البداية — ابحث في " + engName + " أو اكتب عنوانًا…"
    : "ابحث في " + engName + " أو اكتب عنوانًا…";
}

window.barq.onNavState(render);
window.barq.state().then(render);

/* -------------- 1.4.4: قائمة محركات البحث — خانة اختيار لكل محرك -------------- */
// الصح أمام المحرك = يشارك في البحث (ومحرك واحد مفعّل = البحث المباشر فيه)
// والنقر على الاسم نفسه = يجعله المحرك الافتراضي. الاختيار محفوظ في main للأبد.

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function engRow(x) {
  const row = document.createElement("label");
  row.className = "eng-row";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = enginesData.enabled.indexOf(x.id) !== -1;
  cb.setAttribute("aria-label", "تفعيل " + x.name + " في البحث");
  cb.addEventListener("change", function () {
    const ids = [];
    enginesData.list.forEach(function (e2) {
      const on = e2.id === x.id ? cb.checked : enginesData.enabled.indexOf(e2.id) !== -1;
      if (on) ids.push(e2.id);
    });
    if (!ids.length) {
      // محرك واحد على الأقل يبقى مفعّلاً — نرجع الصح مع اهتزاز توضيحي
      cb.checked = true;
      row.classList.remove("shake");
      void row.offsetWidth;
      row.classList.add("shake");
      return;
    }
    enginesData.enabled = ids;
    try { window.barq.omniSetEnabled(ids); } catch (e) {}
    updateOmniBtn();
  });
  const nm = document.createElement("span");
  nm.className = "eng-name";
  nm.textContent = x.name;
  nm.title = "اجعله محرك البحث الافتراضي";
  nm.addEventListener("click", function (ev) {
    ev.preventDefault();
    try { window.barq.setEngine(x.id); } catch (e) {}
    enginesData.current = x.id;
    drawEngines();
  });
  const badge = document.createElement("span");
  badge.className = "eng-badge";
  row.appendChild(cb);
  row.appendChild(nm);
  row.appendChild(badge);
  return row;
}

function drawEngines() {
  if (!enginesData) return;
  el.engineMenu.innerHTML = "";
  enginesData.list.forEach(function (x) {
    const row = engRow(x);
    if (x.id === enginesData.current) row.classList.add("cur");
    el.engineMenu.appendChild(row);
  });
}

window.barq.engines().then(function (d) {
  enginesData = {
    current: d.current,
    enabled: d.enabled && d.enabled.length ? d.enabled.slice() : [d.current],
    list: d.list,
  };
  drawEngines();
  updateOmniBtn();
});

// تغيير من أي مكان آخر (زر شامل/لوحة أخرى) يحدّث القائمة لحظياً
window.barq.onOmniEnabled(function (d) {
  if (!enginesData || !d || !d.enabled || !d.enabled.length) return;
  enginesData.enabled = d.enabled.slice();
  drawEngines();
  updateOmniBtn();
});

/* -------- 1.4.4: فتح/غلق القوائم المنبثقة — الصفحة تنزاح تحتها في main -------- */

function closePop() {
  if (!openPop) return;
  openPop = null;
  el.engineMenu.hidden = true;
  el.shieldPop.hidden = true;
  el.engineBtn.classList.remove("on");
  el.shield.classList.remove("on");
  if (shieldTimer) { clearInterval(shieldTimer); shieldTimer = null; }
  try { window.barq.uiPopClose(); } catch (e) {}
}

function menuHeight() {
  const rows = enginesData ? enginesData.list.length : 8;
  return Math.min(400, 20 + rows * 34);
}

function toggleEngines() {
  if (openPop === "engines") { closePop(); return; }
  closePop();
  openPop = "engines";
  el.engineMenu.hidden = false;
  el.engineBtn.classList.add("on");
  drawEngines();
  try { window.barq.uiPop(menuHeight()); } catch (e) {}
}

el.engineBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  toggleEngines();
});

/* ---------------- 1.4.4: زر «شامل» — الكل ↔ رجوع للاختيار السابق ---------------- */

function updateOmniBtn() {
  if (!enginesData) return;
  const on = enginesData.enabled.length === enginesData.list.length;
  el.omni.classList.toggle("on", on);
  el.omni.title = on
    ? "شامل — كل المحركات مفعّلة؛ اضغط للرجوع لاختيارك السابق"
    : "شامل — فعّل كل المحركات بضغطة واحدة";
}

el.omni.addEventListener("click", function () {
  try { window.barq.omniAll(); } catch (e) {}
});

/* ------------------ 1.4.4: درع المتعقبات — الأسماء الحقيقية ------------------ */

function drawShield(t) {
  el.shieldSub.textContent =
    "هذه الصفحة: " + t.current + " — الجلسة كلها: " + t.total;
  if (!t.domains.length) {
    el.shieldList.innerHTML =
      '<div class="trk-empty">ما في شي محجوب بعد — تنقّل لمواقع فيها إعلانات ومتعقبات وسترى أسماءها هنا بالضبط</div>';
    return;
  }
  let html = "";
  t.domains.forEach(function (d) {
    html += '<div class="trk-row"><span class="trk-d">' + esc(d.d) +
      '</span><span class="trk-n">' + d.n + "</span></div>";
  });
  el.shieldList.innerHTML = html;
}

function toggleShield() {
  if (openPop === "shield") { closePop(); return; }
  closePop();
  openPop = "shield";
  el.shieldPop.hidden = false;
  el.shield.classList.add("on");
  const refresh = function () {
    window.barq.trackers().then(function (t) {
      if (openPop !== "shield") return;
      drawShield(t);
      const rows = Math.min(t.domains.length, 8);
      const h = rows ? 150 + rows * 26 : 150;
      try { window.barq.uiPop(Math.min(400, h)); } catch (e) {}
    });
  };
  refresh();
  shieldTimer = setInterval(refresh, 2000);
}

el.shield.addEventListener("click", function (e) {
  e.stopPropagation();
  toggleShield();
});

// غلق بالضغط خارج القائمة أو Escape — وmain يغلقها كذلك عند أي تنقل
document.addEventListener("click", function (e) {
  if (!openPop) return;
  if (el.engineMenu.contains(e.target) || el.shieldPop.contains(e.target)) return;
  if (el.dlPop.contains(e.target) || el.menuPop.contains(e.target)) return;
  closePop();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closePop();
});
window.barq.onUiPopClosed(function () {
  openPop = null;
  el.engineMenu.hidden = true;
  el.shieldPop.hidden = true;
  el.dlPop.hidden = true;
  el.menuPop.hidden = true;
  el.engineBtn.classList.remove("on");
  el.shield.classList.remove("on");
  el.dlbtn.classList.remove("on");
  el.menuBtn.classList.remove("on");
  if (shieldTimer) { clearInterval(shieldTimer); shieldTimer = null; }
});

/* ---------------- 1.4.5: خانة التنزيلات مثل كروم ---------------- */
// قائمة منبثقة بالتقدم الحي، تُفتح تلقائياً عند بدء أي تنزيل (سلوك كروم)

function fmtBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
  return (n / 1073741824).toFixed(2) + " GB";
}

function dlStateLabel(d) {
  if (d.state === "completed") return "اكتمل";
  if (d.state === "cancelled") return "أُلغي";
  if (d.state === "interrupted") return "فشل";
  const pct = d.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0;
  const sz = d.total ? fmtBytes(d.received) + " من " + fmtBytes(d.total) : fmtBytes(d.received);
  return pct + "% — " + sz;
}

function dlBusy() {
  var busy = false;
  for (var k = 0; k < dlData.length; k++) {
    if (dlData[k].state === "progressing") { busy = true; break; }
  }
  el.dlbtn.classList.toggle("busy", busy);
}

function drawDownloads() {
  if (openPop !== "downloads") return;
  dlBusy();
  if (!dlData.length) {
    el.dlList.innerHTML =
      '<div class="dempty">لا تنزيلات بعد — أي ملف تنزّله من أي صفحة سيظهر هنا بتقدمه الحي مثل كروم تماماً</div>';
    try { window.barq.uiPop(150); } catch (e) {}
    return;
  }
  let html = "";
  for (var i = 0; i < dlData.length; i++) {
    var d = dlData[i];
    var pct = d.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0;
    var prog = d.state === "progressing"
      ? '<div class="dbar"><i style="width:' + pct + '%"></i></div>' : "";
    var acts = "";
    if (d.state === "completed") {
      acts = '<div class="drow-a">' +
        '<button type="button" data-do="open" data-id="' + d.id + '">فتح</button>' +
        '<button type="button" data-do="show" data-id="' + d.id + '">إظهار بالمجلد</button>' +
        "</div>";
    } else if (d.state === "progressing") {
      acts = '<div class="drow-a">' +
        '<button type="button" data-do="cancel" data-id="' + d.id + '">إلغاء</button>' +
        "</div>";
    }
    html += '<div class="drow">' +
      '<div class="drow-t"><span class="drow-f">' + esc(d.file) +
      '</span><span class="drow-s">' + esc(dlStateLabel(d)) + "</span></div>" +
      prog + acts + "</div>";
  }
  el.dlList.innerHTML = html;
  var rows = Math.min(dlData.length, 5);
  try { window.barq.uiPop(Math.min(400, 110 + rows * 78)); } catch (e) {}
}

function toggleDownloads() {
  if (openPop === "downloads") { closePop(); return; }
  closePop();
  openPop = "downloads";
  el.dlPop.hidden = false;
  el.dlbtn.classList.add("on");
  window.barq.downloads().then(function (r) {
    dlData = (r && r.list) || [];
    drawDownloads();
  }).catch(function () { drawDownloads(); });
  drawDownloads();
}

el.dlbtn.addEventListener("click", function (e) {
  e.stopPropagation();
  toggleDownloads();
});
el.dlClear.addEventListener("click", function () {
  try { window.barq.downloadsClear(); } catch (e) {}
});

// أزرار عناصر التنزيل (فتح/إظهار/إلغاء) — تفويض عبر القائمة
el.dlList.addEventListener("click", function (e) {
  var b = e.target && e.target.closest ? e.target.closest("button[data-do]") : null;
  if (!b) return;
  var id = Number(b.getAttribute("data-id"));
  var doWhat = b.getAttribute("data-do");
  if (doWhat === "open") window.barq.downloadOpen(id);
  else if (doWhat === "show") window.barq.downloadShow(id);
  else if (doWhat === "cancel") window.barq.downloadCancel(id);
});

// تحديث حي من main — القائمة تتحدث فوراً أثناء التنزيل
window.barq.onDownloads(function (d) {
  dlData = (d && d.list) || [];
  dlBusy();
  drawDownloads();
});
// سلوك كروم: الفقاعة تُفتح تلقائياً لحظة بدء التنزيل
window.barq.onDownloadStart(function () {
  if (openPop !== "downloads") toggleDownloads();
});

/* ---------------- 1.4.5: قائمة 3 نقاط للإعدادات ---------------- */

function toggleMenu() {
  if (openPop === "menu") { closePop(); return; }
  closePop();
  openPop = "menu";
  el.menuPop.hidden = false;
  el.menuBtn.classList.add("on");
  try { window.barq.uiPop(390); } catch (e) {}
}

el.menuBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  toggleMenu();
});

el.zoomIn.addEventListener("click", function () {
  try { window.barq.zoom("in"); } catch (e) {}
});
el.zoomOut.addEventListener("click", function () {
  try { window.barq.zoom("out"); } catch (e) {}
});
el.zoomReset.addEventListener("click", function () {
  try { window.barq.zoom("reset"); } catch (e) {}
});
el.translateRow.addEventListener("click", function () {
  closePop();
  try { window.barq.translate(); } catch (e) {}
});
el.dlRow.addEventListener("click", function () {
  toggleDownloads();
});
el.lightRow.addEventListener("click", function () {
  closePop();
  try { window.barq.light(); } catch (e) {}
});
el.cacheRow.addEventListener("click", function () {
  try { window.barq.clearCache(); } catch (e) {}
  el.cacheRow.querySelector(".mi").textContent = "✅";
  setTimeout(function () { el.cacheRow.querySelector(".mi").textContent = "🧹"; }, 1200);
});

// نسبة الحجم الحية داخل القائمة
window.barq.onZoomChanged(function (d) {
  if (d && d.percent) el.zoomPct.textContent = d.percent + "%";
});
window.barq.zoomGet().then(function (d) {
  if (d && d.percent) el.zoomPct.textContent = d.percent + "%";
}).catch(function () {});

// سطر «حول برق» — رقم الإصدار من main نفسه
window.barq.about().then(function (d) {
  if (d && d.version) el.aboutRow.textContent = "برق v" + d.version;
}).catch(function () {});

/* ------------------------------ بقية الأزرار ------------------------------ */

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  closePop(); // 1.4.4: البحث يغلق أي قائمة مفتوحة
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
