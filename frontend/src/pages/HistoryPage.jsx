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
    return <AnalysisReport report={selected.report} quota={null} onNewAnalysis={() => setSelected(null)} userName={user.name} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700 }}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/dashboard')} style={{ fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Dashboard</button>
          <button onClick={() => navigate('/analyze')} style={{ fontSize: 13, background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            + New analysis
          </button>
          <button onClick={logout} style={{ fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' }}>
          Your swing history
        </h1>
        <p style={{ fontSize: 15, color: '#6b7a6b', margin: '0 0 32px' }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca39c' }}>Loading your sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px', textAlign: 'center', border: '1px solid #e5e9e5' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏌️</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0a1a0a', marginBottom: 8 }}>No analyses yet</div>
            <div style={{ fontSize: 14, color: '#9ca39c', marginBottom: 24 }}>Upload your first swing video to get started</div>
            <button onClick={() => navigate('/analyze')} style={{ padding: '12px 24px', background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Analyze my swing →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((s) => {
              const score = s.score ? parseInt(s.score) : null;
              const scoreColor = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626';
              return (
                <div key={s.id} onClick={() => openSession(s.id)} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e5e9e5',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, transition: 'border-color 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#16a34a'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e9e5'}
                >
                  {score && (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f4f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor, fontFamily: "'Playfair Display', serif" }}>{score}</span>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: '#0a1a0a', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#9ca39c' }}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {s.view_type && ` · ${s.view_type}`}
                      {s.frame_count && ` · ${s.frame_count} frames`}
                    </div>
                    {s.summary && (
                      <div style={{ fontSize: 13, color: '#6b7a6b', marginTop: 4, lineHeight: 1.5 }}>
                        {s.summary.length > 100 ? s.summary.slice(0, 100) + '...' : s.summary}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>View →</span>
                    <button onClick={(e) => deleteSession(e, s.id)} style={{
                      fontSize: 12, color: '#f87171', background: 'none', border: 'none',
                      cursor: 'pointer', padding: '4px 8px', fontFamily: "'DM Sans', sans-serif",
                    }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {loadingSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 48px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏌️</div>
            <div style={{ fontWeight: 500 }}>Loading session...</div>
          </div>
        </div>
      )}
    </div>
  );
}
