const urlInput = document.getElementById("urlInput");
const homeSearchInput = document.getElementById("homeSearchInput");

const startPage = document.getElementById("startPage");
const favoritesPanel = document.getElementById("favoritesPanel");
const historyPanel = document.getElementById("historyPanel");
const downloadsPanel = document.getElementById("downloadsPanel");
const gamesPanel = document.getElementById("gamesPanel");
const securityPanel = document.getElementById("securityPanel");
const settingsPanel = document.getElementById("settingsPanel");
const profilePanel = document.getElementById("profilePanel");
const importPanel = document.getElementById("importPanel");
const cookiesPanel = document.getElementById("cookiesPanel");
const moreMenu = document.getElementById("moreMenu");
const webviewsContainer = document.getElementById("webviewsContainer");

const favoritesList = document.getElementById("favoritesList");
const historyList = document.getElementById("historyList");

const tabbar = document.getElementById("tabbar");
const newTabBtn = document.getElementById("newTabBtn");

const backBtn = document.getElementById("back");
const forwardBtn = document.getElementById("forward");
const reloadBtn = document.getElementById("reload");
const homeBtn = document.getElementById("home");
const goBtn = document.getElementById("go");
const favoriteBtn = document.getElementById("favoriteBtn");

const homeSideBtn = document.getElementById("homeSideBtn");
const favoritesSideBtn = document.getElementById("favoritesSideBtn");
const historySideBtn = document.getElementById("historySideBtn");
const downloadsSideBtn = document.getElementById("downloadsSideBtn");
const whatsappSideBtn = document.getElementById("whatsappSideBtn");
const spotifySideBtn = document.getElementById("spotifySideBtn");
const robloxSideBtn = document.getElementById("robloxSideBtn");
const gamesSideBtn = document.getElementById("gamesSideBtn");
const securitySideBtn = document.getElementById("securitySideBtn");
const settingsSideBtn = document.getElementById("settingsSideBtn");
const profileSideBtn = document.getElementById("profileSideBtn");

const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");

const menuBtn = document.getElementById("menuBtn");
const menuNewTab = document.getElementById("menuNewTab");
const menuImport = document.getElementById("menuImport");
const menuCookies = document.getElementById("menuCookies");
const menuFavorites = document.getElementById("menuFavorites");
const menuHistory = document.getElementById("menuHistory");
const menuSettings = document.getElementById("menuSettings");
const menuToggleStatusbar = document.getElementById("menuToggleStatusbar");
const menuToggleRamSaver = document.getElementById("menuToggleRamSaver");

const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");
const openImportBtnSettings = document.getElementById("openImportBtnSettings");
const openCookiesBtnSettings = document.getElementById("openCookiesBtnSettings");
const settingsMessage = document.getElementById("settingsMessage");
const toggleStatusbarBtn = document.getElementById("toggleStatusbarBtn");
const toggleRamSaverBtn = document.getElementById("toggleRamSaverBtn");

const statusbar = document.getElementById("statusbar");
const hideStatusbarQuick = document.getElementById("hideStatusbarQuick");
const cpuStatus = document.getElementById("cpuStatus");
const ramStatus = document.getElementById("ramStatus");
const appRamStatus = document.getElementById("appRamStatus");
const timeStatus = document.getElementById("timeStatus");
const ramSaverStatus = document.getElementById("ramSaverStatus");

const browserImportSelect = document.getElementById("browserImportSelect");
const importBrowserBtn = document.getElementById("importBrowserBtn");
const importResult = document.getElementById("importResult");

const cookieTotal = document.getElementById("cookieTotal");
const cookieDomains = document.getElementById("cookieDomains");
const refreshCookiesBtn = document.getElementById("refreshCookiesBtn");
const clearCookiesBtn = document.getElementById("clearCookiesBtn");
const clearSiteDataBtn = document.getElementById("clearSiteDataBtn");
const cookiesMessage = document.getElementById("cookiesMessage");

const quickCards = document.querySelectorAll(".quick-card");
const sideButtons = document.querySelectorAll(".side-btn");

const startUrl = "https://www.google.com";
const logoPath = "assets/novex-logo.png";

let favorites = JSON.parse(localStorage.getItem("novexFavorites")) || [];
let history = JSON.parse(localStorage.getItem("novexHistory")) || [];

let statusbarHidden = localStorage.getItem("novexStatusbarHidden") === "true";
let ramSaverEnabled = localStorage.getItem("novexRamSaver") === "true";
let restoreEnabled = localStorage.getItem("novexRestoreSession") !== "false";

let tabs = [];
let activeTabId = null;
let tabCounter = 1;
let isRestoring = false;

function formatUrl(input) {
  const text = input.trim();

  if (!text) return startUrl;

  if (text.startsWith("http://") || text.startsWith("https://")) return text;

  if (text.includes(".") && !text.includes(" ")) return "https://" + text;

  return "https://www.google.com/search?q=" + encodeURIComponent(text);
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 MB";

  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return gb.toFixed(1) + " GB";

  const mb = bytes / (1024 ** 2);
  return Math.round(mb) + " MB";
}

function formatUTCMinus4() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const utcMinus4 = new Date(utc - 4 * 60 * 60000);

  let hours = utcMinus4.getHours();
  const minutes = String(utcMinus4.getMinutes()).padStart(2, "0");
  const seconds = String(utcMinus4.getSeconds()).padStart(2, "0");

  return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
}

function currentTab() {
  return tabs.find(tab => tab.id === activeTabId);
}

function currentWebview() {
  const tab = currentTab();
  return tab ? tab.webview : null;
}

function hidePanels() {
  [startPage, favoritesPanel, historyPanel, downloadsPanel, gamesPanel, securityPanel, settingsPanel, profilePanel, importPanel, cookiesPanel].forEach(panel => {
    if (panel) panel.classList.add("hidden");
  });

  if (moreMenu) moreMenu.classList.add("hidden");
}

function hideAllWebviews() {
  tabs.forEach(tab => tab.webview.classList.add("webview-hidden"));
}

