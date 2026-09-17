// ==========================================================
// 🧠 MOTOR DE COMPORTAMENTO BIOMÉTRICO HUMANO v2.0
// MetaFlow Marketing Automation
// Adições v2.0: pause/resume, MutationObserver helpers,
// integração captcha, variação por perfil de velocidade
// ==========================================================
const BehaviorEngine = {

  // ── Pause/Resume ─────────────────────────────────────────
  _paused: false,
  _pauseResolvers: [],

  pause() {
    this._paused = true;
    console.log('[BehaviorEngine] ⏸ Pausado');
  },

  resume() {
    this._paused = false;
    this._pauseResolvers.forEach(r => r());
    this._pauseResolvers = [];
    console.log('[BehaviorEngine] ▶ Retomado');
  },

  async _checkPause() {
    if (!this._paused) return;
    await new Promise(resolve => this._pauseResolvers.push(resolve));
  },

  // ════════════════════════════════════════════════════════
  // ⏱️ TIMING — DELAYS ORGÂNICOS
  // ════════════════════════════════════════════════════════
  delayNormal(mediaMs, variacao = 0.35) {
    const min = mediaMs * (1 - variacao);
    const max = mediaMs * (1 + variacao);
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    z = Math.max(-2, Math.min(2, z));
    const valor = mediaMs + (z * variacao * mediaMs);
    return Math.floor(Math.max(min, Math.min(max, valor)));
  },

  pausaLeitura() { return this.delayNormal(2500, 0.6); },
  pausaCurta()   { return this.delayNormal(600,  0.5); },
  pausaLonga()   { return this.delayNormal(12000, 0.5); },

  async esperar(ms) {
    await this._checkPause();
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ════════════════════════════════════════════════════════
  // 🖱️ MOUSE — TRAJETÓRIA HUMANA
  // ════════════════════════════════════════════════════════
  mousePosicaoAtual: { x: 400, y: 300 },

  gerarCaminhoMouse(inicioX, inicioY, alvoX, alvoY, passos = 25) {
    const pontos = [];
    const dx = alvoX - inicioX;
    const dy = alvoY - inicioY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const p1x = inicioX + dx * 0.3 + (Math.random() - 0.5) * dist * 0.4;
    const p1y = inicioY + dy * 0.3 + (Math.random() - 0.5) * dist * 0.4;
    const p2x = inicioX + dx * 0.7 + (Math.random() - 0.5) * dist * 0.25;
    const p2y = inicioY + dy * 0.7 + (Math.random() - 0.5) * dist * 0.25;
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const fatorVelocidade = t < 0.3 ? t * 3 : t > 0.8 ? (1 - t) * 5 : 1;
      const tAjustado = t * fatorVelocidade + (Math.random() - 0.5) * 0.02;
      const x = Math.pow(1 - tAjustado, 3) * inicioX +
                3 * Math.pow(1 - tAjustado, 2) * tAjustado * p1x +
                3 * (1 - tAjustado) * Math.pow(tAjustado, 2) * p2x +
                Math.pow(tAjustado, 3) * alvoX;
      const y = Math.pow(1 - tAjustado, 3) * inicioY +
                3 * Math.pow(1 - tAjustado, 2) * tAjustado * p1y +
                3 * (1 - tAjustado) * Math.pow(tAjustado, 2) * p2y +
                Math.pow(tAjustado, 3) * alvoY;
      pontos.push({
        x: Math.round(x + (Math.random() - 0.5) * 1.5),
        y: Math.round(y + (Math.random() - 0.5) * 1.5),
        delay: Math.floor(12 + Math.random() * 8),
      });
    }
    if (Math.random() > 0.65 && dist > 50) {
      pontos.push({ x: alvoX + (Math.random() - 0.5) * 6, y: alvoY + (Math.random() - 0.5) * 6, delay: 30 });
      pontos.push({ x: alvoX, y: alvoY, delay: 20 });
    }
    return pontos;
  },

  dispararEventoMouse(tipo, x, y) {
    document.dispatchEvent(new MouseEvent(tipo, {
      bubbles: true, cancelable: true, view: window,
      clientX: x, clientY: y,
      screenX: x + window.screenX, screenY: y + window.screenY,
      button: 0, buttons: 1,
    }));
  },

  async moverParaElemento(elemento) {
    const rect = elemento.getBoundingClientRect();
    const alvoX = rect.left + rect.width  * (0.3 + Math.random() * 0.4);
    const alvoY = rect.top  + rect.height * (0.3 + Math.random() * 0.4);
    const caminho = this.gerarCaminhoMouse(this.mousePosicaoAtual.x, this.mousePosicaoAtual.y, alvoX, alvoY);
    for (const ponto of caminho) {
      this.dispararEventoMouse('mousemove', ponto.x, ponto.y);
      this.mousePosicaoAtual = { x: ponto.x, y: ponto.y };
      await this.esperar(ponto.delay);
    }
    await this.esperar(this.delayNormal(180, 0.4));
  },

  async clicar(elemento) {
    if (!elemento || !document.contains(elemento)) return;
    await this.moverParaElemento(elemento);
    this.dispararEventoMouse('mousedown', this.mousePosicaoAtual.x, this.mousePosicaoAtual.y);
    await this.esperar(40 + Math.random() * 60);
    this.dispararEventoMouse('mouseup',  this.mousePosicaoAtual.x, this.mousePosicaoAtual.y);
    this.dispararEventoMouse('click',    this.mousePosicaoAtual.x, this.mousePosicaoAtual.y);
    elemento.click(); // native fallback
    await this.esperar(this.pausaCurta());
  },

  // ════════════════════════════════════════════════════════
  // ⌨️ DIGITAÇÃO REALISTA
  // ════════════════════════════════════════════════════════
  async digitar(elemento, texto, velocidade = 'normal') {
    const velocidades = {
      devagar: { media: 220, variacao: 0.45 },
      normal:  { media: 140, variacao: 0.40 },
      rapido:  { media: 85,  variacao: 0.35 },
    };
    const { media, variacao } = velocidades[velocidade] || velocidades.normal;
    elemento.focus();
    await this.esperar(this.delayNormal(300, 0.3));

    for (let i = 0; i < texto.length; i++) {
      await this._checkPause();
      const char = texto[i];

      // 5% chance de erro de digitação
      if (Math.random() < 0.05 && i > 2 && i < texto.length - 1) {
        const erro = 'qwertyuiopasdfghjklzxcvbnm'[Math.floor(Math.random() * 26)];
        elemento.value += erro;
        elemento.dispatchEvent(new InputEvent('input', { bubbles: true, data: erro, inputType: 'insertText' }));
        await this.esperar(this.delayNormal(200, 0.4));
        elemento.value = elemento.value.slice(0, -1);
        elemento.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
        await this.esperar(this.delayNormal(150, 0.3));
      }

      elemento.value += char;
      elemento.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
      const pausaExtra = /[ .,!?;:]/.test(char) ? this.delayNormal(180, 0.5) : 0;
      await this.esperar(this.delayNormal(media, variacao) + pausaExtra);
    }
    await this.esperar(this.delayNormal(400, 0.4));
  },

  // ── Digitar em contenteditable (WhatsApp/Facebook) ────────
  async digitarContentEditable(elemento, texto, velocidade = 'normal') {
    const velocidades = {
      devagar: { media: 220, variacao: 0.45 },
      normal:  { media: 140, variacao: 0.40 },
      rapido:  { media: 85,  variacao: 0.35 },
    };
    const { media, variacao } = velocidades[velocidade] || velocidades.normal;

    elemento.focus();
    elemento.click();
    await this.esperar(this.delayNormal(300, 0.3));

    for (const char of texto) {
      await this._checkPause();

      // Método 1: execCommand
      try {
        document.execCommand('insertText', false, char);
      } catch {
        // Método 2: clipboard-like DataTransfer
        const dt = new DataTransfer();
        dt.setData('text/plain', char);
        elemento.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
      }

      elemento.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: char }));
      const pausaExtra = /[ .,!?;:]/.test(char) ? this.delayNormal(180, 0.5) : 0;
      await this.esperar(this.delayNormal(media, variacao) + pausaExtra);
    }

    await this.esperar(this.delayNormal(400, 0.4));
  },

  // ════════════════════════════════════════════════════════
  // 📜 ROLAGEM NATURAL
  // ════════════════════════════════════════════════════════
  async rolarPagina(quantidade = 300) {
    const passos = 8 + Math.floor(Math.random() * 10);
    const valorPorPasso = quantidade / passos;
    for (let i = 0; i < passos; i++) {
      await this._checkPause();
      window.scrollBy(0, valorPorPasso);
      await this.esperar(20 + Math.random() * 40);
    }
    await this.esperar(this.delayNormal(2000, 0.6));
  },

  async rolarAteElemento(elemento) {
    if (!elemento) return;
    const rect = elemento.getBoundingClientRect();
    const alvo = rect.top + window.scrollY - 150;
    let iter = 0;
    while (Math.abs(window.scrollY - alvo) > 20 && iter < 30) {
      await this._checkPause();
      const passo = (alvo - window.scrollY) * 0.25;
      window.scrollBy(0, passo);
      await this.esperar(30 + Math.random() * 50);
      iter++;
    }
    await this.esperar(this.pausaLeitura());
  },

  // ════════════════════════════════════════════════════════
  // 🧭 COMPORTAMENTO ALEATÓRIO
  // ════════════════════════════════════════════════════════
  async comportamentoAleatorio() {
    const acoes = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < acoes; i++) {
      await this._checkPause();
      switch (Math.floor(Math.random() * 4)) {
        case 0: await this.rolarPagina(-150); break;
        case 1: await this.esperar(this.delayNormal(3000, 0.4)); break;
        case 2:
          this.dispararEventoMouse('mousemove', Math.random() * window.innerWidth, Math.random() * window.innerHeight);
          await this.esperar(600 + Math.random() * 800);
          break;
        case 3: await this.rolarPagina(100); break;
      }
    }
  },

  // ════════════════════════════════════════════════════════
  // 🔒 FINGERPRINT PROTECTION
  // ════════════════════════════════════════════════════════
  protegerFingerprint() {
    try {
      Object.defineProperty(navigator, 'webdriver',  { get: () => undefined });
      Object.defineProperty(navigator, 'plugins',    { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages',  { get: () => ['pt-BR', 'pt', 'en'] });
      window.chrome = window.chrome || { runtime: {} };
    } catch (e) {}
  },

  // ════════════════════════════════════════════════════════
  // 📊 RATE LIMITING
  // ════════════════════════════════════════════════════════
  estado: {
    acoesUltimaHora: 0,
    horaUltimaContagem: Date.now(),
    contador: {},
  },

  podeExecutar(plataforma, tipoAcao, limitePorHora = 20) {
    this.estado.contador[plataforma] = this.estado.contador[plataforma] || {};
    this.estado.contador[plataforma][tipoAcao] = this.estado.contador[plataforma][tipoAcao] || 0;
    if (Date.now() - this.estado.horaUltimaContagem > 3600000) {
      this.estado.acoesUltimaHora = 0;
      this.estado.horaUltimaContagem = Date.now();
      this.estado.contador[plataforma][tipoAcao] = 0;
    }
    const pode = this.estado.contador[plataforma][tipoAcao] < limitePorHora;
    if (pode) this.estado.contador[plataforma][tipoAcao]++;
    return pode;
  },

  async esperarSeNecessario(plataforma, tipoAcao, limitePorHora = 20) {
    while (!this.podeExecutar(plataforma, tipoAcao, limitePorHora)) {
      console.log(`⏳ Limite atingido: ${plataforma}/${tipoAcao} — esperando 60s...`);
      await this.esperar(60000);
    }
    if (Math.random() > 0.4) await this.comportamentoAleatorio();
  },

  // ════════════════════════════════════════════════════════
  // 🔄 MUTATION OBSERVER HELPERS
  // ════════════════════════════════════════════════════════
  waitForElement(selector, timeoutMs = 8000, root = document) {
    return new Promise((resolve, reject) => {
      const el = root.querySelector(selector);
      if (el) return resolve(el);

      const obs = new MutationObserver(() => {
        const found = root.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });

      obs.observe(document.body || root, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`waitForElement timeout: ${selector}`)); }, timeoutMs);
    });
  },

  waitForGone(selector, timeoutMs = 8000, root = document) {
    return new Promise((resolve) => {
      if (!root.querySelector(selector)) return resolve();
      const obs = new MutationObserver(() => {
        if (!root.querySelector(selector)) { obs.disconnect(); resolve(); }
      });
      obs.observe(document.body || root, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); resolve(); }, timeoutMs);
    });
  },

  // ── Personalizar template com variáveis {nome} etc. ───────
  personalizar(template, vars = {}) {
    return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] || match);
  },

  // ── Lançador Flutuante na Página ─────────────────────────
  injectFloatingLauncher() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('metaflow-floating-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'metaflow-floating-badge';
    badge.innerHTML = `
      <div class="mf-badge-inner" title="MetaFlow — Clique para Abrir Janela Flutuante (Fixa)">
        <span class="mf-badge-icon">⚡</span>
        <span class="mf-badge-text">MetaFlow</span>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'metaflow-floating-badge-style';
    style.textContent = `
      #metaflow-floating-badge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483645;
        cursor: grab;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #metaflow-floating-badge:active {
        cursor: grabbing;
      }
      .mf-badge-inner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        border: 1px solid rgba(124, 58, 237, 0.4);
        border-radius: 30px;
        padding: 8px 16px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(124, 58, 237, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .mf-badge-inner:hover {
        transform: scale(1.06);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5), 0 0 22px rgba(124, 58, 237, 0.6);
        border-color: #a855f7;
      }
      .mf-badge-icon {
        color: #f59e0b;
        font-size: 15px;
      }
      .mf-badge-text {
        background: linear-gradient(90deg, #c084fc, #f472b6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.5px;
      }
    `;

    try {
      (document.head || document.documentElement).appendChild(style);
      (document.body || document.documentElement).appendChild(badge);

      let isDragging = false;
      let startX = 0, startY = 0;

      badge.addEventListener('mousedown', (e) => {
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;

        const rect = badge.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const onMouseMove = (ev) => {
          if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) {
            isDragging = true;
          }
          badge.style.bottom = 'auto';
          badge.style.right = 'auto';
          badge.style.left = `${Math.max(10, Math.min(window.innerWidth - rect.width - 10, ev.clientX - offsetX))}px`;
          badge.style.top = `${Math.max(10, Math.min(window.innerHeight - rect.height - 10, ev.clientY - offsetY))}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      badge.addEventListener('click', () => {
        if (!isDragging && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ type: 'OPEN_DETACHED_WINDOW' }).catch(() => {});
        }
      });
    } catch (_) {}
  },
};

window.BehaviorEngine = BehaviorEngine;
if (typeof module !== 'undefined') module.exports = BehaviorEngine;
