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
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />

      <nav style={s.nav}>
        <div style={{ ...s.logo, cursor: 'pointer' }} onClick={() => navigate('/analyze')}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {userName?.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/history')} style={s.navBtn}>History</button>
          <button onClick={onNewAnalysis} style={s.navBtnPrimary}>+ New analysis</button>
          <button onClick={logout} style={s.navBtnLogout}>Sign out</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.heroCard}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca39c', marginBottom: 8 }}>
              Swing analysis for {userName}
            </div>
            <h1 style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 12px' }}>
              Your coaching report
            </h1>
            <p style={{ fontSize: 15, color: '#374237', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 600 }}>
              {report.summary}
            </p>
            {report.viewType && (
              <span style={{ fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 12px' }}>
                {report.viewType} view
              </span>
            )}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: scoreColor, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
              {score}
            </div>
            <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 4 }}>overall score</div>
            {quota && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#9ca39c' }}>
                {quota.remaining} analysis{quota.remaining !== 1 ? 'es' : ''} left today
              </div>
            )}
          </div>
        </div>

        <div style={s.twoCol}>
          <div>
            <h2 style={s.sectionTitle}>Swing phases</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {report.phases?.map((phase, i) => (
                <button key={i} onClick={() => setActivePhase(i)} style={{
                  ...s.phaseBtn,
                  background: activePhase === i ? '#0a1a0a' : '#fff',
                  color: activePhase === i ? '#fff' : '#374237',
                }}>
                  <span>{phase.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: activePhase === i ? 'rgba(255,255,255,0.2)' : '#e5e9e5', overflow: 'hidden' }}>
                      <div style={{ width: `${phase.score}%`, height: '100%', background: phase.score >= 75 ? '#4ade80' : phase.score >= 55 ? '#fbbf24' : '#f87171', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, minWidth: 24 }}>{phase.score}</span>
                  </div>
                </button>
              ))}
            </div>

            {report.phases?.[activePhase] && (
              <div style={s.phaseDetail}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0a1a0a', marginBottom: 12 }}>
                  {report.phases[activePhase].name}
                </div>
                {report.phases[activePhase].positives?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={s.miniLabel}>What's working</div>
                    {report.phases[activePhase].positives.map((p, i) => (
                      <div key={i} style={s.positiveItem}>✓ {p}</div>
                    ))}
                  </div>
                )}
                {report.phases[activePhase].improvements?.length > 0 && (
                  <div>
                    <div style={s.miniLabel}>To improve</div>
                    {report.phases[activePhase].improvements.map((item, i) => (
                      <div key={i} style={s.improveItem}>→ {item}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 style={s.sectionTitle}>Your top priorities</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {report.topPriorities?.map((p, i) => (
                <div key={i} style={s.priorityCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a1a0a', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#0a1a0a', marginBottom: 6 }}>{p.title}</div>
                      <div style={{ fontSize: 13, color: '#6b7a6b', lineHeight: 1.6, marginBottom: 10 }}>{p.description}</div>
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 4 }}>
                          Drill: {p.drill}
                        </div>
                        <div style={{ fontSize: 13, color: '#374237', lineHeight: 1.6 }}>{p.drillDescription}</div>
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
              <div style={{ ...s.phaseDetail, marginBottom: 16 }}>
                <div style={s.miniLabel}>Pros to study</div>
                {report.prosToStudy.map((pro, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: '#0a1a0a' }}>{pro.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7a6b' }}>{pro.reason}</div>
                  </div>
                ))}
              </div>
            )}

            {report.encouragement && (
              <div style={{ background: '#0a1a0a', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 8 }}>From your AI coach</div>
                <p style={{ fontSize: 14, color: '#d1fae5', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  "{report.encouragement}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700 },
  navBtn: { fontSize: 13, color: '#6b7a6b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  navBtnPrimary: { fontSize: 13, background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },
  navBtnLogout: { fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
  heroCard: { background: '#fff', borderRadius: 16, padding: '32px', border: '1px solid #e5e9e5', marginBottom: 32, display: 'flex', justifyContent: 'space-between', gap: 32, alignItems: 'flex-start' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 500, color: '#0a1a0a', marginBottom: 16, margin: '0 0 16px' },
  phaseBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e9e5', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, transition: 'all 0.15s' },
  phaseDetail: { background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e5e9e5' },
  miniLabel: { fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca39c', marginBottom: 8 },
  positiveItem: { fontSize: 13, color: '#16a34a', marginBottom: 4, lineHeight: 1.5 },
  improveItem: { fontSize: 13, color: '#374237', marginBottom: 4, lineHeight: 1.5 },
  priorityCard: { background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e5e9e5' },
};
