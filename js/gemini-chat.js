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

  const REPORT_BLOCK = `BEGIN REPORT
${window.REPORT_CONTEXT || '(report context not loaded)'}
END REPORT`;

  const SYSTEM_PROMPT_REPORT_ONLY = `You are an AI industry research assistant embedded in a Socratic teaching deck about Goldman Sachs' "The Open vs. Closed AI Divide" thematic coverage report (April 2026).

You have access to the FULL report contents, pasted below. Answer the learner's questions using ONLY the report and well-established public-market facts. If the answer is not in the report and you are not certain, say so.

Tone: analytical, concise, like a smart equity analyst explaining to a curious peer. Short paragraphs. Bold the key numbers. Use markdown for emphasis only (no headers).

When asked about a ticker, give: (1) the role in the AI stack, (2) the relevant number or stake from the report, (3) one forward-looking risk or catalyst.

Keep responses under 180 words unless the learner explicitly asks for more depth.

${REPORT_BLOCK}`;

  const SYSTEM_PROMPT_WITH_WEB = `You are an AI industry research assistant embedded in a Socratic teaching deck about Goldman Sachs' "The Open vs. Closed AI Divide" thematic coverage report (April 2026).

You have access to (1) the FULL report contents pasted below, and (2) Google Search as a tool for live web lookups. Prefer the report for anything it covers. Use Search for anything the report does not cover — post-April-2026 events, live prices, earnings, product launches, or explicit "latest / today / now / this week" questions. When you use Search, cite the web sources; do not invent URLs.

Tone: analytical, concise, like a smart equity analyst explaining to a curious peer. Short paragraphs. Bold the key numbers. Use markdown for emphasis only (no headers).

When asked about a ticker, give: (1) the role in the AI stack, (2) the relevant number or stake from the report (or current web data if the question is time-sensitive), (3) one forward-looking risk or catalyst.

Keep responses under 180 words unless the learner explicitly asks for more depth.

${REPORT_BLOCK}`;

  const SUGGESTIONS = [
    'Why do open-weight labs bother?',
    'What does MSFT get from OpenAI?',
    "What's the CoWoS bottleneck?",
    'Why is DeepSeek V4 a threat?',
    'Explain the TPU deal in one paragraph',
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

    async function sendMessage(userText) {
      if (!window.GEMINI_API_KEY) {
        addMsg('error',
          'No Gemini API key found. Paste your key into .env.local and run `python load_env.py`, then reload this page.'
        );
        return;
      }

      addMsg('user', userText);
      messages.push({ role: 'user', text: userText });

      const typingEl = addMsg('assistant', '', 'typing');
      typingEl.innerHTML = '<span class="dots">Thinking</span>';
      sendEl.disabled = true;

      try {
        const reply = await callGemini(messages);
        typingEl.classList.remove('typing');
        typingEl.innerHTML = simpleMarkdown(reply);
        messages.push({ role: 'model', text: reply });
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

  async function callGemini(history) {
    const endpoint = `${API_ROOT}/${MODEL}:generateContent?key=${encodeURIComponent(window.GEMINI_API_KEY)}`;
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      let detail = '';
      try { detail = (await resp.json()).error?.message || ''; } catch (e) {}
      throw new Error(`Gemini API ${resp.status}: ${detail || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    if (!text) throw new Error('Empty response from Gemini.');
    return text.trim();
  }

  // Boot after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
