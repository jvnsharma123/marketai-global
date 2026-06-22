import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/generate', icon: '✦', label: 'Generate' },
  { to: '/carousel', icon: '🎞', label: 'Carousel' },
  { to: '/history', icon: '◷', label: 'History' },
  { to: '/settings', icon: '⚙', label: 'Settings' },
  { to: '/pricing', icon: '◈', label: 'Upgrade' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar">
      {links.map(l => (
        <Link key={l.to} to={l.to} className={`sidebar-link ${pathname === l.to ? 'active' : ''}`}>
          <span>{l.icon}</span> {l.label}
        </Link>
      ))}
    </aside>
  );
}
