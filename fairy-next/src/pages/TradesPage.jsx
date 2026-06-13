// 내 위탁거래 관리 — 상태/역할에 따라 위탁·픽업·취소 버튼 노출.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTrades, tradeAction } from '../api/trades';
import { assetUrl } from '../api/client';
import { formatPrice } from '../lib/format';
import './TradesPage.css';

const STEP = { REQUESTED: 1, CONSIGNED: 2, DONE: 3 }; // 진행 단계 표시용

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    listTrades().then(setTrades).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function act(id, action) {
    if (action === 'cancel' && !window.confirm('거래를 취소할까요?')) return;
    setBusyId(id); setErr('');
    try {
      await tradeAction(id, action);
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusyId(null); }
  }

  // 상태·역할별 버튼
  function actions(t) {
    if (t.status === 'DONE') return <span className="chip chip-sold">거래완료</span>;
    if (t.status === 'CANCELED') return <span className="chip chip-sold">취소됨</span>;
    const disabled = busyId === t.id;

    if (t.status === 'REQUESTED') {
      return (
        <div className="tp-btns">
          {t.iAmSeller
            ? <button className="btn btn-primary btn-sm" disabled={disabled} onClick={() => act(t.id, 'consign')}>편의점에 위탁완료</button>
            : <span className="muted tp-wait">판매자 위탁 대기중</span>}
          <button className="btn btn-line btn-sm tp-cancel" disabled={disabled} onClick={() => act(t.id, 'cancel')}>취소</button>
        </div>
      );
    }
    // CONSIGNED
    return (
      <div className="tp-btns">
        {t.iAmSeller
          ? <span className="muted tp-wait">구매자 픽업 대기중</span>
          : <button className="btn btn-primary btn-sm" disabled={disabled} onClick={() => act(t.id, 'pickup')}>픽업 완료</button>}
        <button className="btn btn-line btn-sm tp-cancel" disabled={disabled} onClick={() => act(t.id, 'cancel')}>취소</button>
      </div>
    );
  }

  return (
    <main className="container page">
      <h1 className="page-title">내 위탁거래</h1>
      {err && <p className="error-text">{err}</p>}
      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : trades.length === 0 ? (
        <div className="empty">진행 중인 거래가 없어요.</div>
      ) : (
        <ul className="tp">
          {trades.map((t) => (
            <li key={t.id} className="tp-card">
              <Link to={`/products/${t.productId}`} className="tp-thumb">
                {t.productThumbnail ? <img src={assetUrl(t.productThumbnail)} alt="" /> : <div className="tp-noimg">🧚</div>}
              </Link>
              <div className="tp-body">
                <div className="tp-top">
                  <span className={`chip ${t.iAmSeller ? '' : 'chip-reserved'}`}>{t.iAmSeller ? '판매' : '구매'}</span>
                  <span className="tp-title">{t.productTitle}</span>
                </div>
                <div className="tp-price">{formatPrice(t.price)}</div>

                {/* 진행 단계 */}
                {STEP[t.status] && (
                  <div className="tp-steps">
                    <span className={STEP[t.status] >= 1 ? 'on' : ''}>약속</span>
                    <span className="tp-arrow">→</span>
                    <span className={STEP[t.status] >= 2 ? 'on' : ''}>위탁</span>
                    <span className="tp-arrow">→</span>
                    <span className={STEP[t.status] >= 3 ? 'on' : ''}>픽업</span>
                  </div>
                )}

                <div className="muted tp-store">
                  🏪 {t.store.brand} {t.store.name} · {t.store.address}
                </div>
                <div className="muted tp-partner">상대: {t.partnerNickname}</div>

                <div className="tp-action">{actions(t)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
