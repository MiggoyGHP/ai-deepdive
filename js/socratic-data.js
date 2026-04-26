/**
 * socratic-data.js - Prompts, truths, and explanations for every Socratic
 * interaction in the deck. Keyed by the slide's data-id attribute.
 */
window.SOCRATIC = {
  // ─── Pattern A: Hypothesize-then-Reveal ──────────────────────────────
  "hy-vc-share": {
    pattern: "hypothesize",
    prompt: "AI captured ~81% of Q1 2026 global VC ($188B of $290B). Suppose that share mean-reverts to ~55% by Q4 2026. Which PUBLIC AI names see the worst multiple compression first — and which are insulated?",
    confidenceLabel: "Confidence in mean-reversion thesis",
    answerValue: "Most exposed: model-layer beta proxies (MSFT, GOOGL, ORCL, META). Most insulated: contracted supply chain (NVDA/TSM/SK Hynix/AVGO/MU)",
    explanation:
      "$188B of Q1's $290B global VC — about <b>65%</b> — flowed to just four AI mega-deals (OpenAI, Anthropic, xAI, Waymo). " +
      "If sentiment reverses, the proxies for private model labs re-rate first because they're priced on optionality. " +
      "<b>Trader read:</b> the ~$560–600B aggregate hyperscaler 2026 capex is already <b>signed and contracted</b>, so supply-chain revenue is insulated for ~12 months. The cleanest defensive trade vs a VC mean-reversion is long supply chain / short hyperscaler-AI optionality.",
  },
  "hy-anthropic-enterprise": {
    pattern: "hypothesize",
    prompt: "Anthropic is ~80% enterprise (Claude Code-driven); OpenAI carries a heavy consumer mix. If you had to express that divergence as a public-proxy pair trade right now, which leg goes long, which short — and what's the read-through to MSFT vs GOOGL multiples?",
    confidenceLabel: "Confidence in pair direction",
    answerValue: "Long GOOGL (Anthropic enterprise lever via Vertex + 10% equity) / hedge MSFT (consumer-heavy OpenAI proxy)",
    explanation:
      "Per CEO Dario Amodei, ~<b>80%</b> of Anthropic's revenue is enterprise — driven primarily by Claude Code. " +
      "Enterprise mix scales faster + stickier + higher margin than consumer; if Anthropic prints $50B ARR by Q4, GOOGL's Anthropic equity stake re-marks materially while MSFT's OpenAI consumer mix faces pricing-power compression. " +
      "<b>Caveat:</b> MSFT also has 27% equity + 20% rev-share + Azure tailwind — so the leg is more 'long Anthropic enterprise' than outright short MSFT. Express via long GOOGL / pair to MSFT beta on options.",
  },

  // ─── Pattern B: Numerical Estimate-then-Check ────────────────────────
  "est-openai-val": {
    pattern: "estimate",
    prompt: "OpenAI closed its latest primary round in February 2026 at what post-money valuation, in $B? (Trader follow-on: $852B on $25B ARR = ~34×. What's implied compression if Anthropic prints $50B ARR by Q4 and forces a re-mark?)",
    unit: "B",
    min: 100, max: 1500, step: 10, start: 500,
    truth: 852,
    tolerance: 75,
    explanation:
      "<b>$852B post-money</b> (Feb 2026). Saudi PIF, MGX, SoftBank lead. On $25B ARR = ~34× ARR multiple. " +
      "Secondary markets push implied marks on Anthropic toward <b>$1T</b>; VC bids for Anthropic at $800B+ being declined. " +
      "<b>Trader read:</b> if Anthropic prints $50B ARR by Q4 (200%+ YoY from $30B end-of-2025), it could force a re-mark up to $1.5T+ on consensus — which then pulls OpenAI's implied multiple down by 15–25%. The cleanest pair: long GOOGL (Anthropic equity stake) / hedge MSFT.",
  },
  "est-hbm-share": {
    pattern: "estimate",
    prompt: "SK Hynix supplies HBM to most major customers. What % of NVDA's HBM comes from SK Hynix? (Trader follow-on: if Samsung qualifies HBM4 in Q2 and captures 25% of incremental NVDA orders, who gets re-rated — Samsung directly, MU as relief-valve, or AVGO as de-bottlenecked custom ASIC builder?)",
    unit: "%",
    min: 0, max: 100, step: 1, start: 30,
    truth: 90,
    tolerance: 8,
    explanation:
      "Roughly <b>~90% of NVDA HBM is SK Hynix</b> (SK Hynix has ~62% global HBM share; NVDA is its biggest customer). Entire 2026 HBM capacity allocated. HBM = ~30% of DRAM revenue from only 8% of bit output. " +
      "<b>Trader read:</b> Samsung HBM4 qualification is the most-watched memory event of 2026. Successful qual → Samsung re-rates +20–30% (closes share gap), MU re-rates more modestly (HBM4 ramp 2H26 already priced), AVGO gets de-bottlenecked but the marginal upside is in the custom-HBM stack for hyperscaler ASIC programs.",
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
      "Without CoWoS, a Blackwell GPU is 'just a collection of dies' — the interposer integration with HBM stacks is what makes it a product. " +
      "<b>Trader read:</b> the constraint binds NVDA's order book through 2026 — and crowds out AVGO's custom ASIC programs which use the same packaging.",
  },

  // ─── v2 NEW Pattern B estimates ──────────────────────────────────────
  "est-inference-multiplier": {
    pattern: "estimate",
    prompt: "Reasoning-mode (chain-of-thought scratchpad) has replaced single-pass generation at the frontier. For the same end-user query, how many MORE compute tokens does a reasoning model burn vs vanilla decoding?",
    unit: "× multiplier",
    min: 1, max: 300, step: 1, start: 10,
    truth: 50,
    tolerance: 25,
    explanation:
      "Per v2: roughly <b>25–250×</b> depending on task complexity. A non-reasoning query might generate 200 output tokens; a reasoning query (Claude Opus 4.6 thinking, GPT-5.4 deep, Gemini 3.1 Pro Deep Think) generates 5,000–50,000 reasoning tokens before the final answer. " +
      "<b>Trader read:</b> this is THE reason inference compute overtook training in 2025. Re-rates AVGO + MRVL custom-ASIC inference programs more than NVDA training; rewards memory-bandwidth-rich silicon (HBM4, SK Hynix, MU).",
  },
  "est-sndk-nand-share": {
    pattern: "estimate",
    prompt: "Sandisk (SNDK) is the only U.S.-listed NAND pure-play after the Feb 2025 Western Digital spin. AI training/inference checkpointing + KV-cache offload drives NAND demand. Roughly what % of 2026 NAND bit demand is AI/data-center driven (vs phone/PC/consumer)?",
    unit: "%",
    min: 0, max: 60, step: 1, start: 15,
    truth: 20,
    tolerance: 8,
    explanation:
      "Per v2: enterprise SSD demand is the fastest-growing tier; Sandisk is 60% retail / 40% enterprise with the enterprise mix scaling and carrying the highest margins. " +
      "<b>Trader read:</b> SNDK is structurally the most leveraged play to AI-driven enterprise SSD demand, but the story has not yet been broadly picked up by the analyst community — sell-side coverage is still rebuilding post-spin. v2 initiates Overweight.",
  },

  // ─── v2 NEW Pattern A hypothesize ────────────────────────────────────
  "hy-mac-studio-share": {
    pattern: "hypothesize",
    prompt: "Apple's M3 Ultra Mac Studio ships up to 512GB unified memory @ ~800 GB/s — quantized Llama 4 Maverick / DeepSeek V3.2 / Qwen 3.5 Max can run from a single $9,500 desktop. By Dec 2026, what % of professional-developer LLM inference will run locally on Apple silicon?",
    confidenceLabel: "Confidence in this share",
    answerValue: "Not disclosed by v2; estimated low single digits overall, but >25% in dev/research segment",
    explanation:
      "v2 doesn't put a precise number on this — but the adoption signals are explicit: <b>MLX framework crossed 25k GitHub stars</b>, is now default backend for Ollama on macOS + LM Studio, and Mac Studios ≥256GB RAM have a 2–4 month back-order at Apple's online store as of April 2026. " +
      "Among professional developers running open-weight models locally — a fast-growing segment as Chinese open-weight quality climbs — Apple Silicon is the dominant platform. " +
      "<b>Trader read:</b> AAPL is upgraded to <b>Tactical Overweight (NEW)</b> in v2. The thesis is hardware unit growth + services uplift, not the closed Apple Intelligence model. Catalyst path: WWDC June 2026 (Apple Intelligence v3, MLX v2).",
  },

  // ─── v2 NEW Pattern D tradeoffs ──────────────────────────────────────
  "to-train-vs-inference": {
    pattern: "tradeoff",
    prompt: "v2 makes the case that inference compute overtook training in 2025 and grows ~2× faster. If you have to express that shift as a single-name long for the next 12 months, which goes on?",
    options: [
      { id: "a", label: "A. NVDA — still the default training silicon and biggest fleet", headline: "Stay with the leader" },
      { id: "b", label: "B. AVGO — co-design partner on TPU + MTIA + 1 undisclosed; AI rev +106% YoY", headline: "Inference ASIC re-rate" },
      { id: "c", label: "C. MRVL — custom ASIC + AI networking, smaller scale than AVGO", headline: "Smaller-cap ASIC pure-play" },
      { id: "d", label: "D. TSM — fabricates everything regardless of who wins", headline: "Foundry monopoly" },
    ],
    dimensions: ["Direct exposure to inference shift", "Catalyst proximity", "Crowding (consensus)", "Asymmetry"],
    matrix: {
      a: { cells: ["mid", "high", "high", "low"], verdict: "NVDA still wins training but cedes inference share to custom silicon. Already consensus + crowded; little asymmetry left at current multiples." },
      b: { cells: ["high", "high", "mid", "high"], verdict: "v2's explicit call: 'AVGO is the most undervalued name in the entire AI silicon complex.' Co-design partner on TPU, MTIA, and one undisclosed program. AI semi rev +106% YoY. Catalyst: GOOGL TPU v7 external availability (Jun)." },
      c: { cells: ["mid", "low", "low", "mid"], verdict: "MRVL is real exposure but smaller scale. Watch for incremental hyperscaler design wins. Lower conviction than AVGO." },
      d: { cells: ["mid", "mid", "high", "low"], verdict: "TSM is the always-right pick on AI silicon, but it doesn't isolate the inference-shift trade — it captures the average, not the alpha." },
    },
    best: "b",
  },
  "to-pair-trades": {
    pattern: "tradeoff",
    prompt: "Three v2-derived pair trades. Each isolates a thesis the report explicitly lays out. Pick the one with the cleanest setup for Q3 2026.",
    options: [
      { id: "a", label: "A. Long AVGO / Short NVDA — into the inference ASIC re-rate", headline: "ASIC vs GPU" },
      { id: "b", label: "B. Long SNDK / Short MU — AI-NAND-vs-AI-HBM divergence", headline: "NAND vs HBM" },
      { id: "c", label: "C. Long CRWV / Short ORCL — neocloud-vs-hyperscaler concentration", headline: "Neocloud vs hyperscaler" },
    ],
    dimensions: ["Thesis clarity in v2", "Catalyst proximity", "Crowding", "Asymmetry"],
    matrix: {
      a: { cells: ["high", "high", "low", "high"], verdict: "v2's strongest single-name call: 'AVGO is the most undervalued name in the entire AI silicon complex.' AI rev +106% YoY · target >$100B by 2027. NVDA is consensus long; this trade isolates the inference-share migration without taking outright AI-bear risk. Catalyst: GOOGL TPU v7 external availability (Jun)." },
      b: { cells: ["mid", "low", "low", "mid"], verdict: "v2 thesis is real (SNDK Overweight NEW, MU also Overweight), but both are long ratings — this is more 'long-asymmetry within memory' than a clean divergence. Better expressed as long SNDK outright vs long MU on a beta basis." },
      c: { cells: ["high", "mid", "mid", "high"], verdict: "Both are Overweight in v2 — pair isolates the customer-concentration risk (CRWV >50% MSFT vs ORCL >50% OpenAI/Stargate). Cleanest catalyst: MSFT Build (May) followed by hyperscaler Q2 prints (Q3). Caveat: both legs are NVDA-aligned long, so the pair is more about which cloud's anchor customer prints first." },
    },
    best: "a",
  },

  // ─── v2 NEW Pattern E causal ─────────────────────────────────────────
  "ca-crwv-msft-concentration": {
    pattern: "causal",
    prompt:
      "CoreWeave (CRWV) reported >50% of 2024 revenue from a single customer: Microsoft. If MSFT trims FY27 capex guide by 10% at its next print, which of these actually follow?",
    note: "Select all that apply. Submit when you're confident.",
    options: [
      { id: "crwv-rerate-down", text: "CRWV equity re-rates lower — concentration risk crystallizes overnight.", truth: "direct", rationale: "Direct: a 10% MSFT capex cut translates to material backlog risk for CRWV given the >50% revenue concentration." },
      { id: "nbis-share-gain",  text: "NBIS gains share as the 'non-MSFT alternative' for AI capacity buyers.",      truth: "direct", rationale: "Direct: NBIS is explicitly positioned in v2 as the non-Chinese, non-U.S.-anchored neocloud — a natural diversification beneficiary." },
      { id: "orcl-stargate-up", text: "ORCL becomes more important on the margin as the OpenAI Stargate primary partner.", truth: "direct", rationale: "Direct: with MSFT softening, OpenAI's $300B+ Oracle/Stargate contracts become a larger share of incremental hyperscale capacity." },
      { id: "msft-fcf-positive", text: "MSFT free cash flow inflects positive — capex relief flows through to FCF.",  truth: "indirect", rationale: "Indirect: real but slow — MSFT operating cash flow is so large that 10% capex is meaningful but takes 1–2 quarters to print clean in FCF." },
      { id: "nvda-immediate-hit", text: "NVDA loses an order book customer immediately and the stock gaps lower.",    truth: "false", rationale: "False: NVDA's order book is contracted on multi-quarter lead times. A capex GUIDE cut is sentiment; revenue impact lags. NVDA may sell off, but it's a 2nd-derivative move." },
      { id: "sndk-up", text: "SNDK rallies as MSFT shifts mix from training (HBM-heavy) to inference (NAND-heavier).",  truth: "false", rationale: "False: a capex CUT doesn't shift mix toward inference — it just spends less. Inference shift is a separate, secular trend." },
      { id: "hbm-reshuffled", text: "SK Hynix HBM allocations get reshuffled away from MSFT-aligned NVDA orders.",   truth: "indirect", rationale: "Indirect: possibly true on a multi-quarter horizon, but SK Hynix HBM is fully allocated through 2026 — reshuffling is slow and customer-driven." },
    ],
    scoring: {
      directWeight: 1,
      indirectWeight: 0.5,
      falsePenalty: 0.5,
    },
  },

  // ─── v2 NEW Pattern F chart probe (mirrors NVDA) ─────────────────────
  "cp-avgo-catalysts": {
    pattern: "chart-probe",
    prompt: "Five catalysts marked on AVGO's chart. v2 explicitly calls AVGO 'the most undervalued name in the entire AI silicon complex.' Which one was the structural re-rate that forced the consensus to catch up?",
    ticker: "AVGO",
    markers: [
      { n: 1, time: "2024-12-12", label: "FY24 Q4 — AI rev guide raise; first 'multi-year AI semi target'",
        reaction: "+24% in single session — biggest one-day gap in AVGO history. The day AVGO became an 'AI stock'.", correct: true },
      { n: 2, time: "2025-09-04", label: "Q3 FY25 — second hyperscaler ASIC customer disclosed",
        reaction: "+9% — incremental but expected at this point in the cycle.", correct: false },
      { n: 3, time: "2026-03-06", label: "Q1 FY26 — AI semi +106% YoY; reiterates >$100B AI chip rev by 2027",
        reaction: "+5% — beat already largely priced after sell-side ramp.", correct: false },
      { n: 4, time: "2026-04-22", label: "GOOGL announces 2 new TPUs (v7 + successor) — AVGO is co-designer",
        reaction: "+3% — TPU validation but read-through already in stock.", correct: false },
      { n: 5, time: "2026-04-15", label: "Anthropic multi-GW TPU commitment with Google Cloud through 2027+",
        reaction: "+4% — third major lab on TPU; AVGO custom-ASIC franchise validated for Anthropic workloads.", correct: false },
    ],
    explanation:
      "AVGO's December 2024 FY4Q print was the moment the market re-rated it from 'broadband + software' into the AI silicon complex. Hock Tan's first explicit multi-year AI revenue target reframed the company as a structural beneficiary of hyperscaler custom-ASIC adoption (Google TPU, Meta MTIA, then a third undisclosed customer). " +
      "Every catalyst since has been a confirmation of that thesis, not a re-rate — which is precisely why the 'obvious' bullish events (TPU v7 announcement, Anthropic commitment, +106% YoY beat) barely moved the stock relative to the December 2024 reset. " +
      "<b>Trader takeaway:</b> the re-rating already happened. The next leg requires either a 4th hyperscaler customer disclosure or a clean GOOGL TPU v7 external-availability milestone (Jun 2026 catalyst window).",
  },

  // ─── Pattern D: Multi-Factor Trade-off ───────────────────────────────
  "to-meta-capex": {
    pattern: "tradeoff",
    prompt: "META trades ~25× forward into Q4 2026 with $65B+ AI capex and zero direct Llama licensing rev. Pick the single catalyst most likely to BREAK the multiple in the next 90 days:",
    options: [
      { id: "a", label: "A. Llama 5 release lands flat vs Qwen 3.5 / Kimi K2.6 on cost-adjusted benchmarks", headline: "Capability gap exposed" },
      { id: "b", label: "B. Q3 2026 print: capex GUIDE-DOWN signals AI ROI fatigue", headline: "Capex fatigue tell" },
      { id: "c", label: "C. DeepSeek V4 ships on Huawei Ascend at $0.14/M and outprints Llama 4 Maverick on enterprise benchmarks", headline: "Open-weight floor compresses" },
    ],
    dimensions: ["Probability (90d)", "Magnitude on multiple", "Crowding (consensus)", "Asymmetry (skew)"],
    matrix: {
      a: { cells: ["mid", "mid", "low", "mid"], verdict: "Real risk but Meta has telegraphed Llama 5 will be incremental; market expects it. If it's flat, the immediate sell-off is muted because it's already 'in the price.'" },
      b: { cells: ["low", "high", "mid", "high"], verdict: "Lowest probability (Meta has explicitly committed to capex through 2027), but if it happened, the multiple compression would be brutal — META is priced on the assumption capex eventually monetizes via ads or Reality Labs. This is the classic 'tail-risk options trade' setup." },
      c: { cells: ["high", "mid", "low", "mid"], verdict: "The most likely catalyst (Q2 2026 release window per v2). Open-weight cost compression hits Meta's open-weight differentiator hardest — Llama is no longer the cheapest credible option. Sell-side will frame it as 'Meta's moat erodes faster than ad TAM grows.'" },
    },
    best: "c",
  },

  // ─── Pattern E: Causal Reasoning Chain ──────────────────────────────
  "ca-anthropic-tpu": {
    pattern: "causal",
    prompt:
      "April 2026: Anthropic committed to multi-GW Google TPU capacity through 2027+ (on top of $25B AWS Trainium). Which of these actually follow as second-order effects?",
    note: "Select all that apply. Submit when you're confident.",
    options: [
      { id: "nvda-lose-customer", text: "NVDA loses a marquee training customer — a real revenue drag over time.", truth: "direct", rationale: "Anthropic was a significant future training buyer for NVDA; multi-GW TPU absorbs capacity that would otherwise hit NVDA's order book." },
      { id: "googl-cloud-up",     text: "GOOGL Cloud revenue inflects — a third major AI lab now runs on GCP.",      truth: "direct", rationale: "Positive read-across for Alphabet Cloud revenue recognition and a proof point for TPU-as-a-service externally." },
      { id: "avgo-tailwind",      text: "AVGO benefits more than GOOGL on a MARGIN basis (custom-ASIC franchise validation).", truth: "direct", rationale: "v2 explicit: AVGO co-designs TPU silicon. Multi-GW commitment supports AVGO's >$100B custom AI chip revenue target by 2027 — and AVGO captures a higher gross-margin slice than GCP services revenue does for Google." },
      { id: "mrvl-rerate",        text: "MRVL re-rates as the next custom-ASIC merchant winner.",                     truth: "indirect", rationale: "Indirect: Anthropic-TPU is AVGO-specific, but the deal validates the merchant-ASIC thesis broadly. MRVL gets a sentiment lift; durability requires its own hyperscaler design win." },
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
    prompt: "Sort these AI players into Open-weight vs Closed-weight. Note: Apple is a curveball — v2 categorizes it as hybrid-stack (closed model, open framework). For this exercise, place by FLAGSHIP-MODEL access.",
    buckets: [
      { id: "closed", label: "Closed-weight (Capability Rent)" },
      { id: "open",   label: "Open-weight (Commoditize Complements)" },
    ],
    items: [
      { id: "openai",    label: "OpenAI (GPT-5.4)",       bucket: "closed" },
      { id: "anthropic", label: "Anthropic (Claude 4.6 / Mythos 5)", bucket: "closed" },
      { id: "deepmind",  label: "Google DeepMind (Gemini 3.1 Pro)", bucket: "closed" },
      { id: "xai",       label: "xAI (Grok 4.20)",        bucket: "closed" },
      { id: "apple",     label: "Apple Intelligence (closed end-to-end)", bucket: "closed" },
      { id: "tencent-t1",label: "Tencent Hunyuan T1 (first-party flagship)", bucket: "closed" },
      { id: "baidu-e5",  label: "Baidu ERNIE 5.0 (closed flagship)", bucket: "closed" },
      { id: "llama",     label: "Meta (Llama 4 Scout/Maverick)", bucket: "open" },
      { id: "mistral",   label: "Mistral (Small 4)",      bucket: "open" },
      { id: "deepseek",  label: "DeepSeek (V3.2, V4 pending)", bucket: "open" },
      { id: "qwen",      label: "Alibaba (Qwen 3.5 397B)", bucket: "open" },
      { id: "zhipu",     label: "Zhipu (GLM-5.1, 744B)",  bucket: "open" },
      { id: "minimax",   label: "MiniMax (M2.5 + Hailuo-02)", bucket: "open" },
      { id: "kimi",      label: "Moonshot (Kimi K2.6, 1T)", bucket: "open" },
      { id: "tencent-o", label: "Tencent Hunyuan-Open (389B)", bucket: "open" },
      { id: "baidu-x",   label: "Baidu ERNIE-X1",          bucket: "open" },
      { id: "stepfun",   label: "StepFun (Step-3, 321B)", bucket: "open" },
    ],
  },

  // ─── Pattern G: Portfolio Builder (capstone) ────────────────────────
  "cap-portfolio": {
    pattern: "portfolio",
    prompt: "Build a 5-ticker AI portfolio. Choose from the pool below. You'll be scored across Thematic Purity, Diversification, Liquidity, Regulatory Risk, and Catalyst Density (next 90d) — then benchmarked against Goldman's v2 suggested basket.",
    slots: 5,
    pool: [
      // Hyperscalers + closed-weight proxies
      "MSFT","GOOGL","AMZN","META","ORCL",
      // Compute / silicon
      "NVDA","TSM","ASML","AVGO","MRVL","MU","AMD",
      // Memory pure-play (NEW v2)
      "SNDK",
      // Local-AI hardware (NEW v2)
      "AAPL",
      // Neoclouds (NEW v2 tier)
      "CRWV","NBIS","APLD",
      // China
      "BABA","TCEHY","BIDU",
      // Server OEMs
      "DELL","SMCI",
      // Power
      "CEG","VST","TLN","NEE","OKLO","NNE",
    ],
    // Per-ticker dimension scores 0–1 (hand-calibrated from v2 coverage report)
    // purity = % rev/strategy tied to AI; liq = float/market-cap; regRisk INVERTED (1 = low risk)
    // catalysts = density of named catalysts in next 90d per Forward Calendar
    scores: {
      MSFT:  { purity: 0.55, liq: 1.00, regRisk: 0.85, catalysts: 0.95 },  // Build May
      GOOGL: { purity: 0.55, liq: 1.00, regRisk: 0.75, catalysts: 0.85 },  // I/O follow-on Jun
      AMZN:  { purity: 0.40, liq: 1.00, regRisk: 0.80, catalysts: 0.45 },
      META:  { purity: 0.45, liq: 0.95, regRisk: 0.70, catalysts: 0.55 },  // Llama 5 watch
      ORCL:  { purity: 0.65, liq: 0.90, regRisk: 0.75, catalysts: 0.60 },
      NVDA:  { purity: 0.95, liq: 1.00, regRisk: 0.70, catalysts: 1.00 },  // Q1 FY27 May
      TSM:   { purity: 0.75, liq: 0.90, regRisk: 0.55, catalysts: 0.70 },  // Q2 print
      ASML:  { purity: 0.80, liq: 0.85, regRisk: 0.70, catalysts: 0.45 },
      AVGO:  { purity: 0.85, liq: 0.90, regRisk: 0.80, catalysts: 0.85 },  // TPU v7 read-through
      MRVL:  { purity: 0.70, liq: 0.80, regRisk: 0.80, catalysts: 0.55 },
      MU:    { purity: 0.75, liq: 0.85, regRisk: 0.75, catalysts: 0.75 },  // HBM4 ramp Q2
      AMD:   { purity: 0.65, liq: 0.90, regRisk: 0.75, catalysts: 0.50 },
      SNDK:  { purity: 0.55, liq: 0.55, regRisk: 0.80, catalysts: 0.50 },  // Q2 standalone print
      AAPL:  { purity: 0.30, liq: 1.00, regRisk: 0.85, catalysts: 0.90 },  // WWDC Jun
      CRWV:  { purity: 0.95, liq: 0.55, regRisk: 0.60, catalysts: 0.65 },
      NBIS:  { purity: 0.95, liq: 0.45, regRisk: 0.55, catalysts: 0.55 },
      APLD:  { purity: 0.75, liq: 0.40, regRisk: 0.55, catalysts: 0.30 },
      BABA:  { purity: 0.50, liq: 0.70, regRisk: 0.25, catalysts: 0.55 },
      TCEHY: { purity: 0.50, liq: 0.65, regRisk: 0.30, catalysts: 0.50 },
      BIDU:  { purity: 0.45, liq: 0.55, regRisk: 0.25, catalysts: 0.40 },
      DELL:  { purity: 0.50, liq: 0.75, regRisk: 0.85, catalysts: 0.40 },
      SMCI:  { purity: 0.70, liq: 0.55, regRisk: 0.55, catalysts: 0.40 },
      CEG:   { purity: 0.60, liq: 0.75, regRisk: 0.75, catalysts: 0.50 },
      VST:   { purity: 0.55, liq: 0.70, regRisk: 0.75, catalysts: 0.50 },
      TLN:   { purity: 0.65, liq: 0.55, regRisk: 0.70, catalysts: 0.55 },
      NEE:   { purity: 0.30, liq: 0.85, regRisk: 0.85, catalysts: 0.30 },
      OKLO:  { purity: 0.70, liq: 0.45, regRisk: 0.40, catalysts: 0.35 },
      NNE:   { purity: 0.70, liq: 0.30, regRisk: 0.35, catalysts: 0.30 },
    },
    // Sector affiliations for diversification scoring (v2 expanded)
    sectors: {
      MSFT: "hyperscaler", GOOGL: "hyperscaler", AMZN: "hyperscaler", META: "hyperscaler", ORCL: "hyperscaler",
      NVDA: "gpu", AMD: "gpu",
      TSM: "foundry", ASML: "litho",
      AVGO: "asic", MRVL: "asic",
      MU: "memory", SNDK: "nand",
      AAPL: "local-ai",
      CRWV: "neocloud", NBIS: "neocloud", APLD: "neocloud",
      BABA: "china", TCEHY: "china", BIDU: "china",
      DELL: "oem", SMCI: "oem",
      CEG: "power", VST: "power", TLN: "power", NEE: "power",
      OKLO: "smr", NNE: "smr",
    },
    benchmark: ["NVDA","MSFT","GOOGL","TSM","ASML","AVGO","AAPL"],
  },
};
