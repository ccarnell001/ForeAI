export default function SwingLoader({ status }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes ballBounce {
          0%   { transform: translateX(-60px) translateY(0px); }
          25%  { transform: translateX(-20px) translateY(-30px); }
          50%  { transform: translateX(20px)  translateY(0px); }
          75%  { transform: translateX(50px)  translateY(-20px); }
          100% { transform: translateX(-60px) translateY(0px); }
        }
        @keyframes shadowPulse {
          0%,100% { transform: translateX(-60px) scaleX(0.8); opacity: 0.4; }
          25%      { transform: translateX(-20px) scaleX(0.6); opacity: 0.2; }
          50%      { transform: translateX(20px)  scaleX(0.8); opacity: 0.4; }
          75%      { transform: translateX(50px)  scaleX(0.6); opacity: 0.2; }
        }
        @keyframes flagWave {
          0%,100% { transform: skewX(0deg); }
          50%      { transform: skewX(-8deg); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Golf scene */}
      <div style={{ position: 'relative', width: 180, height: 100, marginBottom: 32 }}>

        {/* Grass line */}
        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, height: 2, background: '#16a34a', borderRadius: 1 }} />

        {/* Flag pin */}
        <div style={{ position: 'absolute', bottom: 18, right: 20 }}>
          <div style={{ width: 2, height: 40, background: '#9ca39c', borderRadius: 1 }} />
          <div style={{
            position: 'absolute', top: 0, left: 2,
            width: 20, height: 14,
            background: '#dc2626', clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
            animation: 'flagWave 1.5s ease-in-out infinite',
            transformOrigin: 'left center',
          }} />
          {/* Hole */}
          <div style={{ position: 'absolute', bottom: -4, left: -6, width: 14, height: 5, background: '#0a1a0a', borderRadius: '50%', opacity: 0.4 }} />
        </div>

        {/* Rolling golf ball */}
        <div style={{
          position: 'absolute', bottom: 22,
          left: '50%',
          animation: 'ballBounce 2s ease-in-out infinite',
        }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '1.5px solid #d1d5d1', position: 'relative' }}>
            {/* Dimples */}
            <div style={{ position: 'absolute', top: 4, left: 4, width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
            <div style={{ position: 'absolute', top: 6, left: 8, width: 2, height: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
            <div style={{ position: 'absolute', top: 9, left: 4, width: 2, height: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
          </div>
          {/* Ball shadow */}
          <div style={{ width: 12, height: 4, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', margin: '2px auto 0', animation: 'shadowPulse 2s ease-in-out infinite' }} />
        </div>

        {/* ForeAI logo small */}
        <div style={{ position: 'absolute', top: 0, left: 0, fontSize: 16, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a' }}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
      </div>

      {/* Status text */}
      <div style={{ fontSize: 16, fontWeight: 500, color: '#0a1a0a', marginBottom: 6, textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
        {status?.includes('watching') ? 'Gemini is watching your swing...' :
         status?.includes('Uploading') ? 'Uploading your video...' :
         status?.includes('Preparing') ? 'Preparing your video...' :
         'Analyzing your swing...'}
      </div>

      <div style={{ fontSize: 13, color: '#9ca39c', marginBottom: 28, textAlign: 'center', lineHeight: 1.6 }}>
        {status?.includes('watching') ? 'Examining every position in detail' : 'This takes about 20–40 seconds'}
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
        {[
          { label: 'Video uploaded to Gemini', done: status?.includes('watching') || status?.includes('Analyzing') },
          { label: 'AI watching your full swing', done: false, active: status?.includes('watching') },
          { label: 'Generating coaching report', done: false, active: false },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: step.done ? '#16a34a' : step.active ? '#0a1a0a' : '#e5e9e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', fontWeight: 700,
              transition: 'background 0.5s',
              animation: step.active ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            <div style={{
              fontSize: 13, fontWeight: step.done || step.active ? 500 : 400,
              color: step.done ? '#16a34a' : step.active ? '#0a1a0a' : '#9ca39c',
            }}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