function setActiveSideButton(activeButton) {
  sideButtons.forEach(btn => btn.classList.remove("active"));
  if (activeButton) activeButton.classList.add("active");
}

function getSessionTabsForSave() {
  return tabs.map(tab => ({
    title: tab.title,
    url: tab.url
  })).filter(tab => tab.url && tab.url !== "about:blank");
}

function saveSession() {
  if (!restoreEnabled || isRestoring) return;

  const sessionData = {
    activeIndex: Math.max(0, tabs.findIndex(tab => tab.id === activeTabId)),
    tabs: getSessionTabsForSave()
  };

  localStorage.setItem("novexLastSession", JSON.stringify(sessionData));
}

function restoreSession() {
  const raw = localStorage.getItem("novexLastSession");

  if (!raw) {
    createTab();
    return;
  }

  try {
    const data = JSON.parse(raw);

    if (!data.tabs || !Array.isArray(data.tabs) || data.tabs.length === 0) {
      createTab();
      return;
    }

    isRestoring = true;

    data.tabs.slice(0, 20).forEach(tab => {
      createTab(tab.url);
      const current = currentTab();
      if (current && tab.title) current.title = tab.title;
    });

    isRestoring = false;

    const index = Math.min(data.activeIndex || 0, tabs.length - 1);
    switchToTab(tabs[index].id);
    renderTabs();
  } catch (error) {
    isRestoring = false;
    createTab();
  }
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach(tab => tab.remove());

  if (tabs.length >= 6) tabbar.classList.add("many-tabs");
  else tabbar.classList.remove("many-tabs");

  tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = "tab" + (tab.id === activeTabId ? " active-tab" : "") + (tab.unloaded ? " ram-unloaded" : "");
    tabEl.dataset.id = tab.id;

    tabEl.innerHTML = `
      <img src="${logoPath}" alt="N" />
      <span class="tab-title">${tab.title || "Nueva pestaña"}</span>
      <button class="tab-close">×</button>
    `;

    tabEl.addEventListener("click", () => switchToTab(tab.id));

    tabEl.addEventListener("auxclick", (event) => {
      if (event.button === 1) closeTab(tab.id);
    });

    tabEl.querySelector(".tab-close").addEventListener("click", (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    tabbar.insertBefore(tabEl, newTabBtn);
  });

  const activeEl = tabbar.querySelector(".active-tab");
  if (activeEl) {
    activeEl.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }
}

function createTab(url = null) {
  const id = "tab-" + tabCounter++;
  const webview = document.createElement("webview");

  webview.className = "webview-hidden";
  webview.setAttribute("allowpopups", "");
  webview.setAttribute("partition", "persist:novex");
  webview.src = url || startUrl;

  const tab = {
    id,
    title: url ? "Cargando..." : "Nueva pestaña",
    url: url || "",
    unloaded: false,
    webview
  };

  tabs.push(tab);
  webviewsContainer.appendChild(webview);

  setupWebviewEvents(tab);
  switchToTab(id);

  if (!url) showStartPageForTab(id);

  renderTabs();
  saveSession();
}

function switchToTab(id) {
  activeTabId = id;
  const tab = currentTab();

  hidePanels();
  hideAllWebviews();

  if (tab && tab.url) {
    if (tab.unloaded) {
      tab.webview.src = tab.url;
      tab.unloaded = false;
    }

    tab.webview.classList.remove("webview-hidden");
    urlInput.value = tab.url;
  } else {
    startPage.classList.remove("hidden");
    urlInput.value = "";
  }

  updateFavoriteIcon(urlInput.value);
  setActiveSideButton(homeSideBtn);
  unloadInactiveTabsIfNeeded();
  renderTabs();
  saveSession();
}

function closeTab(id) {
  const tabIndex = tabs.findIndex(tab => tab.id === id);
  if (tabIndex === -1) return;

  const tab = tabs[tabIndex];
  tab.webview.remove();
  tabs.splice(tabIndex, 1);

  if (tabs.length === 0) {
    createTab();
    return;
  }

  if (activeTabId === id) {
    const nextTab = tabs[tabIndex] || tabs[tabIndex - 1];
    switchToTab(nextTab.id);
  }

  renderTabs();
  saveSession();
}

function showStartPageForTab(id = activeTabId) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  tab.url = "";
  tab.title = "Nueva pestaña";
  tab.unloaded = false;

  hidePanels();
  hideAllWebviews();

  if (id === activeTabId) {
    startPage.classList.remove("hidden");
    urlInput.value = "";
  }

  setActiveSideButton(homeSideBtn);
  renderTabs();
  saveSession();
}

function showBrowser(url) {
  const tab = currentTab();
  if (!tab) return;

  hidePanels();
  hideAllWebviews();

  tab.url = url;
  tab.unloaded = false;
  tab.title = "Cargando...";
  tab.webview.src = url;
  tab.webview.classList.remove("webview-hidden");

  urlInput.value = url;
  renderTabs();
  saveSession();
}

function navigateFromUrlBar() {
  showBrowser(formatUrl(urlInput.value));
}

function navigateFromHomeSearch() {
  const url = formatUrl(homeSearchInput.value);
  homeSearchInput.value = "";
  showBrowser(url);
}

function addToHistory(url, title = url) {
  if (!url || url.startsWith("file://") || url === "about:blank") return;

  const exists = history.find(item => item.url === url);

  if (!exists) {
    history.unshift({
      title,
      url,
      date: new Date().toLocaleString()
    });
  }

  history = history.slice(0, 80);
  localStorage.setItem("novexHistory", JSON.stringify(history));
  renderHistory();
}

function addFavorite() {
  const url = urlInput.value.trim();
  if (!url) return;

  const tab = currentTab();
  const title = tab?.title || url;
  const exists = favorites.find(item => item.url === url);

  if (!exists) {
    favorites.unshift({ title, url });
    favoriteBtn.textContent = "★";
  } else {
    favorites = favorites.filter(item => item.url !== url);
    favoriteBtn.textContent = "☆";
  }

  localStorage.setItem("novexFavorites", JSON.stringify(favorites));
  renderFavorites();
}

