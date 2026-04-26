/**
 * gemini-chat.js — Floating "Ask Gemini" chat widget powered by
 * gemini-2.5-flash. Uses the full GS AI Coverage Report as system context.
 *
 * Depends on:
 *   window.GEMINI_API_KEY   (set by js/gemini-key.js — generated from .env.local)
 *   window.REPORT_CONTEXT   (set by js/report-context.js — generated from docx)
 *
 * Gracefully degrades: if key is missing, the FAB shows a setup hint instead.
 */
(function () {
  const MODEL = 'gemini-2.5-flash';
  const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
  const LS_KEY = 'gemini.v1.api_key';

  // Key resolution, in priority order:
  //   1. window.GEMINI_API_KEY  — set by js/gemini-key.js (local dev, gitignored)
  //   2. localStorage[LS_KEY]   — visitor's own key (GitHub Pages deployment)
  // Both let us ship the deck publicly without exposing anyone's secret.
  function getApiKey() {
    if (typeof window !== 'undefined' && window.GEMINI_API_KEY) return window.GEMINI_API_KEY;
    try { return localStorage.getItem(LS_KEY) || ''; } catch (e) { return ''; }
  }
  function setApiKey(k) {
    try { localStorage.setItem(LS_KEY, k); } catch (e) {}
    window.GEMINI_API_KEY = k;
  }
  function clearApiKey() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    window.GEMINI_API_KEY = '';
  }

  const REPORT_BLOCK = `BEGIN REPORT
${window.REPORT_CONTEXT || '(report context not loaded)'}
END REPORT`;

  const SYSTEM_PROMPT_REPORT_ONLY = `You are an AI sector trading-desk analyst embedded in a deck for ACTIVE TRADERS (not allocators). The deck is built on Goldman Sachs' "The Open vs. Closed AI Divide — Expanded Edition v2" thematic coverage report (April 25, 2026). The full v2 report text is pasted at the bottom of this prompt.

When asked about a TICKER, structure your answer:
(1) v2 rating + one-line thesis (Overweight / Market Weight / Tactical Overweight / Speculative — match exactly what the report says)
(2) The next concrete catalyst with a date or window (NVDA Q1 FY27 in May, AAPL WWDC in June, DeepSeek V4 in Q2, etc.)
(3) The cleanest pair trade or relative-value framing (long X / short Y, or long X / hedge with Y).

When asked about an EVENT, structure your answer:
(1) Primary impact ticker + direction (up/down) and approximate magnitude
(2) Second-order read-throughs by sector layer: silicon → memory/packaging → ASIC → server/EMS → neocloud → hyperscaler → power
(3) What's already priced in vs the asymmetry

Tone: terse, analytical, like a buy-side trader briefing a PM. Short paragraphs. Bold all tickers and key numbers. Markdown for emphasis only — no headers.

AVOID allocator language: $X exposure tier, expense ratio, lockup, NAV premium, accredited-investor mechanics, fee drag, ARKVX/USVC/Hiive — these are deprioritized in v2 (allocator content is now an Appendix).

PREFER trader language: catalyst window, pair trade, read-through, asymmetry, crowding, mean reversion, sentiment re-rate, beta hedge, position size into print.

If something is genuinely not in the report, say so plainly. Keep responses under 180 words unless asked for depth.

${REPORT_BLOCK}`;

  const SYSTEM_PROMPT_WITH_WEB = `You are an AI sector trading-desk analyst embedded in a deck for ACTIVE TRADERS. The deck is built on Goldman Sachs' "The Open vs. Closed AI Divide — Expanded Edition v2" (April 25, 2026), pasted below. You also have Google Search for live lookups (prices, earnings, post-April-2026 events). Prefer the report for anything it covers; use Search for time-sensitive data ("latest", "today", "this week", live quote, recent print).

When asked about a TICKER:
(1) v2 rating + one-line thesis
(2) Next concrete catalyst with date (use Search for revisions to the calendar if asked)
(3) Cleanest pair trade or relative-value framing

When asked about an EVENT:
(1) Primary impact ticker + direction and magnitude
(2) Read-throughs by sector layer: silicon → memory → packaging → ASIC → EMS → neocloud → hyperscaler → power
(3) What's priced in vs asymmetry

When you Search, cite the sources; do not invent URLs.

Tone: terse, analytical, buy-side trader voice. Bold tickers and numbers. Markdown for emphasis only — no headers. AVOID allocator language (lockups, fees, NAV mechanics, exposure tiers). PREFER trader language (catalyst, pair, read-through, asymmetry, crowding, sentiment).

Under 180 words unless asked for depth.

${REPORT_BLOCK}`;

  const SUGGESTIONS = [
    'Best pair trade for the inference shift?',
    "Why does v2 call AVGO 'most undervalued'?",
    'AAPL Tactical Overweight — what changed?',
    'DeepSeek V4 read-through to NVDA?',
    "What's on the May–June catalyst calendar?",
  ];

  const messages = []; // {role: 'user'|'model', text: ''}
  let webSearchEnabled = false;

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => e.appendChild(c));
    return e;
  }

  function simpleMarkdown(text) {
    // Minimal markdown: **bold**, `code`, line breaks. Escape first.
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let h = esc(text);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Preserve paragraph breaks
    h = h.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    return h;
  }

  function createUI() {
    const fab = el('button', { class: 'gemini-fab', 'aria-label': 'Open AI chat' });
    fab.innerHTML = '<span class="spark">✦</span> Ask Gemini';

    const panel = el('div', { class: 'gemini-panel', role: 'dialog', 'aria-label': 'Ask Gemini chat' });
    panel.innerHTML = `
      <div class="gemini-header">
        <div class="gemini-header-title">
          <span class="spark">✦</span> Ask Gemini
          <span class="badge">2.5 Flash · Report context loaded</span>
        </div>
        <button class="gemini-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="gemini-messages" aria-live="polite"></div>
      <div class="gemini-suggestions"></div>
      <div class="gemini-input-row">
        <button class="gemini-web-toggle" type="button" aria-pressed="false" title="Toggle live web search (Google)">🌐 Web</button>
        <textarea class="gemini-input" rows="1" placeholder="Ask about the report — tickers, tradeoffs, catalysts…"></textarea>
        <button class="gemini-send" title="Send (Enter)">Send</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messagesEl   = panel.querySelector('.gemini-messages');
    const suggestionsEl= panel.querySelector('.gemini-suggestions');
    const inputEl      = panel.querySelector('.gemini-input');
    const sendEl       = panel.querySelector('.gemini-send');
    const closeEl      = panel.querySelector('.gemini-close');
    const webToggleEl  = panel.querySelector('.gemini-web-toggle');
    const badgeEl      = panel.querySelector('.gemini-header-title .badge');

    function updateWebMode() {
      webToggleEl.classList.toggle('on', webSearchEnabled);
      webToggleEl.setAttribute('aria-pressed', webSearchEnabled ? 'true' : 'false');
      badgeEl.textContent = webSearchEnabled
        ? '2.5 Flash · 🌐 Web on'
        : '2.5 Flash · Report context loaded';
      inputEl.placeholder = webSearchEnabled
        ? 'Ask anything — will search the web when needed…'
        : 'Ask about the report — tickers, tradeoffs, catalysts…';
    }
    webToggleEl.addEventListener('click', () => {
      webSearchEnabled = !webSearchEnabled;
      updateWebMode();
    });

    SUGGESTIONS.forEach(s => {
      const b = el('button', { class: 'gemini-suggestion', type: 'button', text: s });
      b.addEventListener('click', () => { inputEl.value = s; inputEl.focus(); });
      suggestionsEl.appendChild(b);
    });

    function togglePanel(open) {
      panel.classList.toggle('open', open);
      if (open) {
        fab.style.display = 'none';
        inputEl.focus();
        if (messages.length === 0) addSystemMessage(
          "Hi — I'm reading the full GS AI Coverage Report. Ask about any ticker, strategy, or catalyst."
        );
      } else {
        fab.style.display = '';
        inputEl.blur();
        // Always restore Reveal keyboard — even if focus was never inside the panel
        if (window.Reveal) Reveal.configure({ keyboard: true });
      }
    }
    fab.addEventListener('click', () => togglePanel(true));
    closeEl.addEventListener('click', () => togglePanel(false));

    // Enter to send; Shift+Enter for newline
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendEl.click();
      }
    });
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    // Reveal.js keyboard interlock: typing in the chat should not advance slides
    inputEl.addEventListener('focus', () => { if (window.Reveal) Reveal.configure({ keyboard: false }); });
    inputEl.addEventListener('blur',  () => { if (window.Reveal) Reveal.configure({ keyboard: true  }); });

    sendEl.addEventListener('click', () => {
      const q = inputEl.value.trim();
      if (!q) return;
      inputEl.value = '';
      inputEl.style.height = 'auto';
      sendMessage(q);
    });

    function addMsg(role, text, cls = '') {
      const m = el('div', { class: `gemini-msg ${role} ${cls}`.trim() });
      if (role === 'assistant') m.innerHTML = simpleMarkdown(text);
      else m.textContent = text;
      messagesEl.appendChild(m);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return m;
    }
    function addSystemMessage(text) { addMsg('system', text); }

    function renderGrounding(msgEl, groundingMetadata) {
      if (!groundingMetadata) return;
      const chunks = Array.isArray(groundingMetadata.groundingChunks)
        ? groundingMetadata.groundingChunks
        : [];
      const webChunks = chunks
        .map(c => c && c.web)
        .filter(w => w && w.uri);
      if (webChunks.length > 0) {
        const sources = document.createElement('div');
        sources.className = 'gemini-sources';
        const label = document.createElement('span');
        label.className = 'gemini-sources-label';
        label.textContent = 'Sources';
        sources.appendChild(label);
        webChunks.forEach((w, i) => {
          const a = document.createElement('a');
          a.className = 'gemini-source-pill';
          a.href = w.uri;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = `[${i + 1}] ${w.title || w.uri}`;
          sources.appendChild(a);
        });
        msgEl.appendChild(sources);
      }
      // Google requires the Search Suggestions chip to be displayed with grounded output.
      const sep = groundingMetadata.searchEntryPoint;
      if (sep && sep.renderedContent) {
        const chip = document.createElement('div');
        chip.className = 'gemini-search-entry-point';
        chip.innerHTML = sep.renderedContent;
        msgEl.appendChild(chip);
      }
    }

    function promptForKey() {
      const k = window.prompt(
        'Paste your Gemini API key (free at https://aistudio.google.com/apikey).\n\n' +
        'It is stored only in your browser localStorage — not sent anywhere except Google.'
      );
      if (k && k.trim()) { setApiKey(k.trim()); return true; }
      return false;
    }

    async function sendMessage(userText) {
      let key = getApiKey();
      if (!key) {
        if (!promptForKey()) {
          addMsg('error',
            'No Gemini API key set. Click "Ask Gemini" again to paste your key, ' +
            'or (for local dev) put it in .env.local and run `python load_env.py`.'
          );
          return;
        }
        key = getApiKey();
      }

      addMsg('user', userText);
      messages.push({ role: 'user', text: userText });

      const typingEl = addMsg('assistant', '', 'typing');
      typingEl.innerHTML = '<span class="dots">' + (webSearchEnabled ? 'Searching' : 'Thinking') + '</span>';
      sendEl.disabled = true;

      try {
        let reply;
        let groundingFellBack = false;
        try {
          reply = await callGemini(messages, { useWebSearch: webSearchEnabled });
        } catch (err) {
          // If grounding failed (quota/region/etc.), retry once without the tool so the user still gets an answer.
          if (webSearchEnabled && err.groundingUsed && (err.status === 400 || err.status === 429 || err.status === 403)) {
            groundingFellBack = true;
            reply = await callGemini(messages, { useWebSearch: false });
          } else {
            throw err;
          }
        }
        typingEl.classList.remove('typing');
        typingEl.innerHTML = simpleMarkdown(reply.text);
        renderGrounding(typingEl, reply.groundingMetadata);
        if (groundingFellBack) {
          addMsg('error', 'Web search was unavailable for that request — answered from the report only.');
        }
        messages.push({ role: 'model', text: reply.text });
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } catch (err) {
        typingEl.remove();
        addMsg('error', 'Error: ' + (err.message || err));
      } finally {
        sendEl.disabled = false;
        inputEl.focus();
      }
    }

    // Expose for external callers (future: inject slide context per question)
    window.GeminiChat = { open: () => togglePanel(true), close: () => togglePanel(false), send: sendMessage };
  }

  async function callGemini(history, { useWebSearch } = {}) {
    const endpoint = `${API_ROOT}/${MODEL}:generateContent?key=${encodeURIComponent(getApiKey())}`;
    const systemPrompt = useWebSearch ? SYSTEM_PROMPT_WITH_WEB : SYSTEM_PROMPT_REPORT_ONLY;
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: history.map(m => ({
        role: m.role, // 'user' or 'model'
        parts: [{ text: m.text }],
      })),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };
    if (useWebSearch) {
      // Native Gemini 2.x grounding: server-side Google Search. Snake_case is required.
      body.tools = [{ google_search: {} }];
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      let detail = '';
      try { detail = (await resp.json()).error?.message || ''; } catch (e) {}
      const err = new Error(`Gemini API ${resp.status}: ${detail || resp.statusText}`);
      err.status = resp.status;
      err.detail = detail;
      err.groundingUsed = !!useWebSearch;
      throw err;
    }
    const data = await resp.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
    if (!text) throw new Error('Empty response from Gemini.');
    return {
      text: text.trim(),
      groundingMetadata: candidate?.groundingMetadata || null,
    };
  }

  // Boot after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
