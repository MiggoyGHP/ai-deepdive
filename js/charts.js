/**
 * charts.js - TradingView Lightweight Charts modal with EMA + MACD
 */

const COMPANY_NAMES = {
  MSFT: "Microsoft", GOOGL: "Alphabet", AMZN: "Amazon", META: "Meta Platforms",
  NVDA: "NVIDIA", TSM: "TSMC", ASML: "ASML Holding", AVGO: "Broadcom",
  MU: "Micron Technology", AMD: "AMD", BABA: "Alibaba",
  DELL: "Dell Technologies", SMCI: "Super Micro Computer",
  CEG: "Constellation Energy", VST: "Vistra", NEE: "NextEra Energy",
  OKLO: "Oklo", NNE: "Nano Nuclear Energy",
  DXYZ: "Destiny Tech100", CHAT: "Roundhill GenAI ETF",
};

// Map a ticker to its TradingView "EXCHANGE:SYMBOL" form.
// Most US large-caps work with NASDAQ: or NYSE: prefixes.
const TV_SYMBOL = {
  MSFT: "NASDAQ:MSFT", GOOGL: "NASDAQ:GOOGL", AMZN: "NASDAQ:AMZN", META: "NASDAQ:META",
  NVDA: "NASDAQ:NVDA", AVGO: "NASDAQ:AVGO", MU: "NASDAQ:MU", AMD: "NASDAQ:AMD",
  TSM: "NYSE:TSM", ASML: "NASDAQ:ASML", BABA: "NYSE:BABA",
  DELL: "NYSE:DELL", SMCI: "NASDAQ:SMCI",
  CEG: "NASDAQ:CEG", VST: "NYSE:VST", NEE: "NYSE:NEE",
  OKLO: "NYSE:OKLO", NNE: "NASDAQ:NNE",
  DXYZ: "NYSE:DXYZ", CHAT: "AMEX:CHAT",
};

const dataCache = {};

/** Read a computed CSS variable value from :root */
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function initCharts() {
  document.addEventListener('click', function(e) {
    const ticker = e.target.closest('.ticker');
    if (ticker) {
      e.preventDefault();
      e.stopPropagation();
      openChartModal(ticker.getAttribute('data-ticker') || ticker.textContent.trim());
    }
  });
}

