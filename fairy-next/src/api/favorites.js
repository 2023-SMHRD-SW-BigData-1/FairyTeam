// 찜 API.
import { apiGet, apiPost, apiDelete } from './client';

export function listFavorites() { return apiGet('/api/favorites'); }
export function addFavorite(productId) { return apiPost(`/api/favorites/${productId}`); }
export function removeFavorite(productId) { return apiDelete(`/api/favorites/${productId}`); }

// 찜 토글 — 현재 상태에 따라 추가/해제. 새 상태(boolean) 반환.
export async function toggleFavorite(productId, isFavorited) {
  if (isFavorited) { await removeFavorite(productId); return false; }
  await addFavorite(productId); return true;
}
