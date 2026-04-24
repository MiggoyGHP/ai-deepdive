"""
fetch_financials.py — Fetch per-ticker financials via yfinance.

Emits js/financials-data.js with two things per ticker:
  * metrics   — scalar summary (market cap, revenue, margins, etc.)
  * narrative — hand-curated GS coverage-report overlay
  * statements— quarterly + annual income / balance / cash-flow tables

The statements schema mirrors the TradingView "Statements" page:
  statements.income.quarterly = {
    periods:   ["Q2 '23", "Q3 '23", ...],   # display labels, oldest → newest
    dates:     ["2023-06-30", "2023-09-30", ...],
    ttm:       <bool>,                       # True if last col is a TTM aggregate
    rows: {
      revenue:         { label: "Total Revenue",    highlight: true,  values: [...] },
      cogs:            { label: "Cost of Revenue",  highlight: false, values: [...] },
      grossProfit:     { label: "Gross Profit",     highlight: true,  values: [...] },
      ...
    }
  }
"""
import json
import math
import os

import pandas as pd
import yfinance as yf

TICKERS = [
    "MSFT", "GOOGL", "AMZN", "META",
    "NVDA", "TSM", "ASML", "AVGO", "MU", "AMD",
    "BABA",
    "DELL", "SMCI",
    "CEG", "VST", "NEE", "OKLO", "NNE",
    "DXYZ", "CHAT",
]

NARRATIVE = {
    "MSFT":  "27% equity + 20% rev-share in OpenAI through 2032. Cleanest public proxy for OpenAI + Azure AI tailwind.",
    "GOOGL": "~10% Anthropic equity. Announced 2 new TPUs Apr 2026. 2026 capex up to $185B. Triple-vector: Gemini + Anthropic + TPU.",
    "AMZN":  "Up to $25B committed to Anthropic + 2GW AWS Trainium allocation. AWS largest cloud beneficiary of AI buildout.",
    "META":  "$65B+ AI capex 2026. Llama open-weight strategy; Muse Spark closed proprietary pivot announced Apr 2026.",
    "NVDA":  "$250B supply-chain commitments. Holds majority of TSMC CoWoS allocation. ~62% of SK Hynix HBM supply goes to NVDA.",
    "TSM":   "2nm (N2) booked 78–104 weeks. 2026 capex $52–56B. CoWoS packaging sold out through mid-2026. Q1 2026 profit +58% YoY.",
    "ASML":  "EUV + High-NA EUV monopoly required for 3nm/2nm/1.4nm. ~€36B backlog YE25. ~$380M per High-NA tool.",
    "AVGO":  "AI semi revenue +106% YoY. Custom ASIC co-design for Google TPU, AWS Trainium, Meta MTIA. Targets >$100B AI chip rev by 2027.",
    "MU":    "HBM4 ramp for volume in 2026. Most attractive pure-play HBM equity. HBM ~30% of DRAM rev vs. 8% of bit output.",
    "AMD":   "Instinct MI-series gaining share but distant #2 to NVDA in training. Market-weight rating.",
    "BABA":  "Qwen 3.5 397B tops open-weight benchmarks. Qwen drives Alibaba Cloud adoption. Political/regulatory risk discount.",
    "DELL":  "Server OEM exposure to AI rack buildout. Integration of GPUs + liquid cooling + networking.",
    "SMCI":  "Rebuilding post accounting restatement. Server OEM cycle exposure to hyperscaler capex.",
    "CEG":   "Power generation contracts for AI data centers. U.S. DC demand: 176 TWh (2023) → 325–580 TWh (2028).",
    "VST":   "Gas peakers and nuclear for AI data center demand. Beneficiary of PJM's projected 6GW shortfall by 2027.",
    "NEE":   "Largest U.S. renewable generator. PPA counterparty for hyperscaler clean-energy commitments.",
    "OKLO":  "Small modular reactor (SMR) optionality. Speculative — no commercial deployment yet.",
    "NNE":   "Nano Nuclear Energy — SMR play. Highly speculative, pre-revenue.",
    "DXYZ":  "Destiny Tech100 closed-end fund. Holdings: OpenAI, SpaceX, Anthropic, Epic Games. Trades at persistent NAV premium.",
    "CHAT":  "Roundhill Generative AI & Technology ETF. Basket of public AI names; no private-company content.",
}


