// برق — منطق شريط الأدوات (يعمل بمعزل تام عبر contextIsolation)
// 1.2.0 — زر نجمة للمفضلة + لوحة سجل البحث
// 1.2.1 — زر مخصص لقائمة المفضلة (بدل النقر المزدوج على النجمة)
// 1.2.2 — اللوحتان جانبيتين بنمط كروم + الزر صاحب اللوحة المفتوحة يبقى مضيئاً
// 1.2.6 — اللوحتان صارتا panel.html (BrowserView مستقل فوق الصفحة):
//         هنا فقط زرا الساعة/المفضلة يرسلان الطلب، والإضاءة تأتي من main
// 1.3.0 — زر البحث الشامل: استعلام واحد ← عدة محركات في نفس اللحظة
"use strict";

const el = {
  back: document.getElementById("back"),
  fwd: document.getElementById("fwd"),
  reload: document.getElementById("reload"),
  home: document.getElementById("home"),
  star: document.getElementById("star"),
  marks: document.getElementById("marks"),
  hist: document.getElementById("hist"),
  form: document.getElementById("go"),
  url: document.getElementById("url"),
  engine: document.getElementById("engine"),
  count: document.getElementById("count"),
  omni: document.getElementById("omni"),
};

let focused = false;

/* ------------------------- إضاءة أزرار اللوحتين ------------------------- */

// main هو مصدر الحقيقة (يفتح/يغلق/يبدّل) ويخبرنا بحالة الأزرار بعد كل تغيير
window.barq.onPanelButtons(function (s) {
  el.hist.classList.toggle("on", !!(s && s.history));
  el.marks.classList.toggle("on", !!(s && s.bookmarks));
});

function render(s) {
  el.back.disabled = !s.canBack;
  el.fwd.disabled = !s.canFwd;
  if (!focused) el.url.value = s.isHome ? "" : s.url;
  el.count.textContent = String(s.blockedCurrent) + " / " + String(s.blockedTotal);
  if (s.engine && el.engine.value && el.engine.value !== s.engine) {
    el.engine.value = s.engine;
  }
  el.star.disabled = !!s.isHome;
  el.star.classList.toggle("star-on", !!s.starred);
  const engName = s.engineName || "دك دك جو";
  el.url.placeholder = s.isHome
    ? "برق • صفحة البداية — ابحث في " + engName + " أو اكتب عنوانًا…"
    : "ابحث في " + engName + " أو اكتب عنوانًا…";
}

window.barq.onNavState(render);
window.barq.state().then(render);

window.barq.engines().then((data) => {
  el.engine.innerHTML = "";
  data.list.forEach(function (x) {
    const o = document.createElement("option");
    o.value = x.id;
    o.textContent = x.name;
    el.engine.appendChild(o);
  });
  el.engine.value = data.current;
});

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  window.barq.navigate(el.url.value);
  el.url.blur();
});
el.engine.addEventListener("change", () => {
  window.barq.setEngine(el.engine.value);
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

// 1.3.0 — البحث الشامل: يرسل نص الخانة (إن وجد) لصفحة كل المحركات
el.omni.addEventListener("click", () => {
  try {
    window.barq.omniOpen(el.url.value || "");
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
