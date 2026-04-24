"""
fetch_data.py - Fetch 3 years of daily OHLCV data for AI coverage tickers.
Outputs JSON files compatible with TradingView Lightweight Charts.
"""
import json
import os
from datetime import datetime, timedelta

import yfinance as yf

TICKERS = [
    # Closed-weight proxies / hyperscalers
    "MSFT", "GOOGL", "AMZN", "META",
    # AI compute + semis
    "NVDA", "TSM", "ASML", "AVGO", "MU", "AMD",
    # Chinese / open-weight
    "BABA",
    # Server OEMs
    "DELL", "SMCI",
    # Power / energy
    "CEG", "VST", "NEE", "OKLO", "NNE",
    # Venture / thematic access
    "DXYZ", "CHAT",
]

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

end_date = datetime.now()
start_date = end_date - timedelta(days=3 * 365)

for ticker in TICKERS:
    print(f"Fetching {ticker}...", end=" ")
    try:
        df = yf.download(
            ticker,
            start=start_date.strftime("%Y-%m-%d"),
            end=end_date.strftime("%Y-%m-%d"),
            interval="1d",
            progress=False,
        )
        if df.empty:
            print("NO DATA")
            continue

        # Flatten multi-level columns if present
        if hasattr(df.columns, 'levels') and len(df.columns.levels) > 1:
            df.columns = df.columns.get_level_values(0)

        records = []
        for date, row in df.iterrows():
            records.append({
                "time": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        out_path = os.path.join(OUTPUT_DIR, f"{ticker}.json")
        with open(out_path, "w") as f:
            json.dump(records, f)

        print(f"OK ({len(records)} bars)")
    except Exception as e:
        print(f"ERROR: {e}")

print("\nDone.")
