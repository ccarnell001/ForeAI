import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';
import AnalysisReport from '../components/AnalysisReport.jsx';

const CLUBS = ['Driver','3-Wood','5-Wood','Hybrid','3-Iron','4-Iron','5-Iron','6-Iron','7-Iron','8-Iron','9-Iron','PW','SW','LW','Putter'];

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

function VideoDropzone({ label, badge, badgeColor, hint, videoUrl, videoFile, onUpload, onClear }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  return (
    <div style={{
      border: badge === 'Required' ? '1.5px solid #16a34a' : '1.5px dashed #d1d5d1',
      borderRadius: 12, padding: 16,
      background: badge === 'Required' ? '#fff' : '#fafbfa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#0a1a0a' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: badgeColor === 'green' ? '#f0fdf4' : '#f4f7f4',
          color: badgeColor === 'green' ? '#16a34a' : '#9ca39c',
          border: `1px solid ${badgeColor === 'green' ? '#bbf7d0' : '#e5e9e5'}`,
        }}>{badge}</span>
      </div>
      <div style={{ fontSize: 12, color: '#9ca39c', marginBottom: 12 }}>{hint}</div>

      {!videoUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input ref={galleryRef} type="file" accept="video/mp4,video/quicktime,video/x-m4v,video/avi,video/webm" onChange={onUpload} style={{ display: 'none' }} />
          <input ref={cameraRef} type="file" accept="video/*" capture="environment" onChange={onUpload} style={{ display: 'none' }} />
          <button onClick={() => galleryRef.current.click()} style={{
            display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid #e5e9e5',
            borderRadius: 12, padding: '16px 18px', cursor: 'pointer', background: '#fff',
            textAlign: 'left', width: '100%', fontFamily: "'DM Sans', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#f9fef9'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e9e5'; e.currentTarget.style.background = '#fff'; }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📁</div>
            <div>
              <div style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 14 }}>Upload from gallery</div>
              <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 2 }}>Choose an existing video from your phone</div>
            </div>
          </button>
          <button onClick={() => cameraRef.current.click()} style={{
            display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid #e5e9e5',
            borderRadius: 12, padding: '16px 18px', cursor: 'pointer', background: '#fff',
            textAlign: 'left', width: '100%', fontFamily: "'DM Sans', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.background = '#fffdf7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e9e5'; e.currentTarget.style.background = '#fff'; }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎥</div>
            <div>
              <div style={{ fontWeight: 500, color: '#0a1a0a', fontSize: 14 }}>Record new video</div>
              <div style={{ fontSize: 12, color: '#9ca39c', marginTop: 2 }}>Open camera and record your swing now</div>
            </div>
          </button>
        </div>
      ) : (
        <div>
          <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 220 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
              ✓ {videoFile?.name || 'Video ready'}
              {videoFile && <span style={{ color: '#9ca39c', fontWeight: 400 }}> · {(videoFile.size / 1024 / 1024).toFixed(1)}MB</span>}
            </div>
            <button onClick={onClear} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, done, required }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f0f2f0' }}>
      <span style={{ color: '#6b7a6b' }}>{label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}</span>
      <span style={{ fontWeight: 500, color: done ? '#16a34a' : '#9ca39c' }}>{done ? '✓ ' : ''}{value}</span>
    </div>
  );
}

