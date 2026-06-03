import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/api';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to={session ? '/dashboard' : '/'} className="navbar-brand">
        Market<span>AI</span>
      </Link>
      <div className="navbar-links">
        {session ? (
          <>
            <Link to="/generate" className="btn btn-primary btn-sm">✦ Generate</Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/pricing" className="btn btn-ghost btn-sm">Pricing</Link>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started free</Link>
          </>
        )}
      </div>
    </nav>
  );
}
