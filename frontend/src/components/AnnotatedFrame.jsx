import { useEffect, useRef, useState } from 'react';

const COLORS = {
  red: '#ef4444', yellow: '#facc15', cyan: '#22d3ee',
  white: '#ffffff', orange: '#fb923c',
};

function SingleFrame({ frameImage, annotations = [], label, defaultExpanded = false }) {
  const canvasRef = useRef(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (!frameImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (showAnnotations && annotations?.length > 0) {
        annotations.forEach(ann => {
          const color = COLORS[ann.color] || '#ffffff';
          const x1 = ann.x1 * img.width;
          const y1 = ann.y1 * img.height;
          const x2 = ann.x2 * img.width;
          const y2 = ann.y2 * img.height;
          const lw = Math.max(2, img.width / 320);

          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;

          if (ann.type === 'HEAD_POSITION') {
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const r = Math.abs(x2 - x1) / 2 || 30;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (ann.type === 'WEIGHT_SHIFT' || ann.type === 'CLUB_PATH') {
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const al = Math.max(16, img.width / 60);
              ctx.beginPath();
              ctx.moveTo(x2, y2);
              ctx.lineTo(x2 - al * Math.cos(angle - Math.PI / 6), y2 - al * Math.sin(angle - Math.PI / 6));
              ctx.moveTo(x2, y2);
              ctx.lineTo(x2 - al * Math.cos(angle + Math.PI / 6), y2 - al * Math.sin(angle + Math.PI / 6));
              ctx.stroke();
            }

            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
            const dr = Math.max(3, img.width / 200);
            ctx.beginPath(); ctx.arc(x1, y1, dr, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x2, y2, dr, 0, Math.PI * 2); ctx.fill();
          }

          if (ann.label) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.fillStyle = color;
            ctx.font = `bold ${Math.max(12, img.width / 80)}px sans-serif`;
            ctx.fillText(ann.label, (x1 + x2) / 2, (y1 + y2) / 2 - 8);
          }
        });
      }
    };
    img.src = `data:image/jpeg;base64,${frameImage}`;
  }, [frameImage, annotations, showAnnotations]);

  return (
    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid #1a2a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0a1a0a' }}>
        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {annotations?.length > 0 && (
            <button onClick={() => setShowAnnotations(v => !v)} style={{
              fontSize: 10, color: showAnnotations ? '#4ade80' : '#6b7a6b',
              background: 'none', border: `1px solid ${showAnnotations ? '#374237' : '#1a2a1a'}`,
              borderRadius: 5, padding: '2px 6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              {showAnnotations ? '✓ lines' : 'lines'}
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)} style={{
            fontSize: 10, color: '#6b7a6b', background: 'none', border: '1px solid #1a2a1a',
            borderRadius: 5, padding: '2px 6px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            {expanded ? '↑' : '↓'}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} onClick={() => setExpanded(v => !v)} style={{
        width: '100%', display: 'block', cursor: 'pointer',
        maxHeight: expanded ? 'none' : 160, objectFit: 'contain',
      }} />
      {showAnnotations && annotations?.length > 0 && (
        <div style={{ padding: '6px 10px', background: '#0a1a0a', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {annotations.map((ann, i) => ann.note && (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#9ca39c', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[ann.color] || '#fff', flexShrink: 0, marginTop: 3 }} />
              <span><strong style={{ color: COLORS[ann.color] || '#fff' }}>{ann.label}:</strong> {ann.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnnotatedFrame({ frameImage, frameImage2, annotations = [], phaseName }) {
  if (!frameImage && !frameImage2) return null;

  const hasBoth = frameImage && frameImage2;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: '#9ca39c', fontFamily: "'DM Sans', sans-serif", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        📸 {phaseName} {hasBoth ? '— both angles' : '— frame'}
      </div>
      <div style={{ display: 'flex', gap: 8, flexDirection: hasBoth ? 'row' : 'column' }}>
        {frameImage && (
          <SingleFrame
            frameImage={frameImage}
            annotations={annotations}
            label={hasBoth ? '📷 Face-on' : '📷 Face-on'}
            defaultExpanded={!hasBoth}
          />
        )}
        {frameImage2 && (
          <SingleFrame
            frameImage={frameImage2}
            annotations={[]}
            label="📷 Down-the-line"
            defaultExpanded={!hasBoth}
          />
        )}
      </div>
    </div>
  );
}
