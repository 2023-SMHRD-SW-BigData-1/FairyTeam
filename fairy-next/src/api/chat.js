// 채팅 API (REST 부분 — 방 목록/생성, 메시지 내역). 실시간은 lib/socket.js.
import { apiGet, apiPost } from './client';

export function listRooms() { return apiGet('/api/chat/rooms'); }
export function openRoom(productId) { return apiPost('/api/chat/rooms', { productId }); } // { roomId }
export function getMessages(roomId) { return apiGet(`/api/chat/rooms/${roomId}/messages`); }
