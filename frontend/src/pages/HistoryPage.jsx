import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../components/AuthContext.jsx';
import AnalysisReport from '../components/AnalysisReport.jsx';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.history()
      .then((d) => setSessions(d.sessions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function openSession(id) {
    setLoadingSession(true);
    try {
      const data = await api.session(id);
      setSelected(data.session);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSession(false);
    }
  }

  async function deleteSession(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    await api.deleteSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (selected?.report) {
    return <AnalysisReport report={selected.report} quota={null}
      onNewAnalysis={() => setSelected(null)} userName={user.name} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 768px) {
          .history-nav-name { display: none !important; }
          .history-container { padding: 20px 16px !important; }
          .history-title { font-size: 24px !important; }
          .session-card { padding: 16px !important; }
          .session-summary { display: none !important; }
          .session-meta { font-size: 11px !important; }
          .session-title { font-size: 14px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
          .session-actions { flex-direction: column !important; gap: 4px !important; align-items: flex-end !important; }
        }
      `}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="history-nav-name" style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {user.name.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/dashboard')} style={nb}>Dashboard</button>
          <button onClick={() => navigate('/analyze')} style={{ fontSize: 13, background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            + New
          </button>
          <button onClick={logout} style={{ ...nb, color: '#dc2626' }}>Sign out</button>
        </div>
      </nav>

      <div className="history-container" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <h1 className="history-title" style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 4px' }}>
          Swing history
        </h1>
        <p style={{ fontSize: 14, color: '#6b7a6b', margin: '0 0 24px' }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca39c' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #e5e9e5' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏌️</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#0a1a0a', marginBottom: 8 }}>No sessions yet</div>
            <div style={{ fontSize: 14, color: '#9ca39c', marginBottom: 20 }}>Upload your first swing video to get started</div>
            <button onClick={() => navigate('/analyze')} style={{ padding: '12px 24px', background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Analyze my swing →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map((s) => {
              const score = s.score ? parseInt(s.score) : null;
              const scoreColor = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626';
              const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const club = s.title?.split(' —')[0] || s.title || 'Swing';
              const angle = s.view_type ? s.view_type.replace('face-on', 'Face-on').replace('down-the-line', 'DTL') : '';

              return (
                <div key={s.id} className="session-card" onClick={() => openSession(s.id)} style={{
                  background: '#fff', borderRadius: 14, padding: '18px 20px',
                  border: '1px solid #e5e9e5', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e9e5'; }}
                >
                  {/* Score circle */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: score ? '#f4f7f4' : '#f4f7f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    border: score ? `2px solid ${scoreColor}20` : '2px solid #e5e9e5',
                  }}>
                    {score
                      ? <span style={{ fontSize: 17, fontWeight: 700, color: scoreColor, fontFamily: "'Playfair Display', serif" }}>{score}</span>
                      : <span style={{ fontSize: 11, color: '#9ca39c' }}>—</span>
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="session-title" style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 15, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {club}
                    </div>
                    <div className="session-meta" style={{ fontSize: 12, color: '#9ca39c', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>{dateStr}</span>
                      {angle && <><span>·</span><span>{angle}</span></>}
                    </div>
                    <div className="session-summary" style={{ fontSize: 13, color: '#6b7a6b', marginTop: 5, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.summary}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="session-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, whiteSpace: 'nowrap' }}>View →</span>
                    <button onClick={(e) => deleteSession(e, s.id)} style={{
                      fontSize: 11, color: '#9ca39c', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '2px 0', fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loadingSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 40px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🏌️</div>
            <div style={{ fontWeight: 500, color: '#0a1a0a' }}>Loading session...</div>
          </div>
        </div>
      )}
    </div>
  );
}

const nb = { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 };
