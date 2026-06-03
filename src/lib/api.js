import { createClient } from '@supabase/supabase-js';

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Gemini API ─────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function generateMarketingContent({ businessName, businessType, offer, audience, country, language, tone }) {
  const prompt = `You are an expert digital marketing copywriter for businesses worldwide.

Business Name: ${businessName}
Business Type: ${businessType}
Product/Offer: ${offer}
Target Audience: ${audience}
Country/Market: ${country}
Language: ${language}
Tone: ${tone}

Generate marketing content in ${language} in this EXACT format with these EXACT headers:

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

Make all content culturally relevant to ${country} and suitable for ${businessType} businesses.`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
    })
  });

  if (!response.ok) throw new Error('Failed to generate content');
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseGeneratedContent(text);
}

function parseGeneratedContent(text) {
  const extract = (start, end) => {
    const startIdx = text.indexOf(start);
    if (startIdx === -1) return '';
    const from = startIdx + start.length;
    const endIdx = end ? text.indexOf(end, from) : text.length;
    return text.slice(from, endIdx === -1 ? text.length : endIdx).trim();
  };
  return {
    social_post: extract('SOCIAL MEDIA POST:\n', 'WHATSAPP MESSAGE:'),
    whatsapp_message: extract('WHATSAPP MESSAGE:\n', 'AD COPY:'),
    ad_copy: extract('AD COPY:\n', 'EMAIL CAMPAIGN:'),
    email_campaign: extract('EMAIL CAMPAIGN:\n', null),
    raw: text
  };
}
