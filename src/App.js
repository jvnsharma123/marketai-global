import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './index.css';

// Lazy load pages to catch import errors
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Generator = React.lazy(() => import('./pages/Generator'));
const History = React.lazy(() => import('./pages/History'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const RefundPolicy = React.lazy(() => import('./pages/RefundPolicy'));

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function PrivateRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16 }}>
      <div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Loading MarketAI...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBoundary({ children }) {
  const [error, setError] = React.useState(null);
  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'2rem', textAlign:'center' }}>
      <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'1rem' }}>Something went wrong</h1>
      <p style={{ color:'#64748b', marginBottom:'1rem' }}>{error.message}</p>
      <button onClick={() => window.location.reload()} style={{ padding:'0.65rem 1.4rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
        Reload page
      </button>
    </div>
  );
  return <ErrorCatcher setError={setError}>{children}</ErrorCatcher>;
}

class ErrorCatcher extends React.Component {
  componentDidCatch(error) { this.props.setError(error); }
  render() { return this.props.children; }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing session={session} />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/pricing" element={<Pricing session={session} />} />
            <Route path="/privacy" element={<PrivacyPolicy session={session} />} />
            <Route path="/terms" element={<Terms session={session} />} />
            <Route path="/refund" element={<RefundPolicy session={session} />} />
            <Route path="/dashboard" element={<PrivateRoute session={session}><Dashboard session={session} /></PrivateRoute>} />
            <Route path="/generate" element={<PrivateRoute session={session}><Generator session={session} /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute session={session}><History session={session} /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute session={session}><Settings session={session} /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
