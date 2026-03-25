export default async function handler(req, res) {
  // CORS — only allow your GitHub Pages domain
  res.setHeader('Access-Control-Allow-Origin', 'https://kevin-1688.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { income, expense, invest, level, xp, lang } = req.body;

    if (!income || !expense) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Input sanitization — prevent prompt injection
    const safe = (v) => String(v).replace(/[^0-9,.\s]/g, '').slice(0, 20);

    const prompt = lang === 'zh'
      ? `你是一個遊戲化財務教練。用戶本月收入 NT$${safe(income)}，支出 NT$${safe(expense)}，投資收益 NT$${safe(invest || 0)}。角色等級 LV.${Number(level) || 1}，累積 ${Number(xp) || 0} XP。請用像素 RPG 遊戲的語言（100字內），給出3點具體財務建議，每點用「▶」開頭，語氣要像遊戲裡的導師。`
      : `You are a gamified finance coach. Monthly income: NT$${safe(income)}, expense: NT$${safe(expense)}, investment: NT$${safe(invest || 0)}. Avatar LV.${Number(level) || 1}, ${Number(xp) || 0} XP. In pixel RPG style (under 100 words), give 3 finance tips each starting with "▶", like an in-game mentor.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ report: text });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
