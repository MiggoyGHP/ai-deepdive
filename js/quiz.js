/**
 * quiz.js - Interactive quiz engine for Oil 101 presentation
 */

const QUIZZES = {
  quiz1: {
    title: "Checkpoint: the core thesis",
    questions: [
      {
        q: "Which correctly describes the relationship between closed-weight and open-weight AI labs?",
        options: [
          "Pure substitutes — one will inevitably win",
          "Complements — closed captures capability rent, open commoditizes the base",
          "Identical strategies aimed at the same customer",
          "Open-weight is only relevant outside the US",
        ],
        correct: 1,
      },
      {
        q: "Why does Meta open-source Llama despite spending $65B+ on AI?",
        options: [
          "Meta plans to pivot to licensing Llama as its main revenue driver",
          "To 'commoditize your complements' — undermine closed rivals without cannibalizing Meta's ad business",
          "Regulatory requirement under the EU AI Act",
          "Because Llama is unprofitable and being wound down",
        ],
        correct: 1,
      },
      {
        q: "If you had to express the open-vs-closed thesis as ONE long/short pair using only public US tickers, the cleanest expression is…",
        options: [
          "Long META / Short MSFT — open-camp infrastructure beneficiary vs OpenAI proxy facing capability convergence",
          "Long GOOGL / Short META — closed flagship + Anthropic equity vs ad-funded open-weight",
          "Long BABA / Short MSFT — Chinese open-weight cost compression hits OpenAI margins",
          "Long NVDA / Short META — supply chain wins regardless; ad business loses to AI agents",
        ],
        correct: 0,
      },
      {
        q: "v2's NEW Tactical Overweight on AAPL is novel because the thesis is…",
        options: [
          "Apple Intelligence will reach frontier capability in 12 months",
          "Apple acquires Anthropic in 2026",
          "M3 Ultra Mac Studio (512GB unified memory) + MLX framework = de facto local-AI reference platform; hardware unit growth + services uplift",
          "Apple licenses iOS to Chinese open-weight labs",
        ],
        correct: 2,
      },
    ],
  },

  quiz2: {
    title: "Checkpoint: supply chain & bottlenecks",
    questions: [
      {
        q: "Which layer of the AI supply chain is the single most binding constraint in 2026?",
        options: [
          "HBM memory allocation",
          "ASML High-NA EUV lithography tools",
          "TSMC CoWoS advanced packaging",
          "Power generation for data centers",
        ],
        correct: 2,
      },
      {
        q: "SK Hynix supplies roughly what share of NVIDIA's HBM?",
        options: ["~15%", "~35%", "~62%", "~90%"],
        correct: 3,
      },
      {
        q: "Which name is the most attractive PURE-PLAY HBM equity per the coverage?",
        options: ["NVDA", "AVGO", "MU", "ASML"],
        correct: 2,
      },
      {
        q: "If TSMC CoWoS expansion accelerates from 30% → 50% in 2026, the BIGGEST margin beneficiary is…",
        options: [
          "NVDA — already has priority CoWoS allocation, marginal benefit",
          "AVGO — custom-ASIC programs (TPU, MTIA) are CoWoS-starved more than NVDA; capacity unlock = revenue unlock",
          "TSM — already passing through; benefits modest",
          "SK Hynix — HBM is allocated separately from CoWoS",
        ],
        correct: 1,
      },
    ],
  },

  quiz3: {
    title: "Checkpoint: trader read-throughs",
    questions: [
      {
        q: "DeepSeek V4 ships Q2 2026 on Huawei Ascend at $0.14–$0.30/M tokens. The first-derivative trade for the next 5 sessions is…",
        options: [
          "Long NVDA — China demand strong",
          "Pair: short NVDA + long BABA on cost-deflation pressure to closed-API margins; NVDA loses China narrative even if not orders",
          "Long ORCL — OpenAI capacity wins",
          "Long SNDK — NAND demand from inference checkpointing",
        ],
        correct: 1,
      },
      {
        q: "AAPL WWDC June 2026 is widely expected to expand MLX. The cleanest hardware READ-THROUGH trade is…",
        options: [
          "Long AAPL only — direct beneficiary",
          "Long MU on unified-memory demand",
          "Long TSM — Apple is its largest customer; MLX expansion = wafer demand",
          "Pair long AAPL / short OpenAI proxies (MSFT)",
        ],
        correct: 2,
      },
      {
        q: "Long CRWV ahead of MSFT earnings — the dominant risk is…",
        options: [
          "MSFT capex GUIDE-DOWN signal — CRWV halves on concentration risk",
          "CRWV losing the ORCL/Stargate deal",
          "AVGO custom-ASIC win at hyperscaler",
          "SK Hynix HBM4 delay",
        ],
        correct: 0,
      },
      {
        q: "Per v2 Forward Catalyst Calendar, the DENSEST single week of Q2 2026 for AI coverage is…",
        options: [
          "Mid-May: NVDA Q1 FY27 + MSFT Build 2026 in same window",
          "Early June: AAPL WWDC week (standalone)",
          "Late April: post-earnings TSMC update",
          "Early Q3: Anthropic Series G",
        ],
        correct: 0,
      },
    ],
  },
};

// Track global score
let totalCorrect = 0;
let totalAnswered = 0;

function initQuizzes() {
  document.querySelectorAll('.quiz-slide').forEach(slide => {
    const quizId = slide.dataset.quiz;
    const quiz = QUIZZES[quizId];
    if (!quiz) return;
    renderQuiz(slide, quiz, quizId);
  });
}

function renderQuiz(container, quiz, quizId) {
  const wrapper = container.querySelector('.quiz-container') || container;
  let answeredCount = 0;

  let html = `
    <div class="quiz-header">
      <h2>${quiz.title}</h2>
      <div class="quiz-score" id="score-${quizId}">Answer all questions to continue</div>
    </div>
  `;

  quiz.questions.forEach((q, qi) => {
    html += `
      <div class="quiz-question" data-qi="${qi}">
        <div class="quiz-question-text">${qi + 1}. ${q.q}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => `
            <button class="quiz-option" data-qi="${qi}" data-oi="${oi}">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;
  });

  wrapper.innerHTML = html;

  // Attach click handlers
  wrapper.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', function() {
      const qi = parseInt(this.dataset.qi);
      const oi = parseInt(this.dataset.oi);
      const question = quiz.questions[qi];
      const qContainer = wrapper.querySelector(`.quiz-question[data-qi="${qi}"]`);

      // Already answered?
      if (qContainer.classList.contains('done')) return;
      qContainer.classList.add('done');

      const allOptions = qContainer.querySelectorAll('.quiz-option');
      allOptions.forEach(o => o.classList.add('answered'));

      if (oi === question.correct) {
        this.classList.add('correct');
        totalCorrect++;
      } else {
        this.classList.add('incorrect');
        allOptions[question.correct].classList.add('show-correct');
      }
      totalAnswered++;
      answeredCount++;

      const scoreEl = document.getElementById(`score-${quizId}`);
      if (answeredCount === quiz.questions.length) {
        const quizCorrect = wrapper.querySelectorAll('.quiz-option.correct').length;
        scoreEl.innerHTML = `Score: <strong style="color:var(--accent)">${quizCorrect}/${quiz.questions.length}</strong> &mdash; Overall: ${totalCorrect}/${totalAnswered}`;
      } else {
        scoreEl.textContent = `${answeredCount}/${quiz.questions.length} answered`;
      }
    });
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuizzes);
} else {
  initQuizzes();
}
