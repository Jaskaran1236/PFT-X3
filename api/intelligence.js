// api/intelligence.js — POST /api/intelligence
// Body: { ticker, name, currentPrice, changePercent, high52w, low52w }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return res.status(200).json({
      aiScore: 50, trend: 'Neutral', volatility: 'Medium',
      hedgeFundActivity: 'Stable', analystConsensus: 'Hold',
      targetPrice: null, buyRating: 34, holdRating: 33, sellRating: 33,
      keyInsight: 'Add ANTHROPIC_API_KEY in Vercel environment variables to enable AI intelligence.',
      catalysts: [], risks: [],
    });
  }

  const { ticker, name, currentPrice, changePercent, high52w, low52w } = req.body ?? {};
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const prompt = `You are a quantitative equity analyst. Generate an intelligence summary for ${ticker} (${name ?? ticker}).
Price: $${currentPrice ?? 'N/A'} | Today: ${changePercent != null ? changePercent.toFixed(2) + '%' : 'N/A'} | 52w H/L: $${high52w ?? 'N/A'} / $${low52w ?? 'N/A'}

Respond ONLY with valid JSON — no markdown, no backticks, no explanation outside the JSON:
{
  "aiScore": <0-100>,
  "trend": "Strongly Bullish"|"Bullish"|"Neutral"|"Bearish"|"Strongly Bearish",
  "volatility": "Low"|"Medium"|"High"|"Very High",
  "hedgeFundActivity": "Increasing"|"Stable"|"Decreasing",
  "analystConsensus": "Strong Buy"|"Buy"|"Hold"|"Sell"|"Strong Sell",
  "targetPrice": <number>,
  "buyRating": <0-100>,
  "holdRating": <0-100>,
  "sellRating": <0-100>,
  "keyInsight": "<1-2 sentences about the stock right now>",
  "catalysts": ["<catalyst 1>", "<catalyst 2>"],
  "risks": ["<risk 1>", "<risk 2>"]
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await r.json();
    const text = data.content?.[0]?.text ?? '';
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      // Normalise ratings to sum to 100
      const total = (parsed.buyRating ?? 33) + (parsed.holdRating ?? 34) + (parsed.sellRating ?? 33);
      if (total > 0) {
        parsed.buyRating  = Math.round((parsed.buyRating  ?? 33) / total * 100);
        parsed.sellRating = Math.round((parsed.sellRating ?? 33) / total * 100);
        parsed.holdRating = 100 - parsed.buyRating - parsed.sellRating;
      }
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({ aiScore: 50, trend: 'Neutral', volatility: 'Medium', hedgeFundActivity: 'Stable', analystConsensus: 'Hold', targetPrice: currentPrice, buyRating: 34, holdRating: 33, sellRating: 33, keyInsight: text.slice(0, 200), catalysts: [], risks: [] });
    }
  } catch (err) {
    console.error('intelligence error:', err.message);
    return res.status(200).json({ aiScore: 50, trend: 'Neutral', volatility: 'Medium', hedgeFundActivity: 'Stable', analystConsensus: 'Hold', targetPrice: null, buyRating: 34, holdRating: 33, sellRating: 33, keyInsight: 'Could not reach AI service.', catalysts: [], risks: [] });
  }
}
