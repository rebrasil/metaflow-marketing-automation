// ==========================================================
// 🖥️ POPUP CONTROLLER v2.5 — MetaFlow Marketing Automation
// Complete controller: 100% PT-BR, Groq AI Engine, Tabs & Accordions
// ==========================================================
'use strict';

// ── State ─────────────────────────────────────────────────
const state = {
  instagram: { tabId: null, running: {}, paused: false },
  facebook:  { tabId: null, running: {}, paused: false },
  whatsapp:  { tabId: null, running: {}, paused: false },
  scraped: {
    instagram: [],
    facebook:  [],
  },
  counters: {
    instagram: { follow: 0, unfollow: 0, like: 0, profileLike: 0, comment: 0, dm: 0, story: 0, scraper: 0 },
    facebook:  { like: 0, groupLike: 0, comment: 0, friend: 0, acceptFriend: 0, share: 0, messenger: 0, post: 0, event: 0, memberScraper: 0 },
    whatsapp:  { bulk: 0, scheduled: 0, group: 0, autoreply: 0 },
  },
  waStats: { sent: 0, delivered: 0, failed: 0, pending: 0 },
};

// ── Complete Action Map (22 actions across 3 platforms) ───
const ACTION_MAP = {
  instagram: {
    FOLLOW:      { start: 'START_FOLLOW',      stop: 'STOP_FOLLOW',      badge: 'ig-follow-badge',      count: 'ig-follow-count',      btn: 'ig-follow-btn',      key: 'follow',      startLabel: '▶ Iniciar' },
    UNFOLLOW:    { start: 'START_UNFOLLOW',    stop: 'STOP_UNFOLLOW',    badge: 'ig-unfollow-badge',    count: 'ig-unfollow-count',    btn: 'ig-unfollow-btn',    key: 'unfollow',    startLabel: '▶ Iniciar' },
    LIKE:        { start: 'START_LIKE',        stop: 'STOP_LIKE',        badge: 'ig-like-badge',        count: 'ig-like-count',        btn: 'ig-like-btn',        key: 'like',        startLabel: '▶ Iniciar' },
    PROFILELIKE: { start: 'START_PROFILELIKE', stop: 'STOP_PROFILELIKE', badge: 'ig-profilelike-badge', count: 'ig-profilelike-count', btn: 'ig-profilelike-btn', key: 'profileLike', startLabel: '▶ Iniciar' },
    COMMENT:     { start: 'START_COMMENT',     stop: 'STOP_COMMENT',     badge: 'ig-comment-badge',     count: 'ig-comment-count',     btn: 'ig-comment-btn',     key: 'comment',     startLabel: '▶ Iniciar' },
    DM:          { start: 'START_DM',          stop: 'STOP_DM',          badge: 'ig-dm-badge',          count: 'ig-dm-count',          btn: 'ig-dm-btn',          key: 'dm',          startLabel: '▶ Iniciar' },
    STORY:       { start: 'START_STORY',       stop: 'STOP_STORY',       badge: 'ig-story-badge',       count: 'ig-story-count',       btn: 'ig-story-btn',       key: 'story',       startLabel: '▶ Iniciar' },
    SCRAPER:     { start: 'START_SCRAPER',     stop: 'STOP_SCRAPER',     badge: 'ig-scraper-badge',     count: 'ig-scraper-count',     btn: 'ig-scraper-btn',     key: 'scraper',     startLabel: '▶ Iniciar' },
  },
  facebook: {
    LIKE:          { start: 'START_LIKE',          stop: 'STOP_LIKE',          badge: 'fb-like-badge',          count: 'fb-like-count',          btn: 'fb-like-btn',          key: 'like',          startLabel: '▶ Iniciar' },
    GROUPLLIKE:    { start: 'START_GROUPLLIKE',    stop: 'STOP_GROUPLLIKE',    badge: 'fb-groupllike-badge',    count: 'fb-groupllike-count',    btn: 'fb-groupllike-btn',    key: 'groupLike',     startLabel: '▶ Iniciar' },
    COMMENT:       { start: 'START_COMMENT',       stop: 'STOP_COMMENT',       badge: 'fb-comment-badge',       count: 'fb-comment-count',       btn: 'fb-comment-btn',       key: 'comment',       startLabel: '▶ Iniciar' },
    FRIEND:        { start: 'START_FRIEND',        stop: 'STOP_FRIEND',        badge: 'fb-friend-badge',        count: 'fb-friend-count',        btn: 'fb-friend-btn',        key: 'friend',        startLabel: '▶ Iniciar' },
    ACCEPTFRIEND:  { start: 'START_ACCEPTFRIEND',  stop: 'STOP_ACCEPTFRIEND',  badge: 'fb-acceptfriend-badge',  count: 'fb-acceptfriend-count',  btn: 'fb-acceptfriend-btn',  key: 'acceptFriend',  startLabel: '▶ Iniciar' },
    SHARE:         { start: 'START_SHARE',         stop: 'STOP_SHARE',         badge: 'fb-share-badge',         count: 'fb-share-count',         btn: 'fb-share-btn',         key: 'share',         startLabel: '▶ Iniciar' },
    MESSENGER:     { start: 'START_MESSENGER',     stop: 'STOP_MESSENGER',     badge: 'fb-messenger-badge',     count: 'fb-messenger-count',     btn: 'fb-messenger-btn',     key: 'messenger',     startLabel: '▶ Iniciar' },
    POST:          { start: 'START_POST',          stop: 'STOP_POST',          badge: 'fb-post-badge',          count: 'fb-post-count',          btn: 'fb-post-btn',          key: 'post',          startLabel: '▶ Iniciar' },
    EVENT:         { start: 'START_EVENT',         stop: 'STOP_EVENT',         badge: 'fb-event-badge',         count: null,                     btn: 'fb-event-btn',         key: 'event',         startLabel: '▶ Criar Evento' },
    MEMBERSCRAPER: { start: 'START_MEMBERSCRAPER', stop: 'STOP_MEMBERSCRAPER', badge: 'fb-memberscraper-badge', count: 'fb-memberscraper-count', btn: 'fb-memberscraper-btn', key: 'memberScraper', startLabel: '▶ Iniciar' },
  },
  whatsapp: {
    BULK:      { start: 'START_BULK',      stop: 'STOP_BULK',      badge: 'wa-bulk-badge',      count: 'wa-bulk-count',      btn: 'wa-bulk-btn',      key: 'bulk',      startLabel: '▶ Iniciar' },
    SCHEDULED: { start: 'START_SCHEDULED', stop: 'STOP_SCHEDULED', badge: 'wa-scheduled-badge', count: 'wa-scheduled-time',  btn: 'wa-scheduled-btn', key: 'scheduled', startLabel: '▶ Agendar' },
    GROUP:     { start: 'START_GROUP',     stop: 'STOP_GROUP',     badge: 'wa-group-badge',     count: 'wa-group-count',     btn: 'wa-group-btn',     key: 'group',     startLabel: '▶ Iniciar' },
    AUTOREPLY: { start: 'START_AUTOREPLY', stop: 'STOP_AUTOREPLY', badge: 'wa-autoreply-badge', count: 'wa-autoreply-count', btn: 'wa-autoreply-btn', key: 'autoReply', startLabel: '▶ Ativar' },
  },
};

// ── DOM Helpers ───────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function fmtTime(ts) {
  const d = new Date(ts || Date.now());
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function addLogEntry(platform, message, type = 'info') {
  const logBody = el(`log-${platform}`);
  if (!logBody) return;

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-time">${fmtTime()}</span><span class="log-msg">${escapeHtml(message)}</span>`;
  logBody.prepend(entry);

  while (logBody.children.length > 80) {
    logBody.removeChild(logBody.lastChild);
  }
}

// ── Tab Management & Status Indicators ────────────────────
const URL_PATTERNS = {
  instagram: ['*://*.instagram.com/*', '*://instagram.com/*'],
  facebook:  ['*://*.facebook.com/*', '*://facebook.com/*'],
  whatsapp:  ['*://web.whatsapp.com/*'],
};

const injectionPromises = {};

async function ensureScriptsInjected(platform, tabId) {
  if (!tabId) return false;
  const key = `${platform}_${tabId}`;
  if (injectionPromises[key]) return injectionPromises[key];

  injectionPromises[key] = (async () => {
    try {
      const files = [
        'lib/storage.js',
        'lib/selectors.js',
        'lib/captcha-detector.js',
        'lib/scheduler.js',
        'lib/ai-engine.js',
        'content/behavior-engine.js',
        `content/${platform}.js`
      ];
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: files,
      });
      await new Promise(r => setTimeout(r, 200));
      return true;
    } catch (err) {
      console.warn(`[MetaFlow] Falha ao auto-injetar em ${platform} (tab ${tabId}):`, err);
      return false;
    } finally {
      setTimeout(() => { delete injectionPromises[key]; }, 2000);
    }
  })();

  return injectionPromises[key];
}

async function checkPlatformTabs() {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    try {
      const tabs = await chrome.tabs.query({ url: pattern });
      if (tabs.length > 0) {
        state[platform].tabId = tabs[0].id;
        updatePlatformStatus(platform, true, tabs[0].id);
        queryContentScriptStatus(platform, tabs[0].id);
      } else {
        state[platform].tabId = null;
        updatePlatformStatus(platform, false, null);
      }
    } catch (e) {
      console.warn(`[MetaFlow] Erro ao consultar tab de ${platform}:`, e);
    }
  }
}