async function fetchTickerData(ticker) {
  if (dataCache[ticker]) return dataCache[ticker];
  try {
    const resp = await fetch(`data/${ticker}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    dataCache[ticker] = data;
    return data;
  } catch (err) {
    console.error(`Failed to load data for ${ticker}:`, err);
    return null;
  }
}

function computeEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    const close = data[i].close;
    if (ema === null) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
      ema = sum / period;
    } else {
      ema = close * k + ema * (1 - k);
    }
    result.push({ time: data[i].time, value: Math.round(ema * 100) / 100 });
  }
  return result;
}

function computeMACD(data, fast = 12, slow = 26, signal = 9) {
  const closes = data.map(d => d.close);
  const times = data.map(d => d.time);

  function emaArr(arr, period) {
    const out = [];
    const k = 2 / (period + 1);
    let ema = null;
    for (let i = 0; i < arr.length; i++) {
      if (ema === null) {
        if (i < period - 1) { out.push(null); continue; }
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += arr[j];
        ema = sum / period;
      } else {
        ema = arr[i] * k + ema * (1 - k);
      }
      out.push(ema);
    }
    return out;
  }

  const fastEma = emaArr(closes, fast);
  const slowEma = emaArr(closes, slow);

  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEma[i] != null && slowEma[i] != null) {
      macdLine.push(fastEma[i] - slowEma[i]);
    } else {
      macdLine.push(null);
    }
  }

  const validMacd = macdLine.filter(v => v !== null);
  const signalEma = emaArr(validMacd, signal);

  let si = 0;
  const macdResult = [], signalResult = [], histResult = [];
  const posColor = getCSSVar('--primary') || '#f2d801';
  const negColor = getCSSVar('--error') || '#E63946';
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null) continue;
    const m = Math.round(macdLine[i] * 1000) / 1000;
    const s = signalEma[si] != null ? Math.round(signalEma[si] * 1000) / 1000 : null;
    macdResult.push({ time: times[i], value: m });
    if (s !== null) {
      signalResult.push({ time: times[i], value: s });
      histResult.push({
        time: times[i],
        value: Math.round((m - s) * 1000) / 1000,
        color: m - s >= 0 ? posColor + '99' : negColor + '99',
      });
    }
    si++;
  }

  return { macd: macdResult, signal: signalResult, histogram: histResult };
}

function mountTVWidget(container, loaderUrl, config) {
  // TradingView's loader script reads its own text content as JSON config.
  const wrapper = document.createElement('div');
  wrapper.className = 'tradingview-widget-container';
  wrapper.style.cssText = 'height:100%;width:100%;';
  const widgetHost = document.createElement('div');
  widgetHost.className = 'tradingview-widget-container__widget';
  widgetHost.style.cssText = 'height:100%;width:100%;';
  wrapper.appendChild(widgetHost);

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = loaderUrl;
  script.async = true;
  script.text = JSON.stringify(config);
  wrapper.appendChild(script);

  container.innerHTML = '';
  container.appendChild(wrapper);
}

function mountTVAdvancedChart(container, symbol) {
  mountTVWidget(
    container,
    'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
    {
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(12, 20, 31, 1)',
      gridColor: 'rgba(74, 85, 104, 0.15)',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      details: true,
      withdateranges: true,
      studies: [
        'STD;EMA',
        'STD;MACD',
      ],
      calendar: false,
      support_host: 'https://www.tradingview.com',
    }
  );
}

function mountTVSymbolInfo(container, symbol) {
  mountTVWidget(
    container,
    'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js',
    {
      symbol: symbol,
      width: '100%',
      locale: 'en',
      colorTheme: 'dark',
      isTransparent: true,
    }
  );
}

async function openChartModal(ticker) {
  const existing = document.querySelector('.chart-modal-overlay');
  if (existing) existing.remove();

  const companyName = COMPANY_NAMES[ticker] || ticker;
  const tvSymbol = TV_SYMBOL[ticker] || ticker;

  const overlay = document.createElement('div');
  overlay.className = 'chart-modal-overlay';
  overlay.innerHTML = `
    <div class="chart-modal">
      <div class="chart-modal-header">
        <h3>${companyName} <span style="color: var(--primary-dim)">(${ticker})</span></h3>
        <button class="chart-modal-close" title="Close">&times;</button>
      </div>
      <div class="chart-modal-tabs">
        <button class="chart-modal-tab active" data-tab="chart">Chart</button>
        <button class="chart-modal-tab" data-tab="financials">Financials</button>
      </div>
      <div class="chart-modal-body">
        <div id="tab-chart" class="tab-content" style="display:flex; flex-direction:column; height:100%;">
          <div id="tv-chart-host" class="chart-container" style="flex: 1; min-height:0;"></div>
        </div>
        <div id="tab-financials" class="tab-content" style="display:none;">
          <div id="fin-statements-host"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  if (window.Reveal) Reveal.configure({ keyboard: false });

  overlay.querySelector('.chart-modal-close').onclick = () => closeChartModal(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeChartModal(overlay);
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeChartModal(overlay);
      document.removeEventListener('keydown', escHandler);
    }
  });

  overlay.querySelectorAll('.chart-modal-tab').forEach(tab => {
    tab.onclick = () => {
      overlay.querySelectorAll('.chart-modal-tab').forEach(t => t.classList.remove('active'));
      overlay.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      const activeTab = document.getElementById(`tab-${tab.dataset.tab}`);
      activeTab.style.display = '';

      // Fix for TradingView iframe going stale on redisplay:
      // 1) Nudge with a resize event (works for most in-DOM iframe libs)
      // 2) Belt-and-suspenders: remount the Advanced Chart widget when
      //    returning to the Chart tab, since its autosize can latch to 0px
      //    after being hidden.
      if (tab.dataset.tab === 'chart') {
        window.dispatchEvent(new Event('resize'));
        // Always remount the chart widget — cheap (~1s) and guarantees full size.
        const host = overlay.querySelector('#tv-chart-host');
        if (host) mountTVAdvancedChart(host, tvSymbol);
      }
    };
  });

  // Mount TradingView Advanced Chart on the Chart tab
  mountTVAdvancedChart(overlay.querySelector('#tv-chart-host'), tvSymbol);
  // Render the custom Statements view on the Financials tab (matches TradingView style)
  renderFinancials(ticker, overlay.querySelector('#fin-statements-host'));
}

