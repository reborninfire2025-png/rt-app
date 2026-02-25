import React, { useState } from 'react';
import { aiEngine } from '../lib/api';
import toast from 'react-hot-toast';
import '../styles.css';

const NORMAL_RANGES = { ph: [7.35, 7.45], paco2: [35, 45], hco3: [22, 26], pao2: [80, 100] };

function ValueInput({ label, field, value, onChange, unit, normal }) {
  const num = parseFloat(value);
  const inRange = !isNaN(num) && num >= normal[0] && num <= normal[1];
  const outLow = !isNaN(num) && num < normal[0];
  const color = isNaN(num) || value === '' ? 'var(--border)' : inRange ? 'var(--accent-green)' : outLow ? 'var(--accent-cyan)' : 'var(--accent-red)';

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: `1px solid ${color}30`, transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Normal: {normal[0]}–{normal[1]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <input
          type="number" step="0.01" value={value}
          onChange={e => onChange(field, e.target.value)}
          style={{ flex: 1, background: 'none', border: 'none', color, fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, outline: 'none', width: '100%' }}
          placeholder="—"
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{unit}</span>
      </div>
    </div>
  );
}

function ResultSection({ result }) {
  if (!result) return null;
  
  const severityColor = result.severity?.includes('CRITICAL') ? '#ff3366' :
    result.severity?.includes('SEVERE') ? '#ff6b35' :
    result.severity?.includes('MODERATE') ? '#ffd700' : '#00ff9d';

  return (
    <div style={{ marginTop: 24, animation: 'fadeUp 0.4s ease' }}>
      <div style={{ background: `${severityColor}15`, border: `1px solid ${severityColor}40`, borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: severityColor, marginBottom: 4 }}>
              {result.primary_disorder}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{result.compensation}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${severityColor}20`, color: severityColor, border: `1px solid ${severityColor}40` }}>
              {result.severity?.split(' - ')[0]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        {[
          ['P/F Ratio', result.pf_ratio, result.pf_ratio < 100 ? '#ff3366' : result.pf_ratio < 200 ? '#ff6b35' : result.pf_ratio < 300 ? '#ffd700' : '#00ff9d'],
          ['A-a Gradient', result.aa_gradient ? result.aa_gradient + ' mmHg' : 'N/A (no age)', result.aa_gradient > 20 ? '#ffd700' : '#00ff9d'],
          ['Oxygenation', result.oxygenation_status?.split('|')[0] || '—', result.oxygenation_status?.includes('CRITICAL') ? '#ff3366' : result.oxygenation_status?.includes('Severe') ? '#ff6b35' : '#00ff9d'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>{val}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent-cyan)' }}>◈ AI Clinical Interpretation</h4>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
          {result.interpretation}
        </div>
      </div>
    </div>
  );
}

export default function ABGCalculator() {
  const [values, setValues] = useState({ ph: '', paco2: '', hco3: '', pao2: '', fio2: '21', age: '' });
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    if (!values.ph || !values.paco2 || !values.hco3 || !values.pao2) {
      toast.error('Please enter pH, PaCO₂, HCO₃, and PaO₂');
      return;
    }
    setLoading(true);
    try {
      const { data } = await aiEngine.interpretABG({
        ph: parseFloat(values.ph),
        paco2: parseFloat(values.paco2),
        hco3: parseFloat(values.hco3),
        pao2: parseFloat(values.pao2),
        fio2: parseFloat(values.fio2) / 100 || 0.21,
        age: values.age ? parseInt(values.age) : null,
        clinical_context: context || null,
      });
      setResult(data);
    } catch (err) {
      toast.error('Analysis failed. Please check values.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setValues({ ph: '', paco2: '', hco3: '', pao2: '', fio2: '21', age: '' });
    setContext('');
    setResult(null);
  };

  const loadExample = (type) => {
    const examples = {
      resp_acid: { ph: '7.28', paco2: '58', hco3: '26', pao2: '52', fio2: '40', age: '65' },
      met_acid: { ph: '7.30', paco2: '28', hco3: '13', pao2: '88', fio2: '21', age: '45' },
      resp_alk: { ph: '7.52', paco2: '28', hco3: '22', pao2: '96', fio2: '21', age: '30' },
      met_alk: { ph: '7.50', paco2: '47', hco3: '36', pao2: '80', fio2: '21', age: '55' },
      normal: { ph: '7.40', paco2: '40', hco3: '24', pao2: '95', fio2: '21', age: '40' },
    };
    setValues({ ...examples[type], age: examples[type].age });
    setResult(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28, color: 'var(--accent-green)' }}>◎</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>ABG Analyzer</h1>
        </div>
        <p className="text-secondary">Complete acid-base & oxygenation analysis with AI clinical interpretation</p>
      </div>

      {/* Example buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <span className="text-muted" style={{ fontSize: 12, alignSelf: 'center' }}>Load example:</span>
        {[
          ['Resp Acidosis', 'resp_acid'],
          ['Met Acidosis', 'met_acid'],
          ['Resp Alkalosis', 'resp_alk'],
          ['Met Alkalosis', 'met_alk'],
          ['Normal', 'normal'],
        ].map(([label, key]) => (
          <button key={key} className="btn btn-ghost btn-sm" onClick={() => loadExample(key)}>{label}</button>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <ValueInput label="pH" field="ph" value={values.ph} onChange={handleChange} unit="" normal={NORMAL_RANGES.ph} />
            <ValueInput label="PaCO₂" field="paco2" value={values.paco2} onChange={handleChange} unit="mmHg" normal={NORMAL_RANGES.paco2} />
            <ValueInput label="HCO₃⁻" field="hco3" value={values.hco3} onChange={handleChange} unit="mEq/L" normal={NORMAL_RANGES.hco3} />
            <ValueInput label="PaO₂" field="pao2" value={values.pao2} onChange={handleChange} unit="mmHg" normal={NORMAL_RANGES.pao2} />
          </div>

          <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">FiO₂ (%)</label>
              <input type="number" className="form-input" value={values.fio2} onChange={e => handleChange('fio2', e.target.value)} placeholder="21" min="21" max="100" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Patient Age (optional)</label>
              <input type="number" className="form-input" value={values.age} onChange={e => handleChange('age', e.target.value)} placeholder="65" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Context (optional)</label>
            <input type="text" className="form-input" value={context} onChange={e => setContext(e.target.value)} placeholder="e.g., COPD exacerbation, post-op, sepsis, ARDS..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAnalyze} disabled={loading}>
              {loading ? '⏳ Analyzing...' : '◎ Analyze ABG'}
            </button>
            <button className="btn btn-secondary" onClick={handleClear}>Clear</button>
          </div>

          {/* Quick reference */}
          <div className="card" style={{ marginTop: 16, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--accent-cyan)' }}>Quick Reference</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['pH Normal', '7.35 – 7.45'],
                ['PaCO₂ Normal', '35 – 45 mmHg'],
                ['HCO₃ Normal', '22 – 26 mEq/L'],
                ['PaO₂ Normal', '80 – 100 mmHg'],
                ['Winter\'s Formula', '1.5×HCO₃ + 8 ±2'],
                ['ARDS: P/F < 300', '< 200 mod, < 100 sev'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-muted">{k}: </span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 16 }}>
              <div className="spinner" />
              <p className="text-secondary">AI analyzing blood gases...</p>
            </div>
          )}
          {!loading && result && <ResultSection result={result} />}
          {!loading && !result && (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◎</div>
              <p className="text-muted">Enter ABG values and click Analyze</p>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>AI will provide full interpretation with clinical recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