export default function AnalyzePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [faceOnFile, setFaceOnFile] = useState(null);
  const [faceOnUrl, setFaceOnUrl] = useState('');
  const [dtlFile, setDtlFile] = useState(null);
  const [dtlUrl, setDtlUrl] = useState('');
  const [club, setClub] = useState('');
  const [notes, setNotes] = useState('');
  const [clubError, setClubError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [quota, setQuota] = useState(null);

  function handleUpload(setFile, setUrl, e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) { setError('Video must be under 150MB'); return; }
    setFile(file);
    setUrl(URL.createObjectURL(file));
    setError('');
  }

  function getViewType() {
    if (faceOnFile && dtlFile) return 'both angles';
    if (faceOnFile) return 'face-on';
    if (dtlFile) return 'down-the-line';
    return 'unknown';
  }

  const hasVideo = faceOnFile || dtlFile;
  const canAnalyze = hasVideo && club && !analyzing;

  async function runAnalysis() {
    if (!club) { setClubError(true); setError('Please select a club before analyzing.'); return; }
    if (!hasVideo) { setError('Please upload at least one swing video.'); return; }
    setClubError(false);
    setAnalyzing(true);
    setError('');

    try {
      const primaryFile = faceOnFile || dtlFile;
      setAnalyzeStatus('Preparing your video...');

      // Warn if video is very large
      const sizeMB = primaryFile.size / 1024 / 1024;
      if (sizeMB > 80) {
        setError('Video is too large. Please trim it to under 30 seconds and try again.');
        setAnalyzing(false);
        setAnalyzeStatus('');
        return;
      }

      setAnalyzeStatus('Uploading your swing video...');

      const videoData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(primaryFile);
      });

      setAnalyzeStatus('Gemini AI is watching your swing... (20-40 seconds)');

      const result = await api.analyze({
        videoData,
        mimeType: primaryFile.type || 'video/mp4',
        club,
        viewType: getViewType(),
        notes,
        title: `${club} — ${getViewType()}`,
      });

      setReport(result.report);
      setQuota(result.quota);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
      setAnalyzeStatus('');
    }
  }

  if (report) {
    return <AnalysisReport report={report} quota={quota}
      onNewAnalysis={() => { setReport(null); setFaceOnFile(null); setFaceOnUrl(''); setDtlFile(null); setDtlUrl(''); setClub(''); setNotes(''); }}
      userName={user.name} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`@media (max-width: 768px) { .page-grid { grid-template-columns: 1fr !important; } .club-grid { grid-template-columns: repeat(3, 1fr) !important; } .nav-name { display: none !important; } .desktop-summary { display: none !important; } .mobile-analyze { display: block !important; } .video-upload-grid { grid-template-columns: 1fr !important; } } @media (min-width: 769px) { .mobile-analyze { display: none !important; } }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e9e5', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => navigate('/dashboard')} style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700, cursor: 'pointer' }}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="nav-name" style={{ fontSize: 13, color: '#6b7a6b' }}>Hey, {user.name.split(' ')[0]} 👋</span>
          <button onClick={() => navigate('/dashboard')} style={nb}>Dashboard</button>
          <button onClick={() => navigate('/history')} style={nb}>History</button>
          <button onClick={logout} style={{ ...nb, color: '#dc2626' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 6px' }}>Analyze your swing</h1>
          <p style={{ fontSize: 14, color: '#6b7a6b', margin: 0 }}>
            Upload your video, select your club, and Gemini AI will watch your entire swing and coach you.
          </p>
        </div>

        <div className="page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT — steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Step 1 — Club */}
            <div style={card}>
              <StepLabel number="1" title="Select your club" subtitle="Required — affects how your swing positions are evaluated" />
              <div className="club-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
                {CLUBS.map((c) => (
                  <button key={c} onClick={() => { setClub(c); setClubError(false); setError(''); }} style={{
                    padding: '9px 4px', border: `1.5px solid ${club === c ? '#16a34a' : clubError ? '#fca5a5' : '#e5e9e5'}`,
                    borderRadius: 8, fontSize: 12, fontWeight: club === c ? 600 : 400,
                    background: club === c ? '#f0fdf4' : '#fff', color: club === c ? '#16a34a' : '#374237',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}>{c}</button>
                ))}
              </div>
              {clubError && <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626' }}>⚠️ Please select a club to continue.</div>}
            </div>

            {/* Step 2 — Videos */}
            <div style={card}>
              <StepLabel number="2" title="Upload your swing video(s)" subtitle="Face-on is recommended — down-the-line optional for deeper analysis" />
              <div className="video-upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <VideoDropzone
                  label="Face-on view" badge="Recommended" badgeColor="green"
                  hint="Film from directly in front. Best for rotation, posture & weight transfer."
                  videoUrl={faceOnUrl} videoFile={faceOnFile}
                  onUpload={(e) => handleUpload(setFaceOnFile, setFaceOnUrl, e)}
                  onClear={() => { setFaceOnFile(null); setFaceOnUrl(''); }}
                />
                <VideoDropzone
                  label="Down-the-line view" badge="Optional" badgeColor="gray"
                  hint="Film from behind along target line. Best for club path & plane."
                  videoUrl={dtlUrl} videoFile={dtlFile}
                  onUpload={(e) => handleUpload(setDtlFile, setDtlUrl, e)}
                  onClear={() => { setDtlFile(null); setDtlUrl(''); }}
                />
              </div>
              {faceOnFile && dtlFile && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                  🎯 Two angles uploaded — Gemini will analyze both for the most complete coaching report!
                </div>
              )}
            </div>

            {/* Step 3 — Notes */}
            <div style={card}>
              <StepLabel number="3" title="Notes for your coach" subtitle="Optional — tell ForeAI what you're working on or struggling with" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I'm struggling with slicing, feel like I'm coming over the top, or losing power at impact..."
                style={{ width: '100%', padding: 12, border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", outline: 'none', height: 90, resize: 'vertical' }} />
            </div>

            {/* Mobile analyze button */}
            <div className="mobile-analyze" style={{ display: 'none' }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
              <button onClick={runAnalysis} disabled={!canAnalyze} style={{
                width: '100%', padding: 18, background: !canAnalyze ? '#d1d5d1' : '#0a1a0a',
                color: !canAnalyze ? '#9ca39c' : '#fff', border: 'none', borderRadius: 12,
                fontSize: 16, fontWeight: 500, cursor: !canAnalyze ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {analyzing ? `🤖 ${analyzeStatus || 'Analyzing...'}` : canAnalyze ? `🏌️ Analyze my swing →` : '🏌️ Analyze swing →'}
              </button>
              {analyzing && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7a6b', lineHeight: 1.8, marginTop: 12 }}>
                  Gemini AI is watching your full swing video...<br />This takes about 20-30 seconds.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — sticky summary */}
          <div className="desktop-summary" style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...card, background: canAnalyze ? '#f0fdf4' : '#f8faf8', border: canAnalyze ? '1.5px solid #bbf7d0' : '1px solid #e5e9e5' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca39c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Session summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SummaryRow label="Club" value={club || 'Not selected'} done={!!club} required />
                <SummaryRow label="Face-on video" value={faceOnFile ? `✓ ${(faceOnFile.size/1024/1024).toFixed(1)}MB` : 'Not uploaded'} done={!!faceOnFile} />
                <SummaryRow label="Down-the-line" value={dtlFile ? `✓ ${(dtlFile.size/1024/1024).toFixed(1)}MB` : 'Not uploaded'} done={!!dtlFile} />
              </div>
              {canAnalyze && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', borderRadius: 8, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                  {faceOnFile && dtlFile ? '🎯 Dual-angle — best possible analysis!' : '✓ Ready to analyze!'}
                </div>
              )}
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

            <button onClick={runAnalysis} disabled={!canAnalyze} style={{
              padding: 18, background: !canAnalyze ? '#d1d5d1' : '#0a1a0a',
              color: !canAnalyze ? '#9ca39c' : '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 500, cursor: !canAnalyze ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", width: '100%',
            }}>
              {analyzing ? `🤖 ${analyzeStatus || 'Analyzing...'}` : canAnalyze ? `🏌️ Analyze my swing →` : '🏌️ Analyze swing →'}
            </button>

            {analyzing && (
              <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7a6b', lineHeight: 1.8 }}>
                Gemini AI is watching your full swing...<br />This takes about 20-30 seconds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e9e5' };
const nb = { fontSize: 13, color: '#374237', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 };
