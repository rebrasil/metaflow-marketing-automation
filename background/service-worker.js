// ==========================================================
// ⚙️ SERVICE WORKER v2.0 — MetaFlow Marketing Automation
// Message relay, alarm scheduling, tab management, CSV export
// ==========================================================

const state = { tabs: new Map() };

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// ── Message Hub ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const { type } = msg;

  // --- Broadcast from content scripts → popup ---
  if (['LOG', 'STATUS_UPDATE', 'CAPTCHA_DETECTED', 'SCRAPED_DATA',
       'WA_STATS', 'CSV_IMPORTED'].includes(type)) {
    chrome.runtime.sendMessage(msg).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  // --- Command from popup → content script ---
  if (type === 'COMMAND') {
    const { tabId, platform, command, extra } = msg;
    if (!tabId) { sendResponse({ error: 'No tabId' }); return true; }
    chrome.tabs.sendMessage(tabId, { platform, command, ...extra }, (resp) => {
      sendResponse(chrome.runtime.lastError ? { error: chrome.runtime.lastError.message } : (resp || { ok: true }));
    });
    return true;
  }

  // --- Query active platform tab ---
  if (type === 'GET_ACTIVE_TAB') {
    const urlMap = {
      instagram: ['*://*.instagram.com/*', '*://instagram.com/*'],
      facebook:  ['*://*.facebook.com/*', '*://facebook.com/*'],
      whatsapp:  ['*://web.whatsapp.com/*'],
    };
    const pattern = urlMap[msg.platform];
    if (!pattern) { sendResponse({ tabId: null }); return true; }
    chrome.tabs.query({ url: pattern }, (tabs) => {
      sendResponse({ tabId: tabs.length ? tabs[0].id : null, tabUrl: tabs[0]?.url });
    });
    return true;
  }

  // --- Get all platform tabs ---
  if (type === 'GET_ALL_TABS') {
    const results = {};
    const platforms = ['instagram', 'facebook', 'whatsapp'];
    const urlMap = {
      instagram: ['*://*.instagram.com/*', '*://instagram.com/*'],
      facebook:  ['*://*.facebook.com/*', '*://facebook.com/*'],
      whatsapp:  ['*://web.whatsapp.com/*'],
    };
    let pending = platforms.length;
    platforms.forEach(p => {
      chrome.tabs.query({ url: urlMap[p] }, (tabs) => {
        results[p] = tabs.length ? tabs[0].id : null;
        if (--pending === 0) sendResponse(results);
      });
    });
    return true;
  }

  // --- Schedule alarm ---
  if (type === 'SET_ALARM') {
    const { name, delayInMinutes } = msg;
    chrome.alarms.create(`metaflow_${name}`, { delayInMinutes: Math.max(0.1, delayInMinutes) });
    sendResponse({ ok: true });
    return true;
  }

  if (type === 'CLEAR_ALARM') {
    chrome.alarms.clear(`metaflow_${msg.name}`);
    sendResponse({ ok: true });
    return true;
  }

  // --- CSV Export (download) ---
  if (type === 'EXPORT_CSV') {
    const { data, filename } = msg;
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename: filename || 'metaflow_export.csv', saveAs: false });
    sendResponse({ ok: true });
    return true;
  }

  // --- Janela Flutuante Independente (Detached Window) ---
  if (type === 'OPEN_DETACHED_WINDOW') {
    openDetachedWindow().then(() => sendResponse({ ok: true })).catch(err => sendResponse({ error: err.message }));
    return true;
  }

  sendResponse({ ok: true });
  return true;
});

// ── Gerenciador de Janela Flutuante ───────────────────────
let detachedWindowId = null;

async function openDetachedWindow() {
  if (detachedWindowId !== null) {
    try {
      const win = await chrome.windows.get(detachedWindowId);
      if (win) {
        await chrome.windows.update(detachedWindowId, { focused: true });
        return;
      }
    } catch (_) {
      detachedWindowId = null;
    }
  }

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('popup/popup.html?detached=1'),
    type: 'popup',
    width: 480,
    height: 760,
    focused: true
  });
  detachedWindowId = win.id;
}

chrome.windows.onRemoved.addListener((winId) => {
  if (winId === detachedWindowId) {
    detachedWindowId = null;
  }
});

// ── Alarm Handler ─────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const name = alarm.name;

  // Cleanup
  if (name === 'metaflow_cleanup') {
    state.tabs.forEach((val, tabId) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) state.tabs.delete(tabId);
      });
    });
    return;
  }

  // Scheduled actions
  const scheduledActions = {
    'metaflow_wa_scheduled': { platform: 'whatsapp',  command: 'START_SCHEDULED' },
    'metaflow_ig_scheduled': { platform: 'instagram', command: 'START_FOLLOW' },
    'metaflow_fb_scheduled': { platform: 'facebook',  command: 'START_LIKE' },
  };

  const action = scheduledActions[name];
  if (action) {
    const urlMap = {
      instagram: ['*://*.instagram.com/*', '*://instagram.com/*'],
      facebook:  ['*://*.facebook.com/*', '*://facebook.com/*'],
      whatsapp:  ['*://web.whatsapp.com/*'],
    };

    chrome.tabs.query({ url: urlMap[action.platform] }, (tabs) => {
      if (!tabs.length) return;
      chrome.tabs.sendMessage(tabs[0].id, { platform: action.platform, command: action.command });
    });

    // Notify popup
    chrome.runtime.sendMessage({
      type: 'LOG',
      platform: action.platform,
      message: `⏰ Alarm disparado: ${action.command}`,
      logType: 'info',
    }).catch(() => {});
  }
});

// ── Recurring cleanup alarm ───────────────────────────────
chrome.alarms.create('metaflow_cleanup', { periodInMinutes: 60 });

// ── Tab removed cleanup ───────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => state.tabs.delete(tabId));

// ── Context menu (right-click helper) ────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'metaflow_open',
    title: 'MetaFlow — Abrir Painel',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.instagram.com/*',
      'https://www.facebook.com/*',
      'https://web.whatsapp.com/*',
    ],
  });
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'metaflow_open') {
    openDetachedWindow().catch(() => chrome.action.openPopup?.());
  }
});

console.log('[MetaFlow] Service worker v2.0 iniciado ✅');
