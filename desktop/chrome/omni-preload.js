// برق — جسر مخصّص لصفحة البحث الشامل فقط (1.3.0)
// يُحمَّل مع عرض الصفحات الرئيسي، لكنه لا يعرض للمواقع إلا 3 دوال استعلام
// لا تحمل أي صلاحية تنقل أو ملفات — موقع خبيث يقدر "يبحث" فقط، لا أكثر.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omni", {
  wiki: (q) => ipcRenderer.invoke("barq:omni-wiki", q),
  ddg:  (q) => ipcRenderer.invoke("barq:omni-ddg", q),
  bing: (q) => ipcRenderer.invoke("barq:omni-bing", q),
});
