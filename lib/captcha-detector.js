// ==========================================================
// 🛡️ CAPTCHA DETECTOR — MetaFlow Marketing Automation v2.0
// Detecta desafios, captchas e telas de bloqueio.
// Para automaticamente e notifica o popup.
// ==========================================================
window.CaptchaDetector = {
  _active: false,
  _observer: null,
  _callback: null,
  _platform: null,
  _interval: null,

  // Padrões de texto que indicam bloqueio/captcha
  TEXT_PATTERNS: [
    'não conseguimos verificar',
    'atividade incomum',
    'atividade suspeita',
    'confirmar sua identidade',
    'verificar que você é humano',
    'conta foi temporariamente',
    'conta foi bloqueada',
    'muitas ações',
    'tente novamente mais tarde',
    'limite de ações',
    'unusual activity',
    'verify you\'re human',
    'temporarily blocked',
    'action blocked',
    'we detected unusual',
    'too many requests',
    'challenge required',
    'prove you\'re not a robot',
    'security check',
    'checkpoint',
  ],

  // ── Verifica texto do body ─────────────────────────────────
  _checkText() {
    const bodyText = document.body?.innerText?.toLowerCase() || '';
    return this.TEXT_PATTERNS.some(p => bodyText.includes(p));
  },

  // ── Verifica elementos visuais de captcha ─────────────────
  _checkElements() {
    const captchaSelectors = [
      'iframe[src*="captcha"]',
      'iframe[src*="recaptcha"]',
      'div[class*="captcha"]',
      '#captcha',
      'form[action*="checkpoint"]',
      'div[data-testid*="checkpoint"]',
      '[class*="challenge"]',
      '[id*="challenge"]',
      'div[class*="error-page"]',
    ];
    return captchaSelectors.some(sel => {
      try { return !!document.querySelector(sel); } catch { return false; }
    });
  },

  // ── Verifica URL de bloqueio ──────────────────────────────
  _checkUrl() {
    const url = window.location.href;
    const blockedPaths = [
      '/challenge/',
      '/checkpoint/',
      '/accounts/suspended',
      '/accounts/disabled',
      '/integrity/',
    ];
    return blockedPaths.some(p => url.includes(p));
  },

  // ── Resultado completo ────────────────────────────────────
  detect() {
    return this._checkUrl() || this._checkElements() || this._checkText();
  },

  // ── Iniciar monitoramento contínuo ────────────────────────
  start(platform, onDetected) {
    if (this._active) return;
    this._active = true;
    this._platform = platform;
    this._callback = onDetected;

    // Verificar a cada 5 segundos
    this._interval = setInterval(() => {
      if (this.detect()) {
        this._trigger();
      }
    }, 5000);

    // Também via MutationObserver para resposta imediata
    this._observer = new MutationObserver(() => {
      if (this.detect()) {
        this._trigger();
      }
    });

    if (document.body) {
      this._observer.observe(document.body, { childList: true, subtree: true });
    }
  },

  _trigger() {
    if (!this._active) return;
    console.warn(`[MetaFlow:CaptchaDetector] ⚠️ Captcha/bloqueio detectado em ${this._platform}!`);

    // Notifica o popup
    chrome.runtime.sendMessage({
      type: 'CAPTCHA_DETECTED',
      platform: this._platform,
      url: window.location.href,
    }).catch(() => {});

    // Chama callback (ex: parar automação)
    if (typeof this._callback === 'function') {
      this._callback();
    }

    // Para o monitoramento para evitar spam
    this.stop();
  },

  stop() {
    this._active = false;
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
  },

  // ── Aguardar que captcha seja resolvido (polling) ─────────
  async waitForResolution(maxMinutes = 10) {
    const maxMs = maxMinutes * 60 * 1000;
    const start = Date.now();

    console.log(`[MetaFlow] Aguardando resolução do captcha (max ${maxMinutes} min)...`);

    while (Date.now() - start < maxMs) {
      await new Promise(r => setTimeout(r, 5000));
      if (!this.detect()) {
        console.log('[MetaFlow] ✅ Captcha resolvido! Retomando...');
        return true;
      }
    }
    console.warn('[MetaFlow] ⏰ Timeout aguardando captcha. Abortando sessão.');
    return false;
  },
};