# ─── Formatting helpers for the metrics object ───────────────────────────────
def fmt_money(v):
    if v is None: return None
    try: v = float(v)
    except Exception: return None
    a = abs(v)
    if a >= 1e12: return f"${v/1e12:.2f}T"
    if a >= 1e9:  return f"${v/1e9:.2f}B"
    if a >= 1e6:  return f"${v/1e6:.1f}M"
    return f"${v:,.0f}"


def fmt_pct(v):
    if v is None: return None
    try: return f"{float(v)*100:.1f}%"
    except Exception: return None


def fmt_num(v, digits=2):
    if v is None: return None
    try: return f"{float(v):.{digits}f}"
    except Exception: return None


def extract_metrics(info):
    g = info.get
    return {
        "name":             g("longName") or g("shortName") or "—",
        "sector":           g("sector") or "—",
        "industry":         g("industry") or "—",
        "marketCap":        fmt_money(g("marketCap")),
        "enterpriseValue":  fmt_money(g("enterpriseValue")),
        "revenue":          fmt_money(g("totalRevenue")),
        "revenueGrowth":    fmt_pct(g("revenueGrowth")),
        "grossMargin":      fmt_pct(g("grossMargins")),
        "operatingMargin":  fmt_pct(g("operatingMargins")),
        "profitMargin":     fmt_pct(g("profitMargins")),
        "forwardPE":        fmt_num(g("forwardPE"), 1),
        "trailingPE":       fmt_num(g("trailingPE"), 1),
        "freeCashFlow":     fmt_money(g("freeCashflow")),
        "operatingCashFlow":fmt_money(g("operatingCashflow")),
        "totalCash":        fmt_money(g("totalCash")),
        "totalDebt":        fmt_money(g("totalDebt")),
        "fiftyTwoWkHigh":   fmt_num(g("fiftyTwoWeekHigh"), 2),
        "fiftyTwoWkLow":    fmt_num(g("fiftyTwoWeekLow"), 2),
        "beta":             fmt_num(g("beta"), 2),
        "dividendYield":    fmt_pct(g("dividendYield")),
    }


# ─── Statements extraction ───────────────────────────────────────────────────
def _fnum(v):
    """Clean a DataFrame cell into a float or None."""
    if v is None: return None
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f): return None
        return round(f, 2)
    except Exception:
        return None


def _find_row(df, *candidates):
    """Case-insensitive search through DataFrame.index — exact match first, then substring."""
    if df is None or df.empty:
        return None
    lower_index = {str(i).strip().lower(): i for i in df.index}
    for c in candidates:
        if c.lower() in lower_index:
            return df.loc[lower_index[c.lower()]]
    for c in candidates:
        for key, real in lower_index.items():
            if c.lower() in key:
                return df.loc[real]
    return None


def _extract_rows(df, periods, spec):
    """spec = [(key, [candidate names...], highlight_bool), ...]. Returns ordered dict."""
    out = {}
    for key, candidates, highlight in spec:
        series = _find_row(df, *candidates)
        if series is None:
            continue
        values = [_fnum(series.get(p)) for p in periods]
        if all(v is None for v in values):
            continue
        out[key] = {"label": candidates[0], "highlight": highlight, "values": values}
    return out


INCOME_ROWS = [
    ("revenue",         ["Total Revenue", "Operating Revenue"],                 True),
    ("cogs",            ["Cost Of Revenue", "Cost of Revenue"],                 False),
    ("grossProfit",     ["Gross Profit"],                                       True),
    ("opex",            ["Operating Expense", "Total Operating Expenses"],      False),
    ("operatingIncome", ["Operating Income"],                                   True),
    ("otherIncome",     ["Net Non Operating Interest Income Expense",
                         "Other Income Expense"],                               False),
    ("pretaxIncome",    ["Pretax Income", "EBIT"],                              True),
    ("tax",             ["Tax Provision", "Taxes"],                             False),
    ("netIncome",       ["Net Income", "Net Income Common Stockholders"],       True),
    ("ebitda",          ["EBITDA", "Normalized EBITDA"],                        False),
]

BALANCE_ROWS = [
    ("totalAssets",     ["Total Assets"],                                       True),
    ("cash",            ["Cash And Cash Equivalents",
                         "Cash Cash Equivalents And Short Term Investments"],   False),
    ("shortTermDebt",   ["Current Debt", "Short Long Term Debt"],               False),
    ("longTermDebt",    ["Long Term Debt"],                                     False),
    ("totalDebt",       ["Total Debt"],                                         True),
    ("totalLiab",       ["Total Liabilities Net Minority Interest",
                         "Total Liab"],                                         True),
    ("stockholdersEquity", ["Stockholders Equity", "Total Equity Gross Minority Interest"], True),
    ("sharesOutstanding",  ["Ordinary Shares Number", "Share Issued"],         False),
]

