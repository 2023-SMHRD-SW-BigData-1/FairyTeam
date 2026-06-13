// 마이페이지 — 내 정보(닉네임/동네 수정) + 내가 올린 상품.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { updateMe } from '../api/auth';
import { listProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import './MyPage.css';

export default function MyPage() {
  const { user, patchUser, logout } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [regionName, setRegionName] = useState(user?.regionName || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [mine, setMine] = useState([]);

  // 내가 올린 상품 (전체에서 내 판매글 필터 — 간단히 닉네임 매칭)
  useEffect(() => {
    listProducts({ size: 50 })
      .then((res) => setMine(res.items.filter((p) => p.sellerNickname === user?.nickname)))
      .catch(() => {});
  }, [user?.nickname]);

  async function onSave(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      const u = await updateMe({ nickname, regionName });
      patchUser(u);
      setMsg('저장했어요 ✔');
    } catch (e) { setErr(e.message); }
  }

  return (
    <main className="container page">
      <h1 className="page-title">마이페이지</h1>

      <section className="mp-card">
        <form onSubmit={onSave}>
          <div className="mp-row">
            <div className="mp-avatar">{(user?.nickname || '?')[0]}</div>
            <div className="mp-email muted">{user?.email}</div>
          </div>
          <div className="field">
            <label>닉네임</label>
            <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="field">
            <label>내 동네</label>
            <input className="input" value={regionName} onChange={(e) => setRegionName(e.target.value)}
              placeholder="예: 광주 광산구 송정동" />
          </div>
          {msg && <p className="mp-ok">{msg}</p>}
          {err && <p className="error-text">{err}</p>}
          <div className="mp-actions">
            <button className="btn btn-primary">정보 저장</button>
            <button type="button" className="btn btn-line" onClick={logout}>로그아웃</button>
          </div>
        </form>
      </section>

      <h2 className="mp-subtitle">내 판매 상품 <span className="muted">{mine.length}개</span></h2>
      {mine.length === 0 ? (
        <div className="empty">아직 올린 상품이 없어요.</div>
      ) : (
        <div className="grid">{mine.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </main>
  );
}
