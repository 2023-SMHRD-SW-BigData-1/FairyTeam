// 채팅 라우터(REST) — 방 목록/생성, 메시지 내역.
// 실시간 송수신은 socket.js 가 담당. 여기선 "내역 조회"와 "방 만들기"만.
import express from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();
router.use(authRequired);

// GET /api/chat/rooms  내 채팅방 목록 (구매자/판매자 둘 다, 최근 메시지순)
router.get('/rooms', async (req, res) => {
  try {
    const me = req.user.id;
    const [rows] = await pool.query(
      `SELECT r.id, r.product_id, r.buyer_id, r.seller_id,
              p.title AS product_title, p.thumbnail_url, p.price, p.status AS product_status,
              bm.nickname AS buyer_nick, bm.avatar_url AS buyer_avatar,
              sm.nickname AS seller_nick, sm.avatar_url AS seller_avatar,
              lm.content AS last_content, lm.image_url AS last_image, lm.created_at AS last_at,
              (SELECT COUNT(*) FROM chat_message c
                WHERE c.room_id = r.id AND c.sender_id <> ? AND c.read_at IS NULL) AS unread
         FROM chat_room r
         JOIN product p  ON p.id = r.product_id
         JOIN member  bm ON bm.id = r.buyer_id
         JOIN member  sm ON sm.id = r.seller_id
         LEFT JOIN chat_message lm
                ON lm.id = (SELECT MAX(id) FROM chat_message WHERE room_id = r.id)
        WHERE r.buyer_id = ? OR r.seller_id = ?
        ORDER BY COALESCE(lm.created_at, r.created_at) DESC`,
      [me, me, me]
    );

    res.json(rows.map((r) => {
      const iAmBuyer = r.buyer_id === me;
      return {
        roomId: r.id,
        productId: r.product_id,
        productTitle: r.product_title,
        productThumbnail: r.thumbnail_url,
        productPrice: r.price,
        productStatus: r.product_status,
        // 상대방 = 내가 구매자면 판매자, 아니면 구매자
        partner: iAmBuyer
          ? { id: r.seller_id, nickname: r.seller_nick, avatarUrl: r.seller_avatar }
          : { id: r.buyer_id, nickname: r.buyer_nick, avatarUrl: r.buyer_avatar },
        lastMessage: r.last_image ? '(사진)' : r.last_content,
        lastAt: r.last_at,
        unread: Number(r.unread) || 0,
      };
    }));
  } catch (e) {
    res.status(500).json({ error: '채팅방 목록 실패', detail: e.message });
  }
});

// POST /api/chat/rooms  방 만들기(없으면 생성, 있으면 그대로) — 구매자 = 나
//   body: { productId }
router.post('/rooms', async (req, res) => {
  try {
    const me = req.user.id;
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId가 필요해요' });

    const [prod] = await pool.query(
      'SELECT id, seller_id FROM product WHERE id = ? AND deleted_at IS NULL',
      [productId]
    );
    if (prod.length === 0) return res.status(404).json({ error: '상품을 찾을 수 없어요' });
    const sellerId = prod[0].seller_id;
    if (sellerId === me) return res.status(400).json({ error: '내 상품에는 채팅할 수 없어요' });

    // 이미 있으면 재사용 (uq_room: product_id + buyer_id)
    const [exist] = await pool.query(
      'SELECT id FROM chat_room WHERE product_id = ? AND buyer_id = ?',
      [productId, me]
    );
    if (exist.length > 0) return res.json({ roomId: exist[0].id, created: false });

    const [result] = await pool.query(
      'INSERT INTO chat_room (product_id, buyer_id, seller_id) VALUES (?, ?, ?)',
      [productId, me, sellerId]
    );
    res.status(201).json({ roomId: result.insertId, created: true });
  } catch (e) {
    res.status(500).json({ error: '채팅방 생성 실패', detail: e.message });
  }
});

// 참여자 검증 — 방에 속한 사람만 접근. { room } 또는 { error }
async function loadRoomForMember(roomId, memberId) {
  const [rows] = await pool.query('SELECT * FROM chat_room WHERE id = ?', [roomId]);
  if (rows.length === 0) return { error: 404 };
  const room = rows[0];
  if (room.buyer_id !== memberId && room.seller_id !== memberId) return { error: 403 };
  return { room };
}

// GET /api/chat/rooms/:roomId/messages  메시지 내역 (+ 상대 메시지 읽음 처리)
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const me = req.user.id;
    const { room, error } = await loadRoomForMember(req.params.roomId, me);
    if (error === 404) return res.status(404).json({ error: '채팅방을 찾을 수 없어요' });
    if (error === 403) return res.status(403).json({ error: '참여 중인 채팅방이 아니에요' });

    // 상대가 보낸 안읽은 메시지를 읽음 처리
    await pool.query(
      'UPDATE chat_message SET read_at = NOW() WHERE room_id = ? AND sender_id <> ? AND read_at IS NULL',
      [room.id, me]
    );

    const [msgs] = await pool.query(
      `SELECT id, sender_id, content, image_url, emoticon, read_at, created_at
         FROM chat_message WHERE room_id = ? ORDER BY id`,
      [room.id]
    );
    res.json(msgs.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      mine: m.sender_id === me,
      content: m.content,
      imageUrl: m.image_url,
      emoticon: m.emoticon,
      readAt: m.read_at,
      createdAt: m.created_at,
    })));
  } catch (e) {
    res.status(500).json({ error: '메시지 조회 실패', detail: e.message });
  }
});

export default router;
