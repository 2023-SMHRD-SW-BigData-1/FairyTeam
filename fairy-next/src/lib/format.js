// 화면 표시용 포맷 헬퍼.

// 가격: 0 → '나눔', 그 외 → '12,000원'
export function formatPrice(won) {
  if (!won || won === 0) return '나눔';
  return `${Number(won).toLocaleString('ko-KR')}원`;
}

// 상태 한글 라벨 + 칩 클래스
export const STATUS_LABEL = { ON_SALE: '판매중', RESERVED: '예약중', SOLD: '거래완료' };
export function statusChipClass(status) {
  if (status === 'SOLD') return 'chip chip-sold';
  if (status === 'RESERVED') return 'chip chip-reserved';
  return 'chip';
}

// 상대 시간: '방금 전' / 'N분 전' / 'N시간 전' / 'N일 전' / 날짜
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

// 거리: 980 → '980m', 1400 → '1.4km'
export function formatDistance(m) {
  if (m == null) return '';
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

// 채팅 시각: '오후 3:24'
export function timeOfDay(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}
