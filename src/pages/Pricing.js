import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';
import Navbar from '../components/Navbar';

const PLANS = [
  {
    key: 'free', name: 'Free', usd: '$0', inr: '₹0', period: '/month',
    amountINR: 0, amountUSD: 0,
    gens: '5 generations/month',
    features: ['All 4 marketing channels', '50+ languages', 'Basic history', 'Email support'],
    highlight: false,
  },
  {
    key: 'starter', name: 'Starter', usd: '$19', inr: '₹999', period: '/month',
    amountINR: 999, amountUSD: 19,
    gens: '100 generations/month',
    features: ['All 4 marketing channels', '50+ languages', 'Full history & saved content', 'Priority support', 'Custom tone preferences'],
    highlight: true,
  },
  {
    key: 'pro', name: 'Pro', usd: '$49', inr: '₹2,499', period: '/month',
    amountINR: 2499, amountUSD: 49,
    gens: 'Unlimited generations',
    features: ['Everything in Starter', 'Unlimited generations', 'Bulk generation (coming soon)', 'API access (coming soon)', 'Dedicated support'],
    highlight: false,
  },
];

export default function Pricing({ session }) {
  const [currency, setCurrency] = useState('inr');
  const [loading, setLoading] = useState('');
  const navigate = useNavigate();

  const handleRazorpayPayment = async (plan) => {
    if (!session) { navigate('/signup'); return; }
    setLoading(plan.key);
    try {
      // Create order on server
      const res = await fetch('/api/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.amountINR, currency: 'INR', plan: plan.key })
      });
      const order = await res.json();

      // Load Razorpay checkout script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: 'INR',
          name: 'MarketAI Global',
          description: `${plan.name} Plan — Monthly Subscription`,
          order_id: order.id,
          handler: async (response) => {
            // Payment successful — upgrade user plan
            await supabase.from('profiles').update({ plan: plan.key, generations_used: 0 }).eq('id', session.user.id);
            alert(`✅ Payment successful! Your ${plan.name} plan is now active.`);
            navigate('/dashboard');
          },
          prefill: { email: session?.user?.email || '' },
          theme: { color: '#6366f1' },
          modal: { ondismiss: () => setLoading('') }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading('');
      };
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
      setLoading('');
    }
  };

  const handleInfinityPayment = (plan) => {
    if (!session) { navigate('/signup'); return; }
    // Open WhatsApp to contact for international payment setup
    const msg = encodeURIComponent(`Hi, I'd like to upgrade to the MarketAI Global ${plan.name} plan ($${plan.amountUSD}/month). My email is ${session?.user?.email}`);
    window.open(`https://wa.me/+91XXXXXXXXXX?text=${msg}`, '_blank');
  };

  return (
    <div>
      <Navbar session={session} />
      <div style={{ padding: '4rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Simple, honest pricing</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start free. Upgrade only when you need more.</p>

          {/* Currency toggle */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
            <button className={`tab ${currency === 'inr' ? 'active' : ''}`} style={{ minWidth: 80 }} onClick={() => setCurrency('inr')}>₹ INR</button>
            <button className={`tab ${currency === 'usd' ? 'active' : ''}`} style={{ minWidth: 80 }} onClick={() => setCurrency('usd')}>$ USD</button>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            {currency === 'inr' ? '🇮🇳 Pay in INR via Razorpay (UPI, cards, net banking)' : '🌍 Pay in USD via Infinity (cards, bank transfer)'}
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.2rem', alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.key} className="card" style={{ border: plan.highlight ? '2px solid #6366f1' : '1px solid #e2e8f0', position: 'relative', padding: '1.8rem' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.3rem' }}>{plan.name}</h2>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>
                {currency === 'inr' ? plan.inr : plan.usd}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, marginBottom: '1.2rem' }}>{plan.gens}</div>

              <ul style={{ listStyle: 'none', marginBottom: '1.5rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '0.9rem', color: '#475569', padding: '4px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.key === 'free' ? (
                <Link to={session ? '/generate' : '/signup'} className="btn btn-secondary btn-full">Get started free</Link>
              ) : currency === 'inr' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleRazorpayPayment(plan)}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key ? <><span className="spinner" /> Processing...</> : `Pay ${plan.inr}/mo with Razorpay`}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>UPI · Cards · Net Banking · Wallets</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-full"
                    style={{ background: '#0f172a' }}
                    onClick={() => handleInfinityPayment(plan)}
                  >
                    Pay {plan.usd}/mo via Infinity
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Cards · Bank Transfer · 0.5% fee only</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment trust badges */}
        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 12 }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>🔒 Secure payments powered by</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>Razorpay</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Infinity</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem' }}>Cancel anytime · No hidden fees · 100% secure</p>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '3rem', maxWidth: 600, margin: '3rem auto 0' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>Common questions</h2>
          {[
            { q: 'What counts as one generation?', a: 'One click of "Generate" = one generation. It creates all 4 channels (social, WhatsApp, ads, email) at once.' },
            { q: 'Can I change my plan anytime?', a: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately.' },
            { q: 'Which payment methods are accepted?', a: 'Indian customers: UPI, debit/credit cards, net banking via Razorpay. International customers: cards and bank transfers via Infinity at just 0.5% fee.' },
            { q: 'Does it work for any language?', a: 'Yes — MarketAI generates content in 50+ languages including Hindi, Tamil, Arabic, Spanish, French and more.' },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
              <strong style={{ fontSize: '0.95rem' }}>{item.q}</strong>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
