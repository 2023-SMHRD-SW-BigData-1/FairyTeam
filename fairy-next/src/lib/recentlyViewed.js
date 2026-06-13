// 최근 본 상품 — localStorage에 최대 8개 저장 (원본 우측 사이드바 '최근본상품').
const KEY = 'fairy_recent';
const MAX = 8;

export function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

// 상품 상세를 볼 때 호출. 최신이 앞으로 오고 중복 제거.
export function addRecentlyViewed(p) {
  if (!p?.id) return;
  const item = { id: p.id, title: p.title, price: p.price, thumbnailUrl: p.thumbnailUrl };
  const list = getRecentlyViewed().filter((x) => x.id !== p.id);
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
