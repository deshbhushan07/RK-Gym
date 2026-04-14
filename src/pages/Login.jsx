// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logo}><FiZap /></div>
          <span style={styles.logoText}>RK FITNESS</span>
        </div>
        <h1 style={styles.headline}>LIFT.<br />TRACK.<br />DOMINATE.</h1>
        <p style={styles.tagline}>Gym Management System<br />Vasagade, Kolhapur</p>
        <div style={styles.dots}>
          {[0,1,2].map(i => <div key={i} style={{...styles.dot, opacity: i === 0 ? 1 : 0.3}} />)}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Admin Login</h2>
            <p style={styles.formSub}>Sign in to manage your gym</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={styles.inputWrap}>
                <FiMail style={styles.inputIcon} />
                <input
                  className="form-input"
                  style={styles.inputPadded}
                  type="email"
                  placeholder="admin@rkfitness.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={styles.inputWrap}>
                <FiLock style={styles.inputIcon} />
                <input
                  className="form-input"
                  style={styles.inputPadded}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? <span className="spinner" style={{width:18, height:18, borderWidth:2}} /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={styles.hint}>
            <FiZap style={{color:'var(--accent)'}} />
            First time? Create admin account in Firebase Console → Authentication
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    background: 'var(--bg-primary)',
  },
  left: {
    flex: '0 0 420px', background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    padding: '48px 48px 48px',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' },
  logo: {
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--accent)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#0a0a0a', fontSize: '1.1rem',
  },
  logoText: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.1em' },
  headline: {
    fontFamily: 'var(--font-display)', fontSize: '5.5rem',
    letterSpacing: '0.04em', lineHeight: 0.95,
    color: 'var(--text-primary)',
    position: 'absolute', bottom: 120, left: 48,
  },
  tagline: {
    position: 'absolute', bottom: 56, left: 48,
    font: '0.88rem/1.6 var(--font-body)', color: 'var(--text-secondary)',
  },
  dots: { position: 'absolute', bottom: 36, right: 48, display: 'flex', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  formBox: {
    width: '100%', maxWidth: 400,
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  formHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  formTitle: { fontFamily: 'var(--font-display)', fontSize: '2.4rem', letterSpacing: '0.04em' },
  formSub: { color: 'var(--text-secondary)', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: 'var(--text-muted)', pointerEvents: 'none' },
  inputPadded: { paddingLeft: '38px !important' },
  eyeBtn: { position: 'absolute', right: 12, color: 'var(--text-muted)', background: 'none', border: 'none' },
  submitBtn: {
    width: '100%', justifyContent: 'center',
    padding: '12px', fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '0.03em', marginTop: 4,
  },
  hint: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    fontSize: '0.8rem', color: 'var(--text-muted)',
    background: 'var(--bg-secondary)', padding: '12px 14px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
    lineHeight: 1.5,
  },
};
