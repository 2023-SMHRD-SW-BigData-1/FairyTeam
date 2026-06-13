// 위탁거래 요청 — 편의점(픽업장소)을 골라 거래를 신청.
// 카카오맵 없이 거리순 리스트로 선택. (지도는 나중에 이 위에 얹으면 됨)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../api/products';
import { listStores, midpointStores } from '../api/stores';
import { requestTrade } from '../api/trades';
import { useAuth } from '../context/useAuth';
import { assetUrl } from '../api/client';
import { formatPrice, formatDistance } from '../lib/format';
import './TradeRequestPage.css';

export default function TradeRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [stores, setStores] = useState([]);
  const [basis, setBasis] = useState('');     // 어떤 기준으로 정렬했는지 안내
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProduct(id);
        if (!alive) return;
        setProduct(p);

        // 위치 기준 선택: 나·상품 좌표가 모두 있으면 "중간 지점", 아니면 상품 위치 기준
        const haveMine = user?.lat && user?.lng;
        const haveProd = p.lat && p.lng;
        if (haveMine && haveProd) {
          const { stores } = await midpointStores(user.lat, user.lng, p.lat, p.lng, 8);
          if (alive) { setStores(stores); setBasis('두 분의 중간 지점에서 가까운 순'); }
        } else if (haveProd) {
          const s = await listStores({ lat: p.lat, lng: p.lng, limit: 8 });
          if (alive) { setStores(s); setBasis('상품 위치에서 가까운 순'); }
        } else {
          const s = await listStores({ limit: 8 });
          if (alive) { setStores(s); setBasis('제휴 편의점'); }
        }
      } catch (e) { if (alive) setErr(e.message); }
    })();
    return () => { alive = false; };
  }, [id, user?.lat, user?.lng]);

  async function onSubmit() {
    if (!selected) { setErr('픽업할 편의점을 선택해 주세요'); return; }
    setErr(''); setBusy(true);
    try {
      await requestTrade(Number(id), selected);
      navigate('/trades');
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  if (err && !product) return <main className="container page"><p className="error-text">{err}</p></main>;
  if (!product) return <main className="container page"><div className="empty">불러오는 중…</div></main>;

  return (
    <main className="container page center-narrow">
      <h1 className="page-title">위탁거래 요청</h1>

      {/* 상품 요약 */}
      <div className="tr-product">
        <div className="tr-thumb">
          {product.thumbnailUrl ? <img src={assetUrl(product.thumbnailUrl)} alt="" /> : <div className="tr-noimg">🧚</div>}
        </div>
        <div>
          <div className="tr-ptitle">{product.title}</div>
          <div className="tr-pprice">{formatPrice(product.price)}</div>
          <div className="muted tr-pseller">판매자 {product.seller.nickname}</div>
        </div>
      </div>

      <div className="tr-guide">
        🏪 판매자가 선택한 편의점에 물건을 맡기면, <b>아무 때나 픽업</b>할 수 있어요.
        대면 없이 안전하게 거래하세요.
      </div>

      {/* 편의점 선택 */}
      <div className="tr-stores-head">
        <span className="page-title tr-sub">픽업 편의점 선택</span>
        <span className="muted tr-basis">{basis}</span>
      </div>

      <ul className="tr-stores">
        {stores.map((s) => (
          <li key={s.id}>
            <label className={`tr-store ${selected === s.id ? 'on' : ''}`}>
              <input type="radio" name="store" value={s.id}
                checked={selected === s.id} onChange={() => setSelected(s.id)} />
              <span className={`tr-brand b-${s.brand}`}>{s.brand}</span>
              <span className="tr-sinfo">
                <span className="tr-sname">{s.name}</span>
                <span className="muted tr-saddr">{s.address}</span>
              </span>
              {s.distance != null && <span className="tr-dist">{formatDistance(s.distance)}</span>}
            </label>
          </li>
        ))}
      </ul>

      {err && <p className="error-text">{err}</p>}
      <button className="btn btn-primary btn-block" onClick={onSubmit} disabled={busy || !selected}>
        {busy ? '요청 중…' : '이 편의점에서 거래 요청'}
      </button>
    </main>
  );
}