function updatePlatformStatus(platform, active, tabId) {
  const prefixMap = { instagram: 'ig', facebook: 'fb', whatsapp: 'wa' };
  const pfx = prefixMap[platform];
  if (!pfx) return;

  const dot   = el(`${pfx}-status-dot`);
  const text  = el(`${pfx}-status-text`);
  const sub   = el(`${pfx}-status-sub`);
  const chip  = el(`${pfx}-tab-chip`);
  const navDot = el(`dot-${platform}`);

  if (active) {
    const isAnyRunning = Object.values(state[platform].running || {}).some(Boolean);
    const isPaused = state[platform].paused;

    if (dot) dot.className = `status-indicator ${isPaused ? 'processing' : (isAnyRunning ? 'active' : 'active')}`;
    if (text) text.textContent = isPaused ? 'Pausado' : (isAnyRunning ? 'Automatizando...' : 'Conectado');
    if (sub)  sub.textContent  = `Aba ativa (#${tabId}) — Pronto`;
    if (chip) chip.textContent = `Tab: #${tabId}`;
    if (navDot) navDot.style.display = isAnyRunning ? 'inline-block' : 'none';
  } else {
    if (dot) dot.className = 'status-indicator inactive';
    if (text) text.textContent = 'Inativo';
    if (sub)  sub.textContent  = `Abra o ${platform.charAt(0).toUpperCase() + platform.slice(1)} para começar`;
    if (chip) chip.textContent = 'Tab: —';
    if (navDot) navDot.style.display = 'none';
  }
}

function queryContentScriptStatus(platform, tabId) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { platform, command: 'GET_STATUS' }, async (resp) => {
    if (chrome.runtime.lastError) {
      const errMsg = chrome.runtime.lastError.message || '';
      if (errMsg.includes('Receiving end does not exist') || errMsg.includes('Could not establish connection')) {
        const injected = await ensureScriptsInjected(platform, tabId);
        if (injected) {
          chrome.tabs.sendMessage(tabId, { platform, command: 'GET_STATUS' }, (r) => {
            if (!chrome.runtime.lastError && r?.running) {
              state[platform].running = r.running;
              syncActionStates(platform);
            }
          });
        }
      }
      return;
    }
    if (resp?.running) {
      state[platform].running = resp.running;
      syncActionStates(platform);
    }
    if (resp?.paused !== undefined) {
      state[platform].paused = resp.paused;
    }
    updatePlatformStatus(platform, true, tabId);
  });
}

function syncActionStates(platform) {
  const map = ACTION_MAP[platform];
  if (!map) return;

  Object.entries(map).forEach(([actionName, conf]) => {
    const isRunning = !!state[platform].running[conf.key];
    const badge = el(conf.badge);
    const btn   = el(conf.btn);

    if (badge) {
      if (state[platform].paused && isRunning) {
        badge.className = 'action-badge paused';
        badge.textContent = 'Pausado';
      } else if (isRunning) {
        badge.className = 'action-badge active';
        badge.textContent = 'Ativo';
      } else {
        badge.className = 'action-badge';
        badge.textContent = 'Parado';
      }
    }

    if (btn) {
      if (isRunning) {
        btn.className = 'action-btn stop';
        btn.textContent = '⏹ Parar';
      } else {
        btn.className = 'action-btn start';
        btn.textContent = conf.startLabel;
      }
    }
  });

  const isAnyRunning = Object.values(state[platform].running || {}).some(Boolean);
  const navDot = el(`dot-${platform}`);
  if (navDot) navDot.style.display = isAnyRunning ? 'inline-block' : 'none';
}