function renderPriceChart(data, container) {
  const surface = getCSSVar('--surface') || '#0c141f';
  const textColor = getCSSVar('--on-surface') || '#dbe3f4';
  const fontBody = getCSSVar('--font-body') || 'Inter';
  const gridColor = 'rgba(74, 85, 104, 0.1)';
  const scaleColor = 'rgba(74, 85, 104, 0.2)';
  const upColor = getCSSVar('--primary') || '#f2d801';
  const downColor = getCSSVar('--error') || '#E63946';

  const chart = LightweightCharts.createChart(container, {
    layout: {
      background: { type: 'solid', color: surface },
      textColor: textColor,
      fontFamily: fontBody,
    },
    grid: {
      vertLines: { color: gridColor },
      horzLines: { color: gridColor },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: scaleColor },
    timeScale: {
      borderColor: scaleColor,
      timeVisible: false,
    },
    handleScale: { axisPressedMouseMove: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
  });

  const candleSeries = chart.addCandlestickSeries({
    upColor: upColor,
    downColor: downColor,
    borderUpColor: upColor,
    borderDownColor: downColor,
    wickUpColor: upColor,
    wickDownColor: downColor,
  });
  candleSeries.setData(data);

  const ema20 = chart.addLineSeries({
    color: '#00BCD4', lineWidth: 1, priceLineVisible: false,
    lastValueVisible: false, crosshairMarkerVisible: false,
  });
  ema20.setData(computeEMA(data, 20));

  const ema50 = chart.addLineSeries({
    color: '#FF9800', lineWidth: 1, priceLineVisible: false,
    lastValueVisible: false, crosshairMarkerVisible: false,
  });
  ema50.setData(computeEMA(data, 50));

  const ema200 = chart.addLineSeries({
    color: '#E040FB', lineWidth: 1, priceLineVisible: false,
    lastValueVisible: false, crosshairMarkerVisible: false,
  });
  ema200.setData(computeEMA(data, 200));

  chart.timeScale().fitContent();

  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
  });
  ro.observe(container);
}

function renderMACDChart(data, container) {
  const surface = getCSSVar('--surface') || '#0c141f';
  const textColor = getCSSVar('--on-surface') || '#dbe3f4';
  const fontBody = getCSSVar('--font-body') || 'Inter';
  const gridColor = 'rgba(74, 85, 104, 0.06)';
  const scaleColor = 'rgba(74, 85, 104, 0.2)';

  const chart = LightweightCharts.createChart(container, {
    layout: {
      background: { type: 'solid', color: surface },
      textColor: textColor,
      fontFamily: fontBody,
      fontSize: 10,
    },
    grid: {
      vertLines: { color: gridColor },
      horzLines: { color: gridColor },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: scaleColor },
    timeScale: {
      borderColor: scaleColor,
      timeVisible: false,
    },
    handleScale: { axisPressedMouseMove: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
  });

  const { macd, signal, histogram } = computeMACD(data);

  const histSeries = chart.addHistogramSeries({
    priceLineVisible: false, lastValueVisible: false,
    priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
  });
  histSeries.setData(histogram);

  const macdSeries = chart.addLineSeries({
    color: '#00BCD4', lineWidth: 1.5, priceLineVisible: false,
    lastValueVisible: false, crosshairMarkerVisible: false,
  });
  macdSeries.setData(macd);

  const signalSeries = chart.addLineSeries({
    color: '#FF9800', lineWidth: 1.5, priceLineVisible: false,
    lastValueVisible: false, crosshairMarkerVisible: false,
  });
  signalSeries.setData(signal);

  chart.timeScale().fitContent();

  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
  });
  ro.observe(container);
}

