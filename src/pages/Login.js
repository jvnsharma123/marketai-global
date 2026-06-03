import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/dashboard');
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Welcome back</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Log in to your MarketAI account</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" />  Logging in...</> : 'Log in'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#64748b' }}>
            Don't have an account? <Link to="/signup" style={{ color: '#6366f1', fontWeight: 600 }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
