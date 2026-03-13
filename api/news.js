// api/news.js — GET /api/news or /api/news?ticker=AAPL
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const KEY    = process.env.FINNHUB_API_KEY;
  const { ticker } = req.query;

  if (!KEY) {
    // Return empty so frontend shows helpful message, not infinite spinner
    return res.status(200).json([]);
  }

  try {
    let url;
    if (ticker) {
      const to   = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${KEY}`;
    } else {
      url = `https://finnhub.io/api/v1/news?category=general&token=${KEY}`;
    }

    const r    = await fetch(url);
    const data = await r.json();

    return res.status(200).json(Array.isArray(data) ? data.slice(0, 10) : []);
  } catch (err) {
    console.error('news error:', err.message);
    return res.status(200).json([]);
  }
}
