// برق — منطق اللوحة المستقلة (1.2.6)
// اللوحة صارت BrowserView مستقلة ترسم فوق صفحة الويب دائماً (آخر من يُرفق = أعلى طبقة)
// لذلك يستحيل أن تختفي خلف الصفحة مهما كانت حالة المزامنة أو كرت الشاشة.
// 1.3.0 — أسماء المحركات بالعربي في سجل البحث (من ضمنها المحركات الجديدة)
// 1.4.0 — السجل صار سجل تصفح كامل: صفحات وبحوث بعناوينها الحقيقية، والنقر يفتح الرابط،
//         وزر «مسح الكل» يُعطّل تلقائياً عندما يكون السجل فارغاً،
//         + مقبض سحب على حافة اللوحة لتغيير عرضها (main يتابع المؤشر ويحفظ العرض)
"use strict";

const ENGINE_NAMES = {
  google: "جوجل",
  bing: "بينج",
  duckduckgo: "دك دك جو",
  yandex: "ياندكس",
  wikipedia: "ويكيبيديا",
  youtube: "يوتيوب",
  x: "إكس (تويتر)",
  maps: "خرائط جوجل",
};

const el = {
  title: document.getElementById("panel-title"),
  list: document.getElementById("list"),
  clear: document.getElementById("clear-history"),
  side: document.getElementById("side-btn"),
  close: document.getElementById("close-btn"),
  handle: document.getElementById("resize-handle"),
};

let current = "history"; // أي قائمة معروضة: history | bookmarks
let side = "left";       // جهة اللوحة — مصدر الحقيقة هو main ويخبرنا بأي تغيير

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u || ""; }
}

function fmtTime(t) {
  const d = new Date(t);
  const now = new Date();
  const hm = d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
  if (d.toDateString() === now.toDateString()) return hm;
  const yest = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yest.toDateString()) return "أمس " + hm;
  return d.getDate() + "/" + (d.getMonth() + 1) + " " + hm;
}

function setStatus(msg, isErr) {
  el.list.innerHTML = '<div class="empty' + (isErr ? " err" : "") + '">' + msg + "</div>";
}

function applySide() {
  document.body.classList.toggle("panel-right", side === "right");
  el.side.textContent = side === "left" ? "إلى اليمين" : "إلى اليسار";
}

/* ------------------------------ سجل البحث ------------------------------ */

function renderHistory() {
  el.title.textContent = "🕘 سجل البحث";
  el.clear.style.display = "";
  setStatus("جارٍ فتح السجل…");
  window.barq.getHistory().then(function (data) {
    try {
      paintHistory(data);
    } catch (e) {
      setStatus("تعذّر تحميل السجل — اضغط زر الساعة مرة أخرى", true);
    }
  }).catch(function () {
    setStatus("تعذّر تحميل السجل — اضغط زر الساعة مرة أخرى", true);
  });
}

function paintHistory(data) {
  el.list.innerHTML = "";
  const list = (data && data.list) || [];
  // 1.4.0 — زر «مسح الكل» يعمل فقط وهناك ما يُمسح
  el.clear.disabled = !list.length;
  if (!list.length) {
    setStatus("السجل فارغ — كل صفحة تفتحها وكل بحث تجريه سيظهر هنا تلقائياً");
    return;
  }
  list.forEach(function (x) {
    const isSearch = !!x.q; // مدخلات الصيغة القديمة (بحث فقط) تُعرض كما كانت
    const primary = isSearch ? x.q : (x.title || hostOf(x.url) || x.url);
    let kind = isSearch
      ? "بحث" + (ENGINE_NAMES[x.engine] || x.engine ? " • " + (ENGINE_NAMES[x.engine] || x.engine) : "")
      : hostOf(x.url);
    const row = document.createElement("div");
    row.className = "row";
    row.title = isSearch ? "ابحث من جديد" : "افتح الصفحة";
    row.innerHTML =
      '<div class="main"><div class="t1">' + esc(primary) + "</div>" +
      '<div class="t2">' + esc(kind) + " • " + fmtTime(x.t) + "</div></div>";
    row.addEventListener("click", function () {
      window.barq.navigate(isSearch ? x.q : x.url);
    });
    const del = document.createElement("button");
    del.className = "x";
    del.textContent = "✕";
    del.title = "حذف من السجل";
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      window.barq.removeSearch(x.t);
      renderHistory();
    });
    row.appendChild(del);
    el.list.appendChild(row);
  });
}

/* ------------------------------- المفضلة ------------------------------- */

function renderBookmarks() {
  el.title.textContent = "★ المفضلة";
  el.clear.style.display = "none";
  setStatus("جارٍ فتح المفضلة…");
  window.barq.getBookmarks().then(function (data) {
    try {
      paintBookmarks(data);
    } catch (e) {
      setStatus("تعذّر تحميل المفضلة — اضغط زر المفضلة مرة أخرى", true);
    }
  }).catch(function () {
    setStatus("تعذّر تحميل المفضلة — اضغط زر المفضلة مرة أخرى", true);
  });
}

function paintBookmarks(data) {
  el.list.innerHTML = "";
  const list = (data && data.list) || [];
  if (!list.length) {
    setStatus("لا يوجد مفضلات بعد — افتح أي صفحة واضغط النجمة ★ لحفظها هنا");
    return;
  }
  list.forEach(function (b) {
    const row = document.createElement("div");
    row.className = "row";
    row.title = "افتح الصفحة";
    row.innerHTML =
      '<div class="main"><div class="t1">' + esc(b.title || b.url) + "</div>" +
      '<div class="t2">' + esc(b.url) + "</div></div>";
    row.addEventListener("click", function () {
      window.barq.navigate(b.url);
    });
    const del = document.createElement("button");
    del.className = "x";
    del.textContent = "✕";
    del.title = "إزالة من المفضلة";
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      window.barq.removeBookmark(b.url);
      renderBookmarks();
    });
    row.appendChild(del);
    el.list.appendChild(row);
  });
}

function render() {
  if (current === "history") renderHistory();
  else renderBookmarks();
}

/* -------------------------- أحداث main (المصدر) -------------------------- */

// main يخبرنا أي قائمة تُعرض كلما فُتحت اللوحة أو احتاجت تحديثاً
window.barq.onPanelShow(function (d) {
  if (d && d.name) current = d.name;
  if (d && d.side) side = d.side;
  applySide();
  render();
});

// main يخبرنا بتغيير جهة اللوحة (لا يوجد إلا مصدر واحد للجهة)
window.barq.onPanelSideChanged(function (d) {
  if (d && d.side) side = d.side;
  applySide();
});

/* ------------------------------- الأزرار ------------------------------- */

el.side.addEventListener("click", function () {
  // نرسل الجهة الجديدة المقصودة — main يحفظها ويخبرنا ويحرّك حدود العرض
  try {
    window.barq.panelSide(side === "left" ? "right" : "left");
  } catch (e) {}
});

el.close.addEventListener("click", function () {
  try {
    window.barq.panel(null);
  } catch (e) {}
});

el.clear.addEventListener("click", function () {
  window.barq.clearHistory();
  renderHistory();
});

/* ------------------ 1.4.0 — تغيير عرض اللوحة بالسحب ------------------ */

el.handle.addEventListener("mousedown", function () {
  el.handle.classList.add("dragging");
  try { window.barq.panelResizeStart(); } catch (e) {}
});
document.addEventListener("mouseup", function () {
  el.handle.classList.remove("dragging");
  try { window.barq.panelResizeEnd(); } catch (e) {}
});

applySide();
setStatus("…");