// ── Command Dispatcher ────────────────────────────────────
async function sendCommand(platform, command, extra = {}) {
  const tabId = state[platform].tabId;
  if (!tabId) {
    addLogEntry(platform, `❌ Aba do ${platform} não encontrada. Abra a página primeiro!`, 'error');
    return false;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { platform, command, ...extra }, async (resp) => {
      if (chrome.runtime.lastError) {
        const errMsg = chrome.runtime.lastError.message || '';
        if (errMsg.includes('Receiving end does not exist') || errMsg.includes('Could not establish connection')) {
          addLogEntry(platform, `🔄 Conectando scripts à aba do ${platform}...`, 'info');
          const injected = await ensureScriptsInjected(platform, tabId);
          if (injected) {
            chrome.tabs.sendMessage(tabId, { platform, command, ...extra }, (retryResp) => {
              if (chrome.runtime.lastError) {
                addLogEntry(platform, `⚠️ Por favor, atualize a página do ${platform} (F5) para conectar.`, 'warn');
                resolve(false);
              } else {
                addLogEntry(platform, `✅ Conexão estabelecida com sucesso!`, 'success');
                resolve(true);
              }
            });
            return;
          } else {
            addLogEntry(platform, `⚠️ Por favor, atualize a aba do ${platform} (pressione F5) para ativar a extensão.`, 'warn');
            resolve(false);
            return;
          }
        }

        addLogEntry(platform, `❌ Erro de comunicação: ${errMsg}`, 'error');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function toggleAction(platform, actionName) {
  const conf = ACTION_MAP[platform]?.[actionName];
  if (!conf) return;

  const isCurrentlyRunning = !!state[platform].running[conf.key];

  if (isCurrentlyRunning) {
    await sendCommand(platform, conf.stop);
    state[platform].running[conf.key] = false;
    syncActionStates(platform);
    addLogEntry(platform, `⏹ ${actionName} parado pelo usuário`, 'warn');
  } else {
    const ok = await sendCommand(platform, conf.start);
    if (ok) {
      state[platform].running[conf.key] = true;
      syncActionStates(platform);
      addLogEntry(platform, `▶ ${actionName} iniciado`, 'info');

      if (window.MetaStorage?.startSession) {
        window.MetaStorage.startSession(platform, actionName).catch(() => {});
      }
    }
  }
}

// ── Global Controls (Stop All / Pause / Resume) ───────────
async function stopAllPlatform(platform) {
  await sendCommand(platform, 'STOP_ALL');
  if (state[platform]?.running) {
    Object.keys(state[platform].running).forEach(k => { state[platform].running[k] = false; });
  }
  state[platform].paused = false;
  syncActionStates(platform);
  updatePlatformStatus(platform, !!state[platform].tabId, state[platform].tabId);
  addLogEntry(platform, '🛑 Todas as automações foram paradas', 'warn');
}

async function pauseAllPlatform(platform) {
  await sendCommand(platform, 'PAUSE_ALL');
  state[platform].paused = true;
  syncActionStates(platform);
  updatePlatformStatus(platform, !!state[platform].tabId, state[platform].tabId);
  addLogEntry(platform, '⏸ Automações pausadas temporariamente', 'warn');
}

async function resumeAllPlatform(platform) {
  await sendCommand(platform, 'RESUME_ALL');
  state[platform].paused = false;
  syncActionStates(platform);
  updatePlatformStatus(platform, !!state[platform].tabId, state[platform].tabId);
  addLogEntry(platform, '▶ Automações retomadas', 'info');
}

async function stopAllGlobal() {
  for (const p of ['instagram', 'facebook', 'whatsapp']) {
    if (state[p].tabId) {
      await stopAllPlatform(p);
    }
  }
}

// ── Counters & Dashboard ──────────────────────────────────
async function loadPersistentCounters() {
  if (window.MetaStorage?.getCounters) {
    const stored = await window.MetaStorage.getCounters();
    if (stored) {
      state.counters = Object.assign(state.counters, stored);
    }
  }

  updateCountersUI();
  updateDashboardUI();
}

function updateCountersUI() {
  const ig = state.counters.instagram || {};
  if (el('ig-follow-count'))      el('ig-follow-count').textContent      = ig.follow || 0;
  if (el('ig-unfollow-count'))    el('ig-unfollow-count').textContent    = ig.unfollow || 0;
  if (el('ig-like-count'))        el('ig-like-count').textContent        = ig.like || 0;
  if (el('ig-profilelike-count')) el('ig-profilelike-count').textContent = ig.profileLike || 0;
  if (el('ig-comment-count'))     el('ig-comment-count').textContent     = ig.comment || 0;
  if (el('ig-dm-count'))          el('ig-dm-count').textContent          = ig.dm || 0;
  if (el('ig-story-count'))       el('ig-story-count').textContent       = ig.story || 0;
  if (el('ig-scraper-count'))     el('ig-scraper-count').textContent     = ig.scraper || 0;

  const fb = state.counters.facebook || {};
  if (el('fb-like-count'))          el('fb-like-count').textContent          = fb.like || 0;
  if (el('fb-groupllike-count'))    el('fb-groupllike-count').textContent    = fb.groupLike || 0;
  if (el('fb-comment-count'))       el('fb-comment-count').textContent       = fb.comment || 0;
  if (el('fb-friend-count'))        el('fb-friend-count').textContent        = fb.friend || 0;
  if (el('fb-acceptfriend-count'))  el('fb-acceptfriend-count').textContent  = fb.acceptFriend || 0;
  if (el('fb-share-count'))         el('fb-share-count').textContent         = fb.share || 0;
  if (el('fb-messenger-count'))     el('fb-messenger-count').textContent     = fb.messenger || 0;
  if (el('fb-post-count'))          el('fb-post-count').textContent          = fb.post || 0;
  if (el('fb-memberscraper-count')) el('fb-memberscraper-count').textContent = fb.memberScraper || 0;

  const wa = state.counters.whatsapp || {};
  if (el('wa-bulk-count'))      el('wa-bulk-count').textContent      = wa.bulk || 0;
  if (el('wa-group-count'))     el('wa-group-count').textContent     = wa.group || 0;
  if (el('wa-autoreply-count')) el('wa-autoreply-count').textContent = wa.autoreply || 0;

  if (window.MetaStorage?.getWASendStats) {
    window.MetaStorage.getWASendStats().then(ws => {
      if (ws) {
        state.waStats = ws;
        if (el('wa-stat-sent'))      el('wa-stat-sent').textContent      = ws.sent || 0;
        if (el('wa-stat-delivered')) el('wa-stat-delivered').textContent = ws.delivered || 0;
        if (el('wa-stat-failed'))    el('wa-stat-failed').textContent    = ws.failed || 0;
        if (el('wa-stat-pending'))   el('wa-stat-pending').textContent   = ws.pending || 0;
      }
    });
  }
}

async function updateDashboardUI() {
  const ig = state.counters.instagram || {};
  const fb = state.counters.facebook || {};
  const wa = state.counters.whatsapp || {};

  const totalFollow  = (ig.follow || 0);
  const totalLike    = (ig.like || 0) + (ig.profileLike || 0) + (fb.like || 0) + (fb.groupLike || 0);
  const totalComment = (ig.comment || 0) + (fb.comment || 0);
  const totalDM      = (ig.dm || 0) + (fb.messenger || 0);
  const totalWA      = (wa.bulk || 0) + (wa.group || 0) + (wa.autoreply || 0);
  const totalStory   = (ig.story || 0);

  if (el('dash-follow'))  el('dash-follow').textContent  = totalFollow;
  if (el('dash-like'))    el('dash-like').textContent    = totalLike;
  if (el('dash-comment')) el('dash-comment').textContent = totalComment;
  if (el('dash-dm'))      el('dash-dm').textContent      = totalDM;
  if (el('dash-wa'))      el('dash-wa').textContent      = totalWA;
  if (el('dash-story'))   el('dash-story').textContent   = totalStory;

  const igSum = Object.values(ig).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  const fbSum = Object.values(fb).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  const waSum = Object.values(wa).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  if (el('bar-ig-val')) el('bar-ig-val').textContent = igSum;
  if (el('bar-fb-val')) el('bar-fb-val').textContent = fbSum;
  if (el('bar-wa-val')) el('bar-wa-val').textContent = waSum;

  const maxVal = Math.max(igSum, fbSum, waSum, 1);
  if (el('bar-ig')) el('bar-ig').style.height = `${Math.round((igSum / maxVal) * 80) + 4}px`;
  if (el('bar-fb')) el('bar-fb').style.height = `${Math.round((fbSum / maxVal) * 80) + 4}px`;
  if (el('bar-wa')) el('bar-wa').style.height = `${Math.round((waSum / maxVal) * 80) + 4}px`;

  if (window.MetaStorage?.getSessions) {
    const sessions = await window.MetaStorage.getSessions();
    const container = el('dash-sessions');
    if (container) {
      if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div class="empty-sessions">Nenhuma sessão registrada</div>';
      } else {
        container.innerHTML = sessions.slice(0, 6).map(s => {
          const platformIcon = s.platform === 'instagram' ? '📸' : (s.platform === 'facebook' ? '📘' : '💬');
          const time = fmtTime(s.startedAt);
          return `
            <div class="session-item">
              <span class="session-platform">${platformIcon} ${s.action}</span>
              <span class="session-badge">${s.actionsPerformed || 0} ações</span>
              <span class="session-time">${time}</span>
            </div>
          `;
        }).join('');
      }
    }
  }
}

// ── WhatsApp CSV Drag & Drop Import ────────────────────────
function setupCSVZone() {
  const zone = el('wa-csv-zone');
  const input = el('wa-csv-input');
  const status = el('wa-csv-status');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  ['dragleave', 'dragend'].forEach(evt => {
    zone.addEventListener(evt, () => zone.classList.remove('drag-over'));
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length) {
      handleCSVFile(input.files[0]);
    }
  });

  function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
      if (status) {
        status.innerHTML = '<span style="color:var(--red)">❌ Por favor envie um arquivo .CSV válido.</span>';
        status.classList.add('visible');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        if (status) {
          status.innerHTML = '<span style="color:var(--yellow)">⚠️ Arquivo CSV vazio ou só com cabeçalho.</span>';
          status.classList.add('visible');
        }
        return;
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
      const numIdx  = headers.findIndex(h => h.includes('numero') || h.includes('telefone') || h.includes('phone') || h.includes('contato') || h.includes('celular'));
      const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('name') || h.includes('cliente'));
      const compIdx = headers.findIndex(h => h.includes('empresa') || h.includes('company') || h.includes('loja'));

      const parsedRows = [];
      const contactLines = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
        const number = numIdx !== -1 ? parts[numIdx] : parts[0];
        const name = nameIdx !== -1 ? parts[nameIdx] : (parts[1] || '');
        const company = compIdx !== -1 ? parts[compIdx] : (parts[2] || '');

        if (number) {
          parsedRows.push({ number, name, company });
          contactLines.push(name ? `${number} | ${name}` : number);
        }
      }

      if (parsedRows.length > 0) {
        if (status) {
          status.innerHTML = `<span style="color:var(--green)">✅ <strong>${parsedRows.length}</strong> contatos carregados com sucesso!</span>`;
          status.classList.add('visible');
        }
        if (el('wa-contacts')) {
          el('wa-contacts').value = contactLines.join('\n');
        }

        if (state.whatsapp.tabId) {
          sendCommand('whatsapp', 'IMPORT_CSV', { csvText: text });
        }

        if (window.MetaStorage?.saveSettings) {
          const waSettings = await window.MetaStorage.getSettings('whatsapp');
          waSettings.contacts = contactLines.join('\n');
          waSettings.csvData = parsedRows;
          await window.MetaStorage.saveSettings('whatsapp', waSettings);
        }

        addLogEntry('whatsapp', `📂 CSV Importado: ${parsedRows.length} contatos prontos`, 'success');
      }
    };
    reader.readAsText(file);
  }
}

// ── Scrapers & CSV Export ─────────────────────────────────
function handleScrapedData(platform, data) {
  if (!Array.isArray(data)) return;
  state.scraped[platform] = data;

  if (platform === 'instagram') {
    const resBox = el('ig-scraper-result');
    const resTxt = el('ig-scraper-result-text');
    if (resBox) resBox.classList.add('visible');
    if (resTxt) resTxt.textContent = `${data.length} seguidores coletados`;
    if (el('ig-scraper-count')) el('ig-scraper-count').textContent = data.length;
  } else if (platform === 'facebook') {
    const resBox = el('fb-scraper-result');
    const resTxt = el('fb-scraper-result-text');
    if (resBox) resBox.classList.add('visible');
    if (resTxt) resTxt.textContent = `${data.length} membros coletados`;
    if (el('fb-memberscraper-count')) el('fb-memberscraper-count').textContent = data.length;
  }
}