function updateFavoriteIcon(url) {
  const exists = favorites.find(item => item.url === url);
  favoriteBtn.textContent = exists ? "★" : "☆";
}

function renderFavorites() {
  favoritesList.innerHTML = "";

  if (favorites.length === 0) {
    favoritesList.innerHTML = `<div class="empty-box">Todavía no tienes favoritos. Puedes importarlos o tocar la estrella ☆.</div>`;
    return;
  }

  favorites.forEach(item => {
    const div = document.createElement("div");
    div.className = "panel-item";
    div.innerHTML = `
      <div class="panel-item-title">${item.title}</div>
      <div class="panel-item-url">${item.url}</div>
    `;

    div.addEventListener("click", () => showBrowser(item.url));
    favoritesList.appendChild(div);
  });
}

function renderHistory() {
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = `<div class="empty-box">Todavía no hay historial.</div>`;
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "panel-item";
    div.innerHTML = `
      <div class="panel-item-title">${item.title}</div>
      <div class="panel-item-url">${item.url}</div>
      <div class="panel-item-url">${item.date}</div>
    `;

    div.addEventListener("click", () => showBrowser(item.url));
    historyList.appendChild(div);
  });
}

function showFavoritesPanel() {
  hidePanels();
  hideAllWebviews();
  renderFavorites();
  favoritesPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(favoritesSideBtn);
}

function showHistoryPanel() {
  hidePanels();
  hideAllWebviews();
  renderHistory();
  historyPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(historySideBtn);
}

function showDownloadsPanel() {
  hidePanels();
  hideAllWebviews();
  downloadsPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(downloadsSideBtn);
}

function showGamesPanel() {
  hidePanels();
  hideAllWebviews();
  gamesPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(gamesSideBtn);
}

function showSecurityPanel() {
  hidePanels();
  hideAllWebviews();
  securityPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(securitySideBtn);
}

function showSettingsPanel() {
  hidePanels();
  hideAllWebviews();
  settingsPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(settingsSideBtn);
}

function showProfilePanel() {
  hidePanels();
  hideAllWebviews();
  profilePanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(profileSideBtn);
}

function showImportPanel() {
  hidePanels();
  hideAllWebviews();
  importPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(null);

  if (importResult) {
    importResult.innerHTML = "Selecciona un navegador y presiona importar.";
  }
}

async function showCookiesPanel() {
  hidePanels();
  hideAllWebviews();
  cookiesPanel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(null);
  await updateCookieSummary();
}

function toggleMoreMenu() {
  moreMenu.classList.toggle("hidden");
}

function applyStatusbarPreference() {
  if (statusbarHidden) {
    document.body.classList.add("statusbar-hidden");
    if (statusbar) statusbar.classList.add("statusbar-hidden");
    if (menuToggleStatusbar) menuToggleStatusbar.textContent = "Mostrar barra inferior";
    if (toggleStatusbarBtn) toggleStatusbarBtn.textContent = "Mostrar barra inferior";
  } else {
    document.body.classList.remove("statusbar-hidden");
    if (statusbar) statusbar.classList.remove("statusbar-hidden");
    if (menuToggleStatusbar) menuToggleStatusbar.textContent = "Ocultar barra inferior";
    if (toggleStatusbarBtn) toggleStatusbarBtn.textContent = "Ocultar barra inferior";
  }
}

function toggleStatusbar() {
  statusbarHidden = !statusbarHidden;
  localStorage.setItem("novexStatusbarHidden", String(statusbarHidden));
  applyStatusbarPreference();

  if (settingsMessage) {
    settingsMessage.textContent = statusbarHidden
      ? "✅ Barra inferior oculta."
      : "✅ Barra inferior visible.";
  }
}

function applyRamSaverPreference() {
  if (menuToggleRamSaver) {
    menuToggleRamSaver.textContent = ramSaverEnabled ? "Desactivar ahorro de RAM" : "Activar ahorro de RAM";
  }

  if (toggleRamSaverBtn) {
    toggleRamSaverBtn.textContent = ramSaverEnabled ? "Desactivar ahorro de RAM" : "Activar ahorro de RAM";
  }

  if (ramSaverStatus) {
    ramSaverStatus.textContent = ramSaverEnabled ? "RAM ahorro 💤" : "RAM normal";
  }
}

function toggleRamSaver() {
  ramSaverEnabled = !ramSaverEnabled;
  localStorage.setItem("novexRamSaver", String(ramSaverEnabled));
  applyRamSaverPreference();

  if (ramSaverEnabled) {
    unloadInactiveTabsIfNeeded();
    if (settingsMessage) settingsMessage.textContent = "💤 Ahorro de RAM activado.";
  } else {
    tabs.forEach(tab => {
      tab.unloaded = false;
    });
    if (settingsMessage) settingsMessage.textContent = "✅ Ahorro de RAM desactivado.";
  }

  renderTabs();
}

function unloadInactiveTabsIfNeeded() {
  if (!ramSaverEnabled) return;

  tabs.forEach(tab => {
    if (tab.id === activeTabId) return;
    if (!tab.url) return;
    if (tab.unloaded) return;

    tab.webview.src = "about:blank";
    tab.unloaded = true;
  });

  renderTabs();
}

function mergeImportedFavorites(imported) {
  let count = 0;
  const seen = new Set(favorites.map(item => item.url));

  imported.forEach(item => {
    if (!item || !item.url || seen.has(item.url)) return;

    seen.add(item.url);
    favorites.unshift({
      title: item.title || item.url,
      url: item.url
    });

    count++;
  });

  localStorage.setItem("novexFavorites", JSON.stringify(favorites));
  renderFavorites();
  return count;
}

