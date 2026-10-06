// برق — منطق شريط الأدوات (يعمل بمعزل تام عبر contextIsolation)
"use strict";

const el = {
  back: document.getElementById("back"),
  fwd: document.getElementById("fwd"),
  reload: document.getElementById("reload"),
  home: document.getElementById("home"),
  form: document.getElementById("go"),
  url: document.getElementById("url"),
  engine: document.getElementById("engine"),
  count: document.getElementById("count"),
};

let focused = false;

function render(s) {
  el.back.disabled = !s.canBack;
  el.fwd.disabled = !s.canFwd;
  if (!focused) el.url.value = s.isHome ? "" : s.url;
  el.count.textContent = String(s.blockedCurrent) + " / " + String(s.blockedTotal);
  if (s.engine && el.engine.value && el.engine.value !== s.engine) {
    el.engine.value = s.engine;
  }
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
