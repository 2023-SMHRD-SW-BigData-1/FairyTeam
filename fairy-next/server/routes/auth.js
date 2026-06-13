// 인증 라우터 — 회원가입/로그인/내정보. 비번은 BCrypt 해시(평문 저장 금지).
import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, authRequired } from '../middleware/auth.js';

const router = express.Router();

// member 행 → 화면에 줘도 되는 안전한 형태 (비번 해시 제거)
function toSafeUser(m) {
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    nickname: m.nickname,
    phone: m.phone,
    avatarUrl: m.avatar_url,
    regionName: m.region_name,
    lat: m.lat,
    lng: m.lng,
    role: m.role,
  };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, nickname, phone, birthDate } = req.body || {};
    if (!email || !password || !name || !nickname) {
      return res.status(400).json({ error: '이메일·비밀번호·이름·닉네임은 필수예요' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 해요' });
    }

    // 이메일/닉네임 중복 검사
    const [dup] = await pool.query(
      'SELECT email, nickname FROM member WHERE (email = ? OR nickname = ?) AND deleted_at IS NULL',
      [email, nickname]
    );
    if (dup.some((r) => r.email === email)) {
      return res.status(409).json({ error: '이미 가입된 이메일이에요' });
    }
    if (dup.some((r) => r.nickname === nickname)) {
      return res.status(409).json({ error: '이미 사용 중인 닉네임이에요' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      `INSERT INTO member (email, password_hash, name, nickname, phone, birth_date, role, reg_id)
       VALUES (?, ?, ?, ?, ?, ?, 'MEMBER', ?)`,
      [email, hash, name, nickname, phone || null, birthDate || null, email]
    );

    const [rows] = await pool.query('SELECT * FROM member WHERE id = ?', [result.insertId]);
    const user = toSafeUser(rows[0]);
    res.status(201).json({ token: signToken(rows[0]), user });
  } catch (e) {
    res.status(500).json({ error: '회원가입 실패', detail: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM member WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    const member = rows[0];

    // 이메일이 없거나 비번이 틀리면 → 같은 메시지 (계정 존재 여부 노출 방지)
    const ok = member && bcrypt.compareSync(password, member.password_hash);
    if (!ok) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않아요' });
    }
    if (member.status !== 'ACTIVE') {
      return res.status(403).json({ error: '이용할 수 없는 계정이에요' });
    }

    res.json({ token: signToken(member), user: toSafeUser(member) });
  } catch (e) {
    res.status(500).json({ error: '로그인 실패', detail: e.message });
  }
});

// GET /api/auth/me  (토큰으로 로그인 상태 복원)
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM member WHERE id = ? AND deleted_at IS NULL',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: '계정을 찾을 수 없어요' });
    res.json({ user: toSafeUser(rows[0]) });
  } catch (e) {
    res.status(500).json({ error: '조회 실패', detail: e.message });
  }
});

// PATCH /api/auth/me  (내 정보 수정 — 닉네임/전화/동네/아바타)
router.patch('/me', authRequired, async (req, res) => {
  try {
    const { nickname, phone, regionName, lat, lng, avatarUrl } = req.body || {};

    if (nickname) {
      const [dup] = await pool.query(
        'SELECT id FROM member WHERE nickname = ? AND id <> ? AND deleted_at IS NULL',
        [nickname, req.user.id]
      );
      if (dup.length > 0) return res.status(409).json({ error: '이미 사용 중인 닉네임이에요' });
    }

    await pool.query(
      `UPDATE member SET
         nickname    = COALESCE(?, nickname),
         phone       = COALESCE(?, phone),
         region_name = COALESCE(?, region_name),
         lat         = COALESCE(?, lat),
         lng         = COALESCE(?, lng),
         avatar_url  = COALESCE(?, avatar_url),
         update_id   = ?
       WHERE id = ?`,
      [nickname ?? null, phone ?? null, regionName ?? null, lat ?? null, lng ?? null,
       avatarUrl ?? null, req.user.email, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM member WHERE id = ?', [req.user.id]);
    res.json({ user: toSafeUser(rows[0]) });
  } catch (e) {
    res.status(500).json({ error: '수정 실패', detail: e.message });
  }
});

export default router;
