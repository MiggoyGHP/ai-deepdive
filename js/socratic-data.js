/**
 * socratic-data.js - Prompts, truths, and explanations for every Socratic
 * interaction in the deck. Keyed by the slide's data-id attribute.
 */
window.SOCRATIC = {
  // ─── Pattern A: Hypothesize-then-Reveal ──────────────────────────────
  "hy-vc-share": {
    pattern: "hypothesize",
    prompt: "Q1 2026 saw four deals — OpenAI, Anthropic, xAI, Waymo — absorb a staggering share of global venture funding. What fraction of Q1 2026 total global VC went into just those four?",
    confidenceLabel: "Confidence this number is healthy for the VC industry",
    answerValue: "~65%",
    explanation:
      "$188B of the quarter's $290B of global VC funding — about 65% — flowed to just four AI mega-deals. " +
      "AI's share of total VC jumped from ~55% to ~81% QoQ. That's capital concentration at a level without modern precedent.",
  },
  "hy-anthropic-enterprise": {
    pattern: "hypothesize",
    prompt: "Anthropic's revenue mix is famously different from OpenAI's. Guess — what share of Anthropic's revenue comes from enterprise (as opposed to consumer)?",
    confidenceLabel: "Confidence Anthropic can sustain this mix",
    answerValue: "~80%",
    explanation:
      "Per CEO Dario Amodei, ~80% of Anthropic's revenue is enterprise — driven primarily by Claude Code. " +
      "Compare to OpenAI, which still carries a heavy consumer base (ChatGPT Plus, Pro). Different mixes, different unit economics.",
  },

  // ─── Pattern B: Numerical Estimate-then-Check ────────────────────────
  "est-openai-val": {
    pattern: "estimate",
    prompt: "OpenAI closed its latest primary round in February 2026. What was the post-money valuation, in $B?",
    unit: "B",
    min: 100, max: 1500, step: 10, start: 500,
    truth: 852,
    tolerance: 75,
    explanation:
      "$852B post-money (Feb 2026, up from $110B initially announced). SoftBank co-led; includes a16z and D.E. Shaw. " +
      "Secondary markets have since pushed implied marks on Anthropic toward $1T, and VC bids for Anthropic at $800B+ are being declined.",
  },
  "est-hbm-share": {
    pattern: "estimate",
    prompt: "SK Hynix supplies the majority of HBM for NVIDIA. What share of SK Hynix's HBM output ends up going to NVDA?",
    unit: "%",
    min: 0, max: 100, step: 1, start: 30,
    truth: 62,
    tolerance: 8,
    explanation:
      "Roughly 62% — and SK Hynix's entire 2026 HBM capacity is already allocated. HBM revenue is tracking to ~30% of total DRAM revenue " +
      "in 2026 despite being only ~8% of bit output. That is why Micron (MU) is the most attractive pure-play HBM equity in the coverage list.",
  },
  "est-cowos": {
    pattern: "estimate",
    prompt: "TSMC's CoWoS advanced-packaging capacity is THE binding constraint on AI GPU production. Roughly how many wafers per month did CoWoS reach by end of 2025?",
    unit: "k wafers/mo",
    min: 10, max: 200, step: 5, start: 50,
    truth: 75,
    tolerance: 15,
    explanation:
      "~75,000 wafers/month at end of 2025, expanding ~30% into 2026 but still sold out through mid-2026. " +
      "Without CoWoS, a Blackwell GPU is 'just a collection of dies' — the interposer integration with HBM stacks is what makes it a product.",
  },

  // ─── Pattern D: Multi-Factor Trade-off ───────────────────────────────
  "to-meta-capex": {
    pattern: "tradeoff",
    prompt: "You're Meta's CFO at the April 2026 earnings call. Shareholders are asking why you're spending $65B+ in AI capex with ZERO direct licensing revenue from Llama. Pick the strongest defense:",
    options: [
      { id: "a", label: "A. We'll license Llama commercially starting next year", headline: "Licensing Pivot" },
      { id: "b", label: "B. Llama is a cost-of-goods investment in the ad business — commoditize your complements", headline: "Strategic (Correct)" },
      { id: "c", label: "C. AI capex will be cut aggressively if ad monetization doesn't match", headline: "Capitulation" },
    ],
    dimensions: ["Credibility", "Consistency w/ strategy", "Shareholder response", "Long-run upside"],
    matrix: {
      a: { cells: ["low", "low", "mid", "low"], verdict: "Not credible — Meta has publicly disavowed gating Llama; pivoting now would collapse the 700M MAU ecosystem they've built. Shareholders will see through it." },
      b: { cells: ["high", "high", "mid", "high"], verdict: "The textbook answer. Joel Spolsky's 'commoditize your complements' playbook: Meta undermines closed labs that charge for model access without cannibalizing its own ad revenue. The bet is capability becomes foundational to ads + Reality Labs — unproven, but strategically coherent." },
      c: { cells: ["mid", "low", "high", "low"], verdict: "Placates shareholders short-term but signals strategic retreat. Mark Zuckerberg has explicitly said the opposite — this would break CEO credibility." },
    },
    best: "b",
  },
  "to-50k-exposure": {
    pattern: "tradeoff",
    prompt: "You have $50k and want pre-IPO AI exposure with a 3–5 year horizon. Which tier fits best?",
    options: [
      { id: "a", label: "A. MSFT / GOOGL / AMZN public proxies", headline: "Strategic Proxies" },
      { id: "b", label: "B. ARKVX / DXYZ closed-end venture vehicles", headline: "Venture CEFs" },
      { id: "c", label: "C. Hiive / Forge direct pre-IPO secondaries", headline: "Direct Secondaries" },
    ],
    dimensions: ["Liquidity", "Purity of exposure", "Fee drag", "Minimum ticket"],
    matrix: {
      a: { cells: ["high", "low", "low", "low"], verdict: "Cleanest and most liquid, but each proxy is majority 'other business' — MSFT is mostly enterprise SaaS. You capture AI beta but not much AI alpha at $50k." },
      b: { cells: ["mid", "mid", "mid", "low"], verdict: "Typically the right default at $50k / 3–5yr. ARKVX gives real pre-IPO basket exposure (SpaceX, OpenAI, Anthropic); DXYZ is more liquid but carries a persistent NAV premium you must watch. Fees are real (2–3% expense ratios) but acceptable for access." },
      c: { cells: ["low", "high", "mid", "high"], verdict: "Best purity, but ticket sizes on Hiive/Forge rarely work under $100–250k once you factor spreads and minimums. Reserve for larger accounts with multi-year lockup tolerance." },
    },
    best: "b",
  },

  // ─── Pattern E: Causal Reasoning Chain ──────────────────────────────
  "ca-anthropic-tpu": {
    pattern: "causal",
    prompt:
      "In April 2026 Anthropic committed to multiple gigawatts of next-gen Google TPU capacity starting 2027 — on top of its separate 5GW AWS Trainium deal. Which of these actually follow as second-order effects?",
    note: "Select all that apply. Submit when you're confident.",
    options: [
      { id: "nvda-lose-customer", text: "NVDA loses a marquee training customer — a real revenue drag over time.", truth: "direct", rationale: "Anthropic was a significant future training buyer for NVDA; multi-GW TPU absorbs capacity that would otherwise hit NVDA's order book." },
      { id: "googl-cloud-up",     text: "GOOGL Cloud revenue inflects — a third major AI lab now runs on GCP.",      truth: "direct", rationale: "Positive read-across for Alphabet Cloud revenue recognition and a proof point for TPU-as-a-service externally." },
      { id: "avgo-tailwind",      text: "AVGO benefits — custom-ASIC business gets a clear validation.",               truth: "direct", rationale: "Broadcom co-designs TPU silicon for Google. Multi-GW commitment supports AVGO's $100B+ custom AI chip revenue target by 2027." },
      { id: "openai-pivot-immediate", text: "OpenAI immediately diversifies away from NVDA as well.",                 truth: "false",  rationale: "OpenAI's $1.4T infra commitments are mostly NVDA-tied through 2027. No evidence of an immediate NVDA exit — more likely multi-cloud over time." },
      { id: "asml-neutral",       text: "ASML and TSM are largely unaffected — TPUs still ride TSMC 3nm.",              truth: "direct", rationale: "Correct: the silicon supply chain is shared. TPU vs. NVIDIA is an allocation shift within TSMC + ASML, not a hit to them." },
      { id: "claude-cheaper",     text: "Claude immediately becomes cheaper per token for end users.",                  truth: "false",  rationale: "TPU capacity takes years to stand up and Anthropic prices for margin, not cost. No near-term price cut for Claude is implied by the deal." },
      { id: "multi-cloud-norm",   text: "Enterprise-grade labs must be multi-cloud / multi-silicon going forward.",     truth: "indirect", rationale: "Partially true. Anthropic's multi-cloud posture sets an industry expectation, but it's a slow-moving cultural shift, not a direct consequence." },
    ],
    scoring: {
      directWeight: 1,
      indirectWeight: 0.5,
      falsePenalty: 0.5,
    },
  },

  // ─── Pattern F: Chart Probe ──────────────────────────────────────────
  // Blind-pick: labels are hidden until the user clicks. The question tests
  // AI-coverage narrative reasoning, not chart-axis reading — the correct
  // catalyst (DeepSeek R1, Jan 27 2025) is the one that cracked the
  // hyperscaler capex thesis, not the most "obvious" frontier-model headline.
  "cp-nvda-catalysts": {
    pattern: "chart-probe",
    prompt: "Five catalysts are marked on NVDA's chart. Four reinforced or only mildly challenged the AI-capex thesis; one fundamentally cracked the narrative. Click the one that cracked it.",
    ticker: "NVDA",
    markers: [
      { n: 1, time: "2024-03-18", label: "GTC 2024 — Blackwell announced",
        reaction: "-2.1% sell-the-news; forward demand picture unchanged.", correct: false },
      { n: 2, time: "2024-08-28", label: "Q2 FY25 earnings — Blackwell shipment delay disclosed",
        reaction: "-2.0% on a beat-and-raise; delay spooked short term, order book intact.", correct: false },
      { n: 3, time: "2025-01-27", label: "DeepSeek R1 shock — open-weight Chinese model at ~1/50 serving cost",
        reaction: "Fri→Mon gap-down: $142.57 → $118.38 (-17%). Worst single day since March 2020.", correct: true },
      { n: 4, time: "2026-03-05", label: "GPT-5.4 release — 83% on GDPval (single-model frontier)",
        reaction: "+1.2% — confirms frontier compute demand, but largely priced in.", correct: false },
      { n: 5, time: "2026-04-22", label: "Google announces 2 new TPUs (v7 + successor)",
        reaction: "+0.8% — ASIC competition noted; NVDA CUDA/NVLink moat still decisive.", correct: false },
    ],
    explanation:
      "DeepSeek R1 was the moment the AI-capex thesis was genuinely, not rhetorically, challenged. " +
      "An open-weight Chinese lab claiming near-frontier reasoning at roughly 1/50 the serving cost forced " +
      "investors to model — for the first time — a world where hyperscaler GPU capex could plateau or turn negative. " +
      "NVDA shed ~$600B of market cap in one session. The price recovered within months; the narrative scar did not. " +
      "Every cost-deflation headline since (Google TPU v7, Anthropic's multi-GW Trainium deal, Cerebras inference runs) " +
      "is now priced against this re-rated baseline — which is precisely why the 'obvious' bullish catalysts barely moved the stock.",
  },

  // ─── Pattern C: Sort / Categorize ────────────────────────────────────
  "sort-open-closed": {
    pattern: "sort",
    prompt: "Sort these frontier AI players into Open-weight vs Closed-weight.",
    buckets: [
      { id: "closed", label: "Closed-weight (Capability Rent)" },
      { id: "open",   label: "Open-weight (Commoditize Complements)" },
    ],
    items: [
      { id: "openai",    label: "OpenAI (GPT-5.4)",       bucket: "closed" },
      { id: "anthropic", label: "Anthropic (Claude 4.6)", bucket: "closed" },
      { id: "deepmind",  label: "Google DeepMind (Gemini 3.1 Pro)", bucket: "closed" },
      { id: "xai",       label: "xAI (Grok 4.20)",        bucket: "closed" },
      { id: "llama",     label: "Meta (Llama 4)",         bucket: "open" },
      { id: "mistral",   label: "Mistral (Small 4)",      bucket: "open" },
      { id: "deepseek",  label: "DeepSeek (V3.2, V4 pending)", bucket: "open" },
      { id: "qwen",      label: "Alibaba (Qwen 3.5)",     bucket: "open" },
      { id: "zhipu",     label: "Zhipu (GLM-5.1)",        bucket: "open" },
    ],
  },

  // ─── Pattern G: Portfolio Builder (capstone) ────────────────────────
  "cap-portfolio": {
    pattern: "portfolio",
    prompt: "Build a 5-ticker AI portfolio. Choose from the pool below. You'll be scored across Thematic Purity, Diversification, Liquidity, and Regulatory Risk — then benchmarked against Goldman's suggested basket.",
    slots: 5,
    pool: [
      "MSFT","GOOGL","AMZN","META",
      "NVDA","TSM","ASML","AVGO","MU","AMD",
      "BABA",
      "DELL","SMCI",
      "CEG","VST","NEE","OKLO","NNE",
    ],
    // Per-ticker dimension scores 0–1 (hand-calibrated from the coverage report)
    // purity = % of revenue/strategy tied to AI; liquidity = market-cap/float; regRisk INVERTED (1 = low risk)
    scores: {
      MSFT:  { purity: 0.55, liq: 1.00, regRisk: 0.85 },
      GOOGL: { purity: 0.50, liq: 1.00, regRisk: 0.75 },
      AMZN:  { purity: 0.35, liq: 1.00, regRisk: 0.80 },
      META:  { purity: 0.45, liq: 0.95, regRisk: 0.70 },
      NVDA:  { purity: 0.95, liq: 1.00, regRisk: 0.70 },
      TSM:   { purity: 0.75, liq: 0.90, regRisk: 0.55 },
      ASML:  { purity: 0.80, liq: 0.85, regRisk: 0.70 },
      AVGO:  { purity: 0.80, liq: 0.90, regRisk: 0.80 },
      MU:    { purity: 0.75, liq: 0.75, regRisk: 0.75 },
      AMD:   { purity: 0.70, liq: 0.90, regRisk: 0.75 },
      BABA:  { purity: 0.45, liq: 0.70, regRisk: 0.25 },
      DELL:  { purity: 0.50, liq: 0.75, regRisk: 0.85 },
      SMCI:  { purity: 0.70, liq: 0.55, regRisk: 0.55 },
      CEG:   { purity: 0.60, liq: 0.75, regRisk: 0.75 },
      VST:   { purity: 0.55, liq: 0.70, regRisk: 0.75 },
      NEE:   { purity: 0.30, liq: 0.85, regRisk: 0.85 },
      OKLO:  { purity: 0.70, liq: 0.45, regRisk: 0.40 },
      NNE:   { purity: 0.70, liq: 0.30, regRisk: 0.35 },
    },
    // Sector affiliations for diversification scoring
    sectors: {
      MSFT: "hyperscaler", GOOGL: "hyperscaler", AMZN: "hyperscaler", META: "hyperscaler",
      NVDA: "gpu", AMD: "gpu",
      TSM: "foundry", ASML: "litho",
      AVGO: "asic", MU: "memory",
      BABA: "china",
      DELL: "oem", SMCI: "oem",
      CEG: "power", VST: "power", NEE: "power", OKLO: "smr", NNE: "smr",
    },
    benchmark: ["NVDA","MSFT","GOOGL","TSM","ASML"],
  },
};