function exportScrapedCSV(platform) {
  const data = state.scraped[platform] || [];
  if (data.length === 0) {
    alert('Nenhum dado coletado para exportação.');
    return;
  }

  let csvContent = '';
  if (platform === 'instagram') {
    csvContent = 'Username,Perfil,Data\n' + data.map(item => {
      const u = typeof item === 'string' ? item : (item.username || item.handle || '');
      return `"${u}","https://www.instagram.com/${u}/","${new Date().toISOString()}"`;
    }).join('\n');
  } else {
    csvContent = 'Nome,Perfil,Data\n' + data.map(item => {
      const name = typeof item === 'string' ? item : (item.name || item.title || '');
      const url  = item.url || '';
      return `"${name}","${url}","${new Date().toISOString()}"`;
    }).join('\n');
  }

  chrome.runtime.sendMessage({
    type: 'EXPORT_CSV',
    data: csvContent,
    filename: `metaflow_${platform}_${Date.now()}.csv`,
  }).catch(() => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaflow_${platform}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  addLogEntry(platform, `⬇ CSV com ${data.length} itens exportado!`, 'success');
}

// ── Groq AI Engine Synchronization & Testing ──────────────
async function loadAISettings() {
  if (window.AIEngine?.init) {
    await window.AIEngine.init();
    const key = window.AIEngine.apiKey || '';
    const enabled = window.AIEngine.enabled;
    const model = window.AIEngine.model || 'llama-3.1-8b-instant';

    ['ig', 'fb', 'wa'].forEach(pfx => {
      if (el(`groq-api-key-${pfx}`)) el(`groq-api-key-${pfx}`).value = key;
      if (el(`${pfx}-use-ai`)) el(`${pfx}-use-ai`).checked = enabled;
      if (el(`groq-model-${pfx}`)) el(`groq-model-${pfx}`).value = model;
    });
  }
}

function syncAIKeyInputs(sourceVal) {
  ['ig', 'fb', 'wa'].forEach(pfx => {
    const inp = el(`groq-api-key-${pfx}`);
    if (inp && inp.value !== sourceVal) inp.value = sourceVal;
  });
}

function syncAIToggles(sourceVal) {
  ['ig', 'fb', 'wa'].forEach(pfx => {
    const tog = el(`${pfx}-use-ai`);
    if (tog && tog.checked !== sourceVal) tog.checked = sourceVal;
  });
}

function syncAIModelSelects(sourceVal) {
  ['ig', 'fb', 'wa'].forEach(pfx => {
    const sel = el(`groq-model-${pfx}`);
    if (sel && sel.value !== sourceVal) sel.value = sourceVal;
  });
}

async function testGroqConnection(platformPfx) {
  const inp = el(`groq-api-key-${platformPfx}`);
  const status = el(`groq-status-${platformPfx}`);
  const modelSelect = el(`groq-model-${platformPfx}`);
  const key = inp?.value?.trim() || '';
  const chosenModel = modelSelect?.value || 'llama-3.1-8b-instant';

  if (!status) return;
  status.className = 'ai-status visible';
  status.textContent = '⏳ Testando conexão com Groq LPU...';

  if (!key) {
    status.className = 'ai-status visible error';
    status.textContent = '❌ Por favor informe a chave (gsk_...)';
    return;
  }

  if (window.AIEngine?.testConnection) {
    const res = await window.AIEngine.testConnection(key, chosenModel);
    if (res.ok) {
      status.className = 'ai-status visible success';
      if (res.adjusted) {
        status.textContent = `✅ Conectado em ${res.latencyMs}ms! (Modelo ajustado para ${res.model})`;
      } else {
        status.textContent = `✅ Conectado com sucesso! Respondeu em ${res.latencyMs}ms (${res.model}).`;
      }
      syncAIModelSelects(res.model);
      await window.AIEngine.saveSettings({ apiKey: key, model: res.model, enabled: true });
      syncAIKeyInputs(key);
      syncAIToggles(true);
    } else {
      status.className = 'ai-status visible error';
      status.textContent = `❌ ${res.error}`;
    }
  }
}

// ── Settings Sync per Tab & Marketing Campaigns ──────────
async function loadAllSettings() {
  if (!window.MetaStorage?.getSettings) return;

  // Instagram
  const ig = await window.MetaStorage.getSettings('instagram');
  if (el('ig-hashtag'))            el('ig-hashtag').value            = ig.hashtag || '';
  if (el('ig-target-profile'))     el('ig-target-profile').value     = ig.targetProfile || '';
  if (el('ig-limit-scraper'))      el('ig-limit-scraper').value      = ig.limitScraper || 50;
  if (el('ig-dm-targets'))         el('ig-dm-targets').value         = ig.dmTargets || '';
  if (el('ig-dm-template'))        el('ig-dm-template').value        = ig.dmTemplate || '';
  if (el('ig-filter-public'))      el('ig-filter-public').checked    = ig.filterPublic !== false;
  if (el('ig-limit-follow'))       el('ig-limit-follow').value       = ig.limitFollow || 20;
  if (el('ig-limit-follow-val'))   el('ig-limit-follow-val').textContent = ig.limitFollow || 20;
  if (el('ig-limit-like'))         el('ig-limit-like').value         = ig.limitLike || 50;
  if (el('ig-limit-like-val'))     el('ig-limit-like-val').textContent = ig.limitLike || 50;
  if (el('ig-comments'))           el('ig-comments').value           = Array.isArray(ig.comments) ? ig.comments.join('\n') : (ig.comments || '');

  // Facebook
  const fb = await window.MetaStorage.getSettings('facebook');
  if (el('fb-search-keyword'))     el('fb-search-keyword').value     = fb.searchKeyword || '';
  if (el('fb-post-theme'))         el('fb-post-theme').value         = fb.postTheme || '';
  if (el('fb-post-text'))          el('fb-post-text').value          = fb.postTemplate || '';
  if (el('fb-post-link'))          el('fb-post-link').value          = fb.postLink || '';
  if (el('fb-target-groups-manual')) el('fb-target-groups-manual').value = Array.isArray(fb.targetGroups) ? fb.targetGroups.join('\n') : (fb.targetGroups || '');
  if (el('fb-group-delay-min'))    el('fb-group-delay-min').value    = fb.groupDelayMin || 60;
  if (el('fb-group-delay-max'))    el('fb-group-delay-max').value    = fb.groupDelayMax || 120;
  if (el('fb-event-title'))        el('fb-event-title').value        = fb.eventTitle || '';
  if (el('fb-event-date'))         el('fb-event-date').value         = fb.eventDate || '';
  if (el('fb-event-link'))         el('fb-event-link').value         = fb.eventLink || '';
  if (el('fb-event-description'))  el('fb-event-description').value  = fb.eventDescription || '';
  if (el('fb-messenger-contacts')) el('fb-messenger-contacts').value = fb.messengerContacts || '';
  if (el('fb-messenger-template')) el('fb-messenger-template').value = fb.messengerTemplate || '';

  // WhatsApp
  const wa = await window.MetaStorage.getSettings('whatsapp');
  if (el('wa-message-template'))   el('wa-message-template').value   = wa.messageTemplate || '';
  if (el('wa-message-link'))       el('wa-message-link').value       = wa.messageLink || '';
  if (el('wa-media-url'))          el('wa-media-url').value          = wa.mediaUrl || '';
  if (el('wa-contacts'))           el('wa-contacts').value           = wa.contacts || '';
  if (el('wa-delay-min'))          el('wa-delay-min').value          = wa.delayMin || 8;
  if (el('wa-delay-max'))          el('wa-delay-max').value          = wa.delayMax || 20;
  if (el('wa-groups'))             el('wa-groups').value             = wa.groups || '';
  if (el('wa-group-template'))     el('wa-group-template').value     = wa.groupTemplate || '';
  if (el('wa-reply-template'))     el('wa-reply-template').value     = wa.replyContext || wa.replyTemplate || '';

  setSpeedButtonUI('instagram', ig.speed || 'normal');
  setSpeedButtonUI('facebook', fb.speed || 'normal');
  setSpeedButtonUI('whatsapp', wa.speed || 'normal');

  await loadAISettings();

  // Restaurar grupos buscados e participados salvos
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get([
      'fb_searched_groups',
      'fb_last_search_kw',
      'fb_my_joined_groups',
      'fb_group_action_mode',
      'metaflow_active_tab'
    ], res => {
      if (res.fb_searched_groups?.length) {
        renderSearchedGroups(res.fb_searched_groups, res.fb_last_search_kw || '');
      }
      if (res.fb_my_joined_groups?.length) {
        renderMyJoinedGroups(res.fb_my_joined_groups);
      }
      if (res.fb_group_action_mode && el('fb-group-action-mode')) {
        el('fb-group-action-mode').value = res.fb_group_action_mode;
        updateGroupActionUI();
      }
      if (res.metaflow_active_tab) {
        const btn = document.querySelector(`.tab-btn[data-tab="${res.metaflow_active_tab}"]`);
        if (btn) btn.click();
      }
    });
  }
}

function setSpeedButtonUI(platform, speed) {
  const pfx = platform === 'instagram' ? 'ig' : (platform === 'facebook' ? 'fb' : 'wa');
  const container = el(`${pfx}-speed-group`) || el('global-speed-group');
  if (!container) return;
  container.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.speed === speed);
  });
}

// ── Salvar Configurações ─────────────────────────────────
async function saveInstagramSettings() {
  const btn = el('btn-save-ig');
  if (btn) btn.textContent = '⏳ Salvando...';

  const igSettings = {
    hashtag: el('ig-hashtag')?.value || '',
    targetProfile: el('ig-target-profile')?.value || '',
    limitScraper: parseInt(el('ig-limit-scraper')?.value || 50, 10),
    dmTargets: el('ig-dm-targets')?.value || '',
    dmTemplate: el('ig-dm-template')?.value || '',
    filterPublic: el('ig-filter-public')?.checked ?? true,
    limitFollow: parseInt(el('ig-limit-follow')?.value || 20, 10),
    limitLike: parseInt(el('ig-limit-like')?.value || 50, 10),
    comments: (el('ig-comments')?.value || '').split('\n').map(c => c.trim()).filter(Boolean),
    useAI: el('ig-use-ai')?.checked ?? true,
  };

  await window.MetaStorage.saveSettings('instagram', igSettings);

  const groqKey = el('groq-api-key-ig')?.value?.trim();
  const groqModel = el('groq-model-ig')?.value || 'llama-3.1-8b-instant';
  if (groqKey) {
    await window.AIEngine.saveSettings({ apiKey: groqKey, model: groqModel, enabled: igSettings.useAI });
    syncAIKeyInputs(groqKey);
    syncAIModelSelects(groqModel);
    syncAIToggles(igSettings.useAI);
  }

  if (btn) {
    btn.textContent = '✅ Salvo com sucesso!';
    setTimeout(() => { btn.textContent = '💾 Salvar Configurações'; }, 1500);
  }
}

