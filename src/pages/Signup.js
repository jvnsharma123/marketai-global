import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';

const countries = ['India','United States','United Kingdom','Canada','Australia','Singapore','UAE','Germany','France','Brazil','South Africa','Nigeria','Philippines','Indonesia','Other'];

export default function Signup() {
  const [form, setForm] = useState({ email:'', password:'', businessName:'', businessType:'', country:'India' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        business_name: form.businessName,
        business_type: form.businessType,
        country: form.country,
        language: 'English',
        tone: 'Professional',
        plan: 'free',
        generations_used: 0,
      });
    }
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 460 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Create your account</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Start generating marketing content for free</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSignup}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Business name</label>
                <input className="form-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Acme Store" required />
              </div>
              <div className="form-group">
                <label className="form-label">Business type</label>
                <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="Retail, SaaS, Restaurant..." required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" minLength={6} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" />  Creating account...</> : 'Create free account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Log in</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: '#94a3b8' }}>
            Free plan: 5 generations/month · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
