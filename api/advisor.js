// api/advisor.js — POST /api/advisor
// Body: { portfolio: [{ticker, shares, buyPrice, currentPrice}] }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return res.status(200).json({
      overallRating: 'Balanced', riskLevel: 'Medium',
      summary: 'Add ANTHROPIC_API_KEY in Vercel environment variables to enable AI portfolio advice.',
      strengths: [], warnings: [],
      suggestions: ['Configure ANTHROPIC_API_KEY to receive personalised AI advice.'],
      sectorComment: '',
    });
  }

  const { portfolio } = req.body ?? {};
  if (!portfolio?.length) return res.status(400).json({ error: 'Portfolio empty' });

  const total = portfolio.reduce((s, p) => s + p.shares * (p.currentPrice ?? p.buyPrice), 0);
  const lines = portfolio.map(p => {
    const val = p.shares * (p.currentPrice ?? p.buyPrice);
    const pnl = (((p.currentPrice ?? p.buyPrice) - p.buyPrice) / p.buyPrice * 100).toFixed(1);
    return `${p.ticker}: ${((val / total) * 100).toFixed(1)}% allocation, P&L ${pnl}%`;
  });

  const prompt = `You are a professional portfolio analyst. Analyse this portfolio and respond ONLY with valid JSON (no markdown, no backticks).

Portfolio total: £${total.toFixed(0)}
${lines.join('\n')}

Respond with exactly this JSON:
{
  "overallRating": "Strong"|"Balanced"|"Risky"|"Weak",
  "riskLevel": "Low"|"Medium"|"High"|"Very High",
  "summary": "<2-sentence overall assessment>",
  "strengths": ["<strength 1>","<strength 2>"],
  "warnings": ["<warning 1>","<warning 2>"],
  "suggestions": ["<suggestion 1>","<suggestion 2>","<suggestion 3>"],
  "sectorComment": "<1 sentence about sector concentration>"
}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await r.json();
    const text = data.content?.[0]?.text ?? '';
    try {
      return res.status(200).json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      return res.status(200).json({ overallRating: 'Balanced', riskLevel: 'Medium', summary: text.slice(0, 200), strengths: [], warnings: [], suggestions: ['Diversify across sectors', 'Review position sizes', 'Consider hedging'], sectorComment: '' });
    }
  } catch (err) {
    console.error('advisor error:', err.message);
    return res.status(200).json({ overallRating: 'Balanced', riskLevel: 'Medium', summary: 'Could not reach AI service.', strengths: [], warnings: [], suggestions: [], sectorComment: '' });
  }
}
