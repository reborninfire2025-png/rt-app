import React, { useState, useEffect } from 'react';
import { practice } from '../lib/api';
import toast from 'react-hot-toast';
import '../styles.css';

export default function PracticeExam() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [difficulty, setDifficulty] = useState('mixed');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('select'); // select | exam | results
  const [teachingPoint, setTeachingPoint] = useState('');

  useEffect(() => {
    practice.getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  const startExam = async () => {
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    setLoading(true);
    try {
      const { data } = await practice.getQuestions({ category: selectedCategory.id, difficulty, count });
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQ(0);
      setShowExplanation(false);
      setPhase('exam');
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (qid, answer) => {
    if (answers[qid]) return; // Already answered
    const q = questions[currentQ];
    setAnswers(prev => ({ ...prev, [qid]: answer }));
    setShowExplanation(true);

    if (answer !== q.correct) {
      try {
        const { data } = await practice.submitAnswer({
          question_id: qid, answer, correct_answer: q.correct,
          question: q.question, explanation: q.explanation
        });
        setTeachingPoint(data.teaching_point);
      } catch { }
    } else {
      setTeachingPoint('');
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setShowExplanation(false);
      setTeachingPoint('');
    } else {
      setPhase('results');
    }
  };

  const q = questions[currentQ];
  const score = Object.entries(answers).filter(([id, ans]) => {
    const question = questions.find(q => q.id === id);
    return question && ans === question.correct;
  }).length;

  if (phase === 'select') {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28, color: '#ffd700' }}>◐</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>Practice Exam</h1>
          </div>
          <p className="text-secondary">AI-generated NBRC-style questions from Egan's, Kettering, and Lindsay Jones</p>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Select Category</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: 16, border: `1px solid ${selectedCategory?.id === cat.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', background: selectedCategory?.id === cat.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    color: selectedCategory?.id === cat.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    cursor: 'pointer', text-align: 'left', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Difficulty</label>
                <select className="form-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="mixed">Mixed</option>
                  <option value="recall">Recall</option>
                  <option value="application">Application</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Number of Questions</label>
                <select className="form-input" value={count} onChange={e => setCount(parseInt(e.target.value))}>
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={startExam} disabled={loading || !selectedCategory} style={{ width: '100%' }}>
            {loading ? 'Loading Questions...' : `◐ Start ${count}-Question Exam`}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    const color = pct >= 75 ? '#00ff9d' : pct >= 60 ? '#ffd700' : '#ff3366';
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 700, color, marginBottom: 8 }}>{pct}%</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {pct >= 75 ? '✦ Excellent Work!' : pct >= 60 ? '◈ Good Effort' : '◎ Keep Studying'}
        </h2>
        <p className="text-secondary" style={{ marginBottom: 32 }}>{score} / {questions.length} correct — {selectedCategory?.name}</p>
        <div className="card" style={{ marginBottom: 24 }}>
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correct;
            return (
              <div key={q.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', textAlign: 'left', alignItems: 'flex-start' }}>
                <span style={{ color: correct ? '#00ff9d' : '#ff3366', fontSize: 16, flexShrink: 0, marginTop: 2 }}>{correct ? '✓' : '✗'}</span>
                <div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Q{i + 1}: {q.question?.substring(0, 100)}...</div>
                  {!correct && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Correct: {q.correct}) {q.options?.[q.correct]}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setPhase('select'); setQuestions([]); }}>New Exam</button>
          <button className="btn btn-secondary" onClick={() => { setCurrentQ(0); setPhase('exam'); setShowExplanation(false); }}>Review Answers</button>
        </div>
      </div>
    );
  }

  // Exam phase
  if (!q) return <div>Loading...</div>;
  const userAnswer = answers[q.id];
  const isCorrect = userAnswer === q.correct;
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span className="text-muted" style={{ fontSize: 13 }}>Question {currentQ + 1} of {questions.length}</span>
          <span style={{ marginLeft: 12 }}>{selectedCategory?.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {q.difficulty && <span className="badge badge-cyan">{q.difficulty}</span>}
          {q.nbrc_type && <span className="badge badge-purple">{q.nbrc_type}</span>}
        </div>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-main)', transition: 'width 0.3s' }} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>{q.question}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options && Object.entries(q.options).map(([letter, text]) => {
            let btnBg = 'rgba(255,255,255,0.04)';
            let btnBorder = 'var(--border)';
            let btnColor = 'var(--text-primary)';
            if (userAnswer) {
              if (letter === q.correct) { btnBg = 'rgba(0,255,157,0.1)'; btnBorder = '#00ff9d'; btnColor = '#00ff9d'; }
              else if (letter === userAnswer && !isCorrect) { btnBg = 'rgba(255,51,102,0.1)'; btnBorder = '#ff3366'; btnColor = '#ff3366'; }
            }
            return (
              <button key={letter} onClick={() => handleAnswer(q.id, letter)} disabled={!!userAnswer}
                style={{ padding: '14px 16px', border: `1px solid ${btnBorder}`, borderRadius: 'var(--radius)', background: btnBg, color: btnColor, cursor: userAnswer ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 14, transition: 'all 0.2s', display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{letter}.</span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <div className={isCorrect ? 'success-box' : 'danger-box'} style={{ marginBottom: 12 }}>
            <strong>{isCorrect ? '✓ Correct!' : `✗ Incorrect — Answer: ${q.correct}`}</strong>
            <div style={{ marginTop: 8, lineHeight: 1.6 }}>{q.explanation}</div>
          </div>
          {teachingPoint && (
            <div className="info-box" style={{ marginBottom: 12 }}>
              <strong>📖 Teaching Point:</strong><br />{teachingPoint}
            </div>
          )}
          {q.reference && (
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>📚 Reference: {q.reference}</div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={nextQuestion}>
            {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        </div>
      )}
    </div>
  );
}
