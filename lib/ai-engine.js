// ==========================================================
// 🤖 GROQ AI ENGINE v2.0 — MetaFlow Marketing Automation
// Ultra-fast contextual generation powered by Groq LPU & Llama 3
// ==========================================================
;(function () {
  'use strict';

  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
  // Llama 3.1 8B Instant é o modelo universalmente disponível em todas as contas gratuitas da Groq
  const DEFAULT_MODEL = 'llama-3.1-8b-instant';
  const FALLBACK_MODELS = [
    'llama-3.1-8b-instant',
    'llama3-8b-8192',
    'llama3-70b-8192',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];

  const AIEngine = {
    apiKey: '',
    model: DEFAULT_MODEL,
    enabled: false,
    availableModels: [],

    // ── Inicializa lendo configurações salvas ─────────────────
    async init() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const res = await new Promise(r => chrome.storage.local.get(['groq_settings'], r));
          const s = res?.groq_settings || {};
          this.apiKey = s.apiKey || '';
          this.model = s.model || DEFAULT_MODEL;
          this.enabled = s.enabled === true;
          this.availableModels = s.availableModels || [];
        }
      } catch (err) {
        console.warn('[MetaFlow:AI] Falha ao carregar configurações da IA:', err);
      }
      return this;
    },

    // ── Salva configurações ───────────────────────────────────
    async saveSettings(settings) {
      this.apiKey = settings.apiKey !== undefined ? settings.apiKey.trim() : this.apiKey;
      this.model = settings.model || this.model;
      this.enabled = settings.enabled !== undefined ? !!settings.enabled : this.enabled;
      if (settings.availableModels) this.availableModels = settings.availableModels;

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise(r => chrome.storage.local.set({
          groq_settings: {
            apiKey: this.apiKey,
            model: this.model,
            enabled: this.enabled,
            availableModels: this.availableModels,
          }
        }, r));
      }
    },

    // ── Verifica se a IA está pronta para uso ─────────────────
    isReady() {
      return Boolean(this.enabled && this.apiKey && this.apiKey.startsWith('gsk_'));
    },

    // ── Consulta os modelos disponíveis na conta Groq do usuário ──
    async fetchAvailableModels(key) {
      const apiKey = (key || this.apiKey || '').trim();
      if (!apiKey) return [];

      try {
        const resp = await fetch(GROQ_MODELS_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        if (Array.isArray(data?.data)) {
          const ids = data.data
            .filter(m => m.active !== false && !m.id.includes('whisper'))
            .map(m => m.id);
          this.availableModels = ids;
          return ids;
        }
      } catch (e) {
        console.warn('[MetaFlow:AI] Não foi possível consultar /models:', e.message);
      }
      return [];
    },

    // ── Testa a conexão com a API da Groq e valida o modelo ────
    async testConnection(testKey, chosenModel) {
      const key = (testKey || this.apiKey || '').trim();
      if (!key) {
        return { ok: false, error: 'Chave de API não informada.' };
      }
      if (!key.startsWith('gsk_')) {
        return { ok: false, error: 'Chave inválida. Chaves da Groq começam com "gsk_".' };
      }

      // Tenta listar os modelos oficiais da conta
      const accountModels = await this.fetchAvailableModels(key);

      let targetModel = chosenModel || this.model || DEFAULT_MODEL;

      // Se o modelo escolhido não existe na lista de modelos da conta, seleciona o melhor compatível
      let adjusted = false;
      if (accountModels.length > 0 && !accountModels.includes(targetModel)) {
        // Encontra o primeiro fallback disponível
        const bestMatch = FALLBACK_MODELS.find(m => accountModels.includes(m)) || accountModels[0];
        if (bestMatch) {
          targetModel = bestMatch;
          adjusted = true;
        }
      }

      const t0 = Date.now();
      const sendTestPing = async (modelToTest) => {
        const resp = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: modelToTest,
            messages: [
              { role: 'system', content: 'Você é um assistente rápido. Responda apenas "OK" em uma palavra.' },
              { role: 'user', content: 'ping' },
            ],
            max_tokens: 5,
            temperature: 0.1,
          }),
        });
        const data = await resp.json();
        return { ok: resp.ok, status: resp.status, data };
      };

      try {
        let result = await sendTestPing(targetModel);

        // Se deu erro de modelo inexistente ou sem acesso, tenta fallback automático
        if (!result.ok && result.data?.error?.message?.match(/does not exist|access/i)) {
          for (const fbModel of FALLBACK_MODELS) {
            if (fbModel !== targetModel) {
              const fbResult = await sendTestPing(fbModel);
              if (fbResult.ok) {
                targetModel = fbModel;
                adjusted = true;
                result = fbResult;
                break;
              }
            }
          }
        }

        const latency = Date.now() - t0;

        if (!result.ok) {
          const msg = result.data?.error?.message || `Erro HTTP ${result.status}`;
          return { ok: false, error: msg, availableModels: accountModels };
        }

        this.apiKey = key;
        this.model = targetModel;
        this.enabled = true;
        await this.saveSettings({ apiKey: key, model: targetModel, enabled: true, availableModels: accountModels });

        return {
          ok: true,
          latencyMs: latency,
          model: targetModel,
          adjusted: adjusted,
          availableModels: accountModels,
        };
      } catch (err) {
        return { ok: false, error: `Falha na requisição: ${err.message}`, availableModels: accountModels };
      }
    },

    // ── Chamada genérica de Chat Completion com fallback automático ─
    async _chat(messages, maxTokens = 60, temperature = 0.7) {
      if (!this.isReady()) return null;

      const executeRequest = async (modelName) => {
        const resp = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        return { ok: resp.ok, status: resp.status, data };
      };

      try {
        let currentModel = this.model || DEFAULT_MODEL;
        let res = await executeRequest(currentModel);

        // Se o modelo falhar por acesso ou não existir, faz fallback transparente
        if (!res.ok && res.data?.error?.message?.match(/does not exist|access/i)) {
          console.warn(`[MetaFlow:AI] Modelo ${currentModel} indisponível. Tentando fallback...`);
          for (const fb of FALLBACK_MODELS) {
            if (fb !== currentModel) {
              const fbRes = await executeRequest(fb);
              if (fbRes.ok) {
                this.model = fb;
                this.saveSettings({ model: fb });
                res = fbRes;
                break;
              }
            }
          }
        }

        if (!res.ok) {
          console.warn('[MetaFlow:AI] Erro da API Groq:', res.data?.error?.message);
          return null;
        }

        const content = res.data?.choices?.[0]?.message?.content || '';
        return content.trim().replace(/^["']|["']$/g, '');
      } catch (err) {
        console.warn('[MetaFlow:AI] Falha na chamada da IA:', err);
        return null;
      }
    },

    // ── Gerar Comentário Contextual para Instagram ou Facebook ─
    async generateComment(caption, platform = 'instagram') {
      await this.init();
      if (!this.isReady()) return null;

      const cleanCaption = (caption || '').substring(0, 500).trim();
      const systemPrompt = `Você é um usuário brasileiro autêntico no ${platform === 'instagram' ? 'Instagram' : 'Facebook'} comentando em uma publicação.
Diretrizes OBRIGATÓRIAS:
- Seja extremamente natural, simpático e informal.
- Escreva APENAS 1 frase curta (no máximo 2 frases breves).
- Use no máximo 1 ou 2 emojis condizentes.
- Faça um elogio ou observação que realmente tenha a ver com a legenda ou assunto do post.
- NUNCA use tom de vendedor, termos formais ("prezado", "excelente trabalho"), clichês repetitivos ("top demais", "show") ou pareça um bot.
- Retorne EXCLUSIVAMENTE o texto do comentário, sem aspas, sem explicações e sem introduções.`;

      const userPrompt = cleanCaption
        ? `Legenda da publicação:\n"${cleanCaption}"\n\nGere um comentário natural para este post:`
        : `Gere um comentário simpático e autêntico elogiando a publicação.`;

      return this._chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 45, 0.75);
    },

    // ── Gerar Mensagem Direta (DM / Messenger) ────────────────
    async generateDM(targetName, contextOrBio = '') {
      await this.init();
      if (!this.isReady()) return null;

      const systemPrompt = `Você é um profissional brasileiro amigável iniciando uma conversa privada.
Diretrizes:
- Escreva uma mensagem curta (1 a 2 frases).
- Seja simpático, casual e autêntico.
- Se o nome foi fornecido, cumprimente pelo primeiro nome.
- NUNCA faça pitch de venda direto no primeiro contato.
- Retorne APENAS o texto da mensagem.`;

      const userPrompt = `Nome do contato: ${targetName || 'amigo(a)'}\nContexto/Perfil: ${contextOrBio || 'Sem contexto'}\nGere a mensagem inicial:`;

      return this._chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 60, 0.7);
    },

    // ── Gerar Resposta Inteligente no WhatsApp ────────────────
    async generateWhatsAppReply(incomingMessage, businessContext = '') {
      await this.init();
      if (!this.isReady()) return null;

      const cleanMsg = (incomingMessage || '').substring(0, 400).trim();
      const systemPrompt = `Você é um atendente humano ágil e educado no WhatsApp.
Diretrizes:
- Responda à mensagem da pessoa com clareza, simpatia e brevidade (1 a 3 frases).
- Use português do Brasil natural.
- Se a pessoa estiver perguntando sobre produtos ou atendimento, seja solícito e indique que em instantes o especialista responderá com mais detalhes.
${businessContext ? `Contexto do negócio: ${businessContext}` : ''}
- Retorne APENAS a resposta.`;

      return this._chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Mensagem recebida do cliente:\n"${cleanMsg}"\n\nSua resposta humana:` },
      ], 80, 0.65);
    },
  };

  // Carregar ao iniciar
  AIEngine.init();

  window.AIEngine = AIEngine;
  if (typeof module !== 'undefined') module.exports = AIEngine;
})();
