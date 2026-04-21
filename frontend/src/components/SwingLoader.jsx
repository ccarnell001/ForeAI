export default function SwingLoader({ status }) {
  const uploaded = status?.includes('watching') || status?.includes('Generating');
  const watching = status?.includes('watching');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes foreai-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes foreai-flag { 0%,100%{transform:skewX(0deg)} 50%{transform:skewX(-7deg)} }
        @keyframes foreai-bar { 0%{width:0%} 100%{width:82%} }
        @keyframes foreai-ball {
          0%   { offset-distance:0%; }
          88%  { offset-distance:100%; }
          100% { offset-distance:100%; }
        }
        @keyframes foreai-ballr {
          0%,87% { r:7.5; opacity:1; }
          93%    { r:3;   opacity:0.6; }
          100%   { r:0;   opacity:0; }
        }
        @keyframes foreai-trace {
          0%   { stroke-dashoffset:320; opacity:0.65; }
          88%  { stroke-dashoffset:0;   opacity:0.65; }
          95%  { stroke-dashoffset:0;   opacity:0.15; }
          100% { stroke-dashoffset:0;   opacity:0; }
        }
        @keyframes foreai-ripple {
          0%,87%  { opacity:0; rx:8;  ry:4; }
          92%     { opacity:0.9; rx:8;  ry:4; }
          98%     { opacity:0.2; rx:22; ry:10; }
          100%    { opacity:0; }
        }
        @keyframes foreai-scan { 0%{left:-60%} 100%{left:160%} }
        .foreai-ball-el {
          offset-path: path('M55,4 Q58,122 82,122 Q96,78 118,122 Q130,98 152,122 Q162,112 192,122');
          offset-distance: 0%;
          animation: foreai-ball 3.8s cubic-bezier(0.45,0,0.55,1) infinite;
        }
      `}</style>

      <div style={{ background: '#0a1a0a', borderRadius: 20, padding: '32px 24px', textAlign: 'center', width: '100%', maxWidth: 320 }}>

        <svg width="260" height="130" viewBox="0 0 280 134" style={{ display: 'block', margin: '0 auto 20px', width: '100%' }}>
          <ellipse cx="140" cy="126" rx="130" ry="12" fill="#1a4a1a"/>
          <ellipse cx="140" cy="122" rx="126" ry="9" fill="#16a34a"/>
          <ellipse cx="192" cy="121" rx="11" ry="5" fill="#050e05"/>
          <line x1="192" y1="58" x2="192" y2="121" stroke="#b8a878" strokeWidth="1.5" strokeLinecap="round"/>
          <polygon points="192,58 228,73 192,88" fill="#dc2626" opacity="0.95"
            style={{ transformOrigin: '192px 73px', animation: 'foreai-flag 1.6s ease-in-out infinite' }}/>

          {/* Scan beam */}
          <rect y="12" width="80" height="2" rx="1" fill="url(#fsb)" opacity="0.3">
            <animate attributeName="x" from="-80" to="280" dur="2.2s" repeatCount="indefinite"/>
          </rect>
          <defs>
            <linearGradient id="fsb" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent"/>
              <stop offset="50%" stopColor="#4ade80"/>
              <stop offset="100%" stopColor="transparent"/>
            </linearGradient>
          </defs>

          {/* Trace */}
          <path d="M55,4 Q58,122 82,122 Q96,78 118,122 Q130,98 152,122 Q162,112 192,122"
            fill="none" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round"
            strokeDasharray="320 320" strokeDashoffset="320"
            style={{ animation: 'foreai-trace 3.8s cubic-bezier(0.45,0,0.55,1) infinite' }}/>

          {/* Ball */}
          <circle className="foreai-ball-el" fill="#f5f5f0" stroke="#ccc" strokeWidth="0.5"
            style={{ animation: 'foreai-ball 3.8s cubic-bezier(0.45,0,0.55,1) infinite' }}>
            <animate attributeName="r" values="7.5;7.5;7.5;7.5;7.5;3;0"
              keyTimes="0;0.3;0.6;0.75;0.87;0.93;1"
              dur="3.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;1;1;1;1;0.6;0"
              keyTimes="0;0.3;0.6;0.75;0.87;0.93;1"
              dur="3.8s" repeatCount="indefinite"/>
          </circle>

          {/* Dimples */}
          {[{cx:2.5,cy:-2.5,r:2},{cx:-2,cy:1.5,r:1.5},{cx:2.5,cy:2.5,r:1.4}].map((d,i) => (
            <circle key={i} className="foreai-ball-el" cx={d.cx} cy={d.cy} r={d.r}
              fill={`rgba(0,0,0,${0.09-i*0.01})`}/>
          ))}

          {/* Hole ripple */}
          <ellipse cx="192" cy="121" rx="8" ry="4" fill="none" stroke="#4ade80" strokeWidth="1.5"
            style={{ animation: 'foreai-ripple 3.8s cubic-bezier(0.45,0,0.55,1) infinite' }}/>
        </svg>

        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f0fdf0', fontWeight: 700, marginBottom: 4 }}>
          Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
        </div>
        <div style={{ fontSize: 14, color: '#4ade80', fontWeight: 500, marginBottom: 5, animation: 'foreai-pulse 2s infinite' }}>
          {watching ? 'Gemini is watching your swing' : 'Preparing your video...'}
        </div>
        <div style={{ fontSize: 12, color: '#4b5e4b', marginBottom: 22, lineHeight: 1.5 }}>
          {watching ? 'Analyzing every position in detail' : 'This takes about 20–40 seconds'}
        </div>

        <div style={{ height: 3, background: '#1a2a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: '100%', background: '#4ade80', borderRadius: 2, animation: 'foreai-bar 38s linear forwards' }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          {[
            { label: 'Video uploaded', done: uploaded || watching },
            { label: 'Gemini finding key swing positions', done: watching, active: !watching && uploaded },
            { label: 'Claude analyzing each position', done: false, active: watching },
            { label: 'Generating coaching report', done: false, active: false },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: step.done ? '#16a34a' : step.active ? '#16a34a' : '#1a2a1a',
                border: step.active ? 'none' : step.done ? 'none' : '1.5px solid #374237',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontWeight: 700,
                animation: step.active ? 'foreai-pulse 1.5s infinite' : 'none',
              }}>
                {step.done ? '✓' : step.active ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/> : ''}
              </div>
              <span style={{ fontSize: 13, color: step.done ? '#6b7a6b' : step.active ? '#d1fae5' : '#374237', fontWeight: step.active ? 500 : 400 }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