async function importFromSelectedBrowser() {
  const browserKey = browserImportSelect.value;
  const browserName = browserImportSelect.options[browserImportSelect.selectedIndex].textContent;

  importResult.innerHTML = `Buscando favoritos en <b>${browserName}</b>...`;

  try {
    const result = await window.novexImport.browserBookmarks(browserKey);

    if (!result.ok) {
      importResult.innerHTML = `⚠ ${result.message}`;
      return;
    }

    const added = mergeImportedFavorites(result.bookmarks || []);

    importResult.innerHTML = `
      ✅ Importación completada desde <b>${browserName}</b>.<br>
      Favoritos encontrados: <b>${result.bookmarks.length}</b><br>
      Favoritos nuevos agregados: <b>${added}</b>
    `;
  } catch (error) {
    importResult.innerHTML = `❌ No pude importar desde ${browserName}. ${error.message || ""}`;
  }
}

async function updateCookieSummary() {
  try {
    const result = await window.novexCookies.getSummary();

    if (!result.ok) {
      cookiesMessage.textContent = "⚠ " + result.message;
      return;
    }

    cookieTotal.textContent = String(result.totalCookies);
    cookieDomains.textContent = String(result.totalDomains);
    cookiesMessage.textContent = "✅ Conteo de cookies actualizado.";
  } catch (error) {
    cookiesMessage.textContent = "❌ No pude leer las cookies.";
  }
}

async function clearCookies() {
  const result = await window.novexCookies.clearCookies();
  cookiesMessage.textContent = result.ok ? "✅ " + result.message : "❌ " + result.message;
  await updateCookieSummary();
}

async function clearSiteData() {
  const result = await window.novexCookies.clearSiteData();
  cookiesMessage.textContent = result.ok ? "✅ " + result.message : "❌ " + result.message;
  await updateCookieSummary();
}

async function updateSystemStats() {
  try {
    const stats = await window.novexSystem.getStats();

    if (cpuStatus) cpuStatus.textContent = `CPU: ${stats.cpu}%`;
    if (ramStatus) ramStatus.textContent = `RAM: ${formatBytes(stats.ramUsed)} / ${formatBytes(stats.ramTotal)}`;
    if (appRamStatus) appRamStatus.textContent = `Novex: ${formatBytes(stats.appRam)}`;
  } catch (error) {
    if (cpuStatus) cpuStatus.textContent = "CPU: --%";
  }

  if (timeStatus) {
    timeStatus.textContent = `UTC-4: ${formatUTCMinus4()}`;
  }
}

function setupWebviewEvents(tab) {
  tab.webview.addEventListener("did-navigate", event => {
    if (event.url === "about:blank") return;

    tab.url = event.url;

    if (tab.id === activeTabId) {
      urlInput.value = event.url;
      updateFavoriteIcon(event.url);
    }

    addToHistory(event.url, tab.title);
    renderTabs();
    saveSession();
  });

  tab.webview.addEventListener("did-navigate-in-page", event => {
    if (event.url === "about:blank") return;

    tab.url = event.url;

    if (tab.id === activeTabId) {
      urlInput.value = event.url;
      updateFavoriteIcon(event.url);
    }

    renderTabs();
    saveSession();
  });

  tab.webview.addEventListener("page-title-updated", event => {
    if (tab.unloaded) return;

    tab.title = event.title || "Novex Browser";

    if (tab.id === activeTabId) {
      document.title = tab.title + " - Novex Browser";
    }

    if (tab.url) addToHistory(tab.url, tab.title);

    renderTabs();
    saveSession();
  });
}

tabbar.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault();
    tabbar.scrollLeft += event.deltaY;
  }
}, { passive: false });

minimizeBtn.addEventListener("click", () => window.novexWindow.minimize());
maximizeBtn.addEventListener("click", () => window.novexWindow.maximize());
closeBtn.addEventListener("click", () => {
  saveSession();
  window.novexWindow.close();
});

goBtn.addEventListener("click", navigateFromUrlBar);

urlInput.addEventListener("keydown", event => {
  if (event.key === "Enter") navigateFromUrlBar();
});

homeSearchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") navigateFromHomeSearch();
});

backBtn.addEventListener("click", () => {
  const webview = currentWebview();
  if (webview && currentTab()?.url && webview.canGoBack()) webview.goBack();
});

forwardBtn.addEventListener("click", () => {
  const webview = currentWebview();
  if (webview && currentTab()?.url && webview.canGoForward()) webview.goForward();
});

reloadBtn.addEventListener("click", () => {
  const webview = currentWebview();
  if (webview && currentTab()?.url) webview.reload();
});

homeBtn.addEventListener("click", () => showStartPageForTab());
homeSideBtn.addEventListener("click", () => showStartPageForTab());

favoritesSideBtn.addEventListener("click", showFavoritesPanel);
historySideBtn.addEventListener("click", showHistoryPanel);
downloadsSideBtn.addEventListener("click", showDownloadsPanel);
gamesSideBtn.addEventListener("click", showGamesPanel);
securitySideBtn.addEventListener("click", showSecurityPanel);
settingsSideBtn.addEventListener("click", showSettingsPanel);
profileSideBtn.addEventListener("click", showProfilePanel);

whatsappSideBtn.addEventListener("click", () => showBrowser("https://web.whatsapp.com"));
spotifySideBtn.addEventListener("click", () => showBrowser("https://open.spotify.com"));
robloxSideBtn.addEventListener("click", () => showBrowser("https://www.roblox.com"));

favoriteBtn.addEventListener("click", addFavorite);
newTabBtn.addEventListener("click", () => createTab());

menuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMoreMenu();
});

menuNewTab.addEventListener("click", () => {
  moreMenu.classList.add("hidden");
  createTab();
});

menuImport.addEventListener("click", () => {
  moreMenu.classList.add("hidden");
  showImportPanel();
});

menuCookies.addEventListener("click", () => {
  moreMenu.classList.add("hidden");
  showCookiesPanel();
});

menuFavorites.addEventListener("click", showFavoritesPanel);
menuHistory.addEventListener("click", showHistoryPanel);
menuSettings.addEventListener("click", showSettingsPanel);

