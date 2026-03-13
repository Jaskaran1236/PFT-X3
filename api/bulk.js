// api/bulk.js — GET /api/bulk?tickers=AAPL,MSFT,NVDA
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers param required' });

  const list = tickers.split(',').map(t => t.trim()).filter(Boolean);
  if (!list.length) return res.status(400).json({ error: 'no valid tickers' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  };

  try {
    const symbols = list.map(t => encodeURIComponent(t)).join('%2C');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,shortName`;

    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Yahoo status ${r.status}`);

    const data = await r.json();
    const results = data?.quoteResponse?.result ?? [];

    const out = {};
    for (const q of results) {
      out[q.symbol] = {
        price:         q.regularMarketPrice         ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
        change:        q.regularMarketChange        ?? null,
        name:          q.shortName                  ?? q.symbol,
      };
    }
    // Return nulls for any ticker that didn't come back
    for (const t of list) {
      if (!out[t]) out[t] = { price: null, changePercent: null, change: null, name: t };
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error('bulk error:', err.message);
    // Graceful: return nulls so frontend doesn't crash
    const out = {};
    for (const t of list) out[t] = { price: null, changePercent: null, change: null, name: t };
    return res.status(200).json(out);
  }
}
