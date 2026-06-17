import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

const TABS = [
  { key: 'social_post', label: '📱 Social' },
  { key: 'whatsapp_message', label: '💬 WhatsApp' },
  { key: 'ad_copy', label: '🎯 Ads' },
  { key: 'email_campaign', label: '📧 Email' },
];

function HistoryCard({ item, onDelete }) {
  const [activeTab, setActiveTab] = useState('social_post');
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(item[activeTab] || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontSize: '0.95rem' }}>{item.business_name || 'Unnamed'}</strong>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.offer}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{item.language} · {new Date(item.created_at).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>{copied ? '✓' : 'Copy'}</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Del</button>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(t => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>
      <div className="output-box" style={{ fontSize: '0.85rem', maxHeight: 150, overflowY: 'auto' }}>
        {item[activeTab] || 'No content.'}
      </div>
    </div>
  );
}

export default function History({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('generated_content').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [session]);

  const handleDelete = async (id) => {
    await supabase.from('generated_content').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <Navbar session={session} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <h1>◷ Content History</h1>
            <p>All your previously generated marketing content</p>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="icon">◷</div>
              <p style={{ fontWeight: 600 }}>No content generated yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Go to Generate and create your first content</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>{items.length} generation{items.length !== 1 ? 's' : ''}</p>
              {items.map(item => <HistoryCard key={item.id} item={item} onDelete={handleDelete} />)}
            </>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
