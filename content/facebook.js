// ==========================================================
// 📘 FACEBOOK AUTOMATION MODULE v2.0
// MetaFlow Marketing Automation
// Funções: Like (feed+grupo), Comment, Friend Req.,
//          Accept Friends, Member Scraper, AutoShare,
//          Messenger, Group Post, Create Event
// ==========================================================
;(function () {
  'use strict';

  if (window.__metaflow_facebook_injected__) return;
  window.__metaflow_facebook_injected__ = true;

  const PLATFORM = 'facebook';
  const BE  = () => window.BehaviorEngine;
  const SEL = () => window.MetaSelectors;
  const STO = () => window.MetaStorage;
  const CAP = () => window.CaptchaDetector;
  const SCH = () => window.MetaScheduler;

  let running = {};
  let paused  = {};
  let settings = {};
  let sessionIds = {};

  async function log(msg, type = 'info') {
    console.log(`[MetaFlow:FB] ${msg}`);
    await STO().addLog(PLATFORM, msg, type);
  }

  function updateStatus(action, status) {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', platform: PLATFORM, action, status }).catch(() => {});
  }

  async function loadSettings() {
    settings = await STO().getSettings(PLATFORM);
  }

  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function startCaptchaGuard() {
    CAP().start(PLATFORM, async () => {
      await log('⚠️ Captcha/bloqueio detectado! Pausando.', 'error');
      stopAll();
    });
  }

  async function checkTimeWindow() {
    if (!settings.timeRangeStart || !settings.timeRangeEnd) return true;
    return SCH().waitForWindow(settings.timeRangeStart, settings.timeRangeEnd,
      (msg, type) => log(msg, type));
  }

  // ── Injetar texto em contenteditable ─────────────────────
  async function typeInContentEditable(el, text, speed) {
    return BE().digitarContentEditable(el, text, speed || settings.speed || 'normal');
  }

  // ════════════════════════════════════════════════════════
  // 👍 AUTO-LIKE (feed)
  // ════════════════════════════════════════════════════════
  async function autoLike() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.like = true;
    updateStatus('like', 'active');
    await log('▶ Auto-Like iniciado', 'info');
    sessionIds.like = await STO().startSession(PLATFORM, 'like');

    if (!(await checkTimeWindow())) { running.like = false; updateStatus('like','stopped'); return; }
    startCaptchaGuard();

    let liked = 0;
    const limit = settings.limitLike || 40;

    while (running.like && liked < limit) {
      await be.esperarSeNecessario(PLATFORM, 'like', limit);
      await be.rolarPagina(be.delayNormal(400, 0.4));
      await be.esperar(be.pausaLeitura());

      const btns = document.querySelectorAll('[aria-label="Curtir"],[aria-label="Like"]');
      let acted = false;
      for (const btn of btns) {
        if (!btn.offsetParent) continue;
        if (btn.getAttribute('aria-pressed') === 'true') continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        liked++;
        await STO().incrementCounter(PLATFORM, 'like');
        await log(`👍 Curtiu post #${liked}/${limit}`, 'success');
        acted = true;
        await be.esperar(be.delayNormal(2800, 0.5));
        break;
      }
      if (!acted) await be.rolarPagina(500);
    }

    running.like = false; updateStatus('like', 'stopped');
    await STO().endSession(sessionIds.like, liked);
    CAP().stop();
    await log(`⏹ Auto-Like encerrado — ${liked} curtidas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 👍 GROUP LIKE (curte posts dentro de um grupo)
  // ════════════════════════════════════════════════════════
  async function groupLike() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.groupLike = true;
    updateStatus('groupLike', 'active');
    await log('▶ Group Like iniciado', 'info');
    sessionIds.groupLike = await STO().startSession(PLATFORM, 'groupLike');

    const groupUrl = settings.targetGroup;
    if (!groupUrl) {
      await log('URL do grupo não configurada.', 'error');
      running.groupLike = false; updateStatus('groupLike','stopped'); return;
    }

    const groupId = groupUrl.replace('https://www.facebook.com/groups/', '').replace('/', '');
    if (!window.location.href.includes(groupId)) {
      window.location.href = groupUrl;
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.5));

    let liked = 0;
    const limit = settings.limitLike || 40;

    while (running.groupLike && liked < limit) {
      await be.esperarSeNecessario(PLATFORM, 'groupLike', limit);
      await be.rolarPagina(be.delayNormal(400, 0.4));
      await be.esperar(be.pausaLeitura());

      const btns = document.querySelectorAll('[aria-label="Curtir"],[aria-label="Like"]');
      let acted = false;
      for (const btn of btns) {
        if (!btn.offsetParent) continue;
        if (btn.getAttribute('aria-pressed') === 'true') continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        liked++;
        await STO().incrementCounter(PLATFORM, 'like');
        await log(`👍 Curtiu post no grupo #${liked}/${limit}`, 'success');
        acted = true;
        await be.esperar(be.delayNormal(3000, 0.5));
        break;
      }
      if (!acted) await be.rolarPagina(500);
    }

    running.groupLike = false; updateStatus('groupLike','stopped');
    await STO().endSession(sessionIds.groupLike, liked);
    CAP().stop();
    await log(`⏹ Group Like encerrado — ${liked} curtidas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 💬 AUTO-COMMENT
  // ════════════════════════════════════════════════════════
  async function autoComment() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.comment = true;
    updateStatus('comment', 'active');
    await log('▶ Auto-Comment iniciado', 'info');
    sessionIds.comment = await STO().startSession(PLATFORM, 'comment');

    if (!(await checkTimeWindow())) { running.comment = false; updateStatus('comment','stopped'); return; }
    startCaptchaGuard();

    let commented = 0;
    const limit = settings.limitComment || 10;
    const commentList = settings.comments?.length ? settings.comments : ['Ótimo post! 👍'];

    while (running.comment && commented < limit) {
      await be.esperarSeNecessario(PLATFORM, 'comment', limit);
      await be.rolarPagina(be.delayNormal(500, 0.4));
      await be.esperar(be.pausaLeitura());

      const inputs = SEL().findAll(PLATFORM, 'commentInput');
      let acted = false;
      for (const input of inputs) {
        if (!input.offsetParent) continue;
        await be.rolarAteElemento(input);
        await be.clicar(input);
        await be.esperar(be.delayNormal(800, 0.3));

        let texto = '';
        if (window.AIEngine?.isReady() && settings.useAI !== false) {
          try {
            const postContainer = input.closest('[role="article"]') || input.closest('[data-pagelet*="FeedUnit"]');
            const postTextEl = postContainer?.querySelector('[data-ad-preview="message"], div[dir="auto"]');
            const postText = postTextEl ? postTextEl.innerText : '';
            await log('🤖 Gerando comentário inteligente com Groq IA...', 'info');
            texto = await window.AIEngine.generateComment(postText, 'facebook');
          } catch (e) {
            console.warn('[MetaFlow:FB] Falha na IA:', e);
          }
        }

        if (!texto) {
          texto = randomItem(commentList);
        }

        await typeInContentEditable(input, texto);
        await be.esperar(be.delayNormal(1200, 0.4));

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));
        commented++;
        await STO().incrementCounter(PLATFORM, 'comment');
        await log(`💬 Comentário #${commented}/${limit}: "${texto}"`, 'success');
        acted = true;
        await be.esperar(be.delayNormal(4500, 0.5));
        break;
      }
      if (!acted) await be.rolarPagina(600);
    }

    running.comment = false; updateStatus('comment','stopped');
    await STO().endSession(sessionIds.comment, commented);
    CAP().stop();
    await log(`⏹ Auto-Comment encerrado — ${commented} comentários`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 🤝 FRIEND REQUEST
  // ════════════════════════════════════════════════════════
  async function autoFriendRequest() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.friend = true;
    updateStatus('friend', 'active');
    await log('▶ Friend Request iniciado', 'info');
    sessionIds.friend = await STO().startSession(PLATFORM, 'friend');

    if (!window.location.href.includes('/friends/suggestions')) {
      window.location.href = 'https://www.facebook.com/friends/suggestions';
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.4));

    let sent = 0;
    const limit = settings.limitFriend || 15;

    while (running.friend && sent < limit) {
      await be.esperarSeNecessario(PLATFORM, 'friend', limit);
      const btns = SEL().findAll(PLATFORM, 'friendAddBtn');
      let acted = false;
      for (const btn of btns) {
        if (!btn.offsetParent) continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        sent++;
        await STO().incrementCounter(PLATFORM, 'friend');
        await log(`🤝 Solicitação #${sent}/${limit}`, 'success');
        acted = true;
        await be.esperar(be.delayNormal(3200, 0.5));
        break;
      }
      if (!acted) { await be.rolarPagina(400); await be.esperar(2000); }
    }

    running.friend = false; updateStatus('friend','stopped');
    await STO().endSession(sessionIds.friend, sent);
    CAP().stop();
    await log(`⏹ Friend Request encerrado — ${sent} solicitações`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // ✅ ACCEPT FRIEND REQUESTS
  // ════════════════════════════════════════════════════════
  async function acceptFriendRequests() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.acceptFriend = true;
    updateStatus('acceptFriend', 'active');
    await log('▶ Aceitar Amizades iniciado', 'info');
    sessionIds.acceptFriend = await STO().startSession(PLATFORM, 'acceptFriend');

    if (!window.location.href.includes('/friends/requests')) {
      window.location.href = 'https://www.facebook.com/friends/requests';
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.4));

    let accepted = 0;

    while (running.acceptFriend) {
      const confirmBtns = SEL().findAll(PLATFORM, 'friendAcceptBtn');
      if (!confirmBtns.length) {
        await log('Nenhuma solicitação pendente encontrada', 'warn');
        break;
      }

      for (const btn of confirmBtns) {
        if (!running.acceptFriend) break;
        if (!btn.offsetParent) continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        accepted++;
        await STO().incrementCounter(PLATFORM, 'acceptFriend');
        await log(`✅ Amizade aceita #${accepted}`, 'success');
        await be.esperar(be.delayNormal(2500, 0.5));
      }

      await be.rolarPagina(400);
      await be.esperar(2000);
    }

    running.acceptFriend = false; updateStatus('acceptFriend','stopped');
    await STO().endSession(sessionIds.acceptFriend, accepted);
    CAP().stop();
    await log(`⏹ Aceitar Amizades encerrado — ${accepted} aceitas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════
  // 👥 MEMBER SCRAPER (extrai membros de um grupo selecionado)
  // ════════════════════════════════════════════════════════
  async function memberScraper(customTargetGroup, customLimit) {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.memberScraper = true;
    updateStatus('memberScraper', 'active');
    await log('▶ Extrator de Membros iniciado', 'info');

    // Tentar resolver a URL do grupo de várias fontes
    let groupUrl = customTargetGroup;
    if (!groupUrl && typeof chrome !== 'undefined' && chrome.storage?.local) {
      const stored = await new Promise(r => chrome.storage.local.get(['fb_selected_my_group', 'fb_members_target_url'], r));
      groupUrl = stored?.fb_selected_my_group || stored?.fb_members_target_url;
    }
    if (!groupUrl && settings.targetGroup) {
      groupUrl = settings.targetGroup;
    }
    // Se ainda não tiver, verifica se a aba atual já é um grupo
    if (!groupUrl && window.location.pathname.includes('/groups/')) {
      const match = window.location.href.match(/(https:\/\/[^/]+)?\/groups\/([^/?#]+)/);
      if (match && !['search', 'feed', 'joins', 'discover', 'categories'].includes(match[2])) {
        groupUrl = `https://www.facebook.com/groups/${match[2]}/`;
      }
    }

    if (!groupUrl) {
      await log('⚠️ Selecione um grupo na lista "Meus Grupos" ou nos grupos buscados antes de extrair membros!', 'error');
      running.memberScraper = false; updateStatus('memberScraper','stopped'); return;
    }

    const cleanGroupUrl = groupUrl.split('?')[0].replace(/\/+$/, '');
    const membersUrl = `${cleanGroupUrl}/members`;

    if (!window.location.href.includes('/members')) {
      await log(`Navegando para lista de membros: ${membersUrl}...`, 'info');
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise(r => chrome.storage.local.set({
          fb_pending_member_scraper: { groupUrl: cleanGroupUrl, limit: customLimit || 100, timestamp: Date.now() }
        }, r));
      }
      window.location.href = membersUrl;
      return;
    }

    await be.esperar(be.delayNormal(3500, 0.5));
    startCaptchaGuard();

    const targetLimit = customLimit || 100;
    const scraped = [];
    const seen = new Set();
    let scrolls = 0;
    const maxScrolls = Math.min(80, Math.ceil(targetLimit / 5) + 20);

    while (running.memberScraper && scraped.length < targetLimit && scrolls < maxScrolls) {
      await be._checkPause();

      const items = document.querySelectorAll('div[data-pagelet*="GroupMember"] a[href], a[href*="/profile.php"], a[href*="facebook.com/"][role="link"]');
      for (const item of items) {
        const href = item.getAttribute('href')?.split('?')[0];
        if (!href || seen.has(href)) continue;
        if (href.includes('/groups/') || href.includes('/help/') || href.includes('/pages/') || href.includes('/events/')) continue;
        seen.add(href);
        const name = item.querySelector('span')?.textContent?.trim() || item.textContent?.trim() || '';
        if (name && name.length > 1 && !name.toLowerCase().startsWith('foto') && name.toLowerCase() !== 'entrar' && name.toLowerCase() !== 'participar') {
          scraped.push({ name, url: href.startsWith('http') ? href : `https://www.facebook.com${href}` });
        }
        if (scraped.length >= targetLimit) break;
      }

      window.scrollBy(0, 600);
      await be.esperar(be.delayNormal(2000, 0.4));
      scrolls++;
      await log(`👥 Coletados ${scraped.length}/${targetLimit} membros (scroll ${scrolls}/${maxScrolls})`, 'info');
    }

    const groupId = cleanGroupUrl.replace('https://www.facebook.com/groups/', '').replace(/\//g,'') || 'grupo';
    await STO().saveScrapedList(`fb_members_${groupId}`, scraped);
    running.memberScraper = false; updateStatus('memberScraper','stopped');
    await log(`✅ Extração concluída — ${scraped.length} membros salvos com sucesso!`, 'success');

    chrome.runtime.sendMessage({
      type: 'SCRAPED_DATA', platform: PLATFORM,
      key: `fb_members_${groupId}`, count: scraped.length,
      data: scraped,
    }).catch(() => {});
  }

  // ════════════════════════════════════════════════════════
  // 🔄 AUTO-SHARE
  // ════════════════════════════════════════════════════════
  async function autoShare() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.share = true;
    updateStatus('share', 'active');
    await log('▶ Auto-Share iniciado', 'info');
    sessionIds.share = await STO().startSession(PLATFORM, 'share');

    startCaptchaGuard();
    let shared = 0;
    const limit = settings.limitShare || 10;

    while (running.share && shared < limit) {
      await be.esperarSeNecessario(PLATFORM, 'share', limit);
      await be.rolarPagina(be.delayNormal(400, 0.4));
      await be.esperar(be.pausaLeitura());

      const shareBtns = SEL().findAll(PLATFORM, 'shareBtn');
      let acted = false;
      for (const btn of shareBtns) {
        if (!btn.offsetParent) continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        await be.esperar(be.delayNormal(1500, 0.4));

        // Clicar em "Compartilhar agora" no dialog
        const shareNowBtn = Array.from(document.querySelectorAll('div[role="menuitem"]')).find(el =>
          el.textContent?.toLowerCase().includes('compartilhar agora') ||
          el.textContent?.toLowerCase().includes('share now'));
        if (shareNowBtn) {
          await be.clicar(shareNowBtn);
          shared++;
          await STO().incrementCounter(PLATFORM, 'share');
          await log(`🔄 Post compartilhado #${shared}/${limit}`, 'success');
          acted = true;
          await be.esperar(be.delayNormal(4000, 0.5));
          break;
        }

        // Fechar dialog se não encontrou opção
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await be.esperar(1000);
        break;
      }
      if (!acted) await be.rolarPagina(500);
    }

    running.share = false; updateStatus('share','stopped');
    await STO().endSession(sessionIds.share, shared);
    CAP().stop();
    await log(`⏹ Auto-Share encerrado — ${shared} compartilhamentos`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 💬 MESSENGER AUTOMÁTICO
  // ════════════════════════════════════════════════════════
  async function autoMessenger() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.messenger = true;
    updateStatus('messenger', 'active');
    await log('▶ Messenger Automático iniciado', 'info');
    sessionIds.messenger = await STO().startSession(PLATFORM, 'messenger');

    if (!(await checkTimeWindow())) { running.messenger = false; updateStatus('messenger','stopped'); return; }

    const contacts = (settings.messengerContacts || '').split('\n').map(s => s.trim()).filter(Boolean);
    if (!contacts.length) {
      await log('Nenhum contato configurado para o Messenger.', 'error');
      running.messenger = false; updateStatus('messenger','stopped'); return;
    }

    const template = settings.messengerTemplate || 'Olá {nome}! 😊';
    const limit = Math.min(settings.limitMessenger || 20, contacts.length);

    // Navegar para Messenger
    if (!window.location.href.includes('messenger.com') && !window.location.href.includes('facebook.com/messages')) {
      window.location.href = 'https://www.facebook.com/messages/t/';
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.5));

    let sent = 0;
    for (const contact of contacts) {
      if (!running.messenger || sent >= limit) break;
      await be.esperarSeNecessario(PLATFORM, 'messenger', limit);

      // Pesquisar contato
      const searchBox = SEL().find(PLATFORM, 'messengerSearch');
      if (!searchBox) { await be.esperar(3000); continue; }

      await be.clicar(searchBox);
      await be.digitar(searchBox, contact, settings.speed || 'normal');
      await be.esperar(be.delayNormal(1800, 0.4));

      const firstResult = document.querySelector('[role="option"]:first-child, li[role="option"]:first-child');
      if (!firstResult) {
        await log(`Contato não encontrado: ${contact}`, 'warn');
        searchBox.value = '';
        searchBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
        continue;
      }

      const contactName = firstResult.querySelector('span')?.textContent?.trim() || contact;
      await be.clicar(firstResult);
      await be.esperar(be.delayNormal(2000, 0.5));

      const msgInput = SEL().find(PLATFORM, 'messengerInput');
      if (!msgInput) { await log('Input do Messenger não encontrado', 'warn'); continue; }

      const mensagem = be.personalizar(template, { nome: contactName, sobrenome: contactName.split(' ')[1] || '' });
      await typeInContentEditable(msgInput, mensagem);
      await be.esperar(be.delayNormal(800, 0.3));
      msgInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));

      sent++;
      await STO().incrementCounter(PLATFORM, 'messenger');
      await log(`✉️ Messenger enviado #${sent}/${limit} → ${contactName}`, 'success');
      await be.esperar(be.delayNormal(8000, 0.5));
    }

    running.messenger = false; updateStatus('messenger','stopped');
    await STO().endSession(sessionIds.messenger, sent);
    CAP().stop();
    await log(`⏹ Messenger encerrado — ${sent} mensagens`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 🔎 BUSCADOR DE GRUPOS POR PALAVRA-CHAVE / NICHO
  // ════════════════════════════════════════════════════════
  async function searchFacebookGroups(keyword) {
    const be = BE();
    const cleanKw = (keyword || '').trim();
    if (!cleanKw) {
      await log('Informe uma palavra-chave para buscar grupos.', 'error');
      return;
    }

    await log(`🔎 Buscando grupos com a palavra-chave: "${cleanKw}"...`, 'info');
    const searchUrl = `https://www.facebook.com/groups/search/groups/?q=${encodeURIComponent(cleanKw)}`;

    if (!window.location.href.includes('/groups/search/groups') || !decodeURIComponent(window.location.href).includes(cleanKw)) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise(r => chrome.storage.local.set({
          fb_pending_search: { keyword: cleanKw, timestamp: Date.now() }
        }, r));
      }
      window.location.href = searchUrl;
      return;
    }

    await be.esperar(be.delayNormal(4000, 0.4));

    // Rola a página para carregar grupos
    for (let r = 0; r < 4; r++) {
      await be.rolarPagina(700);
      await be.esperar(1500);
    }

    // Extrai grupos encontrados com foto, título limpo e estatísticas
    const groupLinks = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const seen = new Set();
    const groups = [];

    for (const link of groupLinks) {
      const rawHref = link.getAttribute('href') || '';
      const match = rawHref.match(/(https:\/\/[^/]+)?\/groups\/([^/?#]+)/);
      if (!match) continue;
      const groupSlug = match[2];
      if (['search', 'feed', 'joins', 'discover', 'categories'].includes(groupSlug)) continue;

      const groupUrl = `https://www.facebook.com/groups/${groupSlug}/`;
      if (seen.has(groupUrl)) continue;

      // Localiza o card do grupo no feed de busca
      const card = link.closest('div[role="feed"] > div, div[role="article"], div[role="main"] > div') ||
                   link.closest('div[class*="x9f619"][class*="x78zum5"]') ||
                   link.parentElement?.parentElement;
      if (!card) continue;

      // 1. Extrair imagem de capa / avatar do grupo
      let imgUrl = '';
      const imgEl = card.querySelector('img[src*="scontent"], img[src*="fbcdn"], img');
      if (imgEl) {
        imgUrl = imgEl.getAttribute('src') || '';
      }

      // 2. Extrair título limpo do grupo (removendo prefixos "Foto do perfil de" etc.)
      let rawTitle = '';
      const titleEl = card.querySelector('h2, [role="heading"], a[role="link"] span, strong');
      if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 2) {
        rawTitle = titleEl.textContent.trim();
      } else {
        const linksInCard = Array.from(card.querySelectorAll(`a[href*="/groups/${groupSlug}"]`));
        for (const l of linksInCard) {
          const t = l.textContent?.trim() || '';
          if (t && !t.toLowerCase().startsWith('foto') && t.length > 2) {
            rawTitle = t;
            break;
          }
        }
        if (!rawTitle) {
          rawTitle = link.textContent?.trim() || link.getAttribute('aria-label') || groupSlug;
        }
      }

      // Limpa prefixos
      const cleanName = rawTitle
        .replace(/^(foto do perfil de |foto de capa de |foto do grupo |profile picture of |cover photo of )/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanName || cleanName.length < 2 || cleanName.toLowerCase() === 'participar' || cleanName.toLowerCase() === 'entrar') {
        continue;
      }

      // 3. Extrair subtítulo / estatísticas ("Público · 7,1 mil membros · 9 posts por dia")
      let subtitle = '';
      let members = 'Grupo público';
      const cardText = card.textContent || '';

      const spans = Array.from(card.querySelectorAll('span, div')).filter(el => {
        const t = el.textContent?.trim() || '';
        return (t.includes('membro') || t.includes('member') || t.includes('post')) && t.length < 90 && t.length > 5;
      });

      for (const sp of spans) {
        const t = sp.textContent?.trim() || '';
        if (t.includes('membro') || t.includes('member')) {
          subtitle = t;
          break;
        }
      }

      const membersMatch = cardText.match(/([0-9.,]+(?: mil| k| mi)?)\s+membros?/i) || cardText.match(/([0-9.,]+(?: mil| k| mi)?)\s+members?/i);
      if (membersMatch) {
        members = membersMatch[0];
      }

      if (!subtitle) {
        const isPriv = cardText.toLowerCase().includes('privado') ? 'Privado' : 'Público';
        subtitle = `${isPriv} · ${members}`;
      }

      seen.add(groupUrl);
      groups.push({
        name: cleanName,
        url: groupUrl,
        image: imgUrl,
        subtitle: subtitle,
        members: members
      });

      if (groups.length >= 40) break;
    }

    await log(`✅ Encontrados ${groups.length} grupos para "${cleanKw}"!`, 'success');

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise(r => chrome.storage.local.set({ fb_searched_groups: groups, fb_last_search_kw: cleanKw }, r));
    }
    chrome.runtime.sendMessage({ type: 'FB_GROUPS_FOUND', keyword: cleanKw, groups }).catch(() => {});
    return groups;
  }

  // ── Verificações pendentes pós-redirecionamento ──────────
  async function checkPendingTasks() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    chrome.storage.local.get(['fb_pending_search', 'fb_pending_load_joined', 'fb_pending_member_scraper', 'fb_group_queue'], async (res) => {
      const now = Date.now();

      // 1. Fila de postagem / entrada em grupos pendente (prioridade máxima)
      if (res?.fb_group_queue?.status === 'running' && now - res.fb_group_queue.updatedAt < 7200000) {
        const q = res.fb_group_queue;
        await log(`🔄 Retomando fila de grupos no Facebook [${q.currentIndex + 1}/${q.total}]...`, 'info');
        await BE().esperar(4000);
        await runGroupQueue();
        return;
      }

      // 2. Busca de grupos pendente
      if (res?.fb_pending_search?.keyword && now - res.fb_pending_search.timestamp < 120000) {
        if (window.location.href.includes('/groups/search/groups')) {
          const kw = res.fb_pending_search.keyword;
          chrome.storage.local.remove('fb_pending_search');
          await log(`🔎 Retomando busca automática de grupos para "${kw}"...`, 'info');
          await BE().esperar(3500);
          await searchFacebookGroups(kw);
        }
      }

      // 3. Carregar grupos participados pendente
      if (res?.fb_pending_load_joined && now - res.fb_pending_load_joined.timestamp < 120000) {
        if (window.location.href.includes('/groups/joins')) {
          chrome.storage.local.remove('fb_pending_load_joined');
          await log('🔄 Carregando grupos participados...', 'info');
          await BE().esperar(3500);
          await loadMyJoinedGroups();
        }
      }

      // 4. Extrator de membros pendente
      if (res?.fb_pending_member_scraper?.groupUrl && now - res.fb_pending_member_scraper.timestamp < 120000) {
        if (window.location.href.includes('/members')) {
          const p = res.fb_pending_member_scraper;
          chrome.storage.local.remove('fb_pending_member_scraper');
          await log(`👥 Retomando extração de membros do grupo...`, 'info');
          await BE().esperar(3500);
          await memberScraper(p.groupUrl, p.limit);
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // 👥 CARREGAR MEUS GRUPOS PARTICIPADOS (/groups/joins/)
  // ════════════════════════════════════════════════════════
  async function loadMyJoinedGroups() {
    const be = BE();
    await log('🔄 Acessando seus grupos participados no Facebook...', 'info');

    const joinsUrl = 'https://www.facebook.com/groups/joins/';
    if (!window.location.href.includes('/groups/joins')) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise(r => chrome.storage.local.set({
          fb_pending_load_joined: { timestamp: Date.now() }
        }, r));
      }
      window.location.href = joinsUrl;
      return;
    }

    await be.esperar(be.delayNormal(4000, 0.4));

    // Rola a página para carregar grupos participados
    for (let r = 0; r < 4; r++) {
      await be.rolarPagina(800);
      await be.esperar(1500);
    }

    const groupLinks = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
    const seen = new Set();
    const joinedGroups = [];

    for (const link of groupLinks) {
      const rawHref = link.getAttribute('href') || '';
      const match = rawHref.match(/(https:\/\/[^/]+)?\/groups\/([^/?#]+)/);
      if (!match) continue;
      const groupSlug = match[2];
      if (['search', 'feed', 'joins', 'discover', 'categories', 'notifications'].includes(groupSlug)) continue;

      const groupUrl = `https://www.facebook.com/groups/${groupSlug}/`;
      if (seen.has(groupUrl)) continue;

      const card = link.closest('div[role="article"], div[role="listitem"], div[class*="x9f619"][class*="x78zum5"]') ||
                   link.parentElement?.parentElement;
      if (!card) continue;

      // 1. Imagem de capa / avatar do grupo
      let imgUrl = '';
      const imgEl = card.querySelector('img[src*="scontent"], img[src*="fbcdn"], img');
      if (imgEl) imgUrl = imgEl.getAttribute('src') || '';

      // 2. Título limpo
      let rawTitle = '';
      const titleEl = card.querySelector('h2, [role="heading"], a[role="link"] span, strong');
      if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 2) {
        rawTitle = titleEl.textContent.trim();
      } else {
        rawTitle = link.textContent?.trim() || groupSlug;
      }

      const cleanName = rawTitle
        .replace(/^(foto do perfil de |foto de capa de |foto do grupo |profile picture of |cover photo of )/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanName || cleanName.length < 2 || cleanName.toLowerCase() === 'participar' || cleanName.toLowerCase() === 'entrar') {
        continue;
      }

      // 3. Subtítulo / Atividade
      let subtitle = '';
      const spans = Array.from(card.querySelectorAll('span'))
        .map(s => s.textContent?.trim() || '')
        .filter(t => t.length > 3 && t.length < 80 && t !== cleanName && !t.toLowerCase().startsWith('foto'));
      if (spans.length) subtitle = spans.slice(0, 2).join(' · ');

      seen.add(groupUrl);
      joinedGroups.push({
        name: cleanName,
        url: groupUrl,
        image: imgUrl,
        subtitle: subtitle || 'Grupo participante',
        members: 'Participando'
      });

      if (joinedGroups.length >= 60) break;
    }

    await log(`✅ ${joinedGroups.length} grupos participados foram encontrados!`, 'success');

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise(r => chrome.storage.local.set({ fb_my_joined_groups: joinedGroups }, r));
    }

    chrome.runtime.sendMessage({
      type: 'FB_MY_GROUPS_LOADED',
      groups: joinedGroups
    }).catch(() => {});

    return joinedGroups;
  }

  // ════════════════════════════════════════════════════════
  // ➕ ENTRAR / PARTICIPAR DE UM GRUPO NO FACEBOOK
  // ════════════════════════════════════════════════════════
  async function joinFacebookGroup(groupUrl) {
    const be = BE();
    await log(`🔍 Verificando status no grupo: ${groupUrl}...`, 'info');

    const cleanGroupPath = groupUrl.replace('https://www.facebook.com', '').split('?')[0];
    if (!window.location.pathname.includes(cleanGroupPath.replace(/\/$/, ''))) {
      window.location.href = groupUrl;
      await be.esperar(be.delayNormal(5000, 0.4));
    } else {
      await be.esperar(be.delayNormal(2500, 0.4));
    }

    // 1. Verifica se já é membro
    const isAlreadyMember = SEL().find(PLATFORM, 'joinedGroupBadge') ||
      SEL().find(PLATFORM, 'groupPostTrigger') ||
      Array.from(document.querySelectorAll('div[role="button"], span')).some(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        return t === 'participando' || t === 'entrou' || t === 'joined' || t.includes('escreva algo');
      });

    if (isAlreadyMember) {
      await log(`✅ Você já é membro deste grupo!`, 'success');
      return { ok: true, status: 'already_member' };
    }

    // 2. Procura botão "Participar do grupo" / "Entrar no grupo"
    let joinBtn = SEL().find(PLATFORM, 'joinGroupBtn');
    if (!joinBtn) {
      const allButtons = Array.from(document.querySelectorAll('div[role="button"], button, span'));
      joinBtn = allButtons.find(b => {
        const t = (b.textContent || '').trim().toLowerCase();
        return (t === 'participar do grupo' || t === 'participar' || t === 'entrar no grupo' || t === 'join group' || t === 'join');
      });
    }

    if (!joinBtn) {
      await log(`⚠️ Botão "Participar" não encontrado. O grupo pode ser privado/fechado.`, 'warn');
      return { ok: false, status: 'not_found' };
    }

    await be.rolarAteElemento(joinBtn);
    await be.clicar(joinBtn);
    await log(`👆 Botão "Participar" clicado! Aguardando resposta...`, 'info');
    await be.esperar(be.delayNormal(3000, 0.3));

    // 3. Questionário / Regras do grupo
    const submitQuestionsBtn = SEL().find(PLATFORM, 'groupQuestionsSubmit') ||
      Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button')).find(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('enviar') || t.includes('concluir') || t.includes('submit');
      });

    if (submitQuestionsBtn) {
      const ruleCheckboxes = Array.from(document.querySelectorAll('div[role="dialog"] input[type="checkbox"]'));
      for (const cb of ruleCheckboxes) {
        if (!cb.checked) await be.clicar(cb);
      }
      await be.esperar(1000);
      await be.clicar(submitQuestionsBtn);
      await log(`📝 Regras do grupo aceitas e enviadas automaticamente!`, 'info');
      await be.esperar(2000);
    }

    // Verifica se ficou pendente de aprovação de admin
    const isPending = Array.from(document.querySelectorAll('span, div')).some(el => {
      const t = (el.textContent || '').toLowerCase();
      return t.includes('solicitação enviada') || t.includes('pendente') || t.includes('cancelar solicitação');
    });

    if (isPending) {
      await log(`⏳ Entrada solicitada (aguardando aprovação dos administradores).`, 'info');
      return { ok: true, status: 'pending' };
    }

    await log(`🎉 Entrada no grupo realizada com sucesso!`, 'success');
    return { ok: true, status: 'joined' };
  }

  // ════════════════════════════════════════════════════════
  // 📢 PROCESSADOR DA FILA DE GRUPOS (À PROVA DE RELOAD/NAVEGAÇÃO)
  // ════════════════════════════════════════════════════════
  async function runGroupQueue() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    const res = await new Promise(r => chrome.storage.local.get(['fb_group_queue'], r));
    const queue = res?.fb_group_queue;
    if (!queue || queue.status !== 'running' || !queue.targetGroups?.length) return;

    if (queue.currentIndex >= queue.total) {
      await chrome.storage.local.remove('fb_group_queue');
      running.post = false;
      updateStatus('post', 'stopped');
      await log(`🎉 Todos os ${queue.total} grupos foram processados! (${queue.countSuccess || 0} ações bem-sucedidas)`, 'success');
      return;
    }

    const be = BE();
    be.protegerFingerprint();
    running.post = true;
    updateStatus('post', 'active');

    const groupUrl = queue.targetGroups[queue.currentIndex];
    const total = queue.total;
    const currentIdx = queue.currentIndex;

    // 1. Verifica se já está na página do grupo
    const cleanGroupPath = groupUrl.replace('https://www.facebook.com', '').split('?')[0].replace(/\/$/, '');
    const currentPath = window.location.pathname.replace(/\/$/, '');

    if (!currentPath.includes(cleanGroupPath)) {
      await log(`[${currentIdx + 1}/${total}] Navegando para o grupo: ${groupUrl}...`, 'info');
      queue.updatedAt = Date.now();
      await new Promise(r => chrome.storage.local.set({ fb_group_queue: queue }, r));
      window.location.href = groupUrl;
      return; // O navegador descarrega a página e checkPendingTasks continuará quando carregar!
    }

    // 2. Já está no grupo! Aguarda estabilizar a página
    await log(`[${currentIdx + 1}/${total}] Página do grupo carregada. Aguardando elementos...`, 'info');
    await be.esperar(be.delayNormal(4000, 0.4));
    startCaptchaGuard();

    let actionSuccess = false;

    // ── MODO 1: APENAS ENTRAR NO GRUPO ─────────────────────
    if (queue.actionMode === 'join_only') {
      const joinResult = await joinFacebookGroup(groupUrl);
      if (joinResult.ok) {
        actionSuccess = true;
        queue.countSuccess = (queue.countSuccess || 0) + 1;
        await STO().incrementCounter(PLATFORM, 'post');
      }
    } else {
      // ── MODO 2: ENTRAR E POSTAR OU APENAS POSTAR ───────────
      let shouldPost = true;
      if (queue.actionMode === 'join_and_post') {
        const joinRes = await joinFacebookGroup(groupUrl);
        if (joinRes.status === 'pending') {
          await log(`[${currentIdx + 1}/${total}] Entrada enviada ao admin do grupo (pendente de aprovação). Post será aprovado depois. Pulando para o próximo...`, 'warn');
          shouldPost = false;
        } else {
          await be.esperar(2500);
        }
      }

      if (shouldPost) {
        let postTrigger = SEL().find(PLATFORM, 'groupPostTrigger') || SEL().find(PLATFORM, 'postBox');
        if (!postTrigger) {
          const buttons = Array.from(document.querySelectorAll('div[role="button"], span, div[tabindex="0"]'));
          postTrigger = buttons.find(b => {
            const t = (b.textContent || '').toLowerCase();
            return (t.includes('escreva algo') || t.includes('no que você está pensando') || t.includes('write something') || t.includes('criar uma publicação'));
          });
        }

        if (!postTrigger) {
          const hasJoinBtn = SEL().find(PLATFORM, 'joinGroupBtn');
          if (hasJoinBtn) {
            await log(`[${currentIdx + 1}/${total}] Você ainda não participa deste grupo. Dica: use o modo 'Entrar e Postar'. Pulando...`, 'warn');
          } else {
            await log(`[${currentIdx + 1}/${total}] Caixa de publicação não encontrada. Pulando...`, 'warn');
          }
        } else {
          await be.rolarAteElemento(postTrigger);
          await be.clicar(postTrigger);
          await be.esperar(be.delayNormal(2500, 0.4));

          const postInput = SEL().find(PLATFORM, 'groupPostInput') ||
            document.querySelector('div[role="dialog"] div[contenteditable="true"][role="textbox"]') ||
            document.querySelector('div[contenteditable="true"][role="textbox"]');

          if (!postInput) {
            await log(`[${currentIdx + 1}/${total}] Campo de digitação não abriu. Pulando...`, 'warn');
          } else {
            let finalPost = be.personalizar(queue.postTemplate || '', {});
            finalPost = finalPost.replace(/\{([^{}]+)\}/g, (match, contents) => {
              const parts = contents.split('|');
              return parts[Math.floor(Math.random() * parts.length)];
            });

            if (queue.postLink && !finalPost.includes(queue.postLink)) {
              finalPost += `\n\n${queue.postLink}`;
            }

            await typeInContentEditable(postInput, finalPost);
            await be.esperar(be.delayNormal(2000, 0.4));

            if (queue.postLink) await be.esperar(3000);

            // Anexo de Fotos e Vídeos
            const mediaList = queue.mediaList || [];
            if (mediaList && mediaList.length > 0) {
              await log(`[${currentIdx + 1}/${total}] Anexando ${mediaList.length} arquivo(s) de foto/vídeo...`, 'info');
              try {
                let fileInput = SEL().find(PLATFORM, 'postMediaInput') ||
                  document.querySelector('div[role="dialog"] input[type="file"][accept*="image"], div[role="dialog"] input[type="file"]');

                if (!fileInput) {
                  const mediaBtn = SEL().find(PLATFORM, 'postMediaBtn') ||
                    Array.from(document.querySelectorAll('div[role="dialog"] [aria-label*="Foto"], div[role="dialog"] [aria-label*="Photo"], div[role="dialog"] [aria-label*="Mídia"], div[role="dialog"] [aria-label*="Vídeo"]')).find(b => b.offsetWidth > 0);
                  if (mediaBtn) {
                    await be.clicar(mediaBtn);
                    await be.esperar(1500);
                    fileInput = document.querySelector('div[role="dialog"] input[type="file"][accept*="image"], div[role="dialog"] input[type="file"]');
                  }
                }

                if (fileInput) {
                  const dt = new DataTransfer();
                  for (const item of mediaList) {
                    if (item.dataUrl) {
                      const res = await fetch(item.dataUrl);
                      const blob = await res.blob();
                      const file = new File([blob], item.name || 'midia.jpg', { type: item.type || blob.type || 'image/jpeg' });
                      dt.items.add(file);
                    }
                  }
                  if (dt.files.length > 0) {
                    fileInput.files = dt.files;
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await log(`[${currentIdx + 1}/${total}] Mídia enviada. Aguardando processamento do Facebook...`, 'info');
                    await be.esperar(4500);
                  }
                }
              } catch (mediaErr) {
                await log(`Erro ao anexar mídia: ${mediaErr.message}`, 'warn');
              }
            }

            const publishBtn = SEL().find(PLATFORM, 'publishBtn') ||
              Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button, div[role="button"], button')).find(b => {
                const t = (b.textContent || '').trim().toLowerCase();
                const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                return (t === 'publicar' || t === 'postar' || t === 'post' || aria === 'publicar' || aria === 'post') && !b.getAttribute('aria-disabled');
              });

            if (publishBtn) {
              await be.clicar(publishBtn);
              actionSuccess = true;
              queue.countSuccess = (queue.countSuccess || 0) + 1;
              await STO().incrementCounter(PLATFORM, 'post');
              await log(`📢 Post publicado com sucesso! [${queue.countSuccess}/${total}] no grupo: ${groupUrl}`, 'success');
              await be.esperar(3500);
            } else {
              await log(`[${currentIdx + 1}/${total}] Botão de Publicar não encontrado ou desabilitado.`, 'warn');
            }
          }
        }
      }
    }

    // 3. Incrementa para o próximo grupo
    queue.currentIndex++;
    queue.updatedAt = Date.now();

    if (queue.currentIndex < queue.total) {
      await new Promise(r => chrome.storage.local.set({ fb_group_queue: queue }, r));

      const delayMin = queue.groupDelayMin || 60;
      const delayMax = queue.groupDelayMax || 120;
      const waitSec = Math.floor(delayMin + Math.random() * (delayMax - delayMin));
      await log(`⏳ Aguardando ${waitSec}s antes do próximo grupo [${queue.currentIndex + 1}/${total}] (proteção anti-bloqueio)...`, 'info');
      await be.esperar(waitSec * 1000);

      // Re-checa se ainda está ativo
      const checkRes = await new Promise(r => chrome.storage.local.get(['fb_group_queue'], r));
      if (checkRes?.fb_group_queue?.status === 'running') {
        const nextGroupUrl = queue.targetGroups[queue.currentIndex];
        await log(`[${queue.currentIndex + 1}/${total}] Indo para o próximo grupo: ${nextGroupUrl}...`, 'info');
        window.location.href = nextGroupUrl;
      }
    } else {
      await chrome.storage.local.remove('fb_group_queue');
      running.post = false;
      updateStatus('post', 'stopped');
      await log(`🎉 Todos os ${queue.total} grupos foram processados! (${queue.countSuccess || 0} ações bem-sucedidas)`, 'success');
    }
  }

  // ════════════════════════════════════════════════════════
  // 📢 AUTO GROUP POST DISPATCHER (Cria a fila e dispara)
  // ════════════════════════════════════════════════════════
  async function autoGroupPost(customOptions) {
    await loadSettings();
    const opts = customOptions || {};
    let targetGroups = opts.targetGroups || settings.targetGroups || [];
    if (typeof targetGroups === 'string') {
      targetGroups = targetGroups.split('\n').map(u => u.trim()).filter(Boolean);
    }
    if ((!targetGroups || targetGroups.length === 0) && settings.targetGroup) {
      targetGroups = [settings.targetGroup.trim()];
    }

    if (!targetGroups || targetGroups.length === 0) {
      await log('Nenhum grupo selecionado para postagem.', 'error');
      running.post = false; updateStatus('post', 'stopped'); return;
    }

    const queue = {
      status: 'running',
      currentIndex: 0,
      total: targetGroups.length,
      targetGroups: targetGroups,
      actionMode: opts.actionMode || 'post_only',
      postTemplate: opts.postTemplate || settings.postTemplate || 'Olá a todos! Compartilhando uma grande novidade com vocês 😊',
      postLink: (opts.postLink || settings.postLink || '').trim(),
      mediaList: opts.mediaList || settings.postMediaList || [],
      groupDelayMin: parseInt(opts.groupDelayMin || settings.groupDelayMin || 60, 10),
      groupDelayMax: parseInt(opts.groupDelayMax || settings.groupDelayMax || 120, 10),
      countSuccess: 0,
      updatedAt: Date.now()
    };

    await new Promise(r => chrome.storage.local.set({ fb_group_queue: queue }, r));
    await log(`⚙️ Fila criada com ${queue.total} grupos no modo ${queue.actionMode.toUpperCase()}. Iniciando...`, 'info');
    await runGroupQueue();
  }

  // ════════════════════════════════════════════════════════
  // 📅 CREATE EVENT
  // ════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════
  // 📅 CREATE EVENT
  // ════════════════════════════════════════════════════════
  async function createEvent(customOptions) {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.event = true;
    updateStatus('event', 'active');
    await log('▶ Criação de Evento iniciada', 'info');

    const opts = customOptions || {};
    const title = opts.eventTitle || settings.eventTitle;
    const date = opts.eventDate || settings.eventDate;
    const desc = opts.eventDescription || settings.eventDescription;
    const link = opts.eventLink || settings.eventLink;

    if (!title) {
      await log('Título do evento não configurado.', 'error');
      running.event = false; updateStatus('event','stopped'); return;
    }

    if (!window.location.href.includes('/events/create')) {
      window.location.href = 'https://www.facebook.com/events/create/';
      await be.esperar(be.delayNormal(4500, 0.4));
    }

    await be.esperar(be.delayNormal(3000, 0.4));

    // Preencher nome do evento
    const nameInput = document.querySelector('input[placeholder*="nome"]') ||
      document.querySelector('input[aria-label*="Nome"]') ||
      document.querySelector('input[type="text"]');
    if (nameInput) {
      await be.clicar(nameInput);
      await be.digitar(nameInput, title, settings.speed || 'normal');
    }

    await be.esperar(be.delayNormal(800, 0.3));

    // Preencher data
    if (date) {
      const dateInput = document.querySelector('input[type="date"]') ||
        document.querySelector('[aria-label*="Data"]');
      if (dateInput) {
        await be.clicar(dateInput);
        await be.digitar(dateInput, date, 'rapido');
      }
    }

    // Preencher descrição com link
    let finalDesc = desc || '';
    if (link && !finalDesc.includes(link)) {
      finalDesc += `\n\nMais informações / Inscrição: ${link}`;
    }

    if (finalDesc) {
      const descInput = document.querySelector('textarea[placeholder*="descrição"]') ||
        document.querySelector('[contenteditable="true"][aria-label*="Descrição"]') ||
        document.querySelector('textarea');
      if (descInput) {
        await be.clicar(descInput);
        if (descInput.tagName === 'TEXTAREA') {
          await be.digitar(descInput, finalDesc, settings.speed || 'normal');
        } else {
          await typeInContentEditable(descInput, finalDesc);
        }
      }
    }

    await be.esperar(be.delayNormal(1500, 0.4));

    // Publicar evento
    const createBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => {
      const t = (b.textContent || '').toLowerCase();
      return (t.includes('criar evento') || t.includes('criar') || t.includes('create event')) && !b.getAttribute('aria-disabled');
    });
    if (createBtn) {
      await be.clicar(createBtn);
      await log('📅 Evento criado com sucesso no Facebook!', 'success');
    } else {
      await log('Formulário preenchido! Verifique os detalhes e confirme.', 'info');
    }

    running.event = false; updateStatus('event','stopped');
  }

  // ════════════════════════════════════════════════════════
  // STOP / PAUSE / RESUME
  // ════════════════════════════════════════════════════════
  function stopAction(action) {
    running[action] = false;
    updateStatus(action, 'stopped');
    if (action === 'post' && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove('fb_group_queue');
    }
    log(`⏹ ${action} parado`, 'warn');
  }
  function stopAll() {
    Object.keys(running).forEach(k => { running[k] = false; });
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove('fb_group_queue');
    }
    BE().resume();
    CAP().stop();
    updateStatus('all', 'stopped');
    log('⏹ Tudo parado', 'warn');
  }
  function pauseAll() { BE().pause(); updateStatus('all', 'processing'); log('⏸ Pausado', 'warn'); }
  function resumeAll() { BE().resume(); updateStatus('all', 'active'); log('▶ Retomado', 'info'); }

  // ════════════════════════════════════════════════════════
  // MESSAGE LISTENER
  // ════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.platform !== PLATFORM) return;
    switch (msg.command) {
      case 'SEARCH_FB_GROUPS':   searchFacebookGroups(msg.keyword); break;
      case 'LOAD_MY_GROUPS':     loadMyJoinedGroups(); break;
      case 'START_JOIN_GROUP':   joinFacebookGroup(msg.groupUrl); break;
      case 'START_LIKE':         autoLike();            break;
      case 'START_GROUPLLIKE':   groupLike();           break;
      case 'START_COMMENT':      autoComment();         break;
      case 'START_FRIEND':       autoFriendRequest();   break;
      case 'START_ACCEPTFRIEND': acceptFriendRequests(); break;
      case 'START_MEMBERSCRAPER':memberScraper(msg.targetGroup || msg.options?.targetGroup, msg.limit || msg.options?.limit); break;
      case 'START_SHARE':        autoShare();           break;
      case 'START_MESSENGER':    autoMessenger();       break;
      case 'START_POST':         autoGroupPost(msg.options); break;
      case 'START_EVENT':        createEvent(msg.options);   break;
      case 'STOP_LIKE':          stopAction('like');         break;
      case 'STOP_GROUPLLIKE':    stopAction('groupLike');    break;
      case 'STOP_COMMENT':       stopAction('comment');      break;
      case 'STOP_FRIEND':        stopAction('friend');       break;
      case 'STOP_ACCEPTFRIEND':  stopAction('acceptFriend'); break;
      case 'STOP_MEMBERSCRAPER': stopAction('memberScraper');break;
      case 'STOP_SHARE':         stopAction('share');        break;
      case 'STOP_MESSENGER':     stopAction('messenger');    break;
      case 'STOP_POST':          stopAction('post');         break;
      case 'STOP_EVENT':         stopAction('event');        break;
      case 'STOP_ALL':           stopAll();   break;
      case 'PAUSE_ALL':          pauseAll();  break;
      case 'RESUME_ALL':         resumeAll(); break;
      case 'GET_STATUS': sendResponse({ running, paused }); return true;
    }
    sendResponse({ ok: true }); return true;
  });

  // Inicialização na página do Facebook
  try {
    BE().injectFloatingLauncher();
    checkPendingTasks();
  } catch (_) {}

  log('✅ Facebook module v2.1 carregado', 'info');
})();
