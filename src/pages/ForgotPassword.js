import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setSent(true); setLoading(false); }
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Check your email</h1>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                We sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                className="btn btn-secondary btn-full"
                style={{ marginBottom: '0.8rem' }}
              >
                Try again
              </button>
              <Link to="/login" className="btn btn-ghost btn-full">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Reset your password</h1>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleReset}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                  style={{ marginTop: '0.5rem' }}
                >
                  {loading ? <><span className="spinner" />  Sending...</> : 'Send reset link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#64748b' }}>
                Remember your password? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
