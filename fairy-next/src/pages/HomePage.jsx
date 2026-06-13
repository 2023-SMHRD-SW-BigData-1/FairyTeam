// 홈 — 배너 캐러셀 + 카테고리 + 상품 그리드 + 우측 사이드바(찜한/최근본/TOP).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listProducts } from '../api/products';
import { listCategories } from '../api/categories';
import ProductCard from '../components/ProductCard';
import RightRail from '../components/RightRail';
import './HomePage.css';

const BANNERS = [
  { eyebrow: '🏪 편의점에서 안전하게', title: '대면 없이, 시간 압박 없이\n편의점 위탁거래', sub: '판매자가 맡기면 구매자가 아무 때나 픽업해요', g: 'linear-gradient(110deg,#2c9c8f,#3fd0bd)' },
  { eyebrow: '📍 위치기반 서비스', title: '나와 판매자 사이\n중간 편의점을 찾아드려요', sub: '카카오맵으로 가까운 픽업 장소 추천', g: 'linear-gradient(110deg,#1f8f97,#46c2c9)' },
  { eyebrow: '♻️ 믿을 수 있는 중고거래', title: 'CCTV·점원이 지키는\n안심 거래', sub: '직거래 불안, 택배 사기 걱정 끝', g: 'linear-gradient(110deg,#2a8f7e,#5ad0a8)' },
];

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'latest';

  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [bi, setBi] = useState(0); // 배너 인덱스

  useEffect(() => { listCategories().then(setCats).catch(() => {}); }, []);

  // 배너 자동 회전
  useEffect(() => {
    const t = setInterval(() => setBi((i) => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr('');
    listProducts({ category, q, sort, size: 40 })
      .then((res) => { setItems(res.items); setTotal(res.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [category, q, sort]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }

  const showBanner = !q && !category;
  const b = BANNERS[bi];

  return (
    <main className="container page">
      <div className="home-wrap">
        <div className="home-content">
          {/* 배너 캐러셀 */}
          {showBanner && (
            <div className="home-banner" style={{ background: b.g }}>
              <div className="hb-text">
                <p className="hb-eyebrow">{b.eyebrow}</p>
                <h2 className="hb-title">{b.title.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</h2>
                <p className="hb-sub">{b.sub}</p>
              </div>
              <div className="hb-emoji">🛍️</div>
              <div className="hb-dots">
                {BANNERS.map((_, i) => (
                  <button key={i} className={`hb-dot ${i === bi ? 'on' : ''}`} onClick={() => setBi(i)} aria-label={`배너 ${i + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* 카테고리 바 */}
          <div className="cat-bar">
            <button className={`cat ${!category ? 'cat-on' : ''}`} onClick={() => setFilter('category', '')}>전체</button>
            {cats.map((c) => (
              <button key={c.code}
                className={`cat ${category === c.code ? 'cat-on' : ''}`}
                onClick={() => setFilter('category', c.code)}>
                <span>{c.emoji}</span> {c.name}
              </button>
            ))}
          </div>

          <div className="home-head">
            <h1 className="page-title">
              {q ? `'${q}' 검색 결과` : category ? '카테고리 상품' : '오늘의 상품 추천'}
              <span className="muted home-count"> {total}개</span>
            </h1>
            <select className="select home-sort" value={sort} onChange={(e) => setFilter('sort', e.target.value)}>
              <option value="latest">최신순</option>
              <option value="price_asc">낮은 가격순</option>
              <option value="price_desc">높은 가격순</option>
            </select>
          </div>

          {err && <p className="error-text">{err}</p>}
          {loading ? (
            <div className="empty">불러오는 중…</div>
          ) : items.length === 0 ? (
            <div className="empty">조건에 맞는 상품이 없어요.</div>
          ) : (
            <div className="grid">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>

        <RightRail />
      </div>
    </main>
  );
}
