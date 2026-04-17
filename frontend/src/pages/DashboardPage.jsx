import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ScoreChart({ sessions }) {
  if (sessions.length < 2) return null;
  const scores = sessions.slice().reverse().map(s => parseInt(s.score)).filter(Boolean);
  const dates = sessions.slice().reverse().map(s => new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const min = Math.max(0, Math.min(...scores) - 10);
  const max = Math.min(100, Math.max(...scores) + 10);
  const W = 600, H = 140, PAD = 20;
  const xStep = (W - PAD * 2) / (scores.length - 1);
  const yScale = (H - PAD * 2) / (max - min);
  const points = scores.map((s, i) => ({ x: PAD + i * xStep, y: H - PAD - (s - min) * yScale }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 280 }}>
        {[0, 1, 2, 3].map(i => {
          const y = PAD + (H - PAD * 2) * i / 3;
          const val = Math.round(max - (max - min) * i / 3);
          return (
            <g key={i}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e5e9e5" strokeWidth="0.5" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca39c">{val}</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#16a34a" strokeWidth="2" />
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca39c">{dates[i]}</text>
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#16a34a">{scores[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ value, label, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e5e9e5', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#0a1a0a', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#374237', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca39c', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TrendBadge({ sessions }) {
  if (sessions.length < 2) return null;
  const scores = sessions.slice(0, 3).map(s => parseInt(s.score)).filter(Boolean);
  if (scores.length < 2) return null;
  const latest = scores[0];
  const prev = scores[scores.length - 1];
  const diff = latest - prev;
  if (diff === 0) return null;
  const up = diff > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: up ? '#f0fdf4' : '#fef2f2', color: up ? '#16a34a' : '#dc2626', border: `1px solid ${up ? '#bbf7d0' : '#fecaca'}` }}>
      {up ? '↑' : '↓'} {Math.abs(diff)} pts vs last session
    </span>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    Promise.all([api.history(), api.quota()])
      .then(([h, q]) => { setSessions(h.sessions); setQuota(q); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasSessions = sessions.length > 0;
  const bestScore = hasSessions ? Math.max(...sessions.map(s => parseInt(s.score) || 0)) : null;
  const latestScore = hasSessions ? parseInt(sessions[0]?.score) : null;
  const avgScore = hasSessions ? Math.round(sessions.reduce((a, s) => a + (parseInt(s.score) || 0), 0) / sessions.filter(s => s.score).length) : null;
  const scoreColor = latestScore >= 75 ? '#16a34a' : latestScore >= 55 ? '#d97706' : '#dc2626';
  const mostUsedClub = hasSessions ? (() => {
    const clubs = sessions.map(s => s.club).filter(Boolean);
    return clubs.sort((a, b) => clubs.filter(c => c === b).length - clubs.filter(c => c === a).length)[0];
  })() : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 768px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .stat-row { flex-wrap: wrap !important; }
          .stat-row > div { min-width: calc(50% - 6px) !important; }
          .nav-name { display: none !important; }
          .hero-inner { flex-direction: column !important; gap: 16px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700 }}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="nav-name" style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {user.name.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/analyze')} style={nb}>Analyze</button>
          <button onClick={() => navigate('/history')} style={nb}>History</button>
          <button onClick={logout} style={{ ...nb, color: '#dc2626' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca39c' }}>Loading your dashboard...</div>
        ) : !hasSession ? null : null}

        {/* EMPTY STATE */}
        {!loading && !hasSessions && (
          <div>
            {/* Hero welcome */}
            <div style={{ background: '#0a1a0a', borderRadius: 20, padding: '40px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px), repeating-linear-gradient(90deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 13, color: '#4ade80', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {getGreeting()}, {user.name.split(' ')[0]}
                </div>
                <h1 style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", color: '#f0fdf0', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.2 }}>
                  Your golf game is about<br />to level up. 🏌️
                </h1>
                <p style={{ fontSize: 15, color: '#6b7a6b', lineHeight: 1.8, margin: '0 0 28px', maxWidth: 540 }}>
                  30 years of muscle memory meets AI coaching. Upload your first swing and discover exactly what's holding you back — and precisely how to fix it.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/analyze')} style={{ padding: '14px 28px', background: '#4ade80', color: '#0a1a0a', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif' }}>
                    Analyze my first swing →
                  </button>
                </div>
              </div>
            </div>

            {/* What to expect cards */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca39c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>What happens when you analyze</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: '🎬', title: 'Upload your swing', desc: 'Face-on or down-the-line. Our AI extracts 8 key frames automatically — no editing needed.' },
                  { icon: '🤖', title: 'AI analyzes every frame', desc: 'Claude examines your setup, rotation, club plane, impact position and follow-through in detail.' },
                  { icon: '📈', title: 'Get your coaching report', desc: 'A swing score, phase-by-phase breakdown, top 3 fixes with drills and YouTube links.' },
                ].map((item) => (
                  <div key={item.title} style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e5e9e5' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0a1a0a', marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7a6b', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational quote */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e5e9e5', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>⛳</div>
              <div>
                <div style={{ fontSize: 14, color: '#374237', lineHeight: 1.7, fontStyle: 'italic' }}>
                  "The difference between a good golfer and a great one isn't talent — it's knowing exactly what to fix and drilling it with purpose."
                </div>
                <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 6 }}>ForeAI coaches you like a pro, available every time you practice.</div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE STATE — has sessions */}
        {!loading && hasSessions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Hero greeting + score */}
            <div style={{ background: '#0a1a0a', borderRadius: 20, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px), repeating-linear-gradient(90deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px)' }} />
              <div className="hero-inner" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#4ade80', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {getGreeting()}, {user.name.split(' ')[0]}
                  </div>
                  <h1 style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", color: '#f0fdf0', fontWeight: 700, margin: '0 0 10px' }}>
                    {sessions.length === 1 ? "You've taken your first step." : `${sessions.length} sessions and climbing.`}
                  </h1>
                  <p style={{ fontSize: 14, color: '#6b7a6b', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 480 }}>
                    {sessions.length === 1
                      ? "You have your baseline score. Every session from here is progress. Let's get to work on those fixes."
                      : sessions.length < 5
                      ? `You're building momentum. Most golfers see real improvement around session 5-6. You're ${5 - sessions.length} away!`
                      : "You're a regular — your swing data tells a real story. Keep drilling those priorities."}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => navigate('/analyze')} style={{ padding: '11px 22px', background: '#4ade80', color: '#0a1a0a', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      + Analyze new swing
                    </button>
                    {quota && (
                      <span style={{ fontSize: 12, color: '#4b5e4b' }}>
                        {quota.remaining} free analysis{quota.remaining !== 1 ? 'es' : ''} left today
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 72, fontWeight: 700, color: scoreColor === '#16a34a' ? '#4ade80' : scoreColor, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
                    {latestScore}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5e4b', marginTop: 4 }}>latest score</div>
                  <div style={{ marginTop: 8 }}>
                    <TrendBadge sessions={sessions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="stat-row" style={{ display: 'flex', gap: 12 }}>
              <StatCard value={sessions.length} label="Total sessions" sub="Keep it up!" />
              <StatCard value={bestScore} label="Best score" sub="Personal best" color="#16a34a" />
              <StatCard value={avgScore} label="Average score" sub="All sessions" color="#d97706" />
              <StatCard value={mostUsedClub || '—'} label="Favorite club" sub="Most analyzed" />
            </div>

            {/* Progress chart */}
            {sessions.length >= 2 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e5e9e5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a' }}>Swing score progress</div>
                    <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 2 }}>Your score over time — keep that line trending up!</div>
                  </div>
                </div>
                <ScoreChart sessions={sessions} />
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e5e9e5' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a', marginBottom: 8 }}>Swing score progress</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', background: '#f8faf8', borderRadius: 12 }}>
                  <div style={{ fontSize: 40 }}>📊</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0a1a0a', marginBottom: 4 }}>Your progress chart starts with session 2</div>
                    <div style={{ fontSize: 13, color: '#6b7a6b', lineHeight: 1.6 }}>
                      You have your baseline score of <strong>{latestScore}</strong>. Analyze another swing and watch your trend line appear. Every point up is real improvement!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent sessions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a' }}>Recent sessions</div>
                {sessions.length > 3 && (
                  <button onClick={() => navigate('/history')} style={{ fontSize: 13, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                    View all {sessions.length} →
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.slice(0, 3).map((s) => {
                  const sc = parseInt(s.score);
                  const col = sc >= 75 ? '#16a34a' : sc >= 55 ? '#d97706' : '#dc2626';
                  return (
                    <div key={s.id} onClick={() => navigate(`/history`)} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e5e9e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#16a34a'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e9e5'}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f4f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: col, fontFamily: "'Playfair Display', serif" }}>{sc || '—'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#9ca39c' }}>
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {s.view_type && ` · ${s.view_type}`}
                        </div>
                        {s.summary && <div style={{ fontSize: 12, color: '#6b7a6b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.summary}</div>}
                      </div>
                      <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, flexShrink: 0 }}>View →</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const nb = { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 };
