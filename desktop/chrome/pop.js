// برق — القائمة العائمة (1.4.7): BrowserView مستقل يرسم فوق الصفحة بلا أي إزاحة لها.
// يعرض بالتناوب: محركات البحث، المتعقبات المحجوبة، التنزيلات، الإعدادات والمزيد،
// إضافات كروم، وسجل الرجوع/التقدم عند التحويم على زرّيهما.
// main هو مصدر الحقيقة — هذا الملف يرسم ويأمر فقط عبر جسر window.barq.
"use strict";

const root = document.getElementById("pop");

let openType = null;    // engines | shield | downloads | menu | ext | hback | hfwd
let enginesData = null; // { current, enabled:[], list:[] }
let dlData = [];
let shieldTimer = null;

function esc(s) {
  return String(s == null ? "" : String(s))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// الضبط الحي: ارتفاع القائمة يتبع محتواها (main يقيّده بارتفاع النافذة)
function sendSize() {
  requestAnimationFrame(function () {
    try { window.barq.popSize(Math.ceil(document.body.scrollHeight) + 2); } catch (e) {}
  });
}

function stopShield() {
  if (shieldTimer) { clearInterval(shieldTimer); shieldTimer = null; }
}

/* ------------------------------ محركات البحث ------------------------------ */
// الصح أمام المحرك = يشارك في البحث الشامل (ومحرك واحد مفعّل = بحث مباشر فيه)
// والنقر على الاسم = يجعله الافتراضي — الافتراضي يظهر أمامه ✓ وكلمة «افتراضي»
// (جوجل هو الافتراضي الرسمي — 1.4.7)

function paintEngines() {
  if (!enginesData) return;
  root.innerHTML =
    '<div class="ph">🔍 محركات البحث</div>' +
    '<div class="psub">الصح = يشارك في البحث الشامل. اضغط اسم المحرك لجعله <b>الافتراضي</b> — أمامه ✓ وكلمة «افتراضي».</div>' +
    '<div class="pscroll" id="eng-list"></div>';
  const list = root.querySelector("#eng-list");
  enginesData.list.forEach(function (x) {
    const row = document.createElement("label");
    row.className = "eng-row" + (x.id === enginesData.current ? " cur" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = enginesData.enabled.indexOf(x.id) !== -1;
    cb.setAttribute("aria-label", "تفعيل " + x.name + " في البحث الشامل");
    cb.title = "يشارك في البحث الشامل — ومحرك واحد مفعّل يعني بحثاً مباشراً فيه";
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
    });
    const nm = document.createElement("span");
    nm.className = "eng-name";
    nm.textContent = x.name;
    nm.title = "اجعله محرك البحث الافتراضي";
    nm.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.barq.setEngine(x.id); } catch (e) {}
      enginesData.current = x.id;
      paintEngines();
    });
    const chk = document.createElement("span");
    chk.className = "eng-check";
    chk.textContent = x.id === enginesData.current ? "✓" : "";
    const badge = document.createElement("span");
    badge.className = "eng-badge";
    badge.textContent = "افتراضي";
    row.appendChild(cb);
    row.appendChild(nm);
    row.appendChild(chk);
    row.appendChild(badge);
    list.appendChild(row);
  });
  sendSize();
}

function renderEngines() {
  root.innerHTML = '<div class="pnote">جارٍ فتح قائمة المحركات…</div>';
  window.barq.engines().then(function (d) {
    enginesData = {
      current: d.current,
      enabled: d.enabled && d.enabled.length ? d.enabled.slice() : [d.current],
      list: d.list,
    };
    if (openType === "engines") paintEngines();
  }).catch(function () {
    root.innerHTML = '<div class="pnote">تعذّر فتح قائمة المحركات — أعد فتحها</div>';
    sendSize();
  });
}

// تغيير من أي مكان (زر شامل/لوحة أخرى) يحدّث القائمة لحظياً
window.barq.onOmniEnabled(function (d) {
  if (!enginesData || !d || !d.enabled || !d.enabled.length) return;
  enginesData.enabled = d.enabled.slice();
  if (openType === "engines") paintEngines();
});

/* --------------------------- المتعقبات المحجوبة --------------------------- */

