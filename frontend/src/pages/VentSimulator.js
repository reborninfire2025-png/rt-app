import React, { useState, useEffect } from 'react';
import { simulations } from '../lib/api';
import toast from 'react-hot-toast';
import '../styles.css';

const MODES = [
  { id: 'AC-VC', label: 'AC-VC', full: 'Assist-Control Volume Control' },
  { id: 'AC-PC', label: 'AC-PC', full: 'Assist-Control Pressure Control' },
  { id: 'SIMV', label: 'SIMV', full: 'Synchronized IMV' },
  { id: 'PRVC', label: 'PRVC', full: 'Pressure-Regulated Volume Control' },
  { id: 'APRV', label: 'APRV', full: 'Airway Pressure Release Ventilation' },
  { id: 'HFOV', label: 'HFOV', full: 'High Frequency Oscillatory' },
  { id: 'PSV', label: 'PSV', full: 'Pressure Support Ventilation' },
  { id: 'CPAP', label: 'CPAP', full: 'CPAP' },
];

const CONDITIONS = ['ARDS', 'COPD Exacerbation', 'Asthma', 'Pneumonia', 'Post-Op', 'Neuromuscular', 'Sepsis', 'CHF', 'Neonatal RDS', 'Normal Lungs'];

export default function VentSimulator() {
  const [settings, setSettings] = useState({
    mode: 'AC-VC', rate: 14, tidal_volume: 420, peep: 5, fio2: 0.40,
    ie_ratio: '1:2', weight: 70, pip: 25, patient_condition: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('settings');
  const [modes, setModes] = useState([]);

  useEffect(() => {
    simulations.getModes().then(r => setModes(r.data.modes)).catch(() => {});
  }, []);

  // Auto-calculate TV from IBW
  useEffect(() => {
    setSettings(s => ({ ...s, tidal_volume: Math.round(s.weight * 6) }));
  }, [settings.weight]);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await simulations.analyzeVent({
        ...settings,
        fio2: parseFloat(settings.fio2),
        rate: parseFloat(settings.rate),
        tidal_volume: parseFloat(settings.tidal_volume),
        peep: parseFloat(settings.peep),
        weight: parseFloat(settings.weight),
        pip: parseFloat(settings.pip),
      });
      setResult(data);
      setTab('results');
    } catch (err) {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const tv_per_kg = settings.tidal_volume / settings.weight;
  const tvColor = tv_per_kg <= 6 ? '#00ff9d' : tv_per_kg <= 8 ? '#ffd700' : '#ff3366';
  const mv = (settings.tidal_volume * settings.rate / 1000).toFixed(1);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28, color: '#7c3aed' }}>◇</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>Ventilator Simulator</h1>
        </div>
        <p className="text-secondary">Analyze vent settings, predict ABGs, assess lung protection</p>
      </div>

      {/* Mode Selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label className="form-label">Ventilator Mode</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MODES.map(m => (
            <button key={m.id} className={`btn btn-sm ${settings.mode === m.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleChange('mode', m.id)} title={m.full}>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Selected: <span style={{ color: 'var(--accent-cyan)' }}>{MODES.find(m => m.id === settings.mode)?.full}</span>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Settings Panel */}
        <div>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Patient & Settings</h3>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">IBW (kg)</label>
                <input type="number" className="form-input" value={settings.weight} onChange={e => handleChange('weight', e.target.value)} min="1" max="200" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Condition</label>
                <select className="form-input" value={settings.patient_condition} onChange={e => handleChange('patient_condition', e.target.value)}>
                  <option value="">Select...</option>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Resp Rate (bpm)</label>
                <input type="number" className="form-input" value={settings.rate} onChange={e => handleChange('rate', e.target.value)} min="4" max="60" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tidal Volume (mL)</label>
                <input type="number" className="form-input" value={settings.tidal_volume} onChange={e => handleChange('tidal_volume', e.target.value)} min="50" max="1000" />
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">PEEP (cmH₂O)</label>
                <input type="number" className="form-input" value={settings.peep} onChange={e => handleChange('peep', e.target.value)} min="0" max="30" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">PIP (cmH₂O)</label>
                <input type="number" className="form-input" value={settings.pip} onChange={e => handleChange('pip', e.target.value)} min="0" max="80" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">FiO₂: {Math.round(settings.fio2 * 100)}%</label>
              <input type="range" min="0.21" max="1.0" step="0.01" value={settings.fio2}
                onChange={e => handleChange('fio2', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>21%</span><span>60%</span><span>100%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I:E Ratio</label>
              <select className="form-input" value={settings.ie_ratio} onChange={e => handleChange('ie_ratio', e.target.value)}>
                {['1:1', '1:1.5', '1:2', '1:3', '1:4', '2:1 (Inverse)', '3:1 (Inverse)'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Real-time calcs */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: tvColor }}>{tv_per_kg.toFixed(1)}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>mL/kg IBW</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>{mv}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>MV (L/min)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: parseFloat(settings.pip) - settings.peep > 30 ? '#ff3366' : '#ffd700' }}>
                  {settings.pip - settings.peep}
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>ΔP (Driving P)</div>
              </div>
            </div>

            {tv_per_kg > 6 && (
              <div className="warning-box" style={{ marginBottom: 12 }}>
                ⚠️ TV/kg {tv_per_kg.toFixed(1)} mL/kg IBW — ARDSNet target is ≤ 6 mL/kg
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAnalyze} disabled={loading}>
              {loading ? '⏳ Analyzing...' : '◇ Analyze Settings'}
            </button>
          </div>

          {/* ARDSNet Quick Reference */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: '#7c3aed', fontSize: 14 }}>◇ ARDSNet PEEP/FiO₂ Table</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {[
                ['21-30%', '5 cmH₂O'],
                ['30-40%', '5-8 cmH₂O'],
                ['40-50%', '8-10 cmH₂O'],
                ['50-60%', '10 cmH₂O'],
                ['60-70%', '10-14 cmH₂O'],
                ['70-80%', '14 cmH₂O'],
                ['80-90%', '14-18 cmH₂O'],
                ['90-100%', '18-24 cmH₂O'],
              ].map(([fio2, peep]) => (
                <div key={fio2} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FiO₂ {fio2}</span>
                  <span>PEEP {peep}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
              <div className="spinner" />
              <p className="text-secondary">AI analyzing ventilator settings...</p>
            </div>
          )}
          {!loading && result && (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>{result.lung_protection_score}</div>
                <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent-cyan)' }}>Predicted ABG</h4>
                <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
                  {result.predicted_abg && Object.entries(result.predicted_abg).map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>{v}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{k.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {result.warnings?.map((w, i) => (
                  <div key={i} className="warning-box" style={{ marginBottom: 8, fontSize: 12 }}>{w}</div>
                ))}
              </div>

              <div className="card">
                <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent-cyan)' }}>◈ AI Analysis & Recommendations</h4>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {result.settings_analysis}
                </div>
              </div>
            </div>
          )}
          {!loading && !result && (
            <div className="card" style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2 }}>◇</div>
              <p className="text-muted">Configure ventilator settings and click Analyze</p>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>AI will predict ABGs, assess lung protection, and provide clinical recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