async function saveFacebookSettings() {
  const fbSettings = {
    searchKeyword: el('fb-search-keyword')?.value || '',
    postTheme: el('fb-post-theme')?.value || '',
    postTemplate: el('fb-post-text')?.value || '',
    postLink: el('fb-post-link')?.value || '',
    targetGroups: (el('fb-target-groups-manual')?.value || '').split('\n').map(u => u.trim()).filter(Boolean),
    groupDelayMin: parseInt(el('fb-group-delay-min')?.value || 60, 10),
    groupDelayMax: parseInt(el('fb-group-delay-max')?.value || 120, 10),
    eventTitle: el('fb-event-title')?.value || '',
    eventDate: el('fb-event-date')?.value || '',
    eventLink: el('fb-event-link')?.value || '',
    eventDescription: el('fb-event-description')?.value || '',
    messengerContacts: el('fb-messenger-contacts')?.value || '',
    messengerTemplate: el('fb-messenger-template')?.value || '',
    useAI: el('fb-use-ai')?.checked ?? true,
  };

  await window.MetaStorage.saveSettings('facebook', fbSettings);

  const groqKey = el('groq-api-key-fb')?.value?.trim();
  const groqModel = el('groq-model-fb')?.value || 'llama-3.1-8b-instant';
  if (groqKey) {
    await window.AIEngine.saveSettings({ apiKey: groqKey, model: groqModel, enabled: fbSettings.useAI });
    syncAIKeyInputs(groqKey);
    syncAIModelSelects(groqModel);
    syncAIToggles(fbSettings.useAI);
  }
}

async function saveWhatsAppSettings() {
  const waSettings = {
    delayMin: parseInt(el('wa-delay-min')?.value || 8, 10),
    delayMax: parseInt(el('wa-delay-max')?.value || 20, 10),
    contacts: el('wa-contacts')?.value || '',
    groups: el('wa-groups')?.value || '',
    messageTemplate: el('wa-message-template')?.value || '',
    messageLink: el('wa-message-link')?.value || '',
    mediaUrl: el('wa-media-url')?.value || '',
    groupTemplate: el('wa-group-template')?.value || '',
    replyContext: el('wa-reply-template')?.value || '',
    useAI: el('wa-use-ai')?.checked ?? true,
  };

  await window.MetaStorage.saveSettings('whatsapp', waSettings);

  const groqKey = el('groq-api-key-wa')?.value?.trim();
  const groqModel = el('groq-model-wa')?.value || 'llama-3.1-8b-instant';
  if (groqKey) {
    await window.AIEngine.saveSettings({ apiKey: groqKey, model: groqModel, enabled: waSettings.useAI });
    syncAIKeyInputs(groqKey);
    syncAIModelSelects(groqModel);
    syncAIToggles(waSettings.useAI);
  }
}

// ── MEUS GRUPOS (Grupos que Participo) ──────────────────────
let currentMyJoinedGroups = [];

function renderMyJoinedGroups(groups) {
  currentMyJoinedGroups = groups || [];
  const listContainer = el('fb-my-groups-list');
  const countSpan = el('fb-my-groups-count');

  if (countSpan) {
    countSpan.textContent = `${currentMyJoinedGroups.length} grupos participados`;
  }

  if (!listContainer) return;
  if (!currentMyJoinedGroups.length) {
    listContainer.innerHTML = `<div class="group-empty-hint">Nenhum grupo carregado ainda. Clique em <strong>🔄 Carregar Meus Grupos</strong> acima.</div>`;
    return;
  }

  chrome.storage?.local?.get(['fb_selected_my_groups', 'fb_selected_my_group'], (res) => {
    const savedList = res?.fb_selected_my_groups || [];
    const savedSingle = res?.fb_selected_my_group || (currentMyJoinedGroups[0]?.url || '');

    listContainer.innerHTML = currentMyJoinedGroups.map((g, idx) => {
      const isChecked = savedList.length ? savedList.includes(g.url) : (idx === 0);
      const imgHtml = g.image
        ? `<img class="group-thumb" src="${escapeHtml(g.image)}" alt="Capa" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" /><div class="group-thumb-fallback" style="display:none;">👥</div>`
        : `<div class="group-thumb-fallback">👥</div>`;

      return `
        <label class="group-result-card" title="${escapeHtml(g.url)}">
          <input type="checkbox" class="fb-my-group-cb" value="${escapeHtml(g.url)}" ${isChecked ? 'checked' : ''} />
          ${imgHtml}
          <div class="group-result-content">
            <span class="group-result-name">${escapeHtml(g.name)}</span>
            <span class="group-result-meta">${escapeHtml(g.subtitle || g.members || 'Grupo participante')}</span>
          </div>
        </label>
      `;
    }).join('');
  });
}

function saveSelectedMyGroupsState() {
  const selectedUrls = Array.from(document.querySelectorAll('.fb-my-group-cb:checked')).map(cb => cb.value);
  if (chrome.storage?.local) {
    chrome.storage.local.set({
      fb_selected_my_groups: selectedUrls,
      fb_selected_my_group: selectedUrls[0] || ''
    });
  }
}

function selectAllMyGroups(selected) {
  document.querySelectorAll('.fb-my-group-cb').forEach(cb => { cb.checked = selected; });
  saveSelectedMyGroupsState();
}

async function loadMyJoinedGroupsUI() {
  const btn = el('btn-load-my-groups');
  if (btn) btn.textContent = '⏳ Carregando...';

  addLogEntry('facebook', '🔄 Acessando Facebook para carregar grupos que você participa...', 'info');
  await sendCommand('facebook', 'LOAD_MY_GROUPS');

  setTimeout(() => {
    if (btn) btn.textContent = '🔄 Carregar Meus Grupos';
  }, 10000);
}

function useMyGroupsInPost() {
  const selectedUrls = Array.from(document.querySelectorAll('.fb-my-group-cb:checked')).map(cb => cb.value);
  if (!selectedUrls.length) {
    alert('Selecione ao menos um grupo na lista "Meus Grupos"!');
    return;
  }
  const manualArea = el('fb-target-groups-manual');
  if (manualArea) {
    const current = manualArea.value.trim();
    const newUrls = selectedUrls.join('\n');
    manualArea.value = current ? `${current}\n${newUrls}` : newUrls;
    addLogEntry('facebook', `📢 ${selectedUrls.length} grupo(s) de "Meus Grupos" adicionados ao publicador!`, 'success');
    alert(`${selectedUrls.length} grupo(s) adicionados ao campo de postagem!`);
  }
}

async function scrapeSelectedGroupMembers() {
  // Pega o grupo selecionado em "Meus Grupos" ou nos grupos buscados
  let selectedGroup = document.querySelector('.fb-my-group-cb:checked')?.value ||
                      document.querySelector('.fb-group-cb:checked')?.value;

  if (!selectedGroup) {
    addLogEntry('facebook', '⚠️ Selecione um grupo na lista "Meus Grupos" ou na busca para extrair membros!', 'warn');
    alert('Selecione um grupo marcando a caixinha correspondente para extrair membros!');
    return;
  }

  const limit = parseInt(el('fb-scrape-limit')?.value || 100, 10);
  addLogEntry('facebook', `👥 Iniciando extração de membros do grupo selecionado (${limit} membros)...`, 'info');

  if (chrome.storage?.local) {
    chrome.storage.local.set({ fb_selected_my_group: selectedGroup, fb_members_target_url: selectedGroup });
  }

  const badge = el('fb-memberscraper-badge');
  if (badge) {
    badge.textContent = 'Extraindo...';
    badge.className = 'action-badge active';
  }

  await sendCommand('facebook', 'START_MEMBERSCRAPER', {
    targetGroup: selectedGroup,
    limit: limit
  });
}

