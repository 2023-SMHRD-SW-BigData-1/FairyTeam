// 상품 라우터 — 목록/상세(공개) + 등록/수정/상태변경/삭제(판매자 본인만).
import express from 'express';
import { pool } from '../db.js';
import { authRequired, authOptional } from '../middleware/auth.js';

const router = express.Router();

// 주어진 카테고리 코드 + 모든 하위(중·소) 코드 — 대분류로 필터하면 그 아래 전부 포함.
async function descendantCodes(code) {
  const [rows] = await pool.query('SELECT code, parent_code FROM category');
  const children = new Map();
  for (const r of rows) {
    const k = r.parent_code || '';
    if (!children.has(k)) children.set(k, []);
    children.get(k).push(r.code);
  }
  const out = [];
  const stack = [code];
  while (stack.length) {
    const c = stack.pop();
    out.push(c);
    for (const ch of (children.get(c) || [])) stack.push(ch);
  }
  return out;
}

// DB 행 → 화면용 상품 객체 (목록용 요약)
function shapeListItem(p) {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    status: p.status,
    thumbnailUrl: p.thumbnail_url,
    categoryCode: p.category_code,
    regionName: p.region_name,
    sellerNickname: p.seller_nickname,
    favCount: Number(p.fav_count) || 0,
    viewCount: p.view_count,
    isFavorited: !!Number(p.is_favorited),
    createdAt: p.created_at,
  };
}

// GET /api/products?category=100&q=키워드&sort=latest|price_asc|price_desc&page=1&size=20
// 비로그인도 조회 가능. 로그인 시 isFavorited 채워줌.
router.get('/', authOptional, async (req, res) => {
  try {
    const { category, q, sort = 'latest' } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20));
    const offset = (page - 1) * size;
    const me = req.user?.id || 0;

    const where = ['p.deleted_at IS NULL'];
    const params = [me]; // is_favorited 서브쿼리용
    if (category) {
      const codes = await descendantCodes(category); // 대→중→소 전부 포함
      where.push('p.category_code IN (?)');
      params.push(codes);
    }
    if (q) { where.push('p.title LIKE ?'); params.push(`%${q}%`); }

    const orderBy =
      sort === 'price_asc' ? 'p.price ASC' :
      sort === 'price_desc' ? 'p.price DESC' :
      'p.created_at DESC, p.id DESC';

    const sql = `
      SELECT p.*, m.nickname AS seller_nickname,
             (SELECT COUNT(*) FROM favorite f WHERE f.product_id = p.id) AS fav_count,
             EXISTS(SELECT 1 FROM favorite f2 WHERE f2.product_id = p.id AND f2.member_id = ?) AS is_favorited
        FROM product p
        JOIN member m ON m.id = p.seller_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, size, offset]);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM product p WHERE ${where.join(' AND ')}`,
      params.slice(1) // me 제외
    );

    res.json({ items: rows.map(shapeListItem), page, size, total });
  } catch (e) {
    res.status(500).json({ error: '상품 목록 조회 실패', detail: e.message });
  }
});

// GET /api/products/:id  상세 (조회수 +1, 이미지·판매자·찜여부 포함)
router.get('/:id', authOptional, async (req, res) => {
  try {
    const me = req.user?.id || 0;
    await pool.query('UPDATE product SET view_count = view_count + 1 WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    const [rows] = await pool.query(
      `SELECT p.*, m.nickname AS seller_nickname, m.avatar_url AS seller_avatar,
              m.region_name AS seller_region, c.name AS category_name,
              (SELECT COUNT(*) FROM favorite f WHERE f.product_id = p.id) AS fav_count,
              EXISTS(SELECT 1 FROM favorite f2 WHERE f2.product_id = p.id AND f2.member_id = ?) AS is_favorited
         FROM product p
         JOIN member m ON m.id = p.seller_id
         LEFT JOIN category c ON c.code = p.category_code
        WHERE p.id = ? AND p.deleted_at IS NULL`,
      [me, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '상품을 찾을 수 없어요' });
    const p = rows[0];

    const [images] = await pool.query(
      'SELECT url, sort_order FROM product_image WHERE product_id = ? ORDER BY sort_order',
      [p.id]
    );

    res.json({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      isNegotiable: !!p.is_negotiable,
      conditionType: p.condition_type,
      exchangeable: !!p.exchangeable,
      quantity: p.quantity,
      status: p.status,
      thumbnailUrl: p.thumbnail_url,
      categoryCode: p.category_code,
      categoryName: p.category_name,
      regionName: p.region_name,
      lat: p.lat,
      lng: p.lng,
      viewCount: p.view_count,
      favCount: Number(p.fav_count) || 0,
      isFavorited: !!Number(p.is_favorited),
      createdAt: p.created_at,
      images: images.map((i) => i.url),
      seller: {
        id: p.seller_id,
        nickname: p.seller_nickname,
        avatarUrl: p.seller_avatar,
        regionName: p.seller_region,
      },
      isMine: me === p.seller_id,
    });
  } catch (e) {
    res.status(500).json({ error: '상품 조회 실패', detail: e.message });
  }
});

