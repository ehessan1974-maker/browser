// برق — جسر مخصّص لصفحات العرض الرئيسي (1.3.0 + 1.3.1)
// يُحمَّل مع عرض الصفحات الرئيسي، لكنه لا يعرض للمواقع إلا 3 دوال استعلام
// لا تحمل أي صلاحية تنقل أو ملفات — موقع خبيث يقدر "يبحث" فقط، لا أكثر.
// 1.3.1 — + دالتا التفعيل: قراءة المحركات المفعّلة وحفظ الاختيار
// (main يتحقق من المعرّفات — الواجهة لا تحكم على القرص بنفسها)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omni", {
  wiki: (q) => ipcRenderer.invoke("barq:omni-wiki", q),
  ddg:  (q) => ipcRenderer.invoke("barq:omni-ddg", q),
  bing: (q) => ipcRenderer.invoke("barq:omni-bing", q),
  enabled:    () => ipcRenderer.invoke("barq:omni-enabled"),
  setEnabled: (ids) => ipcRenderer.send("barq:omni-set-enabled", ids),
  // 1.4.7 — المظهر للصفحات الداخلية (نهاري مرح / ليلي): main يبث التغيير لكل العروض
  themeGet: () => ipcRenderer.invoke("barq:theme-get"),
  onTheme: (cb) => ipcRenderer.on("barq:theme-changed", (_e, d) => cb(d)),
});

// 1.4.0 — أمان السحب: إفلات الفأرة فوق الصفحة (خارج اللوحة) يُنهي تغيير العرض أيضاً
window.addEventListener("mouseup", function () {
  try { ipcRenderer.send("barq:panel-resize-end"); } catch (e) {}
});
