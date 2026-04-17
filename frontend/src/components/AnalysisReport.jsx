import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function AnalysisReport({ report, quota, onNewAnalysis, userName }) {
  const [activePhase, setActivePhase] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const score = report.overallScore;
  const scoreColor = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 768px) {
          .report-two-col { grid-template-columns: 1fr !important; }
          .report-hero { flex-direction: column !important; }
          .nav-name { display: none !important; }
        }
      `}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="nav-name" style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {userName?.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/history')} style={nb}>History</button>
          <button onClick={onNewAnalysis} style={{ ...nb, background: '#0a1a0a', color: '#fff', borderRadius: 8, padding: '7px 14px' }}>+ New</button>
          <button onClick={logout} style={{ ...nb, color: '#dc2626' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Hero */}
        <div className="report-hero" style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e5e9e5', marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca39c', marginBottom: 6 }}>Swing analysis for {userName}</div>
            <h1 style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 10px' }}>Your coaching report</h1>
            <p style={{ fontSize: 14, color: '#374237', lineHeight: 1.7, margin: '0 0 12px' }}>{report.summary}</p>
            {report.viewType && (
              <span style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px' }}>
                {report.viewType} view
              </span>
            )}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{score}</div>
            <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 2 }}>overall score</div>
            {quota && <div style={{ marginTop: 10, fontSize: 11, color: '#9ca39c' }}>{quota.remaining} analyses left today</div>}
          </div>
        </div>

        <div className="report-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Phases */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a', margin: '0 0 14px' }}>Swing phases</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
              {report.phases?.map((phase, i) => (
                <button key={i} onClick={() => setActivePhase(i)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 14px', border: '1px solid #e5e9e5', borderRadius: 10,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  background: activePhase === i ? '#0a1a0a' : '#fff',
                  color: activePhase === i ? '#fff' : '#374237', transition: 'all 0.15s',
                }}>
                  <span>{phase.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 50, height: 4, borderRadius: 2, background: activePhase === i ? 'rgba(255,255,255,0.2)' : '#e5e9e5', overflow: 'hidden' }}>
                      <div style={{ width: `${phase.score}%`, height: '100%', background: phase.score >= 75 ? '#4ade80' : phase.score >= 55 ? '#fbbf24' : '#f87171', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, minWidth: 22 }}>{phase.score}</span>
                  </div>
                </button>
              ))}
            </div>
            {report.phases?.[activePhase] && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e9e5' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0a1a0a', marginBottom: 10 }}>{report.phases[activePhase].name}</div>
                {report.phases[activePhase].positives?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={miniLabel}>What's working</div>
                    {report.phases[activePhase].positives.map((p, i) => <div key={i} style={{ fontSize: 13, color: '#16a34a', marginBottom: 3, lineHeight: 1.5 }}>✓ {p}</div>)}
                  </div>
                )}
                {report.phases[activePhase].improvements?.length > 0 && (
                  <div>
                    <div style={miniLabel}>To improve</div>
                    {report.phases[activePhase].improvements.map((item, i) => <div key={i} style={{ fontSize: 13, color: '#374237', marginBottom: 3, lineHeight: 1.5 }}>→ {item}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priorities */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a', margin: '0 0 14px' }}>Your top priorities</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {report.topPriorities?.map((p, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e9e5' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0a1a0a', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#0a1a0a', marginBottom: 5, fontSize: 14 }}>{p.title}</div>
                      <div style={{ fontSize: 13, color: '#6b7a6b', lineHeight: 1.6, marginBottom: 8 }}>{p.description}</div>
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 3 }}>Drill: {p.drill}</div>
                        <div style={{ fontSize: 12, color: '#374237', lineHeight: 1.6 }}>{p.drillDescription}</div>
                      </div>
                      {p.youtubeSearch && (
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.youtubeSearch)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, textDecoration: 'none' }}>
                          ▶ Watch on YouTube →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {report.prosToStudy?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e9e5', marginBottom: 14 }}>
                <div style={miniLabel}>Pros to study</div>
                {report.prosToStudy.map((pro, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#0a1a0a' }}>{pro.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7a6b' }}>{pro.reason}</div>
                  </div>
                ))}
              </div>
            )}

            {report.encouragement && (
              <div style={{ background: '#0a1a0a', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 6 }}>From your AI coach</div>
                <p style={{ fontSize: 13, color: '#d1fae5', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{report.encouragement}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const nb = { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 };
const miniLabel = { fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca39c', marginBottom: 6 };