// ─── Number formatter ─────────────────────────────────────────────────
function fmtFin(v) {
  if (v == null) return '—';
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e12) return `${sign}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9)  return `${sign}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6)  return `${sign}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3)  return `${sign}${(a / 1e3).toFixed(2)}K`;
  return `${sign}${a.toFixed(2)}`;
}

function fmtYoY(curr, prev) {
  if (curr == null || prev == null || prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { pct, label: `${sign}${pct.toFixed(2)}%`, positive: pct >= 0 };
}

// Compute TTM sum of the last 4 quarterly values (for flow items like revenue, net income).
// Returns null if fewer than 4 non-null values.
function ttmSum(values) {
  if (!values || values.length < 4) return null;
  const last4 = values.slice(-4);
  if (last4.some(v => v == null)) return null;
  return last4.reduce((a, b) => a + b, 0);
}

// Compute prior-year YoY pair for quarterly view: each period paired with 4 quarters prior.
function quarterlyYoYPairs(values) {
  return values.map((v, i) => {
    const prior = i - 4 >= 0 ? values[i - 4] : null;
    return fmtYoY(v, prior);
  });
}

function annualYoYPairs(values) {
  return values.map((v, i) => fmtYoY(v, i > 0 ? values[i - 1] : null));
}

// ─── Main renderer for the Financials tab ────────────────────────────
function renderFinancials(ticker, container) {
  const fd = (typeof window !== 'undefined' && window.FINANCIALS) ? window.FINANCIALS[ticker] : null;
  if (!fd) { container.innerHTML = '<p>No financials data.</p>'; return; }

  const stmts = fd.statements || {};
  const hasIncome   = stmts.income   && (stmts.income.annual   || stmts.income.quarterly);
  const hasBalance  = stmts.balance  && (stmts.balance.annual  || stmts.balance.quarterly);
  const hasCashflow = stmts.cashflow && (stmts.cashflow.annual || stmts.cashflow.quarterly);

  // Which flow-type rows should be TTM-summed on the quarterly view
  const FLOW_ROWS = new Set([
    'revenue','cogs','grossProfit','opex','operatingIncome','otherIncome',
    'pretaxIncome','tax','netIncome','ebitda',
    'operatingCF','capex','freeCashFlow','investingCF','financingCF',
  ]);

  // Build narrative + key-metric strip
  const m = fd.metrics || {};
  const kv = [
    ['Market Cap',         m.marketCap],
    ['Revenue (TTM)',      m.revenue],
    ['Rev Growth YoY',     m.revenueGrowth],
    ['Gross Margin',       m.grossMargin],
    ['Op Margin',          m.operatingMargin],
    ['Forward P/E',        m.forwardPE],
    ['Free Cash Flow',     m.freeCashFlow],
    ['Total Debt',         m.totalDebt],
  ].filter(r => r[1] !== null && r[1] !== undefined && r[1] !== '');

  let state = {
    statement: hasIncome ? 'income' : hasBalance ? 'balance' : 'cashflow',
    period:    'quarterly', // default to quarterly
  };

  function render() {
    const section = stmts[state.statement];
    const data    = section && section[state.period];
    const hasCurrentView = data && Object.keys(data.rows || {}).length > 0;

    let h = '';
    // Narrative banner
    if (fd.narrative) {
      h += `<div class="fin-narrative"><strong>From the coverage report:</strong> ${fd.narrative}</div>`;
    }
    // Key-metric chips
    h += `<div class="fin-chip-row">`;
    kv.forEach(([k, v]) => {
      h += `<div class="fin-chip"><span class="fin-chip-k">${k}</span><span class="fin-chip-v">${v}</span></div>`;
    });
    h += `</div>`;

    // Controls: statement selector + period toggle
    h += `<div class="fin-controls">
      <div class="fin-statement-tabs">
        ${hasIncome   ? `<button class="fin-st-btn${state.statement==='income'   ?' active':''}" data-st="income">Income statement</button>` : ''}
        ${hasBalance  ? `<button class="fin-st-btn${state.statement==='balance'  ?' active':''}" data-st="balance">Balance sheet</button>` : ''}
        ${hasCashflow ? `<button class="fin-st-btn${state.statement==='cashflow' ?' active':''}" data-st="cashflow">Cash flow</button>` : ''}
      </div>
      <div class="fin-period-toggle">
        ${section && section.annual    ? `<button class="fin-per-btn${state.period==='annual'   ?' active':''}" data-per="annual">Annual</button>` : ''}
        ${section && section.quarterly ? `<button class="fin-per-btn${state.period==='quarterly'?' active':''}" data-per="quarterly">Quarterly</button>` : ''}
      </div>
    </div>`;

    // Table
    if (!hasCurrentView) {
      h += `<div class="fin-empty">No ${state.period} ${state.statement} data available for this ticker.</div>`;
    } else {
      const rows = data.rows;
      const periods = data.periods;
      const periodsTTM = state.period === 'quarterly' ? [...periods, 'TTM'] : periods;

      h += `<div class="fin-scroll"><table class="fin-stmt"><thead><tr>
        <th class="fin-rowhead">Currency: USD</th>
        ${periodsTTM.map(p => `<th>${p}</th>`).join('')}
      </tr></thead><tbody>`;

      Object.entries(rows).forEach(([key, row]) => {
        const values = row.values;
        const extended = state.period === 'quarterly'
          ? [...values, FLOW_ROWS.has(key) ? ttmSum(values) : values[values.length - 1]]
          : values;

        const yoys = state.period === 'quarterly'
          ? [...quarterlyYoYPairs(values), null]   // no TTM YoY
          : annualYoYPairs(values);

        const hlClass = row.highlight ? 'fin-hl' : '';
        // Value row
        h += `<tr class="fin-row-val ${hlClass}">
          <td class="fin-rowhead">${row.label}${row.highlight ? '<div class="fin-subtle">YoY growth</div>' : ''}</td>
          ${extended.map((v, i) => {
            const neg = (v != null && v < 0);
            return `<td class="${neg ? 'fin-neg' : ''}">
              ${fmtFin(v)}
              ${row.highlight && yoys[i] ? `<div class="fin-yoy ${yoys[i].positive ? 'pos' : 'neg'}">${yoys[i].label}</div>` : ''}
            </td>`;
          }).join('')}
        </tr>`;
      });

      h += `</tbody></table></div>`;
    }

    h += `<div class="fin-src">Source: Yahoo Finance (Refinitiv/LSEG) · Narrative: GS AI Coverage Report, Apr 2026.</div>`;

    container.innerHTML = h;
    wireControls();
  }

  function wireControls() {
    container.querySelectorAll('.fin-st-btn').forEach(b => {
      b.onclick = () => {
        state.statement = b.dataset.st;
        // If switching to a statement that doesn't have the current period, fall back
        const section = stmts[state.statement];
        if (!section[state.period]) {
          state.period = section.quarterly ? 'quarterly' : 'annual';
        }
        render();
      };
    });
    container.querySelectorAll('.fin-per-btn').forEach(b => {
      b.onclick = () => { state.period = b.dataset.per; render(); };
    });
  }

  render();
}

function fmtB(v) {
  if (v == null) return '—';
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  if (a >= 1) return `${s}$${a.toFixed(2)}B`;
  if (a >= 0.01) return `${s}$${(a * 1000).toFixed(0)}M`;
  return `${s}$${(a * 1000).toFixed(1)}M`;
}

function closeChartModal(overlay) {
  overlay.remove();
  if (window.Reveal) Reveal.configure({ keyboard: true });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharts);
} else {
  initCharts();
}

/* ── Pattern F: inline Chart Probe ────────────────────────────────────────
 * Renders a small price chart inline inside a .chart-probe element with
 * numbered markers at specified dates. Buttons are BLIND pre-pick — only
 * the number is shown — so the labels don't give away the answer. On pick,
 * every button reveals its label, date, and price-action; the correct
 * marker is highlighted, and a narrative explanation appears.
 *
 * Markers JSON on data-markers: [{ n, time, label, reaction, correct }]
 * Optional data-explanation on the .chart-probe element.
 */
function _formatProbeDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${MONTHS[m-1]} ${d}, ${y}`;
}

