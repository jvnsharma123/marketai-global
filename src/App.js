import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/api';
import './index.css';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import History from './pages/History';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';

function PrivateRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner" style={{ width:36, height:36 }} />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <Signup />} />
        <Route path="/pricing" element={<Pricing session={session} />} />
        <Route path="/dashboard" element={<PrivateRoute session={session}><Dashboard session={session} /></PrivateRoute>} />
        <Route path="/generate" element={<PrivateRoute session={session}><Generator session={session} /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute session={session}><History session={session} /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute session={session}><Settings session={session} /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
