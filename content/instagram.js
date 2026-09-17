// ==========================================================
// 📸 INSTAGRAM AUTOMATION MODULE v2.0
// MetaFlow Marketing Automation
// Funções: Follow (filtrado), Unfollow, Like (feed+perfil),
//          Comment (feed+hashtag), DM, Story View,
//          Follower Scraper
// ==========================================================
;(function () {
  'use strict';

  if (window.__metaflow_instagram_injected__) return;
  window.__metaflow_instagram_injected__ = true;

  const PLATFORM = 'instagram';
  const BE  = () => window.BehaviorEngine;
  const SEL = () => window.MetaSelectors;
  const STO = () => window.MetaStorage;
  const CAP = () => window.CaptchaDetector;
  const SCH = () => window.MetaScheduler;

  let running  = {};  // { action: bool }
  let paused   = {};  // { action: bool }
  let settings = {};
  let sessionIds = {};

  // ── Logging ───────────────────────────────────────────────
  async function log(msg, type = 'info') {
    console.log(`[MetaFlow:IG] ${msg}`);
    await STO().addLog(PLATFORM, msg, type);
  }

  function updateStatus(action, status) {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', platform: PLATFORM, action, status }).catch(() => {});
  }

  async function loadSettings() {
    settings = await STO().getSettings(PLATFORM);
  }

  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── Captcha guard ─────────────────────────────────────────
  function startCaptchaGuard(stopAllFn) {
    CAP().start(PLATFORM, async () => {
      await log('⚠️ Captcha/bloqueio detectado! Pausando todas as ações.', 'error');
      stopAll();
      // Aguardar resolução até 10 minutos
      const resolved = await CAP().waitForResolution(10);
      if (resolved) await log('✅ Captcha resolvido. Reinicie as ações manualmente.', 'info');
    });
  }

  // ── Verificar janela de horário ───────────────────────────
  async function checkTimeWindow() {
    if (!settings.timeRangeStart || !settings.timeRangeEnd) return true;
    return SCH().waitForWindow(settings.timeRangeStart, settings.timeRangeEnd,
      (msg, type) => log(msg, type));
  }

  // ════════════════════════════════════════════════════════
  // 👤 AUTO-FOLLOW (com filtros)
  // ════════════════════════════════════════════════════════
  async function autoFollow() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.follow = true;
    updateStatus('follow', 'active');
    await log('▶ Auto-Follow (filtrado) iniciado', 'info');
    sessionIds.follow = await STO().startSession(PLATFORM, 'follow');

    if (!(await checkTimeWindow())) {
      running.follow = false; updateStatus('follow', 'stopped'); return;
    }

    startCaptchaGuard();
    let followed = 0;
    const limit  = settings.limitFollow || 20;
    const hashtag = settings.hashtag || 'marketing';

    if (!window.location.pathname.startsWith(`/explore/tags/${hashtag}`)) {
      window.location.href = `https://www.instagram.com/explore/tags/${hashtag}/`;
      return;
    }

    await be.esperar(be.delayNormal(3000, 0.4));

    while (running.follow && followed < limit) {
      await be.esperarSeNecessario(PLATFORM, 'follow', limit);

      const posts = SEL().findAll(PLATFORM, 'hashtagPost');
      if (!posts.length) { await be.esperar(5000); continue; }

      const post = posts[Math.floor(Math.random() * Math.min(posts.length, 9))];
      await be.rolarAteElemento(post);
      await be.clicar(post);
      await be.esperar(be.delayNormal(2500, 0.4));

      // ── Filtros antes de seguir ──────────────────────────
      if (settings.filterPublic) {
        const privateLabel = document.querySelector('h2[class*="private"]') ||
          document.querySelector('div[class*="private"]');
        if (privateLabel) {
          await log('🔒 Conta privada — pulando', 'warn');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await be.esperar(1000);
          continue;
        }
      }

      if (settings.filterHasPhoto) {
        const noPhoto = document.querySelector('svg[aria-label*="Sem foto"]');
        if (noPhoto) {
          await log('📷 Sem foto de perfil — pulando', 'warn');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await be.esperar(1000);
          continue;
        }
      }

      if (settings.filterMinPosts > 0) {
        const postCountEl = document.querySelector('span[class*="g47SY"]') ||
          document.querySelector('li:first-child span');
        const postCount = parseInt((postCountEl?.textContent || '0').replace(/\D/g, '')) || 0;
        if (postCount < (settings.filterMinPosts || 3)) {
          await log(`📊 Poucos posts (${postCount}) — pulando`, 'warn');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await be.esperar(1000);
          continue;
        }
      }

      // ── Clicar em Seguir ─────────────────────────────────
      const followBtns = document.querySelectorAll('button');
      let clicked = false;
      for (const btn of followBtns) {
        const txt = btn.innerText?.toLowerCase() || '';
        if (txt === 'seguir' || txt === 'follow') {
          await be.clicar(btn);
          followed++;
          await STO().incrementCounter(PLATFORM, 'follow');
          await log(`✅ Seguiu usuário #${followed}/${limit}`, 'success');
          clicked = true;
          break;
        }
      }

      if (!clicked) await log('Botão seguir não encontrado', 'warn');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await be.esperar(be.delayNormal(2000, 0.5));
      await be.rolarPagina(be.delayNormal(300, 0.3));
    }

    running.follow = false;
    updateStatus('follow', 'stopped');
    await STO().endSession(sessionIds.follow, followed);
    CAP().stop();
    await log(`⏹ Auto-Follow encerrado — ${followed} usuários seguidos`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 💔 AUTO-UNFOLLOW
  // ════════════════════════════════════════════════════════
  async function autoUnfollow() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.unfollow = true;
    updateStatus('unfollow', 'active');
    await log('▶ Auto-Unfollow iniciado', 'info');
    sessionIds.unfollow = await STO().startSession(PLATFORM, 'unfollow');

    if (!(await checkTimeWindow())) {
      running.unfollow = false; updateStatus('unfollow', 'stopped'); return;
    }

    startCaptchaGuard();
    let unfollowed = 0;
    const limit = settings.limitUnfollow || 20;

    // Navegar para lista "seguindo"
    const username = document.querySelector('a[href^="/"] span')?.textContent ||
      document.querySelector('header a[href]')?.getAttribute('href')?.replace('/', '') || '';

    if (!username) {
      await log('Não foi possível detectar o username. Vá até seu perfil.', 'error');
      running.unfollow = false; updateStatus('unfollow', 'stopped'); return;
    }

    if (!window.location.pathname.includes(`/${username}/following`)) {
      // Abrir modal de "seguindo"
      const followingLink = document.querySelector(`a[href="/${username}/following/"]`);
      if (followingLink) {
        await be.clicar(followingLink);
        await be.esperar(be.delayNormal(2000, 0.4));
      } else {
        window.location.href = `https://www.instagram.com/${username}/following/`;
        return;
      }
    }

    await be.esperar(be.delayNormal(2000, 0.4));

    while (running.unfollow && unfollowed < limit) {
      await be.esperarSeNecessario(PLATFORM, 'unfollow', limit);

      // Encontrar botão "Seguindo" no modal
      const followingBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const txt = b.innerText?.toLowerCase() || '';
        return txt === 'seguindo' || txt === 'following';
      });

      if (!followingBtns.length) {
        await be.rolarPagina(300);
        await be.esperar(2000);
        continue;
      }

      const btn = followingBtns[0];
      await be.rolarAteElemento(btn);
      await be.clicar(btn);
      await be.esperar(be.delayNormal(800, 0.4));

      // Confirmar no dialog "Deixar de seguir"
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
        const txt = b.innerText?.toLowerCase() || '';
        return txt.includes('deixar de seguir') || txt.includes('unfollow');
      });

      if (confirmBtn) {
        await be.clicar(confirmBtn);
        unfollowed++;
        await STO().incrementCounter(PLATFORM, 'unfollow');
        await log(`✅ Deixou de seguir #${unfollowed}/${limit}`, 'success');
      }

      await be.esperar(be.delayNormal(3000, 0.5));
    }

    running.unfollow = false;
    updateStatus('unfollow', 'stopped');
    await STO().endSession(sessionIds.unfollow, unfollowed);
    CAP().stop();
    await log(`⏹ Auto-Unfollow encerrado — ${unfollowed} unfollows`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // ❤️ AUTO-LIKE (feed)
  // ════════════════════════════════════════════════════════
  async function autoLike() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.like = true;
    updateStatus('like', 'active');
    await log('▶ Auto-Like iniciado', 'info');
    sessionIds.like = await STO().startSession(PLATFORM, 'like');

    if (!(await checkTimeWindow())) {
      running.like = false; updateStatus('like', 'stopped'); return;
    }

    startCaptchaGuard();
    let liked = 0;
    const limit = settings.limitLike || 50;

    while (running.like && liked < limit) {
      await be.esperarSeNecessario(PLATFORM, 'like', limit);
      await be.rolarPagina(be.delayNormal(500, 0.4));
      await be.esperar(be.pausaLeitura());

      const svgs = document.querySelectorAll('svg[aria-label="Curtir"], svg[aria-label="Like"]');
      let acted = false;
      for (const svg of svgs) {
        const btn = svg.closest('button');
        if (!btn || btn.getAttribute('aria-pressed') !== 'false') continue;
        await be.rolarAteElemento(btn);
        await be.clicar(btn);
        liked++;
        await STO().incrementCounter(PLATFORM, 'like');
        await log(`❤️ Curtiu post #${liked}/${limit}`, 'success');
        acted = true;
        await be.esperar(be.delayNormal(2200, 0.5));
        break;
      }

      if (!acted) await be.rolarPagina(500);
    }

    running.like = false;
    updateStatus('like', 'stopped');
    await STO().endSession(sessionIds.like, liked);
    CAP().stop();
    await log(`⏹ Auto-Like encerrado — ${liked} curtidas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // ❤️ PROFILE LIKE (curte X posts de um perfil específico)
  // ════════════════════════════════════════════════════════
  async function profileLike() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.profileLike = true;
    updateStatus('profileLike', 'active');
    await log(`▶ Profile Like iniciado → @${settings.targetProfile}`, 'info');
    sessionIds.profileLike = await STO().startSession(PLATFORM, 'profileLike');

    const handle = (settings.targetProfile || '').replace('@', '').trim();
    if (!handle) {
      await log('Perfil alvo não configurado nas Settings.', 'error');
      running.profileLike = false; updateStatus('profileLike', 'stopped'); return;
    }

    const targetUrl = `https://www.instagram.com/${handle}/`;
    if (!window.location.pathname.startsWith(`/${handle}`)) {
      window.location.href = targetUrl;
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.4));

    let liked = 0;
    const limit = settings.limitProfileLike || 30;
    const processed = new Set();

    while (running.profileLike && liked < limit) {
      await be.esperarSeNecessario(PLATFORM, 'like', limit);

      const posts = Array.from(document.querySelectorAll('a[href*="/p/"]'))
        .filter(a => !processed.has(a.href));

      if (!posts.length) {
        await be.rolarPagina(500);
        await be.esperar(2000);
        continue;
      }

      for (const post of posts.slice(0, 3)) {
        if (!running.profileLike || liked >= limit) break;
        processed.add(post.href);
        await be.clicar(post);
        await be.esperar(be.delayNormal(2000, 0.4));

        // Curtir no modal do post
        const likeBtn = SEL().find(PLATFORM, 'likeBtn');
        const likeBtnEl = likeBtn?.closest('button');
        if (likeBtnEl && likeBtnEl.getAttribute('aria-pressed') !== 'true') {
          await be.clicar(likeBtnEl);
          liked++;
          await STO().incrementCounter(PLATFORM, 'profileLike');
          await log(`❤️ Curtiu post do @${handle} #${liked}/${limit}`, 'success');
          await be.esperar(be.delayNormal(2000, 0.5));
        }

        // Fechar modal
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await be.esperar(be.delayNormal(1500, 0.4));
      }

      await be.rolarPagina(400);
    }

    running.profileLike = false;
    updateStatus('profileLike', 'stopped');
    await STO().endSession(sessionIds.profileLike, liked);
    CAP().stop();
    await log(`⏹ Profile Like encerrado — ${liked} curtidas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 💬 AUTO-COMMENT (feed + hashtag específica)
  // ════════════════════════════════════════════════════════
  async function autoComment() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.comment = true;
    updateStatus('comment', 'active');
    await log('▶ Auto-Comment iniciado', 'info');
    sessionIds.comment = await STO().startSession(PLATFORM, 'comment');

    if (!(await checkTimeWindow())) {
      running.comment = false; updateStatus('comment', 'stopped'); return;
    }

    startCaptchaGuard();
    let commented = 0;
    const limit = settings.limitComment || 15;
    const commentList = settings.comments?.length ? settings.comments : ['Incrível! 🔥'];

    // Se hashtag configurada, navegar para ela
    const hashtag = settings.hashtag;
    if (hashtag && !window.location.pathname.startsWith(`/explore/tags/${hashtag}`)) {
      window.location.href = `https://www.instagram.com/explore/tags/${hashtag}/`;
      return;
    }

    while (running.comment && commented < limit) {
      await be.esperarSeNecessario(PLATFORM, 'comment', limit);
      await be.rolarPagina(be.delayNormal(400, 0.3));
      await be.esperar(be.pausaLeitura());

      const inputs = document.querySelectorAll('textarea[placeholder]');
      let acted = false;

      for (const input of inputs) {
        if (!input.offsetParent) continue;
        await be.rolarAteElemento(input);
        await be.clicar(input);

        let texto = '';
        if (window.AIEngine?.isReady() && settings.useAI !== false) {
          try {
            const postArticle = input.closest('article') || document.querySelector('article');
            const captionEl = postArticle?.querySelector('h1, span[class*="_ap3a"], div[class*="_a9zs"]');
            const caption = captionEl ? captionEl.innerText : '';
            await log('🤖 Gerando comentário inteligente com Groq IA...', 'info');
            texto = await window.AIEngine.generateComment(caption, 'instagram');
          } catch (e) {
            console.warn('[MetaFlow:IG] Falha na IA:', e);
          }
        }

        if (!texto) {
          texto = randomItem(commentList);
        }

        await be.digitar(input, texto, settings.speed || 'normal');

        const form = input.closest('form');
        const submitBtn = form?.querySelector('button[type="submit"]') ||
          input.parentElement?.querySelector('[role="button"]');

        if (submitBtn && !submitBtn.disabled) {
          await be.clicar(submitBtn);
          commented++;
          await STO().incrementCounter(PLATFORM, 'comment');
          await log(`💬 Comentário #${commented}/${limit}: "${texto}"`, 'success');
          acted = true;
        }

        await be.esperar(be.delayNormal(4000, 0.5));
        break;
      }

      if (!acted) await be.rolarPagina(600);
    }

    running.comment = false;
    updateStatus('comment', 'stopped');
    await STO().endSession(sessionIds.comment, commented);
    CAP().stop();
    await log(`⏹ Auto-Comment encerrado — ${commented} comentários`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 📨 AUTO-DM (com personalização {nome})
  // ════════════════════════════════════════════════════════
  async function autoDM() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.dm = true;
    updateStatus('dm', 'active');
    await log('▶ Auto-DM iniciado', 'info');
    sessionIds.dm = await STO().startSession(PLATFORM, 'dm');

    if (!(await checkTimeWindow())) {
      running.dm = false; updateStatus('dm', 'stopped'); return;
    }

    startCaptchaGuard();
    let sent = 0;
    const targets = (settings.dmTargets || '').split('\n').map(s => s.trim().replace('@', '')).filter(Boolean);
    const limit = Math.min(settings.limitDM || 10, targets.length > 0 ? targets.length : 10);
    const template = settings.dmTemplate || 'Olá {nome}! Tudo bem? 😊';

    if (!window.location.pathname.startsWith('/direct/')) {
      window.location.href = 'https://www.instagram.com/direct/inbox/';
      return;
    }

    await be.esperar(be.delayNormal(3000, 0.5));

    if (targets.length > 0) {
      // Envio direcionado para lista de perfis
      for (const targetUser of targets) {
        if (!running.dm || sent >= limit) break;
        await be.esperarSeNecessario(PLATFORM, 'dm', limit);

        const newBtn = SEL().find(PLATFORM, 'dmNewBtn');
        if (!newBtn) { await be.esperar(3000); continue; }

        await be.clicar(newBtn.closest('button') || newBtn);
        await be.esperar(be.delayNormal(2000, 0.4));

        const searchInp = document.querySelector('input[placeholder*="Pesquisar"], input[name="queryBox"]');
        if (!searchInp) { await be.esperar(2000); continue; }

        await be.clicar(searchInp);
        await be.digitar(searchInp, targetUser, settings.speed || 'normal');
        await be.esperar(be.delayNormal(2000, 0.4));

        const userOption = document.querySelector('div[role="dialog"] [role="button"], div[role="dialog"] input[type="checkbox"]');
        if (!userOption) {
          await log(`Perfil @${targetUser} não encontrado no Direct. Pulando...`, 'warn');
          const closeBtn = document.querySelector('div[role="dialog"] svg[aria-label="Fechar"]');
          if (closeBtn) await be.clicar(closeBtn);
          continue;
        }

        await be.clicar(userOption);
        await be.esperar(be.delayNormal(1200, 0.3));

        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => {
          const t = (b.textContent || '').toLowerCase();
          return t.includes('bate-papo') || t.includes('chat') || t.includes('próximo') || t.includes('next');
        });
        if (nextBtn) {
          await be.clicar(nextBtn);
          await be.esperar(be.delayNormal(2500, 0.4));
        }

        const msgInput = SEL().find(PLATFORM, 'dmInput');
        if (msgInput) {
          let mensagem = '';
          if (window.AIEngine?.isReady() && settings.useAI !== false) {
            try {
              mensagem = await window.AIEngine.generateDM(targetUser);
            } catch (e) {}
          }
          if (!mensagem) {
            mensagem = be.personalizar(template, { nome: targetUser, usuario: targetUser });
          }

          await be.digitarContentEditable(msgInput, mensagem, settings.speed || 'normal');
          await be.esperar(be.delayNormal(800, 0.3));
          msgInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));

          sent++;
          await STO().incrementCounter(PLATFORM, 'dm');
          await log(`📨 DM enviada #${sent}/${limit} → @${targetUser}`, 'success');
        }

        await be.esperar(be.delayNormal(6000, 0.4));
      }
    } else {
      // Envio para conversas recentes da caixa
      while (running.dm && sent < limit) {
        await be.esperarSeNecessario(PLATFORM, 'dm', limit);

        const newBtn = SEL().find(PLATFORM, 'dmNewBtn');
        if (!newBtn) { await be.esperar(3000); continue; }

        await be.clicar(newBtn.closest('button') || newBtn);
        await be.esperar(be.delayNormal(2000, 0.4));

        const firstContact = document.querySelector('[role="option"]') ||
          document.querySelector('[role="listitem"] button');
        const contactName = firstContact?.querySelector('span')?.textContent || 'amigo';

        if (firstContact) {
          await be.clicar(firstContact);
          await be.esperar(be.delayNormal(1500, 0.4));

          const nextBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent?.toLowerCase().includes('próximo') || b.textContent?.toLowerCase().includes('next'));
          if (nextBtn) {
            await be.clicar(nextBtn);
            await be.esperar(be.delayNormal(2000, 0.4));
          }

          const msgInput = SEL().find(PLATFORM, 'dmInput');
          if (msgInput) {
            const mensagem = be.personalizar(template, { nome: contactName });
            await be.digitarContentEditable(msgInput, mensagem, settings.speed || 'normal');
            msgInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));
            sent++;
            await STO().incrementCounter(PLATFORM, 'dm');
            await log(`📨 DM enviada #${sent}/${limit} → ${contactName}`, 'success');
          }
        }

        await be.esperar(be.pausaLonga());
      }
    }

    running.dm = false;
    updateStatus('dm', 'stopped');
    await STO().endSession(sessionIds.dm, sent);
    CAP().stop();
    await log(`⏹ Auto-DM encerrado — ${sent} mensagens`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 📖 AUTO-STORY VIEW
  // ════════════════════════════════════════════════════════
  async function autoStoryView() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.story = true;
    updateStatus('story', 'active');
    await log('▶ Auto-Story View iniciado', 'info');
    sessionIds.story = await STO().startSession(PLATFORM, 'story');

    if (!window.location.pathname.startsWith('/') || window.location.pathname !== '/') {
      window.location.href = 'https://www.instagram.com/';
      return;
    }

    startCaptchaGuard();
    await be.esperar(be.delayNormal(3000, 0.4));

    let viewed = 0;
    const limit = settings.limitStory || 50;

    // Clicar no primeiro story ring
    const rings = SEL().findAll(PLATFORM, 'storyRing');
    if (!rings.length) {
      await log('Nenhum story encontrado no feed', 'warn');
      running.story = false; updateStatus('story', 'stopped'); return;
    }

    const firstRing = rings[0];
    await be.rolarAteElemento(firstRing);
    await be.clicar(firstRing);
    await be.esperar(be.delayNormal(2000, 0.5));

    while (running.story && viewed < limit) {
      await be._checkPause();

      // Verificar se estamos em um story
      const storyScreen = document.querySelector('section[class*="story"]') ||
        document.querySelector('div[class*="StoryViewer"]') ||
        document.querySelector('div[class*="_9v8_"]');

      if (!storyScreen) {
        await log('Story encerrado ou não encontrado', 'warn');
        break;
      }

      // Simular leitura do story (2-5 segundos)
      await be.esperar(be.delayNormal(3000, 0.5));

      // Avançar para o próximo
      const nextBtn = SEL().find(PLATFORM, 'storyNext');
      if (nextBtn) {
        await be.clicar(nextBtn);
        viewed++;
        await STO().incrementCounter(PLATFORM, 'story');
        await log(`👁 Story visualizado #${viewed}/${limit}`, 'success');
        await be.esperar(be.delayNormal(1500, 0.4));
      } else {
        // Tentar pressionar seta direita
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        viewed++;
        await STO().incrementCounter(PLATFORM, 'story');
        await be.esperar(be.delayNormal(3500, 0.5));
      }
    }

    running.story = false;
    updateStatus('story', 'stopped');
    await STO().endSession(sessionIds.story, viewed);
    CAP().stop();
    await log(`⏹ Story View encerrado — ${viewed} stories`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 🔍 FOLLOWER SCRAPER
  // ════════════════════════════════════════════════════════
  async function followerScraper() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.scraper = true;
    updateStatus('scraper', 'active');
    await log('▶ Follower Scraper iniciado', 'info');

    const handle = (settings.targetProfile || '').replace('@', '').trim();
    if (!handle) {
      await log('Configure o @perfil alvo nas Settings.', 'error');
      running.scraper = false; updateStatus('scraper', 'stopped'); return;
    }

    if (!window.location.pathname.includes(`/${handle}`)) {
      window.location.href = `https://www.instagram.com/${handle}/`;
      return;
    }

    await be.esperar(be.delayNormal(3000, 0.4));

    // Abrir modal de seguidores
    const followersLink = document.querySelector(`a[href="/${handle}/followers/"]`);
    if (!followersLink) {
      await log('Link de seguidores não encontrado', 'error');
      running.scraper = false; updateStatus('scraper', 'stopped'); return;
    }

    await be.clicar(followersLink);
    await be.esperar(be.delayNormal(2000, 0.4));

    const scraped = [];
    const seen = new Set();
    let scrollAttempts = 0;

    while (running.scraper && scrollAttempts < 30) {
      await be._checkPause();

      const items = document.querySelectorAll('div[role="dialog"] a[role="link"][href]');
      for (const item of items) {
        const href = item.getAttribute('href');
        if (!href || seen.has(href)) continue;
        seen.add(href);
        const name = item.querySelector('span')?.textContent?.trim() || '';
        scraped.push({ handle: href.replace(/\//g, ''), name, url: `https://www.instagram.com${href}` });
      }

      // Rolar lista de seguidores
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        dialog.scrollTop += 400;
        await be.esperar(be.delayNormal(1500, 0.4));
      }

      scrollAttempts++;
      await log(`📋 Coletados ${scraped.length} seguidores (scroll ${scrollAttempts}/30)`, 'info');
    }

    // Salvar na storage
    await STO().saveScrapedList(`ig_followers_${handle}`, scraped);
    running.scraper = false;
    updateStatus('scraper', 'stopped');
    await log(`✅ Scraper concluído — ${scraped.length} seguidores de @${handle} salvos`, 'success');

    // Notificar popup com dados
    chrome.runtime.sendMessage({
      type: 'SCRAPED_DATA',
      platform: PLATFORM,
      key: `ig_followers_${handle}`,
      count: scraped.length,
      handle,
    }).catch(() => {});
  }

  // ════════════════════════════════════════════════════════
  // ⏸ PAUSE / RESUME
  // ════════════════════════════════════════════════════════
  function pauseAll() {
    BE().pause();
    Object.keys(running).forEach(k => { paused[k] = running[k]; });
    updateStatus('all', 'processing');
    log('⏸ Automações pausadas', 'warn');
  }

  function resumeAll() {
    BE().resume();
    updateStatus('all', 'active');
    log('▶ Automações retomadas', 'info');
  }

  function stopAction(action) {
    running[action] = false;
    updateStatus(action, 'stopped');
    log(`⏹ ${action} parado`, 'warn');
  }

  function stopAll() {
    Object.keys(running).forEach(k => { running[k] = false; });
    BE().resume(); // garantir que não fique preso em pause
    CAP().stop();
    updateStatus('all', 'stopped');
    log('⏹ Todas as automações paradas', 'warn');
  }

  // ════════════════════════════════════════════════════════
  // 📡 MESSAGE LISTENER
  // ════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.platform !== PLATFORM) return;
    switch (msg.command) {
      case 'START_FOLLOW':      autoFollow();      break;
      case 'START_UNFOLLOW':    autoUnfollow();    break;
      case 'START_LIKE':        autoLike();        break;
      case 'START_PROFILELIKE': profileLike();     break;
      case 'START_COMMENT':     autoComment();     break;
      case 'START_DM':          autoDM();          break;
      case 'START_STORY':       autoStoryView();   break;
      case 'START_SCRAPER':     followerScraper(); break;
      case 'STOP_FOLLOW':       stopAction('follow');      break;
      case 'STOP_UNFOLLOW':     stopAction('unfollow');    break;
      case 'STOP_LIKE':         stopAction('like');        break;
      case 'STOP_PROFILELIKE':  stopAction('profileLike'); break;
      case 'STOP_COMMENT':      stopAction('comment');     break;
      case 'STOP_DM':           stopAction('dm');          break;
      case 'STOP_STORY':        stopAction('story');       break;
      case 'STOP_SCRAPER':      stopAction('scraper');     break;
      case 'STOP_ALL':          stopAll();  break;
      case 'PAUSE_ALL':         pauseAll(); break;
      case 'RESUME_ALL':        resumeAll(); break;
      case 'GET_STATUS': sendResponse({ running, paused }); return true;
    }
    sendResponse({ ok: true });
    return true;
  });

  try {
    BE().injectFloatingLauncher();
  } catch (_) {}

  log('✅ Instagram module v2.0 carregado', 'info');
})();
