// 실시간 채팅 = Socket.io. 옛 Fairy의 socket.io 채팅을 인증·검증 붙여 재구성.
// 핸드셰이크 때 JWT로 본인 확인 → 방 참여 검증 → 메시지 저장 후 같은 방에 브로드캐스트.
import { Server } from 'socket.io';
import { pool } from './db.js';
import { verifyToken } from './middleware/auth.js';

export function initSocket(httpServer) {
  const allowOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : true;

  const io = new Server(httpServer, { cors: { origin: allowOrigins } });

  // 핸드셰이크 인증: 토큰 없거나 틀리면 연결 거부
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('인증 토큰이 없어요'));
      socket.user = verifyToken(token); // { id, email, role, nickname }
      next();
    } catch {
      next(new Error('토큰이 유효하지 않아요'));
    }
  });

  // 이 소켓 사용자가 그 방의 참여자인지 확인
  async function isParticipant(roomId, userId) {
    const [rows] = await pool.query(
      'SELECT 1 FROM chat_room WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [roomId, userId, userId]
    );
    return rows.length > 0;
  }

  io.on('connection', (socket) => {
    const me = socket.user.id;

    // 방 입장 — 참여자만
    socket.on('room:join', async (roomId, ack) => {
      if (!(await isParticipant(roomId, me))) {
        return ack?.({ ok: false, error: '참여 권한이 없어요' });
      }
      socket.join(`room:${roomId}`);
      ack?.({ ok: true });
    });

    socket.on('room:leave', (roomId) => socket.leave(`room:${roomId}`));

    // 메시지 전송 — 저장 후 같은 방 모두에게 브로드캐스트
    socket.on('message:send', async (payload, ack) => {
      try {
        const { roomId, content, imageUrl, emoticon } = payload || {};
        if (!roomId || (!content && !imageUrl && !emoticon)) {
          return ack?.({ ok: false, error: '빈 메시지는 보낼 수 없어요' });
        }
        if (!(await isParticipant(roomId, me))) {
          return ack?.({ ok: false, error: '참여 권한이 없어요' });
        }

        const [result] = await pool.query(
          `INSERT INTO chat_message (room_id, sender_id, content, image_url, emoticon)
           VALUES (?, ?, ?, ?, ?)`,
          [roomId, me, content || null, imageUrl || null, emoticon || null]
        );

        const message = {
          id: result.insertId,
          roomId,
          senderId: me,
          senderNickname: socket.user.nickname,
          content: content || null,
          imageUrl: imageUrl || null,
          emoticon: emoticon || null,
          createdAt: new Date().toISOString(),
        };

        // 방에 있는 사람(상대)에게 실시간 전달 + 보낸 사람도 ack로 확정
        io.to(`room:${roomId}`).emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    // 입력중 표시 (저장 안 함)
    socket.on('typing', ({ roomId, typing }) => {
      socket.to(`room:${roomId}`).emit('typing', { userId: me, typing });
    });
  });

  return io;
}
