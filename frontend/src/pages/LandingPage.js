import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';
import './LandingPage.css';

const FEATURES = [
  { icon: '◈', title: 'AI Clinical Engine', desc: 'Full knowledge of Egan\'s Fundamentals, Kettering, Lindsay Jones — answer any RT question instantly with cited references.', color: '#00d4ff' },
  { icon: '◎', title: 'ABG Interpreter', desc: 'Enter values, get instant full acid-base analysis with compensation assessment, A-a gradient, P/F ratio and AI clinical recommendations.', color: '#00ff9d' },
  { icon: '◇', title: 'Ventilator Simulator', desc: 'All modes: AC-VC, AC-PC, SIMV, PRVC, APRV, HFOV. Real-time predicted ABGs, lung protection scoring, waveform analysis.', color: '#7c3aed' },
  { icon: '◐', title: 'NBRC Exam Bank', desc: 'Thousands of AI-generated RRT/CRT-level questions. Adaptive difficulty. Detailed explanations. Track your weak areas.', color: '#ffd700' },
  { icon: '⬡', title: 'Neonatal Module', desc: 'Comprehensive NICU coverage: RDS, BPD, PPHN, surfactant therapy, nHFOV, iNO, ECMO management.', color: '#ff6b35' },
  { icon: '◉', title: 'Disease Library', desc: '50+ disease pathologies with RT-focused management protocols, expected ABG patterns, and vent strategies.', color: '#ff3366' },
];

const STATS = [
  { value: '50,000+', label: 'Practice Questions' },
  { value: '50+', label: 'Disease Modules' },
  { value: '10+', label: 'Vent Modes' },
  { value: '24/7', label: 'AI Access' },
];

const TESTIMONIALS = [
  { name: 'Marcus T., RRT', text: 'Passed my RRT boards on first attempt after 3 weeks with this platform. The AI explanations are better than any book.', cred: 'Critical Care RT, Level I Trauma Center' },
  { name: 'Sandra L., CRT Student', text: 'The ABG analyzer helped me finally understand acid-base. The AI breaks it down like no textbook can.', cred: 'RT Program, 2nd Year' },
  { name: 'Dr. James K., RT Program Director', text: 'We adopted the Institution plan for our entire RT program. Student pass rates improved 28% in one semester.', cred: 'Allied Health Department Chair' },
];

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentTestimonial(c => (c + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing">
      {/* Ambient background */}
      <div className="ambient">
        <div className="ambient-blob blob1" />
        <div className="ambient-blob blob2" />
        <div className="ambient-blob blob3" />
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">Rₓ</div>
          <span className="nav-brand"><span>RT</span> Enigma AI</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <Link to="/pricing">Pricing</Link>
          <a href="#about">About</a>
        </div>
        <div className="nav-cta">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="pulse-dot" />
          Built for RRTs, CRTs & RT Students
        </div>
        <h1 className="hero-title display-title">
          The AI Platform
          <br />
          <span className="text-gradient">Built for Respiratory Therapy</span>
        </h1>
        <p className="hero-subtitle">
          Comprehensive AI trained on Egan's, Kettering, Lindsay Jones & AARC guidelines.
          Master ABG analysis, ventilator management, NBRC exam prep, and critical care —
          all in one platform built exclusively for RT professionals.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Start Free Trial →</Link>
          <Link to="/pricing" className="btn btn-secondary btn-lg">View Plans</Link>
        </div>
        <div className="hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-value mono text-gradient">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div className="badge badge-cyan">Platform Features</div>
          <h2 className="display-title">Everything You Need to <span className="text-gradient">Excel in RT</span></h2>
          <p className="text-secondary">Comprehensive tools powered by AI trained on the most authoritative RT resources</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon" style={{ color: f.color, borderColor: f.color + '30', background: f.color + '15' }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABG Preview */}
      <section className="abg-preview-section">
        <div className="abg-preview-text">
          <div className="badge badge-green">Live Demo Preview</div>
          <h2 className="display-title">Instant ABG <span className="text-gradient">Interpretation</span></h2>
          <p className="text-secondary">
            Enter any ABG values and our AI provides complete acid-base analysis including
            compensation assessment, oxygenation indices, and specific clinical recommendations
            based on Egan's and AARC guidelines.
          </p>
          <ul className="check-list">
            {['Primary disorder identification', 'Compensation verification (Winter\'s formula)', 'A-a gradient & P/F ratio', 'Severity classification', 'AI clinical recommendations', 'Referenced to AARC guidelines'].map(i => (
              <li key={i}><span className="text-green">✓</span> {i}</li>
            ))}
          </ul>
          <Link to="/register" className="btn btn-primary">Try ABG Analyzer Free →</Link>
        </div>
        <div className="abg-preview-demo card card-glow">
          <div className="demo-header">
            <span className="text-muted mono" style={{ fontSize: 12 }}>ABG ANALYSIS</span>
            <span className="badge badge-red">Acute</span>
          </div>
          <div className="demo-values">
            {[['pH', '7.28', '#ff3366'], ['PaCO₂', '58 mmHg', '#ff6b35'], ['HCO₃', '26 mEq/L', '#8ba4cc'], ['PaO₂', '52 mmHg', '#ff3366']].map(([k,v,c]) => (
              <div key={k} className="demo-value-row">
                <span className="text-muted">{k}</span>
                <span className="mono" style={{ color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="sep" />
          <div className="demo-result">
            <div className="badge badge-red" style={{ marginBottom: 8 }}>🚨 Acute Respiratory Acidosis</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Acute respiratory acidosis with severe hypoxemia (P/F ratio: 130 — moderate ARDS). 
              Uncompensated — HCO₃ within expected acute range. 
              <span className="text-cyan"> Immediate ventilatory support indicated.</span>
            </div>
          </div>
          <div className="demo-recs">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommendations</div>
            {['Consider intubation & mechanical ventilation', 'Target ARDSNet protocol: 6 mL/kg IBW, PEEP 8-12', 'FiO₂ titrate to SpO₂ 88-95%'].map(r => (
              <div key={r} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {r}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-header">
          <div className="badge badge-purple">Testimonials</div>
          <h2 className="display-title">Trusted by <span className="text-gradient">RT Professionals</span></h2>
        </div>
        <div className="testimonial-card card card-glow">
          <div className="testimonial-quote">"</div>
          <p className="testimonial-text">{TESTIMONIALS[currentTestimonial].text}</p>
          <div className="testimonial-author">
            <div className="testimonial-avatar">{TESTIMONIALS[currentTestimonial].name[0]}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{TESTIMONIALS[currentTestimonial].name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{TESTIMONIALS[currentTestimonial].cred}</div>
            </div>
          </div>
          <div className="testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} className={`dot ${i === currentTestimonial ? 'active' : ''}`} onClick={() => setCurrentTestimonial(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="display-title">Ready to Elevate Your <span className="text-gradient">RT Practice?</span></h2>
        <p className="text-secondary">Join thousands of RT professionals using AI to master their craft</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
          <Link to="/register" className="btn btn-primary btn-lg">Start Free — No Credit Card</Link>
          <Link to="/pricing" className="btn btn-secondary btn-lg">View All Plans</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <div className="logo-icon" style={{ width: 30, height: 30, fontSize: 13 }}>Rₓ</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}><span className="text-cyan">RT</span> Enigma AI</span>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <Link to="/pricing">Pricing</Link>
          <a href="mailto:support@chosen1.ai">Support</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          © 2025 RT Enigma AI — chosen1.ai · Not a substitute for clinical judgment
        </div>
      </footer>
    </div>
  );
}
