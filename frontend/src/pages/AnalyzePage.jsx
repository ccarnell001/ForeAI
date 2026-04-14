import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';
import AnalysisReport from '../components/AnalysisReport.jsx';

const CLUBS = ['Driver', '3-Wood', '5-Wood', 'Hybrid', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'];

export default function AnalyzePage() {
  const { user, logout } = useAuth();
  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [frames, setFrames] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [club, setClub] = useState('7-Iron');
  const [viewType, setViewType] = useState('face-on');
  const [notes, setNotes] = useState('');
  const [quota, setQuota] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be under 100MB');
      return;
    }
    setVideo(file);
    setVideoUrl(URL.createObjectURL(file));
    setFrames([]);
    setReport(null);
    setError('');
  }

  const captureFrame = useCallback(() => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas) return;
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    const thumb = canvas.toDataURL('image/jpeg', 0.3);
    setFrames((f) => {
      if (f.length >= 12) { setError('Maximum 12 frames captured'); return f; }
      setError('');
      return [...f, { data: base64, thumb, time: vid.currentTime }];
    });
  }, []);

  async function autoExtract() {
    const vid = videoRef.current;
    if (!vid) return;
    setExtracting(true);
    setFrames([]);
    setError('');
    const duration = vid.duration;
    const count = Math.min(8, Math.floor(duration / 0.1));
    const times = [];
    for (let i = 0; i < count; i++) {
      times.push((duration / (count - 1)) * i);
    }
    const captured = [];
    for (const t of times) {
      await new Promise((res) => {
        vid.currentTime = t;
        vid.onseeked = () => {
          const canvas = canvasRef.current;
          canvas.width = vid.videoWidth;
          canvas.height = vid.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(vid, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          captured.push({ data: dataUrl.split(',')[1], thumb: canvas.toDataURL('image/jpeg', 0.3), time: t });
          res();
        };
      });
    }
    setFrames(captured);
    setExtracting(false);
  }

  function removeFrame(i) {
    setFrames((f) => f.filter((_, idx) => idx !== i));
  }

  async function runAnalysis() {
    if (frames.length === 0) { setError('Capture at least 1 frame first'); return; }
    setAnalyzing(true);
    setError('');
    try {
      const result = await api.analyze({
        frames: frames.map((f) => ({ data: f.data, mediaType: 'image/jpeg' })),
        club, viewType, notes,
        title: `${club} — ${viewType}`,
      });
      setReport(result.report);
      setQuota(result.quota);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  const s = styles;

  if (report) {
    return <AnalysisReport report={report} quota={quota} onNewAnalysis={() => { setReport(null); setFrames([]); setVideo(null); setVideoUrl(''); }} userName={user.name} />;
  }

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {user.name.split(' ')[0]} 👋</span>
          <a href="/history" style={s.navLink}>History</a>
          <button onClick={logout} style={s.navBtn}>Sign out</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Analyze your swing</h1>
          <p style={s.subtitle}>Upload a video, extract key frames, and get AI coaching in seconds.</p>
        </div>

        <div style={s.grid}>
          {/* Left: Video + settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload */}
            <div style={s.card}>
              <div style={s.cardLabel}>1. Upload your swing video</div>
              {!videoUrl ? (
                <label style={s.dropzone}>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#0a1a0a' }}>Drop video here or click to browse</div>
                  <div style={{ fontSize: 12, color: '#9ca39c' }}>MP4, MOV, AVI — max 100MB · film face-on or down-the-line</div>
                </label>
              ) : (
                <div>
                  <video ref={videoRef} src={videoUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={autoExtract} disabled={extracting} style={s.btnPrimary}>
                      {extracting ? 'Extracting...' : '⚡ Auto-extract 8 frames'}
                    </button>
                    <button onClick={captureFrame} style={s.btnSecondary}>+ Capture frame</button>
                    <button onClick={() => { setVideo(null); setVideoUrl(''); setFrames([]); }} style={s.btnGhost}>Change video</button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div style={s.card}>
              <div style={s.cardLabel}>2. Session details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Club</label>
                  <select value={club} onChange={(e) => setClub(e.target.value)} style={s.select}>
                    {CLUBS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Camera angle</label>
                  <select value={viewType} onChange={(e) => setViewType(e.target.value)} style={s.select}>
                    <option value="face-on">Face-on</option>
                    <option value="down-the-line">Down the line</option>
                    <option value="both">Both angles</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Notes for your coach (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I'm struggling with slicing, or I feel like I'm coming over the top..."
                  style={{ ...s.select, height: 80, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Right: Frames + analyze */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={s.cardLabel}>3. Review frames ({frames.length}/12)</div>
                {frames.length > 0 && (
                  <button onClick={() => setFrames([])} style={s.btnGhost}>Clear all</button>
                )}
              </div>

              {frames.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca39c', fontSize: 14 }}>
                  {videoUrl ? 'Click "Auto-extract" or scrub the video and capture frames manually' : 'Upload a video to get started'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {frames.map((frame, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                      <img src={frame.thumb} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                        {frame.time.toFixed(1)}s
                      </div>
                      <button onClick={() => removeFrame(i)} style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(220,38,38,0.9)',
                        border: 'none', color: '#fff', borderRadius: '50%', width: 20, height: 20,
                        cursor: 'pointer', fontSize: 12, lineHeight: '20px', padding: 0,
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button onClick={runAnalysis} disabled={analyzing || frames.length === 0} style={{
              padding: '16px', background: analyzing || frames.length === 0 ? '#d1d5d1' : '#0a1a0a',
              color: analyzing || frames.length === 0 ? '#9ca39c' : '#fff',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500,
              cursor: analyzing || frames.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
            }}>
              {analyzing ? '🤖 ForeAI is analyzing your swing...' : `🏌️ Analyze ${frames.length > 0 ? frames.length + ' frames' : 'swing'} →`}
            </button>

            {analyzing && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7a6b', lineHeight: 1.6 }}>
                Examining your setup, rotation, club plane,<br />impact position and follow-through...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700 },
  navLink: { fontSize: 13, color: '#374237', textDecoration: 'none', fontWeight: 500 },
  navBtn: { fontSize: 13, color: '#6b7a6b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' },
  subtitle: { fontSize: 15, color: '#6b7a6b', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  card: { background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e9e5' },
  cardLabel: { fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca39c', marginBottom: 16 },
  dropzone: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5d1', borderRadius: 12, padding: '40px 20px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#374237', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  btnPrimary: { padding: '9px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnSecondary: { padding: '9px 16px', background: '#f4f7f4', color: '#374237', border: '1px solid #d1d5d1', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnGhost: { padding: '9px 16px', background: 'none', color: '#9ca39c', border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};
