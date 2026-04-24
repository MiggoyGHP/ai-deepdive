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
        q: "Which is the cleanest single-stock public-market proxy for OpenAI exposure?",
        options: ["GOOGL", "AMZN", "MSFT", "META"],
        correct: 2,
      },
      {
        q: "Open-weight labs convert their capability into revenue through…",
        options: [
          "High per-token API fees",
          "Licensing the weights to hyperscalers",
          "Adjacent businesses — ads (Meta), cloud (Alibaba), inference service (Mistral)",
          "Selling fine-tuned variants to regulated industries",
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
        q: "SK Hynix is allocated to NVIDIA for roughly what % of its 2026 HBM output?",
        options: ["~15%", "~35%", "~62%", "~90%"],
        correct: 2,
      },
      {
        q: "Which name is the most attractive PURE-PLAY HBM equity per the coverage?",
        options: ["NVDA", "AVGO", "MU", "ASML"],
        correct: 2,
      },
      {
        q: "'Picks-and-shovels' investing in AI means…",
        options: [
          "Buying speculative small-cap AI startups",
          "Owning the physical supply chain (NVDA, TSM, ASML, HBM, AVGO) regardless of which model camp wins",
          "Hedging AI exposure with energy shorts",
          "Buying only CPU makers",
        ],
        correct: 1,
      },
    ],
  },

  quiz3: {
    title: "Checkpoint: exposure & catalysts",
    questions: [
      {
        q: "The most liquid, $500-minimum, non-accredited-eligible vehicle for pre-IPO AI is…",
        options: [
          "ARK Venture Fund (ARKVX)",
          "Destiny Tech100 (DXYZ)",
          "AngelList USVC",
          "Hiive direct marketplace",
        ],
        correct: 2,
      },
      {
        q: "Destiny Tech100 (DXYZ) has WHICH unique characteristic investors must understand?",
        options: [
          "Zero management fees",
          "Persistent NAV premium — share price routinely trades above underlying assets",
          "Guaranteed redemption at NAV each quarter",
          "Limited to tech-sector ETFs only",
        ],
        correct: 1,
      },
      {
        q: "Anthropic's April 2026 TPU deal with Google implies…",
        options: [
          "Anthropic is exiting its AWS partnership entirely",
          "Anthropic is multi-cloud — silicon diversification strategy, Google Cloud wins 3rd major lab",
          "NVIDIA loses all Anthropic business immediately in 2026",
          "Claude prices drop immediately for end users",
        ],
        correct: 1,
      },
      {
        q: "Project Glasswing refers to…",
        options: [
          "A $500B OpenAI/Oracle/SoftBank data-center buildout",
          "Anthropic's restricted deployment of Claude Mythos 5 (~50 organizations) citing misuse risk",
          "Google's TPU export-control compliance program",
          "Meta's internal code name for Muse Spark",
        ],
        correct: 1,
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