menuToggleStatusbar.addEventListener("click", () => {
  moreMenu.classList.add("hidden");
  toggleStatusbar();
});

menuToggleRamSaver.addEventListener("click", () => {
  moreMenu.classList.add("hidden");
  toggleRamSaver();
});

if (hideStatusbarQuick) hideStatusbarQuick.addEventListener("click", toggleStatusbar);
if (toggleStatusbarBtn) toggleStatusbarBtn.addEventListener("click", toggleStatusbar);
if (toggleRamSaverBtn) toggleRamSaverBtn.addEventListener("click", toggleRamSaver);

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.setItem("novexHistory", JSON.stringify(history));
  renderHistory();
  settingsMessage.textContent = "✅ Historial borrado correctamente.";
});

clearFavoritesBtn.addEventListener("click", () => {
  favorites = [];
  localStorage.setItem("novexFavorites", JSON.stringify(favorites));
  renderFavorites();
  settingsMessage.textContent = "✅ Favoritos borrados correctamente.";
});

openImportBtnSettings.addEventListener("click", showImportPanel);
openCookiesBtnSettings.addEventListener("click", showCookiesPanel);

if (importBrowserBtn) importBrowserBtn.addEventListener("click", importFromSelectedBrowser);
if (refreshCookiesBtn) refreshCookiesBtn.addEventListener("click", updateCookieSummary);
if (clearCookiesBtn) clearCookiesBtn.addEventListener("click", clearCookies);
if (clearSiteDataBtn) clearSiteDataBtn.addEventListener("click", clearSiteData);

document.addEventListener("click", (event) => {
  if (moreMenu && !moreMenu.contains(event.target) && event.target !== menuBtn) {
    moreMenu.classList.add("hidden");
  }
});

document.querySelectorAll(".launch-url").forEach(item => {
  item.addEventListener("click", () => showBrowser(item.dataset.url));
});

quickCards.forEach(card => {
  card.addEventListener("click", () => showBrowser(card.dataset.url));
});

window.addEventListener("beforeunload", saveSession);

restoreSession();
applyStatusbarPreference();
applyRamSaverPreference();
updateSystemStats();
setInterval(updateSystemStats, 2000);
renderFavorites();
renderHistory();


// ================================
// NOVEX PRO IDEAS - funciones nuevas
// ================================
const quickSearchSideBtn = document.getElementById("quickSearchSideBtn");
const tabManagerSideBtn = document.getElementById("tabManagerSideBtn");
const notesSideBtn = document.getElementById("notesSideBtn");
const proFeaturesSideBtn = document.getElementById("proFeaturesSideBtn");

const quickSearchPanel = document.getElementById("quickSearchPanel");
const tabManagerPanel = document.getElementById("tabManagerPanel");
const notesPanel = document.getElementById("notesPanel");
const proFeaturesPanel = document.getElementById("proFeaturesPanel");
const summaryPanel = document.getElementById("summaryPanel");
const screenshotPanel = document.getElementById("screenshotPanel");

const quickSearchInput = document.getElementById("quickSearchInput");
const refreshTabManagerBtn = document.getElementById("refreshTabManagerBtn");
const groupTabsBtn = document.getElementById("groupTabsBtn");
const closeInactiveTabsBtn = document.getElementById("closeInactiveTabsBtn");
const tabManagerList = document.getElementById("tabManagerList");

const quickNotesArea = document.getElementById("quickNotesArea");
const saveNotesBtn = document.getElementById("saveNotesBtn");
const clearNotesBtn = document.getElementById("clearNotesBtn");
const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");

const featureGrid = document.getElementById("featureGrid");
const summaryResult = document.getElementById("summaryResult");
const screenshotPreview = document.getElementById("screenshotPreview");
const captureAgainBtn = document.getElementById("captureAgainBtn");

const menuReadMode = document.getElementById("menuReadMode");
const menuTranslatePage = document.getElementById("menuTranslatePage");
const menuLocalSummary = document.getElementById("menuLocalSummary");
const menuTemporaryTab = document.getElementById("menuTemporaryTab");
const menuIncognitoTab = document.getElementById("menuIncognitoTab");
const menuTabManager = document.getElementById("menuTabManager");
const menuFocusMode = document.getElementById("menuFocusMode");
const menuMuteTab = document.getElementById("menuMuteTab");
const menuPipVideo = document.getElementById("menuPipVideo");
const menuScreenshot = document.getElementById("menuScreenshot");
const menuProFeatures = document.getElementById("menuProFeatures");

const toggleBatterySaverBtn = document.getElementById("toggleBatterySaverBtn");
const openProFeaturesBtn = document.getElementById("openProFeaturesBtn");
const batterySaverStatus = document.getElementById("batterySaverStatus");

let batterySaverEnabled = localStorage.getItem("novexBatterySaver") === "true";
let focusModeEnabled = localStorage.getItem("novexFocusMode") === "true";
let todos = JSON.parse(localStorage.getItem("novexTodos") || "[]");

function hideNovexProPanels() {
  [quickSearchPanel, tabManagerPanel, notesPanel, proFeaturesPanel, summaryPanel, screenshotPanel].forEach(panel => {
    if (panel) panel.classList.add("hidden");
  });
}

function showNovexPanel(panel, activeButton = null) {
  hidePanels();
  hideAllWebviews();
  hideNovexProPanels();

  if (panel) panel.classList.remove("hidden");
  urlInput.value = "";
  setActiveSideButton(activeButton);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return "Sin dominio";
  }
}

function isSuspiciousUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    const badWords = ["login-", "secure-", "verify-", "account-update", "free-gift", "nitro-free", "robux-free", "whatsapp-security"];
    const fakeBrands = [
      "g00gle",
      "go0gle",
      "y0utube",
      "faceb00k",
      "paypa1",
      "micros0ft",
      "r0blox",
      "whatsappp"
    ];

    if (parsed.protocol !== "https:" && !host.includes("localhost")) return true;
    if (badWords.some(word => host.includes(word))) return true;
    if (fakeBrands.some(word => host.includes(word))) return true;

    return false;
  } catch (error) {
    return false;
  }
}

