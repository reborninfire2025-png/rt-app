import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/ai-assistant', icon: '◈', label: 'AI Assistant' },
  { path: '/abg', icon: '◎', label: 'ABG Analyzer' },
  { path: '/ventilator', icon: '◇', label: 'Vent Simulator' },
  { path: '/practice', icon: '◐', label: 'Practice Exam' },
];

export default function Layout({ children }) {
  const { user, logout, isStudent, isPro } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tierColors = { free: '#4a6080', student: '#00d4ff', professional: '#00ff9d', institution: '#ffd700' };
  const tierColor = tierColors[user?.subscription_tier] || '#4a6080';

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">Rₓ</div>
            {sidebarOpen && <div className="logo-text"><span>RT</span> Enigma</div>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${active ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
                {active && <div className="nav-active-bar" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="user-details">
                <div className="user-name">{user?.full_name}</div>
                <div className="user-tier" style={{ color: tierColor }}>
                  {user?.subscription_tier?.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          {!isStudent && sidebarOpen && (
            <Link to="/pricing" className="upgrade-btn">
              ✦ Upgrade Plan
            </Link>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span>⊘</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-wrapper fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
