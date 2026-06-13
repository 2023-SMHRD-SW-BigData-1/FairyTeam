// 마이샵 — 원본 당신편 찜 페이지의 탭 구조(상품/상점후기/찜/팔로잉/팔로워).
// 찜 탭: 정렬 + 선택삭제. 상품 탭: 내 판매글. 나머지는 자리만(준비중).
import { useEffect, useState } from 'react';
import { listFavorites, removeFavorite } from '../api/favorites';
import { listProducts } from '../api/products';
import { useAuth } from '../context/useAuth';
import ProductCard from '../components/ProductCard';
import './FavoritesPage.css';

const SORTS = { latest: '최신순', price_asc: '저가순', price_desc: '고가순' };

export default function FavoritesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('jjim'); // jjim | products | reviews | following | followers
  const [favs, setFavs] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sort, setSort] = useState('latest');
  const [picked, setPicked] = useState(new Set());

  function loadFavs() {
    return listFavorites().then(setFavs).catch((e) => setErr(e.message));
  }
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadFavs(),
      listProducts({ size: 50 }).then((r) => setMine(r.items.filter((p) => p.sellerNickname === user?.nickname))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user?.nickname]);

  // 정렬된 찜 목록
  const sortedFavs = [...favs].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    return 0; // latest = 서버 순서(최신 찜순)
  });

  function togglePick(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function deletePicked() {
    if (picked.size === 0) return;
    if (!window.confirm(`선택한 ${picked.size}개를 찜 해제할까요?`)) return;
    try {
      await Promise.all([...picked].map((id) => removeFavorite(id)));
      setPicked(new Set());
      await loadFavs();
    } catch (e) { setErr(e.message); }
  }

  const TABS = [
    { key: 'products', label: '상품', count: mine.length },
    { key: 'reviews', label: '상점후기', count: 0 },
    { key: 'jjim', label: '찜', count: favs.length },
    { key: 'following', label: '팔로잉', count: 0 },
    { key: 'followers', label: '팔로워', count: 0 },
  ];

  return (
    <main className="container page">
      <h1 className="page-title">마이샵</h1>

      {/* 탭 */}
      <div className="fav-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`fav-tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="fav-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {err && <p className="error-text">{err}</p>}
      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : tab === 'jjim' ? (
        <>
          <div className="fav-bar">
            <button className="btn btn-line btn-sm" onClick={deletePicked} disabled={picked.size === 0}>
              선택삭제 {picked.size > 0 && `(${picked.size})`}
            </button>
            <div className="fav-sorts">
              {Object.entries(SORTS).map(([k, label]) => (
                <button key={k} className={`fav-sort ${sort === k ? 'on' : ''}`} onClick={() => setSort(k)}>{label}</button>
              ))}
            </div>
          </div>
          {favs.length === 0 ? (
            <div className="empty">아직 찜한 상품이 없어요.</div>
          ) : (
            <div className="grid">
              {sortedFavs.map((p) => (
                <div key={p.id} className="fav-cell">
                  <label className="fav-check">
                    <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)} />
                  </label>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : tab === 'products' ? (
        mine.length === 0
          ? <div className="empty">올린 상품이 없어요.</div>
          : <div className="grid">{mine.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="empty">준비 중인 기능이에요.</div>
      )}
    </main>
  );
}
