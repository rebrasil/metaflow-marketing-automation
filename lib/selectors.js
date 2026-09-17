// ==========================================================
// 🎯 SELECTORS LIB — Robust multi-fallback selectors
// MetaFlow Marketing Automation v2.0
// ==========================================================
// Each platform has an array of selectors tried in order.
// Use MetaSelectors.find(platform, key) to get the element.
// ==========================================================
window.MetaSelectors = {

  // ── Instagram ─────────────────────────────────────────────
  instagram: {
    followBtn: [
      'button._acan._acap._acat._acb6._acp3',
      'button[class*="_acan"]',
      'div[role="button"]:not([aria-label])',
      'button:not([aria-label])',
    ],
    unfollowBtn: [
      'button._acan._acap._acat._aj1-',
      'button[class*="following"]',
      'button[aria-label*="Seguindo"]',
      'button[aria-label*="Following"]',
    ],
    likeBtn: [
      'svg[aria-label="Curtir"]',
      'svg[aria-label="Like"]',
      'span[aria-label*="Curtir"]',
      'button[aria-label*="Curtir"]',
    ],
    unlikedBtn: [
      'button[aria-pressed="false"] svg[aria-label="Curtir"]',
      'button[aria-pressed="false"] svg[aria-label="Like"]',
    ],
    commentInput: [
      'textarea[placeholder*="comentário"]',
      'textarea[placeholder*="comment"]',
      'textarea[aria-label*="Adicione um comentário"]',
      'form textarea',
    ],
    commentSubmit: [
      'button[type="submit"]',
      'div[role="button"][tabindex="0"]',
    ],
    searchInput: [
      'input[placeholder="Pesquisar"]',
      'input[placeholder="Search"]',
      'input[aria-label*="Pesquisar"]',
    ],
    hashtagPost: [
      'article a[href*="/p/"]',
      'div[role="button"] a[href*="/p/"]',
      'a[href*="/p/"]',
    ],
    storyRing: [
      'div[role="button"] canvas',
      'div[tabindex="0"] canvas',
      'button canvas',
      'div._aa72',
    ],
    storyNext: [
      'button[aria-label="Avançar"]',
      'button[aria-label="Next"]',
      'div[aria-label="Avançar"]',
      'svg[aria-label="Avançar"]',
    ],
    profilePost: [
      'div._aagu a',
      'article a[href*="/p/"]',
      'div[class*="grid"] a[href*="/p/"]',
    ],
    followerItem: [
      'div[role="dialog"] a[role="link"]',
      'div[aria-label*="Seguidores"] a',
      'ul li a[href]',
    ],
    dmNewBtn: [
      'svg[aria-label="Nova mensagem"]',
      'svg[aria-label="New Message"]',
      'a[href="/direct/new/"]',
    ],
    dmInput: [
      'div[contenteditable="true"][data-testid="mwm-message-input"]',
      'div[contenteditable="true"][aria-placeholder*="Mensagem"]',
      'div[contenteditable="true"][aria-label*="Mensagem"]',
      'textarea[placeholder*="Mensagem"]',
    ],
    dmSend: [
      'button[type="submit"]',
      'div[role="button"][tabindex="0"]:last-child',
    ],
    profileFollowers: [
      'a[href$="/followers/"]',
      'span:contains("seguidores") a',
    ],
    captcha: [
      'div[class*="captcha"]',
      'form[id*="captcha"]',
      'div[aria-label*="verificação"]',
      'iframe[src*="captcha"]',
      'div:contains("Não conseguimos verificar")',
      'div:contains("Atividade suspeita")',
    ],
  },

  // ── Facebook ──────────────────────────────────────────────
  facebook: {
    likeBtn: [
      '[aria-label="Curtir"]',
      '[aria-label="Like"]',
      'div[aria-label*="Curtir"]',
      'button[aria-label*="Curtir"]',
    ],
    unlikedLike: [
      '[aria-label="Curtir"][aria-pressed="false"]',
      '[aria-label="Like"][aria-pressed="false"]',
    ],
    commentInput: [
      '[contenteditable="true"][aria-placeholder*="comentário"]',
      '[contenteditable="true"][aria-label*="Escreva"]',
      '[contenteditable="true"][role="textbox"]',
      'div[data-testid="UFI2CommentInputField/root"] [contenteditable]',
    ],
    friendAddBtn: [
      '[aria-label="Adicionar amigo"]',
      '[aria-label="Add friend"]',
      'div[aria-label*="Adicionar"]',
      'button[data-testid*="friend_request"]',
    ],
    friendAcceptBtn: [
      '[aria-label="Confirmar"]',
      '[aria-label="Confirm"]',
      'button[data-testid="ufi_reply_composer_confirm"]',
      'div[aria-label*="Confirmar solicitação"]',
    ],
    pendingRequests: [
      'a[href*="/friends/requests"]',
      '[aria-label*="solicitações de amizade"]',
    ],
    shareBtn: [
      '[aria-label="Compartilhar"]',
      '[aria-label="Share"]',
      'div[aria-label*="Compartilhar"]',
    ],
    postBox: [
      '[aria-label="O que você está pensando?"]',
      '[aria-label="What\'s on your mind?"]',
      '[aria-label*="Escreva algo"]',
      '[aria-label*="Write something"]',
      '[data-testid="status-attachment-mentions-input"]',
      'div[role="textbox"][contenteditable]',
      'div[role="button"] span:contains("Escreva algo")',
      'div[role="button"] span:contains("No que você está pensando")',
    ],
    groupPostTrigger: [
      '[aria-label*="Escreva algo"]',
      '[aria-label*="Write something"]',
      '[aria-label*="No que você está pensando"]',
      'div[role="button"] span:contains("Escreva algo")',
      'div[role="button"] span:contains("No que você está pensando")',
      'div[role="button"] span:contains("Criar uma publicação")',
    ],
    groupPostInput: [
      'div[role="dialog"] div[role="textbox"][contenteditable="true"]',
      'div[aria-label*="Criar uma publicação"] div[contenteditable="true"]',
      'div[aria-label*="Create a post"] div[contenteditable="true"]',
      'div[role="textbox"][contenteditable="true"]',
    ],
    postMediaInput: [
      'div[role="dialog"] input[type="file"][accept*="image"]',
      'div[role="dialog"] input[type="file"][accept*="video"]',
      'div[role="dialog"] input[type="file"]',
      'input[type="file"][accept*="image"]',
      'input[type="file"][accept*="video"]',
    ],
    postMediaBtn: [
      'div[role="dialog"] [aria-label*="Foto/vídeo"]',
      'div[role="dialog"] [aria-label*="Photo/video"]',
      'div[role="dialog"] [aria-label*="Foto/Vídeo"]',
      'div[role="dialog"] [aria-label*="Adicionar à sua publicação"]',
      'div[role="dialog"] div[aria-label*="Foto"]',
    ],
    groupSearchResults: [
      'div[role="feed"] a[href*="/groups/"]',
      'div[role="main"] a[href*="/groups/"]',
      'a[href*="facebook.com/groups/"]',
    ],
    groupFeed: [
      '[data-pagelet*="Group"]',
      'div[role="feed"]',
      'div[aria-label*="Grupo"]',
    ],
    messengerSearch: [
      'input[placeholder*="Pesquisar"]',
      'input[aria-label*="Pesquisar no Messenger"]',
      'input[type="search"]',
    ],
    messengerInput: [
      '[contenteditable="true"][aria-label*="mensagem"]',
      'div[role="textbox"][data-testid="mwthreadlist-input-box"]',
      '[contenteditable="true"][role="textbox"]',
    ],
    eventCreate: [
      'a[href*="/events/create"]',
      '[aria-label*="Criar evento"]',
    ],
    groupMembers: [
      'a[href*="/members"]',
      '[aria-label*="Membros"]',
      'div[data-pagelet*="GroupMember"] a',
    ],
    joinGroupBtn: [
      'div[aria-label*="Participar do grupo"][role="button"]',
      'div[aria-label*="Participar"][role="button"]',
      'div[aria-label*="Entrar no grupo"][role="button"]',
      'div[aria-label*="Join group"][role="button"]',
      'div[aria-label*="Join Group"][role="button"]',
      'button[aria-label*="Participar"]',
      'div[role="button"]:has(span:contains("Participar"))',
      'div[role="button"]:has(span:contains("Entrar no grupo"))',
      'div[role="button"] span:contains("Participar do grupo")',
      'div[role="button"] span:contains("Participar")',
    ],
    joinedGroupBadge: [
      'div[aria-label*="Participando"][role="button"]',
      'div[aria-label*="Entrou"][role="button"]',
      'div[aria-label*="Joined"][role="button"]',
      'div[role="button"] span:contains("Participando")',
      'div[role="button"] span:contains("Entrou")',
    ],
    groupQuestionsSubmit: [
      'div[aria-label*="Enviar"][role="button"]',
      'div[aria-label*="Concluir"][role="button"]',
      'button:contains("Enviar")',
      'div[role="button"] span:contains("Enviar")',
    ],
    joinedGroupsFeed: [
      'div[role="main"] a[href*="/groups/"]',
      'div[role="feed"] a[href*="/groups/"]',
      'a[href*="facebook.com/groups/"]',
    ],
    publishBtn: [
      'div[aria-label="Publicar"][role="button"]',
      'div[aria-label="Post"][role="button"]',
      '[aria-label="Publicar"]',
      '[aria-label="Post"]',
      'button[data-testid="react-composer-post-button"]',
      'button:contains("Publicar")',
    ],
    captcha: [
      'div[class*="captcha"]',
      '#captcha',
      'div:contains("Confirmar sua identidade")',
      'div:contains("Atividade incomum")',
      'div[data-testid*="checkpoint"]',
      'form[action*="checkpoint"]',
    ],
  },

  // ── WhatsApp ──────────────────────────────────────────────
  whatsapp: {
    searchBox: [
      '[data-testid="chat-list-search"]',
      'div[contenteditable="true"][data-tab="3"]',
      'div[contenteditable="true"][title*="Pesquisar"]',
      'input[placeholder*="Pesquisar"]',
    ],
    chatItem: [
      '[data-testid="cell-frame-container"]',
      'div[role="listitem"]',
      'li[data-testid*="list-item"]',
    ],
    msgInput: [
      '[data-testid="conversation-compose-box-input"]',
      'div[contenteditable="true"][data-tab="10"]',
      'div[contenteditable="true"][title*="Mensagem"]',
      'footer [contenteditable="true"]',
    ],
    sendBtn: [
      '[data-testid="send"]',
      'button[aria-label*="Enviar"]',
      'span[data-testid="send"]',
    ],
    unreadBadge: [
      '[data-testid="icon-unread-count"]',
      'span[aria-label*="mensagens não lidas"]',
      'span[class*="unread"]',
    ],
    incomingMsg: [
      '.message-in',
      'div[class*="message-in"]',
      '[data-testid="msg-container"].incoming',
    ],
    doubleCheck: [
      'span[data-testid="msg-dblcheck"]',
      'span[aria-label*="Lido"]',
      'span[aria-label*="Entregue"]',
    ],
    contactName: [
      'header span[title]',
      '[data-testid="conversation-header"] span[title]',
      'div[class*="header"] span[title]',
    ],
    captcha: [
      'canvas[class*="qr"]',
      '[data-testid="qrcode"]',
      'div[class*="landing-wrapper"]',
    ],
    newChatFab: [
      '[data-testid="fab"]',
      '[aria-label*="Nova conversa"]',
      'button[title*="Nova conversa"]',
    ],
  },

  // ── Core finder ───────────────────────────────────────────
  find(platform, key, root = document) {
    const list = this[platform]?.[key] || [];
    for (const sel of list) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) { /* invalid selector, skip */ }
    }
    return null;
  },

  findAll(platform, key, root = document) {
    const list = this[platform]?.[key] || [];
    for (const sel of list) {
      try {
        const els = root.querySelectorAll(sel);
        if (els.length > 0) return Array.from(els);
      } catch (e) { /* skip */ }
    }
    return [];
  },

  // ── Wait for element with MutationObserver ────────────────
  waitFor(platform, key, timeoutMs = 8000, root = document) {
    return new Promise((resolve, reject) => {
      // Check immediately first
      const found = this.find(platform, key, root);
      if (found) return resolve(found);

      const observer = new MutationObserver(() => {
        const el = this.find(platform, key, root);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(root.body || root, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: ${platform}/${key} not found in ${timeoutMs}ms`));
      }, timeoutMs);
    });
  },

  // ── Wait for ANY of a list of raw selectors ───────────────
  waitForAny(selectors, timeoutMs = 8000, root = document) {
    return new Promise((resolve, reject) => {
      const check = () => {
        for (const sel of selectors) {
          try {
            const el = root.querySelector(sel);
            if (el) return el;
          } catch (e) {}
        }
        return null;
      };

      const found = check();
      if (found) return resolve(found);

      const observer = new MutationObserver(() => {
        const el = check();
        if (el) { observer.disconnect(); resolve(el); }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`waitForAny timeout`));
      }, timeoutMs);
    });
  },
};
