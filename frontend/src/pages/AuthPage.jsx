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
      navigate('/analyze');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />

      {/* Left panel */}
      <div style={{
        flex: 1, background: '#0a0f0a', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '3rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #4ade80 40px, #4ade80 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #4ade80 40px, #4ade80 41px)',
        }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, fontFamily: "'Playfair Display', serif", color: '#f0fdf0', lineHeight: 1, marginBottom: 8 }}>
            Fore<span style={{ color: '#4ade80', fontStyle: 'italic' }}>AI</span>
          </div>
          <div style={{ color: '#4ade80', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 48 }}>
            AI Swing Coach
          </div>
          <div style={{ color: '#6b7a6b', fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>
            Upload your swing. Get frame-by-frame AI coaching. Discover exactly what's holding your game back.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Frame-by-frame analysis', desc: 'Every position dissected' },
              { label: 'AI-powered coaching', desc: 'Personalized drill recommendations' },
              { label: 'Progress history', desc: 'Track improvement over time' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#d1fae5', fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: '#4b5e4b', fontSize: 12 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        width: 480, background: '#f9faf9', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '3rem',
      }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#0a1a0a', margin: '0 0 8px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7a6b', margin: 0 }}>
            {mode === 'login' ? "Let's see what your swing has been up to." : '3 free analyses per day — no credit card needed.'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <Field label="Your name" name="name" value={form.name} onChange={update} placeholder="Tiger (just kidding, anyone's welcome)" />
          )}
          <Field label="Email address" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" />
          <Field label="Password" name="password" type="password" value={form.password} onChange={update} placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} />
          {mode === 'register' && (
            <Field label="Handicap (optional)" name="handicap" value={form.handicap} onChange={update} placeholder="e.g. 12.4" />
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: '14px', background: loading ? '#6b7a6b' : '#0a1a0a',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6b7a6b' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 500, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374237', marginBottom: 6, letterSpacing: '0.03em' }}>
        {label.toUpperCase()}
      </label>
      <input
        name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={name !== 'handicap'}
        style={{
          width: '100%', padding: '11px 14px', border: '1.5px solid #d1d5d1',
          borderRadius: 8, fontSize: 14, color: '#0a1a0a', background: '#fff',
          boxSizing: 'border-box', outline: 'none', fontFamily: "'DM Sans', sans-serif",
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5d1'}
      />
    </div>
  );
}
