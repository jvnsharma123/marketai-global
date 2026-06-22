import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import CarouselSlide from '../components/CarouselSlide';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const SLIDE_COUNTS = [3, 5, 7, 10];

export default function Carousel({ session }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ businessName:'', businessType:'', offer:'', audience:'', country:'', language:'English', tone:'Professional', slideCount: 5 });
  const [slides, setSlides] = useState(null);
  const [renderedSlides, setRenderedSlides] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm(f => ({ ...f, businessName: data.business_name || '', businessType: data.business_type || '', country: data.country || '', language: data.language || 'English', tone: data.tone || 'Professional' }));
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
    setLoading(true); setError(''); setSlides(null); setRenderedSlides({}); setActiveSlide(0);
    try {
      const res = await fetch('/api/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSlides(data.slides);
      await supabase.from('profiles').update({ generations_used: used + 1 }).eq('id', session.user.id);
      setProfile(p => ({ ...p, generations_used: used + 1 }));
    } catch (err) {
      setError('Carousel generation failed. Please try again.');
    }
    setLoading(false);
  };

  const handleDownloadSlide = (dataUrl, slideNum) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${form.businessName || 'carousel'}-slide-${slideNum}.jpg`;
    link.click();
  };

  const handleDownloadAll = () => {
    Object.entries(renderedSlides).forEach(([idx, dataUrl], i) => {
      setTimeout(() => handleDownloadSlide(dataUrl, parseInt(idx) + 1), i * 300);
    });
  };

  const allRendered = slides && Object.keys(renderedSlides).length === slides.length;

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>🎞 Generate Carousel</h1>
            <p>Multi-slide carousel posts for Instagram & LinkedIn — text + images, AI-designed</p>
          </div>

          <div className="generator-grid">
            {/* Input form */}
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
                <input className="form-input" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. 5 tips to save on electricity bills" required />
              </div>
              <div className="form-group">
                <label className="form-label">Target audience <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="form-textarea" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. Homeowners aged 25-45" rows={2} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Number of slides</label>
                  <select className="form-select" value={form.slideCount} onChange={e => set('slideCount', parseInt(e.target.value))}>
                    {SLIDE_COUNTS.map(n => <option key={n} value={n}>{n} slides</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select className="form-select" value={form.tone} onChange={e => set('tone', e.target.value)}>
                    {['Professional','Friendly','Urgent','Playful','Inspirational','Luxury','Minimal'].map(t => <option key={t}>{t}</option>)}
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
                  ? <><span className="spinner" />  Designing carousel...</>
                  : canGenerate
                    ? `🎞 Generate ${form.slideCount}-slide carousel`
                    : '⚠ Limit reached — upgrade'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
                Takes ~20-30 seconds for {form.slideCount} slides
              </p>
            </div>

            {/* Output — carousel preview */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Carousel preview</h2>
                {allRendered && (
                  <button className="btn btn-primary btn-sm" onClick={handleDownloadAll}>↓ Download all</button>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#64748b' }}>
                  <div className="spinner" style={{ width: 32, height: 32 }} />
                  <p style={{ fontSize: '0.88rem' }}>Planning slides + generating images...</p>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>This takes longer than text-only generation</p>
                </div>
              ) : slides ? (
                <>
                  {/* Slide navigator */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 4 }}>
                    {slides.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        style={{
                          flexShrink: 0, width: 36, height: 36, borderRadius: 8,
                          border: activeSlide === i ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          background: activeSlide === i ? '#eef2ff' : '#fff',
                          color: activeSlide === i ? '#6366f1' : '#64748b',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active slide preview */}
                  <div style={{ position: 'relative', maxWidth: 380, margin: '0 auto' }}>
                    <CarouselSlide
                      slide={{ ...slides[activeSlide], total: slides.length }}
                      onRendered={(dataUrl) => setRenderedSlides(prev => ({ ...prev, [activeSlide]: dataUrl }))}
                    />
                    {renderedSlides[activeSlide] && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,255,255,0.95)' }}
                        onClick={() => handleDownloadSlide(renderedSlides[activeSlide], activeSlide + 1)}
                      >
                        ↓ Download
                      </button>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.82rem', color: '#64748b' }}>
                    Slide {activeSlide + 1} of {slides.length}
                  </div>

                  {/* Hidden renderers for other slides so download-all works */}
                  <div style={{ display: 'none' }}>
                    {slides.map((s, i) => i !== activeSlide && (
                      <CarouselSlide
                        key={i}
                        slide={{ ...s, total: slides.length }}
                        onRendered={(dataUrl) => setRenderedSlides(prev => ({ ...prev, [i]: dataUrl }))}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="icon">🎞</div>
                  <p style={{ fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Fill in your details and generate</p>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>AI designs each slide with image + text</p>
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
