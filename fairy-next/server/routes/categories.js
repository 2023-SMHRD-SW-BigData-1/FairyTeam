// 카테고리 라우터 — 대분류 목록 + 대/중/소 트리 (공개).
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/categories  대분류만 (홈 칩·헤더용)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT code, name, emoji FROM category WHERE depth = 1 AND is_active = 1 ORDER BY sort_order'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: '카테고리 조회 실패', detail: e.message });
  }
});

// GET /api/categories/tree  대>중>소 중첩 트리 (등록 폼 캐스케이더용)
router.get('/tree', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT code, name, emoji, parent_code, depth FROM category WHERE is_active = 1 ORDER BY sort_order'
    );
    const byParent = new Map(); // parent_code → children[]
    for (const r of rows) {
      const key = r.parent_code || 'ROOT';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(r);
    }
    const build = (code) => (byParent.get(code) || []).map((c) => ({
      code: c.code, name: c.name, emoji: c.emoji, children: build(c.code),
    }));
    res.json(build('ROOT'));
  } catch (e) {
    res.status(500).json({ error: '카테고리 트리 조회 실패', detail: e.message });
  }
});

export default router;
