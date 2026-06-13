// 상품 카드 — 목록/찜 페이지 공용. 사진·상태·제목·가격·동네.
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/client';
import { formatPrice, STATUS_LABEL, statusChipClass } from '../lib/format';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const p = product;
  return (
    <Link to={`/products/${p.id}`} className="card">
      <div className="card-thumb">
        {p.thumbnailUrl
          ? <img src={assetUrl(p.thumbnailUrl)} alt={p.title} loading="lazy" />
          : <div className="card-noimg">🧚</div>}
        {p.status !== 'ON_SALE' && (
          <span className={`${statusChipClass(p.status)} card-status`}>{STATUS_LABEL[p.status]}</span>
        )}
      </div>
      <div className="card-body">
        <p className="card-title">{p.title}</p>
        <p className="card-price">{formatPrice(p.price)}</p>
        <p className="card-meta muted">
          {p.regionName || '동네 미설정'}
          {p.favCount > 0 && <span> · 찜 {p.favCount}</span>}
        </p>
      </div>
    </Link>
  );
}
