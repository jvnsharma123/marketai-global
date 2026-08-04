// Brand Voice Learner — analyzes user's existing content and extracts voice profile
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { samples } = req.body; // Array of 3-5 existing posts
  if (!samples || samples.length < 1) return res.status(400).json({ error: 'At least 1 sample post required' });

  const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  const prompt = `You are a brand voice analyst. Analyze these social media posts and extract the brand's unique voice profile.

POSTS TO ANALYZE:
${samples.map((s, i) => `Post ${i + 1}: "${s}"`).join('\n')}

Return ONLY valid JSON:
{
  "voice_summary": "2-sentence description of this brand's unique voice",
  "tone_keywords": ["word1", "word2", "word3", "word4", "word5"],
  "writing_style": "formal|conversational|energetic|professional|humorous|inspirational",
  "emoji_usage": "none|minimal|moderate|heavy",
  "sentence_length": "short|medium|long|mixed",
  "unique_phrases": ["any recurring phrases or patterns"],
  "what_to_avoid": "what this brand never says or does",
  "example_opening": "example of how this brand would start a post"
}`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512, responseMimeType: 'application/json' }
      })
    });
    if (!r.ok) throw new Error(`Gemini error: ${r.status}`);
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const profile = JSON.parse(text);
    return res.status(200).json({ profile, voice_summary: profile.voice_summary });
  } catch (err) {
    console.error('Brand voice error:', err);
    return res.status(500).json({ error: 'Failed to analyze brand voice', message: err.message });
  }
}
