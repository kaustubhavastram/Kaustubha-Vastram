import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';
import { Eye, EyeOff } from "lucide-react";

export default function AuthModal({ isOpen, onClose, message }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password, fullName);
        setSuccess('Account created! Check your email for verification, or sign in directly.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  }

  return (
    <>
      <div className="auth-overlay" onClick={onClose} />
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="auth-modal__header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {mode === 'login'
              ? 'Sign in to your Kaustubha Vastram account'
              : 'Join the inner circle'}
          </p>
        </div>

        {message && (
          <div className="auth-modal__info">{message}</div>
        )}
        {error && <div className="auth-modal__error">{error}</div>}
        {success && <div className="auth-modal__success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-modal__form">
          {mode === 'signup' && (
            <div className="auth-modal__field">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}

          <div className="auth-modal__field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-modal__field" style={{ position: "relative" }}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "65%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn--dark btn--full"
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <p className="auth-modal__switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={switchMode}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </>
  );
}
