import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';
import AnalysisReport from '../components/AnalysisReport.jsx';

const CLUBS = ['Driver', '3-Wood', '5-Wood', 'Hybrid', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'];

function VideoUploader({ label, badge, badgeColor, hint, frameCount, videoUrl, frames, extracting, onUpload, onAutoExtract, onCapture, onRemoveFrame, onClear, videoRef, canvasRef }) {
  const s = styles;
  return (
    <div style={{ ...s.card, border: badge === 'Required' ? '1.5px solid #16a34a' : '1px solid #e5e9e5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={s.cardLabel}>{label}</div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: badgeColor === 'green' ? '#f0fdf4' : '#f4f7f4',
          color: badgeColor === 'green' ? '#16a34a' : '#9ca39c',
          border: `1px solid ${badgeColor === 'green' ? '#bbf7d0' : '#e5e9e5'}`,
          letterSpacing: '0.05em',
        }}>{badge}</span>
      </div>
      <div style={{ fontSize: 12, color: '#9ca39c', marginBottom: 14 }}>{hint}</div>

      {!videoUrl ? (
        <label style={s.dropzone}>
          <input type="file" accept="video/*" onChange={onUpload} style={{ display: 'none' }} />
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
          <div style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 14, marginBottom: 4 }}>
            Drop video here or click to browse
          </div>
          <div style={{ fontSize: 12, color: '#b0b8b0' }}>MP4, MOV, AVI — max 100MB</div>
        </label>
      ) : (
        <div>
          <video ref={videoRef} src={videoUrl} controls
            onLoadedMetadata={() => onAutoExtract(videoRef.current)}
            style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 200 }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Frames grid */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#9ca39c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                {extracting ? '⏳ Extracting...' : `${frames.length} frames captured`}
              </span>
              {frames.length > 0 && !extracting && (
                <button onClick={onClear} style={s.btnGhost}>Clear</button>
              )}
            </div>

            {extracting ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca39c', fontSize: 13 }}>
                🎞️ Extracting {frameCount} key frames...
              </div>
            ) : frames.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {frames.map((frame, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                    <img src={frame.thumb} alt={`Frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>
                      {frame.time.toFixed(1)}s
                    </div>
                    <button onClick={() => onRemoveFrame(i)} style={{
                      position: 'absolute', top: 3, right: 3, background: 'rgba(220,38,38,0.9)',
                      border: 'none', color: '#fff', borderRadius: '50%', width: 16, height: 16,
                      cursor: 'pointer', fontSize: 11, lineHeight: '16px', padding: 0,
                    }}>×</button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Hint text */}
            {frames.length > 0 && !extracting && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8faf8', borderRadius: 8, fontSize: 12, color: '#6b7a6b', lineHeight: 1.5 }}>
                💡 Not happy with a frame? Hit × to remove it, then scrub the video to the right moment and tap <strong>"+ Capture"</strong> to replace it.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onAutoExtract(videoRef.current)} disabled={extracting} style={s.btnPrimary}>
              ⚡ Re-extract
            </button>
            <button onClick={onCapture} style={s.btnSecondary}>+ Capture</button>
            <button onClick={onClear} style={s.btnGhost}>Change video</button>
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
  const [club, setClub] = useState('7-Iron');
  const [notes, setNotes] = useState('');
  const [quota, setQuota] = useState(null);

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
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoElement, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          captured.push({
            data: dataUrl.split(',')[1],
            thumb: (() => { const c2 = document.createElement('canvas'); c2.width = 160; c2.height = 90; c2.getContext('2d').drawImage(videoElement, 0, 0, 160, 90); return c2.toDataURL('image/jpeg', 0.5); })(),
            time: t,
          });
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const thumb = canvas.toDataURL('image/jpeg', 0.3);
    setFrames((f) => {
      if (f.length >= 12) { setError('Maximum frames reached'); return f; }
      return [...f, { data: dataUrl.split(',')[1], thumb, time: vid.currentTime }];
    });
  }

  const totalFrames = faceOnFrames.length + dtlFrames.length;
  const canAnalyze = totalFrames > 0 && !faceOnExtracting && !dtlExtracting && !analyzing;

  // Determine view type for the report
  function getViewType() {
    if (faceOnFrames.length > 0 && dtlFrames.length > 0) return 'both angles';
    if (faceOnFrames.length > 0) return 'face-on';
    if (dtlFrames.length > 0) return 'down-the-line';
    return 'unknown';
  }

  async function runAnalysis() {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setError('');
    try {
      // Label frames by angle so Claude knows which is which
      const labeledFrames = [
        ...faceOnFrames.map(f => ({ ...f, mediaType: 'image/jpeg', angle: 'face-on' })),
        ...dtlFrames.map(f => ({ ...f, mediaType: 'image/jpeg', angle: 'down-the-line' })),
      ];
      const viewType = getViewType();
      const result = await api.analyze({
        frames: labeledFrames.map(f => ({ data: f.data, mediaType: f.mediaType })),
        club,
        viewType,
        notes: `${notes ? notes + '\n\n' : ''}Frame breakdown: ${faceOnFrames.length} face-on frame(s), ${dtlFrames.length} down-the-line frame(s).`,
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
    return <AnalysisReport report={report} quota={quota}
      onNewAnalysis={() => { setReport(null); setFaceOnFrames([]); setDtlFrames([]); setFaceOnUrl(''); setDtlUrl(''); }}
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
          <p style={s.subtitle}>Upload your swing video and get AI coaching in seconds. Add both angles for the most complete analysis.</p>
        </div>

        {/* Two video uploaders side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <VideoUploader
            label="Face-on view"
            badge="Required"
            badgeColor="green"
            hint="Film from directly in front. Best for rotation, posture & weight transfer."
            frameCount={8}
            videoUrl={faceOnUrl}
            frames={faceOnFrames}
            extracting={faceOnExtracting}
            onUpload={(e) => handleUpload(setFaceOnUrl, setFaceOnFrames, e)}
            onAutoExtract={(vid) => extractFrames(vid, 8, setFaceOnFrames, setFaceOnExtracting)}
            onCapture={() => captureFrame(faceOnVideoRef, faceOnCanvasRef, setFaceOnFrames)}
            onRemoveFrame={(i) => setFaceOnFrames(f => f.filter((_, idx) => idx !== i))}
            onClear={() => { setFaceOnUrl(''); setFaceOnFrames([]); }}
            videoRef={faceOnVideoRef}
            canvasRef={faceOnCanvasRef}
          />
          <VideoUploader
            label="Down-the-line view"
            badge="Optional"
            badgeColor="gray"
            hint="Film from behind, along the target line. Best for club path & plane analysis."
            frameCount={4}
            videoUrl={dtlUrl}
            frames={dtlFrames}
            extracting={dtlExtracting}
            onUpload={(e) => handleUpload(setDtlUrl, setDtlFrames, e)}
            onAutoExtract={(vid) => extractFrames(vid, 4, setDtlFrames, setDtlExtracting)}
            onCapture={() => captureFrame(dtlVideoRef, dtlCanvasRef, setDtlFrames)}
            onRemoveFrame={(i) => setDtlFrames(f => f.filter((_, idx) => idx !== i))}
            onClear={() => { setDtlUrl(''); setDtlFrames([]); }}
            videoRef={dtlVideoRef}
            canvasRef={dtlCanvasRef}
          />
        </div>

        {/* Session details + analyze */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={s.card}>
            <div style={s.cardLabel}>Session details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={s.label}>Club</label>
                <select value={club} onChange={(e) => setClub(e.target.value)} style={s.select}>
                  {CLUBS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Angle uploaded</label>
                <div style={{ padding: '10px 12px', border: '1.5px solid #e5e9e5', borderRadius: 8, fontSize: 14, color: '#374237', background: '#f8faf8' }}>
                  {getViewType() === 'unknown' ? 'Upload a video above' : getViewType()}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={s.label}>Notes for your coach (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I'm struggling with slicing, or I feel like I'm coming over the top..."
                style={{ ...s.select, height: 80, resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary */}
            <div style={{ ...s.card, background: totalFrames > 0 ? '#f0fdf4' : '#f8faf8', border: totalFrames > 0 ? '1px solid #bbf7d0' : '1px solid #e5e9e5' }}>
              <div style={{ fontSize: 13, color: '#374237', lineHeight: 1.7 }}>
                {totalFrames === 0 ? (
                  <span style={{ color: '#9ca39c' }}>Upload at least one video to get started.</span>
                ) : (
                  <>
                    <div style={{ fontWeight: 500, color: '#16a34a', marginBottom: 4 }}>✓ Ready to analyze</div>
                    {faceOnFrames.length > 0 && <div>• {faceOnFrames.length} face-on frames</div>}
                    {dtlFrames.length > 0 && <div>• {dtlFrames.length} down-the-line frames</div>}
                    <div style={{ marginTop: 6, fontSize: 12, color: '#6b7a6b' }}>
                      {faceOnFrames.length > 0 && dtlFrames.length > 0
                        ? '🎯 Dual-angle analysis — best possible result!'
                        : '💡 Add a down-the-line video for even deeper analysis.'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button onClick={runAnalysis} disabled={!canAnalyze} style={{
              padding: '18px', background: !canAnalyze ? '#d1d5d1' : '#0a1a0a',
              color: !canAnalyze ? '#9ca39c' : '#fff',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500,
              cursor: !canAnalyze ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', flex: 1,
            }}>
              {analyzing ? '🤖 ForeAI is analyzing your swing...' :
                faceOnExtracting || dtlExtracting ? '⏳ Extracting frames...' :
                totalFrames > 0 ? `🏌️ Analyze ${totalFrames} frames →` : '🏌️ Analyze swing →'}
            </button>

            {analyzing && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7a6b', lineHeight: 1.8 }}>
                Examining your setup, rotation, club plane,<br />
                impact position and follow-through...
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
  navLink: { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },
  container: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px' },
  header: { marginBottom: 28 },
  title: { fontSize: 32, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' },
  subtitle: { fontSize: 15, color: '#6b7a6b', margin: 0 },
  card: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e5e9e5' },
  cardLabel: { fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca39c' },
  dropzone: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5d1', borderRadius: 12, padding: '36px 20px', cursor: 'pointer', textAlign: 'center' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#374237', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  btnPrimary: { padding: '7px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnSecondary: { padding: '7px 14px', background: '#f4f7f4', color: '#374237', border: '1px solid #d1d5d1', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  btnGhost: { padding: '7px 14px', background: 'none', color: '#9ca39c', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};
