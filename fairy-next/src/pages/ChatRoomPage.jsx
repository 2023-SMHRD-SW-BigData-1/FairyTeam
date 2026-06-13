// 실시간 채팅방 — REST로 내역 로드 + Socket.io로 실시간 송수신.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages } from '../api/chat';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/useAuth';
import { timeOfDay } from '../lib/format';
import './ChatRoomPage.css';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);

  // 1) 과거 내역 로드 (+ 읽음 처리)
  useEffect(() => {
    getMessages(roomId).then(setMessages).catch((e) => setErr(e.message));
  }, [roomId]);

  // 2) 소켓: 방 입장 + 새 메시지 수신
  useEffect(() => {
    const socket = getSocket();
    socket.emit('room:join', Number(roomId), (ack) => {
      if (!ack?.ok) setErr(ack?.error || '채팅방 입장 실패');
    });

    const onNew = (msg) => {
      if (Number(msg.roomId) !== Number(roomId)) return;
      setMessages((prev) => [...prev, {
        id: msg.id, senderId: msg.senderId, mine: msg.senderId === user?.id,
        content: msg.content, imageUrl: msg.imageUrl, emoticon: msg.emoticon,
        createdAt: msg.createdAt,
      }]);
    };
    socket.on('message:new', onNew);

    return () => {
      socket.emit('room:leave', Number(roomId));
      socket.off('message:new', onNew);
    };
  }, [roomId, user?.id]);

  // 새 메시지 오면 맨 아래로 스크롤
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    getSocket().emit('message:send', { roomId: Number(roomId), content }, (ack) => {
      if (!ack?.ok) setErr(ack?.error || '전송 실패');
    });
    setText(''); // 내 화면은 서버 브로드캐스트(message:new)로 추가됨
  }

  return (
    <main className="container page cr">
      {err && <p className="error-text">{err}</p>}
      <div className="cr-log">
        {messages.map((m) => (
          <div key={m.id} className={`cr-row ${m.mine ? 'mine' : ''}`}>
            <div className="cr-bubble">
              {m.content}
              {m.imageUrl && <img className="cr-img" src={m.imageUrl} alt="" />}
            </div>
            <span className="cr-time muted">{timeOfDay(m.createdAt)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="cr-input" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요" autoFocus />
        <button className="btn btn-primary" disabled={!text.trim()}>전송</button>
      </form>
    </main>
  );
}
