import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles.css';

const CREDENTIAL_TYPES = ['RRT', 'CRT', 'Student (RRT Track)', 'Student (CRT Track)', 'RPFT', 'Educator', 'Physician/NP/PA', 'Other'];

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', credential_type: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to RT Enigma AI 🫁');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: 'var(--gradient-main)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff' }}>Rₓ</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}><span className="text-cyan">RT</span> Enigma AI</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
          <p className="text-secondary">Start your free account — no credit card required</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="Marcus Thompson" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Credential / Role</label>
              <select className="form-input" value={form.credential_type} onChange={e => setForm({...form, credential_type: e.target.value})}>
                <option value="">Select...</option>
                {CREDENTIAL_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Free Account →'}
            </button>
          </form>
          <div className="sep" />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            By registering, you agree to our Terms of Service & Privacy Policy
          </p>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 12 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-cyan)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
