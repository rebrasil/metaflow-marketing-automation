// ==========================================================
// 💾 STORAGE LIB v2.0 — MetaFlow Marketing Automation
// Persistent counters, statistics, session history
// ==========================================================
window.MetaStorage = {

  async get(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  },
  async set(data) {
    return new Promise(resolve => chrome.storage.local.set(data, resolve));
  },
  async remove(keys) {
    return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
  },
  async clear() {
    return new Promise(resolve => chrome.storage.local.clear(resolve));
  },

  // ════════════════════════════════════════════════════════
  // SETTINGS
  // ════════════════════════════════════════════════════════
  _defaults: {
    instagram: {
      enabled: false,
      speed: 'normal',
      limitFollow: 20,
      limitUnfollow: 20,
      limitLike: 50,
      limitComment: 15,
      limitDM: 10,
      limitStory: 50,
      limitProfileLike: 30,
      hashtag: '',
      targetProfile: '',
      filterPublic: true,
      filterHasPhoto: true,
      filterMinPosts: 3,
      comments: ['Incrível! 🔥', 'Que foto linda! 😍', 'Adorei! ❤️', 'Muito bom! 👏', 'Perfeito! ✨'],
      dmTemplate: 'Olá {nome}! Vi seu perfil e achei muito interessante 😊',
      scheduleTime: '',
      timeRangeStart: '',
      timeRangeEnd: '',
    },
    facebook: {
      enabled: false,
      speed: 'normal',
      limitLike: 40,
      limitComment: 10,
      limitFriend: 15,
      limitPost: 5,
      limitShare: 10,
      limitMessenger: 20,
      targetGroup: '',
      comments: ['Ótimo post! 👍', 'Muito relevante!', 'Amei isso! ❤️'],
      postTemplate: 'Confira isso!',
      messengerTemplate: 'Olá {nome}! Tudo bem? 😊',
      messengerContacts: '',
      eventTitle: '',
      eventDate: '',
      eventDescription: '',
      scheduleTime: '',
      timeRangeStart: '',
      timeRangeEnd: '',
    },
    whatsapp: {
      enabled: false,
      speed: 'normal',
      limitMessages: 30,
      delayMin: 8,
      delayMax: 20,
      contacts: '',
      messageTemplate: 'Olá {nome}! Tudo bem? 😊',
      groups: '',
      groupTemplate: 'Olá grupo! 😊',
      autoReply: false,
      replyTemplate: 'Obrigado pela mensagem! Retornarei em breve. 😊',
      checkDelivery: false,
      timeRangeStart: '09:00',
      timeRangeEnd: '20:00',
      scheduleTime: '',
      csvData: [],
    },
  },

  async getSettings(platform) {
    const key = `settings_${platform}`;
    const stored = await this.get([key]);
    return Object.assign({}, this._defaults[platform] || {}, stored[key] || {});
  },

  async saveSettings(platform, data) {
    await this.set({ [`settings_${platform}`]: data });
  },

  // ════════════════════════════════════════════════════════
  // PERSISTENT COUNTERS (survive popup close)
  // ════════════════════════════════════════════════════════
  async getCounters() {
    const data = await this.get(['mf_counters']);
    return data.mf_counters || {
      instagram: { follow: 0, unfollow: 0, like: 0, comment: 0, dm: 0, story: 0, profileLike: 0 },
      facebook:  { like: 0, comment: 0, friend: 0, post: 0, share: 0, messenger: 0, acceptFriend: 0 },
      whatsapp:  { bulk: 0, group: 0, autoreply: 0, failed: 0, delivered: 0 },
      lastReset: Date.now(),
    };
  },

  async incrementCounter(platform, action, amount = 1) {
    const counters = await this.getCounters();
    if (!counters[platform]) counters[platform] = {};
    counters[platform][action] = (counters[platform][action] || 0) + amount;
    await this.set({ mf_counters: counters });
    return counters[platform][action];
  },

  async resetCounters() {
    await this.set({
      mf_counters: {
        instagram: { follow: 0, unfollow: 0, like: 0, comment: 0, dm: 0, story: 0, profileLike: 0 },
        facebook:  { like: 0, comment: 0, friend: 0, post: 0, share: 0, messenger: 0, acceptFriend: 0 },
        whatsapp:  { bulk: 0, group: 0, autoreply: 0, failed: 0, delivered: 0 },
        lastReset: Date.now(),
      },
    });
  },

  // ════════════════════════════════════════════════════════
  // SESSION HISTORY (last 10 sessions)
  // ════════════════════════════════════════════════════════
  async getSessions() {
    const data = await this.get(['mf_sessions']);
    return data.mf_sessions || [];
  },

  async startSession(platform, action) {
    const sessions = await this.getSessions();
    const session = {
      id: Date.now(),
      platform,
      action,
      startedAt: Date.now(),
      endedAt: null,
      actionsPerformed: 0,
      status: 'running',
    };
    sessions.unshift(session);
    if (sessions.length > 50) sessions.splice(50);
    await this.set({ mf_sessions: sessions });
    return session.id;
  },

  async endSession(sessionId, actionsPerformed, status = 'completed') {
    const sessions = await this.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
      sessions[idx].endedAt = Date.now();
      sessions[idx].actionsPerformed = actionsPerformed;
      sessions[idx].status = status;
      await this.set({ mf_sessions: sessions });
    }
  },

  // ════════════════════════════════════════════════════════
  // LOGS (last 200)
  // ════════════════════════════════════════════════════════
  async getLogs(platform) {
    const key = `mf_logs_${platform}`;
    const data = await this.get([key]);
    return data[key] || [];
  },

  async addLog(platform, message, type = 'info') {
    const key = `mf_logs_${platform}`;
    const logs = await this.getLogs(platform);
    const entry = { ts: Date.now(), message, type };
    logs.unshift(entry);
    if (logs.length > 200) logs.splice(200);
    await this.set({ [key]: logs });

    // Broadcast to popup
    chrome.runtime.sendMessage({
      type: 'LOG',
      platform,
      message,
      logType: type,
    }).catch(() => {});

    return entry;
  },

  async clearLogs(platform) {
    await this.set({ [`mf_logs_${platform}`]: [] });
  },

  // ════════════════════════════════════════════════════════
  // SCRAPED DATA (followers, members lists)
  // ════════════════════════════════════════════════════════
  async saveScrapedList(key, items) {
    await this.set({ [`mf_scraped_${key}`]: items });
  },

  async getScrapedList(key) {
    const data = await this.get([`mf_scraped_${key}`]);
    return data[`mf_scraped_${key}`] || [];
  },

  // ════════════════════════════════════════════════════════
  // PAUSE / RESUME STATE
  // ════════════════════════════════════════════════════════
  async setPauseState(platform, paused) {
    await this.set({ [`mf_paused_${platform}`]: paused });
  },

  async isPaused(platform) {
    const data = await this.get([`mf_paused_${platform}`]);
    return !!data[`mf_paused_${platform}`];
  },

  // ════════════════════════════════════════════════════════
  // WHATSAPP SEND STATISTICS
  // ════════════════════════════════════════════════════════
  async getWASendStats() {
    const data = await this.get(['mf_wa_stats']);
    return data.mf_wa_stats || { sent: 0, failed: 0, pending: 0, delivered: 0, lastRun: null };
  },

  async updateWASendStats(patch) {
    const stats = await this.getWASendStats();
    Object.assign(stats, patch);
    await this.set({ mf_wa_stats: stats });
    return stats;
  },

  async resetWASendStats() {
    await this.set({ mf_wa_stats: { sent: 0, failed: 0, pending: 0, delivered: 0, lastRun: Date.now() } });
  },
};
