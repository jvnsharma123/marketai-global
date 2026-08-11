import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const TYPE_COLORS = {
  'Educational':       { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Promotional':       { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  'Engagement':        { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Behind the scenes': { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  'Festival':          { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'Story':             { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ session }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ businessName:'', businessType:'', offer:'', audience:'', country:'India', tone:'Professional' });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [copied, setCopied] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm(f => ({ ...f,
            businessName: data.business_name || '',
            businessType: data.business_type || '',
            country: data.country || 'India',
            tone: data.tone || 'Professional',
          }));
        }
      });
  }, [session]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  const handleGenerate = async () => {
    if (!form.businessType || !form.offer) { setError('Please fill in Business Type and Offer.'); return; }
    setLoading(true); setError(''); setPlan(null); setSelectedDay(null);
    const steps = [
      '🔍 Researching your market and audience...',
      '📅 Planning content mix for 30 days...',
      '✍️ Writing captions and messages...',
      '🎯 Scheduling optimal posting times...',
      '✅ Finalizing your content calendar...',
    ];
    let si = 0;
    setLoadingStep(steps[0]);
    const t = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setLoadingStep(steps[si]); }, 5000);
    try {
      const r = await fetch('/api/calendar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, month: currentMonth, year: currentYear })
      });
      if (!r.ok) throw new Error('Failed');
      const data = await r.json();
      setPlan(data);
      await supabase.from('profiles').update({ generations_used: (profile?.generations_used || 0) + 1 }).eq('id', session.user.id);
    } catch (err) { setError('Calendar generation failed. Please try again.'); }
    clearInterval(t);
    setLoading(false); setLoadingStep('');
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const getDay = (dayNum) => plan?.days?.find(d => d.day === dayNum);
  const typeStyle = (type) => TYPE_COLORS[type] || TYPE_COLORS['Story'];

  // Legend
  const Legend = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
      {Object.entries(TYPE_COLORS).map(([type, style]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: style.bg, border: `1px solid ${style.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: style.color }} />
          <span style={{ fontSize: '0.72rem', color: style.color, fontWeight: 600 }}>{type}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>📅 Content Calendar</h1>
            <p>AI plans your entire month of marketing content — captions, WhatsApp messages, best times to post</p>
          </div>

          {/* Setup form */}
          <div className="card" style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Plan your calendar</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => { if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); setPlan(null); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#64748b' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 130, textAlign: 'center' }}>{monthName} {currentYear}</span>
                <button onClick={() => { if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); setPlan(null); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#64748b' }}>›</button>
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Business name</label>
                <input className="form-input" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Sharma Electronics" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Business type <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="e.g. Electronics retail" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Main offer/product <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="form-input" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="e.g. Home appliances" required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target audience</label>
                <input className="form-input" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. Homeowners 25-45" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Country</label>
                <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                  {['India','United States','United Kingdom','UAE','Singapore','Australia','Global'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tone</label>
                <select className="form-select" value={form.tone} onChange={e => set('tone', e.target.value)}>
                  {['Professional','Friendly','Urgent','Playful','Inspirational'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem' }}>
                {loading ? <><span className="spinner" />  {loadingStep}</> : `📅 Generate ${monthName} Calendar`}
              </button>
              {plan && (
                <div style={{ display: 'inline-flex', marginLeft: 12, gap: 6 }}>
                  <button className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('calendar')}>📅 Calendar</button>
                  <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('list')}>📋 List</button>
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{loadingStep}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>Planning {daysInMonth} days of content — this takes about 20-30 seconds</p>
            </div>
          )}

          {/* Month theme banner */}
          {plan && !loading && (
            <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: 4 }}>📅 {monthName} {currentYear} Theme</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{plan.month_theme}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>🎯 {plan.monthly_goal}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.85 }}>
                  <div>{daysInMonth} days planned</div>
                  <div>{plan.days?.length || 0} posts ready</div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {plan && !loading && <Legend />}

          {/* Calendar grid view */}
          {plan && !loading && viewMode === 'calendar' && (
            <div className="card" style={{ padding: '1rem' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS_OF_WEEK.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              {/* Calendar cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ minHeight: 70 }} />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayData = getDay(dayNum);
                  const style = dayData ? typeStyle(dayData.content_type) : null;
                  const isSelected = selectedDay?.day === dayNum;
                  return (
                    <div
                      key={dayNum}
                      onClick={() => dayData && setSelectedDay(dayData)}
                      style={{
                        minHeight: 70, borderRadius: 8, padding: '6px',
                        background: style ? style.bg : '#f8fafc',
                        border: isSelected ? `2px solid #6366f1` : `1px solid ${style ? style.border : '#e2e8f0'}`,
                        cursor: dayData ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: style ? style.color : '#94a3b8' }}>{dayNum}</span>
                        {dayData && <span style={{ fontSize: '0.85rem' }}>{dayData.emoji}</span>}
                      </div>
                      {dayData && (
                        <>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: style.color, marginTop: 2, lineHeight: 1.2 }}>{dayData.content_type}</div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{dayData.topic}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>⏰ {dayData.best_time}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List view */}
          {plan && !loading && viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {plan.days?.map(day => {
                const style = typeStyle(day.content_type);
                return (
                  <div key={day.day} className="card" style={{ borderLeft: `4px solid ${style.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{day.emoji}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Day {day.day} — {day.topic}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: style.bg, color: style.color }}>{day.content_type}</span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>⏰ {day.best_time}</span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>📱 {day.platform_focus}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(day.caption, `cap-${day.day}`)}>{copied === `cap-${day.day}` ? '✓' : 'Copy post'}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDay(selectedDay?.day === day.day ? null : day)}>
                          {selectedDay?.day === day.day ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>
                    {selectedDay?.day === day.day && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>📱 Social Media Caption</div>
                          <div className="output-box" style={{ fontSize: '0.85rem' }}>{day.caption}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#25d366', marginBottom: 4 }}>💬 WhatsApp Message</div>
                          <div className="output-box" style={{ fontSize: '0.85rem' }}>{day.whatsapp}</div>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => handleCopy(day.whatsapp, `wa-${day.day}`)}>{copied === `wa-${day.day}` ? '✓ Copied!' : 'Copy WhatsApp'}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected day detail panel (calendar view) */}
          {selectedDay && viewMode === 'calendar' && !loading && (
            <div className="card" style={{ marginTop: '1rem', borderLeft: `4px solid ${typeStyle(selectedDay.content_type).color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem' }}>{selectedDay.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>Day {selectedDay.day} — {selectedDay.topic}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: typeStyle(selectedDay.content_type).bg, color: typeStyle(selectedDay.content_type).color }}>{selectedDay.content_type}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>⏰ Best time: {selectedDay.best_time}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>📱 {selectedDay.platform_focus}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDay(null)}>✕ Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: 6 }}>📱 Social Media Caption</div>
                  <div className="output-box" style={{ fontSize: '0.85rem', minHeight: 100 }}>{selectedDay.caption}</div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => handleCopy(selectedDay.caption, 'cap')}>{copied === 'cap' ? '✓ Copied!' : 'Copy caption'}</button>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#25d366', marginBottom: 6 }}>💬 WhatsApp Message</div>
                  <div className="output-box" style={{ fontSize: '0.85rem', minHeight: 100 }}>{selectedDay.whatsapp}</div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => handleCopy(selectedDay.whatsapp, 'wa')}>{copied === 'wa' ? '✓ Copied!' : 'Copy message'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!plan && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: 6 }}>Plan your entire month in one click</p>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: 400, margin: '0 auto' }}>
                Fill in your business details above and AI will plan {daysInMonth} days of content — social media captions, WhatsApp messages, best posting times, and content mix for {monthName}.
              </p>
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
