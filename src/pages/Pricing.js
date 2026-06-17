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

// Load Razorpay script only when needed
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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

      if (!res.ok) throw new Error('Failed to create order');
      const order = await res.json();

      // Load Razorpay script only now
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay failed to load');

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'MarketAI Global',
        description: `${plan.name} Plan — Monthly`,
        order_id: order.id,
        handler: async (response) => {
          await supabase.from('profiles')
            .update({ plan: plan.key, generations_used: 0 })
            .eq('id', session.user.id);
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
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
      setLoading('');
    }
  };

  return (
    <div>
      <Navbar session={session} />
      <div style={{ padding: '3rem 1rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem' }}>Simple, honest pricing</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start free. Upgrade only when you need more.</p>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
            <button className={`tab ${currency === 'inr' ? 'active' : ''}`} style={{ minWidth: 80 }} onClick={() => setCurrency('inr')}>₹ INR</button>
            <button className={`tab ${currency === 'usd' ? 'active' : ''}`} style={{ minWidth: 80 }} onClick={() => setCurrency('usd')}>$ USD</button>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            {currency === 'inr' ? '🇮🇳 Pay via Razorpay (UPI, cards, net banking)' : '🌍 Contact us for international payment'}
          </p>
        </div>

        {/* Plan cards */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.key} className="card" style={{ border: plan.highlight ? '2px solid #6366f1' : '1px solid #e2e8f0', position: 'relative', padding: '1.5rem' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.3rem' }}>{plan.name}</h2>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.2rem' }}>
                {currency === 'inr' ? plan.inr : plan.usd}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 600, marginBottom: '1rem' }}>{plan.gens}</div>
              <ul style={{ listStyle: 'none', marginBottom: '1.2rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '0.88rem', color: '#475569', padding: '3px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.key === 'free' ? (
                <Link to={session ? '/generate' : '/signup'} className="btn btn-secondary btn-full">Get started free</Link>
              ) : currency === 'inr' ? (
                <div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleRazorpayPayment(plan)}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key
                      ? <><span className="spinner" /> Processing...</>
                      : `Pay ${plan.inr}/mo with Razorpay`}
                  </button>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>UPI · Cards · Net Banking · Wallets</p>
                </div>
              ) : (
                <div>
                  <a
                    href={`mailto:marketai.global@gmail.com?subject=Upgrade to ${plan.name} Plan&body=Hi, I'd like to upgrade to the ${plan.name} plan ($${plan.amountUSD}/month). My account email is: ${session?.user?.email || ''}`}
                    className="btn btn-primary btn-full"
                    style={{ background: '#0f172a' }}
                  >
                    Contact us to pay {plan.usd}/mo
                  </a>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>We'll send you a secure payment link</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1.2rem', background: '#f8fafc', borderRadius: 12 }}>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>🔒 Secure payments · Cancel anytime · No hidden fees</p>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Indian payments via Razorpay · International payments via email request</p>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '2.5rem', maxWidth: 600, margin: '2.5rem auto 0' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.2rem', textAlign: 'center' }}>Common questions</h2>
          {[
            { q: 'What counts as one generation?', a: 'One click of "Generate" = one generation. It creates all 4 channels at once.' },
            { q: 'Can I change my plan anytime?', a: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately.' },
            { q: 'Which payment methods are accepted?', a: 'Indian customers: UPI, debit/credit cards, net banking via Razorpay. International customers: contact us for a secure payment link.' },
            { q: 'Does it work for any language?', a: 'Yes — MarketAI generates content in 50+ languages including Hindi, Tamil, Arabic, Spanish and more.' },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid #e2e8f0', padding: '0.9rem 0' }}>
              <strong style={{ fontSize: '0.92rem' }}>{item.q}</strong>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 4 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
