import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function generateMarketingContent(params) {
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

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Spanish','French','German','Arabic','Mandarin','Portuguese','Indonesian','Swahili','Japanese','Korean'];
const TONES = ['Professional','Friendly','Urgent','Playful','Inspirational','Luxury','Minimal'];
const TABS = [
  { key: 'social_post', label: '📱 Social' },
  { key: 'whatsapp_message', label: '💬 WhatsApp' },
  { key: 'ad_copy', label: '🎯 Ads' },
  { key: 'email_campaign', label: '📧 Email' },
];

export default function Generator({ session }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ businessName:'', businessType:'', offer:'', audience:'', country:'', language:'English', tone:'Professional' });
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('social_post');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm(f => ({ ...f,
            businessName: data.business_name || '',
            businessType: data.business_type || '',
            country: data.country || '',
            language: data.language || 'English',
            tone: data.tone || 'Professional'
          }));
        }
      });
  }, [session]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const planLimit = profile?.plan === 'pro' ? -1 : profile?.plan === 'starter' ? 100 : 5;
  const used = profile?.generations_used || 0;
  const canGenerate = planLimit === -1 || used < planLimit;

  const handleGenerate = async () => {
    if (!form.offer || !form.audience) { setError('Please fill in Product/Offer and Target Audience.'); return; }
    if (!canGenerate) { setError('Plan limit reached. Please upgrade.'); return; }
    setLoading(true); setError(''); setResult(null); setSaved(false);
    try {
      const content = await generateMarketingContent(form);
      setResult(content);
      setActiveTab('social_post');
      await supabase.from('profiles').update({ generations_used: used + 1 }).eq('id', session.user.id);
      setProfile(p => ({ ...p, generations_used: used + 1 }));
    } catch (err) {
      setError('Generation failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!result) return;
    await supabase.from('generated_content').insert({
      user_id: session.user.id,
      business_name: form.businessName,
      offer: form.offer,
      target_audience: form.audience,
      country: form.country,
      language: form.language,
      social_post: result.social_post,
      whatsapp_message: result.whatsapp_message,
      ad_copy: result.ad_copy,
      email_campaign: result.email_campaign,
      is_saved: true,
    });
    setSaved(true);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result[activeTab] || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!result?.image) return;
    const link = document.createElement('a');
    link.href = result.image;
    link.download = `marketai-${form.businessName || 'post'}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>✦ Generate Content</h1>
            <p>AI generates text content + a social media image in one click</p>
          </div>

          <div className="generator-grid">
            {/* ── Input form ── */}
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Your business details</h2>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Business name</label>
                <input className="form-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Sharma Electronics" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Business type</label>
                  <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="e.g. Retail" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. India" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Product / Offer <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="form-input" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. 30% off on all ACs this summer" required />
              </div>
              <div className="form-group">
                <label className="form-label">Target audience <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="form-textarea" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. Homeowners aged 25-45" rows={2} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={form.language} onChange={e => set('language', e.target.value)}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select className="form-select" value={form.tone} onChange={e => set('tone', e.target.value)}>
                    {TONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>
                  <span>Monthly usage</span>
                  <span>{used} / {planLimit === -1 ? '∞' : planLimit}</span>
                </div>
                <div className="usage-bar"><div className="usage-fill" style={{ width: `${planLimit === -1 ? 5 : Math.min((used/planLimit)*100,100)}%` }} /></div>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={loading || !canGenerate} style={{ fontSize: '0.95rem', padding: '0.75rem' }}>
                {loading
                  ? <><span className="spinner" />  Generating text + image...</>
                  : canGenerate
                    ? '✦ Generate content + image'
                    : '⚠ Limit reached — upgrade'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
                Generates social post, WhatsApp, ad copy, email + AI image
              </p>
            </div>

            {/* ── Output ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* AI Image */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>🖼 AI Generated Image</h2>
                  {result?.image && (
                    <button className="btn btn-primary btn-sm" onClick={handleDownloadImage}>
                      ↓ Download
                    </button>
                  )}
                </div>
                {loading ? (
                  <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f8fafc', borderRadius: 10, color: '#64748b' }}>
                    <div className="spinner" style={{ width: 28, height: 28 }} />
                    <p style={{ fontSize: '0.85rem' }}>Generating image...</p>
                  </div>
                ) : result?.image ? (
                  <img
                    src={result.image}
                    alt="AI generated marketing visual"
                    style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 280, objectFit: 'cover' }}
                  />
                ) : result && !result.image ? (
                  <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 10 }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Image generation unavailable — text content generated successfully</p>
                  </div>
                ) : (
                  <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 10, gap: 8 }}>
                    <span style={{ fontSize: '2rem' }}>🖼</span>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>AI image will appear here after generation</p>
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📝 Marketing Copy</h2>
                  {result && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={handleCopy}>{copied ? '✓' : 'Copy'}</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saved}>{saved ? '✓ Saved' : 'Save'}</button>
                    </div>
                  )}
                </div>
                {result && (
                  <div className="tabs">
                    {TABS.map(t => (
                      <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                    ))}
                  </div>
                )}
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 150, gap: 12, color: '#64748b' }}>
                    <div className="spinner" style={{ width: 28, height: 28 }} />
                    <p style={{ fontSize: '0.85rem' }}>Writing your copy...</p>
                  </div>
                ) : result ? (
                  <div className="output-box" style={{ minHeight: 150 }}>{result[activeTab] || 'No content for this channel.'}</div>
                ) : (
                  <div style={{ minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.5rem' }}>✦</span>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Marketing copy will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
