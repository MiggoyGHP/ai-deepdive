/**
 * socratic.js — Core dispatcher + Patterns A (Hypothesize), B (Estimate),
 * D (Trade-off), E (Causal). Patterns C (Sort) and G (Portfolio) live in
 * socratic-sort.js. Pattern F (Chart Probe) lives inside charts.js.
 */

// ─── Session state ───────────────────────────────────────────────────
const SocraticState = {
  answers: {},
  load() {
    try { this.answers = JSON.parse(sessionStorage.getItem('socratic.v1') || '{}'); }
    catch (e) { this.answers = {}; }
  },
  save(id, payload) {
    this.answers[id] = Object.assign({ ts: Date.now() }, payload);
    try { sessionStorage.setItem('socratic.v1', JSON.stringify(this.answers)); } catch (e) {}
  },
  get(id) { return this.answers[id]; },
  clear() { this.answers = {}; try { sessionStorage.removeItem('socratic.v1'); } catch (e) {} },
};
window.SocraticState = SocraticState;

// ─── Pattern A: Hypothesize-then-Reveal ──────────────────────────────
function initHypothesize(slide, data) {
  slide.innerHTML = `
    <h2>${data.prompt}</h2>
    <div class="hypothesize-card">
      <div class="confidence-slider">
        <label>${data.confidenceLabel || 'Your confidence'}</label>
        <input type="range" min="1" max="5" step="1" value="3" aria-label="Confidence">
        <span class="confidence-label">Neutral</span>
      </div>
      <button class="reveal-btn">Reveal answer</button>
      <div class="reveal-target" hidden>
        <div class="answer-headline">${data.answerValue}</div>
        <p>${data.explanation}</p>
      </div>
    </div>
  `;

  const slider = slide.querySelector('.confidence-slider input');
  const label  = slide.querySelector('.confidence-label');
  const btn    = slide.querySelector('.reveal-btn');
  const target = slide.querySelector('.reveal-target');
  const LABELS = ['Very low', 'Low', 'Neutral', 'High', 'Very high'];

  slider.addEventListener('input', () => { label.textContent = LABELS[slider.value - 1]; });

  btn.addEventListener('click', () => {
    target.hidden = false;
    btn.disabled = true;
    btn.textContent = 'Revealed';
    slide.dataset.submitted = 'true';
    SocraticState.save(slide.dataset.id, {
      pattern: 'hypothesize',
      confidence: +slider.value,
    });
  });

  // Rehydrate
  const prior = SocraticState.get(slide.dataset.id);
  if (prior) {
    slider.value = prior.confidence || 3;
    label.textContent = LABELS[slider.value - 1];
    target.hidden = false;
    btn.disabled = true;
    btn.textContent = 'Revealed';
    slide.dataset.submitted = 'true';
  }
}

// ─── Pattern B: Numerical Estimate-then-Check ────────────────────────
function initEstimate(slide, data) {
  const { prompt, min, max, step, start, truth, tolerance, unit, explanation } = data;
  slide.innerHTML = `
    <h2>${prompt}</h2>
    <div class="estimate-widget">
      <div class="estimate-value">${start}${unit || ''}</div>
      <input type="range" class="estimate-input" min="${min}" max="${max}" step="${step || 1}" value="${start}" aria-label="Your estimate">
      <button class="estimate-submit">Lock in estimate</button>
    </div>
    <div class="estimate-reveal" hidden>
      <div class="estimate-bar">
        <div class="marker-you">Your guess: <b class="guess-val">—</b></div>
        <div class="marker-truth">Truth: <b>${truth}${unit || ''}</b></div>
      </div>
      <p class="estimate-explain">${explanation}</p>
    </div>
  `;

  const input   = slide.querySelector('.estimate-input');
  const valueEl = slide.querySelector('.estimate-value');
  const submit  = slide.querySelector('.estimate-submit');
  const reveal  = slide.querySelector('.estimate-reveal');
  const guessValEl = slide.querySelector('.guess-val');

  input.addEventListener('input', () => { valueEl.textContent = input.value + (unit || ''); });

  function doSubmit(rehydratedGuess) {
    const guess = rehydratedGuess != null ? rehydratedGuess : +input.value;
    const delta = Math.abs(guess - truth);
    const band = delta <= tolerance ? 'correct' : (delta <= tolerance * 2 ? 'warm' : 'cold');

    guessValEl.textContent = guess + (unit || '');
    reveal.hidden = false;
    reveal.classList.remove('band-correct', 'band-warm', 'band-cold');
    reveal.classList.add('band-' + band);
    input.disabled = true;
    submit.disabled = true;
    submit.textContent = band === 'correct' ? 'Correct' : (band === 'warm' ? 'Warm' : 'Cold');
    slide.dataset.submitted = 'true';

    if (rehydratedGuess == null) {
      SocraticState.save(slide.dataset.id, {
        pattern: 'estimate', guess, truth, band,
      });
    }
  }

  submit.addEventListener('click', () => doSubmit());

  const prior = SocraticState.get(slide.dataset.id);
  if (prior && prior.guess != null) {
    input.value = prior.guess;
    valueEl.textContent = prior.guess + (unit || '');
    doSubmit(prior.guess);
  }
}

