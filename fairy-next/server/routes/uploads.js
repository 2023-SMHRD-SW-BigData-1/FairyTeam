// 이미지 업로드 라우터 — multer로 파일을 uploads/img 에 저장하고 공개 URL 반환.
// 상품 사진/채팅 사진/프로필에 공통으로 씀. 로그인 필수.
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

const UPLOAD_DIR = path.resolve('uploads', 'img');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // 파일명: 시각-원본확장자 (충돌 방지). req 시각은 multer 내부라 허용됨.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, base + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|gif|webp)/.test(file.mimetype);
    cb(ok ? null : new Error('이미지 파일만 올릴 수 있어요'), ok);
  },
});

// POST /api/uploads  (form-data: images[] 최대 5장)
router.post('/', authRequired, upload.array('images', 5), (req, res) => {
  const urls = (req.files || []).map((f) => `/uploads/img/${f.filename}`);
  res.status(201).json({ urls });
});

export default router;
