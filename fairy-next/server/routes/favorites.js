// 찜 라우터 — 내 찜 목록 + 추가/삭제 (전부 로그인 필수).
import express from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();
router.use(authRequired);

// GET /api/favorites  내가 찜한 상품 목록 (최신 찜 순)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.price, p.status, p.thumbnail_url, p.category_code,
              p.region_name, m.nickname AS seller_nickname, f.created_at AS fav_at
         FROM favorite f
         JOIN product p ON p.id = f.product_id AND p.deleted_at IS NULL
         JOIN member  m ON m.id = p.seller_id
        WHERE f.member_id = ?
        ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map((p) => ({
      id: p.id, title: p.title, price: p.price, status: p.status,
      thumbnailUrl: p.thumbnail_url, categoryCode: p.category_code,
      regionName: p.region_name, sellerNickname: p.seller_nickname,
      isFavorited: true,
    })));
  } catch (e) {
    res.status(500).json({ error: '찜 목록 조회 실패', detail: e.message });
  }
});

// POST /api/favorites/:productId  찜 추가 (이미 있으면 무시 = 멱등)
router.post('/:productId', async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO favorite (member_id, product_id) VALUES (?, ?)',
      [req.user.id, req.params.productId]
    );
    res.status(201).json({ ok: true, isFavorited: true });
  } catch (e) {
    res.status(500).json({ error: '찜 추가 실패', detail: e.message });
  }
});

// DELETE /api/favorites/:productId  찜 해제
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorite WHERE member_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ ok: true, isFavorited: false });
  } catch (e) {
    res.status(500).json({ error: '찜 해제 실패', detail: e.message });
  }
});

export default router;
