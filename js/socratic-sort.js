/**
 * socratic-sort.js — Pattern C (Sort/Categorize) and Pattern G
 * (Portfolio Builder). Native HTML5 drag-and-drop with full keyboard
 * fallback. Interlocks with Reveal.js keyboard navigation during grabs.
 */

// Reveal keyboard interlock helpers
function revealKeyboardOff() { if (window.Reveal) Reveal.configure({ keyboard: false }); }
function revealKeyboardOn()  { if (window.Reveal) Reveal.configure({ keyboard: true }); }

// ─── Pattern C: Sort / Categorize ────────────────────────────────────
function initSort(slide, data) {
  const { prompt, buckets, items } = data;

  const pillsHtml = items.map(it =>
    `<button class="sort-pill" draggable="true"
             data-item="${it.id}" data-answer="${it.bucket}"
             aria-label="${it.label}, drag to a bucket or press Space to grab">${it.label}</button>`
  ).join('');

  const bucketsHtml = buckets.map(b => `
    <div class="sort-bucket" data-bucket="${b.id}">
      <h3>${b.label}</h3>
      <div class="sort-dropzone" aria-label="Drop into ${b.label}"></div>
    </div>
  `).join('');

  slide.innerHTML = `
    <h2>${prompt}</h2>
    <div class="sort-pool" role="list">${pillsHtml}</div>
    <div class="sort-buckets">${bucketsHtml}</div>
    <button class="sort-check">Check placements</button>
    <div class="sort-feedback" aria-live="polite"></div>
  `;

  const pool  = slide.querySelector('.sort-pool');
  const zones = Array.from(slide.querySelectorAll('.sort-dropzone'));
  const checkBtn = slide.querySelector('.sort-check');
  const feedback = slide.querySelector('.sort-feedback');

  // ── HTML5 drag-and-drop (mouse/touch) ────────────────────────────
  slide.querySelectorAll('.sort-pill').forEach(pill => {
    pill.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', pill.dataset.item);
      e.dataTransfer.effectAllowed = 'move';
      pill.classList.add('grabbed');
    });
    pill.addEventListener('dragend', () => pill.classList.remove('grabbed'));
  });

  [pool, ...zones].forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const itemId = e.dataTransfer.getData('text/plain');
      const pill = slide.querySelector(`.sort-pill[data-item="${itemId}"]`);
      if (pill) zone.appendChild(pill);
    });
  });

  // ── Keyboard fallback ─────────────────────────────────────────────
  let grabbedPill = null;
  slide.querySelectorAll('.sort-pill').forEach(pill => {
    pill.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!grabbedPill) {
          grabbedPill = pill;
          pill.classList.add('grabbed');
          revealKeyboardOff();
        } else {
          grabbedPill.classList.remove('grabbed');
          grabbedPill = null;
          revealKeyboardOn();
        }
        e.preventDefault();
      } else if (grabbedPill === pill) {
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
          e.preventDefault();
          // Cycle through [pool, ...zones]
          const containers = [pool, ...zones];
          const currentParent = pill.parentNode;
          const idx = containers.indexOf(currentParent);
          const nextIdx = (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
            ? (idx + containers.length - 1) % containers.length
            : (idx + 1) % containers.length;
          containers[nextIdx].appendChild(pill);
          pill.focus();
        } else if (e.key === 'Escape') {
          grabbedPill.classList.remove('grabbed');
          grabbedPill = null;
          revealKeyboardOn();
          e.preventDefault();
        }
      }
    });
  });

  // ── Check placements ──────────────────────────────────────────────
  function doCheck(rehydratedPlacements) {
    const placements = {};
    let correctCount = 0;
    const total = items.length;

    slide.querySelectorAll('.sort-pill').forEach(pill => {
      if (rehydratedPlacements) {
        const bucket = rehydratedPlacements[pill.dataset.item];
        if (bucket) {
          const zone = slide.querySelector(`.sort-bucket[data-bucket="${bucket}"] .sort-dropzone`);
          if (zone) zone.appendChild(pill);
        }
      }

      const parent = pill.parentNode;
      const bucket = parent.closest('.sort-bucket') ? parent.closest('.sort-bucket').dataset.bucket : null;
      placements[pill.dataset.item] = bucket;

      pill.classList.remove('correct', 'incorrect');
      if (bucket === pill.dataset.answer) {
        pill.classList.add('correct');
        correctCount++;
      } else if (bucket) {
        pill.classList.add('incorrect');
      }
      pill.draggable = false;
      pill.setAttribute('tabindex', '-1');
    });

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checked';
    feedback.innerHTML = `<div class="band-${correctCount === total ? 'correct' : correctCount >= total*0.7 ? 'warm' : 'cold'}">
      Score: <b>${correctCount}/${total}</b> — ${
        correctCount === total
          ? 'Perfect split.'
          : correctCount >= total * 0.7
            ? 'Close — hover any red pill to see why it belongs elsewhere.'
            : 'Worth re-reading the definitions; the distinction is about WHERE the weights live, not WHICH lab is bigger.'
      }</div>`;
    slide.dataset.submitted = 'true';

    if (!rehydratedPlacements) {
      SocraticState.save(slide.dataset.id, {
        pattern: 'sort',
        placements,
        score: correctCount,
        total,
      });
    }
  }

  checkBtn.addEventListener('click', () => doCheck());

  // Rehydrate
  const prior = SocraticState.get(slide.dataset.id);
  if (prior && prior.placements) doCheck(prior.placements);
}

