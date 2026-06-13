# FAIRY (리빌드)

옛 SMHRD 팀프로젝트 **Fairy(중고거래 마켓)** 를 현대적 구조로 새로 짓는 저장소.
ADHOUSE와 동일한 컨벤션(레이어 분리 · JWT · BCrypt · 커넥션풀 · 소프트삭제 · 감사컬럼).

## 스택
- **프론트**: React 19 + Vite + React Router 7  *(예정 — M2)*
- **백엔드**: Express + mysql2 + JWT + BCrypt + Socket.io  ✅ M1 완료
- **DB**: MariaDB / MySQL 8 (utf8mb4)

## 옛 Fairy 대비 달라진 점
| 옛 Fairy | 리빌드 |
|---|---|
| 비밀번호 **평문 저장** | **BCrypt 해시** |
| DB 비번·API주소 **코드 하드코딩** | **.env 환경변수** |
| 거대 컴포넌트 복붙(622줄) | 레이어 분리 + 재사용 |
| 죽은 코드(garbage/Hold) | 없음 |
| 소유자 검증 없음 | 라우트마다 본인 확인 |

## 백엔드 실행
```bash
cd server
npm install
cp .env.example .env      # DB 접속정보·JWT_SECRET 채우기

# DB 준비 (DBeaver 또는 mysql CLI에서)
#   db/schema.sql 실행 → db/seed.sql 실행
# 샘플 계정: seller@fairy.com / buyer@fairy.com / admin@fairy.com  (비번 전부 test1234)

npm run dev               # http://localhost:4000
```
상태확인: `GET http://localhost:4000/api/health`

## API 요약
| 분류 | 엔드포인트 |
|---|---|
| 인증 | `POST /api/auth/signup` · `POST /api/auth/login` · `GET/PATCH /api/auth/me` |
| 카테고리 | `GET /api/categories` |
| 상품 | `GET /api/products` (검색·필터·정렬) · `GET /api/products/:id` · `POST` · `PATCH /:id` · `DELETE /:id` |
| 찜 | `GET /api/favorites` · `POST /api/favorites/:productId` · `DELETE /:productId` |
| 채팅 | `GET /api/chat/rooms` · `POST /api/chat/rooms` · `GET /api/chat/rooms/:id/messages` |
| 업로드 | `POST /api/uploads` (이미지 최대 5장) |
| 실시간 | Socket.io: `room:join` · `message:send` · `message:new` · `typing` |

## 진행 상황
- ✅ **M1 백엔드 토대** — DB설계 + 인증 + 상품CRUD + 찜 + 채팅(REST+소켓) + 업로드
- ⬜ **M2 프론트엔드** — Vite 스캐폴드 + 인증/상품/찜/채팅 화면
- ⬜ **M3 지도** — 카카오맵 동네 기반 거래(키 필요)
- ⬜ **M4 마무리** — 검증·배포(Vercel + Render)
