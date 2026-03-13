# PFT-X v3 — Personal Financial Terminal

Institutional-grade personal finance dashboard. Deploy to Vercel in minutes.

## Features

| Feature | Details |
|---|---|
| Portfolio tracker | Positions, live P&L, allocation donut, sector bars |
| AI Score | Real-time portfolio health score |
| Monte Carlo | 3-line simulation (best/likely/worst), always visible |
| AI Portfolio Advisor | Claude analyses your full portfolio |
| Stock Intelligence Panel | Click any ticker → full slide-in panel |
| 1D/1W/1M/1Y/5Y chart | Toggle with volume bars underneath |
| AI Peak/Trough analysis | Click ◆ markers for Claude explanation |
| Analyst sentiment | Buy/hold/sell bar + AI target price |
| AI Prediction Engine | Per-stock 30-day Monte Carlo |
| Global Markets | Indices, commodities, crypto, bonds — live |
| Market Heatmap | Real daily % changes |
| Smart Money Flow | 13F institutional tracker |
| News feed | Finnhub headlines (general + per stock) |
| Watchlist | Live prices + real % change |
| Price Alerts | Browser notification + in-app banner |
| Persistence | Everything survives page refresh (localStorage) |
| Ticker bar | Live scrolling prices |

## File Structure

```
pft-x/
├── public/index.html        ← entire frontend (single file)
├── api/
│   ├── bulk.js              ← GET  /api/bulk?tickers=AAPL,MSFT
│   ├── chartdata.js         ← GET  /api/chartdata?ticker=AAPL&range=1y
│   ├── global.js            ← GET  /api/global
│   ├── news.js              ← GET  /api/news[?ticker=AAPL]
│   ├── explain.js           ← POST /api/explain
│   ├── intelligence.js      ← POST /api/intelligence
│   └── advisor.js           ← POST /api/advisor
├── vercel.json
├── package.json
├── .env.example
└── .gitignore
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "PFT-X v3"
git remote add origin https://github.com/YOUR_USERNAME/pft-x.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Click Deploy — it works immediately

### 3. Add API Keys (for AI features + news)

In Vercel: **Project → Settings → Environment Variables**

| Key | Where to get | Required for |
|---|---|---|
| `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io) — free | News headlines |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | AI intelligence, advisor, explanations |

After adding keys: **Redeploy** (Deployments → ⋯ → Redeploy)

## Without API Keys

The site works fine without keys — stock prices, charts, heatmap, global markets, Monte Carlo, and all portfolio features use Yahoo Finance (free, no key). News and AI features will show a helpful message instead of breaking.

## Local Development

```bash
npm install -g vercel
vercel dev
# → http://localhost:3000
```
