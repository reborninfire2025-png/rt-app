import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { aiEngine } from '../lib/api';
import toast from 'react-hot-toast';
import '../styles.css';

const QUICK_PROMPTS = [
  { label: 'ARDS management', q: 'Explain ARDSNet protocol and lung-protective ventilation strategy with current evidence', ctx: 'adult' },
  { label: 'Neonatal RDS', q: 'Describe the management of neonatal RDS including surfactant therapy, ventilation strategies, and weaning', ctx: 'neonatal' },
  { label: 'COPD exacerbation', q: 'What are the RT priorities and ventilation strategies for acute COPD exacerbation?', ctx: 'adult' },
  { label: 'Weaning readiness', q: 'What are the evidence-based criteria for weaning and extubation readiness? Include RSBI and SBT protocol', ctx: 'adult' },
  { label: 'APRV setup', q: 'How do I set up Airway Pressure Release Ventilation (APRV) for a patient with severe ARDS? Include P-high, P-low, T-high, T-low settings', ctx: 'adult' },
  { label: 'Asthma in ICU', q: 'Describe mechanical ventilation strategy for severe asthma (status asthmaticus) in the ICU, including permissive hypercapnia', ctx: 'adult' },
  { label: 'PPHN neonatal', q: 'Explain the management of Persistent Pulmonary Hypertension of the Newborn (PPHN) including iNO, sildenafil, and ECMO criteria', ctx: 'neonatal' },
  { label: 'Prone positioning', q: 'When is prone positioning indicated in ARDS and what are the RT responsibilities during proning?', ctx: 'adult' },
];

function Message({ msg }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--gradient-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700,
      }}>
        {msg.role === 'user' ? '◉' : 'Rₓ'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {msg.role === 'user' ? 'You' : 'RT Enigma AI'}
        </div>
        <div style={{
          background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,255,0.05)',
          border: `1px solid ${msg.role === 'user' ? 'var(--border)' : 'rgba(0,212,255,0.2)'}`,
          borderRadius: 'var(--radius)', padding: '14px 16px',
          fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('adult');
  const [loading, setLoading] = useState(false);
  const [includeRefs, setIncludeRefs] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const disease = params.get('disease');
    if (disease) {
      setInput(`Provide a comprehensive respiratory therapy overview of ${disease} including pathophysiology, ABG findings, RT treatment protocols, ventilation strategy, and NBRC exam key points.`);
    }
  }, [location]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiEngine.query({
        question: text.trim(),
        context,
        include_references: includeRefs,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      toast.error('AI query failed');
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unable to process request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 24, color: 'var(--accent-cyan)' }}>◈</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>RT Enigma AI</h1>
            <span className="badge badge-green">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: 13 }}>Ask anything about respiratory therapy — Egan's, Kettering, NBRC, clinical protocols</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-input" value={context} onChange={e => setContext(e.target.value)} style={{ width: 'auto', padding: '8px 12px' }}>
            <option value="adult">Adult</option>
            <option value="neonatal">Neonatal</option>
            <option value="pediatric">Pediatric</option>
          </select>
          {messages.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={clearChat}>Clear Chat</button>
          )}
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Topics</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} className="btn btn-ghost btn-sm"
                onClick={() => { setContext(p.ctx); sendMessage(p.q); }}
                style={{ fontSize: 12 }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
            <p>Ask any respiratory therapy question</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Powered by AI trained on Egan's, Kettering, Lindsay Jones & AARC guidelines</p>
          </div>
        )}
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>Rₓ</div>
            <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map(d => (
                <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 1s ease-in-out infinite', animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about ABG interpretation, ventilator modes, NBRC questions, disease management, neonatal care..."
            rows={2}
            style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={includeRefs} onChange={e => setIncludeRefs(e.target.checked)} style={{ accentColor: 'var(--accent-cyan)' }} />
              References
            </label>
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
              {loading ? '...' : 'Send ↵'}
            </button>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          RT Enigma AI is for educational purposes only. Always apply clinical judgment in patient care.
        </p>
      </div>
    </div>
  );
}
