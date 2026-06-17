import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [recentCount, setRecentCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const uid = session.user.id;
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single();
      setProfile(prof);
      const { count: total } = await supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', uid);
      const { count: saved } = await supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('is_saved', true);
      setRecentCount(total || 0);
      setSavedCount(saved || 0);
    };
    load();
  }, [session]);

  const planLimit = profile?.plan === 'pro' ? -1 : profile?.plan === 'starter' ? 100 : 5;
  const used = profile?.generations_used || 0;
  const usagePct = planLimit === -1 ? 10 : Math.min((used / planLimit) * 100, 100);

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>Welcome back{profile?.business_name ? `, ${profile.business_name}` : ''} 👋</h1>
            <p>Here's your marketing overview</p>
          </div>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
            {[
              { label: 'Generated', value: recentCount, icon: '✦' },
              { label: 'Saved', value: savedCount, icon: '◈' },
              { label: 'Plan', value: profile ? (profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)) : '—', icon: '◷' },
              { label: 'Remaining', value: planLimit === -1 ? '∞' : Math.max(0, planLimit - used), icon: '⊞' },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem' }}>
                <div style={{ width: 34, height: 34, background: '#eef2ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#6366f1', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>Monthly usage</strong>
                <span className={`badge badge-${profile?.plan || 'free'}`} style={{ marginLeft: 8 }}>{profile?.plan || 'free'}</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{used} / {planLimit === -1 ? '∞' : planLimit}</span>
            </div>
            <div className="usage-bar"><div className="usage-fill" style={{ width: `${usagePct}%` }} /></div>
            {profile?.plan === 'free' && used >= 4 && (
              <div className="alert alert-info" style={{ marginTop: '1rem', marginBottom: 0 }}>
                Almost out! <Link to="/pricing" style={{ fontWeight: 700 }}>Upgrade now →</Link>
              </div>
            )}
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none' }}>
            <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Ready to create content?</h2>
            <p style={{ opacity: 0.85, marginBottom: '1rem', fontSize: '0.9rem' }}>Generate social posts, WhatsApp messages, ads and emails in one click.</p>
            <Link to="/generate" className="btn" style={{ background: '#fff', color: '#6366f1', fontSize: '0.9rem' }}>✦ Generate now</Link>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