// ─── Pattern D: Multi-Factor Trade-off ───────────────────────────────
function initTradeoff(slide, data) {
  const { prompt, options, dimensions, matrix, best } = data;

  let optsHtml = options.map(o =>
    `<button class="tradeoff-option" data-opt="${o.id}"><b>${o.label}</b></button>`
  ).join('');

  let matrixRows = options.map(o => {
    const cells = matrix[o.id].cells.map((lvl, i) =>
      `<td class="dim-${lvl}">${lvl === 'high' ? 'High' : lvl === 'mid' ? 'Medium' : 'Low'}</td>`
    ).join('');
    return `<tr data-opt="${o.id}"><td><b>${matrix[o.id].headline || o.label}</b></td>${cells}</tr>`;
  }).join('');

  slide.innerHTML = `
    <h2>${prompt}</h2>
    <div class="tradeoff-options">${optsHtml}</div>
    <div class="tradeoff-reveal" hidden>
      <table class="tradeoff-matrix">
        <thead><tr><th></th>${dimensions.map(d => `<th>${d}</th>`).join('')}</tr></thead>
        <tbody>${matrixRows}</tbody>
      </table>
      <div class="tradeoff-verdict"></div>
    </div>
  `;

  const reveal  = slide.querySelector('.tradeoff-reveal');
  const verdict = slide.querySelector('.tradeoff-verdict');

  function pick(optId) {
    slide.querySelectorAll('.tradeoff-option').forEach(btn => {
      btn.classList.remove('selected', 'best-answer');
      if (btn.dataset.opt === optId) btn.classList.add('selected');
      if (btn.dataset.opt === best) btn.classList.add('best-answer');
    });
    slide.querySelectorAll('.tradeoff-matrix tr[data-opt]').forEach(row => {
      row.classList.toggle('user-pick', row.dataset.opt === optId);
    });
    const verdictText = matrix[optId].verdict || '';
    const prefix = optId === best
      ? '<b style="color: var(--positive)">Best choice for this scenario.</b> '
      : '';
    verdict.innerHTML = prefix + verdictText;
    reveal.hidden = false;
  }

  slide.querySelectorAll('.tradeoff-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const optId = btn.dataset.opt;
      pick(optId);
      slide.dataset.submitted = 'true';
      SocraticState.save(slide.dataset.id, {
        pattern: 'tradeoff', picked: optId, best,
      });
    });
  });

  const prior = SocraticState.get(slide.dataset.id);
  if (prior && prior.picked) pick(prior.picked);
}

