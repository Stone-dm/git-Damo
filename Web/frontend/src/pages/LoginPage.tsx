import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function CloudMotif({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 34c4-10 14-16 26-14 4-10 16-16 28-12 6-8 18-10 28-4 10-4 22 0 28 10 8 0 14 8 12 16H10c-4 0-6-4-2-6z"
        fill="currentColor"
      />
      <path
        d="M18 30c3-6 10-10 18-8 3-7 12-11 20-8 4-5 12-7 19-3 7-3 15 0 19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.55"
      />
    </svg>
  );
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : '登录失败，请检查网络或后端服务';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <video
        className="login-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <section className="login-brand">
        <p className="login-brand-mark">HONGZHOU HANG</p>
        <h1 className="login-brand-title">红舟航</h1>
        <p className="login-brand-lead">学思想 · 强党性 · 重实践 · 建新功</p>
      </section>

      <aside className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <CloudMotif className="cloud-motif cloud-tl" />
          <CloudMotif className="cloud-motif cloud-tr" />
          <CloudMotif className="cloud-motif cloud-bl" />
          <CloudMotif className="cloud-motif cloud-br" />

          <div className="login-card-ornament" aria-hidden>
            <span />
            <CloudMotif className="cloud-motif cloud-center" />
            <span />
          </div>

          <div className="login-card-head">
            <h2>欢迎登录</h2>
            <p className="login-sub">请使用账号密码进入学习平台</p>
          </div>

          <label>
            用户名
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" className="btn primary login-submit" disabled={submitting}>
            {submitting ? '登录中…' : '进入系统'}
          </button>

          <p className="hint">
            演示账号：admin / admin123 · secretary / sec123 · member / mem123
          </p>
        </form>
      </aside>
    </div>
  );
}
