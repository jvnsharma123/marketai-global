import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';

const countries = ['India','United States','United Kingdom','Canada','Australia','Singapore','UAE','Germany','France','Brazil','South Africa','Nigeria','Philippines','Indonesia','Other'];

export default function Signup() {
  const [form, setForm] = useState({ email:'', password:'', businessName:'', businessType:'', country:'India' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGoogleSignup = async () => {
    setGoogleLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

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

          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1.2rem', color: '#1e293b' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleSignup}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Business name</label>
                <input className="form-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Acme Store" required />
              </div>
              <div className="form-group">
                <label className="form-label">Business type</label>
                <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="Retail, SaaS..." required />
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
