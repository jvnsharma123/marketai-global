import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Spanish','French','German','Arabic','Mandarin','Portuguese','Indonesian','Swahili','Japanese','Korean'];
const TONES = ['Professional','Friendly','Urgent','Playful','Inspirational','Luxury','Minimal'];
const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Singapore','UAE','Germany','France','Brazil','South Africa','Nigeria','Philippines','Indonesia','Global'];
const TABS = [
  { key: 'social_post', label: '📱 Social' },
  { key: 'whatsapp_message', label: '💬 WhatsApp' },
  { key: 'ad_copy', label: '🎯 Ads' },
  { key: 'email_campaign', label: '📧 Email' },
];

export default function Generator({ session }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ businessName:'', businessType:'', offer:'', audience:'', country:'India', language:'English', tone:'Professional' });
  const [mode, setMode] = useState('single');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('social_post');
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showBrandVoice, setShowBrandVoice] = useState(false);
  const [brandSamples, setBrandSamples] = useState(['', '', '']);
  const [brandVoice, setBrandVoice] = useState('');
  const [analyzingVoice, setAnalyzingVoice] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm(f => ({ ...f, businessName: data.business_name || '', businessType: data.business_type || '', country: data.country || 'India', language: data.language || 'English', tone: data.tone || 'Professional' }));
          if (data.brand_voice) setBrandVoice(data.brand_voice);
        }
      });
  }, [session]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const planLimit = profile?.plan === 'pro' ? -1 : profile?.plan === 'starter' ? 100 : 5;
  const used = profile?.generations_used || 0;
  const canGenerate = planLimit === -1 || used < planLimit;

  const handleAnalyzeBrandVoice = async () => {
    const valid = brandSamples.filter(s => s.trim().length > 0);
    if (valid.length === 0) { setError('Please enter at least one sample post.'); return; }
    setAnalyzingVoice(true);
    try {
      const res = await fetch('/api/brand-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: valid })
      });
      const data = await res.json();
      if (data.profile) {
        const voiceText = `${data.profile.voice_summary} Style: ${data.profile.writing_style}. Tone: ${data.profile.tone_keywords?.join(', ')}. Avoid: ${data.profile.what_to_avoid}`;
        setBrandVoice(voiceText);
        await supabase.from('profiles').update({ brand_voice: voiceText }).eq('id', session.user.id);
        setShowBrandVoice(false);
      }
    } catch (err) { setError('Failed to analyze brand voice. Try again.'); }
    setAnalyzingVoice(false);
  };

  const handleGenerate = async () => {
    if (!form.offer || !form.audience) { setError('Please fill in Product/Offer and Target Audience.'); return; }
    if (!canGenerate) { setError('Plan limit reached. Please upgrade.'); return; }
    setLoading(true); setError(''); setResult(null); setSaved(false);

    const steps = mode === 'single'
      ? ['🔍 Researching your business context...', '✍️ Crafting your marketing content...', '🎨 Generating marketing image...', '✅ Quality checking...']
      : ['🔍 Researching your business context...', '📅 Planning 7-day content strategy...', '🎨 Generating images for key days...', '✅ Finalizing your content calendar...'];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setLoadingStep(steps[stepIdx]);
    }, 4000);

    try {
      const res = await fetch('/api/agent-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mode, brandVoice })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setResult(data);
      setActiveTab('social_post');
      setActiveDay(0);
      await supabase.from('profiles').update({ generations_used: used + 1 }).eq('id', session.user.id);
      setProfile(p => ({ ...p, generations_used: used + 1 }));
      if (mode === 'single') {
        await supabase.from('generated_content').insert({
          user_id: session.user.id, business_name: form.businessName, offer: form.offer,
          target_audience: form.audience, country: form.country, language: form.language,
          social_post: data.social_post, whatsapp_message: data.whatsapp_message,
          ad_copy: data.ad_copy, email_campaign: data.email_campaign, is_saved: false,
        });
      }
    } catch (err) { setError('Generation failed. Please try again.'); }
    clearInterval(stepTimer);
    setLoading(false); setLoadingStep('');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!result || mode !== 'single') return;
    await supabase.from('generated_content').insert({
      user_id: session.user.id, business_name: form.businessName, offer: form.offer,
      target_audience: form.audience, country: form.country, language: form.language,
      social_post: result.social_post, whatsapp_message: result.whatsapp_message,
      ad_copy: result.ad_copy, email_campaign: result.email_campaign, is_saved: true,
    });
    setSaved(true);
  };

  const currentDay = result?.days?.[activeDay];

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>✦ AI Marketing Agent</h1>
            <p>Intelligent multi-step AI that researches, creates, scores and delivers the best content</p>
          </div>

          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { key: 'single', icon: '⚡', label: 'Single Generation', desc: 'All 4 channels + image' },
              { key: 'week', icon: '📅', label: '7-Day Content Plan', desc: 'Full week planned by AI' },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                flex: 1, minWidth: 160, padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer',
                border: mode === m.key ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                background: mode === m.key ? '#eef2ff' : '#fff', textAlign: 'left'
              }}>
                <div style={{ fontWeight: 700, color: mode === m.key ? '#6366f1' : '#1e293b', fontSize: '0.92rem' }}>{m.icon} {m.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="generator-grid">
            {/* Input form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Business details</h2>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Business name</label>
                  <input className="form-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Sharma Electronics" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Business type</label>
                    <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="e.g. Electronics retail" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Product / Offer <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. 30% off on all ACs this summer" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Target audience <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-textarea" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. Homeowners aged 25-45 looking to beat the summer heat" rows={2} />
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
                <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={loading || !canGenerate} style={{ fontSize: '0.95rem', padding: '0.8rem' }}>
                  {loading ? <><span className="spinner" />  {loadingStep || 'Working...'}</> : canGenerate ? `✦ ${mode === 'week' ? 'Generate 7-Day Plan' : 'Generate Content + Image'}` : '⚠ Limit reached — upgrade'}
                </button>
                {!canGenerate && <Link to="/pricing" className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>Upgrade plan →</Link>}
              </div>

              {/* Brand Voice card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>🎤 Brand Voice</strong>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>AI learns your unique style</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowBrandVoice(!showBrandVoice)}>
                    {brandVoice ? '✓ Learned' : 'Set up'}
                  </button>
                </div>
                {brandVoice && (
                  <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem', color: '#475569' }}>
                    {brandVoice.slice(0, 120)}...
                  </div>
                )}
                {showBrandVoice && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.7rem' }}>Paste 1-3 of your existing posts so AI can learn your voice:</p>
                    {brandSamples.map((s, i) => (
                      <textarea key={i} className="form-textarea" value={s} onChange={e => { const ns = [...brandSamples]; ns[i] = e.target.value; setBrandSamples(ns); }} placeholder={`Sample post ${i + 1}...`} rows={2} style={{ marginBottom: 8 }} />
                    ))}
                    <button className="btn btn-primary btn-full btn-sm" onClick={handleAnalyzeBrandVoice} disabled={analyzingVoice}>
                      {analyzingVoice ? <><span className="spinner" />  Analyzing...</> : '🎤 Analyze my brand voice'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                  <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{loadingStep}</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Your AI agent is working step by step<br/>to create the best possible content</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['Research', 'Create', 'Score', 'Deliver'].map((s, i) => (
                      <div key={s} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: i <= Math.floor((Date.now() / 4000) % 4) ? '#eef2ff' : '#f1f5f9', color: i <= Math.floor((Date.now() / 4000) % 4) ? '#6366f1' : '#94a3b8' }}>{s}</div>
                    ))}
                  </div>
                </div>
              ) : result ? (
                <>
                  {/* Research insight banner */}
                  {result.research && (
                    <div className="card" style={{ background: 'linear-gradient(135deg, #eef2ff, #f8fafc)', border: '1px solid #c7d2fe' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', marginBottom: 6 }}>🔍 AI Research Insight</div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>{result.research}</p>
                      {result.quality_score && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Quality score:</span>
                          <span style={{ fontWeight: 700, color: result.quality_score >= 8 ? '#16a34a' : result.quality_score >= 6 ? '#d97706' : '#dc2626', fontSize: '0.88rem' }}>
                            {result.quality_score}/10 {result.quality_score >= 8 ? '✓' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {mode === 'single' ? (
                    <>
                      {/* AI Image */}
                      {result.image && (
                        <div className="card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <strong style={{ fontSize: '0.92rem' }}>🖼 AI Marketing Image</strong>
                            <button className="btn btn-primary btn-sm" onClick={() => { const l = document.createElement('a'); l.href = result.image; l.download = 'marketai-image.jpg'; l.click(); }}>↓ Download</button>
                          </div>
                          <img src={result.image} alt="AI generated marketing" style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 260, objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Marketing copy */}
                      <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <strong style={{ fontSize: '0.92rem' }}>📝 Marketing Copy</strong>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(result[activeTab])}>{copied ? '✓' : 'Copy'}</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saved}>{saved ? '✓ Saved' : 'Save'}</button>
                          </div>
                        </div>
                        <div className="tabs">{TABS.map(t => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}</div>
                        <div className="output-box" style={{ minHeight: 140 }}>{result[activeTab] || 'No content.'}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Week theme */}
                      <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: 4 }}>📅 This week's theme</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{result.week_theme}</div>
                      </div>

                      {/* Day navigator */}
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                        {result.days?.map((d, i) => (
                          <button key={i} onClick={() => setActiveDay(i)} style={{
                            flexShrink: 0, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            border: activeDay === i ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                            background: activeDay === i ? '#eef2ff' : '#fff',
                            color: activeDay === i ? '#6366f1' : '#64748b',
                          }}>{d.day_name?.slice(0, 3) || `Day ${d.day}`}</button>
                        ))}
                      </div>

                      {/* Active day content */}
                      {currentDay && (
                        <div className="card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <strong style={{ fontSize: '0.95rem' }}>{currentDay.day_name} — {currentDay.content_type}</strong>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{currentDay.topic}</div>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(currentDay.social_post)}>Copy post</button>
                          </div>
                          {currentDay.image && (
                            <img src={currentDay.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: '0.8rem', maxHeight: 180, objectFit: 'cover' }} />
                          )}
                          <div style={{ marginBottom: '0.8rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>📱 Social post</div>
                            <div className="output-box" style={{ fontSize: '0.85rem' }}>{currentDay.social_post}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#25d366', marginBottom: 4 }}>💬 WhatsApp</div>
                            <div className="output-box" style={{ fontSize: '0.85rem' }}>{currentDay.whatsapp_message}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
                  <div style={{ fontSize: '2.5rem' }}>✦</div>
                  <p style={{ fontWeight: 600, color: '#64748b' }}>Your AI agent is ready</p>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', maxWidth: 280 }}>
                    Fill in your details and the agent will research, create, score and deliver the best content for your business
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                    {['🔍 Researches', '✍️ Creates', '⭐ Scores', '🎨 Images'].map(s => (
                      <span key={s} style={{ padding: '4px 10px', background: '#eef2ff', color: '#6366f1', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
