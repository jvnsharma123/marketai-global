// MarketAI Global — AI Agent Core (Phase 1)
// Multi-step intelligent agent: Research → Plan → Generate → Score → Deliver

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    businessName, businessType, offer, audience,
    country, language, tone, brandVoice,
    mode = 'single', // 'single' | 'week' | 'batch'
    slideCount = 5
  } = req.body;

  if (!offer || !audience) return res.status(400).json({ error: 'Offer and audience are required' });

  const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY;
  const MODEL = 'gemini-2.5-flash-lite';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  const gemini = async (prompt, json = false) => {
    const r = await fetch(`${BASE_URL}/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8, maxOutputTokens: 2048,
          ...(json ? { responseMimeType: 'application/json' } : {})
        }
      })
    });
    if (!r.ok) { const e = await r.text(); throw new Error(`Gemini error: ${e.slice(0,200)}`); }
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const pollinationsImage = async (prompt, seed) => {
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1080&height=1080&model=flux&nologo=true&seed=${seed}&key=${POLLINATIONS_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    const ct = r.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${b64}`;
  };

  const extract = (text, start, end) => {
    const si = text.indexOf(start);
    if (si === -1) return '';
    const from = si + start.length;
    const ei = end ? text.indexOf(end, from) : text.length;
    return text.slice(from, ei === -1 ? text.length : ei).trim();
  };

  try {
    // ── STEP 1: Business Intelligence Research ──────────────────────────────
    console.log('[Agent] Step 1: Researching business context...');
    const researchPrompt = `You are a marketing strategist. Research and analyze this business briefly.

Business: ${businessName || 'Unknown'} | Type: ${businessType} | Country: ${country}
Offer: ${offer} | Audience: ${audience} | Tone: ${tone}
${brandVoice ? `Brand voice examples: ${brandVoice}` : ''}

Provide a brief analysis (3-4 sentences max) covering:
1. Key selling points of this offer
2. What resonates most with this audience in ${country}
3. Best content angle to use
4. Cultural nuances for ${country} market

Keep it concise and actionable. Output plain text, no headers.`;

    const research = await gemini(researchPrompt);
    console.log('[Agent] Research complete.');

    // ── STEP 2: Generate content based on mode ──────────────────────────────
    let result = {};

    if (mode === 'single') {
      // Single generation with research context
      console.log('[Agent] Step 2: Generating single content set...');
      const contentPrompt = `You are an expert digital marketing copywriter.

RESEARCH INSIGHTS: ${research}

Business: ${businessName || 'Our Business'} | Type: ${businessType}
Offer: ${offer} | Audience: ${audience}
Country: ${country} | Language: ${language} | Tone: ${tone}
${brandVoice ? `Match this brand voice style: ${brandVoice}` : ''}

Generate marketing content in ${language} using these EXACT headers:

SOCIAL MEDIA POST:
[2-3 line post for LinkedIn/Instagram/Facebook with 3 hashtags. Use the research insights to make it resonate.]

WHATSAPP MESSAGE:
[Conversational broadcast under 100 words. Friendly, direct, culturally appropriate for ${country}.]

AD COPY:
Headline: [max 30 chars, punchy]
Description: [max 90 chars, benefit-focused]
CTA: [max 15 chars]

EMAIL CAMPAIGN:
Subject: [compelling subject line]
Body: [3 paragraphs: hook, value prop, CTA. Under 150 words. Match tone.]

QUALITY SCORE:
[Rate this content 1-10 and one sentence why]`;

      const content = await gemini(contentPrompt);

      // Parse content
      const social = extract(content, 'SOCIAL MEDIA POST:\n', 'WHATSAPP MESSAGE:');
      const whatsapp = extract(content, 'WHATSAPP MESSAGE:\n', 'AD COPY:');
      const ads = extract(content, 'AD COPY:\n', 'EMAIL CAMPAIGN:');
      const email = extract(content, 'EMAIL CAMPAIGN:\n', 'QUALITY SCORE:');
      const scoreRaw = extract(content, 'QUALITY SCORE:\n', null);
      const scoreMatch = scoreRaw.match(/(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 8;

      // Auto-regenerate if score < 7
      let finalSocial = social, finalWhatsapp = whatsapp, finalAds = ads, finalEmail = email;
      if (score < 7) {
        console.log(`[Agent] Score ${score} < 7, regenerating with higher quality...`);
        const retry = await gemini(contentPrompt.replace('temperature: 0.8', 'temperature: 0.9'));
        finalSocial = extract(retry, 'SOCIAL MEDIA POST:\n', 'WHATSAPP MESSAGE:') || social;
        finalWhatsapp = extract(retry, 'WHATSAPP MESSAGE:\n', 'AD COPY:') || whatsapp;
        finalAds = extract(retry, 'AD COPY:\n', 'EMAIL CAMPAIGN:') || ads;
        finalEmail = extract(retry, 'EMAIL CAMPAIGN:\n', 'QUALITY SCORE:') || email;
      }

      // Generate image in parallel
      console.log('[Agent] Step 3: Generating marketing image...');
      const imgPrompt = `professional marketing photo for ${businessType}, ${offer}, target audience ${audience}, ${country} market, ${tone} style, modern, vibrant, no text, no watermark`;
      const image = await pollinationsImage(imgPrompt, Math.floor(Math.random() * 999999));

      result = {
        mode: 'single',
        research,
        quality_score: score,
        social_post: finalSocial,
        whatsapp_message: finalWhatsapp,
        ad_copy: finalAds,
        email_campaign: finalEmail,
        image,
      };

    } else if (mode === 'week') {
      // Week batch — 7 days of content
      console.log('[Agent] Step 2: Planning 7-day content calendar...');
      const weekPlanPrompt = `You are a content strategist. Create a 7-day social media content plan.

RESEARCH: ${research}
Business: ${businessName} | Type: ${businessType} | Offer: ${offer}
Audience: ${audience} | Country: ${country} | Language: ${language} | Tone: ${tone}

Return ONLY valid JSON, no markdown:
{
  "week_theme": "overarching theme for the week",
  "days": [
    {
      "day": 1,
      "day_name": "Monday",
      "content_type": "Educational|Promotional|Engagement|Story|Behind the scenes",
      "topic": "specific topic for this day",
      "social_post": "complete post with hashtags",
      "whatsapp_message": "broadcast message under 80 words",
      "image_idea": "visual description for AI image (no text in image)"
    }
  ]
}

Generate all 7 days. Make each day feel fresh and different. Avoid repetition.`;

      const weekPlanRaw = await gemini(weekPlanPrompt, true);
      let weekPlan;
      try { weekPlan = JSON.parse(weekPlanRaw); }
      catch (e) { throw new Error('Failed to parse week plan'); }

      // Generate images for all 7 days in parallel (limit to 3 to save quota)
      console.log('[Agent] Step 3: Generating images for key days...');
      const imageDays = weekPlan.days.slice(0, 3);
      const imageResults = await Promise.allSettled(
        imageDays.map((d, i) => pollinationsImage(
          `${d.image_idea}, professional marketing, ${businessType}, ${tone} style, no text`,
          Math.floor(Math.random() * 999999) + i
        ))
      );

      weekPlan.days = weekPlan.days.map((d, i) => ({
        ...d,
        image: i < 3 && imageResults[i].status === 'fulfilled' ? imageResults[i].value : null
      }));

      result = {
        mode: 'week',
        research,
        week_theme: weekPlan.week_theme,
        days: weekPlan.days,
      };
    }

    console.log('[Agent] Generation complete.');
    return res.status(200).json(result);

  } catch (err) {
    console.error('[Agent] Error:', err.message);
    return res.status(500).json({ error: 'Agent failed', message: err.message });
  }
}