async function initChartProbes() {
  const probes = document.querySelectorAll('.chart-probe');
  for (const el of probes) {
    if (el.dataset.probeInit === '1') continue;
    el.dataset.probeInit = '1';
    const ticker = el.dataset.ticker;
    if (!ticker) continue;
    const markers = JSON.parse(el.dataset.markers || '[]');
    const explanation = el.dataset.explanation || '';

    // Blind initial render — only the number shows until the user picks
    el.innerHTML = `
      <div class="probe-chart" style="height: 460px;"></div>
      <div class="probe-markers">
        ${markers.map(mk => `
          <button class="probe-marker-btn is-blind"
                  data-n="${mk.n}"
                  data-correct="${mk.correct ? '1' : ''}"
                  aria-label="Marker ${mk.n}">
            <span class="probe-n">${mk.n}</span>
            <span class="probe-btn-body"><span class="probe-blind-label">Marker ${mk.n}</span></span>
          </button>
        `).join('')}
      </div>
    `;

    const data = await fetchTickerData(ticker);
    if (!data) {
      el.querySelector('.probe-chart').innerHTML =
        '<div class="financials-placeholder"><p>Chart data unavailable.</p></div>';
      continue;
    }

    const chartEl = el.querySelector('.probe-chart');
    const surface = getCSSVar('--surface') || '#0c141f';
    const textColor = getCSSVar('--on-surface') || '#dbe3f4';
    const fontBody = getCSSVar('--font-body') || 'Inter';
    const gridColor = 'rgba(74, 85, 104, 0.1)';
    const scaleColor = 'rgba(74, 85, 104, 0.2)';
    const upColor = getCSSVar('--primary') || '#f2d801';
    const downColor = getCSSVar('--error') || '#E63946';

    const chart = LightweightCharts.createChart(chartEl, {
      layout: { background: { type: 'solid', color: surface }, textColor, fontFamily: fontBody },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: scaleColor },
      timeScale: { borderColor: scaleColor, timeVisible: false },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
    });

    const series = chart.addCandlestickSeries({
      upColor, downColor, borderUpColor: upColor, borderDownColor: downColor,
      wickUpColor: upColor, wickDownColor: downColor,
    });
    series.setData(data);

    const seriesMarkers = markers.map(mk => ({
      time: mk.time,
      position: 'aboveBar',
      color: getCSSVar('--primary') || '#f2d801',
      shape: 'circle',
      text: String(mk.n),
    }));
    series.setMarkers(seriesMarkers);
    chart.timeScale().fitContent();

    new ResizeObserver(() => {
      chart.applyOptions({ width: chartEl.clientWidth, height: chartEl.clientHeight });
    }).observe(chartEl);

    function revealAll(pickedN) {
      el.querySelectorAll('.probe-marker-btn').forEach(b => {
        const n = +b.dataset.n;
        const mk = markers.find(m => m.n === n);
        if (!mk) return;
        const body = b.querySelector('.probe-btn-body');
        body.innerHTML = `
          <span class="probe-label">${mk.label}</span>
          <span class="probe-meta">
            <span class="probe-date">${_formatProbeDate(mk.time)}</span>
            <span class="probe-reaction">${mk.reaction || ''}</span>
          </span>
        `;
        b.classList.remove('is-blind');
        b.disabled = true;
        if (b.dataset.correct === '1') b.classList.add('probe-correct');
        if (n === pickedN && b.dataset.correct !== '1') b.classList.add('probe-wrong');
      });

      const slide = el.closest('.socratic-slide');
      const explain = slide && slide.querySelector('.chart-probe-feedback');
      if (explain) {
        const pickedMk = markers.find(m => m.n === pickedN);
        const correct = pickedMk && pickedMk.correct;
        const header = correct
          ? '<b>Correct.</b> '
          : '<b>Not quite — the correct marker is highlighted.</b> ';
        explain.innerHTML = header + explanation;
        explain.classList.remove('band-correct', 'band-cold');
        explain.classList.add(correct ? 'band-correct' : 'band-cold');
      }
      if (slide) slide.dataset.submitted = 'true';
    }

    el.querySelectorAll('.probe-marker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const pickedN = +btn.dataset.n;
        const correct = btn.dataset.correct === '1';
        revealAll(pickedN);
        const slide = el.closest('.socratic-slide');
        if (slide && window.SocraticState) {
          window.SocraticState.save(slide.dataset.id || ('probe-' + ticker), {
            pattern: 'chart-probe',
            picked: pickedN,
            correct,
          });
        }
      });
    });

    const slide = el.closest('.socratic-slide');
    if (slide && window.SocraticState) {
      const prior = window.SocraticState.get(slide.dataset.id || ('probe-' + ticker));
      if (prior && prior.picked != null) revealAll(prior.picked);
    }
  }
}

// Re-init chart probes on slide changes (only new ones run — idempotent)
if (window.Reveal) {
  Reveal.on('ready', initChartProbes);
  Reveal.on('slidechanged', initChartProbes);
}