function exportFbMembersCSV() {
  const scraped = state.scraped.facebook || [];
  if (!scraped.length) {
    alert('Nenhum membro extraído ainda. Execute o extrator primeiro!');
    return;
  }
  let csv = 'Nome,URL\n';
  scraped.forEach(m => {
    const name = `"${(m.name || '').replace(/"/g, '""')}"`;
    const url = `"${(m.url || '').replace(/"/g, '""')}"`;
    csv += `${name},${url}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `membros_facebook_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  addLogEntry('facebook', `⬇ ${scraped.length} membros exportados para CSV!`, 'success');
}

function updateGroupActionUI() {
  const mode = el('fb-group-action-mode')?.value || 'join_and_post';
  const startBtn = el('btn-start-multi-group-post');
  if (!startBtn) return;

  if (chrome.storage?.local) {
    chrome.storage.local.set({ fb_group_action_mode: mode });
  }

  if (mode === 'join_only') {
    startBtn.textContent = '➕ Participar dos Grupos Selecionados';
    startBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  } else if (mode === 'search_only') {
    startBtn.textContent = '🔍 Buscar Grupos pelo Nicho';
    startBtn.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
  } else if (mode === 'post_only') {
    startBtn.textContent = '📢 Publicar nos Grupos Selecionados';
    startBtn.style.background = 'linear-gradient(135deg, var(--purple), var(--pink))';
  } else {
    // join_and_post
    startBtn.textContent = '🚀 Entrar e Postar nos Grupos Selecionados';
    startBtn.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
  }
}

// ── Facebook Group Search & Multi-Post ─────────────────────
let currentSearchedGroups = [];

async function searchFacebookGroups() {
  const kw = el('fb-search-keyword')?.value?.trim();
  if (!kw) {
    addLogEntry('facebook', 'Por favor informe uma palavra-chave para buscar grupos!', 'warn');
    return;
  }

  // Salvar imediatamente no storage para não perder ao trocar de janela/aba
  if (window.MetaStorage?.getSettings && window.MetaStorage?.saveSettings) {
    const fb = (await window.MetaStorage.getSettings('facebook')) || {};
    fb.searchKeyword = kw;
    await window.MetaStorage.saveSettings('facebook', fb);
  }

  const listContainer = el('fb-groups-results-list');
  const countSpan = el('fb-groups-count');
  if (listContainer) {
    listContainer.innerHTML = `<div class="group-empty-hint">⏳ Buscando grupos para "${escapeHtml(kw)}" no Facebook... aguarde.</div>`;
  }
  if (countSpan) countSpan.textContent = 'Buscando...';

  addLogEntry('facebook', `🔎 Buscando grupos com nicho "${kw}"...`, 'info');
  await sendCommand('facebook', 'SEARCH_FB_GROUPS', { keyword: kw });
}

function renderSearchedGroups(groups, keyword) {
  currentSearchedGroups = groups || [];
  const listContainer = el('fb-groups-results-list');
  const countSpan = el('fb-groups-count');

  if (countSpan) {
    countSpan.textContent = `${currentSearchedGroups.length} grupos encontrados para "${keyword || ''}"`;
  }

  if (!listContainer) return;
  if (!currentSearchedGroups.length) {
    listContainer.innerHTML = `<div class="group-empty-hint">Nenhum grupo encontrado. Verifique a aba do Facebook.</div>`;
    return;
  }

  chrome.storage?.local?.get(['fb_selected_groups'], (res) => {
    const saved = res?.fb_selected_groups;
    const isChecked = (url) => {
      if (!saved || !saved.length) return true; // padrão selecionado
      return saved.includes(url);
    };

    listContainer.innerHTML = currentSearchedGroups.map((g) => {
      const checkedAttr = isChecked(g.url) ? 'checked' : '';
      const imgHtml = g.image
        ? `<img class="group-thumb" src="${escapeHtml(g.image)}" alt="Capa" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" /><div class="group-thumb-fallback" style="display:none;">👥</div>`
        : `<div class="group-thumb-fallback">👥</div>`;

      return `
        <label class="group-result-card" title="${escapeHtml(g.url)}">
          <input type="checkbox" class="fb-group-cb" value="${escapeHtml(g.url)}" ${checkedAttr} />
          ${imgHtml}
          <div class="group-result-content">
            <span class="group-result-name">${escapeHtml(g.name)}</span>
            <span class="group-result-meta">${escapeHtml(g.subtitle || g.members || 'Grupo público')}</span>
          </div>
        </label>
      `;
    }).join('');
  });
}

function saveSelectedGroupsState() {
  const selectedUrls = Array.from(document.querySelectorAll('.fb-group-cb:checked')).map(cb => cb.value);
  if (chrome.storage?.local) {
    chrome.storage.local.set({ fb_selected_groups: selectedUrls });
  }
}

function selectAllGroups(selected) {
  document.querySelectorAll('.fb-group-cb').forEach(cb => { cb.checked = selected; });
  saveSelectedGroupsState();
}

// ── Upload e Prévia de Fotos/Vídeos ────────────────────────
let selectedFbMedia = [];

function setupMediaUpload() {
  const fileInput = el('fb-media-files');
  const addBtn = el('btn-add-media');
  const dropzone = el('fb-media-dropzone');

  addBtn?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput?.click();
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) {
      handleMediaFiles(e.dataTransfer.files);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) {
      handleMediaFiles(fileInput.files);
      fileInput.value = '';
    }
  });
}