function paintShield(t) {
  const sub =
    '<div class="tpop-sub">هذه الصفحة: ' + esc(t.current) + " — الجلسة كلها: " + esc(t.total) + "</div>";
  let body;
  if (!t.domains.length) {
    body = '<div class="trk-empty">ما في شي محجوب بعد — تنقّل لمواقع فيها إعلانات ومتعقبات وسترى أسماءها هنا بالضبط</div>';
  } else {
    body = "";
    t.domains.forEach(function (d) {
      body += '<div class="trk-row"><span class="trk-d">' + esc(d.d) +
        '</span><span class="trk-n">' + esc(d.n) + "</span></div>";
    });
  }
  root.innerHTML =
    '<div class="ph">🛡 المتعقبات المحجوبة فعلياً</div>' + sub +
    '<div class="pscroll">' + body + "</div>" +
    '<div class="tpop-note">كل طلب من هذه النطاقات أُلغي قبل الاتصال — حجب مؤكد على مستوى الشبكة</div>';
}

function renderShield() {
  root.innerHTML = '<div class="pnote">جارٍ جمع المتعقبات…</div>';
  const refresh = function () {
    window.barq.trackers().then(function (t) {
      if (openType !== "shield" || !t) return;
      paintShield(t);
      const rows = Math.min(t.domains.length, 8);
      const h = rows ? 170 + rows * 26 : 170;
      try { window.barq.popSize(Math.min(430, h)); } catch (e) {}
    }).catch(function () {});
  };
  refresh();
  stopShield();
  shieldTimer = setInterval(refresh, 2000);
}

/* ------------------------------- التنزيلات ------------------------------- */

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

function paintDownloads() {
  if (openType !== "downloads") return;
  if (!dlData.length) {
    root.innerHTML =
      '<div class="ph">⬇ التنزيلات</div>' +
      '<div class="dempty">لا تنزيلات بعد — أي ملف تنزّله من أي صفحة سيظهر هنا بتقدمه الحي مثل كروم تماماً</div>';
    try { window.barq.popSize(150); } catch (e) {}
    return;
  }
  let html = '<div class="ph">⬇ التنزيلات</div><div class="pscroll">';
  for (var i = 0; i < dlData.length; i++) {
    var d = dlData[i];
    var pct = d.total ? Math.min(100, Math.round((d.received / d.total) * 100)) : 0;
    var prog = d.state === "progressing"
      ? '<div class="dbar"><i style="width:' + pct + '%"></i></div>' : "";
    var acts = "";
    if (d.state === "completed") {
      acts = '<div class="drow-a">' +
        '<button class="dbtn" type="button" data-do="open" data-id="' + d.id + '">فتح</button>' +
        '<button class="dbtn" type="button" data-do="show" data-id="' + d.id + '">إظهار بالمجلد</button>' +
        "</div>";
    } else if (d.state === "progressing") {
      acts = '<div class="drow-a">' +
        '<button class="dbtn" type="button" data-do="cancel" data-id="' + d.id + '">إلغاء</button>' +
        "</div>";
    }
    html += '<div class="drow">' +
      '<div class="drow-t"><span class="drow-f">' + esc(d.file) +
      '</span><span class="drow-s">' + esc(dlStateLabel(d)) + "</span></div>" +
      prog + acts + "</div>";
  }
  html += '</div><div class="dfoot"><button class="dbtn" type="button" id="dl-clear">مسح المكتملة</button></div>';
  root.innerHTML = html;
  const clr = root.querySelector("#dl-clear");
  if (clr) {
    clr.addEventListener("click", function () {
      try { window.barq.downloadsClear(); } catch (e) {}
    });
  }
  const rows = Math.min(dlData.length, 5);
  try { window.barq.popSize(Math.min(440, 100 + rows * 78)); } catch (e) {}
}

function renderDownloads() {
  root.innerHTML = '<div class="ph">⬇ التنزيلات</div><div class="pnote">جارٍ الفتح…</div>';
  window.barq.downloads().then(function (r) {
    dlData = (r && r.list) || [];
    paintDownloads();
  }).catch(function () { paintDownloads(); });
}

// تحديث حي من main — القائمة تتحدث فوراً أثناء التنزيل
window.barq.onDownloads(function (d) {
  dlData = (d && d.list) || [];
  paintDownloads();
});

