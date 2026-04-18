import { useState, useRef, useEffect } from 'react';

export default function MobileFramePicker({ videoUrl, frames, onFramesChange, onDone, label, frameCount }) {
  const [previewFrame, setPreviewFrame] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [extractPct, setExtractPct] = useState(0);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    return () => { cancelRef.current = true; };
  }, []);

  async function extractFrames() {
    const vid = videoRef.current;
    if (!vid || !vid.duration || isNaN(vid.duration)) {
      setError('Video not ready yet — wait a moment and try again.');
      return;
    }
    cancelRef.current = false;
    setExtracting(true);
    setError('');
    onFramesChange([]);
    const duration = vid.duration;
    const times = Array.from({ length: frameCount }, (_, i) =>
      frameCount === 1 ? duration / 2 : (duration / (frameCount - 1)) * i
    );
    const captured = [];
    const canvas = document.createElement('canvas');
    const MAX_W = 1280;

    for (let i = 0; i < times.length; i++) {
      if (cancelRef.current) break;
      setExtractProgress(`Extracting frame ${i + 1} of ${frameCount}...`);
      setExtractPct(Math.round((i / frameCount) * 100));

      const ok = await new Promise((res) => {
        let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; res(false); } }, 8000);
        vid.currentTime = times[i];
        vid.onseeked = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          try {
            const vw = vid.videoWidth, vh = vid.videoHeight;
            const scale = vw > MAX_W ? MAX_W / vw : 1;
            const w = Math.round(vw * scale), h = Math.round(vh * scale);
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(vid, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const c2 = document.createElement('canvas');
            c2.width = 200; c2.height = Math.round(200 * (h / w));
            c2.getContext('2d').drawImage(vid, 0, 0, c2.width, c2.height);
            captured.push({ data: dataUrl.split(',')[1], thumb: c2.toDataURL('image/jpeg', 0.6), time: times[i] });
            res(true);
          } catch { res(false); }
        };
      });

      if (!ok) { setError(`Frame ${i + 1} timed out. Try re-extracting or capture manually.`); break; }
      await new Promise(r => setTimeout(r, 80));
    }

    onFramesChange(captured);
    setExtracting(false);
    setExtractProgress('');
    setExtractPct(0);
  }

  function captureCurrentFrame() {
    const vid = videoRef.current;
    if (!vid) return;
    if (frames.length >= 12) { setError('Maximum 12 frames reached'); return; }
    const canvas = document.createElement('canvas');
    const MAX_W = 1280;
    const vw = vid.videoWidth, vh = vid.videoHeight;
    const scale = vw > MAX_W ? MAX_W / vw : 1;
    const w = Math.round(vw * scale), h = Math.round(vh * scale);
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(vid, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const c2 = document.createElement('canvas');
    c2.width = 200; c2.height = Math.round(200 * (h / w));
    c2.getContext('2d').drawImage(vid, 0, 0, c2.width, c2.height);
    const newFrame = { data: dataUrl.split(',')[1], thumb: c2.toDataURL('image/jpeg', 0.6), time: vid.currentTime };
    onFramesChange([...frames, newFrame]);
    setError('');
  }

  function removeFrame(i) {
    onFramesChange(frames.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 1000,
      display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: frames.length > 0 ? '#4ade80' : '#9ca39c' }}>
            {frames.length}/{frameCount} frames
          </div>
          <button onClick={onDone} style={{
            padding: '8px 18px', background: frames.length > 0 ? '#4ade80' : '#374237',
            color: frames.length > 0 ? '#0a1a0a' : '#6b7a6b',
            border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600,
            cursor: frames.length > 0 ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Done ✓
          </button>
        </div>
      </div>

      {/* Video player - takes up most of screen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          onCanPlay={() => { if (frames.length === 0 && !extracting) extractFrames(); }}
          style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }}
        />
      </div>

      {/* Capture button */}
      <div style={{ padding: '10px 16px', background: '#111' }}>
        <button onClick={captureCurrentFrame} disabled={extracting} style={{
          width: '100%', padding: '13px', background: extracting ? '#1a2a1a' : '#16a34a',
          color: extracting ? '#4b5e4b' : '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: extracting ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {extracting ? `⏳ ${extractProgress}` : '📸 Capture this frame'}
        </button>

        {/* Progress bar during extraction */}
        {extracting && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 3, background: '#1a2a1a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#16a34a', borderRadius: 2, transition: 'width 0.3s', width: extractPct + '%' }} />
            </div>
            <button onClick={() => { cancelRef.current = true; setExtracting(false); setExtractProgress(''); setExtractPct(0); }}
              style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Cancel extraction
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</div>
        )}
      </div>

      {/* Frame strip at bottom */}
      <div style={{ background: '#0a0a0a', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 6px',
        }}>
          <div style={{ fontSize: 11, color: '#6b7a6b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            {frames.length === 0 ? 'No frames yet' : `${frames.length} frame${frames.length !== 1 ? 's' : ''} — swipe to browse`}
          </div>
          {frames.length > 0 && (
            <button onClick={extractFrames} disabled={extracting} style={{
              fontSize: 11, color: '#4ade80', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}>
              ⚡ Re-extract
            </button>
          )}
        </div>

        {frames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#374237', fontSize: 13 }}>
            {extracting ? '🎞️ Auto-extracting frames...' : 'Scrub the video above and tap "Capture this frame"'}
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 4px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          }}>
            {frames.map((frame, i) => (
              <div key={i} onClick={() => setPreviewFrame(frame)} style={{
                position: 'relative', borderRadius: 8, overflow: 'hidden',
                flexShrink: 0, width: 88, height: 66,
                scrollSnapAlign: 'start', cursor: 'pointer',
                border: '2px solid #1a2a1a',
              }}>
                <img src={frame.thumb} alt={`Frame ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 2, left: 3, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 3 }}>
                  {frame.time.toFixed(1)}s
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFrame(i); }} style={{
                  position: 'absolute', top: 3, right: 3,
                  background: 'rgba(220,38,38,0.95)', border: 'none',
                  color: '#fff', borderRadius: '50%', width: 22, height: 22,
                  cursor: 'pointer', fontSize: 14, lineHeight: '22px',
                  padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full screen frame preview */}
      {previewFrame && (
        <div onClick={() => setPreviewFrame(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          zIndex: 20, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <img src={previewFrame.thumb} alt="Frame preview" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12 }} />
          <div style={{ color: '#9ca39c', fontSize: 13, marginTop: 16 }}>
            {previewFrame.time.toFixed(2)}s — tap anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
