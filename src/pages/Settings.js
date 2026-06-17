import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Spanish','French','German','Arabic','Mandarin','Portuguese','Indonesian','Swahili','Japanese','Korean'];
const TONES = ['Professional','Friendly','Urgent','Playful','Inspirational','Luxury','Minimal'];
const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Singapore','UAE','Germany','France','Brazil','South Africa','Nigeria','Philippines','Indonesia','Other'];

export default function Settings({ session }) {
  const [form, setForm] = useState({ business_name:'', business_type:'', country:'India', language:'English', tone:'Professional' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) setForm({ business_name: data.business_name || '', business_type: data.business_type || '', country: data.country || 'India', language: data.language || 'English', tone: data.tone || 'Professional' });
        setLoading(false);
      });
  }, [session]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false);
    const { error } = await supabase.from('profiles').update(form).eq('id', session.user.id);
    if (error) setError('Failed to save. Please try again.');
    else setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) return (
    <div><Navbar session={session} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <div className="spinner" style={{ width:32, height:32 }} />
      </div>
    </div>
  );

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>⚙ Settings</h1>
            <p>Update your business profile and preferences</p>
          </div>
          <div className="card" style={{ maxWidth: 560 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Business profile</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">✓ Settings saved!</div>}
            <div className="form-group">
              <label className="form-label">Business name</label>
              <input className="form-input" value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Your business name" />
            </div>
            <div className="form-group">
              <label className="form-label">Business type</label>
              <input className="form-input" value={form.business_type} onChange={e => set('business_type', e.target.value)} placeholder="e.g. Retail, SaaS, Restaurant" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Default language</label>
                <select className="form-select" value={form.language} onChange={e => set('language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default tone</label>
                <select className="form-select" value={form.tone} onChange={e => set('tone', e.target.value)}>
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" />  Saving...</> : 'Save settings'}
            </button>
          </div>
          <div className="card" style={{ maxWidth: 560, marginTop: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Account</h2>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              <div style={{ marginBottom: 6 }}><strong style={{ color: '#1e293b' }}>Email:</strong> {session.user.email}</div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
