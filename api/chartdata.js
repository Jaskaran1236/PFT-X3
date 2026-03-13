// api/chartdata.js — GET /api/chartdata?ticker=AAPL&range=1y
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { ticker, range = '1y' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const cfg = {
    '1d': { interval: '5m',  period: '1d'  },
    '1w': { interval: '1h',  period: '5d'  },
    '1m': { interval: '1d',  period: '1mo' },
    '1y': { interval: '1d',  period: '1y'  },
    '5y': { interval: '1mo', period: '5y'  },
  };
  const { interval, period } = cfg[range] ?? cfg['1y'];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
  };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${period}&includePrePost=false`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Yahoo status ${r.status}`);

    const data   = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'no data', points: [] });

    const ts      = result.timestamp ?? [];
    const q       = result.indicators?.quote?.[0] ?? {};
    const closes  = q.close  ?? [];
    const volumes = q.volume ?? [];
    const highs   = q.high   ?? [];
    const lows    = q.low    ?? [];

    const fmtDate = (ts) => {
      const d = new Date(ts * 1000);
      if (range === '1d' || range === '1w') {
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toISOString().slice(0, 10);
    };

    const points = ts
      .map((t, i) => ({
        date:   fmtDate(t),
        close:  closes[i]  != null ? +closes[i].toFixed(2)  : null,
        volume: volumes[i] != null ? Math.round(volumes[i]) : 0,
        high:   highs[i]   != null ? +highs[i].toFixed(2)   : null,
        low:    lows[i]    != null ? +lows[i].toFixed(2)    : null,
      }))
      .filter(p => p.close != null);

    return res.status(200).json({
      ticker,
      name:          result.meta?.shortName      ?? ticker,
      range,
      points,
      previousClose: result.meta?.previousClose  ?? points[0]?.close ?? null,
      currentPrice:  result.meta?.regularMarketPrice ?? points[points.length - 1]?.close ?? null,
    });
  } catch (err) {
    console.error('chartdata error:', err.message);
    return res.status(200).json({ ticker, name: ticker, range, points: [], error: err.message });
  }
}
