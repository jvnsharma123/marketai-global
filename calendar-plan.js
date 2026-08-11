// AI Content Calendar Planner — generates a 30-day content strategy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessName, businessType, offer, audience, country, language, tone, month, year } = req.body;
  if (!businessType || !offer) return res.status(400).json({ error: 'Business type and offer are required' });

  const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  const prompt = `You are a digital marketing strategist. Create a ${daysInMonth}-day content calendar for ${monthName} ${year}.

Business: ${businessName || 'Our Business'} | Type: ${businessType}
Offer: ${offer} | Audience: ${audience} | Country: ${country} | Tone: ${tone}

Rules:
- Mix content types: 40% Educational, 30% Promotional, 20% Engagement, 10% Behind the scenes
- Never repeat the same topic twice
- Make promotions feel natural, not pushy
- Include special days/festivals relevant to ${country} in ${monthName}
- Each post must feel fresh and different

Return ONLY valid JSON:
{
  "month_theme": "overarching marketing theme for the month",
  "monthly_goal": "what this month's content should achieve",
  "days": [
    {
      "day": 1,
      "date": "${year}-${String(month).padStart(2,'0')}-01",
      "content_type": "Educational|Promotional|Engagement|Behind the scenes|Festival|Story",
      "topic": "specific topic (max 8 words)",
      "caption": "ready-to-post social media caption with hashtags",
      "whatsapp": "WhatsApp broadcast message (under 60 words)",
      "best_time": "9 AM|12 PM|6 PM|8 PM",
      "platform_focus": "Instagram|LinkedIn|Facebook|All",
      "emoji": "one relevant emoji"
    }
  ]
}

Generate all ${daysInMonth} days. Make day numbers sequential from 1 to ${daysInMonth}.`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      })
    });
    if (!r.ok) { const e = await r.text(); return res.status(500).json({ error: 'AI failed', details: e.slice(0,200) }); }
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const plan = JSON.parse(text);
    return res.status(200).json(plan);
  } catch (err) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: 'Failed to generate calendar', message: err.message });
  }
}