const originalShowBrowserNovex = showBrowser;
showBrowser = function(url) {
  if (isSuspiciousUrl(url)) {
    const ok = confirm("⚠ Aviso de seguridad Novex: esta web parece sospechosa o no usa HTTPS. ¿Quieres abrirla de todos modos?");
    if (!ok) return;
  }

  originalShowBrowserNovex(url);
};

function runQuickSearch(engine) {
  const q = (quickSearchInput.value || "").trim();
  if (!q) return;

  const encoded = encodeURIComponent(q);
  const urls = {
    google: `https://www.google.com/search?q=${encoded}`,
    youtube: `https://www.youtube.com/results?search_query=${encoded}`,
    wikipedia: `https://es.wikipedia.org/wiki/Special:Search?search=${encoded}`,
    roblox: `https://www.roblox.com/discover/?Keyword=${encoded}`,
    spotify: `https://open.spotify.com/search/${encoded}`
  };

  showBrowser(urls[engine] || urls.google);
}

function renderTabManager(grouped = false) {
  if (!tabManagerList) return;

  tabManagerList.innerHTML = "";

  if (!grouped) {
    tabs.forEach(tab => {
      const div = document.createElement("div");
      div.className = "panel-item";
      div.innerHTML = `
        <div class="panel-item-title">${tab.title || "Nueva pestaña"}</div>
        <div class="panel-item-url">${tab.url || "Inicio"}</div>
        <div class="actions-row">
          <button class="settings-action" data-action="open">Abrir</button>
          <button class="settings-action danger-soft" data-action="close">Cerrar</button>
        </div>
      `;

      div.querySelector('[data-action="open"]').addEventListener("click", (event) => {
        event.stopPropagation();
        switchToTab(tab.id);
      });

      div.querySelector('[data-action="close"]').addEventListener("click", (event) => {
        event.stopPropagation();
        closeTab(tab.id);
        renderTabManager(false);
      });

      tabManagerList.appendChild(div);
    });

    return;
  }

  const groups = {};
  tabs.forEach(tab => {
    const domain = tab.url ? getDomain(tab.url) : "Inicio";
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(tab);
  });

  Object.entries(groups).forEach(([domain, groupTabs]) => {
    const div = document.createElement("div");
    div.className = "panel-item";
    div.innerHTML = `
      <div class="panel-item-title">📁 ${domain}</div>
      <div class="panel-item-url">${groupTabs.length} pestaña(s)</div>
    `;

    groupTabs.forEach(tab => {
      const item = document.createElement("div");
      item.className = "panel-item-url";
      item.textContent = "• " + (tab.title || tab.url || "Nueva pestaña");
      item.style.cursor = "pointer";
      item.addEventListener("click", () => switchToTab(tab.id));
      div.appendChild(item);
    });

    tabManagerList.appendChild(div);
  });
}

function showTabManager() {
  showNovexPanel(tabManagerPanel, tabManagerSideBtn);
  renderTabManager(false);
}

function closeInactiveTabs() {
  const keepId = activeTabId;
  [...tabs].forEach(tab => {
    if (tab.id !== keepId) closeTab(tab.id);
  });
  renderTabManager(false);
}

function createTemporaryTab() {
  createTab("https://www.google.com");
  const tempId = activeTabId;
  alert("⏳ Pestaña temporal creada. Se cerrará sola en 10 minutos.");

  setTimeout(() => {
    const exists = tabs.some(tab => tab.id === tempId);
    if (exists) closeTab(tempId);
  }, 10 * 60 * 1000);
}

function createIncognitoTab() {
  const id = "tab-" + tabCounter++;
  const webview = document.createElement("webview");

  webview.className = "webview-hidden";
  webview.setAttribute("allowpopups", "");
  webview.setAttribute("partition", "novex-incognito-" + Date.now());
  webview.src = startUrl;

  const tab = {
    id,
    title: "Incógnito",
    url: startUrl,
    unloaded: false,
    webview
  };

  tabs.push(tab);
  webviewsContainer.appendChild(webview);
  setupWebviewEvents(tab);
  switchToTab(id);
  renderTabs();

  alert("🕶 Pestaña incógnita creada. Sus cookies no se guardan en la sesión principal.");
}

function applyReadMode() {
  const tab = currentTab();
  if (!tab || !tab.webview || !tab.url) return;

  const css = `
    body {
      background: #101018 !important;
      color: #f4f4f5 !important;
      font-size: 18px !important;
      line-height: 1.7 !important;
    }
    article, main, #content, .content, .post, .entry-content {
      max-width: 860px !important;
      margin: 40px auto !important;
      padding: 24px !important;
      background: rgba(255,255,255,0.04) !important;
      border-radius: 20px !important;
    }
    aside, nav, footer, header, .ad, [class*="ad"], [id*="ad"], iframe {
      display: none !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 14px !important;
    }
  `;

  tab.webview.insertCSS(css);
  alert("📖 Modo lectura aplicado a esta página.");
}

function translateCurrentPage() {
  const tab = currentTab();
  if (!tab || !tab.url) return;

  const url = "https://translate.google.com/translate?sl=auto&tl=es&u=" + encodeURIComponent(tab.url);
  showBrowser(url);
}

async function summarizeCurrentPage() {
  const tab = currentTab();
  if (!tab || !tab.webview || !tab.url) return;

  showNovexPanel(summaryPanel, null);
  summaryResult.textContent = "Leyendo texto de la página...";

  try {
    const text = await tab.webview.executeJavaScript(`
      (() => {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll('script,style,nav,footer,aside,iframe').forEach(n => n.remove());
        return clone.innerText.replace(/\\s+/g, ' ').trim().slice(0, 4500);
      })();
    `, true);

    const sentences = String(text).split(/(?<=[.!?])\\s+/).filter(s => s.length > 40).slice(0, 7);
    summaryResult.textContent = sentences.length
      ? "Resumen rápido local:\\n\\n" + sentences.map((s, i) => `${i + 1}. ${s}`).join("\\n\\n")
      : "No encontré suficiente texto para resumir.";
  } catch (error) {
    summaryResult.textContent = "No pude leer esta página.";
  }
}