// أزرار عناصر التنزيل (فتح/إظهار/إلغاء) — تفويض على مستوى القائمة كلها
root.addEventListener("click", function (e) {
  const b = e.target && e.target.closest ? e.target.closest("button[data-do]") : null;
  if (!b) return;
  const id = Number(b.getAttribute("data-id"));
  const doWhat = b.getAttribute("data-do");
  if (doWhat === "open") window.barq.downloadOpen(id);
  else if (doWhat === "show") window.barq.downloadShow(id);
  else if (doWhat === "cancel") window.barq.downloadCancel(id);
});

/* --------------------- الإعدادات والمزيد — كل شيء فيه --------------------- */

function renderMenu() {
  window.barq.state().then(function (s) {
    if (openType !== "menu") return;
    const canTranslate =
      !!s && !!s.url && /^https?:\/\//i.test(s.url) && s.url.indexOf(".translate.goog/") === -1;
    root.innerHTML =
      '<div class="pscroll">' +
      '<button class="mrow zoom-label" id="zoom-label" type="button" disabled>' +
        '<span class="mi">🔎</span>حجم الصفحة<span class="zoom-pct" id="zoom-pct">100%</span></button>' +
      '<button class="mrow" id="zoom-in" type="button"><span class="mi">➕</span>تكبير الخط<span class="mk">Ctrl + +</span></button>' +
      '<button class="mrow" id="zoom-out" type="button"><span class="mi">➖</span>تصغير الخط<span class="mk">Ctrl + -</span></button>' +
      '<button class="mrow" id="zoom-reset" type="button"><span class="mi">↺</span>الحجم الأصلي<span class="mk">Ctrl + 0</span></button>' +
      '<div class="psep"></div>' +
      '<button class="mrow" id="theme-row" type="button"><span class="mi" id="theme-ic">☀️</span><span id="theme-lbl">المظهر: الليلي — بدّل للنهاري المرح</span></button>' +
      '<button class="mrow" id="engines-row" type="button"><span class="mi">🔍</span>محركات البحث والافتراضي</button>' +
      '<button class="mrow" id="ext-row" type="button"><span class="mi">🧩</span>إضافات كروم</button>' +
      '<button class="mrow" id="hist-row" type="button"><span class="mi">🕘</span>سجل البحث</button>' +
      '<button class="mrow" id="marks-row" type="button"><span class="mi">★</span>المفضلة</button>' +
      '<button class="mrow" id="account-row" type="button"><span class="mi">👤</span>حساب برق (اختياري)</button>' +
      '<div class="psep"></div>' +
      '<button class="mrow" id="translate-row" type="button"' + (canTranslate ? "" : " disabled") + '>' +
        '<span class="mi">🌐</span>ترجمة الصفحة عبر غوغل</button>' +
      '<button class="mrow" id="dl-row" type="button"><span class="mi">⬇</span>التنزيلات</button>' +
      '<button class="mrow" id="dlfolder-row" type="button"><span class="mi">📂</span>فتح مجلد التنزيلات</button>' +
      '<button class="mrow" id="light-row" type="button"><span class="mi">⚡</span>نسخة برق الخفيفة (HTML)</button>' +
      '<div class="psep"></div>' +
      '<button class="mrow" id="cache-row" type="button"><span class="mi">🧹</span>مسح الكاش المؤقت</button>' +
      '<button class="mrow" id="browse-row" type="button"><span class="mi">🍪</span>مسح الكوكيز وبيانات المواقع</button>' +
      '<button class="mrow" id="updates-row" type="button"><span class="mi">⬆️</span>فحص التحديثات الآن</button>' +
      '<div class="mfoot" id="about-row">برق</div>' +
      "</div>";
    const $ = function (id) { return root.querySelector("#" + id); };
    $("zoom-in").addEventListener("click", function () { try { window.barq.zoom("in"); } catch (e) {} });
    $("zoom-out").addEventListener("click", function () { try { window.barq.zoom("out"); } catch (e) {} });
    $("zoom-reset").addEventListener("click", function () { try { window.barq.zoom("reset"); } catch (e) {} });
    $("theme-row").addEventListener("click", function () {
      window.barq.themeGet().then(function (d) {
        window.barq.themeSet(d && d.theme === "day" ? "night" : "day");
      }).catch(function () {});
    });
    $("engines-row").addEventListener("click", function () { try { window.barq.barPop("engines"); } catch (e) {} });
    $("ext-row").addEventListener("click", function () { try { window.barq.barPop("ext"); } catch (e) {} });
    $("hist-row").addEventListener("click", function () {
      window.barq.popClose();
      try { window.barq.panel("history"); } catch (e) {}
    });
    $("marks-row").addEventListener("click", function () {
      window.barq.popClose();
      try { window.barq.panel("bookmarks"); } catch (e) {}
    });
    $("account-row").addEventListener("click", function () {
      window.barq.popClose();
      try { window.barq.panel("account"); } catch (e) {}
    });
    $("translate-row").addEventListener("click", function () {
      window.barq.popClose();
      try { window.barq.translate(); } catch (e) {}
    });
    $("dl-row").addEventListener("click", function () { try { window.barq.barPop("downloads"); } catch (e) {} });
    $("dlfolder-row").addEventListener("click", function () { try { window.barq.openDlFolder(); } catch (e) {} });
    $("light-row").addEventListener("click", function () {
      window.barq.popClose();
      try { window.barq.light(); } catch (e) {}
    });
    $("cache-row").addEventListener("click", function () {
      try { window.barq.clearCache(); } catch (e) {}
      const mi = $("cache-row").querySelector(".mi");
      mi.textContent = "✅";
      setTimeout(function () { mi.textContent = "🧹"; }, 1200);
    });
    $("browse-row").addEventListener("click", function () {
      try { window.barq.clearBrowsing(); } catch (e) {}
      const mi = $("browse-row").querySelector(".mi");
      mi.textContent = "✅";
      setTimeout(function () { mi.textContent = "🍪"; }, 1600);
    });
    $("updates-row").addEventListener("click", function () {
      try { window.barq.checkUpdates(); } catch (e) {}
      window.barq.popClose();
    });
    // نسبة الحجم وسطر «حول برق» حية
    window.barq.zoomGet().then(function (d) {
      if (d && d.percent) { const z = $("zoom-pct"); if (z) z.textContent = d.percent + "%"; }
    }).catch(function () {});
    window.barq.about().then(function (d) {
      if (d && d.version) { const a = $("about-row"); if (a) a.textContent = "برق v" + d.version; }
    }).catch(function () {});
    paintThemeRow();
    sendSize();
  }).catch(function () {
    root.innerHTML = '<div class="pnote">تعذّر فتح القائمة — أعد فتحها</div>';
    sendSize();
  });
}

