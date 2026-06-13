// 서버 시작점 = workspace05의 AdminApplication.java.
// Express(REST) + Socket.io(실시간 채팅)를 같은 HTTP 서버에 얹음.
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';

import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import favoritesRouter from './routes/favorites.js';
import storesRouter from './routes/stores.js';
import tradesRouter from './routes/trades.js';
import chatRouter from './routes/chat.js';
import uploadsRouter from './routes/uploads.js';
import { initSocket } from './socket.js';

const app = express();

// CORS — CORS_ORIGIN 있으면 그 도메인만, 없으면(개발) 전부 허용
const allowOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true;
app.use(cors({ origin: allowOrigins }));
app.use(express.json());

// 업로드된 이미지 정적 제공 (상품/채팅 사진)
app.use('/uploads/img', express.static(path.resolve('uploads', 'img')));

// 상태 확인 (DB 없이도 동작)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'FAIRY API 살아있어요 🧚' });
});

// 라우터 연결 = web/controller 등록
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/stores', storesRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/uploads', uploadsRouter);

// Express를 http 서버로 감싸고 Socket.io 붙임 (같은 포트 공유)
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ FAIRY API 실행 중: http://localhost:${PORT}`);
  console.log(`   상태확인: http://localhost:${PORT}/api/health`);
});