function toggleFocusMode() {
  focusModeEnabled = !focusModeEnabled;
  localStorage.setItem("novexFocusMode", String(focusModeEnabled));
  document.body.classList.toggle("focus-mode", focusModeEnabled);
}

function toggleBatterySaver() {
  batterySaverEnabled = !batterySaverEnabled;
  localStorage.setItem("novexBatterySaver", String(batterySaverEnabled));
  document.body.classList.toggle("battery-saver", batterySaverEnabled);

  if (batterySaverEnabled && !ramSaverEnabled) {
    toggleRamSaver();
  }

  updateBatterySaverUi();
}

function updateBatterySaverUi() {
  document.body.classList.toggle("battery-saver", batterySaverEnabled);

  if (batterySaverStatus) {
    batterySaverStatus.textContent = batterySaverEnabled ? "Batería: ON" : "Batería: OFF";
  }

  if (toggleBatterySaverBtn) {
    toggleBatterySaverBtn.textContent = batterySaverEnabled ? "Desactivar ahorro de batería" : "Activar ahorro de batería";
  }
}

function toggleMuteCurrentTab() {
  const tab = currentTab();
  if (!tab || !tab.webview) return;

  tab.muted = !tab.muted;

  try {
    tab.webview.setAudioMuted(tab.muted);
    alert(tab.muted ? "🔇 Pestaña silenciada." : "🔊 Sonido activado.");
  } catch (error) {
    alert("No pude cambiar el sonido de esta pestaña.");
  }
}

function requestPictureInPicture() {
  const tab = currentTab();
  if (!tab || !tab.webview) return;

  tab.webview.executeJavaScript(`
    (async () => {
      const video = document.querySelector('video');
      if (!video) return 'No encontré video en esta página.';
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return 'Video flotante cerrado.';
      }
      await video.requestPictureInPicture();
      return 'Video flotante activado.';
    })();
  `, true).then(message => alert(message)).catch(() => {
    alert("No pude activar video flotante en esta página.");
  });
}

async function captureCurrentPage() {
  const tab = currentTab();
  if (!tab || !tab.webview) return;

  showNovexPanel(screenshotPanel, null);
  if (screenshotPreview) {
    screenshotPreview.style.display = "none";
  }

  try {
    const image = await tab.webview.capturePage();
    if (screenshotPreview) {
      screenshotPreview.src = image.toDataURL();
      screenshotPreview.style.display = "block";
    }
  } catch (error) {
    alert("No pude tomar captura de esta página.");
  }
}

function renderTodos() {
  if (!todoList) return;

  todoList.innerHTML = "";
  todos.forEach((todo, index) => {
    const div = document.createElement("div");
    div.className = "todo-item" + (todo.done ? " done" : "");
    div.innerHTML = `<span>${todo.text}</span><button>${todo.done ? "Reabrir" : "Hecho"}</button>`;

    div.querySelector("button").addEventListener("click", () => {
      todos[index].done = !todos[index].done;
      localStorage.setItem("novexTodos", JSON.stringify(todos));
      renderTodos();
    });

    todoList.appendChild(div);
  });
}

function loadNotesPanel() {
  if (quickNotesArea) {
    quickNotesArea.value = localStorage.getItem("novexQuickNotes") || "";
  }
  renderTodos();
}

function renderFeatures() {
  if (!featureGrid) return;

  const features = [
    ["Bloqueador de anuncios integrado", "Implementado con bloqueo básico y CSS visual.", "done"],
    ["Bloqueador de rastreadores", "Base incluida en el bloqueador.", "base"],
    ["Modo ahorro de batería", "Reduce animaciones y activa ahorro de RAM.", "done"],
    ["Modo lectura limpio", "Disponible desde el menú de 3 puntos.", "done"],
    ["Traductor automático de páginas", "Abre la página usando Google Translate.", "done"],
    ["Resumidor de páginas con IA", "Resumen local incluido. IA real requiere API.", "base"],
    ["Búsqueda rápida en barra lateral", "Panel lateral agregado.", "done"],
    ["Captura de pantalla con edición", "Captura agregada; edición avanzada pendiente.", "base"],
    ["Administrador de pestañas inteligente", "Panel de pestañas agregado.", "done"],
    ["Agrupar pestañas por temas", "Agrupación por dominio disponible.", "done"],
    ["Pestañas temporales", "Se cierran solas en 10 minutos.", "done"],
    ["Protección contra phishing", "Aviso básico para webs sospechosas.", "base"],
    ["Aviso de webs falsas", "Incluido con detector básico.", "base"],
    ["Escáner de descargas maliciosas", "Pendiente; requiere base de seguridad.", "future"],
    ["Control de permisos por sitio", "Base de permisos incluida.", "base"],
    ["Bloqueo de ventanas emergentes", "Popups externos bloqueados.", "done"],
    ["Múltiples perfiles", "Estructura pendiente.", "future"],
    ["Perfil estudio/trabajo/juegos", "Pendiente como sistema real.", "future"],
    ["Temas personalizables", "Base visual lista; panel completo pendiente.", "base"],
    ["Modo oscuro/claro automático", "Pendiente.", "future"],
    ["Cambiar fuentes y tamaño", "Pendiente.", "future"],
    ["Zoom inteligente por sitio", "Pendiente.", "future"],
    ["Atajos personalizables", "Pendiente.", "future"],
    ["Comandos rápidos internos", "Base con menú y búsqueda rápida.", "base"],
    ["Notas rápidas", "Panel de notas agregado.", "done"],
    ["Lista de tareas", "Panel de tareas agregado.", "done"],
    ["Modo concentrado", "Oculta barra lateral y barra inferior.", "done"],
    ["Silenciar pestañas automáticamente", "Silenciar manual agregado.", "base"],
    ["Video en ventana flotante", "Picture-in-picture agregado.", "done"],
    ["Descargas organizadas", "Pendiente.", "future"],
    ["Reanudar descargas", "Pendiente.", "future"],
    ["Formularios sin pérdida", "Cookies/sesión ayudan; sistema completo pendiente.", "base"],
    ["Historial del portapapeles", "Pendiente por privacidad.", "future"],
    ["Calendario", "Pendiente.", "future"],
    ["Panel de extensiones", "Pendiente.", "future"],
    ["Modo offline", "Pendiente.", "future"],
    ["Pantalla dividida", "Pendiente.", "future"],
    ["Asistente inteligente", "Pendiente; requiere IA/API.", "future"],
    ["Previsualización de pestañas", "Pendiente.", "future"],
    ["Historial visual con miniaturas", "Pendiente.", "future"],
    ["Marcadores inteligentes", "Base de favoritos lista.", "base"],
    ["Sincronización entre dispositivos", "Requiere servidor/cuenta.", "future"],
    ["Gestor de contraseñas", "Pendiente por seguridad.", "future"],
    ["Generador de contraseñas", "Pendiente.", "future"],
    ["Autorrelleno mejorado", "Pendiente.", "future"],
    ["Modo incógnito más privado", "Pestaña incógnita temporal agregada.", "done"]
  ];

  featureGrid.innerHTML = "";
  features.forEach(([title, desc, status]) => {
    const div = document.createElement("div");
    div.className = "feature-card";
    const label = status === "done" ? "Implementado" : status === "base" ? "Base agregada" : "Próximamente";
    div.innerHTML = `<h3>${title}</h3><p>${desc}</p><span class="feature-badge ${status}">${label}</span>`;
    featureGrid.appendChild(div);
  });
}