function paintThemeRow() {
  window.barq.themeGet().then(function (d) {
    const ic = root.querySelector("#theme-ic");
    const lb = root.querySelector("#theme-lbl");
    if (!ic || !lb) return;
    if (d && d.theme === "day") {
      ic.textContent = "🌙";
      lb.textContent = "المظهر: النهاري المرح — بدّل لليلي";
    } else {
      ic.textContent = "☀️";
      lb.textContent = "المظهر: الليلي — بدّل للنهاري المرح";
    }
  }).catch(function () {});
}

// المظهر تغيّر من أي مكان — القائمة تتبعه فوراً
window.barq.onTheme(function () { paintThemeRow(); });

// نسبة الحجم الحية داخل القائمة
window.barq.onZoomChanged(function (d) {
  if (!d || !d.percent || openType !== "menu") return;
  const z = root.querySelector("#zoom-pct");
  if (z) z.textContent = d.percent + "%";
});

/* ----------------------------- إضافات كروم ----------------------------- */

function renderExt() {
  root.innerHTML = '<div class="ph">🧩 إضافات كروم</div><div class="pnote">جارٍ الفتح…</div>';
  window.barq.extList().then(function (d) {
    if (openType !== "ext") return;
    if (!d || d.supported === false) {
      root.innerHTML =
        '<div class="ph">🧩 إضافات كروم</div>' +
        '<div class="pnote">محرك هذه النسخة لا يدعم إضافات كروم — كل خصائص برق الأخرى تعمل طبيعياً.</div>';
      sendSize();
      return;
    }
    let rows = "";
    (d.list || []).forEach(function (x) {
      rows += '<div class="ext-row"><span class="en">' + esc(x.name) + "</span>" +
        '<span class="ev">' + esc(x.version || "") + "</span>" +
        '<button class="dbtn" type="button" data-rm="' + esc(x.id) + '">إزالة</button></div>';
    });
    root.innerHTML =
      '<div class="ph">🧩 إضافات كروم</div>' +
      '<div class="psub">الإضافات المثبتة تعمل داخل برق. الإزالة تحتاج إعادة فتح الصفحة لتظهر نتيجتها.</div>' +
      '<div class="pscroll">' + (rows || '<div class="pnote">لا إضافات مثبتة بعد.</div>') + "</div>" +
      '<button class="ext-load" id="ext-load" type="button">➕ تحميل إضافة (مجلد غير مضغوط)</button>' +
      '<div class="ext-msg" id="ext-msg"></div>';
    root.querySelector("#ext-load").addEventListener("click", function () {
      const msg = root.querySelector("#ext-msg");
      if (msg) { msg.className = "ext-msg"; msg.textContent = "اختر مجلد الإضافة من النافذة المنبثقة…"; }
      window.barq.extLoad().then(function (r) {
        const m = root.querySelector("#ext-msg");
        if (!m) return;
        if (r && r.ok) {
          m.className = "ext-msg ok";
          m.textContent = "تم تحميل الإضافة: " + (r.name || "") + " — أعد فتح الصفحة لتفعيلها";
          setTimeout(renderExt, 1800);
        } else if (r && r.msg) {
          m.className = "ext-msg";
          m.textContent = r.msg;
        } else if (m) {
          m.textContent = "";
        }
      }).catch(function () {});
    });
    root.addEventListener("click", function (e) {
      const b = e.target && e.target.closest ? e.target.closest("button[data-rm]") : null;
      if (!b) return;
      try { window.barq.extRemove(b.getAttribute("data-rm")); } catch (e2) {}
      setTimeout(renderExt, 400);
    });
    sendSize();
  }).catch(function () {
    root.innerHTML = '<div class="pnote">تعذّر فتح قائمة الإضافات — أعد فتحها</div>';
    sendSize();
  });
}

