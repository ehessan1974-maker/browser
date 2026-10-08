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
  // 1.2.0 — سجل البحث والمفضلة
  panel: (name) => ipcRenderer.send("barq:panel", name),
  // 1.2.4 — تبديل جهة اللوحة الجانبية
  panelSide: (s) => ipcRenderer.send("barq:panel-side", s),
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
