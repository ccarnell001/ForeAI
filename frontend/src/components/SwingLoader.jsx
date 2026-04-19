export default function SwingLoader({ status }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes swing {
          0%   { transform: rotate(-35deg); }
          50%  { transform: rotate(35deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes ballRoll {
          0%   { transform: translateX(-8px); opacity: 0.3; }
          50%  { transform: translateX(8px);  opacity: 1; }
          100% { transform: translateX(-8px); opacity: 0.3; }
        }
        @keyframes dot1 { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes dot2 { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes dot3 { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Golfer silhouette swinging */}
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
        <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, animation: 'swing 1.4s ease-in-out infinite', transformOrigin: '40px 24px' }}>
          {/* Head */}
          <circle cx="40" cy="14" r="8" fill="#0a1a0a" />
          {/* Body */}
          <line x1="40" y1="22" x2="40" y2="50" stroke="#0a1a0a" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Left arm + club */}
          <line x1="40" y1="32" x2="18" y2="44" stroke="#0a1a0a" strokeWidth="3" strokeLinecap="round"/>
          <line x1="18" y1="44" x2="10" y2="68" stroke="#0a1a0a" strokeWidth="2" strokeLinecap="round"/>
          {/* Right arm */}
          <line x1="40" y1="32" x2="58" y2="40" stroke="#0a1a0a" strokeWidth="3" strokeLinecap="round"/>
          {/* Left leg */}
          <line x1="40" y1="50" x2="30" y2="72" stroke="#0a1a0a" strokeWidth="3" strokeLinecap="round"/>
          {/* Right leg */}
          <line x1="40" y1="50" x2="52" y2="70" stroke="#0a1a0a" strokeWidth="3" strokeLinecap="round"/>
        </svg>

        {/* Golf ball rolling */}
        <div style={{
          position: 'absolute', bottom: -4, left: '50%',
          width: 10, height: 10, borderRadius: '50%',
          background: '#fff', border: '1.5px solid #d1d5d1',
          animation: 'ballRoll 1.4s ease-in-out infinite',
          transform: 'translateX(-50%)',
        }} />
      </div>

      {/* Status text */}
      <div style={{ fontSize: 15, fontWeight: 500, color: '#0a1a0a', marginBottom: 8, textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
        {status || 'Gemini AI is analyzing your swing...'}
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
            animation: `dot${i+1} 1.2s ${delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}>
        {[
          { label: 'Video uploaded', done: status?.includes('watching') || status?.includes('Analyzing') },
          { label: 'Gemini watching your swing', done: status?.includes('Analyzing') },
          { label: 'Generating coaching report', done: false },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: step.done ? '#16a34a' : '#e5e9e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', fontWeight: 700,
              transition: 'background 0.5s',
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 13, color: step.done ? '#16a34a' : '#9ca39c', fontWeight: step.done ? 500 : 400 }}>
              {step.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#9ca39c', textAlign: 'center', lineHeight: 1.6 }}>
        This takes 20–40 seconds — Gemini is<br />watching your entire swing in detail.
      </div>
    </div>
  );
}
