import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';
import AnalysisReport from '../components/AnalysisReport.jsx';

const CLUBS = ['Driver', '3-Wood', '5-Wood', 'Hybrid', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'];

function StepLabel({ number, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a1a0a', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {number}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#0a1a0a' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function VideoUploader({ label, badge, badgeColor, hint, frameCount, videoUrl, frames, extracting, onUpload, onAutoExtract, onCapture, onRemoveFrame, onClear, videoRef, canvasRef }) {
  const s = styles;
  return (
    <div style={{
      border: badge === 'Required' ? '1.5px solid #16a34a' : '1.5px dashed #d1d5d1',
      borderRadius: 12, padding: '16px', background: badge === 'Required' ? '#fff' : '#fafbfa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0a1a0a' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: badgeColor === 'green' ? '#f0fdf4' : '#f4f7f4',
          color: badgeColor === 'green' ? '#16a34a' : '#9ca39c',
          border: `1px solid ${badgeColor === 'green' ? '#bbf7d0' : '#e5e9e5'}`,
          letterSpacing: '0.05em',
        }}>{badge}</span>
      </div>
      <div style={{ fontSize: 12, color: '#9ca39c', marginBottom: 12 }}>{hint}</div>

      {!videoUrl ? (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #d1d5d1', borderRadius: 10, padding: '28px 16px', cursor: 'pointer', textAlign: 'center', background: '#fff' }}>
          <input type="file" accept="video/*" onChange={onUpload} style={{ display: 'none' }} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
          <div style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 13, marginBottom: 3 }}>Click to browse</div>
          <div style={{ fontSize: 11, color: '#b0b8b0' }}>MP4, MOV, AVI — max 100MB</div>
        </label>
      ) : (
        <div>
          <video ref={videoRef} src={videoUrl} controls
            onLoadedMetadata={() => onAutoExtract(videoRef.current)}
            style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 180 }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#9ca39c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                {extracting ? `⏳ Extracting ${frameCount} frames...` : `${frames.length} frames captured`}
              </span>
              {frames.length > 0 && !extracting && (
                <button onClick={onClear} style={s.btnGhost}>Remove video</button>
              )}
            </div>

            {extracting ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#9ca39c', fontSize: 12, background: '#f8faf8', borderRadius: 8 }}>
                🎞️ Extracting key frames automatically...
              </div>
            ) : frames.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                  {frames.map((frame, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                      <img src={frame.thumb} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 3 }}>
                        {frame.time.toFixed(1)}s
                      </div>
                      <button onClick={() => onRemoveFrame(i)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(220,38,38,0.9)', border: 'none', color: '#fff', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: 11, lineHeight: '16px', padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, padding: '7px 10px', background: '#f8faf8', borderRadius: 7, fontSize: 11, color: '#6b7a6b', lineHeight: 1.5 }}>
                  💡 Tap × on any frame to remove it, then scrub the video and tap <strong>+ Capture</strong> to replace it.
                </div>
              </>
            ) : null}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => onAutoExtract(videoRef.current)} disabled={extracting} style={s.btnPrimary}>⚡ Re-extract</button>
              <button onClick={onCapture} style={s.btnSecondary}>+ Capture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [faceOnUrl, setFaceOnUrl] = useState('');
  const [dtlUrl, setDtlUrl] = useState('');
  const [faceOnFrames, setFaceOnFrames] = useState([]);
  const [dtlFrames, setDtlFrames] = useState([]);
  const [faceOnExtracting, setFaceOnExtracting] = useState(false);
  const [dtlExtracting, setDtlExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [club, setClub] = useState('');
  const [notes, setNotes] = useState('');
  const [quota, setQuota] = useState(null);
  const [clubError, setClubError] = useState(false);

  const faceOnVideoRef = useRef(null);
  const faceOnCanvasRef = useRef(null);
  const dtlVideoRef = useRef(null);
  const dtlCanvasRef = useRef(null);

  async function extractFrames(videoElement, count, setFrames, setExtracting) {
    if (!videoElement) return;
    setExtracting(true);
    setFrames([]);
    const duration = videoElement.duration;
    const times = Array.from({ length: count }, (_, i) => (duration / (count - 1)) * i);
    const captured = [];
    const canvas = document.createElement('canvas');
    for (const t of times) {
      await new Promise((res) => {
        videoElement.currentTime = t;
        videoElement.onseeked = () => {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          canvas.getContext('2d').drawImage(videoElement, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const thumb = (() => { const c2 = document.createElement('canvas'); c2.width = 160; c2.height = 90; c2.getContext('2d').drawImage(videoElement, 0, 0, 160, 90); return c2.toDataURL('image/jpeg', 0.5); })();
          captured.push({ data: dataUrl.split(',')[1], thumb, time: t });
          res();
        };
      });
    }
    setFrames(captured);
    setExtracting(false);
  }

  function handleUpload(setUrl, setFrames, e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError('Video must be under 100MB'); return; }
    setUrl(URL.createObjectURL(file));
    setFrames([]);
    setError('');
  }

  function captureFrame(videoRef, canvasRef, setFrames) {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas) return;
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext('2d').drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFrames(f => f.length >= 12 ? f : [...f, { data: dataUrl.split(',')[1], thumb: canvas.toDataURL('image/jpeg', 0.3), time: vid.currentTime }]);
  }

  const totalFrames = faceOnFrames.length + dtlFrames.length;
  const isExtracting = faceOnExtracting || dtlExtracting;
  const canAnalyze = totalFrames > 0 && !isExtracting && !analyzing && club !== '';

  function getViewType() {
    if (faceOnFrames.length > 0 && dtlFrames.length > 0) return 'both angles';
    if (faceOnFrames.length > 0) return 'face-on';
    if (dtlFrames.length > 0) return 'down-the-line';
    return 'unknown';
  }

  async function runAnalysis() {
    if (!club) { setClubError(true); setError('Please select a club before analyzing.'); return; }
    if (!canAnalyze) return;
    setClubError(false);
    setAnalyzing(true);
    setError('');
    try {
      const labeledFrames = [
        ...faceOnFrames.map(f => ({ data: f.data, mediaType: 'image/jpeg' })),
        ...dtlFrames.map(f => ({ data: f.data, mediaType: 'image/jpeg' })),
      ];
      const result = await api.analyze({
        frames: labeledFrames,
        club,
        viewType: getViewType(),
        notes: `${notes ? notes + '\n\n' : ''}Frame breakdown: ${faceOnFrames.length} face-on, ${dtlFrames.length} down-the-line.`,
        title: `${club} — ${getViewType()}`,
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
    return <AnalysisReport report={report} quota={quota}
      onNewAnalysis={() => { setReport(null); setFaceOnFrames([]); setDtlFrames([]); setFaceOnUrl(''); setDtlUrl(''); setClub(''); setNotes(''); }}
      userName={user.name} />;
  }

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />

      <nav style={s.nav}>
        <div style={s.logo}>Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {user.name.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/history')} style={s.navLink}>History</button>
          <button onClick={logout} style={{ ...s.navLink, color: '#dc2626' }}>Sign out</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Analyze your swing</h1>
          <p style={s.subtitle}>Follow the steps below — upload at least one video to get started.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

          {/* LEFT COLUMN — main steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Step 1 — Club selection */}
            <div style={s.card}>
              <StepLabel number="1" title="Select your club" subtitle="Required — affects how your swing positions are evaluated" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {CLUBS.map((c) => (
                  <button key={c} onClick={() => { setClub(c); setClubError(false); setError(''); }} style={{
                    padding: '8px 4px', border: `1.5px solid ${club === c ? '#16a34a' : clubError ? '#fca5a5' : '#e5e9e5'}`,
                    borderRadius: 8, fontSize: 12, fontWeight: club === c ? 600 : 400,
                    background: club === c ? '#f0fdf4' : '#fff',
                    color: club === c ? '#16a34a' : '#374237',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.15s',
                  }}>{c}</button>
                ))}
              </div>
              {clubError && <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626' }}>⚠️ Please select a club to continue.</div>}
            </div>

            {/* Step 2 — Video uploads */}
            <div style={s.card}>
              <StepLabel number="2" title="Upload your swing video(s)" subtitle="Face-on is required — down-the-line is optional but recommended" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <VideoUploader
                  label="Face-on view" badge="Required" badgeColor="green"
                  hint="Film from directly in front. Best for rotation, posture & weight transfer."
                  frameCount={8} videoUrl={faceOnUrl} frames={faceOnFrames} extracting={faceOnExtracting}
                  onUpload={(e) => handleUpload(setFaceOnUrl, setFaceOnFrames, e)}
                  onAutoExtract={(vid) => extractFrames(vid, 8, setFaceOnFrames, setFaceOnExtracting)}
                  onCapture={() => captureFrame(faceOnVideoRef, faceOnCanvasRef, setFaceOnFrames)}
                  onRemoveFrame={(i) => setFaceOnFrames(f => f.filter((_, idx) => idx !== i))}
                  onClear={() => { setFaceOnUrl(''); setFaceOnFrames([]); }}
                  videoRef={faceOnVideoRef} canvasRef={faceOnCanvasRef}
                />
                <VideoUploader
                  label="Down-the-line view" badge="Optional" badgeColor="gray"
                  hint="Film from behind, along the target line. Best for club path & plane."
                  frameCount={4} videoUrl={dtlUrl} frames={dtlFrames} extracting={dtlExtracting}
                  onUpload={(e) => handleUpload(setDtlUrl, setDtlFrames, e)}
                  onAutoExtract={(vid) => extractFrames(vid, 4, setDtlFrames, setDtlExtracting)}
                  onCapture={() => captureFrame(dtlVideoRef, dtlCanvasRef, setDtlFrames)}
                  onRemoveFrame={(i) => setDtlFrames(f => f.filter((_, idx) => idx !== i))}
                  onClear={() => { setDtlUrl(''); setDtlFrames([]); }}
                  videoRef={dtlVideoRef} canvasRef={dtlCanvasRef}
                />
              </div>
            </div>

            {/* Step 3 — Notes */}
            <div style={s.card}>
              <StepLabel number="3" title="Notes for your coach" subtitle="Optional — tell Claude what you're working on or struggling with" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I'm struggling with slicing, feel like I'm coming over the top, or losing power at impact..."
                style={{ ...s.textarea }} />
            </div>
          </div>

          {/* RIGHT COLUMN — sticky summary + analyze */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Summary card */}
            <div style={{ ...s.card, background: canAnalyze ? '#f0fdf4' : '#f8faf8', border: canAnalyze ? '1.5px solid #bbf7d0' : '1px solid #e5e9e5' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#9ca39c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Session summary</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SummaryRow label="Club" value={club || '—'} done={!!club} required />
                <SummaryRow label="Face-on frames" value={faceOnExtracting ? 'Extracting...' : faceOnFrames.length > 0 ? `${faceOnFrames.length} frames` : 'Not uploaded'} done={faceOnFrames.length > 0} required />
                <SummaryRow label="Down-the-line" value={dtlExtracting ? 'Extracting...' : dtlFrames.length > 0 ? `${dtlFrames.length} frames` : 'Not uploaded'} done={dtlFrames.length > 0} required={false} />
                <SummaryRow label="Total frames" value={totalFrames > 0 ? `${totalFrames} frames` : '—'} done={totalFrames > 0} />
              </div>

              {totalFrames > 0 && club && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 8, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                  {faceOnFrames.length > 0 && dtlFrames.length > 0
                    ? '🎯 Dual-angle — best possible analysis!'
                    : '✓ Ready to analyze — add down-the-line for more depth'}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button onClick={runAnalysis} disabled={!canAnalyze} style={{
              padding: '18px', background: !canAnalyze ? '#d1d5d1' : '#0a1a0a',
              color: !canAnalyze ? '#9ca39c' : '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 500, cursor: !canAnalyze ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', width: '100%',
            }}>
              {analyzing ? '🤖 Analyzing your swing...' :
                isExtracting ? '⏳ Extracting frames...' :
                canAnalyze ? `🏌️ Analyze ${totalFrames} frames →` : '🏌️ Analyze swing →'}
            </button>

            {analyzing && (
              <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7a6b', lineHeight: 1.8 }}>
                Examining your {club} swing...<br />
                Checking setup, rotation, club plane,<br />impact position and follow-through.
              </div>
            )}

            {/* Quota info */}
            {quota && (
              <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca39c' }}>
                {quota.remaining} free analysis{quota.remaining !== 1 ? 'es' : ''} remaining today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, done, required }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: '#6b7a6b' }}>{label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}</span>
      <span style={{ fontWeight: 500, color: done ? '#16a34a' : '#9ca39c' }}>
        {done ? '✓ ' : ''}{value}
      </span>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700 },
  navLink: { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },
  container: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px' },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' },
  subtitle: { fontSize: 15, color: '#6b7a6b', margin: 0 },
  card: { background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e9e5' },
  textarea: { width: '100%', padding: '12px', border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", outline: 'none', height: 100, resize: 'vertical' },
  btnPrimary: { padding: '7px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnSecondary: { padding: '7px 12px', background: '#f4f7f4', color: '#374237', border: '1px solid #d1d5d1', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnGhost: { padding: '4px 8px', background: 'none', color: '#9ca39c', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};
