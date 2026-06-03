import { createClient } from '@supabase/supabase-js';

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Generate via Vercel serverless function ────────────────────────────────
export async function generateMarketingContent(params) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Generation failed');
  }

  return response.json();
}