CASHFLOW_ROWS = [
    ("operatingCF",     ["Operating Cash Flow",
                         "Cash Flow From Continuing Operating Activities"],     True),
    ("capex",           ["Capital Expenditure"],                                False),
    ("freeCashFlow",    ["Free Cash Flow"],                                     True),
    ("investingCF",     ["Investing Cash Flow",
                         "Cash Flow From Continuing Investing Activities"],     False),
    ("financingCF",     ["Financing Cash Flow",
                         "Cash Flow From Continuing Financing Activities"],     False),
    ("endCash",         ["End Cash Position"],                                  False),
]


def _period_labels(timestamps, is_quarterly):
    """Return (display_labels, iso_dates) — sorted chronologically (oldest first)."""
    sorted_ts = sorted(timestamps)
    dates = [ts.strftime("%Y-%m-%d") for ts in sorted_ts]
    if is_quarterly:
        labels = [f"Q{((ts.month - 1) // 3) + 1} '{ts.strftime('%y')}" for ts in sorted_ts]
    else:
        labels = [ts.strftime("%Y") for ts in sorted_ts]
    return labels, dates, sorted_ts


def _build_section(df_annual, df_quarterly, spec, max_annual=8, max_quarterly=12):
    """Build {annual, quarterly} section from two DataFrames."""
    out = {}
    if df_annual is not None and not df_annual.empty:
        cols = [c for c in df_annual.columns if hasattr(c, "strftime")]
        cols_sorted = sorted(cols)[-max_annual:]
        labels, dates, ts = _period_labels(cols_sorted, False)
        out["annual"] = {
            "periods": labels,
            "dates":   dates,
            "rows":    _extract_rows(df_annual, ts, spec),
        }
    if df_quarterly is not None and not df_quarterly.empty:
        cols = [c for c in df_quarterly.columns if hasattr(c, "strftime")]
        cols_sorted = sorted(cols)[-max_quarterly:]
        labels, dates, ts = _period_labels(cols_sorted, True)
        out["quarterly"] = {
            "periods": labels,
            "dates":   dates,
            "rows":    _extract_rows(df_quarterly, ts, spec),
        }
    return out


def extract_statements(yft):
    income = _build_section(
        getattr(yft, "income_stmt", None),
        getattr(yft, "quarterly_income_stmt", None),
        INCOME_ROWS,
    )
    balance = _build_section(
        getattr(yft, "balance_sheet", None),
        getattr(yft, "quarterly_balance_sheet", None),
        BALANCE_ROWS,
    )
    cashflow = _build_section(
        getattr(yft, "cashflow", None),
        getattr(yft, "quarterly_cashflow", None),
        CASHFLOW_ROWS,
    )
    return {"income": income, "balance": balance, "cashflow": cashflow}


def main():
    out = {}
    for t in TICKERS:
        print(f"Fetching {t}...", end=" ", flush=True)
        try:
            yft = yf.Ticker(t)
            info = yft.info or {}
            out[t] = {
                "metrics":    extract_metrics(info),
                "narrative":  NARRATIVE.get(t, ""),
                "statements": extract_statements(yft),
            }
            # Quick size indicator
            i_ann = len((out[t]["statements"].get("income") or {}).get("annual",    {}).get("rows", {}))
            i_q   = len((out[t]["statements"].get("income") or {}).get("quarterly", {}).get("rows", {}))
            print(f"OK  (income: {i_ann} annual rows, {i_q} quarterly rows)")
        except Exception as e:
            print(f"ERROR: {e}")
            out[t] = {"metrics": {}, "narrative": NARRATIVE.get(t, ""), "statements": {}}

    js_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "js", "financials-data.js")
    os.makedirs(os.path.dirname(js_path), exist_ok=True)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by fetch_financials.py — do not edit by hand.\n")
        f.write("window.FINANCIALS = ")
        f.write(json.dumps(out, indent=2, ensure_ascii=False))
        f.write(";\n")
    size_kb = os.path.getsize(js_path) // 1024
    print(f"\nWrote {js_path} ({size_kb} KB)")


if __name__ == "__main__":
    main()
