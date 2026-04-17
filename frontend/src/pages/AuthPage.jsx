import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { api } from '../api/index.js';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', handicap: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'forgot') {
    return <ForgotPassword onBack={() => setMode('login')} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <style>{`
        .auth-left { display: flex; }
        .auth-right { width: 480px; }
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; }
        }
      `}</style>

      {/* Left panel */}
      <div className="auth-left" style={{
        flex: 1, background: '#0a0f0a', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '3rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #4ade80 40px, #4ade80 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #4ade80 40px, #4ade80 41px)' }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, fontFamily: "'Playfair Display', serif", color: '#f0fdf0', lineHeight: 1, marginBottom: 8 }}>
            Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
          </div>
          <div style={{ color: '#4ade80', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 48 }}>AI Swing Coach</div>
          <div style={{ color: '#6b7a6b', fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>
            Upload your swing. Get frame-by-frame AI coaching. Discover exactly what's holding your game back.
          </div>
          {[
            { label: 'Frame-by-frame analysis', desc: 'Every position dissected' },
            { label: 'AI-powered coaching', desc: 'Personalized drill recommendations' },
            { label: 'Progress history', desc: 'Track improvement over time' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#d1fae5', fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ color: '#4b5e4b', fontSize: 12 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right" style={{ background: '#f9faf9', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Mobile hero */}
        <style>{`
          .mobile-hero { display: none; }
          @media (max-width: 768px) { .mobile-hero { display: flex !important; } }
        `}</style>
        <div className="mobile-hero" style={{
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px 32px', background: '#0a0f0a', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px), repeating-linear-gradient(90deg, transparent, transparent 32px, #4ade80 32px, #4ade80 33px)' }} />
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontFamily: "'Playfair Display', serif", color: '#f0fdf0', lineHeight: 1, marginBottom: 6 }}>
              Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
            </div>
            <div style={{ color: '#4ade80', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 20 }}>AI Golf Swing Coach</div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              {['Frame analysis', 'AI coaching', 'History'].map((f) => (
                <div key={f} style={{ textAlign: 'center' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', margin: '0 auto 5px' }} />
                  <div style={{ color: '#6b7a6b', fontSize: 11 }}>{f}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '40px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 6px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7a6b', margin: 0 }}>
              {mode === 'login' ? "Let's see what your swing has been up to." : '3 free analyses per day — no credit card needed.'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && <Field label="Your name" name="name" value={form.name} onChange={update} placeholder="First and last name" />}
            <Field label="Email address" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={update} placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} />
            {mode === 'register' && <Field label="Handicap (optional)" name="handicap" value={form.handicap} onChange={update} placeholder="e.g. 12.4" />}

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: '#9ca39c', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '14px', background: loading ? '#6b7a6b' : '#0a1a0a',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7a6b' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 500, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f9faf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, fontFamily: "'Playfair Display', serif", color: '#0a1a0a', fontWeight: 700, marginBottom: 4 }}>
            Fore<span style={{ color: '#16a34a', fontStyle: 'italic' }}>AI</span>
          </div>
        </div>

        {!submitted ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', border: '1px solid #e5e9e5' }}>
            <h2 style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' }}>Reset your password</h2>
            <p style={{ fontSize: 13, color: '#6b7a6b', margin: '0 0 24px', lineHeight: 1.6 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374237', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
                onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5d1'}
              />
            </div>
            <button onClick={() => email && setSubmitted(true)} style={{
              width: '100%', padding: 14, background: email ? '#0a1a0a' : '#d1d5d1',
              color: email ? '#fff' : '#9ca39c', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 500, cursor: email ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif", marginBottom: 16,
            }}>
              Send reset link →
            </button>
            <button onClick={onBack} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#9ca39c', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              ← Back to sign in
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', border: '1px solid #e5e9e5', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 12px' }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: '#6b7a6b', lineHeight: 1.7, margin: '0 0 8px' }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <p style={{ fontSize: 13, color: '#9ca39c', lineHeight: 1.6, margin: '0 0 28px' }}>
              Don't see it? Check your spam folder, or contact us at{' '}
              <a href="mailto:support@foreai.app" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>support@foreai.app</a>
            </p>
            <button onClick={onBack} style={{ padding: '12px 32px', background: '#0a1a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374237', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={name !== 'handicap'}
        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5d1', borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5d1'}
      />
    </div>
  );
}
