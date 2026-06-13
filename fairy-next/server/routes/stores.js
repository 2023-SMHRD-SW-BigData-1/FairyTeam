// 편의점 라우터 — 위탁 픽업 장소 조회/검색 (공개).
// 카카오맵 좌표 기반: 내 위치에서 가까운 / 두 사람 중간 지점에서 가까운 편의점.
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// 두 좌표 사이 거리(m) — Haversine. (편의점 표 작아서 JS로 계산)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function shape(s, distance) {
  return {
    id: s.id, brand: s.brand, name: s.name, address: s.address,
    lat: Number(s.lat), lng: Number(s.lng),
    ...(distance != null ? { distance } : {}),
  };
}

// GET /api/stores?lat=&lng=&limit=   가까운 편의점 (좌표 없으면 전체)
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const [rows] = await pool.query('SELECT * FROM store WHERE is_partner = 1');

    if (lat && lng) {
      const myLat = Number(lat), myLng = Number(lng);
      const sorted = rows
        .map((s) => shape(s, distanceMeters(myLat, myLng, Number(s.lat), Number(s.lng))))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
      return res.json(sorted);
    }
    res.json(rows.slice(0, limit).map((s) => shape(s)));
  } catch (e) {
    res.status(500).json({ error: '편의점 조회 실패', detail: e.message });
  }
});

// GET /api/stores/midpoint?lat1=&lng1=&lat2=&lng2=&limit=
//   구매자·판매자 두 좌표의 중간 지점에서 가까운 편의점 (당신편 핵심 기능)
router.get('/midpoint', async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({ error: '두 좌표(lat1,lng1,lat2,lng2)가 필요해요' });
    }
    const midLat = (Number(lat1) + Number(lat2)) / 2;
    const midLng = (Number(lng1) + Number(lng2)) / 2;
    const limit = Math.min(50, Number(req.query.limit) || 10);

    const [rows] = await pool.query('SELECT * FROM store WHERE is_partner = 1');
    const sorted = rows
      .map((s) => shape(s, distanceMeters(midLat, midLng, Number(s.lat), Number(s.lng))))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    res.json({ midpoint: { lat: midLat, lng: midLng }, stores: sorted });
  } catch (e) {
    res.status(500).json({ error: '중간지점 편의점 조회 실패', detail: e.message });
  }
});

export default router;
