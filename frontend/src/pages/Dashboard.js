import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles.css';

const QUICK_TOOLS = [
  { path: '/abg', icon: '◎', label: 'ABG Analyzer', desc: 'Interpret arterial blood gases', color: '#00ff9d' },
  { path: '/ventilator', icon: '◇', label: 'Vent Simulator', desc: 'Analyze ventilator settings', color: '#7c3aed' },
  { path: '/practice', icon: '◐', label: 'Practice Exam', desc: 'NBRC-style questions', color: '#ffd700' },
  { path: '/ai-assistant', icon: '◈', label: 'AI Assistant', desc: 'Ask any RT question', color: '#00d4ff' },
];

const DISEASE_QUICK = [
  'ARDS', 'COPD', 'Asthma', 'Pneumonia', 'PE', 'Heart Failure',
  'Neonatal RDS', 'PPHN', 'BPD', 'Pneumothorax'
];

export default function Dashboard() {
  const { user, isStudent, isFree } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p className="text-secondary" style={{ marginBottom: 4 }}>{greeting},</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          {user?.full_name?.split(' ')[0]} <span className="text-gradient">👋</span>
        </h1>
        {user?.credential_type && <span className="badge badge-cyan">{user.credential_type}</span>}
      </div>

      {/* Upgrade banner for free users */}
      {isFree && (
        <div style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>✦ You're on the Free Plan</div>
            <div className="text-secondary" style={{ fontSize: 13 }}>Upgrade to unlock unlimited AI queries, full question bank, advanced vent simulator & more</div>
          </div>
          <Link to="/pricing" className="btn btn-primary">Upgrade Now →</Link>
        </div>
      )}

      {/* Quick tools */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Clinical Tools</h2>
        <div className="grid-4">
          {QUICK_TOOLS.map(t => (
            <Link key={t.path} to={t.path} className="card" style={{ textDecoration: 'none', transition: 'all 0.2s', display: 'block' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: t.color }}>{t.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.label}</div>
              <div className="text-secondary" style={{ fontSize: 13 }}>{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats + Disease quick access */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Practice Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Questions Answered', user?.practice_stats?.questions_answered || 0, '#00d4ff'],
              ['Correct', user?.practice_stats?.correct || 0, '#00ff9d'],
              ['Accuracy', user?.practice_stats?.questions_answered ? Math.round((user?.practice_stats?.correct / user?.practice_stats?.questions_answered) * 100) + '%' : '—', '#ffd700'],
              ['Study Streak', (user?.practice_stats?.streak || 0) + ' days', '#ff6b35'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color, marginBottom: 4 }}>{val}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
              </div>
            ))}
          </div>
          <Link to="/practice" className="btn btn-secondary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            Start Practice Session →
          </Link>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Quick Disease Lookup</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DISEASE_QUICK.map(d => (
              <Link key={d} to={`/ai-assistant?disease=${encodeURIComponent(d)}`}
                className="badge badge-cyan"
                style={{ textDecoration: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}>
                {d}
              </Link>
            ))}
          </div>
          <div className="sep" />
          <Link to="/ai-assistant" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Open AI Assistant →
          </Link>
        </div>
      </div>

      {/* Study tip */}
      <div className="info-box" style={{ marginTop: 24 }}>
        <strong>💡 Today's Clinical Pearl:</strong> The P/F ratio (PaO₂/FiO₂) is one of the Berlin Criteria for ARDS classification. 
        Mild ARDS: 200–300, Moderate: 100–200, Severe: &lt;100. Remember this for both clinical practice and the NBRC exam.
      </div>
    </div>
  );
}
