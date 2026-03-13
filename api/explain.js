// api/explain.js — POST /api/explain
// Body: { ticker, date, price, type }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(200).json({ explanation: 'Configure ANTHROPIC_API_KEY in Vercel environment variables to enable AI explanations.' });

  const { ticker, date, price, type } = req.body ?? {};
  if (!ticker || !date || !type) return res.status(400).json({ error: 'Missing fields' });

  const direction = type === 'peak'
    ? `reach a significant high near $${parseFloat(price).toFixed(2)}`
    : `fall to a significant low near $${parseFloat(price).toFixed(2)}`;

  const prompt = `In 2-3 concise sentences, explain why ${ticker} stock likely ${direction} around ${date}. Cite the specific real-world catalyst — earnings, product launches, macro events, regulatory changes, or market conditions. Be factual and specific.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await r.json();
    return res.status(200).json({ explanation: data.content?.[0]?.text ?? 'No explanation returned.' });
  } catch (err) {
    console.error('explain error:', err.message);
    return res.status(200).json({ explanation: 'Could not retrieve explanation at this time.' });
  }
}