// POST /api/products  등록 (로그인 필수, 등록자 = 판매자)
router.post('/', authRequired, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { title, description, price, categoryCode, isNegotiable,
            conditionType, exchangeable, quantity,
            regionName, lat, lng, images = [] } = req.body || {};
    if (!title || !categoryCode) {
      return res.status(400).json({ error: '제목과 카테고리는 필수예요' });
    }
    const priceNum = Number(price) || 0;
    const thumb = images[0] || null;

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO product
         (seller_id, category_code, title, description, price, is_negotiable,
          condition_type, exchangeable, quantity,
          thumbnail_url, region_name, lat, lng, reg_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, categoryCode, title, description || null, priceNum,
       isNegotiable ? 1 : 0,
       conditionType === 'NEW' ? 'NEW' : 'USED', exchangeable ? 1 : 0, Number(quantity) || 1,
       thumb, regionName || null, lat || null, lng || null, req.user.email]
    );
    const productId = result.insertId;

    // 이미지 여러 장 저장 (정렬순)
    for (let i = 0; i < images.length; i++) {
      await conn.query(
        'INSERT INTO product_image (product_id, url, sort_order) VALUES (?, ?, ?)',
        [productId, images[i], i]
      );
    }
    await conn.commit();
    res.status(201).json({ id: productId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: '상품 등록 실패', detail: e.message });
  } finally {
    conn.release();
  }
});

// 소유자 검증 헬퍼 — 없으면 404, 남의 것이면 403
async function loadOwned(productId, memberId) {
  const [rows] = await pool.query(
    'SELECT * FROM product WHERE id = ? AND deleted_at IS NULL',
    [productId]
  );
  if (rows.length === 0) return { error: 404 };
  if (rows[0].seller_id !== memberId) return { error: 403 };
  return { product: rows[0] };
}

// PATCH /api/products/:id  수정 (제목/설명/가격/상태/카테고리/위치)
router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { error } = await loadOwned(req.params.id, req.user.id);
    if (error === 404) return res.status(404).json({ error: '상품을 찾을 수 없어요' });
    if (error === 403) return res.status(403).json({ error: '본인 상품만 수정할 수 있어요' });

    const { title, description, price, status, categoryCode, isNegotiable,
            conditionType, exchangeable, quantity, regionName, lat, lng } = req.body || {};
    if (status && !['ON_SALE', 'RESERVED', 'SOLD'].includes(status)) {
      return res.status(400).json({ error: '상태값이 올바르지 않아요' });
    }

    await pool.query(
      `UPDATE product SET
         title          = COALESCE(?, title),
         description    = COALESCE(?, description),
         price          = COALESCE(?, price),
         status         = COALESCE(?, status),
         category_code  = COALESCE(?, category_code),
         is_negotiable  = COALESCE(?, is_negotiable),
         condition_type = COALESCE(?, condition_type),
         exchangeable   = COALESCE(?, exchangeable),
         quantity       = COALESCE(?, quantity),
         region_name    = COALESCE(?, region_name),
         lat            = COALESCE(?, lat),
         lng            = COALESCE(?, lng),
         update_id      = ?
       WHERE id = ?`,
      [title ?? null, description ?? null, price ?? null, status ?? null, categoryCode ?? null,
       isNegotiable === undefined ? null : (isNegotiable ? 1 : 0),
       conditionType ?? null,
       exchangeable === undefined ? null : (exchangeable ? 1 : 0),
       quantity ?? null,
       regionName ?? null, lat ?? null, lng ?? null, req.user.email, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '상품 수정 실패', detail: e.message });
  }
});

// DELETE /api/products/:id  소프트 삭제 (기록 보존)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const { error } = await loadOwned(req.params.id, req.user.id);
    if (error === 404) return res.status(404).json({ error: '상품을 찾을 수 없어요' });
    if (error === 403) return res.status(403).json({ error: '본인 상품만 삭제할 수 있어요' });

    await pool.query('UPDATE product SET deleted_at = NOW(), update_id = ? WHERE id = ?',
      [req.user.email, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: '상품 삭제 실패', detail: e.message });
  }
});

export default router;
