const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("novexWindow", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close")
});

contextBridge.exposeInMainWorld("novexImport", {
  browserBookmarks: (browserKey) => ipcRenderer.invoke("novex-import-browser-bookmarks", browserKey)
});

contextBridge.exposeInMainWorld("novexCookies", {
  getSummary: () => ipcRenderer.invoke("novex-get-cookie-summary"),
  clearCookies: () => ipcRenderer.invoke("novex-clear-cookies"),
  clearSiteData: () => ipcRenderer.invoke("novex-clear-site-data")
});

contextBridge.exposeInMainWorld("novexSystem", {
  getStats: () => ipcRenderer.invoke("novex-get-system-stats")
});


contextBridge.exposeInMainWorld("novexEvents", {
  onOpenUrlRequest: (callback) => ipcRenderer.on("novex-open-url-request", (_event, url) => callback(url))
});