/* ------------------------ سجل الرجوع/التقدم (تحويم) ------------------------ */

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u || ""; }
}

function renderHist(dir) {
  window.barq.navHistory().then(function (d) {
    if (openType !== dir) return;
    const list = (d && (dir === "hback" ? d.back : d.fwd)) || [];
    let body = "";
    if (!list.length) {
      body = '<div class="pnote">لا يوجد ' + (dir === "hback" ? "رجوع" : "تقدّم") + " — تنقّل بين الصفحات وسيظهر السجل هنا عند التحويم.</div>";
    } else {
      list.forEach(function (x) {
        body += '<div class="hrow" data-i="' + x.i + '" title="افتح هذه الصفحة">' +
          '<span class="t">' + esc(x.title || hostOf(x.url)) + "</span>" +
          '<span class="u">' + esc(x.url) + "</span></div>";
      });
    }
    root.innerHTML =
      '<div class="ph">' + (dir === "hback" ? "🕘 الرجوع — الصفحات السابقة" : "🕘 التقدّم — الصفحات التالية") + "</div>" +
      '<div class="pscroll">' + body + "</div>";
    root.querySelectorAll(".hrow").forEach(function (row) {
      row.addEventListener("click", function () {
        try { window.barq.navGoto(Number(row.getAttribute("data-i"))); } catch (e) {}
      });
    });
    sendSize();
  }).catch(function () {});
}

/* ------------------------------ التوجيه العام ------------------------------ */

window.barq.onPopShow(function (p) {
  const t = p && p.type;
  stopShield();
  openType = t;
  if (t === "engines") renderEngines();
  else if (t === "shield") renderShield();
  else if (t === "downloads") renderDownloads();
  else if (t === "menu") renderMenu();
  else if (t === "ext") renderExt();
  else if (t === "hback") renderHist("hback");
  else if (t === "hfwd") renderHist("hfwd");
  else { root.innerHTML = ""; sendSize(); }
});

// أُغلقت من main (نقر خارجي/Escape/تنقل) — تنظيف المؤقتات
window.barq.onPopHidden(function () {
  openType = null;
  stopShield();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") window.barq.popClose();
});

/* قوائم التحويم: دخول المؤشر للقائمة يلغي غلقها المتأخر، وخروجه يبدأ العدّ */
document.addEventListener("mouseenter", function () {
  try { window.barq.hoverEnter(); } catch (e) {}
});
document.addEventListener("mouseleave", function () {
  try { window.barq.hoverLeave(); } catch (e) {}
});

// pop.html قد يُحمَّل بعد أول طلب فتح — نطلب إعادة البث بعد جهوزيتنا
window.barq.popReady();