function handleMediaFiles(files) {
  Array.from(files).forEach(file => {
    if (selectedFbMedia.length >= 5) {
      alert('Limite máximo de 5 fotos ou vídeos por postagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFbMedia.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: e.target.result
      });
      renderMediaPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderMediaPreviews() {
  const container = el('fb-media-previews');
  if (!container) return;

  container.innerHTML = selectedFbMedia.map((m, idx) => {
    const isVideo = m.type.startsWith('video');
    return `
      <div class="media-preview-item" title="${escapeHtml(m.name)}">
        ${isVideo
          ? `<div class="video-badge">🎥 Vídeo</div>`
          : `<img src="${escapeHtml(m.dataUrl)}" alt="${escapeHtml(m.name)}" />`}
        <button class="media-remove-btn" data-idx="${idx}" type="button" title="Remover">✖</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.media-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      selectedFbMedia.splice(idx, 1);
      renderMediaPreviews();
    });
  });
}

async function startMultiGroupPost() {
  const actionMode = el('fb-group-action-mode')?.value || 'join_and_post';

  // Se o usuário escolheu "Apenas Buscar"
  if (actionMode === 'search_only') {
    await searchFacebookGroups();
    return;
  }

  const selectedCbs = Array.from(document.querySelectorAll('.fb-group-cb:checked')).map(cb => cb.value);
  const selectedMyGroups = Array.from(document.querySelectorAll('.fb-my-group-cb:checked')).map(cb => cb.value);
  const manualUrls = (el('fb-target-groups-manual')?.value || '')
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean);

  const allGroups = Array.from(new Set([...selectedCbs, ...selectedMyGroups, ...manualUrls]));
  const delayMin = parseInt(el('fb-group-delay-min')?.value || 60, 10);
  const delayMax = parseInt(el('fb-group-delay-max')?.value || 120, 10);

  if (!allGroups.length) {
    addLogEntry('facebook', '❌ Selecione ao menos 1 grupo na busca, em Meus Grupos ou cole URLs manuais!', 'error');
    alert('Selecione ao menos 1 grupo na lista ou cole os links no campo manual!');
    return;
  }

  // Se o modo for apenas participar de grupos em massa
  if (actionMode === 'join_only') {
    const fbSettings = {
      targetGroups: allGroups,
      actionMode: 'join_only',
      groupDelayMin: delayMin,
      groupDelayMax: delayMax,
    };
    await window.MetaStorage?.saveSettings('facebook', fbSettings);
    addLogEntry('facebook', `➕ Iniciando participação em massa em ${allGroups.length} grupos...`, 'info');
    await sendCommand('facebook', 'START_POST', { options: fbSettings });
    return;
  }

  // Modos join_and_post ou post_only exigem texto ou foto/vídeo
  const postText = el('fb-post-text')?.value?.trim();
  const postLink = el('fb-post-link')?.value?.trim();

  if (!postText && selectedFbMedia.length === 0) {
    addLogEntry('facebook', '❌ Digite o conteúdo do post ou anexe ao menos uma foto/vídeo!', 'error');
    alert('Digite a mensagem do post ou anexe uma foto antes de iniciar!');
    return;
  }

  const fbSettings = {
    targetGroups: allGroups,
    actionMode: actionMode,
    postTheme: el('fb-post-theme')?.value || '',
    postTemplate: postText,
    postLink: postLink,
    groupDelayMin: delayMin,
    groupDelayMax: delayMax,
    mediaList: selectedFbMedia,
  };

  await window.MetaStorage?.saveSettings('facebook', fbSettings);
  const actionLabel = actionMode === 'join_and_post' ? 'Entrar e Postar' : 'Publicar';
  addLogEntry('facebook', `🚀 Iniciando [${actionLabel}] em ${allGroups.length} grupos (${selectedFbMedia.length} mídias anexadas)...`, 'info');

  await sendCommand('facebook', 'START_POST', { options: fbSettings });
}

async function stopGroupPost() {
  addLogEntry('facebook', '🛑 Parando postagens em grupos...', 'warn');
  await sendCommand('facebook', 'STOP_POST');
}

// ── Geradores de Copywriting com Groq IA ──────────────────
async function generateAIFbPost() {
  const theme = el('fb-post-theme')?.value?.trim();
  const kw = el('fb-search-keyword')?.value?.trim();
  const centralTopic = theme || (kw ? `dicas e estratégias de sucesso para ${kw}` : 'como vender mais e atrair clientes no Facebook');

  const targetTextarea = el('fb-post-text');
  if (!targetTextarea) return;

  targetTextarea.value = '⏳ Gerando copy persuasiva com Groq LPU (Llama 3)...';
  try {
    const prompt = `Você é um copywriter de elite especialista em viralização e conversão em grupos do Facebook no Brasil.
Escreva uma postagem altamente atrativa, persuasiva e humanizada sobre o seguinte tema central:
"${centralTopic}"

Instruções obrigatórias:
1. Inclua variações de Spintax nas saudações e frases de impacto para evitar bloqueios no Facebook, no formato:
{Olá|Oi|Fala pessoal|E aí amigos}, {Confira essa dica|Dá uma olhada nisso|Veja que interessante|Preste atenção}, etc.
2. Compartilhe um conteúdo prático de valor real que resolva uma dor ou necessidade sobre o tema central.
3. Não use tom de anúncio frio ou spam. Fale como um membro experiente da comunidade compartilhando conhecimento.
4. Estruture com parágrafos curtos, 2 a 4 emojis bem colocados.
5. Finalize com uma chamada para ação convidativa para quem quiser saber mais comentar ou chamar no link.
6. Responda APENAS com o texto final da publicação pronto com Spintax, sem introduções, sem aspas e sem explicações.`;

    const res = await window.AIEngine._chat([
      { role: 'system', content: 'Você é um copywriter profissional especialista em engajamento em grupos do Facebook.' },
      { role: 'user', content: prompt }
    ], 240, 0.88);

    targetTextarea.value = res || '{Olá|Oi|Fala pessoal}! Quem aqui quer aprender {uma super dica|um método simples} para {vender mais|conquistar novos clientes}? Deixe seu comentário aqui embaixo! 👇';
    addLogEntry('facebook', `⚡ Copy gerada para o tema: "${centralTopic.substring(0, 32)}..."!`, 'success');
    saveFacebookSettings();
  } catch (e) {
    targetTextarea.value = '';
    addLogEntry('facebook', `Falha ao gerar post com IA: ${e.message}`, 'error');
  }
}

async function generateAIWaMsg() {
  const targetTextarea = el('wa-message-template');
  if (!targetTextarea) return;

  targetTextarea.value = '⏳ Gerando mensagem com Groq LPU...';
  try {
    const res = await window.AIEngine._chat([
      { role: 'system', content: 'Você é um especialista em vendas diretas e WhatsApp Marketing no Brasil.' },
      { role: 'user', content: 'Escreva uma mensagem de abordagem calorosa, educada e atrativa para WhatsApp que use a tag {nome} no início. No máximo 3 frases com 2 emojis amigáveis.' }
    ], 90, 0.7);

    targetTextarea.value = res || 'Olá {nome}! Tudo bem? Gostaria de compartilhar uma novidade especial com você 😊';
    addLogEntry('whatsapp', '⚡ Mensagem gerada com Groq IA!', 'success');
  } catch (e) {
    targetTextarea.value = '';
    addLogEntry('whatsapp', `Falha na IA: ${e.message}`, 'error');
  }
}

async function generateAIIgDM() {
  const targetTextarea = el('ig-dm-template');
  if (!targetTextarea) return;

  targetTextarea.value = '⏳ Gerando mensagem direta com Groq LPU...';
  try {
    const res = await window.AIEngine._chat([
      { role: 'system', content: 'Você é um especialista em networking e prospecção no Instagram.' },
      { role: 'user', content: 'Escreva uma mensagem de Direct (DM) natural, simpática e autêntica cumprimentando o contato pelo {nome}, fazendo um elogio sincero ao perfil e abrindo conversa.' }
    ], 80, 0.75);

    targetTextarea.value = res || 'Olá {nome}! Vi suas publicações e achei muito relevante o seu trabalho por aqui ✨';
    addLogEntry('instagram', '⚡ DM gerada com Groq IA!', 'success');
  } catch (e) {
    targetTextarea.value = '';
    addLogEntry('instagram', `Falha na IA: ${e.message}`, 'error');
  }
}

// ── Modal de Configurações Globais ────────────────────────
function initSettingsModal() {
  const modal = el('settings-modal');
  el('btn-open-settings')?.addEventListener('click', async () => {
    if (window.AIEngine?.init) {
      await window.AIEngine.init();
      if (el('global-groq-key')) el('global-groq-key').value = window.AIEngine.apiKey || '';
    }
    modal?.classList.add('open');
  });

  el('btn-close-settings')?.addEventListener('click', () => {
    modal?.classList.remove('open');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // Preferência de abrir sempre destacado
  const alwaysDetachedCb = el('setting-always-detached');
  if (alwaysDetachedCb && typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['metaflow_always_detached'], (res) => {
      alwaysDetachedCb.checked = !!res?.metaflow_always_detached;
    });
    alwaysDetachedCb.addEventListener('change', (e) => {
      chrome.storage.local.set({ metaflow_always_detached: e.target.checked });
    });
  }

  el('btn-save-global-settings')?.addEventListener('click', async () => {
    const key = el('global-groq-key')?.value?.trim();
    if (key && window.AIEngine) {
      await window.AIEngine.saveSettings({ apiKey: key });
      syncAIKeyInputs(key);
    }
    modal?.classList.remove('open');
    addLogEntry('dashboard', 'Configurações globais salvas com sucesso!', 'success');
  });
}

// ── Slider Labels Synchronizer ────────────────────────────
function setupSliderSync() {
  const sliders = [
    { input: 'ig-limit-follow',    val: 'ig-limit-follow-val' },
    { input: 'ig-limit-like',      val: 'ig-limit-like-val' },
  ];

  sliders.forEach(item => {
    const inp = el(item.input);
    const lbl = el(item.val);
    if (inp && lbl) {
      inp.addEventListener('input', () => {
        lbl.textContent = inp.value;
      });
    }
  });
}

// ── Runtime Message Listener ──────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const { type, platform } = msg;

  if (type === 'LOG') {
    addLogEntry(platform || 'instagram', msg.message, msg.logType || 'info');
  }

  if (type === 'STATUS_UPDATE') {
    if (platform && msg.running) {
      state[platform].running = msg.running;
      syncActionStates(platform);
    }
  }

  if (type === 'FB_GROUPS_FOUND') {
    renderSearchedGroups(msg.groups, msg.keyword);
    addLogEntry('facebook', `✅ ${msg.groups.length} grupos carregados na lista!`, 'success');
  }

  if (type === 'FB_MY_GROUPS_LOADED') {
    renderMyJoinedGroups(msg.groups);
    addLogEntry('facebook', `✅ ${msg.groups.length} grupos participados carregados com sucesso!`, 'success');
    const btn = el('btn-load-my-groups');
    if (btn) btn.textContent = '🔄 Carregar Meus Grupos';
  }

  if (type === 'CAPTCHA_DETECTED') {
    const alertId = `${platform === 'instagram' ? 'ig' : (platform === 'facebook' ? 'fb' : 'wa')}-captcha-alert`;
    const box = el(alertId);
    if (box) box.style.display = 'flex';
    addLogEntry(platform, '🔒 ALERTA: Desafio ou bloqueio detectado na página!', 'error');
  }

  if (type === 'SCRAPED_DATA') {
    handleScrapedData(platform, msg.data);
    if (platform === 'facebook') {
      const countEl = el('fb-members-result-text');
      const resBox = el('fb-members-result');
      const count = msg.count || (msg.data ? msg.data.length : 0);
      if (countEl) countEl.textContent = `${count} membros coletados`;
      if (resBox) resBox.style.display = 'flex';
      const badge = el('fb-memberscraper-badge');
      if (badge) {
        badge.textContent = 'Concluído';
        badge.className = 'action-badge completed';
      }
    }
  }

  if (type === 'WA_STATS') {
    if (msg.stats) {
      state.waStats = msg.stats;
      updateCountersUI();
    }
  }

  if (type === 'CSV_IMPORTED') {
    addLogEntry('whatsapp', `📂 ${msg.count} contatos recebidos com sucesso`, 'success');
  }

  if (msg.action && platform) {
    if (!state.counters[platform]) state.counters[platform] = {};
    state.counters[platform][msg.action] = (state.counters[platform][msg.action] || 0) + 1;
    updateCountersUI();
    updateDashboardUI();
  }

  sendResponse?.({ ok: true });
  return true;
});

// ── Event Handlers Setup ──────────────────────────────────
function setupEventListeners() {
  // Navegação entre as 5 abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = el(`panel-${btn.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add('active');

      if (btn.dataset.tab && typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ metaflow_active_tab: btn.dataset.tab });
      }

      if (btn.dataset.tab === 'dashboard') {
        updateDashboardUI();
      }
    });
  });

  // Botão Destacar Janela Flutuante (Fixa e Arrastável na tela)
  const isDetached = window.location.search.includes('detached=1');
  const detachBtn = el('btn-detach-window');
  if (isDetached) {
    document.body.classList.add('is-detached');
    if (detachBtn) {
      detachBtn.classList.add('active-detached');
      detachBtn.title = 'Janela Flutuante Fixa (Ativa)';
    }
  }

  detachBtn?.addEventListener('click', () => {
    if (isDetached) {
      alert('Esta janela já está destacada e flutuando livremente na sua tela! Você pode arrastá-la para onde preferir.');
      return;
    }
    chrome.runtime.sendMessage({ type: 'OPEN_DETACHED_WINDOW' }).catch(() => {});
    window.close();
  });

  // Salvar estado dos checkboxes de grupos do Facebook ao marcar/desmarcar
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('fb-group-cb')) {
      saveSelectedGroupsState();
    }
    if (e.target && e.target.classList.contains('fb-my-group-cb')) {
      saveSelectedMyGroupsState();
    }
  });

  // Botões de Iniciar/Parar Ações
  document.querySelectorAll('.action-btn, .btn-campaign[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const platform = btn.dataset.platform;
      if (action && platform) {
        if (action === 'POST' && platform === 'facebook') {
          startMultiGroupPost();
          return;
        }
        if (action === 'MEMBERSCRAPER' && platform === 'facebook') {
          scrapeSelectedGroupMembers();
          return;
        }
        toggleAction(platform, action);
      }
    });
  });

  // Seção Meus Grupos Facebook
  el('btn-load-my-groups')?.addEventListener('click', loadMyJoinedGroupsUI);
  el('btn-select-all-my-groups')?.addEventListener('click', () => selectAllMyGroups(true));
  el('btn-deselect-all-my-groups')?.addEventListener('click', () => selectAllMyGroups(false));
  el('btn-scrape-selected-group')?.addEventListener('click', scrapeSelectedGroupMembers);
  el('btn-use-my-groups-in-post')?.addEventListener('click', useMyGroupsInPost);
  el('btn-export-fb-members')?.addEventListener('click', exportFbMembersCSV);

  // Campanha e Busca de Grupos Facebook
  el('fb-group-action-mode')?.addEventListener('change', updateGroupActionUI);
  el('btn-search-fb-groups')?.addEventListener('click', searchFacebookGroups);
  el('btn-select-all-groups')?.addEventListener('click', () => selectAllGroups(true));
  el('btn-deselect-all-groups')?.addEventListener('click', () => selectAllGroups(false));
  el('btn-start-multi-group-post')?.addEventListener('click', startMultiGroupPost);
  el('btn-stop-group-post')?.addEventListener('click', stopGroupPost);

  // Botões Gerar com Groq IA
  el('btn-ai-generate-fb-post')?.addEventListener('click', generateAIFbPost);
  el('btn-ai-generate-wa-msg')?.addEventListener('click', generateAIWaMsg);
  el('btn-ai-generate-ig-dm')?.addEventListener('click', generateAIIgDM);
  el('btn-ai-generate-fb-msg')?.addEventListener('click', async () => {
    const inp = el('fb-messenger-template');
    if (!inp) return;
    inp.value = '⏳ Gerando mensagem...';
    const res = await window.AIEngine._chat([
      { role: 'system', content: 'Você é um assistente simpático de Messenger.' },
      { role: 'user', content: 'Escreva uma mensagem curta e simpática para puxar assunto com um amigo usando {nome}.' }
    ], 60);
    inp.value = res || 'Olá {nome}! Tudo bem? 😊';
  });

  // Chips de variáveis no WhatsApp
  document.querySelectorAll('.var-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.var;
      const inp = el('wa-message-template');
      if (inp && tag) {
        inp.value += ` ${tag} `;
        inp.focus();
      }
    });
  });

  // Instagram: Usar seguidores extraídos nas DMs
  el('btn-use-scraped-followers')?.addEventListener('click', () => {
    const scraped = state.scraped.instagram || [];
    if (scraped.length) {
      el('ig-dm-targets').value = scraped.map(s => s.username || s).join('\n');
      addLogEntry('instagram', `✅ ${scraped.length} seguidores inseridos na lista de DMs!`, 'success');
    } else {
      addLogEntry('instagram', 'Nenhum seguidor extraído ainda. Execute o "Extrair Seguidores" primeiro.', 'warn');
    }
  });

  // Controles Globais por Plataforma
  document.querySelectorAll('.btn-global').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const cmd = btn.dataset.cmd;
      if (!platform || !cmd) return;

      if (cmd === 'STOP_ALL')   stopAllPlatform(platform);
      if (cmd === 'PAUSE_ALL')  pauseAllPlatform(platform);
      if (cmd === 'RESUME_ALL') resumeAllPlatform(platform);
    });
  });

  // Botão Parar Tudo Global (Cabeçalho)
  el('btn-stop-all-global')?.addEventListener('click', () => {
    if (confirm('Deseja parar todas as automações ativas em todas as abas?')) {
      stopAllGlobal();
    }
  });

  // Modal de Configurações
  initSettingsModal();

  // Accordion Toggles
  el('btn-toggle-config-ig')?.addEventListener('click', () => {
    el('accordion-ig')?.classList.toggle('open');
  });

  // Botões de Salvar por Aba
  el('btn-save-ig')?.addEventListener('click', saveInstagramSettings);

  // Teste de Conexão Groq IA
  el('btn-test-groq-ig')?.addEventListener('click', () => testGroqConnection('ig'));
  el('btn-test-groq-fb')?.addEventListener('click', () => testGroqConnection('fb'));
  el('btn-test-groq-wa')?.addEventListener('click', () => testGroqConnection('wa'));

  // Sincronização ao digitar a chave ou mudar o modelo Groq em qualquer aba
  ['ig', 'fb', 'wa'].forEach(pfx => {
    el(`groq-api-key-${pfx}`)?.addEventListener('input', (e) => {
      syncAIKeyInputs(e.target.value);
    });
    el(`${pfx}-use-ai`)?.addEventListener('change', (e) => {
      syncAIToggles(e.target.checked);
    });
    el(`groq-model-${pfx}`)?.addEventListener('change', (e) => {
      syncAIModelSelects(e.target.value);
      window.AIEngine?.saveSettings({ model: e.target.value });
    });
  });

  // Limpar logs
  document.querySelectorAll('.log-clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.platform;
      const logBody = el(`log-${p}`);
      if (logBody) logBody.innerHTML = '';
      if (window.MetaStorage?.clearLogs) window.MetaStorage.clearLogs(p).catch(() => {});
    });
  });

  // Botões de velocidade
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const platform = btn.dataset.platform;
      const speed = btn.dataset.speed;
      if (!platform || !speed) return;

      setSpeedButtonUI(platform, speed);

      if (window.MetaStorage?.getSettings && window.MetaStorage?.saveSettings) {
        const conf = await window.MetaStorage.getSettings(platform);
        conf.speed = speed;
        await window.MetaStorage.saveSettings(platform, conf);
      }

      addLogEntry(platform, `⚡ Velocidade alterada para: ${speed.toUpperCase()}`, 'info');
    });
  });

  // Exportar CSV
  el('ig-scraper-export')?.addEventListener('click', () => exportScrapedCSV('instagram'));

  // Zerar Estatísticas
  el('btn-reset-stats')?.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja zerar todas as estatísticas acumuladas?')) {
      if (window.MetaStorage?.resetCounters) await window.MetaStorage.resetCounters();
      if (window.MetaStorage?.resetWASendStats) await window.MetaStorage.resetWASendStats();

      state.counters = {
        instagram: { follow: 0, unfollow: 0, like: 0, profileLike: 0, comment: 0, dm: 0, story: 0, scraper: 0 },
        facebook:  { like: 0, groupLike: 0, comment: 0, friend: 0, acceptFriend: 0, share: 0, messenger: 0, post: 0, event: 0, memberScraper: 0 },
        whatsapp:  { bulk: 0, scheduled: 0, group: 0, autoreply: 0 },
      };
      state.waStats = { sent: 0, delivered: 0, failed: 0, pending: 0 };

      updateCountersUI();
      updateDashboardUI();
    }
  });
  // Relógio do rodapé
  function updateFooterTime() {
    const clock = el('footer-time');
    if (clock) clock.textContent = fmtTime();
  }
  updateFooterTime();
  setInterval(updateFooterTime, 1000);
}

