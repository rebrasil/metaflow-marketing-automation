// ==========================================================
// 💬 WHATSAPP WEB AUTOMATION MODULE v2.0
// MetaFlow Marketing Automation
// Funções: Bulk Message (CSV + {nome}), Group Message,
//          Auto-Reply (com cap), Agendamento, Faixa Horária,
//          Delay Configurável, Verificação de Entrega,
//          Estatísticas de Envio
// ==========================================================
;(function () {
  'use strict';

  if (window.__metaflow_whatsapp_injected__) return;
  window.__metaflow_whatsapp_injected__ = true;

  const PLATFORM = 'whatsapp';
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
    console.log(`[MetaFlow:WA] ${msg}`);
    await STO().addLog(PLATFORM, msg, type);
  }

  function updateStatus(action, status) {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', platform: PLATFORM, action, status }).catch(() => {});
  }

  function updateWAStats(patch) {
    STO().updateWASendStats(patch).then(stats => {
      chrome.runtime.sendMessage({ type: 'WA_STATS', stats }).catch(() => {});
    });
  }

  async function loadSettings() {
    settings = await STO().getSettings(PLATFORM);
  }

  function parseContacts(raw) {
    return (raw || '').split('\n').map(s => s.trim()).filter(Boolean);
  }

  // ── WhatsApp pronto? ──────────────────────────────────────
  async function waitForReady() {
    const be = BE();
    let attempts = 0;
    while (attempts < 25) {
      const searchBox = SEL().find(PLATFORM, 'searchBox');
      if (searchBox) return true;
      await log('Aguardando WhatsApp Web carregar...', 'warn');
      await be.esperar(2500);
      attempts++;
    }
    await log('WhatsApp Web não carregou. Verifique o QR code.', 'error');
    return false;
  }

  // ── Verificar captcha (QR code = deslogado) ───────────────
  function startCaptchaGuard() {
    CAP().start(PLATFORM, async () => {
      await log('⚠️ WhatsApp deslogado ou bloqueado! Parando.', 'error');
      stopAll();
    });
  }

  // ── Verificar faixa de horário ────────────────────────────
  async function checkTimeWindow() {
    if (!settings.timeRangeStart || !settings.timeRangeEnd) return true;
    return SCH().waitForWindow(settings.timeRangeStart, settings.timeRangeEnd,
      (msg, type) => log(msg, type));
  }

  // ── Intervalo de delay entre mensagens (configurável) ─────
  function getDelay() {
    const min = (settings.delayMin || 8) * 1000;
    const max = (settings.delayMax || 20) * 1000;
    return min + Math.random() * (max - min);
  }

  // ── Abrir chat por número de telefone ─────────────────────
  async function openChatByPhone(phone) {
    const be = BE();
    const cleanPhone = phone.replace(/\D/g, '');
    const current = window.location.href;
    window.location.href = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=`;
    await be.esperar(be.delayNormal(5000, 0.4));

    // Fechar modal de confirmação se aparecer
    const confirmBtn = document.querySelector('[data-testid="modal-confirm-button"]');
    if (confirmBtn) await be.clicar(confirmBtn);
    await be.esperar(be.delayNormal(2000, 0.4));
    return !!SEL().find(PLATFORM, 'msgInput');
  }

  // ── Abrir chat por nome (busca) ───────────────────────────
  async function openChatByName(name) {
    const be = BE();
    const searchBox = SEL().find(PLATFORM, 'searchBox');
    if (!searchBox) return false;

    await be.clicar(searchBox);
    // Limpar campo
    searchBox.textContent = '';
    searchBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await be.esperar(be.delayNormal(400, 0.3));

    await be.digitarContentEditable(searchBox, name, settings.speed || 'normal');
    await be.esperar(be.delayNormal(1800, 0.4));

    const firstResult = SEL().find(PLATFORM, 'chatItem');
    if (!firstResult) {
      await log(`Chat não encontrado: ${name}`, 'warn');
      return false;
    }

    await be.clicar(firstResult);
    await be.esperar(be.delayNormal(1500, 0.3));
    return true;
  }

  // ── Enviar mensagem no chat aberto ────────────────────────
  async function sendMessage(template, vars = {}) {
    const be = BE();
    const msgInput = SEL().find(PLATFORM, 'msgInput');
    if (!msgInput) return false;

    let mensagem = be.personalizar(template, vars);
    const link = (vars.link || settings.messageLink || '').trim();
    if (link && !mensagem.includes(link)) {
      mensagem += `\n\n${link}`;
    }

    await be.clicar(msgInput);
    await be.esperar(be.delayNormal(500, 0.3));
    await be.digitarContentEditable(msgInput, mensagem, settings.speed || 'normal');

    if (link) {
      // Aguarda 2.5s para o WhatsApp gerar o preview do link com imagem
      await be.esperar(2500);
    } else {
      await be.esperar(be.delayNormal(600, 0.3));
    }

    const sendBtn = SEL().find(PLATFORM, 'sendBtn');
    if (sendBtn) {
      await be.clicar(sendBtn);
    } else {
      msgInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));
    }

    await be.esperar(be.delayNormal(800, 0.4));
    return true;
  }

  // ── Aguardar confirmação de entrega (✓✓) ─────────────────
  async function waitForDelivery(timeoutMs = 15000) {
    if (!settings.checkDelivery) return true;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const dblCheck = SEL().find(PLATFORM, 'doubleCheck');
      if (dblCheck) return true;
      await BE().esperar(1000);
    }
    return false; // timeout sem confirmação
  }

  // ── Obter nome do contato atual ───────────────────────────
  function getCurrentContactName() {
    return SEL().find(PLATFORM, 'contactName')?.getAttribute('title') || '';
  }

  // ════════════════════════════════════════════════════════
  // 📤 BULK MESSAGE (CSV + personalização)
  // ════════════════════════════════════════════════════════
  async function bulkMessage() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.bulk = true;
    updateStatus('bulk', 'active');
    await log('▶ Envio em Massa iniciado', 'info');
    sessionIds.bulk = await STO().startSession(PLATFORM, 'bulk');

    if (!(await checkTimeWindow())) { running.bulk = false; updateStatus('bulk','stopped'); return; }
    if (!(await waitForReady())) { running.bulk = false; updateStatus('bulk','stopped'); return; }

    await STO().resetWASendStats();
    startCaptchaGuard();

    // Verificar se tem dados CSV (prioridade) ou texto simples
    let contacts = [];
    const csvData = settings.csvData || [];

    if (csvData.length > 0) {
      // CSV: [{ numero, nome, empresa }]
      contacts = csvData;
      await log(`📂 CSV carregado: ${contacts.length} contatos`, 'info');
    } else {
      const raw = parseContacts(settings.contacts);
      contacts = raw.map(c => ({ numero: c, nome: c, empresa: '' }));
    }

    if (!contacts.length) {
      await log('Nenhum contato configurado. Adicione contatos ou importe um CSV.', 'error');
      running.bulk = false; updateStatus('bulk','stopped'); return;
    }

    const limit = Math.min(settings.limitMessages || 30, contacts.length);
    const template = settings.messageTemplate || 'Olá {nome}! Tudo bem? 😊';

    let sent = 0, failed = 0;
    updateWAStats({ pending: contacts.length, lastRun: Date.now() });

    for (let i = 0; i < contacts.length; i++) {
      if (!running.bulk || sent >= limit) break;
      await BE().esperarSeNecessario(PLATFORM, 'bulk', limit);

      if (!(await checkTimeWindow())) {
        await log('Fora da janela de horário — aguardando...', 'warn');
        await be.esperar(60000);
        continue;
      }

      const contact = contacts[i];
      const numero  = contact.numero || contact.phone || contact;
      const nome    = contact.nome || contact.name || numero;
      const empresa = contact.empresa || contact.company || '';

      await log(`📱 Abrindo: ${nome} (${numero})`, 'info');
      updateStatus('bulk', 'processing');

      let opened = false;
      if (/^\+?\d[\d\s\-().]+$/.test(String(numero))) {
        opened = await openChatByPhone(String(numero));
      } else {
        opened = await openChatByName(String(nome));
      }

      if (!opened) {
        failed++;
        await log(`❌ Não abriu chat: ${nome}`, 'error');
        updateWAStats({ failed });
        await STO().incrementCounter(PLATFORM, 'failed');
        continue;
      }

      await be.esperar(be.delayNormal(2000, 0.5));

      const vars = { nome, sobrenome: nome.split(' ')[1] || '', empresa, numero };
      const ok = await sendMessage(template, vars);

      if (ok) {
        // Verificar entrega
        const delivered = await waitForDelivery();
        sent++;
        await STO().incrementCounter(PLATFORM, 'bulk');
        if (delivered) {
          await STO().incrementCounter(PLATFORM, 'delivered');
          updateWAStats({ sent, delivered: sent });
          await log(`✅ Enviada + entregue #${sent}/${limit} → ${nome}`, 'success');
        } else {
          updateWAStats({ sent });
          await log(`✅ Enviada #${sent}/${limit} → ${nome} (entrega não confirmada)`, 'success');
        }
        updateStatus('bulk', 'active');
      } else {
        failed++;
        updateWAStats({ failed });
        await log(`❌ Erro ao enviar para: ${nome}`, 'error');
      }

      // Delay configurável entre mensagens
      const delay = getDelay();
      await log(`⏳ Aguardando ${Math.round(delay/1000)}s antes do próximo...`, 'info');
      await be.esperar(delay);
    }

    running.bulk = false; updateStatus('bulk','stopped');
    await STO().endSession(sessionIds.bulk, sent);
    CAP().stop();
    updateWAStats({ pending: 0 });
    await log(`⏹ Bulk encerrado — ✅ ${sent} enviadas | ❌ ${failed} falhas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 👥 GROUP MESSAGE
  // ════════════════════════════════════════════════════════
  async function groupMessage() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.group = true;
    updateStatus('group', 'active');
    await log('▶ Mensagem para Grupos iniciada', 'info');
    sessionIds.group = await STO().startSession(PLATFORM, 'group');

    if (!(await checkTimeWindow())) { running.group = false; updateStatus('group','stopped'); return; }
    if (!(await waitForReady())) { running.group = false; updateStatus('group','stopped'); return; }

    const groups = parseContacts(settings.groups);
    if (!groups.length) {
      await log('Nenhum grupo configurado.', 'error');
      running.group = false; updateStatus('group','stopped'); return;
    }

    const template = settings.groupTemplate || settings.messageTemplate || 'Olá grupo! 😊';
    startCaptchaGuard();
    let sent = 0;

    for (const groupName of groups) {
      if (!running.group) break;
      await be.esperarSeNecessario(PLATFORM, 'group', groups.length);

      if (!(await checkTimeWindow())) { await be.esperar(60000); continue; }

      await log(`📢 Abrindo grupo: ${groupName}`, 'info');
      const opened = await openChatByName(groupName);
      if (!opened) { await log(`Grupo não encontrado: ${groupName}`, 'warn'); continue; }

      await be.esperar(be.delayNormal(2000, 0.5));
      const ok = await sendMessage(template, { nome: groupName });

      if (ok) {
        sent++;
        await STO().incrementCounter(PLATFORM, 'group');
        await log(`✅ Mensagem no grupo #${sent} → ${groupName}`, 'success');
      }

      await be.esperar(getDelay());
    }

    running.group = false; updateStatus('group','stopped');
    await STO().endSession(sessionIds.group, sent);
    CAP().stop();
    await log(`⏹ Group Message encerrado — ${sent} grupos`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 🔄 AUTO-REPLY (com cap de 500 chats por sessão)
  // ════════════════════════════════════════════════════════
  async function startAutoReply() {
    await loadSettings();
    const be = BE();
    be.protegerFingerprint();
    running.autoReply = true;
    updateStatus('autoReply', 'active');
    await log('▶ Auto-Reply ativado — monitorando...', 'info');
    sessionIds.autoReply = await STO().startSession(PLATFORM, 'autoReply');

    if (!(await waitForReady())) { running.autoReply = false; updateStatus('autoReply','stopped'); return; }

    startCaptchaGuard();
    const replyTemplate = settings.replyTemplate || 'Obrigado pela mensagem! Retornarei em breve. 😊';
    const repliedChats  = new Set();
    const MAX_REPLIES   = 500; // cap de memória
    let replyCount      = 0;

    while (running.autoReply && replyCount < MAX_REPLIES) {
      await be._checkPause();
      if (!(await checkTimeWindow())) { await be.esperar(60000); continue; }

      const badges = SEL().findAll(PLATFORM, 'unreadBadge');
      for (const badge of badges) {
        if (!running.autoReply || replyCount >= MAX_REPLIES) break;

        const chatItem = badge.closest('[data-testid="cell-frame-container"]') ||
          badge.closest('div[role="listitem"]');
        if (!chatItem) continue;

        // ID estável do chat
        const chatTitle = chatItem.querySelector('span[title]')?.getAttribute('title') || '';
        if (!chatTitle || repliedChats.has(chatTitle)) continue;

        await be.clicar(chatItem);
        await be.esperar(be.delayNormal(2000, 0.4));

        const contactName = getCurrentContactName() || chatTitle;
        const vars = { nome: contactName.split(' ')[0], sobrenome: contactName.split(' ')[1] || '' };

        let textoResposta = replyTemplate;
        if (window.AIEngine?.isReady() && settings.useAI !== false) {
          try {
            const inMsgs = document.querySelectorAll('.message-in .selectable-text');
            const lastInMsg = inMsgs[inMsgs.length - 1];
            const incomingText = lastInMsg ? lastInMsg.innerText : '';
            if (incomingText) {
              await log(`🤖 Gerando resposta com Groq IA para: "${incomingText.substring(0, 35)}..."`, 'info');
              const aiReply = await window.AIEngine.generateWhatsAppReply(incomingText, settings.replyContext || '');
              if (aiReply) textoResposta = aiReply;
            }
          } catch (e) {
            console.warn('[MetaFlow:WA] Falha na IA:', e);
          }
        }

        const ok = await sendMessage(textoResposta, vars);

        if (ok) {
          repliedChats.add(chatTitle);
          replyCount++;
          await STO().incrementCounter(PLATFORM, 'autoreply');
          await log(`🔄 Auto-Reply #${replyCount} → ${contactName}`, 'success');
        }

        await be.esperar(be.delayNormal(3000, 0.4));
      }

      await be.esperar(be.delayNormal(8000, 0.3));
    }

    running.autoReply = false; updateStatus('autoReply','stopped');
    await STO().endSession(sessionIds.autoReply, replyCount);
    CAP().stop();
    await log(`⏹ Auto-Reply encerrado — ${replyCount} respostas`, 'info');
  }

  // ════════════════════════════════════════════════════════
  // 📅 SCHEDULED BULK (inicia no horário configurado)
  // ════════════════════════════════════════════════════════
  async function scheduledBulk() {
    await loadSettings();
    const scheduleTime = settings.scheduleTime;
    if (!scheduleTime) {
      await log('Horário de agendamento não configurado.', 'error');
      return;
    }

    const msUntil = SCH().msUntil(scheduleTime);
    const minsUntil = Math.round(msUntil / 60000);
    await log(`📅 Envio agendado para ${scheduleTime} — aguardando ${minsUntil} min...`, 'info');

    await BE().esperar(msUntil);

    if (!running.scheduled) return; // Cancelado durante espera
    await log(`🚀 Horário atingido! Iniciando envio agendado...`, 'success');
    await bulkMessage();
  }

  // ════════════════════════════════════════════════════════
  // STOP / PAUSE / RESUME
  // ════════════════════════════════════════════════════════
  function stopAction(action) { running[action] = false; updateStatus(action,'stopped'); log(`⏹ ${action} parado`,'warn'); }
  function stopAll() { Object.keys(running).forEach(k => { running[k] = false; }); BE().resume(); CAP().stop(); SCH().requestStop(); updateStatus('all','stopped'); log('⏹ Tudo parado','warn'); }
  function pauseAll() { BE().pause(); updateStatus('all','processing'); log('⏸ Pausado','warn'); }
  function resumeAll() { BE().resume(); updateStatus('all','active'); log('▶ Retomado','info'); }

  // ════════════════════════════════════════════════════════
  // CSV IMPORT HANDLER (vem do popup via message)
  // ════════════════════════════════════════════════════════
  async function importCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
      if (obj.numero || obj.phone || obj.telefone || obj.whatsapp) {
        contacts.push({
          numero:  obj.numero || obj.phone || obj.telefone || obj.whatsapp || '',
          nome:    obj.nome || obj.name || obj.contato || '',
          empresa: obj.empresa || obj.company || '',
        });
      }
    }

    await STO().saveSettings(PLATFORM, { ...settings, csvData: contacts });
    await log(`📂 CSV importado: ${contacts.length} contatos`, 'success');
    chrome.runtime.sendMessage({ type: 'CSV_IMPORTED', count: contacts.length, platform: PLATFORM }).catch(() => {});
  }

  // ════════════════════════════════════════════════════════
  // MESSAGE LISTENER
  // ════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.platform !== PLATFORM) return;
    switch (msg.command) {
      case 'START_BULK':      bulkMessage();       break;
      case 'START_GROUP':     groupMessage();      break;
      case 'START_AUTOREPLY': startAutoReply();    break;
      case 'START_SCHEDULED': running.scheduled = true; scheduledBulk(); break;
      case 'STOP_BULK':       stopAction('bulk');       break;
      case 'STOP_GROUP':      stopAction('group');      break;
      case 'STOP_AUTOREPLY':  stopAction('autoReply');  break;
      case 'STOP_SCHEDULED':  running.scheduled = false; stopAction('scheduled'); break;
      case 'STOP_ALL':        stopAll();   break;
      case 'PAUSE_ALL':       pauseAll();  break;
      case 'RESUME_ALL':      resumeAll(); break;
      case 'IMPORT_CSV':      importCSV(msg.csvText); break;
      case 'GET_STATUS': sendResponse({ running, paused }); return true;
    }
    sendResponse({ ok: true }); return true;
  });

  try {
    BE().injectFloatingLauncher();
  } catch (_) {}

  log('✅ WhatsApp module v2.0 carregado', 'info');
})();
