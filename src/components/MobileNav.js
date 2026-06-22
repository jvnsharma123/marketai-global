import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', icon: '⊞', label: 'Home' },
  { to: '/generate', icon: '✦', label: 'Text' },
  { to: '/carousel', icon: '🎞', label: 'Carousel' },
  { to: '/history', icon: '◷', label: 'History' },
  { to: '/pricing', icon: '◈', label: 'Upgrade' },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav className="mobile-nav" style={{ display: 'grid' }}>
      {links.map(l => (
        <Link key={l.to} to={l.to} className={`mobile-nav-link ${pathname === l.to ? 'active' : ''}`}>
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
