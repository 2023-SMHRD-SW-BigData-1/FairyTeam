// 채팅방 목록 — 상대/마지막 메시지/안읽음 수.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRooms } from '../api/chat';
import { assetUrl } from '../api/client';
import { timeAgo } from '../lib/format';
import './ChatListPage.css';

export default function ChatListPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container page">
      <h1 className="page-title">채팅</h1>
      {err && <p className="error-text">{err}</p>}
      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : rooms.length === 0 ? (
        <div className="empty">아직 채팅이 없어요.</div>
      ) : (
        <ul className="cl">
          {rooms.map((r) => (
            <li key={r.roomId}>
              <Link to={`/chat/${r.roomId}`} className="cl-item">
                <div className="cl-thumb">
                  {r.productThumbnail
                    ? <img src={assetUrl(r.productThumbnail)} alt="" />
                    : <div className="cl-noimg">🧚</div>}
                </div>
                <div className="cl-body">
                  <div className="cl-top">
                    <span className="cl-nick">{r.partner.nickname}</span>
                    <span className="muted cl-time">{timeAgo(r.lastAt)}</span>
                  </div>
                  <div className="cl-last muted">{r.lastMessage || '대화를 시작해보세요'}</div>
                  <div className="muted cl-prod">{r.productTitle}</div>
                </div>
                {r.unread > 0 && <span className="cl-badge">{r.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
