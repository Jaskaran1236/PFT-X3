// api/global.js — GET /api/global
const SYMBOLS = {
  indices: {
    'S&P 500':   '^GSPC',
    'NASDAQ':    '^IXIC',
    'Dow Jones': '^DJI',
    'FTSE 100':  '^FTSE',
    'Nikkei':    '^N225',
    'DAX':       '^GDAXI',
  },
  commodities: {
    'Gold':      'GC=F',
    'Oil (WTI)': 'CL=F',
    'Silver':    'SI=F',
  },
  crypto: {
    'Bitcoin':   'BTC-USD',
    'Ethereum':  'ETH-USD',
  },
  bonds: {
    '10Y Treasury': '^TNX',
    '2Y Treasury':  '^IRX',
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const allSymbols = Object.values(SYMBOLS).flatMap(g => Object.values(g));
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
  };

  try {
    const encoded = allSymbols.map(s => encodeURIComponent(s)).join('%2C');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Yahoo status ${r.status}`);

    const data    = await r.json();
    const results = data?.quoteResponse?.result ?? [];

    const bySymbol = {};
    for (const q of results) {
      bySymbol[q.symbol] = {
        price:         q.regularMarketPrice         ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
      };
    }

    const out = {};
    for (const [cat, items] of Object.entries(SYMBOLS)) {
      out[cat] = {};
      for (const [name, sym] of Object.entries(items)) {
        out[cat][name] = { symbol: sym, ...(bySymbol[sym] ?? { price: null, changePercent: null }) };
      }
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error('global error:', err.message);
    // Return structure with nulls so frontend renders gracefully
    const out = {};
    for (const [cat, items] of Object.entries(SYMBOLS)) {
      out[cat] = {};
      for (const [name, sym] of Object.entries(items)) {
        out[cat][name] = { symbol: sym, price: null, changePercent: null };
      }
    }
    return res.status(200).json(out);
  }
}
