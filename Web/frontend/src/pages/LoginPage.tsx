import { useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const features = useMemo(
    () => [
      { title: '经典研学', icon: '旗' },
      { title: '红色领航', icon: '航' },
      { title: '党员智库', icon: '书' },
    ],
    [],
  );

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      void remember;
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

      <header className="login-topnav">
        <a href="#help">帮助中心</a>
        <a href="#about">关于我们</a>
        <span className="login-lang">中文 ▾</span>
      </header>

      <section className="login-hero">
        <h1 className="login-hero-title">红舟航</h1>
        <p className="login-hero-sub">AI数智党校一体化学习系统</p>
        <p className="login-hero-tag">
          <span>★</span> 智慧引领 · 学习赋能 · 成长进步 <span>★</span>
        </p>
        <ul className="login-features">
          {features.map((item) => (
            <li key={item.title}>
              <span className="login-feature-icon" aria-hidden>
                {item.icon}
              </span>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-head">
            <h2>欢迎登录</h2>
            <p className="login-sub">★ 红舟航 AI 数智党校系统 ★</p>
          </div>

          <label className="login-field">
            <span className="login-field-icon" aria-hidden>
              人
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="请输入用户名"
              required
            />
          </label>

          <label className="login-field">
            <span className="login-field-icon" aria-hidden>
              锁
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              required
            />
          </label>

          <div className="login-meta-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              记住账号
            </label>
            <button type="button" className="login-link-btn">
              忘记密码？
            </button>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" className="btn primary login-submit" disabled={submitting}>
            {submitting ? '登录中…' : '登 录'}
          </button>

          <p className="hint">演示：admin/admin123 · secretary/sec123 · member/mem123</p>
        </form>
      </aside>

      <div className="login-notice" role="status">
        <span className="login-notice-label">重要通知</span>
        <p>
          2026 年党员教育培训计划正式启动，请各支部组织党员按时参加线上学习与考核。
        </p>
        <a href="#more" className="login-notice-more">
          更多 &gt;
        </a>
      </div>
    </div>
  );
}
