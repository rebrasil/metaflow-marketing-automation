// ==========================================================
// ⏰ SCHEDULER LIB — MetaFlow Marketing Automation v2.0
// Gerencia agendamento de ações por horário e faixa horária.
// ==========================================================
window.MetaScheduler = {

  // ── Verifica se agora está dentro da faixa horária ────────
  isWithinTimeRange(startHHMM, endHHMM) {
    if (!startHHMM || !endHHMM) return true; // sem restrição

    const now = new Date();
    const [sh, sm] = startHHMM.split(':').map(Number);
    const [eh, em] = endHHMM.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = sh * 60 + sm;
    const endMin   = eh * 60 + em;

    if (startMin <= endMin) {
      return nowMin >= startMin && nowMin <= endMin;
    } else {
      // Crosses midnight (ex: 22:00 – 06:00)
      return nowMin >= startMin || nowMin <= endMin;
    }
  },

  // ── Milissegundos até o próximo horário HH:MM ─────────────
  msUntil(targetHHMM) {
    if (!targetHHMM) return 0;
    const [h, m] = targetHHMM.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  },

  // ── Aguardar faixa horária (bloqueia até entrar na janela) ─
  async waitForWindow(startHHMM, endHHMM, logFn) {
    if (!startHHMM || !endHHMM) return true;

    while (!this.isWithinTimeRange(startHHMM, endHHMM)) {
      const ms = this.msUntil(startHHMM);
      const mins = Math.round(ms / 60000);
      if (typeof logFn === 'function') {
        logFn(`🕐 Fora da janela (${startHHMM}–${endHHMM}). Aguardando ${mins} min...`, 'warn');
      }
      // Dorme em blocos de 60s verificando a cada minuto
      await new Promise(r => setTimeout(r, Math.min(ms, 60000)));

      // Verificar se automação foi parada durante a espera
      if (this._stopRequested) return false;
    }
    return true;
  },

  _stopRequested: false,
  requestStop() { this._stopRequested = true; },
  resetStop()   { this._stopRequested = false; },

  // ── Formata horário atual ─────────────────────────────────
  currentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  },

  // ── Verifica se agendamento deve disparar agora ───────────
  shouldRunNow(scheduledHHMM, toleranceMinutes = 2) {
    if (!scheduledHHMM) return false;
    const [sh, sm] = scheduledHHMM.split(':').map(Number);
    const now = new Date();
    const diffMin = Math.abs((now.getHours() * 60 + now.getMinutes()) - (sh * 60 + sm));
    return diffMin <= toleranceMinutes;
  },

  // ── Registrar alarm via chrome.alarms ────────────────────
  async setAlarm(name, targetHHMM) {
    if (!targetHHMM) return;
    const ms = this.msUntil(targetHHMM);
    const delayMin = Math.max(1, ms / 60000);
    chrome.alarms.create(`metaflow_${name}`, { delayInMinutes: delayMin });
    console.log(`[MetaFlow:Scheduler] Alarm "${name}" definido para ${targetHHMM} (em ~${Math.round(delayMin)} min)`);
  },

  async clearAlarm(name) {
    chrome.alarms.clear(`metaflow_${name}`);
  },
};
