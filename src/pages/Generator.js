import React, { useState, useEffect } from 'react';
import { supabase, generateMarketingContent } from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Spanish','French','German','Arabic','Mandarin','Portuguese','Indonesian','Swahili','Japanese','Korean'];
const TONES = ['Professional','Friendly','Urgent','Playful','Inspirational','Luxury','Minimal'];
const TABS = [
  { key: 'social_post',       label: '📱 Social Media' },
  { key: 'whatsapp_message',  label: '💬 WhatsApp' },
  { key: 'ad_copy',           label: '🎯 Ad Copy' },
  { key: 'email_campaign',    label: '📧 Email' },
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
          setForm(f => ({
            ...f,
            businessName: data.business_name || '',
            businessType: data.business_type || '',
            country: data.country || '',
            language: data.language || 'English',
            tone: data.tone || 'Professional',
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
    if (!canGenerate) { setError('You have reached your plan limit. Please upgrade to continue.'); return; }
    setLoading(true); setError(''); setResult(null); setSaved(false);
    try {
      const content = await generateMarketingContent(form);
      setResult(content);
      setActiveTab('social_post');
      // increment usage count
      await supabase.from('profiles').update({ generations_used: used + 1 }).eq('id', session.user.id);
      setProfile(p => ({ ...p, generations_used: used + 1 }));
    } catch (err) {
      setError('Generation failed. Please check your API key and try again.');
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>✦ Generate Content</h1>
            <p>Fill in your business details and get all marketing content in one click</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* ── Left: Input form ── */}
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '1.2rem', fontSize: '1.05rem' }}>Your business details</h2>

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
                  <label className="form-label">Country / Market</label>
                  <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. India, USA" />
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

              {/* Usage indicator */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>
                  <span>Monthly usage</span>
                  <span>{used} / {planLimit === -1 ? '∞' : planLimit}</span>
                </div>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${planLimit === -1 ? 5 : Math.min((used/planLimit)*100,100)}%` }} />
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleGenerate}
                disabled={loading || !canGenerate}
                style={{ fontSize: '1rem', padding: '0.75rem' }}
              >
                {loading
                  ? <><span className="spinner" />  Generating...</>
                  : canGenerate
                    ? '✦ Generate all content'
                    : '⚠ Plan limit reached — upgrade'}
              </button>
            </div>

            {/* ── Right: Output ── */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Generated content</h2>
                {result && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saved}>
                      {saved ? '✓ Saved' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              {result && (
                <div className="tabs">
                  {TABS.map(t => (
                    <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Output content */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, color: '#64748b' }}>
                  <div className="spinner" style={{ width: 36, height: 36 }} />
                  <p>Generating your marketing content...</p>
                </div>
              ) : result ? (
                <div className="output-box" style={{ minHeight: 300 }}>
                  {result[activeTab] || 'No content for this channel.'}
                </div>
              ) : (
                <div className="empty-state" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="icon">✦</div>
                  <p style={{ fontWeight: 600, color: '#64748b' }}>Fill in your details and click Generate</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>All 4 channels generated in one click</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
