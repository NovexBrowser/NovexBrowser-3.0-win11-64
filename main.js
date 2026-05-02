const { app, BrowserWindow, session, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Ajustes ligeros para reducir actividad de fondo innecesaria.
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-component-update");

let mainWindow;
let splashWindow;

let lastCpuInfo = null;

function getCpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  cpus.forEach((cpu) => {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  });

  return { idle, total };
}

function getCpuUsagePercent() {
  const current = getCpuSnapshot();

  if (!lastCpuInfo) {
    lastCpuInfo = current;
    return 0;
  }

  const idleDiff = current.idle - lastCpuInfo.idle;
  const totalDiff = current.total - lastCpuInfo.total;

  lastCpuInfo = current;

  if (totalDiff <= 0) return 0;

  const usage = 100 - Math.round((idleDiff / totalDiff) * 100);
  return Math.max(0, Math.min(100, usage));
}

function getPersistentSession() {
  return session.fromPartition("persist:novex");
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 360,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    icon: path.join(__dirname, "assets", "novex-logo.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile("splash.html");
}

function createWindow() {
  getPersistentSession().setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedBasic = ["media", "geolocation", "notifications", "fullscreen"];
    callback(allowedBasic.includes(permission));
  });

  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "Novex Browser",
    icon: path.join(__dirname, "assets", "novex-logo.ico"),
    backgroundColor: "#09040f",
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      spellcheck: false,
      backgroundThrottling: true,
      partition: "persist:novex"
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      mainWindow.webContents.send("novex-open-url-request", url);
    }
    return { action: "deny" };
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }

      mainWindow.show();
      mainWindow.focus();
    }, 1300);
  });

  getPersistentSession().on("will-download", (event, item) => {
    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("Descarga completada:", item.getFilename());
      }
    });
  });

  session.defaultSession.on("will-download", (event, item) => {
    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("Descarga completada:", item.getFilename());
      }
    });
  });
}

function getBrowserBookmarkFiles(browserKey) {
  const home = os.homedir();
  const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  const roaming = process.env.APPDATA || path.join(home, "AppData", "Roaming");

  const profileNames = [
    "Default",
    "Profile 1",
    "Profile 2",
    "Profile 3",
    "Profile 4",
    "Profile 5"
  ];

  const map = {
    chrome: profileNames.map(profile => path.join(local, "Google", "Chrome", "User Data", profile, "Bookmarks")),
    edge: profileNames.map(profile => path.join(local, "Microsoft", "Edge", "User Data", profile, "Bookmarks")),
    brave: profileNames.map(profile => path.join(local, "BraveSoftware", "Brave-Browser", "User Data", profile, "Bookmarks")),
    opera: [
      path.join(roaming, "Opera Software", "Opera Stable", "Bookmarks")
    ],
    operagx: [
      path.join(roaming, "Opera Software", "Opera GX Stable", "Bookmarks")
    ]
  };

  return map[browserKey] || [];
}

function extractBookmarksFromChromeJson(jsonData) {
  const results = [];

  function walk(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node !== "object") return;

    if (node.type === "url" && node.url) {
      results.push({
        title: node.name || node.url,
        url: node.url
      });
    }

    if (node.children) {
      walk(node.children);
    }

    if (node.roots) {
      walk(Object.values(node.roots));
    }
  }

  walk(jsonData);
  return results;
}

ipcMain.handle("novex-import-browser-bookmarks", async (event, browserKey) => {
  try {
    const files = getBrowserBookmarkFiles(browserKey);
    let allBookmarks = [];
    let usedFiles = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;

      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      const bookmarks = extractBookmarksFromChromeJson(data);

      if (bookmarks.length > 0) {
        allBookmarks = allBookmarks.concat(bookmarks);
        usedFiles.push(file);
      }
    }

    const unique = [];
    const seen = new Set();

    allBookmarks.forEach(item => {
      if (!item.url || seen.has(item.url)) return;
      seen.add(item.url);
      unique.push(item);
    });

    if (unique.length === 0) {
      return {
        ok: false,
        message: "No encontré favoritos en ese navegador. Revisa que tenga favoritos guardados o que sea compatible.",
        bookmarks: []
      };
    }

    return {
      ok: true,
      message: `Se encontraron ${unique.length} favoritos.`,
      files: usedFiles,
      bookmarks: unique
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "No pude importar favoritos de ese navegador.",
      bookmarks: []
    };
  }
});

ipcMain.handle("novex-get-cookie-summary", async () => {
  try {
    const cookies = await getPersistentSession().cookies.get({});
    const domains = new Set();

    cookies.forEach(cookie => {
      if (cookie.domain) domains.add(cookie.domain.replace(/^\./, ""));
    });

    return {
      ok: true,
      totalCookies: cookies.length,
      totalDomains: domains.size
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "No pude leer las cookies.",
      totalCookies: 0,
      totalDomains: 0
    };
  }
});

ipcMain.handle("novex-clear-cookies", async () => {
  try {
    await getPersistentSession().clearStorageData({
      storages: ["cookies"]
    });

    return {
      ok: true,
      message: "Cookies borradas correctamente."
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "No pude borrar las cookies."
    };
  }
});

ipcMain.handle("novex-clear-site-data", async () => {
  try {
    await getPersistentSession().clearStorageData({
      storages: [
        "cookies",
        "filesystem",
        "indexdb",
        "localstorage",
        "shadercache",
        "websql",
        "serviceworkers",
        "cachestorage"
      ]
    });

    return {
      ok: true,
      message: "Datos de sitios borrados correctamente."
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "No pude borrar los datos de sitios."
    };
  }
});

ipcMain.handle("novex-get-system-stats", async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const processMem = process.memoryUsage().rss;

  return {
    cpu: getCpuUsagePercent(),
    ramUsed: usedMem,
    ramTotal: totalMem,
    appRam: processMem
  };
});

ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (!mainWindow) return;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
    createWindow();
  }
});
