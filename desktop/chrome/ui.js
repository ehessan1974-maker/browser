// برق — منطق شريط الأدوات (يعمل بمعزل تام عبر contextIsolation)
// 1.2.0 — زر نجمة للمفضلة + لوحة سجل البحث
// 1.2.1 — زر مخصص لقائمة المفضلة (بدل النقر المزدوج على النجمة)
// 1.2.2 — اللوحتان جانبيتين بنمط كروم + الزر صاحب اللوحة المفتوحة يبقى مضيئاً
// 1.2.3 — اللوحة تبقى مفتوحة أثناء التنقل مثل كروم تماماً (تُغلق بزرها فقط)،
//         والنجمة تحدّث قائمة المفضلة فوراً لو هي مفتوحة
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
  panelHistory: document.getElementById("panel-history"),
  panelBookmarks: document.getElementById("panel-bookmarks"),
  historyList: document.getElementById("history-list"),
  bookmarkList: document.getElementById("bookmark-list"),
  clearHistory: document.getElementById("clear-history"),
};

let focused = false;
let openPanel = null;

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
window.barq.onPanelsClosed(function () {
  hidePanels(false);
});

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

/* ------------------- النجمة: حفظ/إزالة الصفحة الحالية ------------------- */

el.star.addEventListener("click", () => {
  window.barq.star().then((r) => {
    if (r && r.ok) {
      el.star.classList.toggle("star-on", !!r.starred);
      if (openPanel === "bookmarks") renderBookmarks();
    }
  });
});

/* ---------------------- اللوحتان: سجل البحث والمفضلة ---------------------- */

function hidePanels(notifyMain) {
  openPanel = null;
  el.panelHistory.classList.remove("open");
  el.panelBookmarks.classList.remove("open");
  el.hist.classList.remove("on");
  el.marks.classList.remove("on");
  if (notifyMain) window.barq.panel(false);
}

function showPanel(name) {
  if (openPanel === name) {
    hidePanels(true);
    return;
  }
  openPanel = name;
  el.panelHistory.classList.toggle("open", name === "history");
  el.panelBookmarks.classList.toggle("open", name === "bookmarks");
  el.hist.classList.toggle("on", name === "history");
  el.marks.classList.toggle("on", name === "bookmarks");
  window.barq.panel(true);
  if (name === "history") renderHistory();
  else renderBookmarks();
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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHistory() {
  window.barq.getHistory().then((data) => {
    if (openPanel !== "history") return;
    el.historyList.innerHTML = "";
    const list = (data && data.list) || [];
    if (!list.length) {
      el.historyList.innerHTML =
        '<div class="empty">لا يوجد بحث بعد — كل ما تبحث عنه سيظهر هنا تلقائيًا</div>';
      return;
    }
    list.forEach(function (x) {
      const row = document.createElement("div");
      row.className = "row";
      row.title = "ابحث من جديد";
      row.innerHTML =
        '<div class="main"><div class="t1">' + esc(x.q) + "</div>" +
        '<div class="t2">' + esc(x.engine || "") + " • " + fmtTime(x.t) + "</div></div>";
      row.addEventListener("click", function () {
        window.barq.navigate(x.q);
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
      el.historyList.appendChild(row);
    });
  });
}

function renderBookmarks() {
  window.barq.getBookmarks().then((data) => {
    if (openPanel !== "bookmarks") return;
    el.bookmarkList.innerHTML = "";
    const list = (data && data.list) || [];
    if (!list.length) {
      el.bookmarkList.innerHTML =
        '<div class="empty">لا يوجد مفضلات بعد — افتح أي صفحة واضغط النجمة ★ لحفظها هنا</div>';
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
      el.bookmarkList.appendChild(row);
    });
  });
}

el.hist.addEventListener("click", () => showPanel("history"));
el.marks.addEventListener("click", () => showPanel("bookmarks"));
el.clearHistory.addEventListener("click", () => {
  window.barq.clearHistory();
  renderHistory();
});
