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
};

let focused = false;
let enginesData = null; // { current, enabled:[], list:[] } — main مصدر الحقيقة
let openPop = null;     // null | "engines" | "shield"
let shieldTimer = null;

/* ------------------------- إضاءة أزرار اللوحتين ------------------------- */

// main هو مصدر الحقيقة (يفتح/يغلق/يبدّل) ويخبرنا بحالة الأزرار بعد كل تغيير
window.barq.onPanelButtons(function (s) {
  el.hist.classList.toggle("on", !!(s && s.history));
  el.marks.classList.toggle("on", !!(s && s.bookmarks));
});

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
  closePop();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closePop();
});
window.barq.onUiPopClosed(function () {
  openPop = null;
  el.engineMenu.hidden = true;
  el.shieldPop.hidden = true;
  el.engineBtn.classList.remove("on");
  el.shield.classList.remove("on");
  if (shieldTimer) { clearInterval(shieldTimer); shieldTimer = null; }
});

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
