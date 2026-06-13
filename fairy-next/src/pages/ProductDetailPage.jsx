// 상품 상세 — 이미지 갤러리 + 판매자 + 찜/채팅/(내거면)수정·삭제.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, deleteProduct, listProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { toggleFavorite } from '../api/favorites';
import { openRoom } from '../api/chat';
import { useAuth } from '../context/useAuth';
import { assetUrl } from '../api/client';
import { formatPrice, STATUS_LABEL, statusChipClass, timeAgo } from '../lib/format';
import { addRecentlyViewed } from '../lib/recentlyViewed';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [mainImg, setMainImg] = useState('');
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setErr('');
    getProduct(id)
      .then((data) => {
        setP(data);
        setFav(data.isFavorited);
        setMainImg(data.images?.[0] || data.thumbnailUrl || '');
        addRecentlyViewed(data); // 최근본상품 기록
        // 연관상품: 같은 카테고리 (자기 자신 제외)
        listProducts({ category: data.categoryCode, size: 12 })
          .then((res) => setRelated(res.items.filter((x) => x.id !== data.id).slice(0, 6)))
          .catch(() => {});
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  async function onFav() {
    if (!user) return navigate('/login', { state: { from: `/products/${id}` } });
    try {
      const next = await toggleFavorite(p.id, fav);
      setFav(next);
      setP({ ...p, favCount: p.favCount + (next ? 1 : -1) });
    } catch (e) { setErr(e.message); }
  }

  async function onChat() {
    if (!user) return navigate('/login', { state: { from: `/products/${id}` } });
    setBusy(true);
    try {
      const { roomId } = await openRoom(p.id);
      navigate(`/chat/${roomId}`);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  function onTrade() {
    if (!user) return navigate('/login', { state: { from: `/products/${id}` } });
    navigate(`/products/${id}/trade`);
  }

  async function onDelete() {
    if (!window.confirm('이 상품을 삭제할까요?')) return;
    try {
      await deleteProduct(p.id);
      navigate('/');
    } catch (e) { setErr(e.message); }
  }

  if (err) return <main className="container page"><p className="error-text">{err}</p></main>;
  if (!p) return <main className="container page"><div className="empty">불러오는 중…</div></main>;

  return (
    <main className="container page pd">
      <div className="pd-grid">
        {/* 이미지 */}
        <div className="pd-gallery">
          <div className="pd-main">
            {mainImg ? <img src={assetUrl(mainImg)} alt={p.title} /> : <div className="pd-noimg">🧚</div>}
          </div>
          {p.images?.length > 1 && (
            <div className="pd-thumbs">
              {p.images.map((u) => (
                <button key={u} className={`pd-thumb ${u === mainImg ? 'on' : ''}`} onClick={() => setMainImg(u)}>
                  <img src={assetUrl(u)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="pd-info">
          <div className="pd-seller">
            <div className="pd-avatar">{(p.seller.nickname || '?')[0]}</div>
            <div>
              <div className="pd-nick">{p.seller.nickname}</div>
              <div className="muted pd-region">{p.seller.regionName || p.regionName || '동네 미설정'}</div>
            </div>
          </div>

          <div className="pd-statusrow">
            {p.status !== 'ON_SALE' && <span className={statusChipClass(p.status)}>{STATUS_LABEL[p.status]}</span>}
            <span className="chip">{p.categoryName || p.categoryCode}</span>
          </div>

          <h1 className="pd-title">{p.title}</h1>
          <div className="pd-pricerow">
            <span className="pd-price">{formatPrice(p.price)}</span>
            <span className="pd-safe">🔒 안전거래 · 편의점 픽업</span>
          </div>
          <p className="muted pd-meta">♥ 찜 {p.favCount} · 👁 조회 {p.viewCount} · {timeAgo(p.createdAt)}</p>

          {/* 번개장터식 정보 행 */}
          <dl className="pd-spec">
            <div><dt>상품상태</dt><dd>{p.conditionType === 'NEW' ? '새상품' : '중고상품'}</dd></div>
            <div><dt>교환여부</dt><dd>{p.exchangeable ? '교환가능' : '교환불가'}</dd></div>
            <div><dt>수량</dt><dd>{p.quantity ?? 1}개</dd></div>
            <div><dt>거래방식</dt><dd>편의점 직/위탁거래</dd></div>
            <div><dt>가격제안</dt><dd>{p.isNegotiable ? '가능' : '불가'}</dd></div>
            <div><dt>거래지역</dt><dd>📍 {p.regionName || '동네 미설정'}</dd></div>
          </dl>

          <p className="pd-desc">{p.description || '설명이 없습니다.'}</p>

          {/* 액션: 내 상품이면 수정/삭제, 아니면 찜/채팅 + 위탁거래 */}
          {p.isMine ? (
            <div className="pd-actions">
              <Link to={`/products/${p.id}/edit`} className="btn btn-line btn-block">수정</Link>
              <button className="btn btn-line btn-block pd-del" onClick={onDelete}>삭제</button>
            </div>
          ) : (
            <div className="pd-actionwrap">
              <div className="pd-actions">
                <button className={`btn btn-block ${fav ? 'btn-ghost' : 'btn-line'}`} onClick={onFav}>
                  {fav ? '♥ 찜함' : '♡ 찜하기'}
                </button>
                <button className="btn btn-chat btn-block" onClick={onChat} disabled={busy}>
                  {busy ? '여는 중…' : '💬 채팅하기'}
                </button>
              </div>
              {p.status === 'ON_SALE' ? (
                <button className="btn btn-primary btn-block" onClick={onTrade}>
                  🏪 편의점 위탁거래 하기
                </button>
              ) : (
                <button className="btn btn-primary btn-block" disabled>
                  {STATUS_LABEL[p.status]}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 연관상품 */}
      {related.length > 0 && (
        <section className="pd-related">
          <h2 className="pd-related-title">연관상품 <span className="muted">AD</span></h2>
          <div className="grid">
            {related.map((rp) => <ProductCard key={rp.id} product={rp} />)}
          </div>
        </section>
      )}
    </main>
  );
}
