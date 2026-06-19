export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessName, businessType, offer, audience, country, language, tone } = req.body;
  if (!offer || !audience) return res.status(400).json({ error: 'Offer and audience are required' });

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  const textPrompt = `You are an expert digital marketing copywriter for businesses worldwide.

Business Name: ${businessName || 'Our Business'}
Business Type: ${businessType || 'Business'}
Product/Offer: ${offer}
Target Audience: ${audience}
Country/Market: ${country || 'Global'}
Language: ${language || 'English'}
Tone: ${tone || 'Professional'}

Generate marketing content in ${language || 'English'} in this EXACT format:

SOCIAL MEDIA POST:
[2-3 line engaging post for LinkedIn/Instagram/Facebook with 3 relevant hashtags]

WHATSAPP MESSAGE:
[Short conversational broadcast message under 100 words]

AD COPY:
Headline: [max 30 characters]
Description: [max 90 characters]
CTA: [max 15 characters]

EMAIL CAMPAIGN:
Subject: [compelling subject line]
Body: [3 short paragraphs: hook, value proposition, call to action. Under 150 words.]`;

  const imagePrompt = `Create a professional social media marketing image for a ${businessType || 'business'} promoting: ${offer}. Target audience: ${audience}. Country: ${country || 'Global'}. Style: ${tone || 'Professional'}, modern, eye-catching, suitable for Instagram and Facebook. Include relevant visual elements but NO text overlays. Clean background, vibrant colors, high quality.`;

  try {
    // Generate text and image in parallel
    const [textResponse, imageResponse] = await Promise.allSettled([
      // Text generation
      fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: textPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
        })
      }),
      // Image generation
      fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      })
    ]);

    // Parse text response
    let textResult = {};
    if (textResponse.status === 'fulfilled' && textResponse.value.ok) {
      const textData = await textResponse.value.json();
      const text = textData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const extract = (start, end) => {
        const startIdx = text.indexOf(start);
        if (startIdx === -1) return '';
        const from = startIdx + start.length;
        const endIdx = end ? text.indexOf(end, from) : text.length;
        return text.slice(from, endIdx === -1 ? text.length : endIdx).trim();
      };
      textResult = {
        social_post: extract('SOCIAL MEDIA POST:\n', 'WHATSAPP MESSAGE:'),
        whatsapp_message: extract('WHATSAPP MESSAGE:\n', 'AD COPY:'),
        ad_copy: extract('AD COPY:\n', 'EMAIL CAMPAIGN:'),
        email_campaign: extract('EMAIL CAMPAIGN:\n', null),
      };
    } else {
      return res.status(500).json({ error: 'Text generation failed' });
    }

    // Parse image response
    let imageBase64 = null;
    let imageMimeType = 'image/png';
    if (imageResponse.status === 'fulfilled' && imageResponse.value.ok) {
      const imageData = await imageResponse.value.json();
      const parts = imageData.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          imageMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }
    // Image generation failure is non-fatal — we still return text

    return res.status(200).json({
      ...textResult,
      image: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : null,
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
