const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("barq", {
  navigate: (u) => ipcRenderer.send("barq:navigate", u),
  back: () => ipcRenderer.send("barq:back"),
  forward: () => ipcRenderer.send("barq:forward"),
  reload: () => ipcRenderer.send("barq:reload"),
  home: () => ipcRenderer.send("barq:home"),
  state: () => ipcRenderer.invoke("barq:state"),
  onNavState: (cb) => ipcRenderer.on("barq:nav-state", (_e, s) => cb(s)),
  engines: () => ipcRenderer.invoke("barq:engines"),
  setEngine: (id) => ipcRenderer.send("barq:set-engine", id),
  // 1.3.0 — البحث الشامل: كل المحركات في نفس اللحظة
  omniOpen: (q) => ipcRenderer.send("barq:omni-open", q),
  // 1.2.0 — سجل البحث والمفضلة
  panel: (name) => ipcRenderer.send("barq:panel", name),
  // 1.4.2 — زر حساب برق: يفتح لوحة الحساب (الدخول اختياري — بلا حساب يعمل برق طبيعياً)
  account: () => ipcRenderer.send("barq:panel", "account"),
  // 1.4.2 — جسر الحساب للوحة: حالة/دخول/إنشاء/خروج — التحقق كله في main
  getAccount: () => ipcRenderer.invoke("barq:account-state"),
  accountLogin: (user, pass) =>
    ipcRenderer.invoke("barq:account-login", { user: String(user || ""), pass: String(pass || "") }),
  accountRegister: (user, pass, confirm) =>
    ipcRenderer.invoke("barq:account-register", { user: String(user || ""), pass: String(pass || ""), confirm: String(confirm || "") }),
  accountLogout: () => ipcRenderer.invoke("barq:account-logout"),
  // 1.4.3 — الحساب السحابي: يتبعك من أي مكان في العالم (مثل كروم)
  // الرمز يُمرَّر لمرة واحدة إلى main — يُحفظ في cloud.json ولا يعود للواجهة
  cloudState: () => ipcRenderer.invoke("barq:cloud-state"),
  cloudLogin: (token) => ipcRenderer.invoke("barq:cloud-login", { token: String(token || "") }),
  cloudLogout: () => ipcRenderer.invoke("barq:cloud-logout"),
  cloudSync: () => ipcRenderer.invoke("barq:cloud-sync"),
  // 1.2.4 — تبديل جهة اللوحة الجانبية
  panelSide: (s) => ipcRenderer.send("barq:panel-side", s),
  // 1.4.0 — تغيير عرض اللوحة بالسحب من حافتها
  panelResizeStart: () => ipcRenderer.send("barq:panel-resize-start"),
  panelResizeEnd: () => ipcRenderer.send("barq:panel-resize-end"),
  // 1.2.6 — اللوحة طبقة مستقلة: main يخبر كل نافذة بدورها
  onPanelShow: (cb) => ipcRenderer.on("barq:panel-show", (_e, d) => cb(d)),
  onPanelSideChanged: (cb) => ipcRenderer.on("barq:panel-side-changed", (_e, d) => cb(d)),
  onPanelButtons: (cb) => ipcRenderer.on("barq:panel-buttons", (_e, d) => cb(d)),
  onPanelsClosed: (cb) => ipcRenderer.on("barq:panels-closed", () => cb()),
  getHistory: () => ipcRenderer.invoke("barq:get-history"),
  removeSearch: (t) => ipcRenderer.send("barq:remove-search", t),
  clearHistory: () => ipcRenderer.send("barq:clear-history"),
  getBookmarks: () => ipcRenderer.invoke("barq:get-bookmarks"),
  star: () => ipcRenderer.invoke("barq:star"),
  removeBookmark: (u) => ipcRenderer.send("barq:remove-bookmark", u),
});