// ─── Pattern G: Portfolio Builder (capstone) ────────────────────────
function initPortfolio(slide, data) {
  const { prompt, slots, pool, scores, sectors, benchmark } = data;

  const poolHtml = pool.map(t =>
    `<button class="sort-pill portfolio-pill" draggable="true" data-ticker="${t}">${t}</button>`
  ).join('');
  const slotsHtml = Array.from({ length: slots }, (_, i) =>
    `<div class="portfolio-slot" data-slot="${i}">Slot ${i+1}</div>`
  ).join('');

  slide.innerHTML = `
    <h2>${prompt}</h2>
    <div class="portfolio-slots">${slotsHtml}</div>
    <div class="sort-pool" style="margin-top:8px">${poolHtml}</div>
    <button class="portfolio-submit" style="margin-top:12px">Score my portfolio</button>
    <div class="portfolio-reveal" hidden>
      <div class="portfolio-radar">
        <svg viewBox="-110 -110 220 220" width="220" height="220" class="portfolio-radar-svg"></svg>
        <div class="portfolio-scores"></div>
      </div>
      <div class="portfolio-summary"></div>
    </div>
  `;

  const poolEl = slide.querySelector('.sort-pool');
  const slotEls = Array.from(slide.querySelectorAll('.portfolio-slot'));
  const submit = slide.querySelector('.portfolio-submit');
  const reveal = slide.querySelector('.portfolio-reveal');

  function renderSlot(slotEl) {
    const pill = slotEl.querySelector('.portfolio-pill');
    if (pill) {
      slotEl.classList.add('filled');
      slotEl.firstChild && slotEl.firstChild.nodeType === 3 ? slotEl.removeChild(slotEl.firstChild) : null;
    } else {
      slotEl.classList.remove('filled');
      if (!slotEl.textContent.trim()) slotEl.textContent = 'Slot';
    }
  }

  // Drag-and-drop
  slide.querySelectorAll('.portfolio-pill').forEach(pill => {
    pill.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', pill.dataset.ticker);
      pill.classList.add('grabbed');
    });
    pill.addEventListener('dragend', () => pill.classList.remove('grabbed'));
  });
  [poolEl, ...slotEls].forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const t = e.dataTransfer.getData('text/plain');
      const pill = slide.querySelector(`.portfolio-pill[data-ticker="${t}"]`);
      if (!pill) return;

      if (zone.classList.contains('portfolio-slot')) {
        // Only allow one pill per slot; swap if occupied
        const existing = zone.querySelector('.portfolio-pill');
        if (existing && existing !== pill) poolEl.appendChild(existing);
        zone.textContent = '';
        zone.appendChild(pill);
        zone.classList.add('filled');
      } else {
        // Back to pool
        zone.appendChild(pill);
      }
      slotEls.forEach(s => {
        if (!s.querySelector('.portfolio-pill')) {
          s.classList.remove('filled');
          s.textContent = `Slot ${(+s.dataset.slot)+1}`;
        }
      });
    });
  });

  function scorePortfolio(tickers) {
    // 5 dimensions 0–1 (v2 adds catalysts)
    const purity    = tickers.reduce((s, t) => s + (scores[t]?.purity    || 0), 0) / tickers.length;
    const liq       = tickers.reduce((s, t) => s + (scores[t]?.liq       || 0), 0) / tickers.length;
    const regOK     = tickers.reduce((s, t) => s + (scores[t]?.regRisk   || 0), 0) / tickers.length;
    const catalysts = tickers.reduce((s, t) => s + (scores[t]?.catalysts || 0), 0) / tickers.length;
    const uniqueSectors = new Set(tickers.map(t => sectors[t] || 'other'));
    const diversification = Math.min(uniqueSectors.size / tickers.length, 1);
    return { purity, liq, regOK, diversification, catalysts };
  }

  function drawRadar(svg, scoreObj, benchObj) {
    const dims = ['Purity', 'Diversification', 'Liquidity', 'Reg Safety', 'Catalyst 90d'];
    const keys = ['purity', 'diversification', 'liq', 'regOK', 'catalysts'];
    const N = dims.length;
    const R = 90;
    const toXY = (val, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = val * R;
      return [Math.cos(angle) * r, Math.sin(angle) * r];
    };
    let svgHtml = '';
    // Gridlines
    [0.25, 0.5, 0.75, 1].forEach(g => {
      const pts = Array.from({ length: N }, (_, i) => toXY(g, i).join(',')).join(' ');
      svgHtml += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" />`;
    });
    // Axis labels
    dims.forEach((d, i) => {
      const [x, y] = toXY(1.12, i);
      svgHtml += `<text x="${x}" y="${y}" fill="var(--on-surface-variant)" font-size="8" text-anchor="middle" dominant-baseline="middle">${d}</text>`;
    });
    // Benchmark shape (dim)
    if (benchObj) {
      const benchPts = keys.map((k, i) => toXY(benchObj[k], i).join(',')).join(' ');
      svgHtml += `<polygon points="${benchPts}" fill="rgba(141,149,165,0.15)" stroke="rgba(141,149,165,0.6)" stroke-width="1" />`;
    }
    // User shape
    const userPts = keys.map((k, i) => toXY(scoreObj[k], i).join(',')).join(' ');
    svgHtml += `<polygon points="${userPts}" fill="rgba(242,216,1,0.25)" stroke="var(--primary)" stroke-width="1.5" />`;
    svg.innerHTML = svgHtml;
  }

  function doScore(rehydratedTickers) {
    const tickers = rehydratedTickers ||
      slotEls.map(s => s.querySelector('.portfolio-pill')).filter(Boolean).map(p => p.dataset.ticker);
    if (tickers.length < slots) {
      alert(`Fill all ${slots} slots first.`);
      return;
    }

    const userScore = scorePortfolio(tickers);
    const benchScore = scorePortfolio(benchmark);

    reveal.hidden = false;
    const svg = slide.querySelector('.portfolio-radar-svg');
    drawRadar(svg, userScore, benchScore);

    const scoresEl = slide.querySelector('.portfolio-scores');
    scoresEl.innerHTML = `
      <div class="score-row"><span>Thematic Purity</span><b>${(userScore.purity*100).toFixed(0)}%</b></div>
      <div class="score-row"><span>Diversification</span><b>${(userScore.diversification*100).toFixed(0)}%</b></div>
      <div class="score-row"><span>Liquidity</span><b>${(userScore.liq*100).toFixed(0)}%</b></div>
      <div class="score-row"><span>Reg. Safety</span><b>${(userScore.regOK*100).toFixed(0)}%</b></div>
      <div class="score-row"><span>Catalyst Density (90d)</span><b>${(userScore.catalysts*100).toFixed(0)}%</b></div>
    `;

    // Calibration summary from prior SocraticState answers
    const prior = SocraticState.answers;
    const estimates = Object.values(prior).filter(a => a.pattern === 'estimate');
    const estCorrect = estimates.filter(a => a.band === 'correct').length;
    const estWarm    = estimates.filter(a => a.band === 'warm').length;
    const estTotal   = estimates.length;
    const causals    = Object.values(prior).filter(a => a.pattern === 'causal');
    const sortAns    = Object.values(prior).filter(a => a.pattern === 'sort');

    const summary = slide.querySelector('.portfolio-summary');
    summary.innerHTML = `
      <h4>Your Calibration Summary</h4>
      <p><b>Your portfolio:</b> ${tickers.join(', ')}. ${
        tickers.includes('NVDA') && tickers.includes('TSM')
          ? 'You own the physical supply chain — the defensible earnings in the entire complex.'
          : 'You skipped the supply chain. Every AI lab — open or closed — buys from it.'
      }</p>
      <p><b>Benchmark (Goldman\'s suggested core):</b> ${benchmark.join(', ')}.</p>
      <p><b>Through the deck:</b> ${
        estTotal > 0
          ? `${estCorrect}/${estTotal} estimates correct${estWarm ? `, ${estWarm} warm` : ''}; `
          : ''
      }${
        causals.length > 0
          ? `${causals.filter(c => c.band === 'correct').length}/${causals.length} causal chains scored well; `
          : ''
      }${
        sortAns.length > 0
          ? `${sortAns[0].score}/${sortAns[0].total} on the open/closed sort.`
          : ''
      }</p>
      <p style="color: var(--on-surface-variant); font-size:0.9em">
        This is a thematic-exposure exercise, not investment advice. All data from the simulated GS AI Coverage Report (April 2026) and yfinance.
      </p>
    `;

    submit.disabled = true;
    submit.textContent = 'Scored';
    slide.dataset.submitted = 'true';

    if (!rehydratedTickers) {
      SocraticState.save(slide.dataset.id, {
        pattern: 'portfolio',
        tickers,
        userScore,
        benchScore,
      });
    }
  }

  submit.addEventListener('click', () => doScore());

  // Rehydrate
  const prior = SocraticState.get(slide.dataset.id);
  if (prior && prior.tickers) {
    prior.tickers.forEach((t, i) => {
      const pill = slide.querySelector(`.portfolio-pill[data-ticker="${t}"]`);
      if (pill && slotEls[i]) {
        slotEls[i].textContent = '';
        slotEls[i].appendChild(pill);
        slotEls[i].classList.add('filled');
      }
    });
    doScore(prior.tickers);
  }
}

// ─── Wire into dispatcher ───────────────────────────────────────────
function initSortPatterns() {
  const slidesRoot = document.querySelector('.reveal .slides');
  if (!slidesRoot) return;
  slidesRoot.querySelectorAll('.socratic-slide').forEach(slide => {
    if (slide.dataset.socraticSortInit === '1') return;
    const pattern = slide.dataset.pattern;
    const id = slide.dataset.id;
    const data = (window.SOCRATIC || {})[id];
    if (!data) return;
    if (pattern === 'sort')      { initSort(slide, data);      slide.dataset.socraticSortInit = '1'; slide.dataset.socraticInit = '1'; }
    if (pattern === 'portfolio') { initPortfolio(slide, data); slide.dataset.socraticSortInit = '1'; slide.dataset.socraticInit = '1'; }
  });
}

if (window.Reveal) {
  if (Reveal.isReady && Reveal.isReady()) initSortPatterns();
  else Reveal.on('ready', initSortPatterns);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Reveal) Reveal.on('ready', initSortPatterns);
    else initSortPatterns();
  });
}