// ── Persistência em Tempo Real de Formulários ──────────────
function setupRealtimePersistence() {
  const fields = [
    // Facebook
    { id: 'fb-search-keyword',       fn: saveFacebookSettings },
    { id: 'fb-post-theme',           fn: saveFacebookSettings },
    { id: 'fb-post-text',            fn: saveFacebookSettings },
    { id: 'fb-post-link',            fn: saveFacebookSettings },
    { id: 'fb-target-groups-manual', fn: saveFacebookSettings },
    { id: 'fb-group-delay-min',      fn: saveFacebookSettings },
    { id: 'fb-group-delay-max',      fn: saveFacebookSettings },
    { id: 'fb-event-title',          fn: saveFacebookSettings },
    { id: 'fb-event-date',           fn: saveFacebookSettings },
    { id: 'fb-event-link',           fn: saveFacebookSettings },
    { id: 'fb-event-description',    fn: saveFacebookSettings },
    { id: 'fb-messenger-contacts',   fn: saveFacebookSettings },
    { id: 'fb-messenger-template',   fn: saveFacebookSettings },

    // WhatsApp
    { id: 'wa-message-template', fn: saveWhatsAppSettings },
    { id: 'wa-message-link',     fn: saveWhatsAppSettings },
    { id: 'wa-media-url',        fn: saveWhatsAppSettings },
    { id: 'wa-contacts',         fn: saveWhatsAppSettings },
    { id: 'wa-groups',           fn: saveWhatsAppSettings },
    { id: 'wa-group-template',   fn: saveWhatsAppSettings },
    { id: 'wa-reply-template',   fn: saveWhatsAppSettings },
    { id: 'wa-delay-min',        fn: saveWhatsAppSettings },
    { id: 'wa-delay-max',        fn: saveWhatsAppSettings },

    // Instagram
    { id: 'ig-hashtag',        fn: saveInstagramSettings },
    { id: 'ig-target-profile', fn: saveInstagramSettings },
    { id: 'ig-limit-scraper',  fn: saveInstagramSettings },
    { id: 'ig-dm-targets',     fn: saveInstagramSettings },
    { id: 'ig-dm-template',    fn: saveInstagramSettings },
    { id: 'ig-comments',       fn: saveInstagramSettings },
    { id: 'ig-limit-follow',   fn: saveInstagramSettings },
    { id: 'ig-limit-like',     fn: saveInstagramSettings },
  ];

  const timers = new Map();
  fields.forEach(({ id, fn }) => {
    const input = el(id);
    if (!input) return;
    const trigger = () => {
      clearTimeout(timers.get(fn));
      timers.set(fn, setTimeout(() => fn().catch(() => {}), 350));
    };
    input.addEventListener('input', trigger);
    input.addEventListener('change', trigger);
  });
}

// ── Inicialização ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Se configurado para sempre abrir em janela flutuante e não estiver destacado ainda
  if (!window.location.search.includes('detached=1') && typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['metaflow_always_detached'], (res) => {
      if (res?.metaflow_always_detached) {
        chrome.runtime.sendMessage({ type: 'OPEN_DETACHED_WINDOW' }).catch(() => {});
        window.close();
      }
    });
  }

  setupEventListeners();
  setupMediaUpload();
  setupRealtimePersistence();
  setupSliderSync();
  setupCSVZone();
  initSettingsModal();
  await loadPersistentCounters();
  await loadAllSettings();
  await checkPlatformTabs();

  setInterval(checkPlatformTabs, 4000);
});
