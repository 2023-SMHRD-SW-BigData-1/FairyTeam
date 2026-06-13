// 위탁거래 라우터 — 당신편의 핵심 흐름 (전부 로그인 필수).
//   구매자가 거래 요청(편의점 선택) → 판매자 위탁(맡김) → 구매자 픽업(완료).
import express from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();
router.use(authRequired);

const STATUS_LABEL = {
  REQUESTED: '거래 약속', CONSIGNED: '위탁 완료(픽업 대기)', DONE: '거래 완료', CANCELED: '취소됨',
};

// 거래 1건을 화면용으로 조립 (상품·편의점·상대방 포함)
async function fetchTrade(id, me) {
  const [rows] = await pool.query(
    `SELECT t.*, p.title AS product_title, p.thumbnail_url,
            s.brand AS store_brand, s.name AS store_name, s.address AS store_address,
            s.lat AS store_lat, s.lng AS store_lng,
            sm.nickname AS seller_nick, bm.nickname AS buyer_nick
       FROM trade t
       JOIN product p ON p.id = t.product_id
       JOIN store   s ON s.id = t.store_id
       JOIN member sm ON sm.id = t.seller_id
       JOIN member bm ON bm.id = t.buyer_id
      WHERE t.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const t = rows[0];
  if (t.seller_id !== me && t.buyer_id !== me) return { forbidden: true };
  const iAmSeller = t.seller_id === me;
  return {
    id: t.id,
    productId: t.product_id,
    productTitle: t.product_title,
    productThumbnail: t.thumbnail_url,
    price: t.price,
    status: t.status,
    statusLabel: STATUS_LABEL[t.status],
    iAmSeller,
    role: iAmSeller ? 'SELLER' : 'BUYER',
    partnerNickname: iAmSeller ? t.buyer_nick : t.seller_nick,
    store: {
      brand: t.store_brand, name: t.store_name, address: t.store_address,
      lat: Number(t.store_lat), lng: Number(t.store_lng),
    },
    requestedAt: t.requested_at,
    consignedAt: t.consigned_at,
    doneAt: t.done_at,
  };
}

// GET /api/trades  내 거래 목록 (구매/판매 모두)
router.get('/', async (req, res) => {
  try {
    const me = req.user.id;
    const [rows] = await pool.query(
      'SELECT id FROM trade WHERE seller_id = ? OR buyer_id = ? ORDER BY id DESC',
      [me, me]
    );
    const list = [];
    for (const r of rows) list.push(await fetchTrade(r.id, me));
    res.json(list.filter((t) => t && !t.forbidden));
  } catch (e) {
    res.status(500).json({ error: '거래 목록 실패', detail: e.message });
  }
});

// GET /api/trades/:id
router.get('/:id', async (req, res) => {
  try {
    const t = await fetchTrade(req.params.id, req.user.id);
    if (!t) return res.status(404).json({ error: '거래를 찾을 수 없어요' });
    if (t.forbidden) return res.status(403).json({ error: '참여한 거래가 아니에요' });
    res.json(t);
  } catch (e) {
    res.status(500).json({ error: '거래 조회 실패', detail: e.message });
  }
});

// POST /api/trades  거래 요청 — 구매자가 편의점 골라 약속 (product → RESERVED)
//   body: { productId, storeId }
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const me = req.user.id;
    const { productId, storeId } = req.body || {};
    if (!productId || !storeId) return res.status(400).json({ error: '상품과 편의점을 선택해 주세요' });

    await conn.beginTransaction();
    const [prods] = await conn.query(
      'SELECT * FROM product WHERE id = ? AND deleted_at IS NULL FOR UPDATE', [productId]
    );
    if (prods.length === 0) { await conn.rollback(); return res.status(404).json({ error: '상품을 찾을 수 없어요' }); }
    const p = prods[0];
    if (p.seller_id === me) { await conn.rollback(); return res.status(400).json({ error: '내 상품은 거래할 수 없어요' }); }
    if (p.status === 'SOLD') { await conn.rollback(); return res.status(409).json({ error: '이미 거래완료된 상품이에요' }); }

    const [stores] = await conn.query('SELECT id FROM store WHERE id = ?', [storeId]);
    if (stores.length === 0) { await conn.rollback(); return res.status(404).json({ error: '편의점을 찾을 수 없어요' }); }

    // 진행 중(취소·완료 아님) 거래가 이미 있으면 중복 방지
    const [dup] = await conn.query(
      "SELECT id FROM trade WHERE product_id = ? AND buyer_id = ? AND status IN ('REQUESTED','CONSIGNED')",
      [productId, me]
    );
    if (dup.length > 0) { await conn.rollback(); return res.status(409).json({ error: '이미 진행 중인 거래가 있어요' }); }

    const [result] = await conn.query(
      'INSERT INTO trade (product_id, seller_id, buyer_id, store_id, price) VALUES (?, ?, ?, ?, ?)',
      [productId, p.seller_id, me, storeId, p.price]
    );
    await conn.query("UPDATE product SET status = 'RESERVED' WHERE id = ?", [productId]);
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: '거래 요청 실패', detail: e.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/trades/:id  상태 전이 (권한·순서 검증)
//   body: { action: 'consign' | 'pickup' | 'cancel' }
router.patch('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const me = req.user.id;
    const { action } = req.body || {};
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM trade WHERE id = ? FOR UPDATE', [req.params.id]);
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ error: '거래를 찾을 수 없어요' }); }
    const t = rows[0];
    if (t.seller_id !== me && t.buyer_id !== me) { await conn.rollback(); return res.status(403).json({ error: '참여한 거래가 아니에요' }); }
    const isSeller = t.seller_id === me;

    if (action === 'consign') {
      // 판매자가 편의점에 맡김: REQUESTED → CONSIGNED
      if (!isSeller) { await conn.rollback(); return res.status(403).json({ error: '판매자만 위탁할 수 있어요' }); }
      if (t.status !== 'REQUESTED') { await conn.rollback(); return res.status(409).json({ error: '위탁 가능한 상태가 아니에요' }); }
      await conn.query("UPDATE trade SET status = 'CONSIGNED', consigned_at = NOW() WHERE id = ?", [t.id]);
    } else if (action === 'pickup') {
      // 구매자가 픽업: CONSIGNED → DONE, 상품 SOLD
      if (isSeller) { await conn.rollback(); return res.status(403).json({ error: '구매자만 픽업할 수 있어요' }); }
      if (t.status !== 'CONSIGNED') { await conn.rollback(); return res.status(409).json({ error: '픽업 가능한 상태가 아니에요' }); }
      await conn.query("UPDATE trade SET status = 'DONE', done_at = NOW() WHERE id = ?", [t.id]);
      await conn.query("UPDATE product SET status = 'SOLD' WHERE id = ?", [t.product_id]);
    } else if (action === 'cancel') {
      // 양측 취소 가능 (완료 전): → CANCELED, 상품 ON_SALE 복귀
      if (t.status === 'DONE' || t.status === 'CANCELED') { await conn.rollback(); return res.status(409).json({ error: '취소할 수 없는 상태예요' }); }
      await conn.query("UPDATE trade SET status = 'CANCELED' WHERE id = ?", [t.id]);
      await conn.query("UPDATE product SET status = 'ON_SALE' WHERE id = ?", [t.product_id]);
    } else {
      await conn.rollback();
      return res.status(400).json({ error: "action은 consign·pickup·cancel 중 하나여야 해요" });
    }

    await conn.commit();
    res.json(await fetchTrade(t.id, me));
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: '거래 상태 변경 실패', detail: e.message });
  } finally {
    conn.release();
  }
});

export default router;
