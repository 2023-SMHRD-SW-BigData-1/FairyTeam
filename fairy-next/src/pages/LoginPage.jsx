// 로그인.
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container page center-narrow">
      <h1 className="page-title">로그인</h1>
      <form onSubmit={onSubmit} className="auth-card">
        <div className="field">
          <label>이메일</label>
          <input className="input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="buyer@fairy.com" required />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input className="input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required />
        </div>
        {err && <p className="error-text">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <p className="auth-foot muted">
        아직 회원이 아니세요? <Link to="/signup" className="auth-link">회원가입</Link>
      </p>
      <p className="auth-hint muted">테스트 계정: buyer@fairy.com / test1234</p>
    </main>
  );
}
