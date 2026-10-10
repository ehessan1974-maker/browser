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
  // 1.4.4 — قائمة المحركات المنسدلة: خانة اختيار لكل محرك (الحفظ في main)
  omniEnabledGet: () => ipcRenderer.invoke("barq:omni-enabled"),
  omniSetEnabled: (ids) => ipcRenderer.send("barq:omni-set-enabled", ids),
  // 1.4.4 — زر «شامل»: صح على الكل ↔ رجوع للاختيار السابق
  omniAll: () => ipcRenderer.send("barq:omni-all"),
  onOmniEnabled: (cb) => ipcRenderer.on("barq:omni-enabled-changed", (_e, d) => cb(d)),
  // 1.4.4 — درع المتعقبات: أسماء النطاقات المحجوبة فعلياً وأعدادها
  trackers: () => ipcRenderer.invoke("barq:trackers"),
  // 1.4.7 — القوائم العائمة: BrowserView مستقل فوق الصفحة بلا إزاحتها
  popOpen: (o) => ipcRenderer.send("barq:ui-pop", o),
  popClose: () => ipcRenderer.send("barq:ui-pop-close"),
  popSize: (h) => ipcRenderer.send("barq:pop-size", h),
  popReady: () => ipcRenderer.send("barq:pop-ready"),
  onPopClosed: (cb) => ipcRenderer.on("barq:ui-pop-closed", () => cb()),
  onPopShow: (cb) => ipcRenderer.on("barq:pop-show", (_e, d) => cb(d)),
  onPopHidden: (cb) => ipcRenderer.on("barq:pop-hidden", () => cb()),
  onPopRequest: (cb) => ipcRenderer.on("barq:pop-request", (_e, d) => cb(d)),
  barPop: (t) => ipcRenderer.send("barq:bar-pop-request", t),
  hoverLeave: () => ipcRenderer.send("barq:hover-leave"),
  hoverEnter: () => ipcRenderer.send("barq:hover-enter"),
  // 1.4.7 — المظهر: نهاري مرح / ليلي (يُحفظ في main ويُبث لكل الواجهات)
  themeGet: () => ipcRenderer.invoke("barq:theme-get"),
  themeSet: (t) => ipcRenderer.send("barq:theme-set", t),
  onTheme: (cb) => ipcRenderer.on("barq:theme-changed", (_e, d) => cb(d)),
  // 1.4.7 — سجل رجوع/تقدم لقوائم التحويم + القفز لأي موضع في المسار
  navHistory: () => ipcRenderer.invoke("barq:nav-history"),
  navGoto: (i) => ipcRenderer.send("barq:nav-goto", i),
  // 1.4.7 — إضافات كروم: القائمة المثبتة + تحميل مجلد غير مضغوط + إزالة
  extList: () => ipcRenderer.invoke("barq:ext-list"),
  extLoad: () => ipcRenderer.invoke("barq:ext-load"),
  extRemove: (id) => ipcRenderer.send("barq:ext-remove", id),
  // 1.4.7 — إعدادات إضافية في قائمة «الإعدادات والمزيد»
  openDlFolder: () => ipcRenderer.send("barq:open-dl-folder"),
  clearBrowsing: () => ipcRenderer.send("barq:clear-browsing"),
  checkUpdates: () => ipcRenderer.send("barq:check-updates"),
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
  // 1.4.5 — خاصيات كروم: تكبير الخط + ترجمة غوغل + التنزيلات + قائمة 3 نقاط
  zoom: (dir) => ipcRenderer.send("barq:zoom", dir),
  onZoomChanged: (cb) => ipcRenderer.on("barq:zoom-changed", (_e, d) => cb(d)),
  zoomGet: () => ipcRenderer.invoke("barq:zoom-get"),
  translate: () => ipcRenderer.send("barq:translate"),
  downloads: () => ipcRenderer.invoke("barq:downloads"),
  onDownloads: (cb) => ipcRenderer.on("barq:downloads", (_e, d) => cb(d)),
  onDownloadStart: (cb) => ipcRenderer.on("barq:download-start", () => cb()),
  downloadOpen: (id) => ipcRenderer.send("barq:download-open", id),
  downloadShow: (id) => ipcRenderer.send("barq:download-show", id),
  downloadCancel: (id) => ipcRenderer.send("barq:download-cancel", id),
  downloadsClear: () => ipcRenderer.send("barq:downloads-clear"),
  clearCache: () => ipcRenderer.send("barq:clear-cache"),
  light: () => ipcRenderer.send("barq:light"),
  about: () => ipcRenderer.invoke("barq:about"),
});
