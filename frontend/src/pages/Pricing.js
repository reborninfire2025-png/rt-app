import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { payments } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles.css';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    payments.getPlans().then(r => setPlans(r.data.plans)).catch(() => {});
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) { navigate('/register'); return; }
    if (plan.id === 'free') { navigate('/dashboard'); return; }
    setCheckingOut(plan.id);
    try {
      const { data } = await payments.createCheckout({ tier: plan.id, billing_cycle: billing });
      window.location.href = data.session_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    } finally {
      setCheckingOut(null);
    }
  };

  const planColors = { free: '#4a6080', student: '#00d4ff', professional: '#00ff9d', institution: '#ffd700' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '60px 24px' }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto 60px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: 'var(--gradient-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff' }}>Rₓ</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}><span className="text-cyan">RT</span> Enigma AI</span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? <Link to="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link> : <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>}
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Simple, <span className="text-gradient">Transparent</span> Pricing
        </h1>
        <p className="text-secondary" style={{ fontSize: 18, lineHeight: 1.6 }}>
          Start free. Upgrade when you're ready to unlock the full RT Enigma experience.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 50, padding: 4, marginTop: 24 }}>
          <button onClick={() => setBilling('monthly')} className="btn"
            style={{ borderRadius: 50, padding: '8px 20px', fontSize: 14, background: billing === 'monthly' ? 'var(--gradient-main)' : 'transparent', color: billing === 'monthly' ? '#fff' : 'var(--text-secondary)', border: 'none' }}>
            Monthly
          </button>
          <button onClick={() => setBilling('annual')} className="btn"
            style={{ borderRadius: 50, padding: '8px 20px', fontSize: 14, background: billing === 'annual' ? 'var(--gradient-main)' : 'transparent', color: billing === 'annual' ? '#fff' : 'var(--text-secondary)', border: 'none' }}>
            Annual <span style={{ fontSize: 11, marginLeft: 4 }}>Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto 60px' }}>
        {plans.map(plan => {
          const color = planColors[plan.id] || '#4a6080';
          const price = billing === 'annual' ? plan.price_annual : plan.price_monthly;
          const isCurrent = user?.subscription_tier === plan.id;
          const isPopular = plan.badge;

          return (
            <div key={plan.id} className="card" style={{
              border: `1px solid ${isPopular ? color + '60' : 'var(--border)'}`,
              position: 'relative',
              transform: isPopular ? 'scale(1.03)' : 'none',
              boxShadow: isPopular ? `0 0 40px ${color}20` : 'none',
            }}>
              {isPopular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${color}, #7c3aed)`, color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: 4, color, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{plan.name}</div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800, color }}>
                  ${price === 0 ? 0 : price}
                </span>
                {price > 0 && <span className="text-muted" style={{ fontSize: 14 }}>/{billing === 'annual' ? 'yr' : 'mo'}</span>}
                {billing === 'annual' && price > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--accent-green)', marginTop: 4 }}>
                    ${(plan.price_monthly * 12 - plan.price_annual).toFixed(0)} savings/year
                  </div>
                )}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ color, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || checkingOut === plan.id}
                className="btn"
                style={{
                  width: '100%', padding: '12px',
                  background: isCurrent ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${color}, ${color}88)`,
                  color: isCurrent ? 'var(--text-muted)' : '#fff',
                  border: isCurrent ? '1px solid var(--border)' : 'none',
                  fontWeight: 600,
                }}>
                {checkingOut === plan.id ? 'Loading...' : isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Get Started Free' : `Subscribe — ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Guarantee */}
      <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto 60px' }}>
        <div className="card card-glow" style={{ display: 'inline-block', padding: '20px 32px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>14-Day Money-Back Guarantee</div>
          <div className="text-secondary" style={{ fontSize: 14 }}>If you're not satisfied within 14 days, we'll refund you — no questions asked.</div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 32 }}>
          Common <span className="text-gradient">Questions</span>
        </h2>
        {[
          { q: 'Is the content based on actual Egan\'s and NBRC material?', a: 'Yes. Our AI is built on comprehensive RT education knowledge including Egan\'s Fundamentals, Kettering seminars, Lindsay Jones content, and all current AARC Clinical Practice Guidelines.' },
          { q: 'Can I cancel anytime?', a: 'Yes, absolutely. Cancel from your account settings and you\'ll retain access until the end of your billing period. No cancellation fees.' },
          { q: 'Is this a substitute for clinical education?', a: 'No — RT Enigma AI is a supplemental educational and study tool. Always apply proper clinical judgment and follow your institution\'s protocols in patient care.' },
          { q: 'Do you offer group discounts?', a: 'Yes! Our Institution plan supports up to 50 seats with group pricing. Contact us at support@chosen1.ai for custom institutional licensing.' },
        ].map(({ q, a }) => (
          <div key={q} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{q}</div>
            <div className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingBottom: 32 }}>
        Questions? Email us at <a href="mailto:support@chosen1.ai" style={{ color: 'var(--accent-cyan)' }}>support@chosen1.ai</a>
      </div>
    </div>
  );
}
