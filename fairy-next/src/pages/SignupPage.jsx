// 회원가입.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', nickname: '', phone: '', birthDate: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (form.password.length < 8) { setErr('비밀번호는 8자 이상이어야 해요'); return; }
    setBusy(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container page center-narrow">
      <h1 className="page-title">회원가입</h1>
      <form onSubmit={onSubmit} className="auth-card">
        <div className="field">
          <label>이메일</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="field">
          <label>비밀번호 (8자 이상)</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} required />
        </div>
        <div className="field">
          <label>이름</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div className="field">
          <label>닉네임 (거래용)</label>
          <input className="input" value={form.nickname} onChange={set('nickname')} required />
        </div>
        <div className="field">
          <label>생년월일</label>
          <input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
        </div>
        <div className="field">
          <label>전화번호 (선택)</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="010-0000-0000" />
        </div>
        {err && <p className="error-text">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? '가입 중…' : '가입하고 시작하기'}
        </button>
      </form>
      <p className="auth-foot muted">
        이미 회원이세요? <Link to="/login" className="auth-link">로그인</Link>
      </p>
    </main>
  );
}
