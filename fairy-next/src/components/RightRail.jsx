// 우측 사이드바 — 원본 당신편 메인/상세의 '찜한상품 · 최근본상품 · TOP'.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { listFavorites } from '../api/favorites';
import { getRecentlyViewed } from '../lib/recentlyViewed';
import { assetUrl } from '../api/client';
import { formatPrice } from '../lib/format';
import './RightRail.css';

function MiniItem({ p }) {
  return (
    <Link to={`/products/${p.id}`} className="rr-item">
      <div className="rr-thumb">
        {p.thumbnailUrl ? <img src={assetUrl(p.thumbnailUrl)} alt="" /> : <div className="rr-noimg">🛍️</div>}
      </div>
      <div className="rr-info">
        <div className="rr-title">{p.title}</div>
        <div className="rr-price">{formatPrice(p.price)}</div>
      </div>
    </Link>
  );
}

export default function RightRail() {
  const { user } = useAuth();
  const [favs, setFavs] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(getRecentlyViewed());
    if (user) listFavorites().then((d) => setFavs(d.slice(0, 4))).catch(() => {});
    else setFavs([]);
  }, [user]);

  return (
    <aside className="rr">
      <div className="rr-box">
        <div className="rr-head">♥ 찜한상품</div>
        {favs.length === 0
          ? <div className="rr-empty">{user ? '찜한 상품 없음' : '로그인 후 표시'}</div>
          : favs.map((p) => <MiniItem key={p.id} p={p} />)}
      </div>

      <div className="rr-box">
        <div className="rr-head">👀 최근본상품</div>
        {recent.length === 0
          ? <div className="rr-empty">최근 본 상품 없음</div>
          : recent.slice(0, 4).map((p) => <MiniItem key={p.id} p={p} />)}
      </div>

      <button className="rr-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        TOP ⬆
      </button>
    </aside>
  );
}