function showProFeatures() {
  showNovexPanel(proFeaturesPanel, proFeaturesSideBtn);
  renderFeatures();
}

if (quickSearchSideBtn) quickSearchSideBtn.addEventListener("click", () => showNovexPanel(quickSearchPanel, quickSearchSideBtn));
if (tabManagerSideBtn) tabManagerSideBtn.addEventListener("click", showTabManager);
if (notesSideBtn) notesSideBtn.addEventListener("click", () => { showNovexPanel(notesPanel, notesSideBtn); loadNotesPanel(); });
if (proFeaturesSideBtn) proFeaturesSideBtn.addEventListener("click", showProFeatures);

document.querySelectorAll(".quick-search-engine").forEach(btn => {
  btn.addEventListener("click", () => runQuickSearch(btn.dataset.engine));
});

if (quickSearchInput) {
  quickSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runQuickSearch("google");
  });
}

if (refreshTabManagerBtn) refreshTabManagerBtn.addEventListener("click", () => renderTabManager(false));
if (groupTabsBtn) groupTabsBtn.addEventListener("click", () => renderTabManager(true));
if (closeInactiveTabsBtn) closeInactiveTabsBtn.addEventListener("click", closeInactiveTabs);

if (saveNotesBtn) saveNotesBtn.addEventListener("click", () => {
  localStorage.setItem("novexQuickNotes", quickNotesArea.value || "");
  alert("Notas guardadas.");
});

if (clearNotesBtn) clearNotesBtn.addEventListener("click", () => {
  quickNotesArea.value = "";
  localStorage.removeItem("novexQuickNotes");
});

if (addTodoBtn) addTodoBtn.addEventListener("click", () => {
  const text = (todoInput.value || "").trim();
  if (!text) return;
  todos.push({ text, done: false });
  localStorage.setItem("novexTodos", JSON.stringify(todos));
  todoInput.value = "";
  renderTodos();
});

if (menuReadMode) menuReadMode.addEventListener("click", () => { moreMenu.classList.add("hidden"); applyReadMode(); });
if (menuTranslatePage) menuTranslatePage.addEventListener("click", () => { moreMenu.classList.add("hidden"); translateCurrentPage(); });
if (menuLocalSummary) menuLocalSummary.addEventListener("click", () => { moreMenu.classList.add("hidden"); summarizeCurrentPage(); });
if (menuTemporaryTab) menuTemporaryTab.addEventListener("click", () => { moreMenu.classList.add("hidden"); createTemporaryTab(); });
if (menuIncognitoTab) menuIncognitoTab.addEventListener("click", () => { moreMenu.classList.add("hidden"); createIncognitoTab(); });
if (menuTabManager) menuTabManager.addEventListener("click", () => { moreMenu.classList.add("hidden"); showTabManager(); });
if (menuFocusMode) menuFocusMode.addEventListener("click", () => { moreMenu.classList.add("hidden"); toggleFocusMode(); });
if (menuMuteTab) menuMuteTab.addEventListener("click", () => { moreMenu.classList.add("hidden"); toggleMuteCurrentTab(); });
if (menuPipVideo) menuPipVideo.addEventListener("click", () => { moreMenu.classList.add("hidden"); requestPictureInPicture(); });
if (menuScreenshot) menuScreenshot.addEventListener("click", () => { moreMenu.classList.add("hidden"); captureCurrentPage(); });
if (menuProFeatures) menuProFeatures.addEventListener("click", () => { moreMenu.classList.add("hidden"); showProFeatures(); });

if (toggleBatterySaverBtn) toggleBatterySaverBtn.addEventListener("click", toggleBatterySaver);
if (openProFeaturesBtn) openProFeaturesBtn.addEventListener("click", showProFeatures);
if (captureAgainBtn) captureAgainBtn.addEventListener("click", captureCurrentPage);

if (window.novexEvents) {
  window.novexEvents.onOpenUrlRequest((url) => {
    createTab(url);
  });
}

document.body.classList.toggle("focus-mode", focusModeEnabled);
updateBatterySaverUi();
renderFeatures();
