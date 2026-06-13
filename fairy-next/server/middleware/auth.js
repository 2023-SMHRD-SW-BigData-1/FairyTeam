// 인증/인가 미들웨어 = workspace05의 JwtFilter + 역할 접근제어.
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// 토큰 발급 (로그인/회원가입 성공 시) = JwtProvider.create
export function signToken(member) {
  return jwt.sign(
    { id: member.id, email: member.email, role: member.role, nickname: member.nickname },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 순수 검증 함수 — REST 미들웨어와 Socket 핸드셰이크가 함께 씀.
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET); // 실패 시 throw
}

// 로그인 필수: Authorization: Bearer <토큰> → req.user. 실패 시 401.
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '로그인이 필요해요' });
  try {
    req.user = verifyToken(token); // { id, email, role, nickname }
    next();
  } catch {
    return res.status(401).json({ error: '토큰이 유효하지 않아요' });
  }
}

// 로그인 선택: 토큰 있고 유효하면 req.user 채우고, 없으면 그냥 통과.
// (예: 상품 상세 — 비로그인도 보지만, 로그인이면 "내가 찜했는지" 표시)
export function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      /* 잘못된 토큰이면 비로그인 취급 */
    }
  }
  next();
}

// 특정 역할만 (예: requireRole('ADMIN')). authRequired 다음에 사용. 실패 시 403.
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '로그인이 필요해요' });
    if (req.user.role !== role) return res.status(403).json({ error: '권한이 없어요' });
    next();
  };
}
