export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessName, businessType, offer, audience, country, language, tone, slideCount = 5 } = req.body;
  if (!offer || !audience) return res.status(400).json({ error: 'Offer and audience are required' });

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY;

  // Step 1 — Ask Gemini to plan out the carousel slide-by-slide
  const planPrompt = `You are an expert social media carousel designer for Instagram/LinkedIn.

Business Name: ${businessName || 'Our Business'}
Business Type: ${businessType || 'Business'}
Product/Offer: ${offer}
Target Audience: ${audience}
Country/Market: ${country || 'Global'}
Language: ${language || 'English'}
Tone: ${tone || 'Professional'}

Plan a ${slideCount}-slide carousel post. Structure:
- Slide 1: Hook/title slide (grabs attention)
- Middle slides: Key points, benefits, or steps (one idea per slide)
- Last slide: Call to action

Return ONLY valid JSON in this exact structure, no markdown, no explanation:
{
  "slides": [
    { "headline": "short punchy headline (max 8 words)", "subtext": "one supporting line (max 15 words)", "visual_idea": "brief description of what image should show (max 20 words, no text in image)" }
  ]
}

Generate exactly ${slideCount} slides in the array.`;

  try {
    const planResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: planPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      })
    });

    if (!planResponse.ok) {
      const err = await planResponse.text();
      console.error('Carousel plan failed:', err);
      return res.status(500).json({ error: 'Failed to plan carousel' });
    }

    const planData = await planResponse.json();
    const planText = planData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let slides;
    try {
      const parsed = JSON.parse(planText);
      slides = parsed.slides || [];
    } catch (e) {
      console.error('Failed to parse carousel plan JSON:', planText.slice(0, 300));
      return res.status(500).json({ error: 'Failed to parse carousel plan' });
    }

    if (!slides.length) return res.status(500).json({ error: 'No slides generated' });

    // Step 2 — Generate an image for each slide in parallel
    const imagePromises = slides.map(slide => {
      const prompt = `${slide.visual_idea}, professional marketing style for ${businessType || 'business'}, clean modern design, vibrant colors, no text, no watermark, square format`;
      const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1080&height=1080&model=flux&nologo=true&key=${POLLINATIONS_KEY}`;
      return fetch(url);
    });

    const imageResponses = await Promise.allSettled(imagePromises);

    const finalSlides = await Promise.all(slides.map(async (slide, i) => {
      const imgResp = imageResponses[i];
      let imageDataUrl = null;
      if (imgResp.status === 'fulfilled' && imgResp.value.ok) {
        const buffer = await imgResp.value.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = imgResp.value.headers.get('content-type') || 'image/jpeg';
        imageDataUrl = `data:${contentType};base64,${base64}`;
      } else {
        console.error(`Slide ${i + 1} image failed:`, imgResp.status === 'fulfilled' ? imgResp.value.status : imgResp.reason);
      }
      return {
        slideNumber: i + 1,
        headline: slide.headline || '',
        subtext: slide.subtext || '',
        image: imageDataUrl,
      };
    }));

    return res.status(200).json({ slides: finalSlides });

  } catch (err) {
    console.error('Carousel server error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
