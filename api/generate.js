export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessName, businessType, offer, audience, country, language, tone } = req.body;

  if (!offer || !audience) {
    return res.status(400).json({ error: 'Offer and audience are required' });
  }

  const prompt = `You are an expert digital marketing copywriter for businesses worldwide.

Business Name: ${businessName || 'Our Business'}
Business Type: ${businessType || 'Business'}
Product/Offer: ${offer}
Target Audience: ${audience}
Country/Market: ${country || 'Global'}
Language: ${language || 'English'}
Tone: ${tone || 'Professional'}

Generate marketing content in ${language || 'English'} in this EXACT format with these EXACT headers:

SOCIAL MEDIA POST:
[Write a 2-3 line engaging post for LinkedIn/Instagram/Facebook with 3 relevant hashtags]

WHATSAPP MESSAGE:
[Write a short conversational broadcast message under 100 words, friendly and direct]

AD COPY:
Headline: [max 30 characters, punchy]
Description: [max 90 characters, benefit-focused]
CTA: [max 15 characters]

EMAIL CAMPAIGN:
Subject: [compelling subject line]
Body: [Write 3 short paragraphs: hook, value proposition, call to action. Keep it under 150 words total.]

Make all content culturally relevant to ${country || 'the target market'} and suitable for ${businessType || 'this'} businesses.`;

  try {
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return res.status(500).json({ error: 'AI generation failed', details: errData });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the response
    const extract = (start, end) => {
      const startIdx = text.indexOf(start);
      if (startIdx === -1) return '';
      const from = startIdx + start.length;
      const endIdx = end ? text.indexOf(end, from) : text.length;
      return text.slice(from, endIdx === -1 ? text.length : endIdx).trim();
    };

    const result = {
      social_post: extract('SOCIAL MEDIA POST:\n', 'WHATSAPP MESSAGE:'),
      whatsapp_message: extract('WHATSAPP MESSAGE:\n', 'AD COPY:'),
      ad_copy: extract('AD COPY:\n', 'EMAIL CAMPAIGN:'),
      email_campaign: extract('EMAIL CAMPAIGN:\n', null),
      raw: text
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
