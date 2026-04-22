import { useEffect, useRef, useState } from 'react';

const COLORS = {
  red: '#ef4444',
  yellow: '#facc15',
  cyan: '#22d3ee',
  white: '#ffffff',
  orange: '#fb923c',
};

export default function AnnotatedFrame({ frameImage, annotations = [], phaseName }) {
  const canvasRef = useRef(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [expanded, setExpanded] = useState(false);

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

          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(2, img.width / 320);
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;

          if (ann.type === 'HEAD_POSITION') {
            // Draw circle for head
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const r = Math.abs(x2 - x1) / 2 || 30;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.stroke();
          } else {
            // Draw line with arrowhead for directional types
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrowhead for directional annotations
            if (ann.type === 'WEIGHT_SHIFT' || ann.type === 'CLUB_PATH') {
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const arrowLen = Math.max(16, img.width / 60);
              ctx.beginPath();
              ctx.moveTo(x2, y2);
              ctx.lineTo(
                x2 - arrowLen * Math.cos(angle - Math.PI / 6),
                y2 - arrowLen * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(x2, y2);
              ctx.lineTo(
                x2 - arrowLen * Math.cos(angle + Math.PI / 6),
                y2 - arrowLen * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
            }

            // Dot at each end
            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x1, y1, Math.max(3, img.width / 200), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y2, Math.max(3, img.width / 200), 0, Math.PI * 2);
            ctx.fill();
          }

          // Label
          if (ann.label) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.fillStyle = color;
            ctx.font = `bold ${Math.max(12, img.width / 80)}px sans-serif`;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 - 8;
            ctx.fillText(ann.label, midX, midY);
          }
        });
      }
    };
    img.src = `data:image/jpeg;base64,${frameImage}`;
  }, [frameImage, annotations, showAnnotations]);

  if (!frameImage) return null;

  return (
    <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', background: '#000' }}>

      {/* Frame header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: '#0a1a0a',
      }}>
        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
          📸 {phaseName} frame
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {annotations?.length > 0 && (
            <button onClick={() => setShowAnnotations(v => !v)} style={{
              fontSize: 11, color: showAnnotations ? '#4ade80' : '#6b7a6b',
              background: 'none', border: `1px solid ${showAnnotations ? '#4ade80' : '#374237'}`,
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {showAnnotations ? '✓ Coaching lines' : 'Show lines'}
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)} style={{
            fontSize: 11, color: '#9ca39c', background: 'none', border: '1px solid #374237',
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <canvas ref={canvasRef} style={{
          width: '100%', display: 'block',
          maxHeight: expanded ? 'none' : 220,
          objectFit: 'contain',
        }} />
      </div>

      {/* Annotation notes */}
      {showAnnotations && annotations?.length > 0 && (
        <div style={{ padding: '8px 12px', background: '#0a1a0a', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {annotations.map((ann, i) => (
            ann.note && (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#9ca39c', fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[ann.color] || '#fff', flexShrink: 0, marginTop: 3 }} />
                <span><strong style={{ color: COLORS[ann.color] || '#fff' }}>{ann.label}:</strong> {ann.note}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
