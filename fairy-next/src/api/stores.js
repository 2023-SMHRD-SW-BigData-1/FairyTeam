// 편의점 API.
import { apiGet } from './client';

// 가까운 편의점 — params: { lat, lng, limit }. 좌표 없으면 전체.
export function listStores(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString();
  return apiGet(`/api/stores${qs ? `?${qs}` : ''}`);
}

// 두 좌표 중간 지점에서 가까운 편의점 (당신편 핵심) → { midpoint, stores }
export function midpointStores(lat1, lng1, lat2, lng2, limit = 10) {
  return apiGet(`/api/stores/midpoint?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}&limit=${limit}`);
}