// ─── Pattern E: Causal Reasoning Chain ──────────────────────────────
function initCausal(slide, data) {
  const { prompt, note, options, scoring } = data;

  let optsHtml = options.map(o => `
    <label class="causal-opt" data-id="${o.id}" data-truth="${o.truth}">
      <input type="checkbox">
      <span>
        <span class="causal-text">${o.text}</span>
        <span class="causal-rationale" hidden>${o.rationale}</span>
      </span>
    </label>
  `).join('');

  slide.innerHTML = `
    <h2>${prompt}</h2>
    ${note ? `<p class="prompt">${note}</p>` : ''}
    <div class="causal-chain">${optsHtml}</div>
    <button class="causal-submit">Check reasoning</button>
    <div class="causal-score" aria-live="polite" hidden></div>
  `;

  const submit = slide.querySelector('.causal-submit');
  const scoreEl = slide.querySelector('.causal-score');

  function grade(rehydratedPicks) {
    const checks = slide.querySelectorAll('.causal-opt input');
    const picks = rehydratedPicks || {};
    let directHits = 0, directTotal = 0, indirectHits = 0, falsePicked = 0;

    slide.querySelectorAll('.causal-opt').forEach((opt, i) => {
      const box = opt.querySelector('input');
      const id = opt.dataset.id;
      const truth = opt.dataset.truth;
      const checked = rehydratedPicks ? !!picks[id] : box.checked;
      if (rehydratedPicks) box.checked = checked;

      if (truth === 'direct') directTotal++;

      if (truth === 'direct' && checked)   { opt.classList.add('got-it');  directHits++; }
      if (truth === 'direct' && !checked)  { opt.classList.add('missed'); }
      if (truth === 'indirect' && checked) { opt.classList.add('partial'); indirectHits++; }
      if (truth === 'false' && checked)    { opt.classList.add('wrong');  falsePicked++; }

      box.disabled = true;
      opt.style.cursor = 'default';
      const rat = opt.querySelector('.causal-rationale');
      if (rat) rat.hidden = false;
    });

    const raw = directHits * scoring.directWeight
              + indirectHits * scoring.indirectWeight
              - falsePicked  * scoring.falsePenalty;
    const max = directTotal * scoring.directWeight;
    const score = Math.max(0, Math.min(raw / max, 1));
    const band = score >= 0.8 ? 'correct' : score >= 0.5 ? 'warm' : 'cold';

    scoreEl.hidden = false;
    scoreEl.classList.remove('band-correct', 'band-warm', 'band-cold');
    scoreEl.classList.add('band-' + band);
    scoreEl.innerHTML = `Score: <b>${(score*100).toFixed(0)}%</b> — ${directHits}/${directTotal} direct effects caught${
      falsePicked ? `, ${falsePicked} false positive${falsePicked>1?'s':''}` : ''
    }${indirectHits ? `, ${indirectHits} indirect caught` : ''}.`;

    submit.disabled = true;
    submit.textContent = 'Checked';
    slide.dataset.submitted = 'true';

    if (!rehydratedPicks) {
      const picksObj = {};
      slide.querySelectorAll('.causal-opt input').forEach((box, i) => {
        picksObj[slide.querySelectorAll('.causal-opt')[i].dataset.id] = box.checked;
      });
      SocraticState.save(slide.dataset.id, {
        pattern: 'causal',
        picks: picksObj,
        score,
        band,
        directHits, directTotal, falsePicked, indirectHits,
      });
    }
  }

  submit.addEventListener('click', () => grade());

  const prior = SocraticState.get(slide.dataset.id);
  if (prior && prior.picks) grade(prior.picks);
}

// ─── Dispatcher ──────────────────────────────────────────────────────
const SOCRATIC_HANDLERS = {
  hypothesize: initHypothesize,
  estimate:    initEstimate,
  tradeoff:    initTradeoff,
  causal:      initCausal,
  // sort, portfolio  → socratic-sort.js
  // chart-probe      → charts.js (initChartProbes)
};

function initSocratic() {
  SocraticState.load();
  const slidesRoot = document.querySelector('.reveal .slides');
  if (!slidesRoot) return;
  slidesRoot.querySelectorAll('.socratic-slide').forEach(slide => {
    if (slide.dataset.socraticInit === '1') return;
    const pattern = slide.dataset.pattern;
    const id = slide.dataset.id;
    const data = (window.SOCRATIC || {})[id];
    if (!data) {
      console.warn('[socratic] no data for id', id);
      return;
    }
    const handler = SOCRATIC_HANDLERS[pattern];
    if (!handler) {
      // sort / portfolio / chart-probe handled elsewhere
      return;
    }
    handler(slide, data);
    slide.dataset.socraticInit = '1';
  });
}

// Boot
if (window.Reveal) {
  if (Reveal.isReady && Reveal.isReady()) initSocratic();
  else Reveal.on('ready', initSocratic);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Reveal) Reveal.on('ready', initSocratic);
    else initSocratic();
  });
}
